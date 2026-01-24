# 15 - Forms and Validation: Handling User Input

## What You'll Learn
- Controlled components pattern for forms
- Form state management with useState
- Input validation techniques
- Error handling and user feedback
- Form submission patterns

---

## Controlled Components Pattern

In React, form inputs are typically "controlled" - their value is tied to state.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONTROLLED vs UNCONTROLLED INPUTS                        │
└─────────────────────────────────────────────────────────────────────────────┘

UNCONTROLLED (native HTML):
┌─────────────────────────────────────────────────────────────────────────────┐
│  <input type="text" />                                                      │
│                                                                             │
│  - DOM holds the value                                                      │
│  - React doesn't know what's typed                                          │
│  - Use refs to access value                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

CONTROLLED (React way):
┌─────────────────────────────────────────────────────────────────────────────┐
│  const [value, setValue] = useState('');                                    │
│  <input value={value} onChange={(e) => setValue(e.target.value)} />        │
│                                                                             │
│  - React state holds the value                                              │
│  - Every keystroke updates state                                            │
│  - State is single source of truth                                          │
│  - Easy to validate, transform, or reset                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Form State Management

### Single Field

```jsx
// Single field example
const [email, setEmail] = useState('');

<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Multiple Fields (Object State)

```jsx
// Multiple fields with single state object
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  userType: 'normal'
});

// Generic handler for any field
const handleInputChange = (e) => {
  const { id, value } = e.target;
  setFormData({
    ...formData,    // Keep other fields
    [id]: value     // Update changed field (computed property name)
  });
};

// Usage
<input
  type="text"
  id="name"        // id matches state key
  value={formData.name}
  onChange={handleInputChange}
/>

<input
  type="email"
  id="email"       // id matches state key
  value={formData.email}
  onChange={handleInputChange}
/>
```

### Why `[id]: value` Works

```jsx
const id = 'email';
const value = 'test@example.com';

// This:
{ [id]: value }

// Becomes:
{ email: 'test@example.com' }

// Computed property names allow dynamic keys
```

---

## Login Form Example

```jsx
// frontend/src/pages/LoginForm.jsx

const LoginForm = () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // FORM STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'normal'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Text/email/password inputs
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
  };
  
  // Select dropdown
  const handleUserTypeChange = (e) => {
    setFormData({
      ...formData,
      userType: e.target.value
    });
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FORM SUBMISSION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent page refresh
    
    // Validation
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await authAPI.login(formData.userType, {
        email: formData.email,
        password: formData.password
      });
      
      toast.success('Login successful!');
      navigate('/home');
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
```

### Form JSX

```jsx
  return (
    <form onSubmit={handleSubmit}>
      {/* User Type Dropdown */}
      <div>
        <label htmlFor="userType">Account Type</label>
        <select
          id="userType"
          value={formData.userType}
          onChange={handleUserTypeChange}
          required
        >
          <option value="normal">Onlooker</option>
          <option value="community">Community User</option>
          <option value="expert">Expert User</option>
        </select>
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="email">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="you@example.com"
            required
            className="pl-10 ..."  // Padding for icon
          />
        </div>
      </div>

      {/* Password Input with Toggle */}
      <div>
        <label htmlFor="password">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter password"
            required
            className="pl-10 pr-10 ..."
          />
          {/* Toggle visibility button */}
          <button
            type="button"  // Important: not submit!
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={loading ? 'opacity-50 cursor-not-allowed' : ''}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};
```

---

## Validation Patterns

### Basic Required Field Validation

```jsx
const handleSubmit = (e) => {
  e.preventDefault();
  
  // Check required fields
  if (!formData.email) {
    toast.error('Email is required');
    return;
  }
  
  if (!formData.password) {
    toast.error('Password is required');
    return;
  }
  
  // Proceed with submission
};
```

### Email Format Validation

```jsx
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!isValidEmail(formData.email)) {
    toast.error('Please enter a valid email address');
    return;
  }
  
  // Proceed
};
```

### Password Confirmation

```jsx
// In signup form
const [formData, setFormData] = useState({
  password: '',
  confirmPassword: ''
});

const handleSubmit = (e) => {
  e.preventDefault();
  
  if (formData.password !== formData.confirmPassword) {
    toast.error("Passwords don't match!");
    return;
  }
  
  if (formData.password.length < 6) {
    toast.error("Password must be at least 6 characters");
    return;
  }
  
  // Proceed
};
```

### Conditional Field Validation

```jsx
// Expert users need profession field
const handleSubmit = (e) => {
  e.preventDefault();
  
  // Basic validation
  if (!formData.name || !formData.email || !formData.password) {
    toast.error('Please fill in all required fields');
    return;
  }
  
  // Conditional validation for experts
  if (formData.userType === 'expert' && !formData.profession) {
    toast.error('Experts must provide their profession');
    return;
  }
  
  // Proceed
};
```

---

## File Input Handling

```jsx
// Profile picture or news screenshot upload

const [file, setFile] = useState(null);
const [preview, setPreview] = useState(null);
const fileInputRef = useRef(null);

const handleFileChange = (e) => {
  const selectedFile = e.target.files[0];
  
  if (selectedFile) {
    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (e.g., max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);  // Base64 data URL
    };
    reader.readAsDataURL(selectedFile);
  }
};

// In JSX
<input
  type="file"
  ref={fileInputRef}
  onChange={handleFileChange}
  accept="image/*"
  className="hidden"  // Hide native input
/>

<button 
  type="button"
  onClick={() => fileInputRef.current.click()}  // Trigger file dialog
>
  Select Image
</button>

{preview && <img src={preview} alt="Preview" />}
```

---

## Form Submission Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FORM SUBMISSION FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

User fills form
      │
      ▼
User clicks Submit
      │
      ▼
handleSubmit(e) called
      │
      ▼
e.preventDefault()  ← Prevents page refresh
      │
      ▼
┌──────────────────┐
│  VALIDATION      │
│                  │
│  - Required?     │
│  - Valid format? │
│  - Match rules?  │
└──────────────────┘
      │
      ├─── Fail ──▶ toast.error('...'), return
      │
      ▼
setLoading(true)
      │
      ▼
┌──────────────────┐
│  TRY             │
│  - API call      │
│  - Handle success│
└──────────────────┘
      │
      ├─── Success ──▶ toast.success(), navigate(), reset form
      │
      └─── Error ──▶ toast.error(message)
      │
      ▼
setLoading(false)  ← finally block
```

---

## Dynamic Form Fields

```jsx
// Show/hide fields based on user type

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'normal',
    profession: ''  // Only for experts
  });

  return (
    <form>
      {/* Always visible fields */}
      <input id="name" ... />
      <input id="email" ... />
      <input id="password" ... />
      
      <select id="userType" value={formData.userType} onChange={...}>
        <option value="normal">Normal</option>
        <option value="community">Community</option>
        <option value="expert">Expert</option>
      </select>

      {/* Conditionally rendered field */}
      {formData.userType === 'expert' && (
        <div>
          <label htmlFor="profession">Profession</label>
          <input
            id="profession"
            value={formData.profession}
            onChange={handleInputChange}
            placeholder="e.g., Journalist, Researcher"
          />
        </div>
      )}

      <button type="submit">Sign Up</button>
    </form>
  );
};
```

---

## Form Reset After Submission

```jsx
const initialFormState = {
  title: '',
  content: '',
  link: ''
};

const [formData, setFormData] = useState(initialFormState);

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    await newsAPI.uploadNews(formData);
    toast.success('News submitted!');
    
    // Reset form to initial state
    setFormData(initialFormState);
    
  } catch (error) {
    toast.error('Submission failed');
  }
};
```

---

## Interview Questions & Answers

### Q1: What is a controlled component?

**Answer:** A form element whose value is controlled by React state. The input's `value` prop is tied to state, and `onChange` updates that state. React is the "single source of truth" for the input's value.

### Q2: Why use `e.preventDefault()` in form handlers?

**Answer:** By default, HTML forms refresh the page on submit. `preventDefault()` stops this behavior, allowing us to handle submission with JavaScript/React without losing application state.

### Q3: How do you handle multiple inputs with one handler?

**Answer:** Use a generic handler with computed property names:
```jsx
const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.id]: e.target.value  // id becomes key
  });
};
```

### Q4: How do you show password visibility toggle?

**Answer:**
1. Add `showPassword` boolean state
2. Set input `type` to `showPassword ? 'text' : 'password'`
3. Add toggle button with `onClick={() => setShowPassword(!showPassword)}`
4. Make sure toggle button has `type="button"` so it doesn't submit form

### Q5: How do you validate files before upload?

**Answer:** In the `onChange` handler:
1. Check `file.type` for allowed formats (e.g., `startsWith('image/')`)
2. Check `file.size` for maximum size
3. Use `FileReader` to create preview if needed
4. Show error with toast if validation fails

---

**Next: [16-TAILWIND-CSS.md](./16-TAILWIND-CSS.md)** - Styling with Tailwind CSS →
