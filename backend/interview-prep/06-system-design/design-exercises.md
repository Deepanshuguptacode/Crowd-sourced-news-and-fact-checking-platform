# Module 06: System Design Exercises

## Exercise 1: Design a URL Shortener (like bit.ly)

**Requirements:**
- Create short URLs from long URLs
- Redirect short URL to original
- Track click analytics
- Support 100M URLs, 1M redirects/second

**Your Solution:**
```javascript
// Write your design here:
// 1. Database schema
// 2. URL generation algorithm
// 3. Caching strategy
// 4. Analytics tracking
```

**Solution Approach:**
```javascript
// Schema
const urlSchema = new mongoose.Schema({
  shortCode: { type: String, unique: true, index: true },  // Base62 encoded
  longUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  clicks: { type: Number, default: 0 },
  lastAccessed: Date
});

// Base62 encoding for short codes
const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function encodeBase62(num) {
  let result = '';
  while (num > 0) {
    result = BASE62[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result || '0';
}

// Generate unique short code
async function createShortUrl(longUrl) {
  // Check if URL already exists
  const existing = await ShortUrl.findOne({ longUrl });
  if (existing) return existing.shortCode;
  
  // Get next ID (could use MongoDB counter collection)
  const counter = await Counter.findOneAndUpdate(
    { _id: 'url' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  
  const shortCode = encodeBase62(counter.seq);
  
  await ShortUrl.create({ shortCode, longUrl });
  
  // Cache in Redis
  await redis.setex(`url:${shortCode}`, 86400, longUrl);
  
  return shortCode;
}

// Redirect endpoint
async function redirect(shortCode) {
  // Check cache first
  const cached = await redis.get(`url:${shortCode}`);
  if (cached) {
    // Async analytics
    analytics.track({ code: shortCode, timestamp: Date.now() });
    return cached;
  }
  
  // Query database
  const record = await ShortUrl.findOne({ shortCode });
  if (!record) throw new Error('Not found');
  
  // Update cache
  await redis.setex(`url:${shortCode}`, 86400, record.longUrl);
  
  // Update click count (async)
  ShortUrl.updateOne({ shortCode }, { 
    $inc: { clicks: 1 },
    $set: { lastAccessed: new Date() }
  }).exec();
  
  return record.longUrl;
}
```

---

## Exercise 2: Design a Rate Limiter

**Requirements:**
- Limit requests per user per time window
- Support multiple rate limits (e.g., 100/min, 1000/hour)
- Distributed across servers
- Sliding window accuracy

**Solution:**
```javascript
class DistributedRateLimiter {
  constructor(redis) {
    this.redis = redis;
  }
  
  async isAllowed(userId, resource, maxRequests, windowSeconds) {
    const key = `ratelimit:${userId}:${resource}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);
    
    // Redis sorted set: score = timestamp, member = request ID
    const pipeline = this.redis.pipeline();
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current entries
    pipeline.zcard(key);
    
    // Add current request
    const requestId = `${now}-${Math.random()}`;
    pipeline.zadd(key, now, requestId);
    pipeline.expire(key, windowSeconds);
    
    const results = await pipeline.exec();
    const currentCount = results[1][1];  // Result of zcard
    
    return {
      allowed: currentCount < maxRequests,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - currentCount - 1),
      resetTime: now + (windowSeconds * 1000)
    };
  }
}
```

---

## Exercise 3: Design a Chat System

**Requirements:**
- 1-on-1 and group chats
- Message persistence
- Read receipts
- Online status
- Support 10M concurrent users

**Key Design Decisions:**

```javascript
// Database Schema
const messageSchema = new mongoose.Schema({
  chatId: { type: ObjectId, index: true },
  senderId: ObjectId,
  content: String,
  timestamp: { type: Date, default: Date.now },
  readBy: [{ userId: ObjectId, readAt: Date }]
});

// Sharding: by chatId

// Architecture
/*
Client ──► Load Balancer ──► WebSocket Server ──► Message Queue ──► Database
                 │                    │
                 ▼                    ▼
           Presence Service      Pub/Sub (Redis)
*/

class ChatService {
  constructor(io, redis) {
    this.io = io;
    this.redis = redis;
  }
  
  async sendMessage(chatId, senderId, content) {
    // 1. Save to database
    const message = await Message.create({
      chatId,
      senderId,
      content,
      timestamp: new Date()
    });
    
    // 2. Get online members
    const members = await this.getChatMembers(chatId);
    const onlineMembers = await this.filterOnline(members);
    
    // 3. Broadcast to online members
    for (const userId of onlineMembers) {
      const socketId = await this.redis.get(`user:${userId}:socket`);
      if (socketId) {
        this.io.to(socketId).emit('new_message', {
          chatId,
          message: {
            id: message._id,
            senderId,
            content,
            timestamp: message.timestamp
          }
        });
      }
    }
    
    // 4. Queue for offline members (push notifications)
    const offlineMembers = members.filter(m => !onlineMembers.includes(m));
    for (const userId of offlineMembers) {
      await this.queue.push('notifications', {
        userId,
        type: 'new_message',
        chatId,
        messageId: message._id
      });
    }
    
    return message;
  }
  
  async markAsRead(chatId, userId, messageIds) {
    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        chatId
      },
      {
        $addToSet: {
          readBy: { userId, readAt: new Date() }
        }
      }
    );
    
    // Notify sender
    for (const messageId of messageIds) {
      const message = await Message.findById(messageId);
      const senderSocket = await this.redis.get(`user:${message.senderId}:socket`);
      if (senderSocket) {
        this.io.to(senderSocket).emit('read_receipt', {
          messageId,
          readBy: userId
        });
      }
    }
  }
}
```

---

## Exercise 4: Design Leaderboard System

**Requirements:**
- Real-time rankings
- Top 100 global
- Friend rankings
- Handle 1M score updates/hour

**Solution:**
```javascript
class LeaderboardService {
  constructor(redis) {
    this.redis = redis;
  }
  
  // Update score
  async updateScore(userId, score, gameId = 'global') {
    // Update Redis sorted set
    await this.redis.zadd(
      `leaderboard:${gameId}`,
      score,
      userId
    );
    
    // Also update user's friend leaderboard
    const friends = await this.getFriends(userId);
    for (const friendId of friends) {
      await this.redis.zadd(
        `leaderboard:friends:${friendId}`,
        score,
        userId
      );
    }
  }
  
  // Get top N
  async getTopN(n = 100, gameId = 'global') {
    const results = await this.redis.zrevrange(
      `leaderboard:${gameId}`,
      0,
      n - 1,
      'WITHSCORES'
    );
    
    return this.formatResults(results);
  }
  
  // Get user's rank
  async getUserRank(userId, gameId = 'global') {
    const [rank, score] = await Promise.all([
      this.redis.zrevrank(`leaderboard:${gameId}`, userId),
      this.redis.zscore(`leaderboard:${gameId}`, userId)
    ]);
    
    return {
      rank: rank !== null ? rank + 1 : null,  // 1-based rank
      score: score ? parseFloat(score) : 0
    };
  }
  
  // Get friends leaderboard
  async getFriendsLeaderboard(userId) {
    const results = await this.redis.zrevrange(
      `leaderboard:friends:${userId}`,
      0,
      -1,
      'WITHSCORES'
    );
    
    return this.formatResults(results);
  }
  
  formatResults(results) {
    const formatted = [];
    for (let i = 0; i < results.length; i += 2) {
      formatted.push({
        rank: Math.floor(i / 2) + 1,
        userId: results[i],
        score: parseFloat(results[i + 1])
      });
    }
    return formatted;
  }
}
```

---

## Exercise 5: Design Job Queue System

**Requirements:**
- Delayed job execution
- Job retries with exponential backoff
- Priority queues
- Dead letter queue
- Job status tracking

**Solution:**
```javascript
class JobQueue {
  constructor(redis, workers) {
    this.redis = redis;
    this.workers = workers;
    this.processing = false;
  }
  
  async add(jobType, payload, options = {}) {
    const job = {
      id: generateUUID(),
      type: jobType,
      payload,
      priority: options.priority || 0,
      delay: options.delay || 0,
      maxRetries: options.retries || 3,
      retryCount: 0,
      status: 'pending',
      createdAt: Date.now(),
      runAt: Date.now() + (options.delay || 0)
    };
    
    // Store job data
    await this.redis.hset(`job:${job.id}`, 'data', JSON.stringify(job));
    
    // Add to appropriate queue
    if (job.delay > 0) {
      // Delayed queue (sorted by runAt)
      await this.redis.zadd('queue:delayed', job.runAt, job.id);
    } else if (job.priority > 0) {
      // Priority queue
      await this.redis.zadd('queue:priority', job.priority, job.id);
    } else {
      // Regular queue
      await this.redis.lpush('queue:default', job.id);
    }
    
    return job.id;
  }
  
  async process() {
    if (this.processing) return;
    this.processing = true;
    
    while (this.processing) {
      // Check delayed jobs first
      const now = Date.now();
      const readyJobs = await this.redis.zrangebyscore(
        'queue:delayed',
        0,
        now,
        'LIMIT',
        0,
        10
      );
      
      for (const jobId of readyJobs) {
        await this.redis.zrem('queue:delayed', jobId);
        await this.redis.lpush('queue:default', jobId);
      }
      
      // Process job
      const jobId = await this.redis.brpop('queue:priority', 'queue:default', 5);
      if (!jobId) continue;
      
      await this.executeJob(jobId[1]);
    }
  }
  
  async executeJob(jobId) {
    const jobData = await this.redis.hget(`job:${jobId}`, 'data');
    const job = JSON.parse(jobData);
    
    const worker = this.workers[job.type];
    if (!worker) {
      await this.moveToDLQ(job, 'No worker for job type');
      return;
    }
    
    try {
      await this.redis.hset(`job:${jobId}`, 'status', 'running');
      await worker(job.payload);
      await this.redis.hset(`job:${jobId}`, 'status', 'completed');
      
    } catch (error) {
      job.retryCount++;
      
      if (job.retryCount >= job.maxRetries) {
        await this.moveToDLQ(job, error.message);
      } else {
        // Retry with exponential backoff
        const delay = Math.pow(2, job.retryCount) * 1000;
        job.runAt = Date.now() + delay;
        await this.redis.hset(`job:${jobId}`, 'data', JSON.stringify(job));
        await this.redis.zadd('queue:delayed', job.runAt, jobId);
      }
    }
  }
  
  async moveToDLQ(job, error) {
    await this.redis.hset(`job:${job.id}`, 'status', 'failed');
    await this.redis.hset(`job:${job.id}`, 'error', error);
    await this.redis.lpush('queue:dlq', job.id);
  }
}
```

---

## Exercise 6: Design a File Upload System

**Requirements:**
- Support large files (up to 1GB)
- Resume interrupted uploads
- Virus scanning
- Image processing (thumbnails)
- CDN distribution

**Solution:**
```javascript
class FileUploadService {
  constructor(s3, redis, queue) {
    this.s3 = s3;
    this.redis = redis;
    this.queue = queue;
  }
  
  // Initiate multipart upload
  async initiateUpload(fileName, fileSize, mimeType) {
    const uploadId = generateUUID();
    const parts = Math.ceil(fileSize / (5 * 1024 * 1024));  // 5MB parts
    
    // Store metadata
    await this.redis.hmset(`upload:${uploadId}`, {
      fileName,
      fileSize,
      mimeType,
      parts,
      uploadedParts: 0,
      status: 'in_progress'
    });
    
    // Get S3 multipart upload ID
    const s3Upload = await this.s3.createMultipartUpload({
      Bucket: 'uploads',
      Key: `temp/${uploadId}/${fileName}`,
      ContentType: mimeType
    }).promise();
    
    await this.redis.hset(`upload:${uploadId}`, 's3UploadId', s3Upload.UploadId);
    
    return {
      uploadId,
      parts: Array.from({ length: parts }, (_, i) => ({
        partNumber: i + 1,
        startByte: i * 5 * 1024 * 1024,
        endByte: Math.min((i + 1) * 5 * 1024 * 1024, fileSize) - 1
      }))
    };
  }
  
  // Upload part
  async uploadPart(uploadId, partNumber, buffer) {
    const uploadData = await this.redis.hgetall(`upload:${uploadId}`);
    
    const result = await this.s3.uploadPart({
      Bucket: 'uploads',
      Key: `temp/${uploadId}/${uploadData.fileName}`,
      UploadId: uploadData.s3UploadId,
      PartNumber: partNumber,
      Body: buffer
    }).promise();
    
    // Store ETag for completion
    await this.redis.hset(
      `upload:${uploadId}:parts`,
      partNumber,
      result.ETag
    );
    
    await this.redis.hincrby(`upload:${uploadId}`, 'uploadedParts', 1);
    
    return { etag: result.ETag };
  }
  
  // Complete upload
  async completeUpload(uploadId) {
    const uploadData = await this.redis.hgetall(`upload:${uploadId}`);
    const parts = await this.redis.hgetall(`upload:${uploadId}:parts`);
    
    // Complete multipart upload
    await this.s3.completeMultipartUpload({
      Bucket: 'uploads',
      Key: `temp/${uploadId}/${uploadData.fileName}`,
      UploadId: uploadData.s3UploadId,
      MultipartUpload: {
        Parts: Object.entries(parts).map(([partNumber, ETag]) => ({
          PartNumber: parseInt(partNumber),
          ETag
        }))
      }
    }).promise();
    
    // Move to permanent location
    const finalKey = `uploads/${generateUUID()}/${uploadData.fileName}`;
    await this.s3.copyObject({
      Bucket: 'uploads',
      CopySource: `uploads/temp/${uploadId}/${uploadData.fileName}`,
      Key: finalKey
    }).promise();
    
    // Queue for processing
    await this.queue.add('process-upload', {
      uploadId,
      s3Key: finalKey,
      mimeType: uploadData.mimeType
    });
    
    await this.redis.hset(`upload:${uploadId}`, 'status', 'processing');
    
    return { status: 'processing', uploadId };
  }
}

// Worker for post-processing
async function processUpload(job) {
  const { s3Key, mimeType } = job.data;
  
  // 1. Virus scan
  const scanResult = await virusScanner.scan(s3Key);
  if (scanResult.infected) {
    await s3.deleteObject({ Bucket: 'uploads', Key: s3Key }).promise();
    throw new Error('Virus detected');
  }
  
  // 2. Image processing (if image)
  if (mimeType.startsWith('image/')) {
    await generateThumbnails(s3Key, [150, 300, 600]);
  }
  
  // 3. Invalidate CDN cache (if updating existing)
  await cdn.invalidate(s3Key);
  
  // 4. Update database
  await File.create({
    s3Key,
    url: `https://cdn.example.com/${s3Key}`,
    size: await getFileSize(s3Key),
    mimeType,
    status: 'ready'
  });
}
```

---

## Design Checklist

Before finalizing your design, consider:

**Scalability:**
- [ ] Can the system handle 10x traffic?
- [ ] What's the single point of failure?
- [ ] How to shard/partition data?

**Performance:**
- [ ] Read vs write optimization?
- [ ] Caching strategy?
- [ ] Database query efficiency?

**Reliability:**
- [ ] What happens if a service goes down?
- [ ] How to handle data loss?
- [ ] Backup and recovery plan?

**Cost:**
- [ ] Most expensive component?
- [ ] Can we use cheaper alternatives?
- [ ] CDN vs origin costs?

**Monitoring:**
- [ ] What metrics to track?
- [ ] Alert thresholds?
- [ ] How to detect issues?
