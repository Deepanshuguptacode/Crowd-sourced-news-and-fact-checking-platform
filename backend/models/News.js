// models/news.js
const mongoose = require('mongoose');
const NormalUser = require('./NormalUser');
const { CommunityComment, ExpertComment } = require('./Comments');
const { communityUserLogin } = require('../controllers/UserController');

// Define the schema for News
const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  screenshots: [{
    type: String, // URL to the uploaded screenshot
  }],
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Fake'],
    default: 'Pending',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NormalUser", // reference to the User model
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  comments: {
    community: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityComment', // reference to CommunityComment model
    }],
    expert: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpertComment', // reference to ExpertComment model
    }]
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityUser'
  }, {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertUser'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityUser'
  }, {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertUser'
  }], // Users who downvoted

});

// Create the model from the schema
const News = mongoose.model('News', newsSchema);

module.exports = News;
