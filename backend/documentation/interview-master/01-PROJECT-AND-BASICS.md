# Part 1 — Project Basics, Node.js, Express, MVC, REST API

> 🏷️ **Level Guide**:
> - 📖 = Definition only is enough
> - 🏗️ = Architecture explanation needed  
> - 💻 = Code explanation may be asked

---

## Q1. What is your project? Explain it in 2 minutes.

**📖 Sufficient at Definition Level**

> **Simple Answer:**
>
> My project is called **VoxVeritas**, which means "Voice of Truth". It is a **crowd-sourced news fact-checking platform**.
>
> **The problem it solves**: Fake news spreads very fast. People cannot easily verify if news is real or fake.
>
> **How it works (3 steps)**:
> 1. A user submits a news article on our platform
> 2. Community members and experts vote and comment on whether it is real or fake
> 3. Our AI (Google Gemini) reads all the comments and gives a **credibility score** — like a "Truth Score" from 0 to 100
>
> **Special features**:
> - 4 types of users: Normal, Community, Expert, Admin
> - Face login using AI (biometric authentication)
> - Debate rooms where people discuss topics in groups
> - AI automatically groups similar comments together
> - Scrapes trending news from NDTV every 10 minutes

---

## Q2. What is Node.js? Why did you use it?

**📖 Sufficient at Definition Level**

> **Simple Answer:**
>
> Node.js is a tool that lets you run **JavaScript on the server** (not just in browsers).
>
> Normally, JavaScript runs only in Chrome or Firefox. Node.js lets the same language run on your computer/server.
>
> **Why we used it**:
> - We already use JavaScript on the frontend (React)
> - So with Node.js, frontend and backend are in the **same language** — easier to maintain
> - Node.js is very fast at handling many requests at the same time (non-blocking I/O)
> - Huge library ecosystem (npm)

**🏗️ Architecture-level add-on** (if asked deeper):
> Node.js uses an **Event Loop**. Instead of waiting for one task to finish before starting another, it handles many things at once. Example: While waiting for the database to respond, it handles another user's request. This makes it very efficient.

---

## Q3. What is Express.js?

**📖 Sufficient at Definition Level**

> **Simple Answer:**
>
> Express.js is a **framework built on top of Node.js**. It makes building web servers much easier.
>
> Think of it like this:
> - **Node.js** = the engine of a car
> - **Express.js** = the steering wheel, gear, brake — the tools that make it easy to drive
>
> Without Express, you'd have to write a lot of complex code to handle URLs, requests, and responses.  
> With Express, it's simple:

```javascript
// Without Express — very long and messy
// With Express — clean and simple:
app.get('/api/news', (req, res) => {
  res.json({ news: [] });
});
```

> Express gives us: routing, middleware, error handling — all built-in.

---

## Q4. What is REST API? How does your project use it?

**📖 Sufficient at Definition Level**

> **Simple Answer:**
>
> REST API is a way for the **frontend (React) to talk to the backend (Node.js)** using the internet.
>
> REST uses standard HTTP methods:
> - **GET** → Fetch/read data (get all news articles)
> - **POST** → Create new data (submit a news article)
> - **PUT/PATCH** → Update data (edit a comment)
> - **DELETE** → Delete data (remove a comment)
>
> **In our project**, every action the user does on the React app sends an API request to Express. For example:
> - User submits news → **POST /api/news/upload**
> - User reads trending news → **GET /api/news/trending**
> - User logs in → **POST /api/auth/login**

---

## Q5. What is MVC Pattern? How does your project follow it?

**🏗️ Architecture Level needed**

> **Simple Answer (Definition)**:
>
> MVC stands for **Model-View-Controller**. It is a way to **organize your code** so that different parts of the app handle different responsibilities.

> **Architecture Explanation**:
>
> | Layer | Job | Example in our project |
> |-------|-----|------------------------|
> | **Model** | Defines how data is stored | `User.js`, `News.js` (Mongoose schemas) |
> | **View** | What the user sees | React frontend (separate project) |
> | **Controller** | Handles requests and sends responses | `newsController.js`, `authController.js` |
> | **Routes** | Which URL goes to which controller | `/routes/newsRoutes.js` |
> | **Services** | Business logic (reusable functions) | `llmService.js`, `vectorService.js` |
>
> **Request flow in our project**:
> ```
> User Request
>     ↓
> Route (which URL?)
>     ↓
> Middleware (is user logged in?)
>     ↓
> Controller (what to do?)
>     ↓
> Service (complex logic like AI calls)
>     ↓
> Model (save/fetch from MongoDB)
>     ↓
> Response sent back to user
> ```

---

## Q6. What is Middleware?

**🏗️ Architecture Level needed**

> **Simple Answer (Definition)**:
>
> Middleware is a **function that runs BETWEEN the request arriving and the response being sent**. It can check something, modify the request, or block the request entirely.

> **Real example from our project**:
>
> When a user tries to submit news:
> 1. Request arrives at `/api/news/upload`
> 2. **Auth Middleware** runs first — checks if the user has a valid login token (JWT)
> 3. If no token → sends back "401 Unauthorized" (user is blocked here)
> 4. If valid token → passes the request forward to the News Controller
> 5. **News Controller** handles the actual upload

> **Types of middleware we use**:
> - `authMiddleware` — checks JWT token
> - `cors()` — allows frontend and backend on different ports to communicate
> - `express.json()` — converts request body from raw text to JavaScript object
> - `multer` — handles file uploads (screenshots of news)
> - `errorHandler` — catches all errors and formats them nicely

---

## Q7. What is the difference between synchronous and asynchronous code?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> - **Synchronous** = do one thing at a time, wait for it to finish, then do the next
> - **Asynchronous** = start a task, don't wait, go do other things, come back when done
>
> **Real-life example**:
> - Synchronous = You go to a restaurant, wait at the counter until your food is ready, take it, then sit down
> - Asynchronous = You order food, sit at your table (do other things), and the waiter brings the food when it's ready
>
> **In our project**: When we call Google Gemini AI or MongoDB, those operations take time. We use `async/await` so the server doesn't freeze while waiting:

```javascript
// Async/await example from our project
const getNews = async (req, res) => {
  const news = await News.find({});  // Wait for MongoDB without blocking
  res.json({ news });
};
```

---

## Q8. What is CORS and why is it needed?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> CORS = **Cross-Origin Resource Sharing**
>
> By default, browsers block requests between different websites for security.  
> Our frontend runs on `http://localhost:3000` and backend on `http://localhost:5000`.  
> They are on **different ports = different origins**. The browser would block this!
>
> **CORS middleware** tells the browser: "It's okay, this frontend is allowed to talk to this backend."
>
> In our project:
> ```javascript
> app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
> ```

---

## 📝 Summary — What Level is Enough?

| Question | Definition ✅ | Architecture ✅ | Code ✅ |
|----------|:---:|:---:|:---:|
| What is your project? | ✅ | — | — |
| What is Node.js? | ✅ | — | — |
| What is Express.js? | ✅ | — | — |
| What is REST API? | ✅ | — | — |
| What is MVC? | — | ✅ | — |
| What is Middleware? | — | ✅ | — |
| Sync vs Async? | ✅ | — | ✅ (basic) |
| What is CORS? | ✅ | — | — |

---

**Next: [Part 2 — Database & MongoDB](./02-DATABASE-AND-MONGODB.md)**
