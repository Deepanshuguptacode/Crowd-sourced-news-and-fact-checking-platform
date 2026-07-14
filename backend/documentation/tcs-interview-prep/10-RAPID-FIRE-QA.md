# 10 — Rapid Fire Q&A (One-Liners)

> Scan these before entering the interview room. These are quick-recall answers for lightning-round questions.

---

## Project Basics

| Question | Quick Answer |
|---------|-------------|
| What is VoxVeritas? | Crowd-sourced news fact-checking platform with AI credibility verdicts |
| Tech stack? | Node.js + Express + MongoDB + Pinecone + Google Gemini + Python Flask |
| How many user types? | 4: Normal, Community, Expert, Admin |
| What does the AI do? | Groups similar comments semantically + generates credibility verdicts (0-100 score) |
| What is Pinecone? | Cloud vector database for semantic similarity search on comment embeddings |
| What is an embedding? | A numerical vector (768 floats) representing the semantic meaning of text |
| What face recognition model? | ArcFace via InsightFace library (Python Flask microservice) |
| Face embedding dimensions? | 512 |
| Text embedding dimensions? | 768 (gemini-embedding-001) |
| How many Gemini API keys? | 3, rotate every 5 requests |
| Trending news scrape interval? | Every 10 minutes via cron job |
| Max news articles stored? | 40 (cleaned up hourly) |
| Max trending articles? | 50 (cleaned up post-scrape) |

---

## Node.js / JavaScript

| Question | Quick Answer |
|---------|-------------|
| What is Node.js? | JavaScript runtime built on Chrome's V8 engine for server-side JS |
| Synchronous vs asynchronous? | Sync blocks until complete; async yields to event loop while waiting |
| What is the event loop? | Mechanism that allows Node to handle async I/O on a single thread |
| What is a Promise? | An object representing the eventual completion or failure of an async operation |
| async/await vs .then()? | async/await is syntactic sugar over Promises; more readable sequential code |
| What is a callback? | A function passed to another function to be called when an operation completes |
| What is callback hell? | Deeply nested callbacks making code unreadable; solved by Promises/async-await |
| What does require() do? | Loads a module; cached after first load (CommonJS module system) |
| What is module.exports? | What a Node.js file exposes when required by another file |
| Difference: var, let, const? | var: function-scoped, hoisted; let: block-scoped; const: block-scoped, can't reassign |
| What is closure? | A function that retains access to its outer scope even after the outer function returns |
| What is == vs ===? | ==: loose equality (type coercion); ===: strict equality (same type + value) |
| What is null vs undefined? | null: intentionally empty; undefined: variable declared but not assigned |
| What is the spread operator? | ... spreads elements of an iterable: `[...arr1, ...arr2]` |
| What is destructuring? | `const { name, email } = user` — extract object/array values |

---

## Express.js

| Question | Quick Answer |
|---------|-------------|
| What is middleware? | Function with (req, res, next) that runs before route handlers |
| What is routing? | Mapping HTTP method + URL to a handler function |
| What does next() do? | Passes control to the next middleware in the chain |
| How do you handle errors in Express? | Error-handling middleware with 4 params: (err, req, res, next) |
| What is req.params? | URL path parameters: `/users/:id` → `req.params.id` |
| What is req.query? | URL query string: `?page=2` → `req.query.page` |
| What is req.body? | Request body (for POST/PUT), requires `express.json()` middleware |
| What is cors()? | Middleware to allow cross-origin requests |

---

## MongoDB & Mongoose

| Question | Quick Answer |
|---------|-------------|
| What is NoSQL? | Non-relational DB; documents instead of rows+tables |
| What is a collection? | Group of MongoDB documents (like a SQL table) |
| What is ObjectId? | MongoDB's 12-byte unique identifier for documents |
| What is Mongoose? | ODM for MongoDB — adds schemas, validation, populate |
| What is .populate()? | Replaces ObjectId references with actual documents (like SQL JOIN) |
| What is findOneAndUpdate()? | Find one document, update it, optionally return new/old doc |
| What is upsert? | Update if exists, insert if not |
| What is $in operator? | Matches documents where field value is in an array: `{ _id: { $in: ids } }` |
| What is $or operator? | Matches documents satisfying any of the conditions |
| What is .lean()? | Returns plain JS objects instead of Mongoose documents (faster for read-only) |
| What is a schema? | Blueprint defining structure, types, and validation for documents |
| What is a TTL index? | Index that automatically deletes documents after a set time |

---

## Authentication & Security

| Question | Quick Answer |
|---------|-------------|
| What is JWT? | JSON Web Token — signed token encoding user identity, used for stateless auth |
| JWT structure? | header.payload.signature (base64url encoded) |
| What is bcrypt? | One-way password hashing function with built-in salt and configurable cost |
| What is a salt? | Random data added to password before hashing to prevent rainbow table attacks |
| What is httpOnly cookie? | Cookie inaccessible to JavaScript, preventing XSS token theft |
| What is XSS? | Cross-Site Scripting — injecting malicious JS into a web page |
| What is CSRF? | Cross-Site Request Forgery — tricking browser into sending authenticated requests |
| What is sameSite cookie? | Attribute restricting when cookie is sent cross-site (prevents CSRF) |
| Authentication vs authorization? | Auth = who are you; Authorization = what can you do |
| What is HTTPS? | HTTP over TLS/SSL — encrypted communication |
| What is OWASP? | Open Web Application Security Project — publishes Top 10 web vulnerabilities |
| What is SQL injection? | Inserting SQL code into input to manipulate queries (N/A in MongoDB) |

---

## AI/ML Concepts

| Question | Quick Answer |
|---------|-------------|
| What is an LLM? | Large Language Model — deep learning model for understanding/generating text |
| What is Gemini? | Google's multimodal LLM family (text, code, images) |
| What is function calling in LLMs? | LLM returns structured JSON matching a defined schema instead of free text |
| What is a vector? | A list of numbers representing a point in multi-dimensional space |
| What is semantic similarity? | How close two texts are in meaning (not just word match) |
| What is cosine similarity? | Measures angle between vectors (1=identical, 0=unrelated) |
| What is RAG? | Retrieval-Augmented Generation — fetch relevant docs before LLM generates answer |
| What is HNSW? | Hierarchical Navigable Small World — approximate nearest neighbor algorithm used by Pinecone |
| What is ArcFace? | State-of-the-art face recognition model that produces 512-dim embeddings |
| What is InsightFace? | Python library implementing ArcFace and other face analysis models |
| What is rate limiting? | Restricting number of requests per time period to prevent abuse |
| What is exponential backoff? | Retry strategy where wait time increases exponentially after each failure |

---

## System Design One-Liners

| Question | Quick Answer |
|---------|-------------|
| What is REST? | Architectural style using HTTP methods + resource URLs for APIs |
| What is horizontal scaling? | Adding more servers (vs vertical = bigger server) |
| What is a microservice? | Small, independently deployable service doing one thing (our Flask face auth) |
| What is a message queue? | Async buffer between services (e.g., RabbitMQ, Redis Bull) |
| What is caching? | Storing computed results for fast re-access (Redis, in-memory) |
| What is a CDN? | Content Delivery Network — servers geographically close to users for fast static file delivery |
| What is a cron job? | Scheduled task running at defined intervals (e.g., `*/10 * * * *`) |
| What is load balancing? | Distributing requests across multiple servers |
| What is idempotency? | Operation that produces same result whether called once or multiple times |
| What is pagination? | Returning results in pages (skip + limit) to avoid loading entire dataset |

---

## OOP Concepts

| Question | Quick Answer |
|---------|-------------|
| What is encapsulation? | Hiding internal implementation, exposing only interface |
| What is abstraction? | Hiding complexity behind a simple interface |
| What is inheritance? | Child class inheriting properties/methods from parent class |
| What is polymorphism? | Same interface, different behavior (e.g., generic signup function for 3 user types) |
| What is a singleton? | Design pattern ensuring only one instance of a class exists |
| What is DRY? | Don't Repeat Yourself — avoid code duplication |
| What is SOLID? | 5 OOP design principles: Single responsibility, Open/closed, Liskov, Interface segregation, Dependency inversion |

---

## Git Quick Reference

| Question | Quick Answer |
|---------|-------------|
| git add vs git commit? | add: stage changes; commit: save staged changes to history |
| git pull vs git fetch? | pull = fetch + merge; fetch downloads without merging |
| What is a branch? | Parallel line of development |
| What is a merge conflict? | When two branches modify same lines; must be resolved manually |
| What is git rebase? | Replays commits on top of another branch (linear history) |
| What is .gitignore? | File listing paths Git should not track (like .env, node_modules) |
