// models/news.js
const mongoose = require('mongoose');
const NormalUser = require('./NormalUser');


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
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment', // reference to Comment model, which will be added later
  }],
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NoramlUser' }], // Users who upvoted
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NormalUser' }], // Users who downvoted

});

// Create the model from the schema
const News = mongoose.model('News', newsSchema);

module.exports = News;
