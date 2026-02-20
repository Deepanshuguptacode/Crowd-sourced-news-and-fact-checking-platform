const aiVerdictService = require('../services/aiVerdictService');
const News = require('../models/News');

/**
 * Generate AI verdict for a news article
 * POST /news/:newsId/ai-verdict
 */
const generateAIVerdict = async (req, res) => {
  try {
    const { newsId } = req.params;

    // Validate news exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Check if verdict already exists
    const existingVerdict = await aiVerdictService.getVerdict(newsId);
    if (existingVerdict) {
      return res.status(409).json({
        success: false,
        message: 'AI verdict already exists for this news article. Use regenerate endpoint to update.',
        data: existingVerdict
      });
    }

    // Generate new verdict
    const verdict = await aiVerdictService.generateVerdict(newsId);

    res.status(201).json({
      success: true,
      message: 'AI verdict generated successfully',
      data: verdict
    });

  } catch (error) {
    console.error('Error generating AI verdict:', error);
    
    if (error.message === 'No comments available for analysis') {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate AI verdict: No comments available for analysis'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate AI verdict',
      error: error.message
    });
  }
};

/**
 * Get existing AI verdict for a news article
 * GET /news/:newsId/ai-verdict
 */
const getAIVerdict = async (req, res) => {
  try {
    const { newsId } = req.params;

    // Validate news exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Get existing verdict
    const verdict = await aiVerdictService.getVerdict(newsId);
    
    if (!verdict) {
      return res.status(404).json({
        success: false,
        message: 'No AI verdict found for this news article'
      });
    }

    res.status(200).json({
      success: true,
      message: 'AI verdict retrieved successfully',
      data: verdict
    });

  } catch (error) {
    console.error('Error getting AI verdict:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI verdict',
      error: error.message
    });
  }
};

/**
 * Regenerate AI verdict for a news article
 * PUT /news/:newsId/ai-verdict/regenerate
 */
const regenerateAIVerdict = async (req, res) => {
  try {
    const { newsId } = req.params;

    // Validate news exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Regenerate verdict
    const verdict = await aiVerdictService.regenerateVerdict(newsId);

    res.status(200).json({
      success: true,
      message: 'AI verdict regenerated successfully',
      data: verdict
    });

  } catch (error) {
    console.error('Error regenerating AI verdict:', error);
    
    if (error.message === 'No comments available for analysis') {
      return res.status(400).json({
        success: false,
        message: 'Cannot regenerate AI verdict: No comments available for analysis'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to regenerate AI verdict',
      error: error.message
    });
  }
};

/**
 * Delete AI verdict for a news article
 * DELETE /news/:newsId/ai-verdict
 */
const deleteAIVerdict = async (req, res) => {
  try {
    const { newsId } = req.params;

    // Validate news exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // Delete verdict
    const deletedVerdict = await AIVerdict.findOneAndDelete({ newsId });
    
    if (!deletedVerdict) {
      return res.status(404).json({
        success: false,
        message: 'No AI verdict found for this news article'
      });
    }

    res.status(200).json({
      success: true,
      message: 'AI verdict deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting AI verdict:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete AI verdict',
      error: error.message
    });
  }
};

/**
 * Get AI verdict statistics
 * GET /ai-verdicts/stats
 */
const getAIVerdictStats = async (req, res) => {
  try {
    const AIVerdict = require('../models/AIVerdict');
    
    const stats = await AIVerdict.aggregate([
      {
        $group: {
          _id: null,
          totalVerdicts: { $sum: 1 },
          averageScore: { $avg: '$score' },
          averageConfidence: { $avg: '$confidence' },
          highConfidenceCount: {
            $sum: { $cond: [{ $gte: ['$confidence', 0.8] }, 1, 0] }
          },
          mediumConfidenceCount: {
            $sum: { $cond: [{ $and: [{ $gte: ['$confidence', 0.5] }, { $lt: ['$confidence', 0.8] }] }, 1, 0] }
          },
          lowConfidenceCount: {
            $sum: { $cond: [{ $lt: ['$confidence', 0.5] }, 1, 0] }
          },
          highCredibilityCount: {
            $sum: { $cond: [{ $gte: ['$score', 70] }, 1, 0] }
          },
          lowCredibilityCount: {
            $sum: { $cond: [{ $lte: ['$score', 30] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalVerdicts: 0,
      averageScore: 0,
      averageConfidence: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
      highCredibilityCount: 0,
      lowCredibilityCount: 0
    };

    res.status(200).json({
      success: true,
      message: 'AI verdict statistics retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('Error getting AI verdict stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI verdict statistics',
      error: error.message
    });
  }
};

module.exports = {
  generateAIVerdict,
  getAIVerdict,
  regenerateAIVerdict,
  deleteAIVerdict,
  getAIVerdictStats
};