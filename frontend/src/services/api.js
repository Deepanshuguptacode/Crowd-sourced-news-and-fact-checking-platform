import axios from 'axios';
import config from '../config';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.BASE_URL,
  withCredentials: true, // Important for cookie-based authentication
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  // Login for different user types
  login: async (userType, credentials) => {
    const response = await api.post(`/users/${userType}/login`, credentials);
    return response.data;
  },

  // Signup for different user types
  signup: async (userType, userData) => {
    const response = await api.post(`/users/${userType}/signup`, userData);
    return response.data;
  },

  // Logout
  logout: async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userInfo');
    return { success: true };
  },
};

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

  // Upload news (requires authentication)
  uploadNews: async (newsData) => {
    const response = await api.post('/news/upload', newsData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Vote on news (upvote/downvote)
  voteNews: async (postId, voteType) => {
    const response = await api.post(`/news/vote/${postId}`, { voteType });
    return response.data;
  },
};

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

  // Get community comments
  getCommunityComments: async (newsId) => {
    const response = await api.get(`/news/community-comment?newsId=${newsId}`);
    return response.data;
  },

  // Get expert comments
  getExpertComments: async (newsId) => {
    const response = await api.get(`/news/expert-comment?newsId=${newsId}`);
    return response.data;
  },
};

// Comment Filtering APIs (New Feature)
export const commentFilterAPI = {
  // Get grouped comments for a news item
  getGroupedComments: async (newsId) => {
    const response = await api.get(`/comment-filter/grouped/${newsId}`);
    return response.data;
  },

  // Get all filtered comments for a news item
  getAllFilteredComments: async (newsId) => {
    const response = await api.get(`/comment-filter/filtered/${newsId}`);
    return response.data;
  },

  // Get comments by specific group
  getCommentsByGroup: async (groupId) => {
    const response = await api.get(`/comment-filter/group/${groupId}`);
    return response.data;
  },

  // Update group label
  updateGroupLabel: async (groupId, newLabel) => {
    const response = await api.put(`/comment-filter/group/${groupId}/label`, { newLabel });
    return response.data;
  },

  // Delete a comment group
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/comment-filter/group/${groupId}`);
    return response.data;
  },

  // Get filtering summary for a news item
  getFilteringSummary: async (newsId) => {
    const response = await api.get(`/comment-filter/summary/${newsId}`);
    return response.data;
  },

  // Test integration
  testIntegration: async () => {
    const response = await api.get('/comment-filter/test');
    return response.data;
  },
};

// Utility functions
export const apiUtils = {
  // Handle file uploads
  uploadFile: async (file, endpoint) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

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

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};

// Expert APIs
export const expertAPI = {
  // Get all approved experts
  getAllExperts: async () => {
    const response = await api.get('/users/experts');
    return response.data;
  },

  // Get expert by ID
  getExpertById: async (id) => {
    const response = await api.get(`/users/experts/${id}`);
    return response.data;
  },
};

export default api;
