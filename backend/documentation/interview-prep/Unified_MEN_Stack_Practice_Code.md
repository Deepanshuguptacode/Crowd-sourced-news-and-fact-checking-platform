# Unified MEN-Stack Daily Practice Code + Function-by-Function Explanation

One Express + MongoDB/Mongoose app covering routing, middleware, full CRUD, pagination, `populate()`, JWT auth, and bcrypt password hashing.

Prepared for: **Deepanshu**

---

## How To Practice With This File

- **Day 1–3:** Read Part A (the full code) top to bottom. Say out loud what each section does before checking Part B.
- **Day 4–7:** Close the doc. Type `app.js` from memory into a blank file. Run `node --check app.js` to confirm no syntax errors.
- **Ongoing:** Use Part B (the cheat sheet) as a fast pre-interview refresher — it lists every method/function with a one-line "why it matters".
- **In the interview:** if asked to "build a CRUD API", this file's structure (imports → middleware → schema → routes → error handler → listen) is the exact order to write it in.

---

## PART A — The Unified Practice Code (`app.js`)

Type this file daily. Comments explain each line's purpose — Part B below expands on every method/function used.

```javascript
/* ============================================================================
   UNIFIED MEN-STACK PRACTICE FILE
   Type this file from memory once a day. It covers, in ONE working app:
   - Express server + routing + middleware
   - Mongoose schema/model + validation
   - Full CRUD (Create, Read, Update, Delete) with pagination
   - JWT auth (register/login) + bcrypt password hashing
   - Protected routes + role-based authorization
   - populate() (Mongo "join"), error handling, env vars

   RUN LOCALLY:
   1) npm init -y
   2) npm install express mongoose bcrypt jsonwebtoken dotenv cors
   3) create a .env file (see bottom of this file for the format)
   4) node app.js
============================================================================ */


/* ---------------------------------------------------------------------------
   SECTION 1: IMPORTS
   require() loads a Node module (built-in, or from node_modules via npm).
--------------------------------------------------------------------------- */
require("dotenv").config();          // loads variables from .env into process.env
const express = require("express");  // web framework - handles routing/HTTP
const mongoose = require("mongoose"); // ODM - connects Node to MongoDB
const bcrypt = require("bcrypt");     // hashes passwords securely
const jwt = require("jsonwebtoken");  // creates/verifies login tokens
const cors = require("cors");         // allows frontend (different origin) to call this API

const app = express();                // creates the Express application object
const PORT = process.env.PORT || 5000;


/* ---------------------------------------------------------------------------
   SECTION 2: GLOBAL MIDDLEWARE
   Middleware runs on EVERY request, in the order it's declared, before
   it reaches your routes. Each one must call next() to pass control on.
--------------------------------------------------------------------------- */
app.use(cors());          // adds CORS headers so browsers don't block cross-origin calls
app.use(express.json());  // parses incoming JSON body -> makes it available as req.body

// Custom middleware: simple request logger (writing this from scratch is a common ask)
function requestLogger(req, res, next) {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
  next(); // MUST call next(), or the request hangs forever
}
app.use(requestLogger);


/* ---------------------------------------------------------------------------
   SECTION 3: DATABASE CONNECTION
   mongoose.connect() opens (and pools) the connection to MongoDB.
   Do this ONCE at startup - never inside a route handler.
--------------------------------------------------------------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err.message));


/* ---------------------------------------------------------------------------
   SECTION 4: SCHEMAS + MODELS
   Schema = shape/rules for a document. Model = the tool you use to
   actually query/create/update documents of that shape.
--------------------------------------------------------------------------- */

// ---- User model (for auth) ----
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },          // stores the HASH, never plain text
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

// ---- Task model (for CRUD practice; references User -> demonstrates populate()) ----
const taskSchema = new mongoose.Schema({
  title: { type: String, required: [true, "Title is required"] },
  completed: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // reference, not embed
});
const Task = mongoose.model("Task", taskSchema);


/* ---------------------------------------------------------------------------
   SECTION 5: AUTH MIDDLEWARE
   Reusable functions that protect routes. Plugged into routes as extra
   arguments before the final handler (middleware chaining).
--------------------------------------------------------------------------- */

// Checks WHO the user is (Authentication) by verifying the JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization; // expected format: "Bearer <token>"
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired
    req.user = decoded;   // attach decoded payload ({id, role}) to req for later use
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Checks WHAT the user is allowed to do (Authorization)
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
}


/* ---------------------------------------------------------------------------
   SECTION 6: AUTH ROUTES (register / login)
--------------------------------------------------------------------------- */

// REGISTER - hash the password before saving, never store it plain
app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds (cost factor)
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    next(err); // hand off to the error-handling middleware at the bottom
  }
});

// LOGIN - compare entered password against stored hash, then issue a JWT
app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password); // true/false
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },   // payload
      process.env.JWT_SECRET,              // secret key used to sign
      { expiresIn: "1h" }                  // token expires in 1 hour
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});


/* ---------------------------------------------------------------------------
   SECTION 7: TASK ROUTES (full CRUD + pagination + populate)
   verifyToken runs FIRST on every one of these -> only logged-in users
   can reach the actual handler.
--------------------------------------------------------------------------- */

// CREATE - POST /api/tasks
app.post("/api/tasks", verifyToken, async (req, res, next) => {
  try {
    const task = await Task.create({
      title: req.body.title,
      owner: req.user.id,       // came from the decoded JWT, not the client body (safer)
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// READ ALL - GET /api/tasks?page=1&limit=10  (pagination + populate)
app.get("/api/tasks", verifyToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({ owner: req.user.id })
      .populate("owner", "name email")   // replaces owner ObjectId with actual user data
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments({ owner: req.user.id });

    res.json({ data: tasks, currentPage: page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// READ ONE - GET /api/tasks/:id
app.get("/api/tasks/:id", verifyToken, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate("owner", "name email");
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// UPDATE (partial) - PATCH /api/tasks/:id
app.patch("/api/tasks/:id", verifyToken, async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },   // only overwrite the fields sent in
      { new: true, runValidators: true } // return the UPDATED doc, still validate it
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE - DELETE /api/tasks/:id   (admin-only, to demo isAdmin middleware chaining)
app.delete("/api/tasks/:id", verifyToken, isAdmin, async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(204).send(); // 204 = success, no content to return
  } catch (err) {
    next(err);
  }
});


/* ---------------------------------------------------------------------------
   SECTION 8: 404 HANDLER (for unmatched routes) + ERROR MIDDLEWARE
   The error middleware needs FOUR params (err, req, res, next) - that
   signature is how Express recognizes it as an error handler.
   It must be registered LAST, after every route.
--------------------------------------------------------------------------- */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});


/* ---------------------------------------------------------------------------
   SECTION 9: START SERVER
--------------------------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


/* ============================================================================
   .env FILE FORMAT (create this as a separate file named ".env")
   ----------------------------------------------------------------------------
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/practiceDB
   JWT_SECRET=someLongRandomSecretString
============================================================================ */

```

---

## PART B — Method & Function Cheat Sheet

Every method/function used in `app.js`, grouped by category. This is the fast-scan revision list.

### 1. Node / Express Setup

| Method / Function | What It Does | Why It Matters (Interview) |
|---|---|---|
| `require('module')` | Loads a built-in Node module or an installed npm package into the file. | *Know the difference: require() = CommonJS (Node default), import = ES Modules.* |
| `dotenv.config()` | Reads the .env file and loads its key=value pairs into process.env. | *Explains why secrets/config aren't hardcoded in code.* |
| `express()` | Creates the main Express application object — everything (routes, middleware) attaches to this. | *First line of almost every Express interview answer.* |
| `app.listen(port, cb)` | Starts the HTTP server, makes it listen for requests on the given port. | *Callback runs once, confirms the server actually started.* |
| `process.env.X` | Reads an environment variable (e.g. PORT, MONGO_URI, JWT_SECRET) set via .env or the OS. | *Never hardcode secrets — always pull from process.env.* |

### 2. Middleware & Routing

| Method / Function | What It Does | Why It Matters (Interview) |
|---|---|---|
| `app.use(fn)` | Registers middleware that runs on every matching request, in the order declared. | *Order matters — e.g. express.json() must come BEFORE routes that read req.body.* |
| `app.get/post/patch/put/delete(path, ...fns)` | Registers a route: a URL + HTTP method + one or more handler functions. | *Multiple functions = middleware chaining (e.g. verifyToken, isAdmin, handler).* |
| `(req, res, next) => {}` | The standard handler/middleware signature: request in, response out, next() to continue. | *Forgetting to call next() (with no response sent) hangs the request forever.* |
| `next()` | Passes control to the next middleware/route handler in the chain. | *next(err) specifically routes to the error-handling middleware.* |
| `req.body` | The parsed JSON payload sent by the client (needs express.json() to exist). | *Classic bug: 'req.body is undefined' = forgot express.json().* |
| `req.params` | URL route parameters, e.g. :id in /tasks/:id becomes req.params.id. | *Used to identify WHICH resource a request targets.* |
| `req.query` | Query-string values, e.g. ?page=2&limit=10 becomes req.query.page. | *Used for filtering, searching, and pagination.* |
| `req.headers` | All HTTP headers sent with the request (e.g. Authorization). | *Where the JWT token is read from on protected routes.* |
| `res.status(code)` | Sets the HTTP status code of the response (chainable with .json()). | *Know the common codes: 200/201/400/401/403/404/500.* |
| `res.json(data)` | Sends a JSON response and ends the request. | *Standard way APIs respond — always JSON in REST.* |
| `res.send()` | Sends a response of any type (text, buffer, or empty like 204 No Content). | *Used for 204 responses where no body is needed.* |

### 3. Mongoose (MongoDB)

| Method / Function | What It Does | Why It Matters (Interview) |
|---|---|---|
| `mongoose.connect(uri)` | Opens (and pools) the connection between Node and MongoDB. Called once at startup. | *Interviewers ask you to write this line from memory.* |
| `new mongoose.Schema({...})` | Defines the shape and validation rules of a document (fields, types, required, etc.). | *Schema = blueprint. Always the first step before creating a Model.* |
| `mongoose.model('Name', schema)` | Compiles a Schema into a Model — the object you actually query/create documents with. | *Convention: capitalized singular name, e.g. 'User', 'Task'.* |
| `Model.create(obj)` | Inserts a new document into the collection (shortcut for new Model() + .save()). | *Simplest way to demonstrate the 'Create' in CRUD.* |
| `Model.find(filter)` | Returns ALL documents matching the filter (empty {} = all documents). | *Combine with .skip()/.limit() for pagination.* |
| `Model.findOne(filter)` | Returns the FIRST document matching the filter, or null. | *Common for login: User.findOne({ email }).* |
| `Model.findById(id)` | Returns the document with that specific _id, or null. | *Shortcut for findOne({ _id: id }).* |
| `Model.findByIdAndUpdate(id, changes, opts)` | Finds a document by id and updates it. { new: true } returns the UPDATED doc (not the old one). | *runValidators: true re-applies schema validation on update — easy to forget.* |
| `Model.findByIdAndDelete(id)` | Finds a document by id and removes it from the collection. | *Returns the deleted document, or null if not found.* |
| `Model.countDocuments(filter)` | Counts how many documents match a filter — used to calculate totalPages. | *Needed for building pagination metadata.* |
| `.populate('field', 'selectedFields')` | Replaces a referenced ObjectId with the actual document from the other collection (like a SQL JOIN). | *Only works on fields defined with { ref: 'ModelName' } in the schema.* |
| `.skip(n) / .limit(n)` | Skips the first n documents / caps how many are returned — together they build pagination. | *skip = (page-1) * limit is the standard formula.* |
| `Schema validators: required / unique / enum / min / default` | Rules written directly in the schema; Mongoose checks them automatically before saving. | *'What validations would you add to this schema?' is a very common follow-up.* |

### 4. Auth & Security

| Method / Function | What It Does | Why It Matters (Interview) |
|---|---|---|
| `bcrypt.hash(password, saltRounds)` | One-way scrambles a plain password into a hash before storing it (async, returns a Promise). | *saltRounds = cost factor; 10 is a common safe default.* |
| `bcrypt.compare(plainPw, hash)` | Checks a plain-text password against a stored hash; returns true/false. You never 'un-hash'. | *Used at login — never decrypt, always compare.* |
| `jwt.sign(payload, secret, options)` | Creates a signed token containing the payload (e.g. user id, role), valid until it expires. | *expiresIn controls session length; payload should NOT include the password.* |
| `jwt.verify(token, secret)` | Confirms a token's signature is valid and not expired; throws an error if tampered/expired. | *Wrap in try/catch — an invalid token throws rather than returning false.* |
| `Authorization header ('Bearer <token>')` | The standard place a client sends its JWT on each request. | *Server splits on the space to pull out just the token part.* |

---

## If You Only Memorize 8 Lines, Make It These

```javascript
mongoose.connect(process.env.MONGO_URI)                         // DB connection
app.use(express.json())                                          // parse JSON body
const hashed = await bcrypt.hash(password, 10)                   // hash password
const isMatch = await bcrypt.compare(password, user.password)    // check password
const token = jwt.sign({ id: user._id }, SECRET, { expiresIn:"1h" }) // issue token
const decoded = jwt.verify(token, SECRET)                        // verify token
Model.findByIdAndUpdate(id, { $set: req.body }, { new: true })   // update pattern
app.use((err, req, res, next) => res.status(500).json({message: err.message})) // error MW
```

*These 8 lines cover DB connection, body parsing, both halves of auth (hash + compare, sign + verify), the standard update pattern, and the error-handling middleware signature — the pieces interviewers ask for most.*
