const NormalUser = require('../models/NormalUser');
const CommunityUser = require('../models/CommunityUser');
const ExpertUser = require('../models/ExpertUser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Setup multer for profile photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    cb(null, 'profile_' + Date.now() + path.extname(file.originalname));
  },
});

const uploadPhoto = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
}).single('photo');

// Get user profile
const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user._id;
    let user = null;
    let userType = '';

    // Find user in appropriate collection
    user = await NormalUser.findById(userId).select('-password');
    if (user) userType = 'normal';
    
    if (!user) {
      user = await CommunityUser.findById(userId).select('-password');
      if (user) userType = 'community';
    }
    
    if (!user) {
      user = await ExpertUser.findById(userId).select('-password');
      if (user) userType = 'expert';
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: {
        user: user,
        userType: userType
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user._id;
    let user = null;
    let UserModel = null;

    // Determine user type and model
    user = await NormalUser.findById(userId);
    if (user) UserModel = NormalUser;
    
    if (!user) {
      user = await CommunityUser.findById(userId);
      if (user) UserModel = CommunityUser;
    }
    
    if (!user) {
      user = await ExpertUser.findById(userId);
      if (user) UserModel = ExpertUser;
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle file upload
    uploadPhoto(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err });
      }

      try {
        const updateData = {};
        
        // Basic fields for all user types
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.username) updateData.username = req.body.username;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.bio) updateData.bio = req.body.bio;
        
        // Parse interests if provided
        if (req.body.interests) {
          try {
            updateData.interests = JSON.parse(req.body.interests);
          } catch (e) {
            updateData.interests = req.body.interests.split(',').map(i => i.trim());
          }
        }

        // Photo upload
        if (req.file) {
          updateData.photo = `/uploads/profiles/${req.file.filename}`;
        }

        // Fields for community and expert users
        if (UserModel === CommunityUser || UserModel === ExpertUser) {
          if (req.body.location) updateData.location = req.body.location;
          if (req.body.verificationId) updateData.verificationId = req.body.verificationId;
          
          // Social links
          if (req.body.socialLinks) {
            try {
              updateData.socialLinks = JSON.parse(req.body.socialLinks);
            } catch (e) {
              updateData.socialLinks = {
                twitter: req.body.twitter || null,
                linkedin: req.body.linkedin || null,
                website: req.body.website || null
              };
            }
          }
        }

        // Additional fields for expert users
        if (UserModel === ExpertUser) {
          if (req.body.profession) updateData.profession = req.body.profession;
          if (req.body.experience) updateData.experience = parseInt(req.body.experience);
          
          if (req.body.areaOfExpertise) {
            try {
              updateData.areaOfExpertise = JSON.parse(req.body.areaOfExpertise);
            } catch (e) {
              updateData.areaOfExpertise = req.body.areaOfExpertise.split(',').map(i => i.trim());
            }
          }
          
          if (req.body.credentials) {
            try {
              updateData.credentials = JSON.parse(req.body.credentials);
            } catch (e) {
              updateData.credentials = req.body.credentials.split(',').map(i => i.trim());
            }
          }
        }

        // Update password if provided
        if (req.body.password && req.body.password.trim() !== '') {
          const salt = await bcrypt.genSalt(10);
          updateData.password = await bcrypt.hash(req.body.password, salt);
        }

        // Update user
        const updatedUser = await UserModel.findByIdAndUpdate(
          userId,
          { $set: updateData },
          { new: true, select: '-password' }
        );

        res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
          data: updatedUser
        });
      } catch (updateError) {
        console.error('Error updating profile:', updateError);
        res.status(500).json({
          success: false,
          message: 'Failed to update profile',
          error: updateError.message
        });
      }
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const userId = req.user._id;
    let user = null;
    let UserModel = null;

    // Find user and model
    user = await NormalUser.findById(userId);
    if (user) UserModel = NormalUser;
    
    if (!user) {
      user = await CommunityUser.findById(userId);
      if (user) UserModel = CommunityUser;
    }
    
    if (!user) {
      user = await ExpertUser.findById(userId);
      if (user) UserModel = ExpertUser;
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await UserModel.findByIdAndUpdate(userId, { password: hashedPassword });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
