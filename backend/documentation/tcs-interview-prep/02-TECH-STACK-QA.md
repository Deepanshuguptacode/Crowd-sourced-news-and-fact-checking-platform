# 02 — Tech Stack Q&A

> These are the most common "Why did you choose X?" questions in TCS technical rounds.

---

## Node.js

**Q: Why Node.js for the backend?**
A: Node.js uses a non-blocking, event-driven I/O model, which makes it excellent for handling many concurrent API requests without spawning a new thread for each. Since our platform has multiple users posting comments and fetching news simultaneously, Node's async architecture handles this efficiently. Also, using JavaScript on both frontend and backend reduces context-switching for developers.

**Q: What is the event loop in Node.js?**
A: Node.js is single-threaded. The event loop allows it to perform non-blocking I/O by offloading operations (like file reads or database queries) to the OS or worker threads, and when they complete, the callbacks are pushed to the event queue and executed. This is why we use `async/await` for all database calls in our controllers.

**Q: Difference between Node.js and Java for backend?**
A: Java is multi-threaded and synchronous by default, suited for CPU-intensive tasks. Node.js is single-threaded but non-blocking, better for I/O-intensive applications like REST APIs. For our use case — mostly database queries and external API calls — Node.js is a better fit and has faster development speed.

---

## Express.js

**Q: What is Express.js?**
A: Express is a minimal web framework for Node.js. It provides routing (mapping URLs to handler functions), middleware support (functions that run before request handlers), and utility methods for HTTP request/response. Without Express, we'd have to manually parse URLs, headers, and bodies from raw HTTP requests.

**Q: What is middleware in Express?**
A: Middleware are functions that receive `(req, res, next)` and can execute code, modify the request/response, or pass control to the next middleware. In our project, authentication middleware runs before every protected route — it checks the JWT token and attaches `req.user` before the controller runs.

```javascript
// Example: our authentication middleware
const authenticateCommunityUser = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'No token' });
  const decoded = jwt.verify(token, 'RAM');
  req.user = await CommunityUser.findById(decoded.id);
  next(); // passes control to controller
};
```

**Q: Difference between app.use() and app.get()?**
A: `app.use()` matches ALL HTTP methods and can match partial paths — used for mounting middleware and sub-routers. `app.get()` only matches GET requests at an exact path — used for specific route handlers.

---

## MongoDB

**Q: Why MongoDB over SQL (MySQL/PostgreSQL)?**
A:
1. **Flexible schema** — News articles have optional fields (screenshots, links), user types have different fields (expert has credentials, community has bio). In MongoDB, each document can have different fields without schema migrations.
2. **Document model** — Nested data like evidence links inside a comment is natural in JSON. SQL would require a separate table and JOINs.
3. **JavaScript compatibility** — MongoDB's JSON format works seamlessly with Node.js.
4. **Horizontal scaling** — MongoDB shards easily as data grows.

**Q: When would you NOT use MongoDB?**
A: When you need strong ACID transactions across multiple collections, complex relational queries, or strict data consistency guarantees. For example, a banking system would be better with PostgreSQL.

**Q: What are MongoDB collections?**
A: Collections are like SQL tables — they hold groups of related documents. We have collections like `news`, `communityusers`, `expertusers`, `comments`, `aiVerdicts`, etc.

**Q: What is an ObjectId in MongoDB?**
A: MongoDB's default primary key type. It's a 12-byte identifier: 4 bytes for timestamp, 5 bytes for random, 3 bytes for incrementing counter. This ensures globally unique IDs without a central sequence generator.

---

## Mongoose

**Q: What is Mongoose? Why use it?**
A: Mongoose is an ODM (Object Document Mapper) for MongoDB. It adds:
- **Schema validation** — ensures documents have required fields with correct types
- **Type casting** — converts strings to numbers automatically
- **Middleware hooks** — run code before/after save, find, etc.
- **Populate** — fill referenced documents (similar to SQL JOINs)
- **Static and instance methods** — add custom query methods to models

**Q: What is the difference between `find()` and `findOne()`?**
A: `find()` returns all matching documents (as array). `findOne()` returns the first matching document (as object) or null. We use `findOne({ email })` when checking if a user already exists during signup.

**Q: What is `.populate()` in Mongoose?**
A: Populate replaces a stored ObjectId reference with the actual document from another collection. Example:

```javascript
const comment = await CommunityComment.findById(id)
  .populate('commenter', 'username email');  // fills commenter with user data
```

This is equivalent to a SQL LEFT JOIN.

---

## JWT (JSON Web Tokens)

**Q: What is JWT and how does it work?**
A: JWT is a compact, self-contained token for securely transmitting information. Structure: `header.payload.signature` — all base64url encoded. The server signs the payload with a secret key. When a client sends the token back, the server verifies the signature to trust the payload without a database lookup.

**Q: Why JWT over sessions?**
A:
- **Stateless** — server doesn't store session data; scales horizontally
- **Cross-domain** — works with CORS (different frontend/backend origins)
- **Self-contained** — contains user ID and type; fewer DB queries
- **Mobile-friendly** — tokens work in Authorization headers for mobile apps

**Q: Is JWT secure?**
A: JWT is secure IF:
1. The secret key is long and random (our current code uses 'RAM' which is a dev shortcut — in production it should be `process.env.JWT_SECRET`)
2. `httpOnly: true` cookie prevents JavaScript from accessing the token (XSS protection)
3. Short expiry + refresh tokens are used
4. HTTPS is enforced (prevents MITM)

---

## bcrypt

**Q: What is bcrypt? Why not MD5/SHA256?**
A: bcrypt is a password hashing function designed to be slow (computationally expensive). MD5/SHA256 are fast — a GPU can compute billions of hashes per second, making brute force attacks feasible. bcrypt with cost factor 10 takes ~100ms, which is acceptable for a user but makes brute force impractical (10^9 times slower). It also adds a random salt per password, preventing rainbow table attacks.

**Q: What is salting?**
A: A salt is a random string added to the password before hashing. Even if two users have the same password, they get different hashes because the salts differ. bcrypt handles salting automatically.

---

## Google Gemini

**Q: What is an LLM? How does Gemini fit?**
A: A Large Language Model (LLM) is an AI trained on massive text data that can understand and generate human language. We use Gemini for two purposes:
1. **Text generation** — classify comments into groups, generate group labels, create fact-check verdicts
2. **Embeddings** — convert text to 768-dimensional numerical vectors representing semantic meaning

**Q: What is function calling in Gemini?**
A: Function calling allows Gemini to output structured JSON instead of free text. We define a function schema (like a JSON schema) and Gemini fills it in. This gives us reliable, parseable output for things like `{ verdict: "...", score: 87, confidence: 0.9 }`.

---

## Pinecone

**Q: What is a vector database? Why Pinecone?**
A: Traditional databases answer "find where username = 'alice'". Vector databases answer "find the most semantically similar text to this sentence". Pinecone stores embeddings (768-dim float arrays) and uses approximate nearest neighbor algorithms (like HNSW) to find similar vectors extremely fast — even across millions of records. We use it to match new comments to existing comment groups based on semantic meaning.

---

## Python/Flask (Face Auth)

**Q: Why a separate Flask microservice for face auth?**
A: InsightFace and ArcFace require Python with heavy ML dependencies (ONNX Runtime, OpenCV, numpy). These don't have Node.js bindings. HTTP decoupling keeps the Node.js backend lightweight. The Flask service runs on port 5000 and our Node.js backend calls it via Axios HTTP requests.
