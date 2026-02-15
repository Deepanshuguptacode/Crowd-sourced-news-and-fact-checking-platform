// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const NormalUser = require('../models/NormalUser');
const CommunityUser = require('../models/CommunityUser');
const ExpertUser = require('../models/ExpertUser');
const Admin = require('../models/Admin');


// Middleware to authenticate the user
const authenticateNormalUser = async (req, res, next) => {
  // Try to get token from cookies first, then from Authorization header
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
    req.user = await NormalUser.findById(`${decoded.id}`); // Attach user to the request object
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


// Middleware to authenticate the user
const authenticateCommunityUser = async (req, res, next) => {
  // Try to get token from cookies first, then from Authorization header
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
    req.user = await CommunityUser.findById(`${decoded.id}`); // Attach user to the request object
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authenticateExpertUser = async (req, res, next) => {
  // Try to get token from cookies first, then from Authorization header
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
    req.user = await ExpertUser.findById(`${decoded.id}`); // Attach user to the request object
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authenticateCommunityOrExpertUser = async (req, res, next) => {
  // Try to get token from cookies first, then from Authorization header
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

// Authenticate admin user
const authenticateAdmin = async (req, res, next) => {
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
    const decoded = jwt.verify(token, "RAM");
    const admin = await Admin.findById(`${decoded.id}`);
    if (!admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = admin;
    req.userType = 'admin';
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// General authentication middleware for all user types (including admin)
const authenticateAnyUser = async (req, res, next) => {
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
    const decoded = jwt.verify(token, "RAM");
    
    // Try to find user in all user types (including admin)
    const normalUser = await NormalUser.findById(`${decoded.id}`);
    const communityUser = !normalUser ? await CommunityUser.findById(`${decoded.id}`) : null;
    const expertUser = (!normalUser && !communityUser) ? await ExpertUser.findById(`${decoded.id}`) : null;
    const adminUser = (!normalUser && !communityUser && !expertUser) ? await Admin.findById(`${decoded.id}`) : null;

    const user = normalUser || communityUser || expertUser || adminUser;
    
    if (user) {
      req.user = user;
      req.userType = normalUser ? 'normal' : communityUser ? 'community' : expertUser ? 'expert' : 'admin';
      return next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


module.exports = { authenticateNormalUser, authenticateCommunityUser, authenticateExpertUser, authenticateCommunityOrExpertUser, authenticateAnyUser, authenticateAdmin };
