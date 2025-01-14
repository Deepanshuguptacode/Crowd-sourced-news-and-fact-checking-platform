const mongoose = require('mongoose');

const communityUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CommunityUser', communityUserSchema);
