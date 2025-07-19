const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/ProfileController');
const { authenticateAnyUser } = require('../middlewares/authMiddleware');

// Get user profile
router.get('/me', authenticateAnyUser, getProfile);

// Update user profile
router.put('/update', authenticateAnyUser, updateProfile);

// Change password
router.put('/change-password', authenticateAnyUser, changePassword);

module.exports = router;
