import axios from 'axios';
import config from '../config.js';

// Create axios instance with base URL from config
const api = axios.create({
  baseURL: config.BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Also set withCredentials to send cookies
      config.withCredentials = true;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url, 'Base:', config.baseURL);
    console.log('Auth Token Present:', !!token);
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.response?.data);
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  // Login for different user types (enhanced with face auth)
  login: async (userType, credentials) => {
    const response = await api.post(`/users/${userType}/login`, credentials);
    return response.data;
  },

  // Signup for different user types (enhanced with face auth)
  signup: async (userType, userData) => {
    const response = await api.post(`/users/${userType}/signup`, userData);
    return response.data;
  },

  // Face Authentication APIs
  registerFace: async (userType, faceData) => {
    const response = await api.post(`/users/${userType}/register-face`, faceData);
    return response.data;
  },

  verifyFace: async (userType, faceData) => {
    const response = await api.post(`/users/${userType}/verify-face`, faceData);
    return response.data;
  },

  getFaceAuthStatus: async (userType, userId) => {
    const response = await api.get(`/users/${userType}/face-auth-status/${userId}`);
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
  // Add community comment (with optional evidence links)
  addCommunityComment: async (commentData) => {
    const response = await api.post('/news/community-comment/add', commentData);
    return response.data;
  },

  // Add expert comment (with optional evidence links)
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

  // Expert voting on comments
  expertVoteOnCommunityComment: async (commentId, voteData) => {
    const response = await api.post(`/news/community-comment/${commentId}/vote`, voteData);
    return response.data;
  },

  expertVoteOnExpertComment: async (commentId, voteData) => {
    const response = await api.post(`/news/expert-comment/${commentId}/vote`, voteData);
    return response.data;
  },

  // Get comment votes
  getCommunityCommentVotes: async (commentId) => {
    const response = await api.get(`/news/community-comment/${commentId}/votes`);
    return response.data;
  },

  getExpertCommentVotes: async (commentId) => {
    const response = await api.get(`/news/expert-comment/${commentId}/votes`);
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

  // Update group description
  updateGroupDescription: async (groupId, newDescription) => {
    const response = await api.put(`/comment-filter/group/${groupId}/description`, { newDescription });
    return response.data;
  },

  // Regenerate group names and descriptions
  regenerateGroupNames: async (newsId) => {
    const response = await api.post(`/comment-filter/regenerate-names/${newsId}`);
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

// Profile APIs
export const profileAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (formData) => {
    const response = await api.put('/profile/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/profile/change-password', passwordData);
    return response.data;
  },
};

// AI Verdict API
export const aiVerdictAPI = {
  // Generate AI verdict for a news article
  generateVerdict: async (newsId) => {
    const response = await api.post(`/api/news/${newsId}/ai-verdict`);
    return response.data;
  },

  // Get existing AI verdict for a news article
  getVerdict: async (newsId) => {
    const response = await api.get(`/api/news/${newsId}/ai-verdict`);
    return response.data;
  },

  // Regenerate AI verdict for a news article
  regenerateVerdict: async (newsId) => {
    const response = await api.put(`/api/news/${newsId}/ai-verdict/regenerate`);
    return response.data;
  },

  // Delete AI verdict for a news article
  deleteVerdict: async (newsId) => {
    const response = await api.delete(`/api/news/${newsId}/ai-verdict`);
    return response.data;
  },

  // Get AI verdict statistics
  getStats: async () => {
    const response = await api.get('/api/ai-verdicts/stats');
    return response.data;
  },
};

export default api;
