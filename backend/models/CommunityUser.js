const mongoose = require('mongoose');

const communityUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    default: 'Community', // Should be 'Community'
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: null,
  },
  interests: {
    type: [String],
    default: null,
  },
  verificationId: {
    type: String,
    default: null,
  },
  photo: {
    type: String,
    default: null,
  },
  location: {
    type: String,
    default: null,
  },
  socialLinks: {
    twitter: { type: String, default: null },
    linkedin: { type: String, default: null },
    website: { type: String, default: null }
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  isApproved: {
    type: Boolean,
    default: false, // Admin approval required
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CommunityUser', communityUserSchema);
