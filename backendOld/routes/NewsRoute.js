// routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const { uploadNews, getAllPosts, getCombinedFeed, voteNews } = require('../controllers/NewsController');

// Middleware for authentication (you can implement this based on your auth system)
const { authenticateNormalUser, authenticateCommunityUser, authenticateExpertUser, authenticateCommunityOrExpertUser, authenticateAnyUser } = require('../middlewares/authMiddleware');
const { 
  addCommunityComment, 
  addExpertComment, 
  getAllCommunityComments, 
  getAllExpertComments,
  expertVoteOnCommunityComment,
  expertVoteOnExpertComment,
  getCommunityCommentVotes,
  getExpertCommentVotes 
} = require('../controllers/CommentsController');

// Route for uploading news (allow all authenticated users to upload)
router.post('/upload', authenticateAnyUser, uploadNews);
router.get('/posts',getAllPosts);
router.get('/combined-feed', getCombinedFeed); // New combined feed endpoint
router.post('/vote/:postId', authenticateCommunityOrExpertUser, voteNews);

// Comment routes
router.post('/community-comment/add', authenticateCommunityUser, addCommunityComment);
router.post('/expert-comment/add', authenticateExpertUser, addExpertComment);
router.get('/community-comment', getAllCommunityComments);
router.get('/expert-comment', getAllExpertComments);

// Expert voting routes
router.post('/community-comment/:commentId/vote', authenticateExpertUser, expertVoteOnCommunityComment);
router.post('/expert-comment/:commentId/vote', authenticateExpertUser, expertVoteOnExpertComment);
router.get('/community-comment/:commentId/votes', getCommunityCommentVotes);
router.get('/expert-comment/:commentId/votes', getExpertCommentVotes);

module.exports = router;
