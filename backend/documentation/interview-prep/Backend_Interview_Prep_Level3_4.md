# Backend Engineer Interview Prep — MEN Stack
## Part 2 — Level 3 (Advanced) + Level 4 (System Design & Deployment Fundamentals)

30 combined questions, fresher-focused. Code is included only where an interviewer would realistically ask you to write it — purely conceptual/theory questions are explanation-only.

---

## LEVEL 3 — Advanced (Node internals, testing, security, real-time, caching)

### 51. What is the difference between the microtask queue and the macrotask queue in the event loop?

**💡 Simple Answer:** Both hold callbacks waiting to run after the current code finishes, but microtasks (Promises, async/await, process.nextTick) always run BEFORE macrotasks (setTimeout, setInterval, I/O). After every single task, JS fully empties the microtask queue before picking the next macrotask.

**💻 Code:**

```javascript
console.log("1: sync");

setTimeout(() => console.log("2: macrotask (setTimeout)"), 0);

Promise.resolve().then(() => console.log("3: microtask (Promise)"));

console.log("4: sync");

// Output: 1, 4, 3, 2
// Sync code runs first, then ALL microtasks, then macrotasks
```

> **✍️ Interviewer Tip:** Very common 'predict the output' question — practice tracing 3–4 mixed setTimeout/Promise lines.

---

### 52. What are Streams in Node.js and why are they useful?

**💡 Simple Answer:** A stream lets you process data piece by piece (in chunks) instead of loading the entire file/response into memory at once. Useful for large files or data that arrives over time (e.g. video, big CSVs, HTTP request bodies).

**📌 Example:** Reading a 2GB file with fs.readFile() loads all 2GB into memory. A stream reads it in small chunks instead.

**💻 Code:**

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("bigfile.txt", "utf8");

readStream.on("data", (chunk) => {
  console.log("Received chunk:", chunk.length, "bytes");
});

readStream.on("end", () => {
  console.log("Finished reading file");
});

// Piping: read from one stream, write directly to another (very common)
const writeStream = fs.createWriteStream("copy.txt");
fs.createReadStream("bigfile.txt").pipe(writeStream);
```

---

### 53. What is a Buffer in Node.js?

**💡 Simple Answer:** A Buffer is a temporary storage area for raw binary data (like bytes of a file or network packet) — used because JavaScript strings can't natively hold binary data efficiently. Streams and file operations use Buffers internally.

**📌 Example:** Buffer.from('Hello') stores the raw bytes of the string 'Hello'.

**💻 Code:**

```javascript
const buf = Buffer.from("Hello");
console.log(buf);           // <Buffer 48 65 6c 6c 6f>  (bytes in hex)
console.log(buf.toString()); // "Hello" (convert back to text)
console.log(buf.length);     // 5 (number of bytes)
```

---

### 54. What is clustering in Node.js and why is it needed?

**💡 Simple Answer:** Node.js runs on a SINGLE thread by default, so it only uses one CPU core even on a multi-core machine. The built-in 'cluster' module lets you spawn multiple copies (workers) of your app — one per core — to handle more requests in parallel.

**📌 Example:** A 4-core machine can run 4 worker processes instead of 1, roughly 4x the throughput under load.

**💻 Code:**

```javascript
const cluster = require("cluster");
const os = require("os");

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork(); // spawn one worker per CPU core
  }
} else {
  // Each worker runs its own copy of the Express app
  require("./app.js");
}
```

> **✍️ Interviewer Tip:** Freshers are usually asked to EXPLAIN this, not write it live — know the 'why' more than the exact syntax.

---

### 55. How do you handle file uploads in Express?

**💡 Simple Answer:** Express doesn't parse file uploads (multipart/form-data) on its own. The 'multer' middleware handles that — it reads the uploaded file(s) and attaches them to req.file (single) or req.files (multiple).

**📌 Example:** npm install multer

**💻 Code:**

```javascript
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // saves files to an 'uploads' folder

app.post("/api/upload", upload.single("photo"), (req, res) => {
  console.log(req.file); // { originalname, filename, path, size, ... }
  res.json({ message: "File uploaded", file: req.file.filename });
});
```

---

### 56. Session-based auth vs Token-based (JWT) auth — what's the difference?

**💡 Simple Answer:** Session-based: server creates a session and stores it in memory/DB, sends the client a session ID in a cookie; server must look it up on every request (stateful). Token-based (JWT): server signs a self-contained token, client stores and sends it back; server just verifies the signature, no DB lookup needed (stateless) — easier to scale across multiple servers.

**📌 Example:** Sessions: good for traditional server-rendered apps. JWT: good for REST APIs / mobile apps / microservices.

> **✍️ Interviewer Tip:** Common conceptual question: 'Why did you choose JWT over sessions?' — be ready to explain statelessness and scaling.

---

### 57. What is a refresh token and how is it different from an access token?

**💡 Simple Answer:** The access token is short-lived (e.g. 15 min) and used to access protected routes — if stolen, the damage window is small. The refresh token is long-lived, stored more securely, and used ONLY to get a new access token when the old one expires, without forcing the user to log in again.

**📌 Example:** Login -> get { accessToken (15m), refreshToken (7d) }. When accessToken expires, call /refresh with the refreshToken to get a new accessToken.

**💻 Code:**

```javascript
app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token, please log in again" });
  }
});
```

---

### 58. What is the MongoDB Aggregation Pipeline?

**💡 Simple Answer:** Aggregation lets you process documents through a series of 'stages' (like a pipeline/conveyor belt) — filtering, grouping, sorting, reshaping — to produce computed results, similar to GROUP BY + JOIN in SQL.

**📌 Example:** Find total order amount per customer, only for completed orders.

**💻 Code:**

```javascript
const result = await Order.aggregate([
  { $match: { status: "completed" } },          // stage 1: filter
  { $group: {                                     // stage 2: group + sum
      _id: "$customerId",
      totalSpent: { $sum: "$amount" }
  }},
  { $sort: { totalSpent: -1 } }                   // stage 3: sort descending
]);
```

> **✍️ Interviewer Tip:** Interviewers may ask you to explain $match/$group/$sort conceptually rather than write a full pipeline from scratch.

---

### 59. What are Transactions in MongoDB and when do you need them?

**💡 Simple Answer:** A transaction groups multiple database operations so they either ALL succeed together or ALL fail together (atomicity) — important when one action must never happen without another (e.g. money moving from one account to another).

**📌 Example:** Transferring money: deduct from Account A AND add to Account B must both succeed, or neither should happen.

**💻 Code:**

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Account.updateOne({ _id: fromId }, { $inc: { balance: -amount } }, { session });
  await Account.updateOne({ _id: toId }, { $inc: { balance: amount } }, { session });
  await session.commitTransaction(); // both succeed
} catch (err) {
  await session.abortTransaction(); // roll back both
} finally {
  session.endSession();
}
```

---

### 60. What is the difference between Unit Testing and Integration Testing?

**💡 Simple Answer:** Unit testing checks ONE small piece of code (like a single function) in isolation, with dependencies faked/mocked. Integration testing checks that MULTIPLE pieces work correctly together (e.g. a route + database).

**📌 Example:** Unit test: does add(2,3) return 5? Integration test: does POST /api/users actually create a user in the database?

**💻 Code:**

```javascript
// Unit test example using Jest
function add(a, b) { return a + b; }

test("adds 2 + 3 to equal 5", () => {
  expect(add(2, 3)).toBe(5);
});
```

> **✍️ Interviewer Tip:** Freshers are often asked to write ONE simple Jest test like this — practice the test()/expect() syntax.

---

### 61. What is mocking in testing, and why is it used?

**💡 Simple Answer:** Mocking replaces a real dependency (like a database call or an external API) with a fake version that returns controlled, predictable data — so your test is fast, isolated, and doesn't depend on a real DB/network being available.

**📌 Example:** Instead of really calling the database in a test, you 'mock' User.findById to just return a fake user object.

**💻 Code:**

```javascript
jest.mock("../models/User"); // auto-mock the User model
const User = require("../models/User");

test("getUser returns user data", async () => {
  User.findById.mockResolvedValue({ id: 1, name: "Deepanshu" }); // fake return value

  const user = await User.findById(1);
  expect(user.name).toBe("Deepanshu");
});
```

---

### 62. What are common security practices for a Node/Express API?

**💡 Simple Answer:** Use HTTPS, hash passwords (bcrypt), validate/sanitize all input, set secure HTTP headers (helmet), rate-limit requests, never expose stack traces/secrets in error responses, and keep dependencies updated to avoid known vulnerabilities.

**📌 Example:** npm install helmet

**💻 Code:**

```javascript
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.use(helmet());  // sets secure HTTP headers (XSS protection, no-sniff, etc.)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // limit abuse

// Always validate/sanitize user input before using it in a DB query
// (prevents NoSQL injection, e.g. someone sending { "$gt": "" } as a password)
```

---

### 63. Why use a logging library (morgan/winston) instead of console.log?

**💡 Simple Answer:** console.log is fine for quick debugging, but production apps need structured, leveled logs (info/warn/error), timestamps, and the ability to save logs to files or external services. morgan logs HTTP requests automatically; winston is a general-purpose logger with levels and file/transport support.

**📌 Example:** morgan logs every request like: GET /api/users 200 15ms

**💻 Code:**

```javascript
const morgan = require("morgan");
app.use(morgan("dev")); // logs method, url, status, response time for every request

// Winston example for custom app logs
const winston = require("winston");
const logger = winston.createLogger({
  level: "info",
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "app.log" })]
});
logger.info("Server started");
logger.error("Something failed");
```

---

### 64. WebSockets vs REST — when would you use WebSockets?

**💡 Simple Answer:** REST is request-response: the client always asks first. WebSockets keep a persistent, two-way open connection, so the SERVER can also push data to the client instantly — needed for real-time features like chat apps, live notifications, or live scoreboards.

**📌 Example:** Chat app: REST would require constantly polling 'any new messages?'. WebSockets push new messages instantly.

**💻 Code:**

```javascript
// Server (using socket.io)
const io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", msg); // broadcast to all connected clients
  });
});
```

> **✍️ Interviewer Tip:** Usually a conceptual question for freshers — knowing WHEN to use WebSockets matters more than writing socket.io code live.

---

### 65. What is caching, and how would you use Redis in a Node.js app?

**💡 Simple Answer:** Caching stores the result of an expensive operation (like a slow DB query) in a fast, temporary store, so repeated requests can be served instantly without redoing the work. Redis is a popular in-memory key-value store used for exactly this.

**📌 Example:** Cache a product list for 60 seconds instead of hitting MongoDB on every request.

**💻 Code:**

```javascript
const redis = require("redis");
const client = redis.createClient();

app.get("/api/products", async (req, res) => {
  const cached = await client.get("products");
  if (cached) return res.json(JSON.parse(cached)); // serve from cache - fast

  const products = await Product.find();               // slow DB call
  await client.setEx("products", 60, JSON.stringify(products)); // cache for 60s
  res.json(products);
});
```

---

## LEVEL 4 — System Design & Deployment Fundamentals

### 66. What is the difference between Monolithic and Microservices architecture?

**💡 Simple Answer:** Monolithic: the entire application (auth, orders, payments, etc.) is one single codebase and deployment unit — simple to build and deploy, but hard to scale individual parts. Microservices: the app is split into small, independent services (each with its own codebase, database, deployment) that talk over the network — more scalable and flexible, but more complex to manage.

**📌 Example:** Monolith: one Node.js app handles everything. Microservices: separate 'auth-service', 'order-service', 'payment-service', each deployed independently.

> **✍️ Interviewer Tip:** Freshers should be able to name 2 pros/cons of each, not necessarily have built microservices themselves.

---

### 67. What is the difference between Horizontal and Vertical Scaling?

**💡 Simple Answer:** Vertical scaling = making ONE server more powerful (more RAM/CPU) — easy but has a hardware limit. Horizontal scaling = adding MORE servers/instances to share the load — scales further but needs a load balancer and often stateless services (which is one reason JWT over sessions is popular).

**📌 Example:** Vertical: upgrade from a 4GB to a 32GB server. Horizontal: run 5 copies of the same server behind a load balancer.

---

### 68. What is Load Balancing and why is it needed?

**💡 Simple Answer:** A load balancer sits in front of multiple server instances and distributes incoming requests across them (e.g. round-robin), so no single server gets overwhelmed, and traffic keeps flowing even if one server goes down.

**📌 Example:** Nginx or a cloud load balancer routes each incoming request to one of 3 identical Node.js server instances.

---

### 69. What is the CAP theorem?

**💡 Simple Answer:** In a distributed database, you can only fully guarantee 2 of these 3 at the same time: Consistency (every read gets the latest write), Availability (every request gets a response, even if not the latest data), Partition tolerance (system keeps working even if network connections between nodes break). Since network partitions can always happen, real systems choose between prioritizing Consistency or Availability.

**📌 Example:** MongoDB tends to prioritize Consistency; some NoSQL DBs like Cassandra prioritize Availability.

> **✍️ Interviewer Tip:** Common theory question — just be able to state the 3 letters and give one real trade-off example.

---

### 70. SQL vs NoSQL — how do you decide which one to use?

**💡 Simple Answer:** Use SQL (relational, like PostgreSQL/MySQL) when data is highly structured, relationships matter a lot, and you need strong consistency/transactions (e.g. banking). Use NoSQL (like MongoDB) when data is flexible/changing, you need to scale horizontally, or your data is naturally document-shaped (e.g. product catalogs, user profiles).

**📌 Example:** Banking app -> SQL (strict consistency). Social media feed / content-heavy app -> NoSQL (flexible schema, scales easily).

---

### 71. What is Database Sharding?

**💡 Simple Answer:** Sharding splits a large database into smaller pieces ('shards'), each stored on a different server, based on some key (e.g. user ID range). This lets you scale writes/storage horizontally, since no single server needs to hold ALL the data.

**📌 Example:** Users A-M go to Shard 1, Users N-Z go to Shard 2.

---

### 72. What is Database Replication?

**💡 Simple Answer:** Replication keeps multiple copies of the same data on different servers (a primary + replicas). It improves reliability (if the primary fails, a replica can take over) and read performance (reads can be spread across replicas). MongoDB calls this a 'replica set'.

**📌 Example:** 1 primary node handles writes; 2 secondary nodes copy the data and can serve read requests.

> **✍️ Interviewer Tip:** Know the difference from sharding: replication = same data copied; sharding = data split across servers.

---

### 73. What are Message Queues (like Kafka/RabbitMQ) and why use them?

**💡 Simple Answer:** A message queue lets one part of a system send a task/message that another part processes LATER, independently — decoupling the two so the sender doesn't have to wait. Useful for slow or non-urgent tasks like sending emails, processing images, or handling spikes in traffic.

**📌 Example:** User signs up -> API instantly responds 'Success' -> a 'send welcome email' message is pushed to a queue and processed in the background.

---

### 74. What is an API Gateway?

**💡 Simple Answer:** An API Gateway is a single entry point that sits in front of multiple backend services (especially in microservices) — it handles routing requests to the right service, plus cross-cutting concerns like authentication, rate limiting, and logging, so individual services don't each have to implement them.

**📌 Example:** Client calls api.example.com/orders -> Gateway routes it internally to the 'order-service'.

---

### 75. What does Idempotency mean in REST APIs?

**💡 Simple Answer:** An idempotent operation gives the SAME end result no matter how many times you repeat it. GET, PUT, and DELETE are supposed to be idempotent (calling DELETE /users/5 twice still ends with user 5 gone). POST is usually NOT idempotent (calling it twice creates two resources).

**📌 Example:** PUT /users/5 {name:'A'} run 3 times still leaves exactly one user with name 'A'. POST /users run 3 times creates 3 users.

**💻 Code:**

```javascript
// Idempotent - safe to retry if the network fails
app.put("/api/users/:id", async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(user);
});
// Calling this route 5 times in a row leaves the SAME final state
```

> **✍️ Interviewer Tip:** Common follow-up: 'Is POST idempotent? Why not?' — be ready with the answer above.

---

### 76. What is CI/CD?

**💡 Simple Answer:** CI (Continuous Integration) = automatically building and testing code every time someone pushes changes, to catch bugs early. CD (Continuous Deployment/Delivery) = automatically deploying that tested code to production (or staging) without manual steps. Together they make shipping code faster and safer.

**📌 Example:** Push to GitHub -> GitHub Actions runs tests -> if they pass, automatically deploys to the server.

**💻 Code:**

```yaml
# .github/workflows/deploy.yml (simplified)
name: CI/CD
on: [push]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
```

---

### 77. What is Docker and why is it used?

**💡 Simple Answer:** Docker packages your app WITH everything it needs (Node version, dependencies, OS libraries) into a 'container' that runs identically anywhere — fixes the classic 'it works on my machine' problem, and makes deployment consistent.

**📌 Example:** A Dockerfile describes how to build the container image for your app.

**💻 Code:**

```yaml
# Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "app.js"]
```

> **✍️ Interviewer Tip:** Freshers may be asked to explain each line of a basic Dockerfile like this one.

---

### 78. What is docker-compose used for?

**💡 Simple Answer:** docker-compose lets you define and run MULTIPLE containers together (e.g. your Node app + a MongoDB container) with one command, instead of starting each manually — useful for local development that mirrors production setup.

**📌 Example:** docker-compose up starts both the app and the database containers together, already networked to talk to each other.

**💻 Code:**

```yaml
# docker-compose.yml
version: "3"
services:
  app:
    build: .
    ports:
      - "5000:5000"
    depends_on:
      - mongo
  mongo:
    image: mongo
    ports:
      - "27017:27017"
```

---

### 79. How would you design a simple URL Shortener (basic system design)?

**💡 Simple Answer:** Core idea: store a mapping between a short code and the original long URL. On create, generate a unique short code (random string or a counter converted to base62) and save it. On visit, look up the code and redirect (HTTP 301/302) to the original URL.

**📌 Example:** POST /shorten {url: 'https://example.com/very/long/link'} -> returns 'https://short.ly/aZ9k2'

**💻 Code:**

```javascript
const urlSchema = new mongoose.Schema({
  shortCode: { type: String, required: true, unique: true },
  originalUrl: { type: String, required: true },
});
const Url = mongoose.model("Url", urlSchema);

app.post("/api/shorten", async (req, res) => {
  const shortCode = Math.random().toString(36).substring(2, 8); // simple random code
  const url = await Url.create({ shortCode, originalUrl: req.body.url });
  res.json({ shortUrl: `https://short.ly/${url.shortCode}` });
});

app.get("/:code", async (req, res) => {
  const url = await Url.findOne({ shortCode: req.params.code });
  if (!url) return res.status(404).json({ message: "Not found" });
  res.redirect(url.originalUrl); // 302 redirect to the real URL
});
```

> **✍️ Interviewer Tip:** Classic fresher-level 'mini system design' — practice explaining the flow even more than the exact code.

---

### 80. What Git commands and workflow should every backend fresher know?

**💡 Simple Answer:** Git tracks code changes and lets teams collaborate without overwriting each other's work. Know the core loop: create a branch for your feature, commit small logical changes, push, open a Pull Request, resolve merge conflicts if they happen, and merge into main.

**📌 Example:** git checkout -b feature/login -> make changes -> git add . -> git commit -m 'add login route' -> git push

**💻 Code:**

```javascript
git clone <repo-url>              # copy a repo locally
git checkout -b feature/add-auth  # create + switch to a new branch
git add .                         # stage changes
git commit -m "Add JWT auth"      # save a snapshot with a message
git push origin feature/add-auth  # upload branch to remote
git pull origin main               # get latest changes from main
git merge main                     # merge main into your branch (resolve conflicts if any)
```

> **✍️ Interviewer Tip:** Interviewers often ask: 'How do you resolve a merge conflict?' — know that you manually edit the conflicting lines, then git add + commit.

---

