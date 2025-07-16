const mongoose = require('mongoose');
const { Schema } = mongoose;

// Model for filtered/grouped comments
const CommentFilterSchema = new Schema({
  text: { 
    type: String, 
    required: true 
  },
  originalCommentId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  commentType: {
    type: String,
    enum: ['community', 'expert'],
    required: true
  },
  newsId: {
    type: Schema.Types.ObjectId,
    ref: 'News',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  embedding: { 
    type: [Number], 
    default: [] 
  },
  groupId: { 
    type: Schema.Types.ObjectId, 
    ref: 'CommentGroup', 
    default: null 
  }
});

// Model for comment groups
const CommentGroupSchema = new Schema({
  label: { 
    type: String, 
    required: true 
  },
  newsId: {
    type: Schema.Types.ObjectId,
    ref: 'News',
    required: true
  },
  embedding: { 
    type: [Number], 
    default: [] 
  },
  comments: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'CommentFilter' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const CommentFilter = mongoose.model('CommentFilter', CommentFilterSchema);
const CommentGroup = mongoose.model('CommentGroup', CommentGroupSchema);

module.exports = { CommentFilter, CommentGroup };
