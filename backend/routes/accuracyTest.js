const express = require('express');
const router = express.Router();
const accuracyTestService = require('../services/accuracyTestService');

/**
 * @route GET /api/accuracy/test
 * @desc Test if the accuracy API is working
 * @access Public
 */
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Accuracy API is working!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Accuracy API test failed',
      error: error.message
    });
  }
});

/**
 * @route GET /api/accuracy/results
 * @desc Get the latest accuracy test results
 * @access Public
 */
router.get('/results', async (req, res) => {
  try {
    console.log('📊 Fetching latest accuracy test results...');
    
    const results = await accuracyTestService.getLatestResults();
    
    if (!results) {
      return res.status(404).json({
        success: false,
        message: 'No accuracy test results found. Please run a test first.',
        data: null
      });
    }

    // Return results without multiplication - show real data
    const processedResults = {
      ...results.toObject()
    };

    res.json({
      success: true,
      message: 'Accuracy test results retrieved successfully',
      data: processedResults
    });

  } catch (error) {
    console.error('❌ Error fetching accuracy results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accuracy test results',
      error: error.message
    });
  }
});

/**
 * @route POST /api/accuracy/calculate
 * @desc Calculate new accuracy test results
 * @access Public
 */
router.post('/calculate', async (req, res) => {
  try {
    console.log('🚀 Starting accuracy calculation...');
    
    const results = await accuracyTestService.calculateAccuracy();
    
    // Return results without multiplication - show real data
    const processedResults = {
      ...results
    };

    res.json({
      success: true,
      message: 'Accuracy test completed successfully',
      data: processedResults
    });

  } catch (error) {
    console.error('❌ Error calculating accuracy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate accuracy test results',
      error: error.message
    });
  }
});

/**
 * @route POST /api/accuracy/recalculate
 * @desc Recalculate accuracy test results (clears existing data first)
 * @access Public
 */
router.post('/recalculate', async (req, res) => {
  try {
    console.log('🔄 Recalculating accuracy test results...');
    
    // Clear existing results
    await accuracyTestService.clearAllResults();
    
    // Calculate new results
    const results = await accuracyTestService.calculateAccuracy();
    
    // Return results without multiplication - show real data
    const processedResults = {
      ...results
    };

    res.json({
      success: true,
      message: 'Accuracy test recalculated successfully',
      data: processedResults
    });

  } catch (error) {
    console.error('❌ Error recalculating accuracy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate accuracy test results',
      error: error.message
    });
  }
});

/**
 * @route GET /api/accuracy/status
 * @desc Get status information about accuracy testing
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const results = await accuracyTestService.getLatestResults();
    
    res.json({
      success: true,
      data: {
        hasResults: !!results,
        lastCalculated: results ? results.lastCalculated : null,
        calculationDuration: results ? results.calculationDuration : null,
        totalNewsAnalyzed: results ? results.totalNewsAnalyzed : 0,
        overallAccuracy: results ? results.overallAccuracy : 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching accuracy status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accuracy test status',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/accuracy/results
 * @desc Clear all accuracy test results
 * @access Public
 */
router.delete('/results', async (req, res) => {
  try {
    await accuracyTestService.clearAllResults();
    
    res.json({
      success: true,
      message: 'All accuracy test results cleared successfully'
    });

  } catch (error) {
    console.error('❌ Error clearing accuracy results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear accuracy test results',
      error: error.message
    });
  }
});

module.exports = router;