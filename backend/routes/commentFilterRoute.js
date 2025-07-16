const express = require('express');
const router = express.Router();
const { authenticateCommunityOrExpertUser } = require('../middlewares/authMiddleware');
const commentFilterController = require('../controllers/CommentFilterController');

// Get all grouped comments for a news item
router.get('/grouped/:newsId', authenticateCommunityOrExpertUser, commentFilterController.getGroupedComments);

// Get all filtered comments for a news item
router.get('/filtered/:newsId', authenticateCommunityOrExpertUser, commentFilterController.getAllFilteredComments);

// Get comments by specific group
router.get('/group/:groupId', authenticateCommunityOrExpertUser, commentFilterController.getCommentsByGroup);

// Update group label
router.put('/group/:groupId/label', authenticateCommunityOrExpertUser, commentFilterController.updateGroupLabel);

// Delete a comment group
router.delete('/group/:groupId', authenticateCommunityOrExpertUser, commentFilterController.deleteGroup);

// Get filtering summary for a news item
router.get('/summary/:newsId', authenticateCommunityOrExpertUser, commentFilterController.getFilteringSummary);

// Test endpoint to verify integration
router.get('/test', commentFilterController.testIntegration);

// Regenerate group names for a news item
router.post('/regenerate-names/:newsId', authenticateCommunityOrExpertUser, commentFilterController.regenerateGroupNames);

module.exports = router;
