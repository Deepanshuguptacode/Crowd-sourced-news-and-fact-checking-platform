**BACKEND ENGINEER**

**INTERVIEW PREP --- MEN STACK**

*(MongoDB · Express.js · Node.js)*

**PART 1 --- LEVEL 1 (Beginner) + LEVEL 2 (Intermediate)**

50 Combined Questions, Simple Explanations, Examples & Code

Prepared for: Deepanshu

**LEVEL 1 --- BEGINNER**

*JavaScript Fundamentals + Node.js/Express/MongoDB Basics (25
Questions)*

**1. What is the difference between var, let, and const?**

**💡 Simple Answer:** var is old-style and function-scoped (leaks
outside blocks). let and const are block-scoped (only live inside { }).
Use const by default, let when the value will change, and avoid var.

**📌 Example:** if(true){ var a = 1; let b = 2; } console.log(a); // 1
(leaked out) console.log(b); // Error: b is not defined

**💻 Code:**

```javascript
function test() {
if (true) {
var x = "var value";
let y = "let value";
}
console.log(x); // works - "var value"
// console.log(y); // ReferenceError - y is block scoped
}
test();
```

**✍ INTERVIEWER TIP:** *Interviewers often ask: 'Predict the output'
of a var/let loop with setTimeout --- a classic trap (see Q3).*

**2. What is the difference between == and ===?**

**💡 Simple Answer:** == compares values after converting types (loose).
=== compares both value AND type (strict). Always prefer === to avoid
surprises.

**📌 Example:** '5' == 5 // true (type converted) '5' === 5 // false
(different types)

**💻 Code:**

```javascript
console.log(0 == false); // true
console.log(0 === false); // false
console.log(null == undefined); // true
console.log(null === undefined); // false
```

**3. What is hoisting in JavaScript?**

**💡 Simple Answer:** JS moves variable and function DECLARATIONS to the
top of their scope before running the code. var is hoisted and set to
undefined; let/const are hoisted but stay in a 'temporal dead zone'
(can't be used before declared). Function declarations are fully
hoisted (can be called before they appear).

**📌 Example:** console.log(a); // undefined (not error) var a = 5;
console.log(b); // ReferenceError let b = 5;

**💻 Code:**

```javascript
sayHi(); // works - function declarations are hoisted
function sayHi() {
console.log("Hi!");
}
console.log(count); // undefined, not an error
var count = 10;
```

**✍ INTERVIEWER TIP:** *Classic written question: 'What will this code
print?' with var inside a loop + setTimeout.*

**4. What is a closure? Give an example.**

**💡 Simple Answer:** A closure is a function that 'remembers' the
variables from the place it was created, even after that outer function
has finished running. It's how you make private counters, etc.

**📌 Example:** function makeCounter(){ let count=0; return ()=>{
count++; return count; } } const counter = makeCounter(); counter(); //
1 counter(); // 2

**💻 Code:**

```javascript
function makeCounter() {
let count = 0; // private variable
return function () {
count++;
return count;
};
}
const counter1 = makeCounter();
console.log(counter1()); // 1
console.log(counter1()); // 2
console.log(counter1()); // 3
// count is not accessible directly - it's "closed over"
```

**✍ INTERVIEWER TIP:** *Very common written question: 'Write a
function that returns an incrementing counter using closures.'*

**5. What is the 'this' keyword in JavaScript?**

**💡 Simple Answer:** 'this' refers to the object that is calling the
function. In a normal method it's the object before the dot. In an
arrow function, 'this' is NOT its own --- it borrows 'this' from the
surrounding (outer) code.

**📌 Example:** const obj = { name:'A', greet(){
console.log(this.name); } }; obj.greet(); // 'A'

**💻 Code:**

```javascript
const user = {
name: "Deepanshu",
greetNormal: function () {
console.log("Normal:", this.name); // "Deepanshu"
},
greetArrow: () => {
console.log("Arrow:", this.name); // undefined - arrow has no own
'this'
}
};
user.greetNormal();
user.greetArrow();
```

**6. Arrow functions vs normal functions --- key differences?**

**💡 Simple Answer:** Arrow functions: shorter syntax, no own 'this'
(inherits from parent), cannot be used as constructors, no 'arguments'
object. Normal functions: have their own 'this', can be constructors,
have 'arguments'.

**📌 Example:** const add = (a,b) => a+b; // arrow, implicit return
function add2(a,b){ return a+b; } // normal

**💻 Code:**

```javascript
// Arrow function (short, no own 'this')
const square = (n) => n * n;
// Normal function (has own 'this', can be used with 'new')
function Square(n) {
this.value = n * n;
}
const s = new Square(5);
console.log(s.value); // 25
```

**7. What is a callback function?**

**💡 Simple Answer:** A callback is a function passed as an argument to
another function, which is then 'called back' (executed) later,
usually after some task finishes.

**📌 Example:** setTimeout(() => console.log('done'), 1000); // arrow
fn is the callback

**💻 Code:**

```javascript
function fetchData(callback) {
console.log("Fetching data...");
setTimeout(() => {
callback("Data received!");
}, 1000);
}
fetchData(function (result) {
console.log(result); // "Data received!" after 1 sec
});
```

**✍ INTERVIEWER TIP:** *Interviewers may ask you to write a function
that takes a callback and calls it after a delay.*

**8. What is 'callback hell' and how do you avoid it?**

**💡 Simple Answer:** Callback hell is when callbacks are nested inside
callbacks inside callbacks, making code look like a pyramid and hard to
read. Fix it using Promises or async/await.

**📌 Example:** // Bad: getUser(id, (u)=>{ getPosts(u,(p)=>{
getComments(p,(c)=>{...}) }) })

**💻 Code:**

```javascript
// BAD - callback hell
getUser(1, (user) => {
getPosts(user.id, (posts) => {
getComments(posts[0].id, (comments) => {
console.log(comments);
});
});
});
// GOOD - async/await fixes it (see Level 2, Q1)
async function run() {
const user = await getUser(1);
const posts = await getPosts(user.id);
const comments = await getComments(posts[0].id);
console.log(comments);
}
```

**9. What is the JavaScript event loop?**

**💡 Simple Answer:** JS runs on ONE thread. The event loop is the
mechanism that lets JS do async work (like timers, file reads, API
calls) without blocking. It checks: is the call stack empty? If yes,
take the next task from the queue and run it.

**📌 Example:** console.log(1); setTimeout(()=>console.log(2),0);
console.log(3); // Output: 1, 3, 2 (setTimeout callback waits for stack
to clear)

**💻 Code:**

```javascript
console.log("Start");
setTimeout(() => {
console.log("Timeout callback");
}, 0);
Promise.resolve().then(() => {
console.log("Promise callback");
});
console.log("End");
// Output order:
// Start
// End
// Promise callback (microtask - runs first)
// Timeout callback (macrotask - runs after)
```

**✍ INTERVIEWER TIP:** *Very common: 'Predict the console output
order' questions.*

**10. What is Node.js and why is it used for backend?**

**💡 Simple Answer:** Node.js is a runtime that lets JavaScript run
OUTSIDE the browser (on a server). It uses the V8 engine, is
single-threaded but non-blocking (async), which makes it fast for
I/O-heavy apps like APIs.

**📌 Example:** node server.js // runs a JS file directly on your
machine as a server

**💻 Code:**

```javascript
// A file server.js run with: node server.js
const http = require("http");
const server = http.createServer((req, res) => {
res.end("Hello from Node.js server!");
});
server.listen(3000, () => {
console.log("Server running on port 3000");
});
```

**✍ INTERVIEWER TIP:** *Interviewers ask you to build a plain HTTP
server WITHOUT Express, to check you understand what Express hides.*

**11. Synchronous vs Asynchronous code --- what's the difference?**

**💡 Simple Answer:** Synchronous: code runs line by line, each line
waits for the previous one. Asynchronous: some tasks (like DB calls,
file reads) run in the background and the rest of the code doesn't wait
for them.

**📌 Example:** // sync console.log('a'); console.log('b'); // async
setTimeout(()=>console.log('a'),0); console.log('b'); // b then a

**💻 Code:**

```javascript
// Synchronous - blocks
const fs = require("fs");
const data = fs.readFileSync("file.txt", "utf8"); // waits here
console.log(data);
console.log("This runs AFTER file is read");
// Asynchronous - non-blocking
fs.readFile("file.txt", "utf8", (err, data) => {
console.log(data); // runs later
});
console.log("This runs BEFORE file is read");
```

**12. What are modules in Node.js? (require / module.exports vs
import/export)**

**💡 Simple Answer:** Modules let you split code into separate files and
reuse them. CommonJS (Node's default) uses require() and
module.exports. Modern JS (ES Modules) uses import/export.

**📌 Example:** // math.js module.exports = { add: (a,b)=>a+b }; //
app.js const { add } = require('./math');

**💻 Code:**

```javascript
// math.js (CommonJS)
function add(a, b) { return a + b; }
function sub(a, b) { return a - b; }
module.exports = { add, sub };
// app.js
const { add, sub } = require("./math");
console.log(add(2, 3)); // 5
// ---- ES Module version ----
// export function add(a, b) { return a + b; }
// import { add } from './math.js';
```

**13. What is npm and package.json?**

**💡 Simple Answer:** npm (Node Package Manager) installs and manages
third-party libraries. package.json is the project's config file --- it
lists the project name, version, dependencies, and scripts (like
'start').

**📌 Example:** npm init -y // creates package.json npm install express
// installs express & adds to dependencies

**💻 Code:**

```javascript
// package.json example
{
"name": "my-backend-app",
"version": "1.0.0",
"scripts": {
"start": "node server.js",
"dev": "nodemon server.js"
},
"dependencies": {
"express": "^4.19.2",
"mongoose": "^8.0.0"
}
}
```

**14. What is a Promise in JavaScript?**

**💡 Simple Answer:** A Promise is an object representing a value that
will be available LATER (either success = resolved, or failure =
rejected). It has 3 states: pending, fulfilled, rejected.

**📌 Example:** const p = new Promise((resolve,reject)=>{
resolve('done'); }); p.then(val => console.log(val)); // 'done'

**💻 Code:**

```javascript
function checkAge(age) {
return new Promise((resolve, reject) => {
if (age >= 18) {
resolve("You can vote");
} else {
reject("Too young to vote");
}
});
}
checkAge(20)
.then((msg) => console.log(msg)) // "You can vote"
.catch((err) => console.log(err));
```

**✍ INTERVIEWER TIP:** *Interviewers ask you to write a Promise that
resolves/rejects based on a condition (like above).*

**15. What is JSON and why is it used in APIs?**

**💡 Simple Answer:** JSON (JavaScript Object Notation) is a lightweight
text format to store/exchange data as key-value pairs. APIs use it
because it's easy for both humans and machines (any language) to read.

**📌 Example:** { "name": "Deepanshu", "role": "backend
developer" }

**💻 Code:**

```javascript
const obj = { name: "Deepanshu", age: 21 };
const jsonString = JSON.stringify(obj); // object -> JSON string
console.log(jsonString); // '{"name":"Deepanshu","age":21}'
const backToObj = JSON.parse(jsonString); // JSON string -> object
console.log(backToObj.name); // "Deepanshu"
```

**16. What is a REST API?**

**💡 Simple Answer:** REST (REpresentational State Transfer) is a set of
rules for building APIs. Each resource (like 'users') has a URL, and
you use HTTP methods (GET, POST, PUT, DELETE) to interact with it. It's
stateless --- the server doesn't remember previous requests.

**📌 Example:** GET /api/users -> get all users GET /api/users/5 ->
get user with id 5 POST /api/users -> create a new user

**💻 Code:**

```javascript
// REST convention example (routes only)
// GET /api/products -> list all products
// GET /api/products/:id -> get one product
// POST /api/products -> create a product
// PUT /api/products/:id -> update a product fully
// DELETE /api/products/:id -> delete a product
```

**17. What are the main HTTP methods and what do they do?**

**💡 Simple Answer:** GET = read data. POST = create new data. PUT =
update/replace data fully. PATCH = update part of data. DELETE = remove
data.

**📌 Example:** GET /users, POST /users, PUT /users/1, DELETE /users/1

**💻 Code:**

```javascript
app.get("/users", (req, res) => { /* read */ });
app.post("/users", (req, res) => { /* create */ });
app.put("/users/:id", (req, res) => { /* replace */ });
app.patch("/users/:id", (req, res) => { /* partial update */ });
app.delete("/users/:id", (req, res) => { /* delete */ });
```

**18. What is Express.js?**

**💡 Simple Answer:** Express is a lightweight framework built on top of
Node.js's http module. It makes writing servers and APIs much easier
--- simpler routing, middleware support, and less boilerplate code.

**📌 Example:** const app = express(); app.get('/',
(req,res)=>res.send('Hi'));

**💻 Code:**

```javascript
const express = require("express");
const app = express();
app.get("/", (req, res) => {
res.send("Hello from Express!");
});
app.listen(3000, () => console.log("Server started on 3000"));
```

**✍ INTERVIEWER TIP:** *Interviewers commonly ask: 'Write a basic
Express server with one GET route.' (write this from memory!)*

**19. What is middleware in Express?**

**💡 Simple Answer:** Middleware is a function that runs BETWEEN the
request and the response. It can read/modify the request, run some logic
(like logging or auth check), and then either end the response or call
next() to pass control forward.

**📌 Example:** app.use((req,res,next)=>{ console.log(req.method);
next(); });

**💻 Code:**

```javascript
const express = require("express");
const app = express();
// Custom middleware - logs every request
function logger(req, res, next) {
console.log(`${req.method} ${req.url}`);
next(); // pass control to the next middleware/route
}
app.use(logger);
app.get("/", (req, res) => res.send("Home page"));
app.listen(3000);
```

**✍ INTERVIEWER TIP:** *Very common written task: 'Write a middleware
that logs the request method and URL.'*

**20. How do you create a basic Node.js server without Express?**

**💡 Simple Answer:** Use the built-in 'http' module. You create a
server, listen for requests, and manually send responses (no shortcuts
like res.json()).

**📌 Example:** const server = http.createServer((req,res)=>{
res.end('hi'); });

**💻 Code:**

```javascript
const http = require("http");
const server = http.createServer((req, res) => {
if (req.url === "/" && req.method === "GET") {
res.writeHead(200, { "Content-Type": "text/plain" });
res.end("Welcome Home");
} else {
res.writeHead(404, { "Content-Type": "text/plain" });
res.end("Not Found");
}
});
server.listen(3000, () => console.log("Server running on 3000"));
```

**21. What are the spread (...) and rest (...) operators?**

**💡 Simple Answer:** Same symbol (...), different jobs. Spread EXPANDS
an array/object into individual items. Rest COLLECTS multiple items INTO
an array. Spread is used when calling/building; rest is used in function
parameters.

**📌 Example:** const arr=[1,2,3]; const copy=[...arr,4]; // spread
-> [1,2,3,4] function sum(...nums){ return nums.reduce((a,b)=>a+b);
} // rest

**💻 Code:**

```javascript
// Spread - expand
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1,2,3,4,5]
const obj1 = { name: "A" };
const obj2 = { ...obj1, age: 21 }; // { name:"A", age:21 }
// Rest - collect
function sum(...numbers) {
return numbers.reduce((total, n) => total + n, 0);
}
console.log(sum(1, 2, 3, 4)); // 10
```

**22. What is destructuring in JavaScript?**

**💡 Simple Answer:** Destructuring lets you unpack values from arrays
or properties from objects into separate variables in one line ---
cleaner than accessing them one by one.

**📌 Example:** const {name, age} = user; const [first, second] = arr;

**💻 Code:**

```javascript
const user = { name: "Deepanshu", age: 21, role: "developer" };
const { name, role } = user;
console.log(name, role); // Deepanshu developer
const numbers = [10, 20, 30];
const [first, , third] = numbers;
console.log(first, third); // 10 30
// Common in Express route params:
// const { id } = req.params;
```

**23. What is MongoDB and how is it different from SQL databases?**

**💡 Simple Answer:** MongoDB is a NoSQL database --- it stores data as
flexible JSON-like 'documents' (not rigid rows/columns like SQL
tables). No fixed schema is required, and it scales horizontally, which
suits fast-changing app data.

**📌 Example:** SQL: table 'users' with fixed columns. MongoDB:
collection 'users' with documents that can each have different fields.

**💻 Code:**

```javascript
// A MongoDB document (looks just like a JS object / JSON)
{
"_id": "64f1b2c3d4e5f6a7b8c9d0e1",
"name": "Deepanshu",
"email": "deep@example.com",
"skills": ["JavaScript", "Node.js", "MongoDB"]
}
// SQL equivalent needs a fixed 'users' table
// plus a separate 'user_skills' table for the array - MongoDB
avoids that.
```

**24. What are documents and collections in MongoDB?**

**💡 Simple Answer:** A document is a single record (like a row) stored
as JSON/BSON. A collection is a group of documents (like a table). A
database holds multiple collections.

**📌 Example:** Database: 'shopApp' -> Collection: 'products' ->
Documents: individual products

**💻 Code:**

```javascript
// Database: shopApp
// Collection: products
// Two documents inside it:
{ "_id": 1, "name": "Laptop", "price": 55000 }
{ "_id": 2, "name": "Mouse", "price": 500 }
```

**25. How do you connect Node.js to MongoDB using Mongoose?**

**💡 Simple Answer:** Mongoose is a library that connects Node.js to
MongoDB and lets you define schemas (structure) for your data. You
connect once at app startup using mongoose.connect().

**📌 Example:** mongoose.connect('mongodb://localhost:27017/mydb')

**💻 Code:**

```javascript
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/myAppDB")
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log("Connection error:", err));
// Usually placed at the top of server.js, before app.listen()
```

**✍ INTERVIEWER TIP:** *Interviewers often ask: 'How do you connect
Express to MongoDB?' --- write the connect snippet from memory.*

**LEVEL 2 --- INTERMEDIATE**

*Express Middleware, Mongoose, Auth (JWT/bcrypt), API Design (25
Questions)*

**26. What is async/await and how does it improve on Promises?**

**💡 Simple Answer:** async/await is 'syntactic sugar' over Promises
--- it lets you write asynchronous code that LOOKS synchronous (top to
bottom), which is easier to read than chained .then() calls. 'await'
pauses the function until the Promise resolves.

**📌 Example:** async function getUser(){ const res = await fetch(url);
return res.json(); }

**💻 Code:**

```javascript
async function getUserData(id) {
try {
const user = await User.findById(id); // waits here
const posts = await Post.find({ userId: id }); // then waits here
return { user, posts };
} catch (err) {
console.log("Error:", err.message);
}
}
```

**✍ INTERVIEWER TIP:** *Interviewers ask you to convert a .then() chain
into async/await, or vice versa --- practice both directions.*

**27. What is Promise.all() and Promise.race()?**

**💡 Simple Answer:** Promise.all() runs multiple promises IN PARALLEL
and waits for ALL to finish (fails fast if any one rejects).
Promise.race() returns as soon as the FIRST promise settles (resolve or
reject), ignoring the rest.

**📌 Example:** const [a,b] = await Promise.all([fetchA(),
fetchB()]);

**💻 Code:**

```javascript
async function loadDashboard() {
const [users, orders, products] = await Promise.all([
User.find(),
Order.find(),
Product.find()
]);
console.log(users.length, orders.length, products.length);
}
// Much faster than awaiting each one after another
```

**28. How do you handle errors in Express (error-handling middleware)?**

**💡 Simple Answer:** Wrap risky code in try/catch and pass errors to
next(err). Express then routes it to a special error-handling middleware
that has 4 parameters (err, req, res, next) --- it must be defined LAST,
after all routes.

**📌 Example:** app.use((err, req, res, next) => {
res.status(500).json({error: err.message}); });

**💻 Code:**

```javascript
app.get("/user/:id", async (req, res, next) => {
try {
const user = await User.findById(req.params.id);
if (!user) return res.status(404).json({ message: "User not found"
});
res.json(user);
} catch (err) {
next(err); // forward to error middleware
}
});
// Error-handling middleware - always LAST, has 4 params
app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).json({ message: "Something went wrong" });
});
```

**✍ INTERVIEWER TIP:** *Written task: 'Add proper error handling to
this route' is one of the most common backend interview tasks.*

**29. How do you use Express Router for modular routes?**

**💡 Simple Answer:** Instead of writing all routes in one file,
express.Router() lets you create a mini router in a separate file (like
userRoutes.js) and plug it into the main app --- keeps code organized.

**📌 Example:** // userRoutes.js: const router = express.Router();
router.get('/', ...); // app.js: app.use('/api/users', userRoutes);

**💻 Code:**

```javascript
// routes/userRoutes.js
const express = require("express");
const router = express.Router();
router.get("/", (req, res) => res.send("All users"));
router.get("/:id", (req, res) => res.send("One user"));
module.exports = router;
// server.js
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);
// Final routes: GET /api/users and GET /api/users/:id
```

**30. What is CORS and how do you enable it in Express?**

**💡 Simple Answer:** CORS (Cross-Origin Resource Sharing) is a browser
security rule that blocks a frontend on one domain from calling an API
on a different domain, unless the server explicitly allows it. Use the
'cors' npm package to allow it.

**📌 Example:** npm install cors app.use(cors());

**💻 Code:**

```javascript
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors()); // allow all origins (dev mode)
// or restrict to a specific frontend:
app.use(cors({ origin: "https://myfrontend.com" }));
```

**31. What does express.json() do and why do you need it?**

**💡 Simple Answer:** It's built-in middleware that parses incoming
JSON in the request body and puts it into req.body, so you can use it.
Without it, req.body would be undefined for JSON requests.

**📌 Example:** app.use(express.json());
app.post('/users',(req,res)=>{ console.log(req.body.name); });

**💻 Code:**

```javascript
const express = require("express");
const app = express();
app.use(express.json()); // MUST come before routes that read
req.body
app.post("/api/users", (req, res) => {
const { name, email } = req.body; // works because of express.json()
res.json({ message: `Created ${name}` });
});
```

**✍ INTERVIEWER TIP:** *Common mistake question: 'Why is req.body
undefined?' Answer: forgot app.use(express.json()).*

**32. What are good REST API design principles?**

**💡 Simple Answer:** Use nouns (not verbs) in URLs, use plural resource
names, use correct HTTP methods and status codes, nest resources
logically, version your API, and keep responses consistent (always JSON
with clear structure).

**📌 Example:** Good: GET /api/v1/users/5/orders Bad: GET
/api/getUserOrders?id=5

**💻 Code:**

```javascript
// GOOD REST design
// GET /api/v1/products
// GET /api/v1/products/:id
// POST /api/v1/products
// PUT /api/v1/products/:id
// DELETE /api/v1/products/:id
// Nested resource example:
// GET /api/v1/users/:userId/orders -> orders belonging to a user
```

**33. What are common HTTP status codes and when do you use them?**

**💡 Simple Answer:** 200 OK = success. 201 Created = new resource made.
400 Bad Request = invalid input from client. 401 Unauthorized = not
logged in. 403 Forbidden = logged in but no permission. 404 Not Found =
resource doesn't exist. 500 Internal Server Error = server-side bug.

**📌 Example:** res.status(201).json(newUser); // after successful
creation

**💻 Code:**

```javascript
app.post("/api/users", async (req, res) => {
if (!req.body.email) {
return res.status(400).json({ message: "Email is required" }); //
400
}
const user = await User.create(req.body);
res.status(201).json(user); // 201 Created
});
app.get("/api/users/:id", async (req, res) => {
const user = await User.findById(req.params.id);
if (!user) return res.status(404).json({ message: "Not found" });
// 404
res.status(200).json(user); // 200
});
```

**34. How do you perform CRUD operations in MongoDB (native driver)?**

**💡 Simple Answer:** CRUD = Create, Read, Update, Delete. In MongoDB:
insertOne/insertMany, find/findOne, updateOne/updateMany,
deleteOne/deleteMany.

**📌 Example:** db.collection('users').insertOne({name:'A'})

**💻 Code:**

```javascript
// Create
await db.collection("users").insertOne({ name: "Deepanshu", age:
21 });
// Read
const user = await db.collection("users").findOne({ name:
"Deepanshu" });
const all = await db.collection("users").find({}).toArray();
// Update
await db.collection("users").updateOne(
{ name: "Deepanshu" },
{ $set: { age: 22 } }
);
// Delete
await db.collection("users").deleteOne({ name: "Deepanshu" });
```

**✍ INTERVIEWER TIP:** *Interviewers frequently ask you to write raw
CRUD queries like these from memory.*

**35. What is Mongoose and how do you define a schema/model?**

**💡 Simple Answer:** Mongoose is an ODM (Object Data Modeling) library
for MongoDB + Node. A Schema defines the SHAPE of your documents
(fields, types, rules). A Model is a class built from the schema that
you use to interact with the database.

**📌 Example:** const userSchema = new mongoose.Schema({ name: String
}); const User = mongoose.model('User', userSchema);

**💻 Code:**

```javascript
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
name: { type: String, required: true },
email: { type: String, required: true, unique: true },
age: { type: Number, default: 18 },
createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);
module.exports = User;
```

**✍ INTERVIEWER TIP:** *Very common written task: 'Define a Mongoose
schema for a User with name, email, and password.'*

**36. How does Mongoose validation work?**

**💡 Simple Answer:** You add rules directly in the schema (required,
min, max, unique, match for regex, enum for fixed choices, or a custom
validate function). Mongoose checks these automatically before saving.

**📌 Example:** email: { type: String, required: true, match:
/.+@.+..+/ }

**💻 Code:**

```javascript
const productSchema = new mongoose.Schema({
name: { type: String, required: [true, "Name is required"] },
price: { type: Number, required: true, min: 0 },
category: {
type: String,
enum: ["electronics", "clothing", "food"], // only these
values allowed
}
});
// Using it:
const product = new Product({ name: "Phone", price: -100 });
product.save().catch(err => console.log(err.message)); // validation
error
```

**37. Embedding vs Referencing in MongoDB --- what's the difference?**

**💡 Simple Answer:** Embedding: store related data INSIDE the same
document (fast reads, good for data that's always accessed together and
doesn't grow huge, like an address). Referencing: store just the ID and
keep related data in a separate collection (better for large or
frequently changing data, like a user's many orders).

**📌 Example:** Embed: { name:'A', address:{city:'Delhi'} }
Reference: { name:'A', orderIds:[id1,id2] }

**💻 Code:**

```javascript
// Embedding - address rarely changes and is always needed with user
const userSchema = new mongoose.Schema({
name: String,
address: { city: String, pincode: String } // embedded
});
// Referencing - orders are many and grow over time
const orderSchema = new mongoose.Schema({
product: String,
user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } //
reference
});
```

**✍ INTERVIEWER TIP:** *Interviewers love asking: 'When would you
embed vs reference?' --- give a real example either way.*

**38. What is indexing in MongoDB and why does it matter?**

**💡 Simple Answer:** An index is like a book's index page --- it lets
MongoDB find documents FAST without scanning every document. Without
indexes, queries on large collections get slow. Trade-off: indexes speed
up reads but slightly slow down writes.

**📌 Example:** db.users.createIndex({ email: 1 }) // 1 = ascending
index

**💻 Code:**

```javascript
// Mongoose way - inside schema
const userSchema = new mongoose.Schema({
email: { type: String, unique: true, index: true }
});
// Native driver way
await db.collection("users").createIndex({ email: 1 });
// Now queries like this become much faster on large data:
await User.findOne({ email: "deep@example.com" });
```

**39. What is the difference between Authentication and Authorization?**

**💡 Simple Answer:** Authentication = verifying WHO you are (login with
email/password). Authorization = verifying WHAT you're allowed to do
(e.g., only admins can delete a user). Authentication always happens
first.

**📌 Example:** Login = authentication. 'Only admin can access /admin
route' = authorization.

**💻 Code:**

```javascript
// Authentication middleware - checks WHO
function verifyToken(req, res, next) {
const token = req.headers.authorization;
if (!token) return res.status(401).json({ message: "Not logged in"
});
next();
}
// Authorization middleware - checks WHAT they can do
function isAdmin(req, res, next) {
if (req.user.role !== "admin") {
return res.status(403).json({ message: "Access denied" });
}
next();
}
app.delete("/api/users/:id", verifyToken, isAdmin,
deleteUserHandler);
```

**40. What is JWT (JSON Web Token) and how does it work?**

**💡 Simple Answer:** JWT is a compact, signed token used to prove
identity without the server storing sessions. After login, the server
creates a JWT and sends it to the client. The client sends it back in
each request's header; the server verifies its signature to confirm the
user is legit.

**📌 Example:** jwt.sign({id:user._id}, 'secretKey',
{expiresIn:'1h'})

**💻 Code:**

```javascript
const jwt = require("jsonwebtoken");
// 1. Create token after successful login
const token = jwt.sign(
{ id: user._id, role: user.role },
process.env.JWT_SECRET,
{ expiresIn: "1h" }
);
res.json({ token });
// 2. Verify token on protected routes
function auth(req, res, next) {
const token = req.headers.authorization?.split(" ")[1]; //
"Bearer \<token>"
try {
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;
next();
} catch (err) {
res.status(401).json({ message: "Invalid token" });
}
}
```

**✍ INTERVIEWER TIP:** *One of the MOST asked backend questions.
Practice writing sign + verify from memory.*

**41. How do you hash passwords securely (bcrypt)?**

**💡 Simple Answer:** NEVER store plain text passwords. bcrypt turns a
password into a scrambled 'hash' using a salt (random data) so even
identical passwords look different when hashed. On login, you compare
the entered password against the stored hash (you never 'un-hash' it).

**📌 Example:** const hash = await bcrypt.hash(password, 10); const
match = await bcrypt.compare(enteredPw, hash);

**💻 Code:**

```javascript
const bcrypt = require("bcrypt");
// Signup - hash before saving
async function signup(password) {
const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt
rounds
// save hashedPassword to DB, never save plain password
return hashedPassword;
}
// Login - compare
async function login(enteredPassword, storedHash) {
const isMatch = await bcrypt.compare(enteredPassword, storedHash);
return isMatch; // true or false
}
```

**✍ INTERVIEWER TIP:** *Interviewers ask you to write the full
signup+login flow using bcrypt + JWT together --- practice this combo.*

**42. What are environment variables and why use dotenv?**

**💡 Simple Answer:** Environment variables store sensitive/config
values (DB URL, secret keys, ports) OUTSIDE your code, so they're not
hardcoded or pushed to GitHub. The 'dotenv' package loads them from a
.env file into process.env.

**📌 Example:** .env file: PORT=5000 JWT_SECRET=abc123 const PORT =
process.env.PORT;

**💻 Code:**

```javascript
// .env file (never commit this to git - add to .gitignore)
// PORT=5000
// MONGO_URI=mongodb://localhost:27017/mydb
// JWT_SECRET=mySuperSecretKey
// server.js
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
```

**43. What does next() do and what is middleware chaining?**

**💡 Simple Answer:** next() passes control from the current middleware
to the NEXT one in line. If you forget to call next() (and don't send a
response), the request just hangs forever. You can chain multiple
middlewares for one route (e.g., auth check, then validation, then the
controller).

**📌 Example:** app.get('/profile', verifyToken, validateUser,
getProfile);

**💻 Code:**

```javascript
function checkAuth(req, res, next) {
console.log("Checking auth...");
next(); // move to next middleware
}
function checkPermission(req, res, next) {
console.log("Checking permission...");
next(); // move to route handler
}
app.get("/dashboard", checkAuth, checkPermission, (req, res) => {
res.send("Welcome to dashboard");
});
// Order: checkAuth -> checkPermission -> final handler
```

**44. What is API versioning and why do you need it?**

**💡 Simple Answer:** Versioning lets you change/improve your API
without breaking apps that still use the old version. Common approach:
put the version in the URL, like /api/v1/ and /api/v2/.

**📌 Example:** app.use('/api/v1/users', userRoutesV1);
app.use('/api/v2/users', userRoutesV2);

**💻 Code:**

```javascript
const v1Routes = require("./routes/v1/userRoutes");
const v2Routes = require("./routes/v2/userRoutes");
app.use("/api/v1/users", v1Routes); // old clients keep working
app.use("/api/v2/users", v2Routes); // new clients get new features
```

**45. How do you implement pagination in an API?**

**💡 Simple Answer:** Instead of sending ALL records at once (slow,
heavy), pagination sends data in small 'pages' using query params like
page and limit, using .skip() and .limit() in MongoDB.

**📌 Example:** GET /api/products?page=2&limit=10

**💻 Code:**

```javascript
app.get("/api/products", async (req, res) => {
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;
const products = await Product.find().skip(skip).limit(limit);
const total = await Product.countDocuments();
res.json({
data: products,
currentPage: page,
totalPages: Math.ceil(total / limit)
});
});
```

**✍ INTERVIEWER TIP:** *Common written task: 'Add pagination to this
GET route.'*

**46. What is connection pooling and why does MongoDB/Mongoose use it?**

**💡 Simple Answer:** Opening a new database connection for every
request is slow and wasteful. Connection pooling keeps a set of reusable
open connections ready, so requests borrow one, use it, and return it
--- much faster. Mongoose does this automatically when you call
connect() once.

**📌 Example:** mongoose.connect(uri) // creates a pool automatically,
reused across requests

**💻 Code:**

```javascript
// Connect ONCE when the server starts (not inside every route!)
mongoose.connect(process.env.MONGO_URI, {
maxPoolSize: 10 // max simultaneous connections in the pool
});
// WRONG - don't do this inside a route handler:
// app.get("/users", async (req,res) => { mongoose.connect(...);
... })
```

**47. What is rate limiting and how do you add it in Express?**

**💡 Simple Answer:** Rate limiting restricts how many requests a client
(IP) can make in a given time window, to prevent abuse/DDoS. Commonly
done with the 'express-rate-limit' package.

**📌 Example:** npm install express-rate-limit

**💻 Code:**

```javascript
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
windowMs: 15 * 60 * 1000, // 15 minutes
max: 100, // limit each IP to 100 requests per window
message: "Too many requests, please try again later"
});
app.use("/api/", limiter); // apply to all /api routes
```

**48. What is the difference between PUT and PATCH?**

**💡 Simple Answer:** PUT replaces the ENTIRE resource (you must send
all fields, missing ones may be wiped/reset). PATCH updates only the
fields you send (partial update).

**📌 Example:** PUT /users/1 {name, email, age} -- all fields PATCH
/users/1 {age: 22} -- only age changes

**💻 Code:**

```javascript
// PUT - full replace
app.put("/api/users/:id", async (req, res) => {
const user = await User.findByIdAndUpdate(req.params.id, req.body, {
new: true, overwrite: true });
res.json(user);
});
// PATCH - partial update
app.patch("/api/users/:id", async (req, res) => {
const user = await User.findByIdAndUpdate(req.params.id, { $set:
req.body }, { new: true });
res.json(user);
});
```

**49. What does Mongoose populate() do?**

**💡 Simple Answer:** populate() replaces a referenced ObjectId field
with the ACTUAL document data from the other collection --- like a JOIN
in SQL. Used when you referenced data instead of embedding it (see Q37).

**📌 Example:** Order.find().populate('user') // fills in full user
details instead of just the ID

**💻 Code:**

```javascript
const orderSchema = new mongoose.Schema({
product: String,
user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});
const Order = mongoose.model("Order", orderSchema);
// Without populate: user field is just an ObjectId string
const orders1 = await Order.find();
// With populate: user field becomes the full user object
const orders2 = await Order.find().populate("user");
console.log(orders2[0].user.name); // works only with populate
```

**50. Write a simple CRUD REST API for a 'Task' resource (Express +
Mongoose).**

**💡 Simple Answer:** This is the classic 'build it live' interview
task --- combining routes, Mongoose model, async/await and status codes
into one working mini-API.

**📌 Example:** Model: Task {title, completed}. Routes: GET/POST /tasks,
PUT/DELETE /tasks/:id

**💻 Code:**

```javascript
// models/Task.js
const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
title: { type: String, required: true },
completed: { type: Boolean, default: false }
});
module.exports = mongoose.model("Task", taskSchema);
// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
router.get("/", async (req, res) => {
const tasks = await Task.find();
res.json(tasks);
});
router.post("/", async (req, res) => {
const task = await Task.create(req.body);
res.status(201).json(task);
});
router.put("/:id", async (req, res) => {
const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
new: true });
if (!task) return res.status(404).json({ message: "Task not found"
});
res.json(task);
});
router.delete("/:id", async (req, res) => {
await Task.findByIdAndDelete(req.params.id);
res.status(204).send();
});
module.exports = router;
// server.js
// app.use("/api/tasks", require("./routes/taskRoutes"));
```

**✍ INTERVIEWER TIP:** *THIS EXACT TASK is asked live in many
interviews: 'Build a CRUD API for X in 20 minutes.' Practice typing
it fast, without copy-paste.*

