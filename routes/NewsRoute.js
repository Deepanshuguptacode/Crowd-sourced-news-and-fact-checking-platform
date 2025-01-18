// routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const { uploadNews, getAllPosts, voteNews } = require('../controllers/NewsController');

// Middleware for authentication (you can implement this based on your auth system)
const { authenticateNormalUser, authenticateCommunityUser, authenticateExpertUser } = require('../middlewares/authMiddleware');
const { addCommunityComment, addExpertComment } = require('../controllers/CommentsController');

// Route for uploading news (protected route, only authenticated users can upload)
router.post('/upload', authenticateNormalUser , uploadNews);
router.get('/posts',getAllPosts);
router.post('/vote/:postId', authenticateCommunityUser, voteNews);
router.post('/community-comment/add', authenticateCommunityUser, addCommunityComment);
router.post('/expert-comment/add', authenticateExpertUser, addExpertComment);


module.exports = router;
