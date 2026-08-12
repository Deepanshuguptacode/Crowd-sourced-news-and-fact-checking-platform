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
