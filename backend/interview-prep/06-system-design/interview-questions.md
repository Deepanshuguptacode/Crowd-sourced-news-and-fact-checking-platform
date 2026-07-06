# Module 06: System Design Interview Questions

## Section A: Architecture Design

### Q1: Design a scalable comment system that supports millions of users.

**Answer:**

**High-Level Architecture:**
```
Client → CDN → Load Balancer → API Servers → Message Queue → Workers → Database
                                    ↓
                               Cache (Redis)
                                    ↓
                            Search Index (Elasticsearch)
```

**Key Components:**

1. **Write Path (Comment Creation):**
   ```javascript
   // Async write for high throughput
   POST /api/comments
     ↓
   Validate + Rate Limit
     ↓
   Publish to Kafka/Redis Queue
     ↓
   Return 202 Accepted immediately
     ↓
   Worker processes queue:
     - Store in database
     - Update cache
     - Index for search
     - Notify subscribers (WebSockets)
   ```

2. **Read Path:**
   ```javascript
   GET /api/posts/{id}/comments
     ↓
   Check Redis Cache
     ↓
   Cache Hit → Return immediately
   Cache Miss → Query DB → Cache → Return
   ```

3. **Database Schema:**
   ```javascript
   // Sharding strategy: by post_id
   // Comments table partitioned by time
   
   Comment {
     id: UUID,
     post_id: UUID (shard key),
     user_id: UUID,
     content: TEXT,
     parent_id: UUID,  // For nested comments
     created_at: TIMESTAMP,
     // Metadata
     upvotes: COUNTER,
     downvotes: COUNTER
   }
   ```

4. **Caching Strategy:**
   - Hot posts: Cache entire comment tree in Redis (TTL: 1 hour)
   - Individual comments: Cache by ID (TTL: 24 hours)
   - User comment counts: Cache counters

**Scaling Techniques:**
- Database sharding by post_id
- Read replicas for comment fetching
- CDN for static content
- WebSockets for real-time updates

---

### Q2: Design a real-time voting system (like Reddit upvotes).

**Answer:**

**Challenge:** High write volume, needs to be fast and consistent.

**Architecture:**
```
Vote Request
    ↓
API Gateway (Rate Limit)
    ↓
Write to Redis (Immediate response)
    ↓
Async Worker → Database (Eventual consistency)
    ↓
WebSocket/PubSub → Update all clients
```

**Implementation:**

```javascript
// Vote endpoint - minimal latency
async function vote(req, res) {
  const { postId, voteType } = req.body;  // voteType: 'up' | 'down'
  const userId = req.user.id;
  
  // 1. Check if already voted (Redis Set)
  const hasVoted = await redis.sismember(`post:${postId}:voters`, userId);
  if (hasVoted) {
    return res.status(409).json({ message: 'Already voted' });
  }
  
  // 2. Record vote in Redis (immediate)
  const pipeline = redis.pipeline();
  pipeline.sadd(`post:${postId}:voters`, userId);
  pipeline.incrby(`post:${postId}:${voteType}votes`, 1);
  pipeline.expire(`post:${postId}:voters`, 86400);  // 24hr TTL
  await pipeline.exec();
  
  // 3. Queue for database persistence
  await messageQueue.publish('votes', {
    postId, userId, voteType, timestamp: Date.now()
  });
  
  // 4. Broadcast update
  await pubsub.publish(`post:${postId}:votes`, {
    upvotes: await redis.get(`post:${postId}:upvotes`),
    downvotes: await redis.get(`post:${postId}:downvotes`)
  });
  
  res.json({ success: true });
}

// Background worker
async function processVoteQueue() {
  const votes = await messageQueue.consume('votes', 100);  // Batch of 100
  
  // Batch insert to database
  await Vote.insertMany(votes.map(v => ({
    postId: v.postId,
    userId: v.userId,
    type: v.voteType,
    createdAt: new Date(v.timestamp)
  })));
  
  // Update post aggregates
  const postUpdates = {};
  for (const vote of votes) {
    const key = `${vote.postId}:${vote.voteType}`;
    postUpdates[key] = (postUpdates[key] || 0) + 1;
  }
  
  for (const [key, count] of Object.entries(postUpdates)) {
    const [postId, type] = key.split(':');
    await Post.updateOne(
      { _id: postId },
      { $inc: { [`voteCounts.${type}`]: count } }
    );
  }
}
```

**Consistency Model:**
- Redis: Immediate (for real-time display)
- Database: Eventual (within seconds)
- If Redis fails: Can rebuild from database

---

### Q3: How would you design VoxVeritas for 10 million daily active users?

**Answer:**

**Architecture Evolution:**

**Current (Single Server):**
```
Frontend → Express → MongoDB + Pinecone + Gemini
```

**Scale (10M DAU):**
```
                                        ┌─────────────┐
User ──► CDN ──► API Gateway ──► Load Balancer ──► K8s Pods
                                        │
         ┌────────────┬──────────────┬─┴──────┬─────────────┐
         ▼            ▼              ▼        ▼             ▼
    MongoDB      PostgreSQL    Pinecone   Redis Cluster   Kafka
   (Sharded)    (Analytics)    (Vector)    (Cache)      (Events)
```

**Scaling Strategies:**

1. **Horizontal Pod Autoscaling:**
   - Express servers scale 10-100 pods based on CPU/memory
   - Stateless design enables easy scaling

2. **Database Sharding:**
   ```javascript
   // Shard by newsId for news-related data
   shardKey = newsId.hashCode() % numShards
   
   // For user data: shard by userId
   shardKey = userId.hashCode() % numShards
   ```

3. **Caching Layers:**
   - L1: In-memory (embedding cache, 2000 items)
   - L2: Redis (comment groups, 1 hour TTL)
   - L3: CDN (static assets, 24 hours)

4. **AI Service Optimization:**
   ```javascript
   // Before scaling:
   await llm.classify(comment);  // Synchronous, blocks
   
   // After scaling:
   await queue.publish('classify', comment);  // Async
   // Return immediately, worker processes in background
   ```

5. **Read Replicas:**
   - Write to primary MongoDB
   - Read from secondaries for GET requests
   - Accept eventual consistency for reads

---

### Q4: Design a rate limiting system that works across multiple servers.

**Answer:**

**Token Bucket Algorithm (Distributed):**

```javascript
// Using Redis for distributed state

async function rateLimitCheck(userId, route, maxRequests, windowSeconds) {
  const key = `ratelimit:${userId}:${route}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;
  
  const luaScript = `
    redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
    local current = redis.call('ZCARD', KEYS[1])
    if current < tonumber(ARGV[2]) then
      redis.call('ZADD', KEYS[1], ARGV[3], ARGV[3])
      redis.call('EXPIRE', KEYS[1], ARGV[4])
      return 1
    else
      return 0
    end
  `;
  
  const allowed = await redis.eval(
    luaScript,
    1,  // Number of keys
    key,
    windowStart,
    maxRequests,
    now,
    windowSeconds
  );
  
  return {
    allowed: allowed === 1,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - current - 1)
  };
}
```

**Redis Data Structure:**
```
Sorted Set: ratelimit:user123:/api/news
Scores: timestamps
Members: unique request IDs

ZREMRANGEBYSCORE 0, now-window  // Remove old entries
ZCARD                            // Count current entries
ZADD now, requestId             // Add new entry if under limit
```

**Alternative: Fixed Window**
```javascript
// Simpler but allows bursts at window boundaries
const key = `ratelimit:${userId}:${route}:${Math.floor(now / windowSeconds)}`;
const current = await redis.incr(key);
if (current === 1) await redis.expire(key, windowSeconds);
return current <= maxRequests;
```

---

## Section B: Database Design

### Q5: Design a news feed system (like VoxVeritas combined feed).

**Answer:**

**Feed Generation Approaches:**

**1. Fan-out on Write (Push Model):**
```javascript
// When news is posted:
async function postNews(newsData) {
  const news = await News.create(newsData);
  
  // Push to all followers' feeds
  const followers = await getFollowers(news.authorId);
  const feedEntries = followers.map(userId => ({
    userId,
    newsId: news._id,
    score: calculateScore(news),
    timestamp: news.createdAt
  }));
  
  await UserFeed.insertMany(feedEntries);
}

// Read is fast (pre-computed)
async function getFeed(userId, page) {
  return UserFeed.find({ userId })
    .sort({ score: -1 })
    .skip(page * 10)
    .limit(10)
    .populate('newsId');
}
```
**Pros:** Read is O(1) fast
**Cons:** Write is O(N) where N = followers

**2. Fan-out on Read (Pull Model):**
```javascript
// Read is computed on demand
async function getFeed(userId, page) {
  const following = await getFollowing(userId);
  
  return News.find({ authorId: { $in: following } })
    .sort({ createdAt: -1 })
    .skip(page * 10)
    .limit(10);
}
```
**Pros:** Write is O(1)
**Cons:** Read is O(N*logM) where N = following, M = their posts

**3. Hybrid (VoxVeritas approach):**
```javascript
// For normal users: Pull model (on-demand)
// For celebrity users (> 1M followers): Push model

async function getCombinedFeed(userId, page) {
  const limit = 10;
  const skip = page * limit;
  
  // Get user-uploaded news
  const userNews = await News.find()
    .sort({ uploadedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Get trending news (from different collection)
  const trendingNews = await TrendingNews.find()
    .sort({ scrapedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Merge and re-sort
  const combined = [...userNews, ...trendingNews]
    .sort((a, b) => new Date(b.uploadedAt || b.scrapedAt) - 
                     new Date(a.uploadedAt || a.scrapedAt))
    .slice(0, limit);
  
  return combined;
}
```

---

## Section C: Real-World Scenarios

### Q6: How do you handle sudden traffic spikes (e.g., viral news)?

**Answer:**

**Circuit Breaker Pattern:**
```javascript
class CircuitBreaker {
  constructor(threshold, timeout) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';  // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Usage for Gemini API
geminiBreaker = new CircuitBreaker(5, 60000);

try {
  const result = await geminiBreaker.execute(() => 
    llm.classify(comment)
  );
} catch {
  // Fallback to keyword matching
  return keywordFallback(comment);
}
```

**Auto-scaling:**
```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: voxveritas-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: voxveritas-api
  minReplicas: 3
  maxReplicas: 100
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

### Q7: Design a reliable notification system.

**Answer:**

```
Event → Queue → Worker → Provider (Email/SMS/Push)
              ↓
         Dead Letter Queue (after retries)
              ↓
         Alert ops team
```

```javascript
// Notification service
class NotificationService {
  async send(notification) {
    // 1. Store in database (for audit/retry)
    const record = await Notification.create({
      ...notification,
      status: 'pending',
      retryCount: 0
    });
    
    // 2. Publish to queue
    await queue.publish('notifications', {
      id: record._id,
      type: notification.type,
      recipient: notification.to,
      content: notification.content
    });
    
    return { id: record._id, status: 'queued' };
  }
}

// Worker
async function processNotifications() {
  const notifications = await queue.consume('notifications', 10);
  
  for (const notif of notifications) {
    try {
      await sendViaProvider(notif);
      await Notification.updateOne(
        { _id: notif.id },
        { status: 'sent', sentAt: new Date() }
      );
      
    } catch (error) {
      await handleFailure(notif, error);
    }
  }
}

async function handleFailure(notification, error) {
  const record = await Notification.findById(notification.id);
  
  if (record.retryCount < 3) {
    // Retry with exponential backoff
    const delay = Math.pow(2, record.retryCount) * 1000;
    await queue.publish('notifications', notification, { delay });
    
    await Notification.updateOne(
      { _id: notification.id },
      { $inc: { retryCount: 1 } }
    );
  } else {
    // Move to dead letter queue
    await queue.publish('notifications.dlq', notification);
    await Notification.updateOne(
      { _id: notification.id },
      { status: 'failed', error: error.message }
    );
  }
}
```

---

## Quick Reference: Scaling Checklist

| Component | Single Server | Scaled Architecture |
|-----------|---------------|---------------------|
| App Server | Express single process | K8s pods + load balancer |
| Database | Single MongoDB | Sharded + replica sets |
| Cache | In-memory Map | Redis Cluster |
| AI/LLM | Direct API calls | Queue + workers + circuit breaker |
| Search | Database queries | Elasticsearch |
| File Uploads | Local disk | S3 + CDN |
| Sessions | Memory | Redis |
| Logs | Console | ELK Stack / CloudWatch |

**Key Principles:**
1. **Stateless servers** - Enable horizontal scaling
2. **Async processing** - Queue heavy operations
3. **Multi-level caching** - Reduce database load
4. **Graceful degradation** - Serve cached data if live fails
5. **Observability** - Metrics, logging, tracing
