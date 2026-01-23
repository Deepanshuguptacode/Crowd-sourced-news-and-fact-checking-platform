# Part 2.1: Database Models Overview

## 🎯 Purpose

This document explains what database models are, why we use Mongoose, and how MongoDB schemas work in our application. This is the foundation for understanding how data is stored and retrieved.

## 📚 What are Models?

**Models** are JavaScript classes that represent collections in MongoDB. They:
- Define the structure of documents (like a template)
- Validate data before saving
- Provide methods to query the database
- Handle relationships between collections

Think of a model like a blueprint for a house - it defines what rooms exist, their sizes, and requirements.

## 🗄️ MongoDB vs. Traditional Databases

### Traditional SQL Database (like MySQL)

```sql
-- Fixed structure, must define columns upfront
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

-- Adding a new field requires ALTER TABLE
ALTER TABLE users ADD COLUMN age INT;
```

**Characteristics:**
- Rigid schema (must define structure first)
- Tables with rows and columns
- Relationships via foreign keys
- Good for structured data

### MongoDB (NoSQL)

```javascript
// Flexible structure, documents can vary
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John",
  "email": "john@example.com",
  "age": 25,
  // Can add fields dynamically
  "newField": "value"
}
```

**Characteristics:**
- Flexible schema (documents can have different fields)
- Collections with documents (like JSON)
- Embedded documents or references for relationships
- Good for unstructured/semi-structured data

## 🔧 Why Use Mongoose?

Mongoose is an **ODM (Object Data Modeling)** library for MongoDB. It provides:

### 1. **Schema Definition**
```javascript
// Without Mongoose (raw MongoDB)
db.collection('users').insertOne({
  name: 123,  // Oops! Should be string, but MongoDB allows it
  email: "invalid"  // No validation
});

// With Mongoose
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});
// Mongoose validates: "name must be a string!"
```

**Benefits:**
- Type checking
- Required field validation
- Data consistency

### 2. **Data Validation**
```javascript
const newsSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Fake'],  // Only these values allowed
    default: 'Pending'
  }
});

// Trying to save with invalid status:
news.status = 'Invalid';  // Mongoose will reject this!
```

### 3. **Relationships**
```javascript
// Reference to another document
uploadedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'CommunityUser'
}

// Later, can populate:
News.findById(id).populate('uploadedBy');
// Gets the full user object, not just the ID
```

### 4. **Middleware (Hooks)**
```javascript
// Run code before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
```

### 5. **Query Helpers**
```javascript
// Instead of complex MongoDB queries:
db.collection('users').find({ email: 'john@example.com' })

// Mongoose makes it cleaner:
User.findOne({ email: 'john@example.com' });
User.findById(userId);
User.updateOne({ _id: userId }, { name: 'New Name' });
```

## 🏗️ Schema Structure Basics

### Creating a Schema

```javascript
const mongoose = require('mongoose');

// Step 1: Define schema
const userSchema = new mongoose.Schema({
  // Field definitions go here
});

// Step 2: Create model from schema
const User = mongoose.model('User', userSchema);

// Step 3: Export for use in controllers
module.exports = User;
```

### Field Types

```javascript
const schema = new mongoose.Schema({
  // String
  name: { type: String, required: true },
  
  // Number
  age: { type: Number, min: 0, max: 120 },
  
  // Boolean
  isActive: { type: Boolean, default: true },
  
  // Date
  createdAt: { type: Date, default: Date.now },
  
  // Array of strings
  tags: [String],
  
  // Array of numbers
  scores: [Number],
  
  // Array of objects
  addresses: [{
    street: String,
    city: String,
    zipCode: Number
  }],
  
  // Reference to another model
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Mixed type (any data)
  metadata: mongoose.Schema.Types.Mixed
});
```

### Common Validators

```javascript
{
  // Required field
  email: { type: String, required: true },
  
  // Unique value (no duplicates)
  username: { type: String, unique: true },
  
  // Minimum and maximum
  age: { type: Number, min: 18, max: 100 },
  
  // String length
  bio: { type: String, maxlength: 500 },
  
  // Enum (predefined values)
  role: { type: String, enum: ['admin', 'user', 'guest'] },
  
  // Default value
  createdAt: { type: Date, default: Date.now },
  
  // Custom validator
  email: {
    type: String,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Invalid email format'
    }
  }
}
```

## 📋 Our Database Collections

### User-Related Collections

| Collection | Purpose | Key Features |
|------------|---------|--------------|
| **NormalUser** | Basic registered users | Face auth, interests, bio |
| **CommunityUser** | Active community members | Credibility score, contributions |
| **ExpertUser** | Verified experts | Expertise field, credentials, weight |
| **Admin** | Platform administrators | Moderation powers |

### Content Collections

| Collection | Purpose | Key Features |
|------------|---------|--------------|
| **News** | News articles | Status, votes, comments, verification |
| **TrendingNews** | Popular news items | View counts, engagement metrics |
| **Comments** | User comments on news | Stance, evidence links, expert votes |

### Debate System Collections

| Collection | Purpose | Key Features |
|------------|---------|--------------|
| **DebateRoom** | Debate spaces | Topic, participants, active status |
| **DebateGroup** | Debate teams | Leader, members, stance |
| **DebateComment** | Debate messages | Group association, stance |

### AI & Filtering Collections

| Collection | Purpose | Key Features |
|------------|---------|--------------|
| **AIVerdict** | AI fact-check results | Score, confidence, analysis |
| **CommentFilter** | Comment classification | Spam detection, off-topic filtering |
| **AccuracyTest** | Verification tests | Test results, accuracy metrics |

## 🔗 Relationships in MongoDB

### 1. Embedded Documents (Denormalization)

**When to use**: Data that belongs together and is frequently accessed together

```javascript
// Comments embedded in News
const newsSchema = new mongoose.Schema({
  title: String,
  comments: [{
    userId: ObjectId,
    text: String,
    createdAt: Date
  }]
});
```

**Advantages:**
- ✅ Fast reads (one query)
- ✅ Atomic updates (update news and comments together)

**Disadvantages:**
- ❌ Document size limits (16MB in MongoDB)
- ❌ Duplicate data if used elsewhere

### 2. References (Normalization)

**When to use**: Data that's shared across documents or frequently updated

```javascript
// News references User
const newsSchema = new mongoose.Schema({
  title: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityUser'
  }
});

// To get user data:
const news = await News.findById(id).populate('uploadedBy');
// news.uploadedBy now contains the full user object
```

**Advantages:**
- ✅ No duplication
- ✅ Easy to update (update user once)
- ✅ Smaller document sizes

**Disadvantages:**
- ❌ Slower reads (multiple queries)
- ❌ Need to populate

## 🎨 Schema Design Patterns

### Pattern 1: Polymorphic References (refPath)

**Problem**: A field can reference different models

```javascript
// Debate creator can be any user type
creator: {
  type: Schema.Types.ObjectId,
  refPath: 'creatorModel'  // Which model to use is in another field
},
creatorModel: {
  type: String,
  enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
}
```

**How it works:**
1. Store the ID in `creator`
2. Store the model name in `creatorModel`
3. Mongoose uses `creatorModel` to know which collection to populate from

### Pattern 2: Subdocuments with Validation

```javascript
evidenceLinks: [{
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);  // Must be valid URL
      },
      message: 'Evidence link must be a valid URL'
    }
  },
  explanation: {
    type: String,
    required: true,
    maxlength: 500
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}]
```

**Benefits:**
- Each evidence link has its own validation
- Structured data within array
- Easy to query and filter

### Pattern 3: Calculated Fields with Middleware

```javascript
// Define fields
upvoteCount: { type: Number, default: 0 },
downvoteCount: { type: Number, default: 0 },
score: { type: Number, default: 0 },

// Auto-calculate before saving
schema.pre('save', function(next) {
  this.score = this.upvoteCount - this.downvoteCount;
  next();
});
```

**Why do this:**
- Consistency: Score always matches counts
- Performance: Pre-calculated for sorting
- Simplicity: Don't calculate every time

## 🔍 Indexing for Performance

### What are Indexes?

Think of a book index - instead of reading every page to find "MongoDB", you look in the index and jump to the right page.

### Creating Indexes

```javascript
// Single field index
username: { type: String, unique: true }  // Automatically creates index

// Compound index (multiple fields)
schema.index({ newsId: 1, createdAt: -1 });
// 1 = ascending, -1 = descending

// Text index for search
schema.index({ title: 'text', description: 'text' });
```

### When to Use Indexes

**Use indexes on:**
- ✅ Fields in WHERE clauses
- ✅ Fields used for sorting
- ✅ Unique fields
- ✅ Foreign keys (references)

**Don't overuse:**
- ❌ Every field (slows inserts/updates)
- ❌ Fields rarely queried
- ❌ Small collections (< 1000 docs)

## 💾 Document Structure Example

### Raw MongoDB Document (News)

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "title": "Breaking News: Climate Change Report",
  "description": "New study reveals...",
  "link": "https://example.com/news/123",
  "screenshots": [
    "https://storage.com/screenshot1.jpg",
    "https://storage.com/screenshot2.jpg"
  ],
  "status": "Pending",
  "uploadedBy": ObjectId("507f191e810c19729de860ea"),
  "uploadedAt": ISODate("2026-01-23T10:00:00Z"),
  "comments": [
    ObjectId("507f191e810c19729de860eb"),
    ObjectId("507f191e810c19729de860ec")
  ],
  "upvotes": [
    ObjectId("507f191e810c19729de860ed"),
    ObjectId("507f191e810c19729de860ee")
  ],
  "downvotes": [
    ObjectId("507f191e810c19729de860ef")
  ]
}
```

### How Mongoose Represents It

```javascript
{
  _id: '507f1f77bcf86cd799439011',
  title: 'Breaking News: Climate Change Report',
  description: 'New study reveals...',
  link: 'https://example.com/news/123',
  screenshots: [
    'https://storage.com/screenshot1.jpg',
    'https://storage.com/screenshot2.jpg'
  ],
  status: 'Pending',
  uploadedBy: {  // Populated
    _id: '507f191e810c19729de860ea',
    username: 'john_doe',
    email: 'john@example.com'
  },
  uploadedAt: 2026-01-23T10:00:00.000Z,
  comments: [  // Can be populated
    { /* comment object */ },
    { /* comment object */ }
  ],
  upvotes: [  // Array of IDs or populated users
    '507f191e810c19729de860ed',
    '507f191e810c19729de860ee'
  ],
  downvotes: [
    '507f191e810c19729de860ef'
  ]
}
```

## 🎓 Key Learning Points

### 1. Schema Definition
- Define structure before saving data
- Mongoose validates against schema
- Types, validators, defaults

### 2. Relationships
- **Embedded**: Fast, but limited size
- **Referenced**: Flexible, but requires populate

### 3. Validation
- Required fields
- Type checking
- Custom validators
- Enum values

### 4. Indexes
- Speed up queries
- Applied to frequently accessed fields
- Balance between read and write performance

### 5. Middleware
- Pre/post hooks for save, update, delete
- Auto-calculate fields
- Hash passwords
- Validate complex logic

## 🔗 Next Documents

Now that you understand model basics:
1. Read [User Models](./04-user-models.md) for authentication details
2. Study [News & Content Models](./05-news-models.md) for content structure
3. Explore [Debate System Models](./06-debate-models.md) for debate features
4. Review [AI & Verification Models](./07-ai-models.md) for AI integration

## 📚 Common MongoDB Operations

```javascript
// Create
const user = new User({ name: 'John', email: 'john@example.com' });
await user.save();

// Read one
const user = await User.findById(userId);
const user = await User.findOne({ email: 'john@example.com' });

// Read many
const users = await User.find({ role: 'admin' });
const users = await User.find().sort({ createdAt: -1 }).limit(10);

// Update
await User.updateOne({ _id: userId }, { name: 'New Name' });
await User.findByIdAndUpdate(userId, { name: 'New Name' }, { new: true });

// Delete
await User.deleteOne({ _id: userId });
await User.findByIdAndDelete(userId);

// Count
const count = await User.countDocuments({ role: 'admin' });

// Exists
const exists = await User.exists({ email: 'john@example.com' });
```

---

**Key Takeaway**: Models are blueprints for your data. Mongoose adds structure, validation, and helpful methods to raw MongoDB, making your application more robust and easier to maintain.
