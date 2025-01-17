// routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const { uploadNews, getAllPosts, voteNews } = require('../controllers/NewsController');

// Middleware for authentication (you can implement this based on your auth system)
const { authenticateNormalUser, authenticateCommunityUser } = require('../middlewares/authMiddleware');

// Route for uploading news (protected route, only authenticated users can upload)
router.post('/upload', authenticateNormalUser , uploadNews);
router.get('/posts', authenticateNormalUser,getAllPosts);
router.post('/vote/:postId', authenticateCommunityUser, voteNews);

module.exports = router;
