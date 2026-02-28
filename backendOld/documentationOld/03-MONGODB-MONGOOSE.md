# 03 - MongoDB & Mongoose Fundamentals

## What You'll Learn
- MongoDB basics (collections, documents, queries)
- What is Mongoose and why use it
- Schema definition and validation
- Data types in Mongoose
- Relationships between documents
- Common Mongoose methods

---

## MongoDB Fundamentals

### What is MongoDB?

MongoDB is a **NoSQL document database** that stores data in flexible, JSON-like documents.

```
SQL Database (MySQL, PostgreSQL):
┌──────────────────────────────────────────────────────────┐
│  Table: users                                            │
├──────┬──────────┬─────────────────┬───────────────────────┤
│ id   │ name     │ email           │ bio                   │
├──────┼──────────┼─────────────────┼───────────────────────┤
│ 1    │ John     │ john@email.com  │ Developer             │
│ 2    │ Jane     │ jane@email.com  │ Designer              │
└──────┴──────────┴─────────────────┴───────────────────────┘
Fixed columns, every row must have same structure

MongoDB (NoSQL):
┌──────────────────────────────────────────────────────────┐
│  Collection: users                                       │
├──────────────────────────────────────────────────────────┤
│ {                                                        │
│   "_id": ObjectId("507f1f77bcf86cd799439011"),          │
│   "name": "John",                                        │
│   "email": "john@email.com",                             │
│   "bio": "Developer",                                    │
│   "skills": ["JavaScript", "Python"],  ← Array OK!      │
│   "profile": {                          ← Nested object! │
│     "avatar": "john.jpg",                                │
│     "verified": true                                     │
│   }                                                      │
│ }                                                        │
│ {                                                        │
│   "_id": ObjectId("507f1f77bcf86cd799439012"),          │
│   "name": "Jane",                                        │
│   "email": "jane@email.com"                              │
│   // No bio, skills, or profile - that's OK!            │
│ }                                                        │
└──────────────────────────────────────────────────────────┘
Flexible structure, documents can have different fields
```

### Key MongoDB Terminology

| SQL Term | MongoDB Term | Description |
|----------|--------------|-------------|
| Database | Database | Container for collections |
| Table | Collection | Container for documents |
| Row | Document | Single record (JSON object) |
| Column | Field | Key in document |
| Primary Key | _id | Unique identifier (auto-generated) |
| Foreign Key | Reference | ObjectId pointing to another document |
| JOIN | $lookup / populate | Combining data from multiple collections |

### ObjectId Explained

```javascript
// Every document in MongoDB has a unique _id field
// By default, it's an ObjectId - a 12-byte identifier

ObjectId("507f1f77bcf86cd799439011")
         └──────────────────────────┘
                  24 hex characters

// What's inside an ObjectId:
// Bytes 0-3:  Timestamp (when created)
// Bytes 4-6:  Machine identifier
// Bytes 7-8:  Process ID
// Bytes 9-11: Counter (incrementing random value)

// You can extract the timestamp:
const id = new ObjectId("507f1f77bcf86cd799439011");
console.log(id.getTimestamp()); // Date when document was created
```

---

## Mongoose: The ODM Layer

### What is Mongoose?

**Mongoose** is an ODM (Object Document Mapper) for MongoDB and Node.js. It provides:
- **Schemas** - Define structure for documents
- **Validation** - Ensure data meets requirements
- **Type casting** - Convert data types automatically
- **Middleware** - Run functions before/after operations
- **Population** - Fill in referenced documents

### Why Use Mongoose?

```javascript
// ❌ Without Mongoose (raw MongoDB driver):

const { MongoClient, ObjectId } = require('mongodb');

// Connect
const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const db = client.db('voxveritas');

// Insert - No validation!
await db.collection('users').insertOne({
  name: 123,        // Should be string! No error.
  email: 'invalid', // Not a real email! No error.
  age: 'twenty'     // Should be number! No error.
});

// Find by ID - Verbose!
const user = await db.collection('users').findOne({
  _id: new ObjectId('507f1f77bcf86cd799439011')
});



// ✅ With Mongoose:

const mongoose = require('mongoose');

// Define schema with validation
const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true  // Must be provided
  },
  email: { 
    type: String, 
    required: true,
    match: /^.+@.+$/  // Must be email format
  },
  age: { 
    type: Number,
    min: 0,
    max: 150
  }
});

const User = mongoose.model('User', userSchema);

// Insert - With validation!
await User.create({
  name: 123,        // Error! "Cast to string failed"
  email: 'invalid', // Error! "Failed validation"
  age: 'twenty'     // Error! "Cast to Number failed"
});

// Find by ID - Clean!
const user = await User.findById('507f1f77bcf86cd799439011');
```

---

## Schema Definition

### Basic Schema Structure

```javascript
// models/NormalUser.js

const mongoose = require('mongoose');

// Define the schema (blueprint for documents)
const normalUserSchema = new mongoose.Schema({
  // Field definitions go here
  fieldName: {
    type: DataType,
    // ... options
  }
});

// Create and export the model
module.exports = mongoose.model('NormalUser', normalUserSchema);
//                              ↑ Model name   ↑ Schema
// MongoDB will create collection called 'normalusers' (lowercased + pluralized)
```

### Real Example: NormalUser Schema

```javascript
const mongoose = require('mongoose');

const normalUserSchema = new mongoose.Schema({
  // ──────────────────────────────────────────
  // REQUIRED STRING FIELD
  // ──────────────────────────────────────────
  name: {
    type: String,     // Data type
    required: true,   // Cannot be empty/missing
  },
  // If someone tries to create user without name:
  // Error: "Path `name` is required."

  // ──────────────────────────────────────────
  // UNIQUE STRING FIELD
  // ──────────────────────────────────────────
  username: {
    type: String,
    required: true,
    unique: true,     // No duplicate usernames allowed
  },
  // If someone tries to create user with existing username:
  // Error: "E11000 duplicate key error"

  // ──────────────────────────────────────────
  // DEFAULT VALUE
  // ──────────────────────────────────────────
  role: {
    type: String,
    default: 'User',  // If not provided, use this value
  },

  // ──────────────────────────────────────────
  // NULLABLE FIELD
  // ──────────────────────────────────────────
  bio: {
    type: String,
    default: null,    // Optional, defaults to null
  },

  // ──────────────────────────────────────────
  // ARRAY OF STRINGS
  // ──────────────────────────────────────────
  interests: {
    type: [String],   // Array of strings
    default: null,
  },
  // Valid: ["tech", "news", "sports"]
  // Invalid: ["tech", 123, true] - will cast to strings

  // ──────────────────────────────────────────
  // ARRAY OF NUMBERS (Face Authentication)
  // ──────────────────────────────────────────
  faceEmbedding: {
    type: [Number],   // Array of 512 floating-point numbers
    default: null,
  },
  // Stores: [0.234, -0.892, 0.445, ..., 0.123]

  // ──────────────────────────────────────────
  // BOOLEAN WITH DEFAULT
  // ──────────────────────────────────────────
  hasFaceAuth: {
    type: Boolean,
    default: false,
  },

  // ──────────────────────────────────────────
  // DATE FIELDS
  // ──────────────────────────────────────────
  faceRegisteredAt: {
    type: Date,
    default: null,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,  // Function that returns current date
  },
  // Automatically set to current time when document created
});

module.exports = mongoose.model('NormalUser', normalUserSchema);
```

### Mongoose Data Types

| Type | JavaScript | Example |
|------|------------|---------|
| `String` | string | `"Hello"` |
| `Number` | number | `42`, `3.14` |
| `Boolean` | boolean | `true`, `false` |
| `Date` | Date | `new Date()` |
| `ObjectId` | ObjectId | `mongoose.Types.ObjectId` |
| `Array` | array | `[1, 2, 3]` |
| `Buffer` | Buffer | Binary data |
| `Mixed` | any | Anything (avoid if possible) |
| `Map` | Map | Key-value pairs |

---

## Document Relationships

### 1. References (ObjectId)

```javascript
// models/News.js

const newsSchema = new mongoose.Schema({
  title: String,
  description: String,
  
  // Reference to the user who uploaded
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,  // Stores an ObjectId
    ref: 'CommunityUser',  // Which model this ID refers to
    required: true,
  },
  
  // Array of references (multiple users who upvoted)
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityUser'
  }],
});

// What gets stored in MongoDB:
{
  "_id": ObjectId("..."),
  "title": "Breaking News",
  "uploadedBy": ObjectId("507f1f77bcf86cd799439011"),  // Just the ID!
  "upvotes": [
    ObjectId("507f1f77bcf86cd799439012"),
    ObjectId("507f1f77bcf86cd799439013")
  ]
}
```

### 2. Population (Fetching Referenced Documents)

```javascript
// ❌ Without population - just get IDs:
const news = await News.findById(newsId);
console.log(news.uploadedBy);  // ObjectId("507f1f77bcf86cd799439011")
// Not helpful - we want the user's name!


// ✅ With population - get full documents:
const news = await News.findById(newsId)
  .populate('uploadedBy', 'username name');
  //       ↑ field       ↑ which fields to include

console.log(news.uploadedBy);
// {
//   "_id": ObjectId("507f1f77bcf86cd799439011"),
//   "username": "john_doe",
//   "name": "John Doe"
// }

// Multiple populations:
const news = await News.findById(newsId)
  .populate('uploadedBy', 'username')
  .populate('upvotes', 'username');
```

**How Population Works:**

```
Step 1: Fetch news document
{
  "_id": "...",
  "title": "Breaking News",
  "uploadedBy": ObjectId("507f1f77...")
}

Step 2: Look up the ObjectId in CommunityUser collection
{
  "_id": ObjectId("507f1f77..."),
  "username": "john_doe",
  "name": "John Doe"
}

Step 3: Replace ObjectId with the document
{
  "_id": "...",
  "title": "Breaking News",
  "uploadedBy": {
    "_id": ObjectId("507f1f77..."),
    "username": "john_doe",
    "name": "John Doe"
  }
}
```

### 3. Dynamic References (refPath)

Sometimes a field can reference different collections:

```javascript
// models/DebateRoom.js

const DebateRoomSchema = new mongoose.Schema({
  title: String,
  
  // The creator can be any user type
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'creatorModel'  // Look at creatorModel to know which collection
  },
  
  creatorModel: {
    type: String,
    required: true,
    enum: ['NormalUser', 'CommunityUser', 'ExpertUser']  // Valid model names
  },
});

// Example documents:
// Created by NormalUser:
{
  "title": "Climate Debate",
  "creator": ObjectId("507f1f77..."),
  "creatorModel": "NormalUser"  // Population will look in NormalUser collection
}

// Created by ExpertUser:
{
  "title": "Medical Debate",
  "creator": ObjectId("608g2g88..."),
  "creatorModel": "ExpertUser"  // Population will look in ExpertUser collection
}

// Population works automatically:
const room = await DebateRoom.findById(id).populate('creator');
// Mongoose knows which collection to look in based on creatorModel
```

---

## Common Mongoose Methods

### Create (Insert)

```javascript
// Method 1: new + save()
const user = new User({
  name: 'John',
  email: 'john@email.com'
});
await user.save();  // Saves to database

// Method 2: create() - shorthand
const user = await User.create({
  name: 'John',
  email: 'john@email.com'
});

// Method 3: insertMany() - bulk insert
await User.insertMany([
  { name: 'John', email: 'john@email.com' },
  { name: 'Jane', email: 'jane@email.com' }
]);
```

### Read (Query)

```javascript
// Find all
const users = await User.find();

// Find with conditions
const admins = await User.find({ role: 'admin' });

// Find one
const user = await User.findOne({ email: 'john@email.com' });

// Find by ID
const user = await User.findById('507f1f77bcf86cd799439011');

// Find with selection (only get specific fields)
const user = await User.findById(id).select('name email');
// Returns: { _id: ..., name: 'John', email: 'john@email.com' }

// Find with sorting
const users = await User.find().sort({ createdAt: -1 });  // -1 = descending

// Find with pagination
const users = await User.find()
  .skip(10)   // Skip first 10
  .limit(10); // Get 10

// Find with complex conditions
const users = await User.find({
  age: { $gte: 18, $lte: 65 },  // 18 <= age <= 65
  role: { $in: ['user', 'admin'] },  // role is 'user' OR 'admin'
  $or: [
    { name: /john/i },  // name contains 'john' (case insensitive)
    { email: /john/i }  // OR email contains 'john'
  ]
});
```

### Update

```javascript
// Update one document
await User.updateOne(
  { _id: userId },  // Filter
  { $set: { name: 'New Name' } }  // Update
);

// Update multiple documents
await User.updateMany(
  { role: 'user' },  // Filter
  { $set: { active: true } }  // Update
);

// Find and update (returns the document)
const user = await User.findByIdAndUpdate(
  userId,
  { $set: { name: 'New Name' } },
  { new: true }  // Return updated document, not original
);

// Update operators:
await User.updateOne({ _id: userId }, {
  $set: { name: 'New Name' },      // Set field value
  $unset: { oldField: 1 },         // Remove field
  $inc: { loginCount: 1 },         // Increment number
  $push: { interests: 'coding' },  // Add to array
  $pull: { interests: 'sports' },  // Remove from array
  $addToSet: { tags: 'new' }       // Add to array if not exists
});
```

### Delete

```javascript
// Delete one
await User.deleteOne({ _id: userId });

// Delete many
await User.deleteMany({ role: 'spam' });

// Find and delete (returns deleted document)
const deleted = await User.findByIdAndDelete(userId);
```

---

## Schema Validation

### Built-in Validators

```javascript
const userSchema = new mongoose.Schema({
  // Required field
  name: {
    type: String,
    required: [true, 'Name is required']  // Custom error message
  },
  
  // String length validation
  username: {
    type: String,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  
  // Number range validation
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age seems unrealistic']
  },
  
  // Enum validation (must be one of these values)
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Verified', 'Fake'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Pending'
  },
  
  // Regex validation
  email: {
    type: String,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Invalid email format']
  },
  
  // Custom validator
  password: {
    type: String,
    validate: {
      validator: function(v) {
        // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
      },
      message: 'Password must be 8+ chars with uppercase, lowercase, and number'
    }
  }
});
```

### Nested Object Validation

```javascript
// models/Comments.js

const commentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true
  },
  
  // Array of objects with validation
  evidenceLinks: [{
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
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
  }],
});

// Valid:
{
  comment: "This is verified",
  evidenceLinks: [
    {
      url: "https://example.com/source",
      explanation: "Official government source confirms this"
    }
  ]
}

// Invalid:
{
  comment: "This is verified",
  evidenceLinks: [
    {
      url: "not-a-url",  // Error! Must be valid URL
      explanation: ""    // Error! Required
    }
  ]
}
```

---

## Middleware (Hooks)

Mongoose allows running functions before/after operations:

```javascript
const userSchema = new mongoose.Schema({...});

// Pre-save hook (runs BEFORE saving)
userSchema.pre('save', function(next) {
  // 'this' refers to the document being saved
  console.log('About to save:', this.name);
  
  // Example: Update timestamp
  this.updatedAt = new Date();
  
  next();  // Continue to save
});

// Post-save hook (runs AFTER saving)
userSchema.post('save', function(doc) {
  console.log('Saved successfully:', doc._id);
});

// Pre-find hook
userSchema.pre('find', function() {
  // 'this' is the query
  // Example: Always exclude deleted users
  this.where({ deleted: { $ne: true } });
});

// Real example from DebateRoomSchema:
DebateRoomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();  // Auto-update timestamp
  next();
});
```

---

## Indexes

Indexes speed up queries significantly:

```javascript
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,  // Creates unique index automatically
    index: true    // Creates regular index
  },
  username: {
    type: String,
    unique: true
  },
  createdAt: Date
});

// Compound index (for queries that filter by multiple fields)
userSchema.index({ role: 1, createdAt: -1 });
// 1 = ascending, -1 = descending

// Text index (for full-text search)
const newsSchema = new mongoose.Schema({
  title: String,
  description: String
});
newsSchema.index({ title: 'text', description: 'text' });

// Query with text search:
const results = await News.find({ 
  $text: { $search: 'climate change' } 
});
```

---

## Interview Questions & Answers

### Q1: What is the difference between SQL and MongoDB?
**Answer:**
| Aspect | SQL | MongoDB |
|--------|-----|---------|
| Data Model | Tables with rows and columns | Collections with documents (JSON) |
| Schema | Fixed, predefined schema | Flexible, dynamic schema |
| Relationships | JOINs between tables | References or embedded documents |
| Scaling | Vertical (bigger server) | Horizontal (more servers) |
| Transactions | Strong ACID support | Supports multi-document transactions |
| Best For | Complex relationships, reporting | Rapid development, hierarchical data |

### Q2: Why use Mongoose instead of the native MongoDB driver?
**Answer:** Mongoose provides:
1. **Schema validation** - Ensures data structure and types
2. **Type casting** - Automatically converts data types
3. **Middleware/hooks** - Run code before/after operations
4. **Population** - Easy way to fetch related documents
5. **Query building** - Chainable, readable query syntax
6. **Plugin system** - Extend functionality

### Q3: What is population in Mongoose?
**Answer:** Population is Mongoose's way of replacing ObjectId references with actual documents from other collections. It's similar to a SQL JOIN but happens at the application level. Example:
```javascript
// Instead of: { userId: ObjectId("...") }
// You get: { userId: { _id: "...", name: "John", email: "john@email.com" } }
```

### Q4: What is the difference between `ref` and `refPath`?
**Answer:**
- **`ref`**: Static reference to a single model. Example: `ref: 'User'` - always references the User collection.
- **`refPath`**: Dynamic reference where another field specifies which model to use. Example: `refPath: 'userType'` - looks at the `userType` field to determine which collection to query.

### Q5: How do you handle one-to-many relationships in MongoDB?
**Answer:** Two approaches:
1. **Embedding** (for small, bounded data):
   ```javascript
   { user: { comments: [{ text: "..." }, { text: "..." }] } }
   ```
2. **References** (for large, unbounded data):
   ```javascript
   // Comment collection
   { _id: ..., userId: ObjectId("..."), text: "..." }
   // Query: Comment.find({ userId: userId })
   ```

---

## Summary

- **MongoDB** stores data as flexible JSON-like documents
- **Mongoose** adds schema validation and helpful methods
- **Schemas** define document structure and validation rules
- **References** link documents using ObjectIds
- **Population** fetches referenced documents automatically
- **Indexes** speed up query performance
- **Middleware** runs code before/after database operations

---

**Next: [04-USER-MODELS.md](./04-USER-MODELS.md)** - Understanding user types and their schemas →
