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
