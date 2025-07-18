const express = require('express');
const router = express.Router();
const trendingNewsController = require('../controllers/TrendingNewsController');
const { authenticateAnyUser } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', trendingNewsController.getTrendingNews);

// Protected routes (require authentication)
router.get('/user/reposts', authenticateAnyUser, trendingNewsController.getUserReposts);
router.post('/:id/repost', authenticateAnyUser, trendingNewsController.repostNews);
router.delete('/:id/repost', authenticateAnyUser, trendingNewsController.removeRepost);

// Admin routes (manual fetch)
router.post('/admin/fetch', authenticateAnyUser, trendingNewsController.fetchTrendingNews);

// Get single news by ID (must be last to avoid conflicts)
router.get('/:id', trendingNewsController.getTrendingNewsById);

module.exports = router;
