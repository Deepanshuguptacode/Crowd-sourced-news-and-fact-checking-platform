import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Fixed: changed from 'userToken' to 'authToken'
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Trending News API Service
export const trendingNewsService = {
  // Get trending news with pagination
  getTrendingNews: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/trending-news?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single trending news by ID
  getTrendingNewsById: async (id) => {
    try {
      const response = await api.get(`/trending-news/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Repost a news item
  repostNews: async (id, comment = '') => {
    try {
      const response = await api.post(`/trending-news/${id}/repost`, { comment });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove repost
  removeRepost: async (id) => {
    try {
      const response = await api.delete(`/trending-news/${id}/repost`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user's reposts
  getUserReposts: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/trending-news/user/reposts?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Manual fetch news (admin only)
  fetchTrendingNews: async () => {
    try {
      const response = await api.post('/trending-news/admin/fetch');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default trendingNewsService;
