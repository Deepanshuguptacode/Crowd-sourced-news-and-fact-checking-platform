// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const NormalUser = require('../models/NormalUser');
const CommunityUser = require('../models/CommunityUser');
const ExpertUser = require('../models/ExpertUser');


// Middleware to authenticate the user
const authenticateNormalUser = async (req, res, next) => {
  //recive token from cookie
  const token = req.cookies.token;
  // const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  try {
    const decoded = jwt.verify(token, "RAM"); // Replace with your JWT secret
    req.user = await NormalUser.findById(`${decoded.id}`); // Attach user to the request object
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


// Middleware to authenticate the user
const authenticateCommunityUser = async (req, res, next) => {
  // const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  const token = req.cookies.token;


  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  try {
    
    const decoded = jwt.verify(token, "RAM"); // Replace with your JWT secret
    req.user = await CommunityUser.findById(`${decoded.id}`); // Attach user to the request object
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authenticateExpertUser = async (req, res, next) => {
  // const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  try {
    const decoded = jwt.verify(token, "RAM"); // Replace with your JWT secret
    req.user = await ExpertUser.findById(`${decoded.id}`); // Attach user to the request object
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authenticateCommunityOrExpertUser = async (req, res, next) => {
  // const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  const token = req.cookies.token;


  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  try {
    const decoded = jwt.verify(token, "RAM"); // Replace with your JWT secret
    const communityUser = await CommunityUser.findById(`${decoded.id}`);
    const expertUser = await ExpertUser.findById(`${decoded.id}`);

    if (communityUser || expertUser) {
      req.user = communityUser || expertUser; // Attach user to the request object
      return next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// General authentication middleware for all user types
const authenticateAnyUser = async (req, res, next) => {
  // Check for token in cookies first, then Authorization header
  let token = req.cookies.token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  try {
    const decoded = jwt.verify(token, "RAM"); // Replace with your JWT secret
    
    // Try to find user in all three user types
    const normalUser = await NormalUser.findById(`${decoded.id}`);
    const communityUser = await CommunityUser.findById(`${decoded.id}`);
    const expertUser = await ExpertUser.findById(`${decoded.id}`);

    const user = normalUser || communityUser || expertUser;
    
    if (user) {
      req.user = user; // Attach user to the request object
      // Add user type for easier identification
      req.userType = normalUser ? 'normal' : communityUser ? 'community' : 'expert';
      return next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


module.exports = { authenticateNormalUser, authenticateCommunityUser, authenticateExpertUser , authenticateCommunityOrExpertUser, authenticateAnyUser};
