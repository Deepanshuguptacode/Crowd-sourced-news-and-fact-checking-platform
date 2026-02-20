const mongoose = require('mongoose');
const { Schema } = mongoose;

const DebateRoomSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'creatorModel'
  },
  creatorModel: {
    type: String,
    required: true,
    enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'participants.userModel'
    },
    userModel: {
      type: String,
      required: true,
      enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
    }
  }],
  maxParticipants: {
    type: Number,
    default: 50
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

DebateRoomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DebateRoom', DebateRoomSchema);
