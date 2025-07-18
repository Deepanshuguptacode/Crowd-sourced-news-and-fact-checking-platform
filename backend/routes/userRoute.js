const express = require('express');
const {
  normalUserSignup,
  communityUserSignup,
  expertUserSignup,
  normalUserLogin,
  communityUserLogin,
  expertUserLogin,
  getAllExperts,
  getExpertById,
} = require('../controllers/UserController');

const router = express.Router();

// Normal User Routes
router.post('/normal/signup', normalUserSignup);
router.post('/normal/login', normalUserLogin);

// Community User Routes
router.post('/community/signup', communityUserSignup);
router.post('/community/login', communityUserLogin);

// Expert User Routes
router.post('/expert/signup', expertUserSignup);
router.post('/expert/login', expertUserLogin);

// Public routes for experts
router.get('/experts', getAllExperts); // Get all approved experts
router.get('/experts/:id', getExpertById); // Get expert by ID

module.exports = router;
