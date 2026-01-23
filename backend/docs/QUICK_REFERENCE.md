# Backend Quick Reference Guide

## 🎯 Purpose

This is your go-to quick reference for common backend operations, patterns, and code snippets. Perfect for quick lookups while coding.

---

## 📦 Project Structure

```
backend/
├── index.js                 # Server entry point
├── package.json            # Dependencies
├── .env                    # Environment variables (secrets)
│
├── models/                 # Database schemas
│   ├── NormalUser.js
│   ├── CommunityUser.js
│   ├── ExpertUser.js
│   ├── News.js
│   ├── Comments.js
│   ├── DebateRoom.js
│   └── AIVerdict.js
│
├── controllers/            # Business logic
│   ├── UserController.js
│   ├── NewsController.js
│   ├── CommentsController.js
│   └── AIVerdictController.js
│
├── routes/                 # API endpoints
│   ├── userRoute.js
│   ├── NewsRoute.js
│   └── debateRoomRoute.js
│
├── middlewares/            # Request interceptors
│   └── authMiddleware.js
│
└── services/               # External integrations
    ├── llmService.js
    ├── faceAuthService.js
    └── trendingNewsScheduler.js
```

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Check status
curl http://localhost:3000/health
```

---

## 📡 Common HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| **200** | OK | Successful GET, PUT, PATCH |
| **201** | Created | Successful POST (resource created) |
| **400** | Bad Request | Invalid input, validation failed |
| **401** | Unauthorized | Missing/invalid authentication |
| **403** | Forbidden | Authenticated but not allowed |
| **404** | Not Found | Resource doesn't exist |
| **500** | Internal Server Error | Server-side error |

---

## 🗄️ Database Operations Cheat Sheet

### Create

```javascript
// Single document
const user = new User({ name: 'John', email: 'john@example.com' });
await user.save();

// Shorthand
const user = await User.create({ name: 'John', email: 'john@example.com' });
```

### Read

```javascript
// Find by ID
const user = await User.findById(userId);

// Find one by criteria
const user = await User.findOne({ email: 'john@example.com' });

// Find many
const users = await User.find({ role: 'admin' });

// Find with conditions
const users = await User.find({ age: { $gte: 18 } }); // Age >= 18

// Limit and sort
const users = await User.find()
  .sort({ createdAt: -1 })  // -1 = descending
  .limit(10);

// Select specific fields
const users = await User.find().select('name email'); // Only name and email
const users = await User.find().select('-password'); // Exclude password

// Populate references
const news = await News.findById(id).populate('uploadedBy');
```

### Update

```javascript
// Update one
await User.updateOne({ _id: userId }, { name: 'New Name' });

// Find and update (returns updated doc)
const user = await User.findByIdAndUpdate(
  userId,
  { name: 'New Name' },
  { new: true }  // Return updated document
);

// Update many
await User.updateMany({ role: 'user' }, { role: 'member' });

// Increment/decrement
await User.updateOne({ _id: userId }, { $inc: { loginCount: 1 } });

// Push to array
await News.updateOne({ _id: newsId }, { $push: { comments: commentId } });

// Pull from array
await News.updateOne({ _id: newsId }, { $pull: { comments: commentId } });
```

### Delete

```javascript
// Delete one
await User.deleteOne({ _id: userId });

// Find and delete (returns deleted doc)
const user = await User.findByIdAndDelete(userId);

// Delete many
await User.deleteMany({ isActive: false });
```

### Aggregation

```javascript
// Count documents
const count = await User.countDocuments({ role: 'admin' });

// Check if exists
const exists = await User.exists({ email: 'john@example.com' });

// Aggregation pipeline
const stats = await User.aggregate([
  { $match: { role: 'expert' } },
  { $group: { _id: '$expertise', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

---

## 🔐 Authentication Patterns

### Generate JWT

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: user._id, role: user.role },  // Payload
  process.env.JWT_SECRET,                 // Secret
  { expiresIn: '7d' }                     // Options
);
```

### Verify JWT

```javascript
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log(decoded.userId);
} catch (error) {
  // Invalid or expired token
}
```

### Hash Password

```javascript
const bcrypt = require('bcrypt');

// Hash
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// Verify
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Protected Route Pattern

```javascript
const { authenticateUser } = require('../middlewares/authMiddleware');

router.get('/protected', authenticateUser, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

---

## 🎨 Common Schema Patterns

### Basic Schema

```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, min: 0, max: 120 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
```

### Reference to Another Model

```javascript
const newsSchema = new mongoose.Schema({
  title: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // Reference to User model
  }
});

// Later, populate:
const news = await News.findById(id).populate('author');
```

### Array of Subdocuments

```javascript
const newsSchema = new mongoose.Schema({
  title: String,
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
});
```

### Pre-save Middleware

```javascript
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
```

---

## 🛣️ Route Patterns

### Basic Route

```javascript
const express = require('express');
const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### With Middleware

```javascript
router.post('/news', authMiddleware, async (req, res) => {
  // authMiddleware runs first
  // req.user is available
  const news = await News.create({
    ...req.body,
    uploadedBy: req.user._id
  });
  res.status(201).json({ news });
});
```

### With URL Parameters

```javascript
router.get('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});
```

### With Query Parameters

```javascript
router.get('/users', async (req, res) => {
  const { role, limit = 10 } = req.query;
  // GET /users?role=admin&limit=20
  
  const query = role ? { role } : {};
  const users = await User.find(query).limit(parseInt(limit));
  res.json({ users });
});
```

---

## 🎯 Controller Patterns

### Basic Controller

```javascript
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### With Validation

```javascript
exports.createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    // Check existing
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Create user
    const user = await User.create({ name, email, password });
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 🔧 Middleware Patterns

### Authentication Middleware

```javascript
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Logging Middleware

```javascript
const loggerMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};
```

### Error Handling Middleware

```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

// Use last in index.js:
app.use(errorHandler);
```

---

## 🌐 CORS Configuration

```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://yourproduction.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,  // Allow cookies
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 🔍 Mongoose Query Operators

### Comparison

```javascript
// Equals
{ age: 25 }

// Greater than / Greater than or equal
{ age: { $gt: 18 } }
{ age: { $gte: 18 } }

// Less than / Less than or equal
{ age: { $lt: 65 } }
{ age: { $lte: 65 } }

// Not equal
{ status: { $ne: 'deleted' } }

// In array
{ role: { $in: ['admin', 'moderator'] } }

// Not in array
{ role: { $nin: ['banned', 'suspended'] } }
```

### Logical

```javascript
// AND (implicit)
{ age: { $gte: 18 }, role: 'user' }

// OR
{ $or: [{ age: { $lt: 18 } }, { role: 'admin' }] }

// AND explicit
{ $and: [{ age: { $gte: 18 } }, { status: 'active' }] }

// NOT
{ age: { $not: { $lt: 18 } } }
```

### Array

```javascript
// Array contains value
{ tags: 'javascript' }

// Array contains all values
{ tags: { $all: ['javascript', 'node'] } }

// Array size
{ tags: { $size: 3 } }
```

### String

```javascript
// Regex match
{ name: { $regex: /john/i } }  // Case-insensitive

// Text search (requires text index)
{ $text: { $search: 'javascript tutorial' } }
```

---

## 📊 Aggregation Examples

### Count by Category

```javascript
const result = await News.aggregate([
  { $group: { 
      _id: '$category', 
      count: { $sum: 1 } 
  }},
  { $sort: { count: -1 } }
]);
```

### Average Score

```javascript
const result = await User.aggregate([
  { $group: { 
      _id: null, 
      avgScore: { $avg: '$score' } 
  }}
]);
```

### Top Contributors

```javascript
const result = await News.aggregate([
  { $group: { 
      _id: '$uploadedBy', 
      newsCount: { $sum: 1 } 
  }},
  { $sort: { newsCount: -1 } },
  { $limit: 10 },
  { $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'user'
  }}
]);
```

---

## 🐛 Common Debugging Commands

### Check MongoDB Connection

```javascript
mongoose.connection.on('connected', () => {
  console.log('✓ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('✗ MongoDB error:', err);
});
```

### Log Request Details

```javascript
app.use((req, res, next) => {
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  next();
});
```

### Check Environment Variables

```javascript
console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');
```

---

## ⚡ Performance Tips

### Use Lean Queries

```javascript
// Normal (returns Mongoose document with methods)
const users = await User.find();

// Lean (returns plain JavaScript object, faster)
const users = await User.find().lean();
```

### Select Only Needed Fields

```javascript
// Bad: Fetches everything
const users = await User.find();

// Good: Only needed fields
const users = await User.find().select('name email');
```

### Use Indexes

```javascript
// In schema:
userSchema.index({ email: 1 });
userSchema.index({ username: 1, email: 1 });  // Compound index
```

### Limit Results

```javascript
const users = await User.find()
  .limit(50)  // Max 50 results
  .skip(page * 50);  // Pagination
```

---

## 🔒 Security Checklist

- ✅ Use environment variables for secrets
- ✅ Hash passwords with bcrypt (10+ rounds)
- ✅ Validate all user input
- ✅ Use JWT with expiration
- ✅ Implement CORS properly
- ✅ Use HTTPS in production
- ✅ Set httpOnly cookies
- ✅ Sanitize database queries
- ✅ Rate limit API endpoints
- ✅ Don't expose error details in production

---

## 📝 Environment Variables Template

```env
# .env file
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/yourdb

# Authentication
JWT_SECRET=your_super_secret_key_change_this

# API Keys
GEMINI_API_KEY_1=your_api_key_here
GEMINI_API_KEY_2=your_api_key_here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Face Auth Service
FACE_AUTH_URL=http://localhost:5000
```

---

## 🧪 Testing with cURL

```bash
# GET request
curl http://localhost:3000/api/users

# POST request with JSON
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com"}'

# With authentication
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Upload file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/file.jpg"
```

---

## 📚 Useful Resources

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)
- [bcrypt Guide](https://www.npmjs.com/package/bcrypt)
- [MongoDB Query Operators](https://docs.mongodb.com/manual/reference/operator/query/)

---

**Bookmark this page for quick reference while coding!**
