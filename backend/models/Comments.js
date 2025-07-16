// models/expertComment.js
const mongoose = require('mongoose');

const expertCommentSchema = new mongoose.Schema({
  newsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News',
    required: true,
  },
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertUser',
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // New fields for filtering integration
  isProcessedForFiltering: {
    type: Boolean,
    default: false,
  },
  filterGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommentGroup',
    default: null,
  },
});


const communityCommentSchema = new mongoose.Schema({
  newsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News',
    required: true,
  },
  commenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityUser',
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // New fields for filtering integration
  isProcessedForFiltering: {
    type: Boolean,
    default: false,
  },
  filterGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommentGroup',
    default: null,
  },
});

const CommunityComment = mongoose.model('CommunityComment', communityCommentSchema);

const ExpertComment = mongoose.model('ExpertComment', expertCommentSchema);

module.exports = { CommunityComment, ExpertComment };
