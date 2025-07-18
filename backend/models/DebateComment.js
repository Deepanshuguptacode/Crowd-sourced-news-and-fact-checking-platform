const mongoose = require('mongoose');
const { Schema } = mongoose;

const DebateCommentSchema = new Schema({
  debateRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'DebateRoom',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  stance: {
    type: String,
    enum: ['for', 'against'],
    required: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'DebateGroup',
    default: null
  },
  author: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'authorModel'
  },
  authorModel: {
    type: String,
    required: true,
    enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
  },
  authorName: {
    type: String,
    required: true
  },
  likes: [{
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'likes.userModel'
    },
    userModel: {
      type: String,
      required: true,
      enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
    }
  }],
  dislikes: [{
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'dislikes.userModel'
    },
    userModel: {
      type: String,
      required: true,
      enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DebateComment', DebateCommentSchema);
