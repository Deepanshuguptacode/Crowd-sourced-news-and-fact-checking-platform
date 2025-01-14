// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/NormalUser');

// Middleware to authenticate the user
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  try {
    const decoded = jwt.verify(token, "RAM"); // Replace with your JWT secret
    req.user = await User.findById(`${decoded.id}`); // Attach user to the request object
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateUser };
