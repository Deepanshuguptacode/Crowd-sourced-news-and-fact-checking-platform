// routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const { uploadNews } = require('../controllers/NewsController');

// Middleware for authentication (you can implement this based on your auth system)
const { authenticateUser } = require('../middlewares/authMiddleware');

// Route for uploading news (protected route, only authenticated users can upload)
router.post('/upload', authenticateUser , uploadNews);

module.exports = router;
