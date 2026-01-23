# Backend Learning Roadmap

## 🎯 Purpose

This guide provides a structured learning path through the backend documentation, progressing from beginner to advanced topics. Follow this roadmap to build a solid understanding of the entire backend system.

---

## 📚 Learning Levels

### 🟢 Beginner Level (Foundation)
**Goal:** Understand basic concepts and simple request flow

### 🟡 Intermediate Level (Application)
**Goal:** Understand business logic and implement features

### 🔴 Advanced Level (Optimization)
**Goal:** Optimize, secure, and scale the application

---

## 🗺️ Complete Learning Path

### Phase 1: Foundation (Week 1)

#### Day 1-2: Architecture & Setup
**Read:**
1. [Overview & Architecture](./01-overview-architecture.md)
   - Understand MVC pattern
   - Learn technology stack
   - Grasp request flow

2. [Server Setup & Entry Point](./02-server-setup.md)
   - How Express server starts
   - Middleware configuration
   - CORS and security headers

**Practice:**
- Run the server locally
- Test the `/health` endpoint
- Modify PORT and see changes
- Add a custom middleware that logs requests

**Key Concepts to Master:**
- ✅ What is Express.js and how it works
- ✅ What is middleware and execution order
- ✅ How CORS works and why it's needed
- ✅ Environment variables and `.env` file

---

#### Day 3-4: Database Models
**Read:**
1. [Models Overview](./03-models-overview.md)
   - What are schemas and models
   - Mongoose basics
   - Relationships (embedded vs referenced)

2. [User Models](./04-user-models.md)
   - User types in the system
   - Password hashing with bcrypt
   - Face authentication fields

**Practice:**
- Open MongoDB Compass and explore collections
- Create a test user document manually
- Query users using MongoDB shell
- Understand the `_id` field

**Key Concepts to Master:**
- ✅ Mongoose Schema definition
- ✅ Field types and validators
- ✅ required, unique, default options
- ✅ ObjectId and references

**Exercises:**
```javascript
// Exercise 1: Create a simple schema
const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String },
  publishedAt: { type: Date, default: Date.now }
});

// Exercise 2: Query practice
// Find all users created in the last week
const recentUsers = await User.find({
  createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
});
```

---

#### Day 5-7: Authentication Flow
**Read:**
1. [User Controller](./09-user-controller.md)
   - Registration process
   - Login flow
   - JWT token generation
   - Password verification

2. [Authentication Middleware](./24-auth-middleware.md)
   - How JWT verification works
   - Protected routes
   - Token extraction from headers/cookies

**Practice:**
- Register a new user via API
- Login and receive JWT token
- Use token to access protected endpoint
- Try accessing without token (should fail)

**Key Concepts to Master:**
- ✅ bcrypt.hash() and bcrypt.compare()
- ✅ JWT structure and payload
- ✅ jwt.sign() and jwt.verify()
- ✅ req.user attachment in middleware

**Exercises:**
```javascript
// Exercise 1: Manually hash a password
const bcrypt = require('bcrypt');
const hashed = await bcrypt.hash('mypassword', 10);
console.log(hashed);

// Exercise 2: Create and decode JWT
const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: '123' }, 'secret', { expiresIn: '1h' });
const decoded = jwt.verify(token, 'secret');
console.log(decoded);

// Exercise 3: Test protected route
// Try accessing /profile without token
// Then with valid token
```

---

### Phase 2: Application Logic (Week 2)

#### Day 8-9: Routes & API Design
**Read:**
1. [Routes Overview](./14-routes-overview.md)
   - RESTful API principles
   - Route organization

2. [User Routes](./15-user-routes.md)
   - Route definition syntax
   - URL parameters and query strings
   - HTTP methods (GET, POST, PUT, DELETE)

**Practice:**
- Test all user endpoints with Postman/cURL
- Create a new route for fetching user profile
- Add query parameters for filtering

**Key Concepts to Master:**
- ✅ RESTful conventions (GET for read, POST for create)
- ✅ router.METHOD(path, middleware, controller)
- ✅ req.params vs req.query vs req.body
- ✅ Status codes (200, 201, 400, 401, 404, 500)

**Exercises:**
```javascript
// Exercise 1: Create a route with URL parameter
router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json({ user });
});

// Exercise 2: Create a route with query parameters
router.get('/users', async (req, res) => {
  const { role, limit = 10 } = req.query;
  // GET /users?role=admin&limit=5
});

// Exercise 3: Test with cURL
curl http://localhost:3000/users/507f1f77bcf86cd799439011
curl "http://localhost:3000/users?role=admin&limit=5"
```

---

#### Day 10-11: Controllers Deep Dive
**Read:**
1. [Controllers Overview](./08-controllers-overview.md)
2. [News Controller](./10-news-controller.md)
3. [Comments Controller](./11-comments-controller.md)

**Practice:**
- Submit a news article
- Add comments to news
- Vote on news/comments
- Understand voting logic

**Key Concepts to Master:**
- ✅ Controller responsibilities
- ✅ Error handling patterns
- ✅ Input validation
- ✅ Response formatting

**Exercises:**
```javascript
// Exercise 1: Create a controller with validation
exports.createArticle = async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // Validate
    if (!title || !content) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    
    // Create
    const article = await Article.create({ title, content });
    res.status(201).json({ article });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Exercise 2: Implement upvote logic
// Check if user already voted
// Add to upvotes array or remove if already there
```

---

#### Day 12-14: Complex Models & Relationships
**Read:**
1. [News & Content Models](./05-news-models.md)
2. [Debate System Models](./06-debate-models.md)
3. [AI & Verification Models](./07-ai-models.md)

**Practice:**
- Explore News model with comments
- Create debate rooms
- Understand comment grouping
- Query with population

**Key Concepts to Master:**
- ✅ Embedded documents vs references
- ✅ .populate() for references
- ✅ Array of subdocuments
- ✅ Virtual fields

**Exercises:**
```javascript
// Exercise 1: Query with population
const news = await News.findById(id)
  .populate('uploadedBy')
  .populate('comments');

// Exercise 2: Add to embedded array
await News.updateOne(
  { _id: newsId },
  { $push: { comments: commentId } }
);

// Exercise 3: Query subdocuments
const news = await News.findOne({
  'comments.userId': userId
});
```

---

### Phase 3: Services & Integrations (Week 3)

#### Day 15-16: AI Services
**Read:**
1. [Services Overview](./18-services-overview.md)
2. [AI Services](./19-ai-services.md)

**Practice:**
- Call Gemini AI API manually
- Understand prompt engineering
- Test comment classification
- Generate AI verdicts

**Key Concepts to Master:**
- ✅ Service layer pattern
- ✅ External API integration
- ✅ Error handling for external services
- ✅ API key management and rotation

**Exercises:**
```javascript
// Exercise 1: Test AI service
const llmService = new LLMService();
const result = await llmService.classifyComment(
  'This is a test comment',
  ['positive', 'negative', 'neutral']
);

// Exercise 2: Implement retry logic
async function callAIWithRetry(prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await aiService.call(prompt);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

---

#### Day 17-18: Face Authentication Service
**Read:**
1. [Face Authentication](./20-face-auth-service.md)

**Practice:**
- Test face registration
- Test face verification
- Understand embedding storage
- Handle service unavailability

**Key Concepts to Master:**
- ✅ Biometric authentication
- ✅ Face embeddings (numerical representation)
- ✅ HTTP service communication
- ✅ Graceful degradation

**Exercises:**
```javascript
// Exercise 1: Test face service
const faceService = new HttpFaceAuthService();
const isRunning = await faceService.isServiceRunning();

// Exercise 2: Compare embeddings (conceptual)
function compareEmbeddings(embedding1, embedding2) {
  // Calculate cosine similarity
  // If similarity > threshold: Same person
}
```

---

#### Day 19-21: Background Jobs & Schedulers
**Read:**
1. [Schedulers & Background Jobs](./23-schedulers.md)
2. [Comment Filtering](./21-comment-filtering.md)

**Practice:**
- Create a cron job
- Implement cleanup tasks
- Test scheduled jobs

**Key Concepts to Master:**
- ✅ Cron expressions
- ✅ Node-cron usage
- ✅ Background processing
- ✅ Database cleanup patterns

**Exercises:**
```javascript
// Exercise 1: Create simple cron job
const cron = require('cron');

const job = new cron.CronJob('0 0 * * *', async () => {
  console.log('Running daily cleanup');
  await cleanupOldData();
}, null, true, 'America/Los_Angeles');

// Exercise 2: Cleanup old records
async function cleanupOldData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await TempData.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
}
```

---

### Phase 4: Advanced Topics (Week 4)

#### Day 22-23: Security & Best Practices
**Read:**
1. [Security Best Practices](./25-security.md)
2. [Error Handling](./26-error-handling.md)

**Practice:**
- Implement rate limiting
- Add input sanitization
- Create custom error classes
- Test security vulnerabilities

**Key Concepts to Master:**
- ✅ SQL/NoSQL injection prevention
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Error logging

**Exercises:**
```javascript
// Exercise 1: Input sanitization
function sanitizeInput(input) {
  return input.replace(/[<>]/g, '');
}

// Exercise 2: Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// Exercise 3: Custom error class
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}
```

---

#### Day 24-25: Database Optimization
**Read:**
1. [Database Optimization](./27-database-optimization.md)

**Practice:**
- Add indexes to frequently queried fields
- Use explain() to analyze queries
- Implement pagination
- Optimize aggregation pipelines

**Key Concepts to Master:**
- ✅ Index creation and types
- ✅ Query optimization
- ✅ Aggregation pipelines
- ✅ Connection pooling

**Exercises:**
```javascript
// Exercise 1: Add index
userSchema.index({ email: 1, username: 1 });

// Exercise 2: Analyze query performance
const users = await User.find({ email: 'test@example.com' }).explain();

// Exercise 3: Implement pagination
async function paginateUsers(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const users = await User.find()
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await User.countDocuments();
  
  return {
    users,
    page,
    totalPages: Math.ceil(total / limit),
    total
  };
}
```

---

#### Day 26-28: API Best Practices & Testing
**Read:**
1. [API Best Practices](./28-api-best-practices.md)

**Practice:**
- Implement API versioning
- Add request validation
- Create comprehensive tests
- Document API with examples

**Key Concepts to Master:**
- ✅ RESTful conventions
- ✅ API versioning (/v1/, /v2/)
- ✅ Request validation (express-validator)
- ✅ Testing with Jest/Mocha

**Exercises:**
```javascript
// Exercise 1: API versioning
const v1Routes = require('./routes/v1');
const v2Routes = require('./routes/v2');

app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// Exercise 2: Request validation
const { body, validationResult } = require('express-validator');

router.post('/users',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... create user
  }
);

// Exercise 3: Simple unit test
describe('User Controller', () => {
  it('should create a user', async () => {
    const userData = { name: 'Test', email: 'test@example.com' };
    const user = await User.create(userData);
    expect(user.name).toBe('Test');
  });
});
```

---

## 🎯 Skill Checkpoints

### After Week 1 (Beginner)
You should be able to:
- ✅ Start and run the server
- ✅ Understand basic Express routing
- ✅ Create simple Mongoose models
- ✅ Implement basic authentication
- ✅ Test endpoints with cURL/Postman

### After Week 2 (Intermediate)
You should be able to:
- ✅ Design RESTful APIs
- ✅ Implement CRUD operations
- ✅ Handle relationships between models
- ✅ Write controllers with error handling
- ✅ Use middleware for authentication

### After Week 3 (Advanced Application)
You should be able to:
- ✅ Integrate external APIs
- ✅ Implement background jobs
- ✅ Handle file uploads
- ✅ Implement complex business logic
- ✅ Optimize database queries

### After Week 4 (Production Ready)
You should be able to:
- ✅ Secure the application
- ✅ Optimize performance
- ✅ Handle errors gracefully
- ✅ Write tests
- ✅ Deploy to production

---

## 📝 Practice Projects

### Project 1: Blog API (Beginner)
Build a simple blog API with:
- User registration/login
- Create, read, update, delete posts
- Comments on posts
- Like/unlike posts

### Project 2: E-commerce Backend (Intermediate)
Build an e-commerce API with:
- Product catalog with categories
- Shopping cart
- Order management
- Payment integration (mock)
- Admin dashboard

### Project 3: Social Media API (Advanced)
Build a social media API with:
- User profiles and connections
- Posts with images
- Real-time notifications
- Recommendation system
- Analytics dashboard

---

## 🔍 Debugging Checklist

When something doesn't work:
1. ✅ Check server logs in terminal
2. ✅ Verify environment variables are loaded
3. ✅ Check MongoDB connection
4. ✅ Verify request format (headers, body)
5. ✅ Check authentication token
6. ✅ Look at status codes in response
7. ✅ Use `console.log()` strategically
8. ✅ Test in Postman/cURL before frontend

---

## 📚 Additional Learning Resources

### Official Documentation
- [Node.js Docs](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)
- [MongoDB Manual](https://docs.mongodb.com/manual/)

### Video Tutorials (Recommended)
- freeCodeCamp: Node.js & Express Full Course
- Traversy Media: Node.js Crash Course
- Net Ninja: Node.js Tutorial for Beginners

### Books
- "Node.js Design Patterns" by Mario Casciaro
- "Express in Action" by Evan Hahn
- "MongoDB: The Definitive Guide"

### Practice Platforms
- [LeetCode](https://leetcode.com/) - Algorithm practice
- [HackerRank](https://www.hackerrank.com/) - Backend challenges
- [Exercism](https://exercism.org/) - Code practice with mentoring

---

## 🎓 Final Assessment

After completing this roadmap, you should be able to:

1. **Explain the flow of a request** from client to database and back
2. **Create a new feature** end-to-end (route → controller → service → model)
3. **Debug issues** effectively using logs and tools
4. **Optimize queries** and improve performance
5. **Secure endpoints** with proper authentication and validation
6. **Handle errors** gracefully with appropriate responses
7. **Integrate external services** (AI, payment, storage)
8. **Deploy to production** with confidence

---

## 🚀 Next Steps After Completion

1. **Contribute to Open Source**
   - Fix bugs in existing projects
   - Add features
   - Improve documentation

2. **Build Your Portfolio**
   - Create 3-5 complete backend projects
   - Deploy them publicly
   - Write blog posts about your learnings

3. **Learn Advanced Topics**
   - Microservices architecture
   - GraphQL
   - WebSockets for real-time features
   - Docker and Kubernetes
   - CI/CD pipelines

4. **Stay Updated**
   - Follow Node.js blog
   - Join communities (Reddit r/node, Discord servers)
   - Attend meetups and conferences
   - Read weekly newsletters (Node Weekly)

---

**Remember:** Learning to code is a marathon, not a sprint. Take your time, practice consistently, and don't hesitate to revisit topics. Happy coding! 🎉
