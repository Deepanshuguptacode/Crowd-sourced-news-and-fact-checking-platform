# 07 - Axios and API Services: Communicating with the Backend

## What You'll Learn
- What Axios is and why it's used
- How the API service layer is structured
- Request and response interceptors
- Authentication token handling
- Error handling patterns
- All API endpoints organized by feature

---

## What is Axios?

**Axios** is an HTTP client library for making API requests. It's like `fetch()` but with more features:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AXIOS vs FETCH                                           │
└─────────────────────────────────────────────────────────────────────────────┘

FETCH (native JavaScript):
┌────────────────────────────────────────────────────────────────────┐
│  - Built into browsers                                              │
│  - Need to check response.ok manually                              │
│  - Need to call response.json() manually                           │
│  - No automatic request timeout                                    │
│  - No interceptors                                                 │
└────────────────────────────────────────────────────────────────────┘

AXIOS:
┌────────────────────────────────────────────────────────────────────┐
│  - Automatic JSON parsing                                          │
│  - Automatic error handling for non-2xx responses                  │
│  - Request/response interceptors                                   │
│  - Request timeout support                                         │
│  - Cancel requests                                                 │
│  - Transform request/response data                                 │
└────────────────────────────────────────────────────────────────────┘
```

---

## API Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API SERVICE ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

          Component (LoginForm.jsx)
                    │
                    │ calls
                    ▼
          API Service (api.js)
          ┌─────────────────────────────────────────┐
          │ authAPI.login(userType, credentials)    │
          │                                         │
          │  ┌───────────────────────────────────┐  │
          │  │ Axios Instance                    │  │
          │  │ - Base URL configured             │  │
          │  │ - Auth token attached             │  │
          │  │ - Credentials included            │  │
          │  └───────────────────────────────────┘  │
          └─────────────────────────────────────────┘
                    │
                    │ HTTP Request
                    ▼
          Backend Server (localhost:3000)
                    │
                    │ HTTP Response
                    ▼
          Component receives data
```

---

## The Main API File

```javascript
// frontend/src/services/api.js

import axios from 'axios';
import config from '../config.js';

// ═══════════════════════════════════════════════════════════════════════════
// CREATE AXIOS INSTANCE
// ═══════════════════════════════════════════════════════════════════════════
// Instead of using axios directly, we create a configured instance
const api = axios.create({
  baseURL: config.BASE_URL,    // All requests start with this URL
  withCredentials: true,        // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',  // Default content type
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR
// ═══════════════════════════════════════════════════════════════════════════
// Runs BEFORE every request is sent
api.interceptors.request.use(
  (config) => {
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Attach token to Authorization header
      config.headers.Authorization = `Bearer ${token}`;
      config.withCredentials = true;
    }
    
    // Debug logging
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Auth Token Present:', !!token);
    
    return config;  // Return modified config
  },
  (error) => Promise.reject(error)
);

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR
// ═══════════════════════════════════════════════════════════════════════════
// Runs AFTER every response is received
api.interceptors.response.use(
  (response) => {
    // Success response (2xx status)
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    // Error response (non-2xx status)
    console.error('API Error:', error.response?.status, error.config?.url, error.response?.data);
    return Promise.reject(error);
  }
);
```

### How Interceptors Work

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INTERCEPTOR FLOW                                         │
└─────────────────────────────────────────────────────────────────────────────┘

Component calls: authAPI.login()
          │
          ▼
┌─────────────────────────────┐
│   REQUEST INTERCEPTOR       │
│   - Get token from storage  │
│   - Add to Authorization    │
│   - Log request             │
└─────────────────────────────┘
          │
          ▼
    HTTP Request to Server
          │
          ▼
    Server Processes
          │
          ▼
    HTTP Response
          │
          ▼
┌─────────────────────────────┐
│   RESPONSE INTERCEPTOR      │
│   - Log response            │
│   - Pass through or error   │
└─────────────────────────────┘
          │
          ▼
Component receives response
```

---

## API Modules by Feature

The API is organized into logical modules:

### 1. Authentication API

```javascript
// Authentication APIs
export const authAPI = {
  // Login for different user types
  login: async (userType, credentials) => {
    // POST /users/normal/login or /users/expert/login, etc.
    const response = await api.post(`/users/${userType}/login`, credentials);
    return response.data;
  },

  // Signup for different user types
  signup: async (userType, userData) => {
    const response = await api.post(`/users/${userType}/signup`, userData);
    return response.data;
  },

  // Face Authentication
  registerFace: async (userType, faceData) => {
    const response = await api.post(`/users/${userType}/register-face`, faceData);
    return response.data;
  },

  verifyFace: async (userType, faceData) => {
    const response = await api.post(`/users/${userType}/verify-face`, faceData);
    return response.data;
  },

  // Logout (just clears local storage)
  logout: async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userInfo');
    return { success: true };
  },
};
```

### 2. News API

```javascript
// News APIs
export const newsAPI = {
  // Get all news posts
  getAllPosts: async () => {
    const response = await api.get('/news/posts');
    return response.data;
  },

  // Get combined feed (news + reposts)
  getCombinedFeed: async () => {
    const response = await api.get('/news/combined-feed');
    return response.data;
  },

  // Upload news (with file upload)
  uploadNews: async (newsData) => {
    const response = await api.post('/news/upload', newsData, {
      headers: {
        'Content-Type': 'multipart/form-data',  // Override for file upload
      },
    });
    return response.data;
  },

  // Vote on news
  voteNews: async (postId, voteType) => {
    const response = await api.post(`/news/vote/${postId}`, { voteType });
    return response.data;
  },
};
```

### 3. Comments API

```javascript
// Comments APIs
export const commentsAPI = {
  // Add community comment
  addCommunityComment: async (commentData) => {
    const response = await api.post('/news/community-comment/add', commentData);
    return response.data;
  },

  // Add expert comment
  addExpertComment: async (commentData) => {
    const response = await api.post('/news/expert-comment/add', commentData);
    return response.data;
  },

  // Get community comments for a news item
  getCommunityComments: async (newsId) => {
    const response = await api.get(`/news/community-comment?newsId=${newsId}`);
    return response.data;
  },

  // Get expert comments
  getExpertComments: async (newsId) => {
    const response = await api.get(`/news/expert-comment?newsId=${newsId}`);
    return response.data;
  },

  // Expert voting on comments
  expertVoteOnCommunityComment: async (commentId, voteData) => {
    const response = await api.post(`/news/community-comment/${commentId}/vote`, voteData);
    return response.data;
  },
};
```

### 4. Comment Filtering API (AI Features)

```javascript
// Comment Filtering APIs (AI-powered grouping)
export const commentFilterAPI = {
  // Get AI-grouped comments for news
  getGroupedComments: async (newsId) => {
    const response = await api.get(`/comment-filter/grouped/${newsId}`);
    return response.data;
  },

  // Get comments by specific group
  getCommentsByGroup: async (groupId) => {
    const response = await api.get(`/comment-filter/group/${groupId}`);
    return response.data;
  },

  // Regenerate group names using AI
  regenerateGroupNames: async (newsId) => {
    const response = await api.post(`/comment-filter/regenerate-names/${newsId}`);
    return response.data;
  },

  // Get filtering summary
  getFilteringSummary: async (newsId) => {
    const response = await api.get(`/comment-filter/summary/${newsId}`);
    return response.data;
  },
};
```

### 5. AI Verdict API

```javascript
// AI Verdict API
export const aiVerdictAPI = {
  // Generate AI verdict for news
  generateVerdict: async (newsId) => {
    const response = await api.post(`/api/news/${newsId}/ai-verdict`);
    return response.data;
  },

  // Get existing verdict
  getVerdict: async (newsId) => {
    const response = await api.get(`/api/news/${newsId}/ai-verdict`);
    return response.data;
  },

  // Regenerate verdict
  regenerateVerdict: async (newsId) => {
    const response = await api.put(`/api/news/${newsId}/ai-verdict/regenerate`);
    return response.data;
  },
};
```

### 6. Utility Functions

```javascript
// Utility functions for auth management
export const apiUtils = {
  // Set auth token
  setAuthToken: (token) => {
    localStorage.setItem('authToken', token);
  },

  // Get auth token
  getAuthToken: () => {
    return localStorage.getItem('authToken');
  },

  // Set user info
  setUserInfo: (userInfo) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('userType', userInfo.userType);
  },

  // Get user info
  getUserInfo: () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // Get user type
  getUserType: () => {
    return localStorage.getItem('userType');
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};
```

---

## Debate Room API (Separate File)

```javascript
// frontend/src/services/debateRoomAPI.js

import axios from 'axios';
import config from '../config.js';

const api = axios.create({
  baseURL: config.BASE_URL,
  withCredentials: true,
});

// Add token interceptor (same pattern)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const debateRoomAPI = {
  // Get all debate rooms
  getAllDebateRooms: async (params = {}) => {
    const response = await api.get('/debate-rooms', { params });
    return response.data;
  },

  // Get single debate room
  getDebateRoom: async (roomId) => {
    const response = await api.get(`/debate-rooms/${roomId}`);
    return response.data;
  },

  // Create debate room
  createDebateRoom: async (debateRoomData) => {
    const response = await api.post('/debate-rooms', debateRoomData);
    return response.data;
  },

  // Join debate room
  joinDebateRoom: async (roomId) => {
    const response = await api.post(`/debate-rooms/${roomId}/join`);
    return response.data;
  },

  // Get debate comments
  getDebateComments: async (roomId) => {
    const response = await api.get(`/debate-rooms/${roomId}/comments`);
    return response.data;
  },

  // Create comment
  createDebateComment: async (roomId, commentData) => {
    const response = await api.post(`/debate-rooms/${roomId}/comments`, commentData);
    return response.data;
  },

  // Like/dislike comment
  likeComment: async (roomId, commentId) => {
    const response = await api.post(`/debate-rooms/${roomId}/comments/${commentId}/like`);
    return response.data;
  },
};
```

---

## Using APIs in Components

### Example 1: Login Form

```jsx
// pages/LoginForm.jsx

import { authAPI } from '../services/api';

const LoginForm = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // ─────────────────────────────────────────────────────────────────────
      // MAKE API CALL
      // ─────────────────────────────────────────────────────────────────────
      const response = await authAPI.login(formData.userType, {
        email: formData.email,
        password: formData.password,
        loginMethod: 'password',
      });

      // ─────────────────────────────────────────────────────────────────────
      // HANDLE SUCCESS
      // ─────────────────────────────────────────────────────────────────────
      if (response.token) {
        login(response.user, response.token);  // Update context
        toast.success("Login successful!");
        navigate("/home");
      }
      
    } catch (error) {
      // ─────────────────────────────────────────────────────────────────────
      // HANDLE ERROR
      // ─────────────────────────────────────────────────────────────────────
      toast.error(error.response?.data?.message || "Login failed!");
      
    } finally {
      setLoading(false);
    }
  };
};
```

### Example 2: Fetching News

```jsx
// components/NewsFeed.jsx

import { newsAPI } from '../services/api';

const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // ─────────────────────────────────────────────────────────────────────
        // FETCH NEWS FROM API
        // ─────────────────────────────────────────────────────────────────────
        const response = await newsAPI.getAllPosts();
        setNews(response.news || []);
        
      } catch (error) {
        toast.error("Failed to load news");
        
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div>
      {news.map(post => (
        <NewsCard key={post._id} {...post} />
      ))}
    </div>
  );
};
```

### Example 3: Adding Comments with Evidence

```jsx
// components/CommentSection.jsx

import { commentsAPI } from '../services/api';

const handleAddComment = async () => {
  try {
    const commentData = {
      newsId: newsId,
      comment: newComment.trim(),
      evidenceLinks: evidenceLinks,  // Optional array
      stance: selectedStance,
    };

    let response;
    if (userType === 'community') {
      response = await commentsAPI.addCommunityComment(commentData);
    } else if (userType === 'expert') {
      response = await commentsAPI.addExpertComment(commentData);
    }

    toast.success("Comment added!");
    
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to add comment");
  }
};
```

---

## Error Handling Patterns

```jsx
// ═══════════════════════════════════════════════════════════════════════════
// PATTERN 1: try/catch with specific error handling
// ═══════════════════════════════════════════════════════════════════════════

try {
  const response = await newsAPI.voteNews(postId, 'upvote');
  toast.success("Vote recorded!");
  
} catch (error) {
  // Access error response from backend
  const message = error.response?.data?.message;
  const status = error.response?.status;
  
  if (status === 401) {
    toast.error("Please login first");
    navigate('/login');
  } else if (status === 403) {
    toast.error("You don't have permission");
  } else if (status === 404) {
    toast.error("Post not found");
  } else {
    toast.error(message || "Something went wrong");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PATTERN 2: Loading state with finally
// ═══════════════════════════════════════════════════════════════════════════

const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  
  try {
    await someAPI.doSomething();
  } catch (error) {
    toast.error("Failed");
  } finally {
    setLoading(false);  // Always runs, even after error
  }
};

return (
  <button disabled={loading}>
    {loading ? 'Loading...' : 'Submit'}
  </button>
);
```

---

## File Upload Pattern

```jsx
// For uploading files (screenshots, profile pictures)

const handleUpload = async (file) => {
  // Create FormData object
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', 'My News');
  formData.append('content', 'News content...');

  try {
    // Note: Content-Type is automatically set to multipart/form-data
    const response = await newsAPI.uploadNews(formData);
    toast.success("Uploaded!");
  } catch (error) {
    toast.error("Upload failed");
  }
};
```

---

## Interview Questions & Answers

### Q1: Why use Axios instead of fetch?

**Answer:** Axios provides:
- Automatic JSON parsing (no `response.json()` needed)
- Interceptors for request/response handling
- Better error handling (non-2xx throws error)
- Request cancellation
- Automatic transforms
- Works in Node.js too (isomorphic)

### Q2: What are interceptors used for?

**Answer:** Interceptors run code before requests or after responses:
- **Request interceptor**: Add auth tokens, log requests, transform data
- **Response interceptor**: Log responses, handle errors globally, refresh tokens

### Q3: Why create an Axios instance instead of using axios directly?

**Answer:** An instance lets you:
- Set a base URL (don't repeat in every call)
- Set default headers (Content-Type)
- Configure once, use everywhere
- Have different instances for different APIs

### Q4: How do you handle file uploads with Axios?

**Answer:**
1. Create a `FormData` object
2. Append file(s) and other data
3. Axios automatically sets `Content-Type: multipart/form-data`
4. Backend receives files via multer or similar

---

## Summary

| Concept | Purpose |
|---------|---------|
| **axios.create()** | Create configured instance |
| **baseURL** | Common URL prefix for all requests |
| **interceptors** | Run code before/after requests |
| **API modules** | Organize endpoints by feature |
| **apiUtils** | Helper functions for auth |
| **try/catch** | Handle API errors |
| **FormData** | File uploads |

---

**Next: [08-AUTHENTICATION-FLOW.md](./08-AUTHENTICATION-FLOW.md)** - Complete auth flow from signup to logout →
