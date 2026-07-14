# 07 — System Design Q&A

> TCS managerial rounds often ask "How would you scale this?" or "What are the bottlenecks?" Use your real project as the base, then extend.

---

## Scalability Questions

**Q: What are the bottlenecks in your current system?**
A: Three main bottlenecks:

1. **Gemini API rate limits** — Free tier: 15 requests/minute per key. We partially solve this with 3-key rotation (effective ~45 RPM). Under high load, a queue system (like Bull with Redis) would be needed.

2. **Pinecone latency** — Each comment post triggers 1-2 Pinecone queries + 1 upsert (~200-500ms). Under concurrent heavy load, this adds per-request latency.

3. **Node.js single thread** — CPU-intensive tasks (like computing cosine similarity for many face embeddings) block the event loop. We offload face computation to Flask for this reason.

**Q: How would you scale this to 1 million users?**
A:

```
Current Architecture:
  1 Node.js server → 1 MongoDB instance → Pinecone → Gemini

Scaled Architecture:
  Load Balancer (e.g., AWS ALB)
       |
  +----+----+
  |    |    |
  N1   N2   N3  (Node.js instances — horizontal scaling)
       |
  MongoDB Atlas (auto-sharding)
  Redis (session cache, job queue)
  Pinecone (already cloud-managed, scales automatically)
  CDN (static file serving — profile images, screenshots)
```

Specific changes:
- **Stateless JWT** — already done (no server-side sessions = easy horizontal scaling)
- **Redis cache** — cache trending news feed (doesn't change every millisecond)
- **Message queue** — decouple AI processing (comment posting returns instantly; AI grouping runs async via Bull/BullMQ)
- **CDN** — serve uploaded images via CloudFront instead of Express static files

**Q: How do you handle concurrent comment posting?**
A: Node.js event loop handles concurrent I/O without threads. Multiple comment-post requests run simultaneously — each awaits its MongoDB save and Pinecone query independently. Race conditions are minimal because:
- Mongoose document saves are atomic at the document level
- Pinecone upserts are idempotent (same ID → overwrites)
- Comment group creation could theoretically create duplicates (mitigation: unique index on group label per newsId)

---

## Caching

**Q: Where would you add caching?**
A:

| What to Cache | Strategy | TTL |
|--------------|---------|-----|
| Trending news feed | Redis cache, invalidate on new scrape | 10 minutes |
| AI Verdicts | Already cached in MongoDB AIVerdict collection | Until regenerated |
| Comment embeddings | In-memory Map cache in VectorService | 1 hour |
| User profile data | Redis, invalidate on update | 30 minutes |

**Q: What caching does your system currently have?**
A: One layer — the embedding cache in `vectorService.js`:

```javascript
const embeddingCache = new Map();   // key: first 200 chars of text
const CACHE_TTL = 3600000;          // 1 hour
const CACHE_MAX = 2000;             // max entries, FIFO eviction

// Before calling Gemini:
const cached = getCached(text.substring(0, 200));
if (cached) return cached;  // Cache hit — skip Gemini API call
```

This avoids re-calling Gemini for repeated comment text (e.g., if two users post very similar comments, the second one hits the cache).

---

## Background Jobs & Scheduling

**Q: What scheduled tasks does your system run?**

| Task | Mechanism | Frequency |
|------|-----------|-----------|
| NDTV news scraping | `cron` package | Every 10 minutes |
| Trending news cleanup | Post-scrape hook | After every scrape |
| News cleanup (40-item cap) | `setInterval` | Every 1 hour |

**Q: What is the difference between setInterval and cron for scheduling?**
A:
- `setInterval`: Simple, based on milliseconds from last run. Not timezone-aware. Doesn't persist across restarts (starts fresh on server restart).
- `cron`: Supports cron expressions (`*/10 * * * *` = every 10 min), timezone-aware, more precise scheduling. We use the `cron` npm package for trending news.

For production, we'd use a persistent job queue (BullMQ + Redis) so scheduled jobs survive server restarts and can be monitored.

**Q: What happens if the scraper runs while a previous scrape is still in progress?**
A: The `trendingNewsScheduler` uses an `isRunning` flag:
```javascript
if (this.isRunning) return;  // Skip if previous run not complete
this.isRunning = true;
try { await this.fetchNews(); }
finally { this.isRunning = false; }
```
This prevents concurrent scrape runs that would create duplicate articles.

---

## File Upload Handling

**Q: How do you handle file uploads?**
A: Using `multer` middleware:
- Stores files to `uploads/screenshots/` or `uploads/profiles/` directories
- Configures file size limits and allowed MIME types
- Returns the filename/path, which is stored in the MongoDB document

```javascript
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/screenshots/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
```

For production: files should go to cloud storage (AWS S3, Google Cloud Storage) instead of the local disk — local disk doesn't work across multiple server instances.

---

## API Design

**Q: What is REST? How do you follow REST principles?**
A: REST (Representational State Transfer) is an architectural style for APIs:

1. **Stateless**: Each request contains all needed info (JWT token). ✓ Our API uses JWT, no server sessions.
2. **Resource-based URLs**: URLs identify resources (nouns, not verbs). ✓ `/news/:newsId`, `/debate-rooms/:roomId`
3. **HTTP verbs**: GET (read), POST (create), PUT (update), DELETE (delete). ✓ Used correctly.
4. **Consistent response format**: Always return JSON `{ success, data, message }`. ✓ Mostly followed.
5. **Uniform interface**: Standard HTTP status codes. ✓ Used 200, 201, 400, 401, 404, 500.

**Q: What is the difference between PUT and PATCH?**
A: PUT replaces the entire resource. PATCH partially updates specific fields. In VoxVeritas, when updating a debate room (title or description only), PATCH would be more correct — we only update what's sent, not the entire document.

---

## CORS

**Q: What is CORS? How did you configure it?**
A: CORS (Cross-Origin Resource Sharing) is a browser security mechanism that blocks JavaScript requests from one origin (e.g., `http://localhost:5173`) to a different origin (e.g., `http://localhost:3000`) unless the server explicitly allows it.

Configuration:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://yourfrontend.vercel.app'],
  credentials: true  // Required to allow cookies cross-origin
}));
```

`credentials: true` is critical for cookie-based JWT — without it, the browser won't send the token cookie with cross-origin requests.

---

## Web Scraping

**Q: How does your trending news scraper work?**
A: Uses `axios` to fetch NDTV HTML + `cheerio` to parse it (jQuery-like syntax for Node.js):

```javascript
const response = await axios.get('https://www.ndtv.com/latest');
const $ = cheerio.load(response.data);

$('.news-card').each((i, el) => {
  const title = $(el).find('h2').text().trim();
  const link = $(el).find('a').attr('href');
  // ... save to TrendingNews collection
});
```

Runs every 10 minutes, capped at 50 active articles.

---

## Deployment

**Q: How did you deploy the application?**
A:
- **Backend**: Vercel (Node.js serverless functions) or a Node.js server
- **Database**: MongoDB Atlas (managed cloud)
- **Vector DB**: Pinecone cloud (managed)
- **Face Auth**: Python Flask on a separate server (VPS/EC2) — can't deploy on Vercel due to heavy ML dependencies
- **Environment variables**: Stored in Vercel project settings / `.env` files (never committed to Git)

**Q: What would be different in a production deployment?**
A: Beyond what we have:
- HTTPS everywhere (SSL certificates via Let's Encrypt or AWS ACM)
- Docker containers for reproducible deployments
- CI/CD pipeline (GitHub Actions)
- Health checks and monitoring (PM2, Prometheus/Grafana)
- Log aggregation (structured logging with Winston + ELK stack)
- Redis for caching and job queues
- CDN for static assets
