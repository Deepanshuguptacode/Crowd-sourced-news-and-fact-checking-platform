const express = require('express');
const router = express.Router();
const AIVerdictController = require('../controllers/AIVerdictController');

// Middleware to check authentication (assuming you have this)
const { authenticateAnyUser } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/news/:newsId/ai-verdict
 * @desc    Generate AI verdict for a news article
 * @access  Private (Community/Expert users)
 */
router.post('/news/:newsId/ai-verdict', authenticateAnyUser, AIVerdictController.generateAIVerdict);

/**
 * @route   GET /api/news/:newsId/ai-verdict
 * @desc    Get existing AI verdict for a news article
 * @access  Public
 */
router.get('/news/:newsId/ai-verdict', AIVerdictController.getAIVerdict);

/**
 * @route   PUT /api/news/:newsId/ai-verdict/regenerate
 * @desc    Regenerate AI verdict for a news article
 * @access  Private (Community/Expert users)
 */
router.put('/news/:newsId/ai-verdict/regenerate', authenticateAnyUser, AIVerdictController.regenerateAIVerdict);

/**
 * @route   DELETE /api/news/:newsId/ai-verdict
 * @desc    Delete AI verdict for a news article
 * @access  Private (Admin/Expert users only)
 */
router.delete('/news/:newsId/ai-verdict', authenticateAnyUser, AIVerdictController.deleteAIVerdict);

/**
 * @route   GET /api/ai-verdicts/stats
 * @desc    Get AI verdict statistics
 * @access  Public
 */
router.get('/ai-verdicts/stats', AIVerdictController.getAIVerdictStats);

module.exports = router;