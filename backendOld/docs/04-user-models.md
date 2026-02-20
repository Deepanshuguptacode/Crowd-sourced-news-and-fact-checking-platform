# Part 2.2: User Models - Authentication & User Types

## 🎯 Purpose

This document explains the different user types in our system, how authentication works, and why we have multiple user models. You'll learn about password hashing, face authentication, and user roles.

## 👥 Why Multiple User Types?

Our platform has different user roles with different capabilities:

| User Type | Purpose | Special Features |
|-----------|---------|------------------|
| **NormalUser** | Basic registered users | Face auth, interests, general access |
| **CommunityUser** | Active participants | Submit news, comment, credibility tracking |
| **ExpertUser** | Verified experts | Higher voting weight, lead debates |
| **Admin** | Platform moderators | Manage users, content moderation |

**Why not one "User" model with a role field?**
- Each type has unique fields and relationships
- Clearer code organization
- Easier to add type-specific features
- Better database performance (no unused fields)

## 📝 NormalUser Model

### File: `models/NormalUser.js`

This is the basic user account for the platform.

### Complete Code with Explanations

```javascript
const mongoose = require('mongoose');
```
**What it does:** Imports Mongoose for schema creation
**Why we need it:** All models use Mongoose to define structure

```javascript
const normalUserSchema = new mongoose.Schema({
```
**What it does:** Creates a new schema definition
**Why this syntax:** `new mongoose.Schema({})` creates the blueprint for documents

### Field 1: Name

```javascript
  name: {
    type: String,
    required: true,
  },
```

**What it does:** Stores user's display name
**Options explained:**
- `type: String`: Must be text
- `required: true`: Cannot create user without name

**Why required:** Need to display user identity in the UI

### Field 2: Username

```javascript
  username: {
    type: String,
    required: true,
    unique: true,
  },
```

**What it does:** Unique identifier for login
**Options explained:**
- `unique: true`: No two users can have same username
  - Mongoose creates an index automatically
  - Database rejects duplicates

**Example:**
```javascript
// First user
{ username: "john_doe" }  // ✓ Saved

// Second user tries same username
{ username: "john_doe" }  // ✗ Error: duplicate key
```

**Important Detail:** Unique constraint is at database level, not just application level

### Field 3: Role

```javascript
  role: {
    type: String,
    default: 'User',
  },
```

**What it does:** Identifies user type
**Options explained:**
- `default: 'User'`: If no role provided, set to 'User'

**Note in code:** Comment says "Should be 'Normal'" - this is a TODO item indicating the default should probably be 'Normal' for clarity

### Field 4: Email

```javascript
  email: {
    type: String,
    required: true,
    unique: true,
  },
```

**What it does:** User's email address
**Why required and unique:**
- Required: Need for account recovery, notifications
- Unique: One account per email prevents abuse

**Used for:**
- Login (alternative to username)
- Password reset
- Notifications
- Account verification

### Field 5: Password

```javascript
  password: {
    type: String,
    required: true,
  },
```

**What it does:** Stores hashed password
**Critical Security Point:** NEVER store plain text passwords!

**Password Flow:**
```javascript
// User registers with:
password: "mySecretPass123"

// Before saving, controller hashes it:
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
// Becomes: "$2b$10$XpE..."

// Saved in database:
password: "$2b$10$XpE..."
```

**Why hash passwords:**
1. If database is compromised, attackers can't see passwords
2. Even admins can't see user passwords
3. Industry standard security practice

**Verification later:**
```javascript
// User logs in with: "mySecretPass123"
const isMatch = await bcrypt.compare("mySecretPass123", user.password);
// true if correct, false if wrong
```

### Field 6: Bio

```javascript
  bio: {
    type: String,
    default: null,
  },
```

**What it does:** Optional user description
**Options explained:**
- `default: null`: Empty by default (not required)

**Example:**
```javascript
{
  bio: "Passionate about fact-checking and truth in media."
}
```

**Why optional:** Not all users want to fill this out

### Field 7: Interests

```javascript
  interests: {
    type: [String],
    default: null,
  },
```

**What it does:** Array of user interests/topics
**Type explained:**
- `[String]`: Array of strings
- `[]`: Square brackets indicate array

**Example:**
```javascript
{
  interests: ["politics", "science", "technology"]
}
```

**Use cases:**
- Personalized news feed
- Recommend relevant debates
- Match users with similar interests

**Array methods work:**
```javascript
user.interests.push("environment");  // Add interest
user.interests.filter(i => i !== "politics");  // Remove interest
```

## 🔐 Face Authentication Fields

Our platform uses biometric authentication as an additional security layer.

### Field 8: Face Embedding

```javascript
  faceEmbedding: {
    type: [Number],
    default: null,
  },
```

**What it does:** Stores numerical representation of user's face
**Type explained:**
- `[Number]`: Array of numbers
- Example: [0.234, -0.892, 0.445, ...]

**How face recognition works:**
1. User takes photo during registration
2. AI extracts features (eyes, nose, face shape)
3. Converts to 128 or 512 numbers (embedding)
4. Numbers stored in database
5. During login, compare new photo's embedding with stored one

**Why array of numbers:**
- Mathematical representation
- Can calculate similarity (distance between embeddings)
- Privacy: Can't reconstruct face from numbers

**Example:**
```javascript
{
  faceEmbedding: [
    0.234, -0.892, 0.445, 0.123, -0.567,
    // ... 123 more numbers
  ]
}
```

**Comparison:**
```javascript
// Calculate distance between two embeddings
function cosineSimilarity(embedding1, embedding2) {
  // Mathematical formula
  // If distance < threshold: Same person
  // If distance > threshold: Different person
}
```

### Field 9: Face Registered Date

```javascript
  faceRegisteredAt: {
    type: Date,
    default: null,
  },
```

**What it does:** Timestamp of when face was registered
**Why we track this:**
- Audit trail
- Know when to re-verify
- Security logging

**Example:**
```javascript
{
  faceRegisteredAt: ISODate("2026-01-23T10:30:00Z")
}
```

### Field 10: Has Face Auth

```javascript
  hasFaceAuth: {
    type: Boolean,
    default: false,
  },
```

**What it does:** Quick check if user has face auth enabled
**Why needed:**
- Fast query: "Show users without face auth"
- Conditional login flow
- UI display ("Enable Face Auth" button)

**Usage in controller:**
```javascript
if (user.hasFaceAuth) {
  // Require face verification
} else {
  // Only password verification
}
```

### Field 11: Created At

```javascript
  createdAt: {
    type: Date,
    default: Date.now,
  },
```

**What it does:** Auto-records account creation time
**Default explained:**
- `Date.now`: Function reference (not called yet)
- Mongoose calls it when document is created

**Why Date.now not Date.now():**
```javascript
// WRONG:
default: Date.now()  // Executes immediately when schema is defined

// CORRECT:
default: Date.now  // Executes when document is created
```

**Use cases:**
- Sort users by registration date
- Show "Member since..."
- Calculate account age

### Export the Model

```javascript
module.exports = mongoose.model('NormalUser', normalUserSchema);
```

**What it does:** Creates and exports the model
**Breaking it down:**
```javascript
mongoose.model(
  'NormalUser',       // Model name (used in refs)
  normalUserSchema    // Schema to use
)
```

**This creates:**
- Model class with query methods
- Collection in MongoDB named `normalusers` (lowercase, pluralized)
- Can import in other files: `const NormalUser = require('./models/NormalUser');`

## 🔄 User Registration Flow

Let's trace a complete user registration:

### Step 1: Frontend sends data

```javascript
POST /users/register
{
  "name": "John Doe",
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "interests": ["technology", "science"]
}
```

### Step 2: Controller receives request

```javascript
// File: controllers/UserController.js
const NormalUser = require('../models/NormalUser');
const bcrypt = require('bcrypt');

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);
```

**bcrypt.hash() explained:**
```javascript
bcrypt.hash(
  password,  // Plain text password
  10        // Salt rounds (higher = more secure, slower)
)
```

**Salt rounds:**
- 10 rounds: ~100ms (recommended)
- 12 rounds: ~400ms (very secure)
- 15 rounds: ~3 seconds (excessive)

### Step 3: Create user document

```javascript
const newUser = new NormalUser({
  name: "John Doe",
  username: "john_doe",
  email: "john@example.com",
  password: hashedPassword,
  interests: ["technology", "science"]
  // Other fields get defaults:
  // role: 'User'
  // hasFaceAuth: false
  // createdAt: <current time>
});
```

### Step 4: Save to database

```javascript
await newUser.save();
```

**What save() does:**
1. Validates all fields against schema
2. Checks required fields exist
3. Checks unique constraints (username, email)
4. Runs pre-save middleware (if any)
5. Inserts document into MongoDB
6. Returns saved document with `_id`

**If validation fails:**
```javascript
try {
  await newUser.save();
} catch (error) {
  if (error.code === 11000) {
    // Duplicate key error (username or email exists)
    return res.status(400).json({ error: 'Username already exists' });
  }
  if (error.name === 'ValidationError') {
    // Missing required field or wrong type
    return res.status(400).json({ error: error.message });
  }
}
```

### Step 5: MongoDB document created

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "John Doe",
  "username": "john_doe",
  "role": "User",
  "email": "john@example.com",
  "password": "$2b$10$XpE.../8TgG...",
  "bio": null,
  "interests": ["technology", "science"],
  "faceEmbedding": null,
  "faceRegisteredAt": null,
  "hasFaceAuth": false,
  "createdAt": ISODate("2026-01-23T10:30:00Z")
}
```

## 🔑 Authentication Flow

### Login Process

```javascript
// Step 1: Find user by username or email
const user = await NormalUser.findOne({ 
  $or: [{ username }, { email }] 
});

if (!user) {
  return res.status(401).json({ error: 'User not found' });
}

// Step 2: Compare passwords
const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
  return res.status(401).json({ error: 'Invalid password' });
}

// Step 3: Check if face auth required
if (user.hasFaceAuth) {
  // Require face verification
  return res.json({ 
    requiresFaceAuth: true,
    userId: user._id 
  });
}

// Step 4: Generate JWT token
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Step 5: Send token to client
res.json({ 
  success: true, 
  token,
  user: {
    id: user._id,
    name: user.name,
    username: user.username
  }
});
```

### Understanding bcrypt.compare()

```javascript
await bcrypt.compare(plainPassword, hashedPassword)
```

**What it does:**
1. Takes plain text password from login
2. Extracts salt from stored hash
3. Hashes plain password with same salt
4. Compares results
5. Returns true if match, false if not

**Example:**
```javascript
// Stored hash:
"$2b$10$XpE.../8TgG..."

// User types:
"securePassword123"

// bcrypt.compare:
1. Extract salt: "$2b$10$XpE..."
2. Hash input with salt: "$2b$10$XpE.../8TgG..."
3. Compare: Matches! Return true
```

## 🎭 Different User Types Comparison

### CommunityUser (Brief Overview)

```javascript
const communityUserSchema = new mongoose.Schema({
  // Same as NormalUser plus:
  credibilityScore: { type: Number, default: 0 },
  contributions: { type: Number, default: 0 },
  newsSubmitted: [{ type: ObjectId, ref: 'News' }],
  // Can submit news and have credibility tracked
});
```

### ExpertUser (Brief Overview)

```javascript
const expertUserSchema = new mongoose.Schema({
  // Same as NormalUser plus:
  expertise: { type: String, required: true },  // "Journalism", "Politics"
  credentials: { type: String },
  verificationStatus: { type: String, enum: ['pending', 'verified'] },
  votingWeight: { type: Number, default: 1.5 },  // More influential votes
  // Experts have higher authority in fact-checking
});
```

### Admin (Brief Overview)

```javascript
const adminSchema = new mongoose.Schema({
  // Same as NormalUser plus:
  permissions: [{ type: String }],  // ['moderate', 'ban_users', 'verify_experts']
  // Can manage platform
});
```

## 🎓 Key Learning Points

### 1. Schema Design
- **required: true**: Field must be provided
- **unique: true**: No duplicates allowed
- **default**: Value if not provided
- **type**: Data type validation

### 2. Security
- **Never store plain passwords**: Always hash with bcrypt
- **Use strong salts**: 10+ rounds recommended
- **JWT tokens**: Stateless authentication
- **Face embeddings**: Privacy-preserving biometrics

### 3. Validation
- Mongoose validates before saving
- Unique constraints at database level
- Custom validators for complex rules

### 4. Relationships
- Can reference other models with ObjectId
- Use `ref` to enable population
- Multiple user types for different capabilities

## 🔗 Related Files

- **Controllers**: `controllers/UserController.js` - Registration and login logic
- **Routes**: `routes/userRoute.js` - API endpoints
- **Middleware**: `middlewares/authMiddleware.js` - JWT verification
- **Services**: `services/faceAuthService.js` - Face authentication

## 📚 Next Steps

Continue learning about:
1. [News & Content Models](./05-news-models.md) - How news articles are stored
2. [User Controller](./09-user-controller.md) - Registration and authentication logic
3. [Authentication Middleware](./24-auth-middleware.md) - How JWT tokens work

---

**Key Takeaway**: User models define the structure of user accounts. Security features like password hashing and face authentication are implemented at the model and controller level, with the schema providing the data structure foundation.
