import express from 'express';
import {
  normalUserSignup,
  communityUserSignup,
  expertUserSignup,
  normalUserLogin,
  communityUserLogin,
  expertUserLogin,
} from '../controllers/UserController.js'
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

export default router;
