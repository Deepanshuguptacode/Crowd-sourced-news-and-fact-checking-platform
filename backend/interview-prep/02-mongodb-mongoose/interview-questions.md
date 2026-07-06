# Module 02: MongoDB & Mongoose Interview Questions

## Section A: MongoDB Fundamentals

### Q1: What is the difference between SQL and MongoDB?

**Answer:**

| Aspect | SQL (Relational) | MongoDB (Document) |
|--------|------------------|-------------------|
| **Data Model** | Tables, rows, columns | Collections, documents (JSON) |
| **Schema** | Rigid, predefined | Flexible, dynamic |
| **Relationships** | Foreign keys, joins | References or embedded documents |
| **Scaling** | Vertical (bigger servers) | Horizontal (sharding) |
| **Transactions** | ACID by default | Multi-document transactions available |
| **Query Language** | SQL | JavaScript-based queries |

**When to use MongoDB:**
- Rapidly evolving schemas
- Unstructured/semi-structured data
- Horizontal scaling needs
- Document-based data (profiles, content)

**When to use SQL:**
- Complex transactions
- Strict consistency requirements
- Complex joins and aggregations
- Financial/ACID-critical applications

---

### Q2: What is the difference between embedding and referencing documents?

**Answer:**

**Embedding (Denormalized):**
```javascript
const userSchema = new mongoose.Schema({
  name: String,
  address: {
    street: String,
    city: String,
    country: String
  }
});
```
- **Pros:** Single query retrieval, data locality, atomic updates
- **Cons:** Data duplication, harder to update shared data, document size limits (16MB)

**Referencing (Normalized):**
```javascript
const postSchema = new mongoose.Schema({
  title: String,
  author: { type: ObjectId, ref: 'User' }  // Reference
});
```
- **Pros:** No duplication, easier to update shared data
- **Cons:** Multiple queries needed, no atomic operations across documents

**VoxVeritas Pattern:**
- Use **embedding** for comments within groups, expert votes within comments
- Use **referencing** for user → news articles, comment → author

---

### Q3: Explain the ObjectId in MongoDB.

**Answer:**
- 12-byte unique identifier automatically generated
- Structure: `timestamp (4) + machineId (3) + processId (2) + counter (3)`
- Contains creation timestamp (first 4 bytes)

```javascript
// Extract timestamp from ObjectId
const id = new mongoose.Types.ObjectId();
const timestamp = id.getTimestamp();  // Date object

// Check if string is valid ObjectId
mongoose.Types.ObjectId.isValid('507f1f77bcf86cd799439011');  // true/false
```

---

## Section B: Mongoose Operations

### Q4: Explain the difference between these query methods:

| Method | Returns | Use Case |
|--------|---------|----------|
| `find()` | Array of documents | Multiple results |
| `findOne()` | Single document or null | Unique lookup |
| `findById()` | Single document or null | Lookup by ObjectId |
| `findByIdAndUpdate()` | Updated document (if `new: true`) | Update + return |
| `findByIdAndDelete()` | Deleted document | Delete + return |
| `exists()` | `{ _id: ... }` or null | Fast existence check |

**Performance Tip:** Use `exists()` when you only need to check if something exists, not retrieve it.

---

### Q5: What is the difference between `save()` and `create()`?

**Answer:**

```javascript
// Method 1: Instantiate then save (2 operations)
const user = new User({ name: 'John', email: 'john@example.com' });
await user.save();

// Method 2: Create directly (1 operation)
await User.create({ name: 'John', email: 'john@example.com' });

// Method 3: Insert many (bulk operation)
await User.insertMany([user1, user2, user3]);
```

**Key Differences:**
- `new + save`: Can modify document before saving, runs pre-save hooks twice (new + save)
- `create()`: Single operation, cleaner for simple inserts
- `save()` on existing document: Updates only changed fields (efficient)

---

### Q6: What are MongoDB update operators and when to use them?

**Answer:**

```javascript
// $set - Update specific fields
await User.findByIdAndUpdate(id, { $set: { name: 'New Name' } });

// $push - Add to array
await Post.findByIdAndUpdate(id, { $push: { comments: commentId } });

// $addToSet - Add to array only if not exists (unique)
await User.findByIdAndUpdate(id, { $addToSet: { tags: 'javascript' } });

// $pull - Remove from array
await Post.findByIdAndUpdate(id, { $pull: { comments: commentId } });

// $inc - Increment/decrement numbers
await Post.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

// $unset - Remove a field
await User.findByIdAndUpdate(id, { $unset: { oldField: 1 } });
```

**Why operators matter:** Atomic updates, no race conditions, single database round-trip.

---

## Section C: Population and Relationships

### Q7: What is population in Mongoose and how does it work?

**Answer:**
Population replaces ObjectId references with actual documents.

```javascript
// Without population
const post = await Post.findById(id);
// post.author = ObjectId("507f1f77bcf86cd799439011")

// With population
const post = await Post.findById(id).populate('author');
// post.author = { _id: ..., name: 'John', email: '...' }

// Populate multiple fields
await Post.find().populate('author').populate('comments');

// Nested population (populate inside populated)
await Post.find().populate({
  path: 'comments',
  populate: { path: 'author', select: 'name' }
});

// Select specific fields
await Post.find().populate('author', 'name email');  // Only name and email
await Post.find().populate('author', '-password');   // Exclude password
```

**How it works:** Mongoose performs additional queries to fetch referenced documents.

---

### Q8: What is the N+1 query problem and how to solve it?

**Answer:**

**The Problem:**
```javascript
// BAD: N+1 queries
const posts = await Post.find();  // 1 query
for (const post of posts) {
  const author = await User.findById(post.author);  // N queries
}
// Total: N+1 queries
```

**Solution 1: Use populate()**
```javascript
// GOOD: 2 queries total
const posts = await Post.find().populate('author');
```

**Solution 2: Use $in operator**
```javascript
// GOOD: 2 queries with manual handling
const posts = await Post.find();
const authorIds = posts.map(p => p.author);
const authors = await User.find({ _id: { $in: authorIds } });
const authorMap = new Map(authors.map(a => [a._id.toString(), a]));
// Match authors to posts in memory
```

---

## Section D: Schema Design

### Q9: Design a schema for a news platform with users, articles, and comments.

**Answer:**

```javascript
// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'expert', 'admin'], default: 'user' }
}, { timestamps: true });

// Article Schema
const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String }],
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  views: { type: Number, default: 0 },
  votes: {
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }
}, { timestamps: true });

// Comment Schema
const commentSchema = new mongoose.Schema({
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  votes: {
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Index for faster queries
commentSchema.index({ article: 1, createdAt: -1 });
```

---

### Q10: What are indexes and when should you use them?

**Answer:**

**Indexes** are data structures that speed up queries at the cost of storage and slower writes.

```javascript
// Single field index
userSchema.index({ email: 1 });  // 1 = ascending, -1 = descending

// Compound index (for queries with multiple filters)
articleSchema.index({ status: 1, createdAt: -1 });
// Supports: { status: 'published' } and { status, createdAt }

// Text index (for search)
articleSchema.index({ title: 'text', content: 'text' });
// Usage: Article.find({ $text: { $search: 'nodejs' } })

// Unique index (enforces uniqueness)
userSchema.index({ email: 1 }, { unique: true });
```

**When to index:**
- Fields in `where` clauses (queries)
- Fields in `sort()` operations
- Fields used in `populate()`

**When NOT to index:**
- Low cardinality fields (boolean, enum with few values)
- Frequently updated fields (each update updates index)
- Small collections (< 1000 documents)

---

## Section E: Aggregation Pipeline

### Q11: Explain the aggregation pipeline with an example.

**Answer:**

The aggregation pipeline processes data through stages:

```javascript
// Get top 5 most voted articles
const topArticles = await Article.aggregate([
  // Stage 1: Calculate total votes
  {
    $addFields: {
      totalVotes: { $add: [
        { $size: '$votes.upvotes' },
        { $size: '$votes.downvotes' }
      ]}
    }
  },
  
  // Stage 2: Sort by total votes descending
  { $sort: { totalVotes: -1 } },
  
  // Stage 3: Limit to 5 results
  { $limit: 5 },
  
  // Stage 4: Project only needed fields
  {
    $project: {
      title: 1,
      author: 1,
      totalVotes: 1,
      voteRatio: {
        $cond: {
          if: { $eq: [{ $size: '$votes.downvotes' }, 0] },
          then: { $size: '$votes.upvotes' },
          else: {
            $divide: [
              { $size: '$votes.upvotes' },
              { $size: '$votes.downvotes' }
            ]
          }
        }
      }
    }
  }
]);
```

**Common stages:** `$match`, `$group`, `$sort`, `$limit`, `$project`, `$lookup` (join), `$unwind`

---

## Section F: Advanced Topics

### Q12: What is the difference between `lean()` and regular queries?

**Answer:**

```javascript
// Regular query - returns Mongoose documents
const doc = await User.findById(id);
doc.name = 'New Name';
await doc.save();  // Works - has Mongoose methods

// Lean query - returns plain JavaScript objects
const plain = await User.findById(id).lean();
plain.name = 'New Name';
await plain.save();  // ERROR - plain.save is not a function
```

**When to use lean():**
- Read-only operations (GET endpoints)
- When you need JSON serialization (API responses)
- Better performance (skips Mongoose document creation)

**When NOT to use:**
- When you need to modify and save the document
- When you need Mongoose middleware/hooks

---

### Q13: How do transactions work in MongoDB/Mongoose?

**Answer:**

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Operations within transaction
  await User.create([{ name: 'John' }], { session });
  await Post.create([{ title: 'Hello' }], { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**Key points:**
- All operations must use the same `session`
- Transactions require a replica set (not standalone MongoDB)
- ACID guarantees across multiple documents
- Use for operations that must succeed/fail together

---

### Q14: What are pre/post hooks (middleware) in Mongoose?

**Answer:**

```javascript
// Pre-save hook - runs before document is saved
userSchema.pre('save', async function(next) {
  // 'this' is the document being saved
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Post-save hook - runs after document is saved
userSchema.post('save', function(doc) {
  console.log('User saved:', doc._id);
});

// Pre-remove hook
userSchema.pre('remove', async function(next) {
  // Clean up related data
  await Post.deleteMany({ author: this._id });
  next();
});
```

**Important:** Use regular `function`, not arrow function, to access `this`.

---

## Quick Reference: Query Chaining

```javascript
// Method chaining for fluent queries
const results = await Model
  .find({ status: 'active' })     // Filter
  .select('name email')          // Pick fields
  .populate('author', 'name')    // Join related
  .sort({ createdAt: -1 })       // Order
  .skip(20)                      // Pagination
  .limit(10)                    // Page size
  .lean();                       // Plain objects
```
