# Part 3 — Authentication & Security

> 🏷️ **Level Guide**:
> - 📖 = Definition only is enough
> - 🏗️ = Architecture explanation needed  
> - 💻 = Code explanation may be asked

---

## Q1. What is Authentication vs Authorization?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> - **Authentication** = Verifying **WHO you are** (Login — "Are you really John?")
> - **Authorization** = Checking **what you're ALLOWED to do** (Permission — "John, can you delete this news?")
>
> **Real example from our project**:
> - Authentication: User logs in with email + password → system confirms identity ✅
> - Authorization: That user tries to access admin panel → system checks if they're an Admin ❌ (blocked if not)

---

## Q2. What is JWT (JSON Web Token)? How does it work?

**🏗️ Architecture Level needed**

> **Simple Answer (Definition)**:
>
> JWT is a **small, secure "badge"** that the server gives to a user after login. The user carries this badge with every request to prove who they are.

> **Architecture Explanation — Step by Step**:
>
> ```
> Step 1: User submits email + password
>     ↓
> Step 2: Server checks if password is correct
>     ↓
> Step 3: Server creates a JWT token containing user's ID and type
>         Example token (3 parts separated by dots):
>         eyJhbGci... . eyJ1c2VySWQ... . SflKxwRJ...
>         [Header]       [Payload]        [Signature]
>     ↓
> Step 4: Server sends this token back to the user (stored in browser cookie)
>     ↓
> Step 5: For every future request, user automatically sends this token
>     ↓
> Step 6: Server reads token, verifies it's valid and not expired
>         If valid → allows the request
>         If invalid/expired → returns 401 Unauthorized
> ```

> **The 3 parts of a JWT**:
> - **Header**: Says what algorithm was used to sign the token
> - **Payload**: Contains the user info (userId, userType, when it expires)
> - **Signature**: Proof that the token wasn't tampered with (created using a secret key)

**💻 Code Level** (if asked to show):
```javascript
// Creating a JWT after login
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: user._id, userType: 'CommunityUser' },  // Payload
  process.env.JWT_SECRET,                              // Secret key
  { expiresIn: '7d' }                                 // Expires in 7 days
);

// Sending token as a cookie
res.cookie('token', token, { httpOnly: true, secure: true });

// Verifying a JWT in middleware
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded = { userId: "...", userType: "CommunityUser", iat: ..., exp: ... }
```

---

## Q3. What is bcrypt? How does password hashing work?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> **NEVER store passwords as plain text** in the database. If the database gets hacked, all passwords are exposed.
>
> **bcrypt** converts a password into a **scrambled, unreadable string (hash)** that cannot be reversed.
>
> It's like putting a document through a shredder — you can't put it back together.
>
> **How it works**:
> - User registers with password: `"MyPassword123"`
> - bcrypt hashes it: → `"$2b$10$XpE8.../scrambled..."`
> - Database stores the HASH, never the original password
>
> **When user logs in**:
> - bcrypt runs the same process on the entered password
> - Compares the two hashes — if they match → correct password ✅
> - The original password is NEVER revealed

**💻 Code Level** (if asked to show):
```javascript
const bcrypt = require('bcryptjs');

// When user registers — hash the password
const hashedPassword = await bcrypt.hash(password, 10); // 10 = "salt rounds"
user.password = hashedPassword;  // Store the hash

// When user logs in — compare
const isMatch = await bcrypt.compare(enteredPassword, user.password);
if (!isMatch) return res.status(401).json({ error: "Wrong password" });
```

---

## Q4. Session-based Auth vs Token-based Auth (JWT) — What's the difference?

**🏗️ Architecture Level needed**

> **Simple Answer**:

| Feature | Session-based | Token-based (JWT) |
|---------|:-------------:|:-----------------:|
| Where is identity stored? | **Server** (in memory/DB) | **Client** (in cookie/localStorage) |
| Server needs to remember user? | YES (stores session data) | NO (stateless) |
| Scales well with multiple servers? | Hard (all servers need same session) | Easy (any server can verify token) |
| Works with mobile apps? | Complex | Simple |
| Used in our project? | ❌ | ✅ |

> **Why JWT is better for our project**:
> - Our backend might run on multiple servers (scaling). With JWT, every server can verify the token independently without talking to each other.
> - Mobile apps are easier — just send the token in the request header

---

## Q5. What is your Middleware chain for Authentication?

**🏗️ Architecture Level needed**

> **Simple Answer**:
>
> Our project has **multiple auth middleware functions** because we have 4 user types (Normal, Community, Expert, Admin). Each has different permissions.
>
> **The middleware chain works like a security checkpoint**:
>
> ```
> Request arrives at a protected route
>     ↓
> [Step 1] authMiddleware — checks if JWT token exists and is valid
>           If NO token → 401 Unauthorized (stop here)
>           If YES → decode token, attach user info to request
>     ↓
> [Step 2] roleMiddleware — checks if user TYPE is allowed
>           Example: Only CommunityUser can submit news
>           If wrong type → 403 Forbidden (stop here)
>           If correct → continue
>     ↓
> [Step 3] Controller — actual business logic runs
> ```
>
> **Example protected routes**:
> - `POST /api/news/upload` → Requires: `authMiddleware` + `isCommunityUser`
> - `GET /api/admin/users` → Requires: `authMiddleware` + `isAdmin`
> - `POST /api/comments/expert` → Requires: `authMiddleware` + `isExpertUser`

---

## Q6. What is httpOnly cookie? Why is it more secure?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> When we store the JWT token in a **httpOnly cookie**, JavaScript running in the browser CANNOT access it.
>
> This protects against **XSS attacks (Cross-Site Scripting)** — where a hacker injects malicious JavaScript into the page to steal the token.
>
> - **Without httpOnly**: Hacker's JavaScript → reads your token from `localStorage` → steals it
> - **With httpOnly**: Hacker's JavaScript → tries to read the cookie → BLOCKED (browser forbids it)
>
> In our project, all JWT tokens are stored as httpOnly cookies for this reason.

---

## Q7. What is the difference between 401 and 403 errors?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> - **401 Unauthorized** = "We don't know WHO you are" — You're not logged in, or your token is invalid/expired
> - **403 Forbidden** = "We know WHO you are, but you're NOT ALLOWED to do this" — You're logged in but don't have permission
>
> **Examples from our project**:
> - User with no token tries to access `/api/news/upload` → **401** (not authenticated)
> - CommunityUser tries to access `/api/admin/users` → **403** (not authorized — wrong user type)

---

## Q8. What is OWASP? What common security threats did you handle?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> OWASP is an organization that lists the most common web security threats. Even if you don't know all of them, mentioning a few shows security awareness.
>
> **Security threats we handled in our project**:
>
> | Threat | What it is | How we handled it |
> |--------|-----------|------------------|
> | **Password theft** | Hacker steals plain text passwords from DB | bcrypt hashing — passwords are unreadable |
> | **Token theft (XSS)** | Malicious JS steals the auth token | httpOnly cookies — JS can't access them |
> | **Brute force** | Hacker tries millions of passwords | bcrypt is slow by design, making this impractical |
> | **CSRF** | Hacker tricks user into making requests | httpOnly + SameSite cookie settings |
> | **Unauthorized access** | Non-admin accessing admin routes | Role-based middleware on every protected route |

---

## 📝 Summary — What Level is Enough?

| Question | Definition ✅ | Architecture ✅ | Code ✅ |
|----------|:---:|:---:|:---:|
| Auth vs Authorization? | ✅ | — | — |
| What is JWT? | — | ✅ | ✅ (basic) |
| How does bcrypt work? | ✅ | — | ✅ (basic) |
| Session vs JWT? | — | ✅ | — |
| Your middleware chain? | — | ✅ | — |
| httpOnly cookie? | ✅ | — | — |
| 401 vs 403? | ✅ | — | — |
| Security threats handled? | ✅ | — | — |

---

**Next: [Part 4 — AI & LLM](./04-AI-AND-LLM.md)**
