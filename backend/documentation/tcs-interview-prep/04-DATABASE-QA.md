# 04 — Database Q&A (MongoDB & Mongoose)

---

## MongoDB Fundamentals

**Q: Explain the difference between SQL and NoSQL databases.**

| Feature | SQL (e.g., MySQL) | NoSQL (MongoDB) |
|---------|-------------------|-----------------|
| Schema | Fixed, predefined | Flexible, per-document |
| Data format | Tables with rows | Collections with JSON documents |
| Joins | Native (JOIN) | Manual via populate() or embedded docs |
| Scaling | Vertical (bigger server) | Horizontal (more servers/sharding) |
| ACID | Full ACID transactions | Eventual consistency (ACID in newer versions) |
| Best for | Financial, relational data | Hierarchical, variable-structure data |

**Q: What is a document in MongoDB?**
A: A document is a JSON-like record stored in a collection. In MongoDB, documents use BSON (Binary JSON), which supports additional types like `ObjectId`, `Date`, and `Binary`. Example:

```javascript
{
  "_id": ObjectId("64a1bc2e3f12a4b5c6d7e8f9"),
  "title": "VoxVeritas launches AI fact-checking",
  "status": "Pending",
  "upvotes": 42,
  "screenshots": ["/uploads/ss1.jpg"],
  "uploadedAt": ISODate("2026-07-11T10:00:00Z")
}
```

---

## Schema Design in VoxVeritas

**Q: How did you model 4 different user types?**
A: We used **separate collections** — one Mongoose model per user type: `NormalUser`, `CommunityUser`, `ExpertUser`, `Admin`. Each has a different schema:

```javascript
// CommunityUser has bio, social links
const communityUserSchema = new Schema({
  name: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  bio: String,
  socialLinks: { twitter: String, linkedin: String }
});

// ExpertUser has professional credentials
const expertUserSchema = new Schema({
  name: String,
  email: String,
  password: String,
  profession: String,
  areaOfExpertise: String,
  credentials: String
});
```

Alternative would be a single `users` collection with a `type` field — but separate schemas give better type safety and validation.

**Q: How did you model comments for different user types?**
A: Two schemas in one file — `CommunityComment` and `ExpertComment` — both referencing their respective user collections:

```javascript
const communityCommentSchema = new Schema({
  newsId: { type: ObjectId, ref: 'News' },
  commenter: { type: ObjectId, ref: 'CommunityUser' },
  comment: String,
  stance: { type: String, enum: ['in_favor', 'against', 'general'] },
  evidenceLinks: [String],
  upvoteCount: Number,
  downvoteCount: Number,
  score: Number,
  filterGroupId: { type: ObjectId, ref: 'CommentGroup' }
});
```

---

## MongoDB Queries Used in the Project

**Q: What MongoDB query methods did you use most?**

```javascript
// Find all with filter + sort + pagination
News.find({ status: 'Pending' })
  .sort({ uploadedAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);

// Find one (returns object, not array)
const user = await CommunityUser.findOne({ email });

// Find by ID
const news = await News.findById(newsId);

// Update and return new document
const verdict = await AIVerdict.findOneAndUpdate(
  { newsId },
  { score: 87, verdict: "..." },
  { new: true, upsert: true }
);

// Delete
await DebateComment.deleteMany({ debateRoomId: roomId });

// Count
const total = await News.countDocuments({ status: 'Pending' });
```

**Q: What is upsert?**
A: Upsert = UPDATE + INSERT. If a document matching the filter exists, update it. If not, create it. We use this for `regenerateVerdict` — whether or not a verdict exists for a news article, we want to save the latest one.

---

## Indexing

**Q: Did you use indexes? Why are they important?**
A: Indexes are data structures (typically B-trees) that allow MongoDB to quickly locate documents without scanning the entire collection. Without an index on `email`, MongoDB does a full collection scan (O(n)). With an index, lookup is O(log n).

In our schemas, Mongoose creates indexes automatically for:
- `unique: true` fields → creates a unique index (email, username)
- `ref` fields → not indexed automatically, but should be for foreign key lookups

For production, we'd add:
```javascript
newsSchema.index({ uploadedAt: -1 });  // For feed queries sorted by date
commentSchema.index({ newsId: 1 });    // For fetching all comments by news ID
```

**Q: What is a compound index?**
A: An index on multiple fields. Example:
```javascript
commentSchema.index({ newsId: 1, stance: 1 }); // Fast filter by newsId AND stance
```
Used when queries filter on multiple fields together.

---

## Relationships & References

**Q: How do you handle relationships in MongoDB?**
A: Two approaches — **referenced** and **embedded**:

1. **Referenced** (like foreign keys): Store ObjectId and use `.populate()` to fetch:
   ```javascript
   commenter: { type: ObjectId, ref: 'CommunityUser' }
   ```
   Used when the referenced document is large or shared across many documents (users).

2. **Embedded** (denormalized): Store the data directly inside the document:
   ```javascript
   evidenceLinks: [String]  // Stored directly in comment
   ```
   Used when data is small, owned by the document, and always accessed together.

**Rule of thumb**: If you always need both documents together → embed. If referenced data is used independently → reference.

---

## Aggregation

**Q: Did you use MongoDB aggregation?**
A: Mostly simple queries in this project. But MongoDB's aggregation pipeline (similar to SQL GROUP BY) would be useful for:
```javascript
// Get comment count per stance per news article
News.aggregate([
  { $lookup: { from: 'communitycomments', localField: '_id', foreignField: 'newsId', as: 'comments' }},
  { $project: { title: 1, commentCount: { $size: '$comments' }}}
])
```

In our project, we compute stats in JavaScript after fetching raw data (acceptable for small datasets).

---

## Data Cleanup Strategy

**Q: How do you prevent the database from growing unboundedly?**
A: Two cleanup services with different strategies:

1. **News** — `newsCleanupService.js`: Runs hourly via `setInterval`. Keeps newest 40 articles. Deletes oldest beyond that, including their screenshot files from disk.

2. **TrendingNews** — `trendingNewsCleanupService.js`: Triggered after every scrape cycle. Keeps newest 50 active articles. Uses batch `deleteMany` (no files to clean).

**Why not TTL indexes?** TTL deletes documents based on age, not count. We want the N most recent items regardless of when they were created.

---

## MongoDB Atlas (Cloud)

**Q: How did you deploy MongoDB?**
A: MongoDB Atlas — a managed cloud database. Connection via:
```javascript
mongoose.connect(process.env.MONGO_URI);
// MONGO_URI = mongodb+srv://user:pass@cluster.mongodb.net/voxveritas
```

Atlas handles backups, scaling, monitoring. We connect using Mongoose which manages the connection pool.
