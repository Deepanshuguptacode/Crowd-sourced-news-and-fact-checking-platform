# 05 — Authentication & Security Q&A

---

## Authentication Flow

**Q: Explain your complete authentication flow.**
A:

```
SIGNUP:
1. User submits { name, email, password, ...extra }
2. Check email uniqueness: CommunityUser.findOne({ email })
3. Hash password: bcrypt.hash(password, 10)
4. Create user document in MongoDB
5. Generate JWT: jwt.sign({ id: user._id, type: 'community' }, SECRET, { expiresIn: '7d' })
6. Set httpOnly cookie + return token in response body

LOGIN:
1. User submits { email, password }
2. Find user: CommunityUser.findOne({ email })
3. Compare password: bcrypt.compare(password, user.password)
4. If match: generate JWT, set cookie
5. If no match: 401 Unauthorized

SUBSEQUENT REQUESTS:
1. Browser sends cookie automatically
2. Auth middleware extracts token from cookie or Authorization header
3. jwt.verify(token, SECRET) — checks signature + expiry
4. Find user in DB: CommunityUser.findById(decoded.id)
5. Attach to req.user, call next()
```

---

## bcrypt Deep Dive

**Q: How does bcrypt work internally?**
A: bcrypt uses the Blowfish cipher as its base. Key steps:
1. Generate a random salt (128 bits)
2. Hash the password combined with salt using Blowfish encryption
3. Repeat the hashing `2^n` times (where n = cost factor, typically 10)
4. Encode the salt + hash as a single string: `$2b$10$<22-char-salt><31-char-hash>`

The output format `$2b$10$...` contains everything needed to verify: the algorithm version, cost factor, salt, and hash.

**Q: Why can't you decrypt a bcrypt hash?**
A: Hashing is a one-way function — it's computationally infeasible to reverse. The only way to verify is to hash the input again with the same salt and compare outputs. This is what `bcrypt.compare()` does internally.

**Q: What is a rainbow table attack? How does bcrypt prevent it?**
A: A rainbow table is a precomputed lookup table of common passwords → their hashes. An attacker compares stolen hashes against the table. bcrypt prevents this because:
1. Each password gets a unique random salt → same password produces different hashes
2. The hash includes the salt → the attacker would need a separate rainbow table per unique salt (computationally infeasible)

---

## JWT Security

**Q: What are the three parts of a JWT?**
A: `header.payload.signature` — all base64url encoded:

1. **Header**: `{ "alg": "HS256", "typ": "JWT" }` — algorithm and token type
2. **Payload**: `{ "id": "user123", "type": "community", "iat": 1720688479, "exp": 1721293279 }` — data
3. **Signature**: `HMACSHA256(base64(header) + "." + base64(payload), secret)` — integrity check

The signature is created using the secret key. Anyone can base64-decode the header and payload, but can't forge the signature without the secret.

**Q: Can you store sensitive data in JWT payload?**
A: No. The payload is only base64-encoded, not encrypted. Anyone with the token can decode and read it. Never store passwords, credit cards, or confidential data in JWT. Only store non-sensitive identifiers like user ID and type.

**Q: What is the difference between authentication and authorization?**
A:
- **Authentication** = "Who are you?" — Verifying identity (login, JWT verification)
- **Authorization** = "What can you do?" — Checking permissions (is this user allowed to add expert comments? → No, only ExpertUsers can)

In VoxVeritas:
- Authentication: `jwt.verify()` + `findById()` in middleware
- Authorization: Different middleware for each route (`authenticateExpertUser` only allows experts)

---

## Cookie Security

**Q: Why httpOnly cookies? What does it prevent?**
A: `httpOnly: true` means JavaScript cannot access the cookie via `document.cookie`. This prevents **XSS (Cross-Site Scripting)** attacks — if an attacker injects malicious JavaScript into your page, it cannot steal the JWT token.

```javascript
res.cookie('token', token, {
  httpOnly: true,    // JS cannot read → XSS protection
  secure: false,     // Set true in production → only sent over HTTPS
  sameSite: 'lax',   // Sent with same-site + top-level navigations → CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

**Q: What is CSRF? How does sameSite prevent it?**
A: CSRF (Cross-Site Request Forgery) — a malicious website tricks the user's browser into sending a request to your API using their existing cookies. `sameSite: 'lax'` prevents cookies from being sent in cross-site POST requests (only sent in GET navigations from external sites), blocking most CSRF attacks.

---

## The 6 Middleware Functions

**Q: Why do you have 6 authentication middleware functions?**
A: Each route needs to allow only specific user types:

| Middleware | Purpose |
|-----------|---------|
| `authenticateNormalUser` | Normal users only |
| `authenticateCommunityUser` | Community users (can add comments, vote) |
| `authenticateExpertUser` | Experts only (can add expert comments, vote on community comments) |
| `authenticateCommunityOrExpertUser` | Either community or expert (voting on news) |
| `authenticateAnyUser` | Any logged-in user (uploading news, debate rooms) |
| `authenticateAdmin` | Admin operations only |

**Q: How does authenticateAnyUser work?**
A: It tries all 4 user collections sequentially until it finds the user:
```javascript
let user = await NormalUser.findById(decoded.id);
if (user) { req.user = user; req.userType = 'normal'; return next(); }

user = await CommunityUser.findById(decoded.id);
if (user) { req.user = user; req.userType = 'community'; return next(); }
// ... ExpertUser, Admin
```

**Q: What's the performance issue with authenticateAnyUser?**
A: Up to 4 database queries per request in the worst case (when user is Admin). Optimization: store `userType` in the JWT payload and query only the right collection. Current implementation stores only `id` and `type`, so the middleware could be optimized to use the `type` field from the decoded JWT to pick the right model directly.

---

## Face Authentication (Biometric)

**Q: How does face authentication work in your system?**
A: Two-phase system:

**Registration:**
1. User submits a base64 webcam image
2. Node.js calls Flask: `POST /api/extract_embedding` → returns 512-dim ArcFace embedding
3. Store embedding array in user's MongoDB document: `user.faceEmbedding = [512 floats]`

**Login/Verification:**
1. User submits new base64 webcam image
2. Flask extracts 512-dim embedding from the new image
3. Node.js computes cosine similarity between new embedding and stored embedding
4. If similarity >= 0.3 (threshold) → verified

**Q: What is cosine similarity?**
A:
```
similarity = (A · B) / (||A|| × ||B||)

Where A · B = sum of products of corresponding elements
||A|| = square root of sum of squares of A's elements

Range: -1 to 1 (for face embeddings: 0 to 1 since ArcFace normalizes)
```
Two identical faces → similarity ~1.0. Different faces → similarity ~0.2-0.4. Threshold 0.3 accommodates lighting and angle variations.

**Q: Why 512 dimensions for face embeddings?**
A: ArcFace (the InsightFace model) produces 512-dimensional normalized embedding vectors. These capture the geometric relationship between facial features. 512 dimensions provide enough granularity to distinguish billions of unique faces while remaining computationally manageable.

---

## Admin Security

**Q: How do you prevent unauthorized admin account creation?**
A: Admin signup requires a `securityPassword` field that must match `process.env.ADMIN_SECURITY_PASSWORD`. Even if someone discovers the `/users/admin/signup` endpoint, they cannot create an admin without the environment-variable-stored security password.

```javascript
if (securityPassword !== process.env.ADMIN_SECURITY_PASSWORD) {
  return res.status(403).json({ message: 'Invalid security password' });
}
```

---

## Common Security Vulnerabilities (OWASP Top 10 Context)

**Q: What security vulnerabilities did you consider?**

| Vulnerability | How We Handle It |
|--------------|-----------------|
| SQL Injection | N/A (MongoDB with Mongoose — parameterized queries) |
| XSS | httpOnly cookies prevent token theft |
| CSRF | sameSite cookie attribute |
| Brute Force | bcrypt cost factor slows password attacks |
| Broken Authentication | JWT expiry (7 days), signature verification |
| Sensitive Data Exposure | Passwords never stored plaintext, never returned in responses |
| Unauthorized Access | Role-based middleware on every protected route |
| Injection | Mongoose type coercion prevents most injection |
