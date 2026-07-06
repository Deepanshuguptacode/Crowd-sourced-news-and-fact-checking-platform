# 17 — Security Best Practices

## Why This File Exists

Security is increasingly important in frontend interviews. Understanding XSS, CSRF, and input validation shows maturity as a developer.

---

## XSS (Cross-Site Scripting)

Injection of malicious scripts via user input.

```javascript
// VULNERABLE: innerHTML with user input
element.innerHTML = userInput;  // If userInput contains <script>alert('hacked')</script>

// SAFE: Use textContent (escapes HTML)
element.textContent = userInput;

// SAFE: Sanitize input
element.innerHTML = DOMPurify.sanitize(userInput);

// React: JSX automatically escapes
const safe = <div>{userInput}</div>;  // Automatically escaped
```

---

## CSRF Protection

Cross-Site Request Forgery protection.

```javascript
// Use SameSite cookies
Set-Cookie: session=abc123; SameSite=Strict

// Or use CSRF tokens in forms
<input type="hidden" name="csrf_token" value="random-token">

// Validate Origin header on server
if (req.headers.origin !== 'https://myapp.com') {
  return res.status(403).send('Invalid origin');
}
```

---

## Input Validation

```javascript
// Never trust user input
function sanitizeEmail(email) {
  // Whitelist approach: only allow expected characters
  return email.replace(/[^a-zA-Z0-9.@_-]/g, '');
}

// URL validation
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

---

## Next Steps

Move to [18 — Coding Interview Patterns](18-CODING-INTERVIEW-PATTERNS.md).
