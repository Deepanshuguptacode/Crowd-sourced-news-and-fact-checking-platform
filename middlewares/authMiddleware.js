// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const NormalUser = require('../models/NormalUser');
const CommunityUser = require('../models/CommunityUser');


// Middleware to authenticate the user
const authenticateNormalUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

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
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

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

module.exports = { authenticateNormalUser, authenticateCommunityUser};
