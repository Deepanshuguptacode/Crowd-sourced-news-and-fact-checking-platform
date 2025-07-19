// routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const { uploadNews, getAllPosts, getCombinedFeed, voteNews } = require('../controllers/NewsController');

// Middleware for authentication (you can implement this based on your auth system)
const { authenticateNormalUser, authenticateCommunityUser, authenticateExpertUser, authenticateCommunityOrExpertUser, authenticateAnyUser } = require('../middlewares/authMiddleware');
const { addCommunityComment, addExpertComment, getAllCommunityComments, getAllExpertComments } = require('../controllers/CommentsController');

// Route for uploading news (allow all authenticated users to upload)
router.post('/upload', authenticateAnyUser, uploadNews);
router.get('/posts',getAllPosts);
router.get('/combined-feed', getCombinedFeed); // New combined feed endpoint
router.post('/vote/:postId', authenticateCommunityOrExpertUser, voteNews);
router.post('/community-comment/add', authenticateCommunityUser, addCommunityComment);
router.post('/expert-comment/add', authenticateExpertUser, addExpertComment);
router.get('/community-comment', getAllCommunityComments);
router.get('/expert-comment', getAllExpertComments);

module.exports = router;
