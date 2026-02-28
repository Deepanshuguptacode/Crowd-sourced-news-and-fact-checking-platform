# 15 — Forms and Validation: Controlled Inputs Deep-Dive

## Table of Contents
1. [The Problem: How Do Forms Work in React?](#1-the-problem-how-do-forms-work-in-react)
2. [Controlled vs Uncontrolled Inputs](#2-controlled-vs-uncontrolled-inputs)
3. [Single Field State](#3-single-field-state)
4. [Object State for Multiple Fields](#4-object-state-for-multiple-fields)
5. [Computed Property Names — The `[id]: value` Trick](#5-computed-property-names--the-id-value-trick)
6. [Form Submission — preventDefault](#6-form-submission--preventdefault)
7. [Validation Patterns](#7-validation-patterns)
8. [File Inputs — The Exception](#8-file-inputs--the-exception)
9. [VoxVeritas Form Examples](#9-voxveritas-form-examples)
10. [Interview Q&A](#10-interview-qa)

---

## 1. The Problem: How Do Forms Work in React?

In plain HTML, the browser manages form state internally. When you type in an `<input>`, the browser stores the value. In React, we want **React** to be the single source of truth for the UI. This means React state must hold the input values.

---

## 2. Controlled vs Uncontrolled Inputs

### 2.1 — Controlled Input (React manages)

```jsx
const [email, setEmail] = useState('');

<input
  value={email}            // Display value from React state
  onChange={(e) => setEmail(e.target.value)}  // Update React state on every keystroke
/>

// The loop:
// 1. User types "a"
// 2. onChange fires → setEmail("a")
// 3. React re-renders → input shows "a" (from state)
// 4. User types "b"
// 5. onChange fires → setEmail("ab")
// 6. React re-renders → input shows "ab"
```

### 2.2 — Uncontrolled Input (Browser manages)

```jsx
const inputRef = useRef();

<input ref={inputRef} />

// Read value only when needed:
const value = inputRef.current.value;
```

**VoxVeritas uses controlled inputs everywhere** because:
- You can validate on every keystroke
- You can transform input (trim, uppercase, etc.)
- You have instant access to the current value
- You can conditionally enable/disable the submit button

---

## 3. Single Field State

```jsx
const [newComment, setNewComment] = useState('');

<input
  type="text"
  value={newComment}
  onChange={(e) => setNewComment(e.target.value)}
  placeholder="Add a comment..."
/>
```

Used in CommentSection for the comment input.

---

## 4. Object State for Multiple Fields

When a form has many fields, instead of one `useState` per field, group them in an object:

```jsx
// Instead of:
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [userType, setUserType] = useState('normal');

// VoxVeritas LoginForm uses:
const [formData, setFormData] = useState({
  email: '',
  password: '',
  userType: 'normal',
});

// Update helper (spreads existing state, then overrides specific fields):
const upd = (changes) => setFormData(prev => ({ ...prev, ...changes }));

// Usage:
upd({ email: 'user@example.com' });
// Result: { email: 'user@example.com', password: '', userType: 'normal' }

upd({ userType: 'expert' });
// Result: { email: 'user@example.com', password: '', userType: 'expert' }
```

### 4.1 — Why Use Object State?

| Approach | Pros | Cons |
|---|---|---|
| Multiple `useState` | Simple, good for 2-3 fields | Verbose with many fields |
| Single object | Compact, easy reset `setFormData(initialState)` | Must spread: `{ ...prev, field: value }` |

---

## 5. Computed Property Names — The `[id]: value` Trick

### 5.1 — The Theory

JavaScript computed property names let you use a variable as an object key:

```jsx
const field = 'email';
const obj = { [field]: 'hello' };
// Result: { email: 'hello' }
```

### 5.2 — Used in Generic Input Handlers

```jsx
const handleInput = (e) => {
  const { id, value } = e.target;
  // e.target.id = the id attribute of the input that changed
  // e.target.value = the current text in that input

  setFormData(prev => ({ ...prev, [id]: value }));
  // If id = "email" → { ...prev, email: value }
  // If id = "password" → { ...prev, password: value }
};

// ONE handler for ALL inputs:
<input id="email" value={formData.email} onChange={handleInput} />
<input id="password" value={formData.password} onChange={handleInput} />
// Both use the same handleInput — the [id] picks the right field
```

---

## 6. Form Submission — preventDefault

### 6.1 — The Problem

By default, `<form onSubmit={handler}>` causes the browser to:
1. Collect form data
2. Send an HTTP request to the page's URL
3. **Reload the entire page** (destroying React state)

### 6.2 — The Solution

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  // Stops the browser's default form submission behavior
  // Now we handle it ourselves with JavaScript

  const result = await authAPI.login(formData.userType, {
    email: formData.email,
    password: formData.password,
  });
  // ...
};

<form onSubmit={handleSubmit}>
  {/* inputs */}
  <button type="submit">Sign In</button>
</form>
```

---

## 7. Validation Patterns

### 7.1 — Required Field Check

```jsx
if (!formData.email || !formData.password) {
  toast.error('Please fill in all fields');
  return;  // Stop submission
}
```

### 7.2 — Email Format Validation

```jsx
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
  // Checks: something@something.something
};

if (!isValidEmail(formData.email)) {
  toast.error('Please enter a valid email');
  return;
}
```

### 7.3 — Password Match (Signup)

```jsx
if (formData.password !== formData.confirmPassword) {
  toast.error('Passwords do not match');
  return;
}
```

### 7.4 — File Validation

```jsx
// In FaceCapture:
if (!file.type.startsWith('image/')) {
  setError('Please select an image file');
  return;
}
if (file.size > 10 * 1024 * 1024) {
  setError('File too large. Max 10MB.');
  return;
}
```

### 7.5 — HTML5 Built-in Validation

```jsx
<input type="email" required />
// "required" prevents empty submission (browser shows tooltip)
// type="email" validates email format (browser built-in)

<select required>
  <option value="">Select...</option>
  <option value="normal">Onlooker</option>
</select>
// "required" + empty default option = must select a real option
```

---

## 8. File Inputs — The Exception

File inputs are **always uncontrolled** in React — you cannot set a file input's value programmatically (browser security restriction).

```jsx
// Cannot do: <input type="file" value={someFile} />  ← NOT ALLOWED

// Instead, read the file from the event:
const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  // e.target.files is a FileList (not a regular array)
  // Array.from() converts it to a regular array
  setSelectedFiles(files);
};

<input
  type="file"
  multiple           // Allow selecting multiple files
  accept="image/*"   // Only show image files in the picker
  onChange={handleFileChange}
/>
```

---

## 9. VoxVeritas Form Examples

### 9.1 — LoginForm: Object State + Generic Handler

```jsx
const [formData, setFormData] = useState({
  email: '', password: '', userType: 'normal'
});

const handleInput = (e) => {
  setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
};

<input id="email" type="email" value={formData.email} onChange={handleInput} />
<input id="password" type="password" value={formData.password} onChange={handleInput} />
```

### 9.2 — LoginForm: Separate UI State

```jsx
// Form data (sent to API):
const [formData, setFormData] = useState({ email: '', password: '', userType: 'normal' });

// UI state (NOT sent to API — controls visual behavior):
const [ui, setUi] = useState({
  showPassword: false,   // Toggle password visibility
  loading: false,        // Submit button spinner
  loginMethod: 'password', // 'password' or 'face'
  face: { open: false, image: null },
});

// Why separate? formData is "what to send".
// ui is "how the form looks". Different concerns, different state.
```

### 9.3 — CommentSection: Simple Single-Field

```jsx
const [newComment, setNewComment] = useState('');

<input
  value={newComment}
  onChange={(e) => setNewComment(e.target.value)}
  placeholder="Add a comment..."
/>
<button onClick={handleAddComment}>Post</button>

// After posting:
setNewComment('');  // Clear input
```

### 9.4 — NewsSubmissionForm: FormData for File Upload

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('title', title);
  fd.append('description', description);
  fd.append('link', sourceUrl);
  selectedFiles.forEach(file => fd.append('images', file));

  await newsAPI.uploadNews(fd);
  // Content-Type is automatically set to multipart/form-data
};
```

---

## 10. Interview Q&A

**Q: Why use controlled inputs if they cause a re-render on every keystroke?**
A: React is highly optimized for frequent re-renders. The virtual DOM diffing ensures only the changed input element updates in the real DOM. The benefit (instant access to form data, real-time validation, ability to transform input) far outweighs the minimal performance cost.

**Q: What is `e.preventDefault()` and when do you need it?**
A: `e.preventDefault()` stops the browser's default behavior for an event. For form submission, the default is sending an HTTP request and reloading the page. In React SPAs, we ALWAYS call it in form submit handlers because we handle submission via JavaScript (API calls), not browser navigation.

**Q: Why does VoxVeritas separate formData and ui state in LoginForm?**
A: Separation of concerns. `formData` contains values that will be sent to the API (email, password, userType). `ui` contains visual state (show/hide password, loading spinner, which tab is active). Keeping them separate makes it clear what gets sent vs. what just affects the UI.

**Q: Can you use `useState` with an array for form validation errors?**
A: Yes. A common pattern is `const [errors, setErrors] = useState([])` and then `setErrors(['Email required', 'Password too short'])`. VoxVeritas uses `toast` notifications instead, which is a simpler approach but doesn't persist error messages on-screen.

---

**Next → [16-TAILWIND-CSS.md](./16-TAILWIND-CSS.md)** — Utility-first CSS and the VoxVeritas design system.
