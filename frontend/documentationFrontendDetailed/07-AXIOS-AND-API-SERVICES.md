# 07 — Axios and API Services: Backend Communication Deep-Dive

## Table of Contents
1. [The Problem: How Does a Frontend Talk to a Backend?](#1-the-problem-how-does-a-frontend-talk-to-a-backend)
2. [What Is Axios?](#2-what-is-axios)
3. [The Axios Instance — Centralized Configuration](#3-the-axios-instance--centralized-configuration)
4. [Interceptors — Middleware for HTTP](#4-interceptors--middleware-for-http)
5. [API Service Modules — Organized by Feature](#5-api-service-modules--organized-by-feature)
6. [How Components Use the API Layer](#6-how-components-use-the-api-layer)
7. [Error Handling Patterns](#7-error-handling-patterns)
8. [File Uploads — multipart/form-data](#8-file-uploads--multipartform-data)
9. [Complete API Endpoint Map](#9-complete-api-endpoint-map)
10. [Interview Q&A](#10-interview-qa)

---

## 1. The Problem: How Does a Frontend Talk to a Backend?

### 1.1 — The Client-Server Model

```
┌────────────────────┐         HTTP Request          ┌────────────────────┐
│                    │  ──────────────────────────▶   │                    │
│  FRONTEND (React)  │    GET /api/news               │  BACKEND (Express) │
│  Port 5173 (dev)   │                                │  Port 3000 (dev)   │
│                    │  ◀──────────────────────────   │                    │
│                    │    JSON Response                │                    │
└────────────────────┘    { posts: [...] }            └────────────────────┘
```

The frontend (React running in the browser) cannot access the database directly. It must send **HTTP requests** to the backend API, which reads/writes the database and returns **JSON responses**.

### 1.2 — fetch vs Axios

JavaScript has a built-in `fetch()` function, but Axios provides advantages:

| Feature | `fetch()` | Axios |
|---|---|---|
| JSON parsing | Manual: `response.json()` | Automatic |
| Error handling | Only rejects on network failure | Rejects on any non-2xx status |
| Request interceptors | Not built-in | ✅ Built-in |
| Base URL | Must include full URL every time | Configure once |
| Request cancellation | AbortController (verbose) | Built-in cancel tokens |
| Timeout | Not built-in | Simple config option |

---

## 2. What Is Axios?

**Axios** is a promise-based HTTP client for JavaScript. VoxVeritas uses version **1.7.9**.

```bash
npm install axios   # Already installed in VoxVeritas
```

Basic usage:
```jsx
import axios from 'axios';

// GET request
const response = await axios.get('http://localhost:3000/api/news');
console.log(response.data);  // The parsed JSON body

// POST request
const response = await axios.post('http://localhost:3000/auth/login', {
  email: 'user@example.com',
  password: '12345'
});
```

---

## 3. The Axios Instance — Centralized Configuration

### 3.1 — Theory

Instead of writing the full URL and headers with every request, VoxVeritas creates a **configured instance** of Axios that all API calls use:

### 3.2 — The Code (from `src/services/api.js`)

```jsx
import axios from 'axios';
import config from '../config';

// ═══════════════════════════════════════════════════════════════════════════
// Create a pre-configured Axios instance
// ═══════════════════════════════════════════════════════════════════════════
const api = axios.create({
  baseURL: config.BASE_URL,
  // Development: 'http://localhost:3000'
  // Production:  'https://api.voxveritas.me'
  // Now every request like api.get('/api/news') becomes:
  //   GET http://localhost:3000/api/news (dev)

  withCredentials: true,
  // Send cookies with cross-origin requests.
  // Required because frontend (port 5173) and backend (port 3000)
  // are on different origins in development.

  headers: {
    'Content-Type': 'application/json',
    // Default: send JSON. Overridden for file uploads.
  },
});
```

### 3.3 — Config Source

```jsx
// src/config.js
const config = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  FACE_AUTH_URL: import.meta.env.VITE_FACE_AUTH_URL || 'http://localhost:5000',
};
export default config;
```

---

## 4. Interceptors — Middleware for HTTP

### 4.1 — Theory

Interceptors are functions that run **automatically** before every request or after every response. Think of them as middleware for HTTP calls.

```
  Component calls api.get('/api/news')
       │
       ▼
  ┌──────────────────────────────┐
  │  REQUEST INTERCEPTOR          │  ← Runs before the request is sent
  │  • Attach JWT token to header │
  └──────────────────────────────┘
       │
       ▼
  Request sent to server ──────────────▶ Server processes it
       │
       ▼
  ┌──────────────────────────────┐
  │  RESPONSE INTERCEPTOR         │  ← Runs after the response arrives
  │  • Log the response           │
  │  • Handle 401 errors globally │
  └──────────────────────────────┘
       │
       ▼
  Component receives response.data
```

### 4.2 — Request Interceptor (Attach JWT Token)

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR — Runs before EVERY request
// ═══════════════════════════════════════════════════════════════════════════
api.interceptors.request.use(
  (config) => {
    // Read the JWT token from localStorage
    const token = localStorage.getItem('token');

    if (token) {
      // Attach it as a Bearer token in the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
      // The server reads this header to identify the user
    }

    return config;  // Must return config to proceed
  },
  (error) => {
    // If something goes wrong preparing the request
    return Promise.reject(error);
  }
);
```

**Why this matters:** Without the interceptor, every API call would need:
```jsx
// WITHOUT interceptor (tedious):
api.get('/api/news', { headers: { Authorization: `Bearer ${token}` } });

// WITH interceptor (automatic):
api.get('/api/news');  // Token attached automatically!
```

### 4.3 — Response Interceptor (Logging)

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR — Runs after EVERY response
// ═══════════════════════════════════════════════════════════════════════════
api.interceptors.response.use(
  (response) => {
    // Successful response (2xx status)
    return response;
  },
  (error) => {
    // Error response (4xx, 5xx status)
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
    // Re-throw so the calling component can handle it
  }
);
```

---

## 5. API Service Modules — Organized by Feature

VoxVeritas organizes API calls into **named export objects**, each grouping related endpoints. This pattern keeps the service layer organized and components clean.

### 5.1 — authAPI (Authentication)

```jsx
export const authAPI = {
  login: async (userType, credentials) => {
    const response = await api.post(`/auth/${userType}/login`, credentials);
    return response.data;
    // POST /auth/community/login  { email, password }
    // Returns: { token, user: { _id, username, email, userType } }
  },

  signup: async (userType, userData) => {
    const response = await api.post(`/auth/${userType}/signup`, userData);
    return response.data;
    // POST /auth/expert/signup  { username, email, password, ... }
  },

  registerFace: async (userType, faceData) => {
    const response = await api.post(`/auth/${userType}/register-face`, faceData);
    return response.data;
  },

  verifyFace: async (userType, faceData) => {
    const response = await api.post(`/auth/${userType}/verify-face`, faceData);
    return response.data;
  },
};
```

### 5.2 — newsAPI (News Operations)

```jsx
export const newsAPI = {
  getAllPosts: async () => {
    const response = await api.get('/api/news');
    return response.data;
    // GET /api/news → [{ _id, title, content, author, upvotes, ... }, ...]
  },

  getCombinedFeed: async (params = {}) => {
    const response = await api.get('/api/news/combined-feed', { params });
    return response.data;
    // Can pass ?page=2&limit=10 via params object
  },

  uploadNews: async (formData) => {
    const response = await api.post('/api/news/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Override default JSON content type for file uploads
    });
    return response.data;
  },

  voteNews: async (newsId, voteType) => {
    const response = await api.post(`/api/news/${newsId}/vote`, { voteType });
    return response.data;
    // POST /api/news/abc123/vote  { voteType: "upvote" }
  },

  deletePost: async (newsId) => {
    const response = await api.delete(`/api/news/${newsId}`);
    return response.data;
  },
};
```

### 5.3 — commentsAPI (Comments)

```jsx
export const commentsAPI = {
  addCommunityComment: async (newsId, commentData) => {
    const response = await api.post(
      `/api/community-comments/${newsId}`,
      commentData
    );
    return response.data;
  },

  addExpertComment: async (newsId, commentData) => {
    const response = await api.post(
      `/api/expert-comments/${newsId}`,
      commentData
    );
    return response.data;
  },

  getCommunityComments: async (newsId) => {
    const response = await api.get(`/api/community-comments/${newsId}`);
    return response.data;
  },

  getExpertComments: async (newsId) => {
    const response = await api.get(`/api/expert-comments/${newsId}`);
    return response.data;
  },

  expertVoteOnCommunityComment: async (commentId, voteData) => {
    const response = await api.post(
      `/api/community-comments/${commentId}/expert-vote`,
      voteData
    );
    return response.data;
  },
  // ... similar patterns for delete, vote endpoints
};
```

### 5.4 — commentFilterAPI (AI-Powered Grouping)

```jsx
export const commentFilterAPI = {
  getGroupedComments: async (newsId) => {
    const response = await api.get(`/api/comment-filter/${newsId}/groups`);
    return response.data;
    // Returns groups of comments organized by AI
  },

  regenerateGroupNames: async (newsId) => {
    const response = await api.post(
      `/api/comment-filter/${newsId}/regenerate-names`
    );
    return response.data;
  },
};
```

### 5.5 — aiVerdictAPI (AI Analysis)

```jsx
export const aiVerdictAPI = {
  generateVerdict: async (newsId) => {
    const response = await api.post(`/api/news/${newsId}/ai-verdict`);
    return response.data;
    // Triggers AI analysis and returns credibility score + explanation
  },

  getVerdict: async (newsId) => {
    const response = await api.get(`/api/news/${newsId}/ai-verdict`);
    return response.data;
  },

  regenerateVerdict: async (newsId) => {
    const response = await api.put(`/api/news/${newsId}/ai-verdict/regenerate`);
    return response.data;
  },
};
```

### 5.6 — expertAPI and profileAPI

```jsx
export const expertAPI = {
  getAllExperts: async () => {
    const response = await api.get('/users/experts');
    return response.data;
  },
  getExpertById: async (id) => {
    const response = await api.get(`/users/experts/${id}`);
    return response.data;
  },
};

export const profileAPI = {
  getProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },
  updateProfile: async (formData) => {
    const response = await api.put('/profile/update', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await api.put('/profile/change-password', passwordData);
    return response.data;
  },
};
```

---

## 6. How Components Use the API Layer

### 6.1 — The Pattern

```jsx
// Step 1: Import the specific API module
import { newsAPI } from '../services/api';

// Step 2: Call it inside useEffect (for data fetching) or handlers (for actions)
const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await newsAPI.getAllPosts();
        // api.js sends GET /api/news with JWT token auto-attached
        setNews(data.posts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Step 3: Use the data in JSX
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  return news.map(post => <NewsCard key={post._id} {...post} />);
};
```

### 6.2 — For User Actions

```jsx
const handleVote = async (newsId, voteType) => {
  try {
    const result = await newsAPI.voteNews(newsId, voteType);
    // Update local state optimistically or from response
    setNews(prev => prev.map(post =>
      post._id === newsId ? { ...post, upvotes: result.upvotes } : post
    ));
  } catch (error) {
    toast.error('Failed to vote');
  }
};
```

---

## 7. Error Handling Patterns

### 7.1 — try/catch with User Feedback

```jsx
const handleSubmit = async () => {
  try {
    setLoading(true);
    const result = await authAPI.login(userType, credentials);
    toast.success('Login successful!');
    context.login(result.user, result.token);
    navigate('/home');
  } catch (error) {
    // error.response?.data?.message comes from the backend
    const message = error.response?.data?.message || 'Login failed';
    toast.error(message);
    // toast.error shows a red notification popup (react-toastify)
  } finally {
    setLoading(false);
    // Always stop the loading spinner, whether success or failure
  }
};
```

### 7.2 — Error Response Structure

```
  Successful response:      error.response (4xx/5xx):
  ─────────────────         ──────────────────────────
  response.data = {         error.response.status = 401
    token: "...",           error.response.data = {
    user: { ... }             message: "Invalid credentials"
  }                         }
                            error.message = "Request failed with status 401"
```

---

## 8. File Uploads — multipart/form-data

### 8.1 — Theory

When uploading files (images for news articles, profile photos), JSON format cannot carry binary data. Instead, we use `multipart/form-data` encoding:

```jsx
export const newsAPI = {
  uploadNews: async (formData) => {
    // formData is a FormData object (built-in browser API)
    const response = await api.post('/api/news/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // This tells the server: "This request contains files"
    });
    return response.data;
  },
};

// In the component:
const handleSubmit = async () => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('images', selectedFile);
  // FormData encodes both text fields and binary file data

  await newsAPI.uploadNews(formData);
};
```

---

## 9. Complete API Endpoint Map

| Module | Method | Endpoint | Purpose |
|---|---|---|---|
| authAPI | POST | `/auth/{type}/login` | Login |
| authAPI | POST | `/auth/{type}/signup` | Register |
| authAPI | POST | `/auth/{type}/register-face` | Register face |
| authAPI | POST | `/auth/{type}/verify-face` | Verify face login |
| newsAPI | GET | `/api/news` | All news posts |
| newsAPI | GET | `/api/news/combined-feed` | Paginated feed |
| newsAPI | POST | `/api/news/upload` | Submit news (multipart) |
| newsAPI | POST | `/api/news/{id}/vote` | Vote on news |
| newsAPI | DELETE | `/api/news/{id}` | Delete news |
| commentsAPI | POST | `/api/community-comments/{id}` | Add comment |
| commentsAPI | GET | `/api/community-comments/{id}` | Get comments |
| commentFilterAPI | GET | `/api/comment-filter/{id}/groups` | AI grouped comments |
| aiVerdictAPI | POST | `/api/news/{id}/ai-verdict` | Generate AI verdict |
| aiVerdictAPI | GET | `/api/news/{id}/ai-verdict` | Get AI verdict |
| expertAPI | GET | `/users/experts` | List all experts |
| profileAPI | GET | `/profile/me` | Get own profile |
| profileAPI | PUT | `/profile/update` | Update profile |

---

## 10. Interview Q&A

**Q: Why use an Axios instance instead of raw Axios?**
A: An instance lets you configure `baseURL`, `headers`, and `withCredentials` once. All API calls automatically inherit these settings, reducing duplication and ensuring consistency.

**Q: What does `withCredentials: true` do?**
A: It tells the browser to include cookies and authentication headers in cross-origin requests. In development, the frontend (port 5173) and backend (port 3000) are on different origins. Without this, cookies wouldn't be sent.

**Q: Why are API services organized into separate objects?**
A: Separation of concerns. Each object groups related endpoints (auth, news, comments). Components import only what they need: `import { newsAPI } from '../services/api'`. This is cleaner than having 30+ functions in a flat list.

**Q: What happens if the token expires?**
A: The request interceptor still attaches the expired token. The server returns a 401 status. The response interceptor logs the error, and the calling component's catch block handles it — typically showing an error message or redirecting to login.

---

**Next → [08-AUTHENTICATION-FLOW.md](./08-AUTHENTICATION-FLOW.md)** — The complete login/signup/face-auth journey end-to-end.
