// routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const { uploadNews, getAllPosts, voteNews } = require('../controllers/NewsController');

// Middleware for authentication (you can implement this based on your auth system)
const { authenticateNormalUser, authenticateCommunityUser, authenticateExpertUser, authenticateCommunityOrExpertUser } = require('../middlewares/authMiddleware');
const { addCommunityComment, addExpertComment, getAllCommunityComments, getAllExpertComments } = require('../controllers/CommentsController');

// Route for uploading news (protected route, only authenticated users can upload)
router.post('/upload', authenticateNormalUser , uploadNews);
router.get('/posts',getAllPosts);
router.post('/vote/:postId', authenticateCommunityOrExpertUser, voteNews);
router.post('/community-comment/add', authenticateCommunityUser, addCommunityComment);
router.post('/expert-comment/add', authenticateExpertUser, addExpertComment);
router.get('/community-comment', getAllCommunityComments);
router.get('/expert-comment', getAllExpertComments);

module.exports = router;
