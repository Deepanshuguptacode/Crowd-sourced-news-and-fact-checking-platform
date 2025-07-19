const mongoose = require('mongoose');

const expertUserSchema = new mongoose.Schema({
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
    default: 'Expert', // Should be 'Expert'
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
  areaOfExpertise: {
    type: [String],
    default: null,
  },
  credentials: {
    type: [String],
    default: null,
  },
  experience: {
    type: Number,
    default: null,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  isApproved: {
    type: Boolean,
    default: false, // Admin approval required
  },
  profession: {
    type: String,
    required: true, // Should be 'Journalist' or related
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ExpertUser', expertUserSchema);
