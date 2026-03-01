const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import Models
const NormalUser = require('../models/NormalUser');
const CommunityUser = require('../models/CommunityUser');
const ExpertUser = require('../models/ExpertUser');
const Admin = require('../models/Admin');

// Import Face Authentication Service
const HttpFaceAuthService = require('../services/httpFaceAuthService');
const faceAuthService = new HttpFaceAuthService();

// JWT Secret Key
const JWT_SECRET = "RAM"; // Replace with a secure secret key

// Cosine similarity helper for duplicate face detection
const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (magA * magB);
};

// Signup Function (Enhanced with Face Authentication)
const signup = async (req, res, UserModel) => {
  try {
    const { name, username, email, password, profession, faceImage } = req.body;
    
    // Face authentication is mandatory
    if (!faceImage) {
      return res.status(400).json({ message: "Face authentication is required to create an account." });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Process face authentication (mandatory)
    let faceEmbedding = null;
    let hasFaceAuth = false;
    let faceRegisteredAt = null;

    try {
      console.log(`🔍 [SIGNUP] Processing face image for user: ${username}`);
      
      // Check if Face-authorization-System is running
      const isServiceRunning = await faceAuthService.isServiceRunning();
      if (!isServiceRunning) {
        console.log(`❌ [SIGNUP] Face-authorization-System not running, attempting to start...`);
        try {
          await faceAuthService.startFaceAuthService();
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (startError) {
          return res.status(500).json({ 
            message: "Face authentication service unavailable. Please try again later." 
          });
        }
      }
      
      // Extract face embedding
      const faceResult = await faceAuthService.extractFaceEmbedding(faceImage);
      
      if (!faceResult.success || !faceResult.embedding) {
        console.log(`❌ [SIGNUP] Face extraction failed for user: ${username}`, faceResult.message);
        return res.status(400).json({ 
          message: "Face registration failed: " + (faceResult.message || "No face detected") 
        });
      }

      const newEmbedding = faceResult.embedding;
      const DUPLICATE_THRESHOLD = 0.3;

      // Check for duplicate face across ALL user collections
      const allCollections = [NormalUser, CommunityUser, ExpertUser];
      for (const Collection of allCollections) {
        const usersWithFace = await Collection.find(
          { hasFaceAuth: true, faceEmbedding: { $exists: true, $ne: null } },
          { email: 1, username: 1, faceEmbedding: 1 }
        );
        for (const existingFaceUser of usersWithFace) {
          const similarity = cosineSimilarity(newEmbedding, existingFaceUser.faceEmbedding);
          if (similarity > DUPLICATE_THRESHOLD) {
            console.log(`🚫 [SIGNUP] Duplicate face detected! New user "${username}" matches existing user "${existingFaceUser.username}" (${existingFaceUser.email}) with similarity ${similarity.toFixed(4)} > threshold ${DUPLICATE_THRESHOLD}`);
            return res.status(409).json({ 
              message: `This face is already registered to an existing account. Please log in instead.`,
              isDuplicateFace: true,
              similarity: parseFloat(similarity.toFixed(4))
            });
          }
        }
      }

      faceEmbedding = newEmbedding;
      hasFaceAuth = true;
      faceRegisteredAt = new Date();
      console.log(`✅ [SIGNUP] Face embedding extracted and duplicate check passed for user: ${username}`);

    } catch (error) {
      console.error(`💥 [SIGNUP] Face processing error for user: ${username}`, error);
      return res.status(400).json({ 
        message: "Face registration failed: " + error.message 
      });
    }

    // Create a new user
    const newUser = new UserModel({
      name,
      username,
      email,
      password: hashedPassword,
      ...(profession && { profession }), // Include profession for ExpertUser
      faceEmbedding,
      hasFaceAuth,
      faceRegisteredAt,
    });

    await newUser.save();
    
    // Generate JWT
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: UserModel.modelName },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    res.cookie("token", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production', // true in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    const successMessage = "User registered successfully with face authentication!";

    res.status(201).json({ 
      message: successMessage,
      hasFaceAuth: hasFaceAuth,
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        hasFaceAuth: newUser.hasFaceAuth
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: "Signup failed!", error: error.message });
  }
};

// Login Function (Enhanced with Face Authentication)
const login = async (req, res, UserModel) => {
  try {
    const { email, password, faceImage, loginMethod = 'password' } = req.body;

    // Check if user exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist!" });
    }

    let authSuccess = false;
    let authMethod = '';

    if (loginMethod === 'face' && faceImage) {
      // Face-based authentication
      if (!user.hasFaceAuth || !user.faceEmbedding) {
        return res.status(400).json({ 
          message: "Face authentication not available for this account. Please use password login or register your face first." 
        });
      }

      try {
        console.log(`🔍 [LOGIN] Processing face authentication for user: ${email}`);
        
        // Check if Face-authorization-System is running
        const isServiceRunning = await faceAuthService.isServiceRunning();
        if (!isServiceRunning) {
          return res.status(500).json({ 
            message: "Face authentication service unavailable. Please use password login." 
          });
        }
        
        // Extract embedding from login image and compare with stored embedding
        const faceResult = await faceAuthService.extractFaceEmbedding(faceImage);
        
        if (!faceResult.success || !faceResult.embedding) {
          return res.status(401).json({ 
            message: "Face authentication failed: " + (faceResult.message || "No face detected") 
          });
        }

        // Verify face match using stored embedding
        const matchResult = faceAuthService.verifyFaceMatch(
          faceResult.embedding, 
          user.faceEmbedding, 
          0.3 // threshold
        );

        if (matchResult.success && matchResult.matched) {
          authSuccess = true;
          authMethod = 'face';
          console.log(`✅ [LOGIN] Face authentication successful for user: ${email} (similarity: ${matchResult.similarity.toFixed(3)})`);
        } else {
          console.log(`❌ [LOGIN] Face authentication failed for user: ${email} (similarity: ${matchResult.similarity ? matchResult.similarity.toFixed(3) : 0})`);
          return res.status(401).json({ 
            message: "Face not recognized. Please try again or use password login.",
            similarity: verificationResult.similarity || 0
          });
        }
      } catch (error) {
        console.error(`💥 [LOGIN] Face authentication error for user: ${email}`, error);
        return res.status(401).json({ 
          message: "Face authentication failed: " + error.message 
        });
      }
    } else {
      // Password-based authentication
      if (!password) {
        return res.status(400).json({ message: "Password is required for password login!" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials!" });
      }

      authSuccess = true;
      authMethod = 'password';
      console.log(`✅ [LOGIN] Password authentication successful for user: ${email}`);
    }

    if (!authSuccess) {
      return res.status(401).json({ message: "Authentication failed!" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: UserModel.modelName },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    res.cookie("token", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production', // true in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    res.status(200).json({ 
      message: `Login successful via ${authMethod}!`, 
      token,
      authMethod,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        hasFaceAuth: user.hasFaceAuth
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Login failed!", error: error.message });
  }
};

// Get all approved experts
const getAllExperts = async (req, res) => {
  try {
    const experts = await ExpertUser.find({ isApproved: true })
      .select('name username email profession createdAt') // Simplified selection
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Experts fetched successfully',
      experts: experts,
      count: experts.length
    });
  } catch (error) {
    console.error('Error fetching experts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experts',
      error: error.message
    });
  }
};

// Get expert by ID
const getExpertById = async (req, res) => {
  try {
    const { id } = req.params;
    const expert = await ExpertUser.findById(id)
      .select('name username email profession createdAt');

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    if (!expert.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Expert not approved'
      });
    }

    res.status(200).json({
      success: true,
      expert: expert
    });
  } catch (error) {
    console.error('Error fetching expert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expert',
      error: error.message
    });
  }
};

// Face Authentication Functions
const registerFace = async (req, res, UserModel) => {
  try {
    const { userId, faceImage } = req.body;

    if (!userId || !faceImage) {
      return res.status(400).json({ message: "User ID and face image are required!" });
    }

    // Find user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (user.hasFaceAuth) {
      return res.status(400).json({ message: "Face authentication already registered for this user!" });
    }

    try {
      console.log(`🔍 [FACE_REG] Processing face registration for user: ${user.username}`);
      
      // Extract face embedding
      const faceResult = await faceAuthService.extractFaceEmbedding(faceImage);
      
      if (faceResult.success && faceResult.embedding) {
        // Update user with face authentication data
        user.faceEmbedding = faceResult.embedding;
        user.hasFaceAuth = true;
        user.faceRegisteredAt = new Date();
        await user.save();

        console.log(`✅ [FACE_REG] Face registered successfully for user: ${user.username}`);
        res.status(200).json({ 
          message: "Face authentication registered successfully!",
          hasFaceAuth: true
        });
      } else {
        console.log(`❌ [FACE_REG] Face registration failed for user: ${user.username}`, faceResult.error);
        res.status(400).json({ 
          message: "Face registration failed: " + (faceResult.error || "No face detected") 
        });
      }
    } catch (error) {
      console.error(`💥 [FACE_REG] Face processing error for user: ${user.username}`, error);
      res.status(400).json({ 
        message: "Face registration failed: " + error.message 
      });
    }
  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({ message: "Face registration failed!", error: error.message });
  }
};

const verifyFace = async (req, res, UserModel) => {
  try {
    const { faceImage } = req.body;

    if (!faceImage) {
      return res.status(400).json({ message: "Face image is required!" });
    }

    try {
      console.log(`🔍 [FACE_VERIFY] Processing face verification`);
      
      // Extract face embedding from verification image
      const faceResult = await faceAuthService.extractFaceEmbedding(faceImage);
      
      if (!faceResult.success || !faceResult.embedding) {
        return res.status(400).json({ 
          message: "Face verification failed: " + (faceResult.error || "No face detected") 
        });
      }

      // Get all users with face authentication from this user type
      const usersWithFace = await UserModel.find({ 
        hasFaceAuth: true, 
        faceEmbedding: { $exists: true, $ne: null } 
      });

      if (usersWithFace.length === 0) {
        return res.status(404).json({ message: "No registered faces found for this user type." });
      }

      // Prepare stored embeddings for verification
      const storedEmbeddings = {};
      usersWithFace.forEach(user => {
        storedEmbeddings[user._id.toString()] = user.faceEmbedding;
      });

      // Verify face match
      const verificationResult = await faceAuthService.verifyFaceMatch(
        faceResult.embedding, 
        storedEmbeddings, 
        0.3 // threshold
      );

      if (verificationResult.success && verificationResult.matched_user_id) {
        const matchedUser = usersWithFace.find(u => u._id.toString() === verificationResult.matched_user_id);
        
        console.log(`✅ [FACE_VERIFY] Face verified successfully for user: ${matchedUser.username} (similarity: ${verificationResult.similarity})`);
        
        res.status(200).json({
          message: `Face verified successfully! Welcome back, ${matchedUser.name}`,
          success: true,
          user: {
            id: matchedUser._id,
            name: matchedUser.name,
            username: matchedUser.username,
            email: matchedUser.email
          },
          similarity: verificationResult.similarity
        });
      } else {
        console.log(`❌ [FACE_VERIFY] Face not recognized (best similarity: ${verificationResult.similarity || 0})`);
        res.status(401).json({ 
          message: "Face not recognized",
          success: false,
          similarity: verificationResult.similarity || 0
        });
      }
    } catch (error) {
      console.error(`💥 [FACE_VERIFY] Face verification error:`, error);
      res.status(400).json({ 
        message: "Face verification failed: " + error.message 
      });
    }
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ message: "Face verification failed!", error: error.message });
  }
};

const getFaceAuthStatus = async (req, res, UserModel) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json({
      userId: user._id,
      hasFaceAuth: user.hasFaceAuth || false,
      faceRegisteredAt: user.faceRegisteredAt || null
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get face auth status!", error: error.message });
  }
};

// =========================================================================
//  ADMIN  SIGNUP / LOGIN
// =========================================================================

/**
 * Admin signup — requires ADMIN_SECURITY_PASSWORD from .env
 */
const adminSignup = async (req, res) => {
  try {
    const { name, username, email, password, securityPassword } = req.body;

    // Validate security password
    const envSecurityPassword = process.env.ADMIN_SECURITY_PASSWORD;
    if (!envSecurityPassword) {
      return res.status(500).json({ message: 'Admin security password not configured on server' });
    }

    if (!securityPassword || securityPassword !== envSecurityPassword) {
      return res.status(403).json({ message: 'Invalid security password. Admin registration denied.' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email or username already exists!' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name,
      username,
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

    // Generate JWT
    const token = jwt.sign(
      { id: newAdmin._id, email: newAdmin.email, role: 'Admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Admin account created successfully!',
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        username: newAdmin.username,
        email: newAdmin.email,
        role: 'Admin',
      },
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ message: 'Admin signup failed!', error: error.message });
  }
};

/**
 * Admin login
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Admin account does not exist!' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials!' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'Admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Admin login successful!',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: 'Admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Admin login failed!', error: error.message });
  }
};

// Export Functions
module.exports = {
  normalUserSignup: (req, res) => signup(req, res, NormalUser),
  communityUserSignup: (req, res) => signup(req, res, CommunityUser),
  expertUserSignup: (req, res) => signup(req, res, ExpertUser),
  normalUserLogin: (req, res) => login(req, res, NormalUser),
  communityUserLogin: (req, res) => login(req, res, CommunityUser),
  expertUserLogin: (req, res) => login(req, res, ExpertUser),
  // Face Authentication Routes
  normalUserRegisterFace: (req, res) => registerFace(req, res, NormalUser),
  communityUserRegisterFace: (req, res) => registerFace(req, res, CommunityUser),
  expertUserRegisterFace: (req, res) => registerFace(req, res, ExpertUser),
  normalUserVerifyFace: (req, res) => verifyFace(req, res, NormalUser),
  communityUserVerifyFace: (req, res) => verifyFace(req, res, CommunityUser),
  expertUserVerifyFace: (req, res) => verifyFace(req, res, ExpertUser),
  normalUserFaceAuthStatus: (req, res) => getFaceAuthStatus(req, res, NormalUser),
  communityUserFaceAuthStatus: (req, res) => getFaceAuthStatus(req, res, CommunityUser),
  expertUserFaceAuthStatus: (req, res) => getFaceAuthStatus(req, res, ExpertUser),
  getAllExperts,
  getExpertById,
  adminSignup,
  adminLogin,
};
