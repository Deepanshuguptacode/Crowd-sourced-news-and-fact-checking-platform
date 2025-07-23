const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoute');
const NewsRoutes = require('./routes/NewsRoute');
const commentFilterRoutes = require('./routes/commentFilterRoute');
const debateRoomRoutes = require('./routes/debateRoomRoute');
const trendingNewsRoutes = require('./routes/trendingNewsRoute');
const profileRoutes = require('./routes/profileRoute');
const trendingNewsScheduler = require('./services/trendingNewsScheduler');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load environment variables
require('dotenv').config();

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:4173', // Vite preview
    'http://127.0.0.1:4173',
    'https://voxveritas.me',
    'https://www.voxveritas.me',
    // Add your Render frontend URL here when deployed
    process.env.FRONTEND_URL || 'https://voxveritas.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  credentials: true, // Allow cookies and authorization headers
  optionsSuccessStatus: 200, // For legacy browser support
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname,'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/users', userRoutes);
app.use('/news', NewsRoutes);
app.use('/comment-filter', commentFilterRoutes);
app.use('/debate-rooms', debateRoomRoutes);
app.use('/trending-news', trendingNewsRoutes);
app.use('/profile', profileRoutes);

// Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/DBMS';
const PORT = process.env.PORT || 3000;

console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('MONGODB_URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Missing');

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✓ Connected to MongoDB successfully");
    
    // Start trending news scheduler
    trendingNewsScheduler.start();
    console.log("✓ Trending news scheduler started");
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Health check available at: http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    console.error("✗ MongoDB connection failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  });
