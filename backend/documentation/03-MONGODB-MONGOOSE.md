# 03 — MongoDB & Mongoose Deep Dive

## Why This File Exists
MongoDB is our primary database. Mongoose is the Node.js library that lets us interact with MongoDB using JavaScript objects. Nearly every controller and service reads from or writes to MongoDB through Mongoose.

---

## MongoDB Basics

MongoDB is a **NoSQL document database**. Instead of tables with rows (like MySQL), it stores **documents** — JSON-like objects grouped into **collections**.

```
Relational (MySQL):          Document (MongoDB):
┌──────────────────┐         {
│ users table       │           _id: "abc123",
│ id | name | email │           name: "John",
│ 1  | John | j@... │           email: "j@example.com",
│ 2  | Jane | ...   │           interests: ["tech", "science"],
└──────────────────┘           socialLinks: { twitter: "@john" }
                             }
```

**Key MongoDB advantages for VoxVeritas:**
- **Flexible schemas** — different user types can have different fields
- **Embedded documents** — store arrays of objects inside a single document
- **ObjectId references** — link documents across collections (like foreign keys)

---

## Mongoose — The Bridge Between Node.js and MongoDB

Mongoose gives us three things:
1. **Schemas** — define what fields a document can have
2. **Models** — provide CRUD methods (find, save, delete)
3. **Validation** — enforce rules before saving

### Connection Setup (from `index.js`)

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));
```

**What's happening:** `mongoose.connect()` opens a persistent connection to the MongoDB Atlas cluster. All subsequent model operations use this connection automatically.

---

## Schema → Model Pattern

Every model file follows this pattern:

```javascript
const mongoose = require('mongoose');

// Step 1: Define the schema (shape of the document)
const newsSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  status:      { type: String, enum: ['Pending', 'Verified', 'Fake'], default: 'Pending' },
  uploadedAt:  { type: Date, default: Date.now },
});

// Step 2: Create the model (gives us CRUD methods)
const News = mongoose.model('News', newsSchema);

// Step 3: Export the model
module.exports = News;
```

**Schema** = blueprint. **Model** = factory that creates/finds documents using that blueprint.

---

## Field Types We Use

```javascript
const schema = new mongoose.Schema({
  // Basic types
  name:        { type: String, required: true },       // Text
  score:       { type: Number, default: 0 },           // Number
  isOffTopic:  { type: Boolean, default: false },      // True/False
  createdAt:   { type: Date, default: Date.now },      // Date

  // Array types
  tags:        [String],                               // Array of strings
  upvotes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommunityUser' }],  // Array of refs

  // Enum (restricted values)
  stance:      { type: String, enum: ['in_favor', 'against', 'general'] },

  // Reference to another collection (like a foreign key)
  newsId:      { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true },

  // Embedded object
  socialLinks: {
    twitter:  { type: String, default: null },
    linkedin: { type: String, default: null },
  },

  // Array of embedded objects
  expertVotes: [{
    expertId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ExpertUser' },
    vote:        { type: String, enum: ['credible', 'not_credible'] },
    explanation: { type: String, required: true },
  }],

  // Face embedding (array of numbers)
  faceEmbedding: { type: [Number], default: [] },
});
```

### `ref` — References Between Collections

When we write `ref: 'News'`, we're saying "this field stores the `_id` of a document in the News collection." This lets Mongoose resolve the reference later via **population**.

---

## Common Query Methods

### Find Documents

```javascript
// Find ALL news articles
const allNews = await News.find({});

// Find with conditions
const fakeNews = await News.find({ status: 'Fake' });

// Find ONE document
const news = await News.findById(newsId);
const news = await News.findOne({ link: someLink });

// Check if exists (returns _id or null — faster than findOne)
const exists = await News.exists({ _id: roomId });
```

### Create Documents

```javascript
// Method 1: Create instance, then save
const news = new News({ title: 'Test', description: 'Hello' });
await news.save();

// Method 2: Create directly
const news = await News.create({ title: 'Test', description: 'Hello' });
```

### Update Documents

```javascript
// Find and update (returns the updated document)
const updated = await News.findByIdAndUpdate(
  newsId,
  { status: 'Verified' },      // Fields to change
  { new: true }                 // Return updated doc (not the old one)
);

// Update with MongoDB operators
await DebateGroup.findByIdAndUpdate(groupId, {
  $push: { commentIds: commentId },    // Add to array
  $pull: { commentIds: commentId },    // Remove from array
  $addToSet: { likes: { userId } },    // Add only if not already present
  $set: { title: 'New Title' },        // Set field value
});

// Update many documents at once
await DebateGroup.updateMany(
  { debateRoomId: roomId },            // Filter: which documents
  { $set: { counterGroupId: null } }    // Update: what to change
);
```

### Delete Documents

```javascript
await News.findByIdAndDelete(newsId);

// Delete many
await DebateComment.deleteMany({ debateRoomId: roomId });
```

---

## Population — Resolving References

Population replaces an ObjectId with the actual document it references.

```javascript
// WITHOUT population:
const group = await DebateGroup.findById(groupId);
// group.commentIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']  ← just IDs

// WITH population:
const group = await DebateGroup.findById(groupId).populate('commentIds');
// group.commentIds = [{ _id: '...', text: 'Great point!', stance: 'for' }, ...]  ← full objects

// Nested population (populate a field INSIDE the populated document):
const group = await DebateGroup.find({ debateRoomId: roomId })
  .populate({
    path: 'commentIds',           // Populate the comments array
    populate: {
      path: 'author',             // Then inside each comment, populate the author
      select: 'name username _id' // Only get these fields from the author
    }
  })
  .lean();
```

### `.select()` — Choose Which Fields to Return

```javascript
// Only get name and email (exclude everything else)
const user = await NormalUser.findById(userId).select('name email');

// Exclude password (get everything else)
const user = await NormalUser.findById(userId).select('-password');
```

### `.lean()` — Get Plain Objects

```javascript
// Normal query returns Mongoose documents (with methods like .save())
const group = await DebateGroup.findById(id);

// .lean() returns plain JavaScript objects (faster, read-only)
const group = await DebateGroup.findById(id).lean();
```

**Why `.lean()`?** When you only need to read data (like in GET endpoints), `.lean()` is faster because Mongoose doesn't need to create full document instances.

---

## Sorting and Pagination

```javascript
// Sort by date (newest first)
const news = await News.find({})
  .sort({ uploadedAt: -1 })    // -1 = descending, 1 = ascending
  .skip(10)                     // Skip first 10 results (page 2)
  .limit(10);                   // Return only 10 results
```

### Our Pagination Pattern (from NewsController)

```javascript
const page = parseInt(req.query.page) || 1;
const limit = 10;
const skip = (page - 1) * limit;
const maxPages = 4;                              // Cap at 4 pages

const effectivePage = Math.min(page, maxPages);
const effectiveSkip = (effectivePage - 1) * limit;

const totalDocs = await News.countDocuments();   // Total count for pagination info
const news = await News.find().sort({ uploadedAt: -1 }).skip(effectiveSkip).limit(limit);
```

---

## Aggregation Pipelines

Aggregation pipelines are MongoDB's way of doing complex data processing — like GROUP BY in SQL.

### Example: AI Verdict Statistics (from AIVerdictController)

```javascript
const stats = await AIVerdict.aggregate([
  // Stage 1: Group all verdicts together and calculate averages
  {
    $group: {
      _id: null,                                    // Group everything (no grouping field)
      totalVerdicts: { $sum: 1 },                   // Count documents
      averageScore: { $avg: '$score' },             // Average of 'score' field
      averageConfidence: { $avg: '$confidence' },   // Average of 'confidence' field
      minScore: { $min: '$score' },                 // Minimum score
      maxScore: { $max: '$score' },                 // Maximum score
    },
  },
]);
```

### Example: Average Comment Length (from accuracyTestService)

```javascript
const commentsWithLength = await CommunityComment.aggregate([
  { $match: { comment: { $exists: true, $ne: "" } } },            // Filter non-empty
  { $project: { length: { $strLenCP: "$comment" } } },            // Calculate string length
  { $group: { _id: null, avgLength: { $avg: "$length" } } },      // Average all lengths
]);
```

---

## Pre-save Hooks (Middleware)

Mongoose lets you run code automatically before or after saving a document.

### Example: Auto-calculate Comment Score (from Comments.js)

```javascript
communityCommentSchema.pre('save', function (next) {
  // 'this' refers to the document being saved
  const credibleVotes = this.expertVotes.filter(v => v.vote === 'credible').length;
  const notCredibleVotes = this.expertVotes.filter(v => v.vote === 'not_credible').length;
  this.score = credibleVotes - notCredibleVotes;    // Auto-calculated!
  next();  // Continue with the save
});
```

**Why pre-save hooks?** Every time a comment is saved (including when an expert votes on it), the score recalculates automatically. No controller needs to manually calculate it.

---

## `refPath` — Dynamic References

Sometimes a field can reference different collections depending on context.

```javascript
// In DebateComment model:
const debateCommentSchema = new mongoose.Schema({
  author:      { type: mongoose.Schema.Types.ObjectId, refPath: 'authorModel' },
  authorModel: { type: String, enum: ['NormalUser', 'CommunityUser', 'ExpertUser'] },
});
```

**What `refPath` does:** When Mongoose populates `author`, it looks at `authorModel` to know WHICH collection to query. If `authorModel` is `'ExpertUser'`, it queries the ExpertUser collection.

---

## Unique Indexes

```javascript
// From News model:
link: { type: String, required: true, unique: true }

// From TrendingNews model:
link: { type: String, required: true, unique: true }

// From AIVerdict model:
newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true, unique: true }
```

**Why `unique: true`?** MongoDB creates an index that prevents duplicate values. Two news articles can't have the same link, and there can only be one AI verdict per news article.

---

## Next Steps
Now you understand how data is structured and queried. Move on to [04 — Data Models](04-DATA-MODELS.md) to see every model in detail.
