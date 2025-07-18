const express = require('express');
const router = express.Router();
const {
  createDebateRoom,
  getAllDebateRooms,
  getDebateRoom,
  joinDebateRoom,
  leaveDebateRoom,
  updateDebateRoom,
  deleteDebateRoom,
  regenerateGroupContent,
  relinkGroups,
  getDebugCounterStatus
} = require('../controllers/DebateRoomController');

const {
  getDebateGroups,
  createDebateGroup,
  getDebateGroup,
  regenerateDebateGroup,
  relinkDebateGroups,
  getCounterAnalysis
} = require('../controllers/DebateGroupController');

const {
  createDebateComment,
  getDebateComments,
  getCommentsByGroup,
  likeComment,
  dislikeComment,
  getDebugCounterStatus: getCommentsDebugCounterStatus
} = require('../controllers/DebateCommentController');

const authMiddleware = require('../middlewares/authMiddleware');

// Test routes without authentication for counter-matching testing
router.get('/test/:roomId/groups', getDebateGroups);
router.get('/test/:roomId/comments', getDebateComments);

// Apply authentication middleware to all routes (allow all authenticated user types)
router.use(authMiddleware.authenticateAnyUser);

// Debate Room Routes
router.post('/', createDebateRoom);
router.get('/', getAllDebateRooms);
router.get('/:roomId', getDebateRoom);
router.post('/:roomId/join', joinDebateRoom);
router.post('/:roomId/leave', leaveDebateRoom);
router.put('/:roomId', updateDebateRoom);
router.delete('/:roomId', deleteDebateRoom);

// Advanced Group Management Routes
router.put('/:roomId/groups/:groupId/regenerate', regenerateGroupContent);
router.post('/:roomId/groups/relink', relinkGroups);
router.get('/:roomId/debug/counter-status', getDebugCounterStatus);

// Debate Group Routes
router.get('/:roomId/groups', getDebateGroups);
router.post('/:roomId/groups', createDebateGroup);
router.get('/:roomId/groups/:groupId', getDebateGroup);
router.put('/:roomId/groups/:groupId/regenerate', regenerateDebateGroup);
router.post('/:roomId/groups/relink', relinkDebateGroups);
router.get('/:roomId/groups/:groupId/counter-analysis', getCounterAnalysis);

// Debate Comment Routes
router.post('/:roomId/comments', createDebateComment);
router.get('/:roomId/comments', getDebateComments);
router.get('/:roomId/groups/:groupId/comments', getCommentsByGroup);
router.post('/:roomId/comments/:commentId/like', likeComment);
router.post('/:roomId/comments/:commentId/dislike', dislikeComment);
router.get('/:roomId/comments/debug/counter-status', getCommentsDebugCounterStatus);

module.exports = router;
