const commentFilteringService = require('../services/commentFilteringService');

// Get all grouped comments for a specific news item
const getGroupedComments = async (req, res) => {
  try {
    const { newsId } = req.params;

    const groups = await commentFilteringService.getGroupedComments(newsId);

    res.status(200).json({
      message: 'Grouped comments fetched successfully',
      groups,
      totalGroups: groups.length
    });
  } catch (error) {
    console.error('Error in getGroupedComments:', error);
    res.status(500).json({ 
      message: 'Error fetching grouped comments', 
      error: error.message 
    });
  }
};

// Get all filtered comments for a specific news item
const getAllFilteredComments = async (req, res) => {
  try {
    const { newsId } = req.params;

    const comments = await commentFilteringService.getAllFilteredComments(newsId);

    res.status(200).json({
      message: 'Filtered comments fetched successfully',
      comments,
      totalComments: comments.length
    });
  } catch (error) {
    console.error('Error in getAllFilteredComments:', error);
    res.status(500).json({ 
      message: 'Error fetching filtered comments', 
      error: error.message 
    });
  }
};

// Get comments by specific group
const getCommentsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await commentFilteringService.getCommentsByGroup(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json({
      message: 'Group comments fetched successfully',
      group
    });
  } catch (error) {
    console.error('Error in getCommentsByGroup:', error);
    res.status(500).json({ 
      message: 'Error fetching group comments', 
      error: error.message 
    });
  }
};

// Update group label
const updateGroupLabel = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { newLabel } = req.body;

    if (!newLabel || newLabel.trim() === '') {
      return res.status(400).json({ message: 'New label is required' });
    }

    const updatedGroup = await commentFilteringService.updateGroupLabel(
      groupId, 
      newLabel.trim()
    );

    if (!updatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json({
      message: 'Group label updated successfully',
      group: updatedGroup
    });
  } catch (error) {
    console.error('Error in updateGroupLabel:', error);
    res.status(500).json({ 
      message: 'Error updating group label', 
      error: error.message 
    });
  }
};

// Delete a comment group
const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const result = await commentFilteringService.deleteGroup(groupId);

    res.status(200).json({
      message: 'Group deleted successfully',
      result
    });
  } catch (error) {
    console.error('Error in deleteGroup:', error);
    res.status(500).json({ 
      message: 'Error deleting group', 
      error: error.message 
    });
  }
};

// Get summary statistics for comment filtering
const getFilteringSummary = async (req, res) => {
  try {
    const { newsId } = req.params;

    const summary = await commentFilteringService.getFilteringSummary(newsId);

    res.status(200).json({
      message: 'Filtering summary fetched successfully',
      summary
    });
  } catch (error) {
    console.error('Error in getFilteringSummary:', error);
    res.status(500).json({ 
      message: 'Error fetching filtering summary', 
      error: error.message 
    });
  }
};

// Test endpoint to verify integration
const testIntegration = async (req, res) => {
  try {
    res.status(200).json({
      message: 'Comment filtering integration is working!',
      features: [
        'Automatic comment processing',
        'AI-powered grouping',
        'Group management',
        'Filtering statistics'
      ],
      endpoints: [
        'GET /comment-filter/grouped/:newsId',
        'GET /comment-filter/filtered/:newsId',
        'GET /comment-filter/group/:groupId',
        'PUT /comment-filter/group/:groupId/label',
        'DELETE /comment-filter/group/:groupId',
        'GET /comment-filter/summary/:newsId',
        'GET /comment-filter/test'
      ]
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error in test endpoint', 
      error: error.message 
    });
  }
};

// Regenerate group names for a news item
const regenerateGroupNames = async (req, res) => {
  try {
    const { newsId } = req.params;

    const result = await commentFilteringService.regenerateAllGroupNames(newsId);

    res.status(200).json({
      message: 'Group names regenerated successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in regenerateGroupNames:', error);
    res.status(500).json({ 
      message: 'Error regenerating group names', 
      error: error.message 
    });
  }
};

module.exports = {
  getGroupedComments,
  getAllFilteredComments,
  getCommentsByGroup,
  updateGroupLabel,
  deleteGroup,
  getFilteringSummary,
  testIntegration,
  regenerateGroupNames
};
