const express = require('express');
const {
  normalUserSignup,
  communityUserSignup,
  expertUserSignup,
  normalUserLogin,
  communityUserLogin,
  expertUserLogin,
  // Face Authentication Functions
  normalUserRegisterFace,
  communityUserRegisterFace,
  expertUserRegisterFace,
  normalUserVerifyFace,
  communityUserVerifyFace,
  expertUserVerifyFace,
  normalUserFaceAuthStatus,
  communityUserFaceAuthStatus,
  expertUserFaceAuthStatus,
  getAllExperts,
  getExpertById,
  adminSignup,
  adminLogin,
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

// Face Authentication Routes - Normal Users
router.post('/normal/register-face', normalUserRegisterFace);
router.post('/normal/verify-face', normalUserVerifyFace);
router.get('/normal/face-auth-status/:userId', normalUserFaceAuthStatus);

// Face Authentication Routes - Community Users
router.post('/community/register-face', communityUserRegisterFace);
router.post('/community/verify-face', communityUserVerifyFace);
router.get('/community/face-auth-status/:userId', communityUserFaceAuthStatus);

// Face Authentication Routes - Expert Users
router.post('/expert/register-face', expertUserRegisterFace);
router.post('/expert/verify-face', expertUserVerifyFace);
router.get('/expert/face-auth-status/:userId', expertUserFaceAuthStatus);

// Public routes for experts
router.get('/experts', getAllExperts); // Get all approved experts
router.get('/experts/:id', getExpertById); // Get expert by ID

// Admin Routes
router.post('/admin/signup', adminSignup);
router.post('/admin/login', adminLogin);

module.exports = router;
