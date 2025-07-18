import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
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
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Debate Room API functions
export const debateRoomAPI = {
  // Get all debate rooms
  getAllDebateRooms: async (params = {}) => {
    const response = await api.get('/debate-rooms', { params });
    return response.data;
  },

  // Get a specific debate room
  getDebateRoom: async (roomId) => {
    const response = await api.get(`/debate-rooms/${roomId}`);
    return response.data;
  },

  // Create a new debate room
  createDebateRoom: async (debateRoomData) => {
    const response = await api.post('/debate-rooms', debateRoomData);
    return response.data;
  },

  // Join a debate room
  joinDebateRoom: async (roomId) => {
    const response = await api.post(`/debate-rooms/${roomId}/join`);
    return response.data;
  },

  // Leave a debate room
  leaveDebateRoom: async (roomId) => {
    const response = await api.post(`/debate-rooms/${roomId}/leave`);
    return response.data;
  },

  // Update a debate room
  updateDebateRoom: async (roomId, updateData) => {
    const response = await api.put(`/debate-rooms/${roomId}`, updateData);
    return response.data;
  },

  // Delete a debate room
  deleteDebateRoom: async (roomId) => {
    const response = await api.delete(`/debate-rooms/${roomId}`);
    return response.data;
  },

  // Get debate groups for a room
  getDebateGroups: async (roomId, stance = null) => {
    const params = stance ? { stance } : {};
    const response = await api.get(`/debate-rooms/${roomId}/groups`, { params });
    return response.data;
  },

  // Create a debate group
  createDebateGroup: async (roomId, groupData) => {
    const response = await api.post(`/debate-rooms/${roomId}/groups`, groupData);
    return response.data;
  },

  // Get comments for a debate room
  getDebateComments: async (roomId) => {
    const response = await api.get(`/debate-rooms/${roomId}/comments`);
    return response.data;
  },

  // Create a debate comment
  createDebateComment: async (roomId, commentData) => {
    const response = await api.post(`/debate-rooms/${roomId}/comments`, commentData);
    return response.data;
  },

  // Like a comment
  likeComment: async (roomId, commentId) => {
    const response = await api.post(`/debate-rooms/${roomId}/comments/${commentId}/like`);
    return response.data;
  },

  // Dislike a comment
  dislikeComment: async (roomId, commentId) => {
    const response = await api.post(`/debate-rooms/${roomId}/comments/${commentId}/dislike`);
    return response.data;
  },

  // Regenerate group content
  regenerateGroup: async (roomId, groupId) => {
    const response = await api.put(`/debate-rooms/${roomId}/groups/${groupId}/regenerate`);
    return response.data;
  },

  // Relink groups
  relinkGroups: async (roomId) => {
    const response = await api.post(`/debate-rooms/${roomId}/groups/relink`);
    return response.data;
  },

  // Get counter analysis
  getCounterAnalysis: async (roomId, groupId) => {
    const response = await api.get(`/debate-rooms/${roomId}/groups/${groupId}/counter-analysis`);
    return response.data;
  },

  // Get debug counter status
  getDebugCounterStatus: async (roomId) => {
    const response = await api.get(`/debate-rooms/${roomId}/debug/counter-status`);
    return response.data;
  },

  // Get comments by group
  getCommentsByGroup: async (roomId, groupId) => {
    const response = await api.get(`/debate-rooms/${roomId}/groups/${groupId}/comments`);
    return response.data;
  },

  // Advanced group management
  regenerateGroupContent: async (roomId, groupId) => {
    const response = await api.put(`/debate-rooms/${roomId}/groups/${groupId}/regenerate`);
    return response.data;
  },

  // Get specific group details
  getDebateGroup: async (roomId, groupId) => {
    const response = await api.get(`/debate-rooms/${roomId}/groups/${groupId}`);
    return response.data;
  }
};

export default debateRoomAPI;
