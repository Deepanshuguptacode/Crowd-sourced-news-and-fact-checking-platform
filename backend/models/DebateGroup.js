const mongoose = require('mongoose');
const { Schema } = mongoose;

const DebateGroupSchema = new Schema({
  debateRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'DebateRoom',
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
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
  stance: {
    type: String,
    enum: ['for', 'against'],
    required: true
  },
  commentIds: [{
    type: Schema.Types.ObjectId,
    ref: 'DebateComment'
  }],
  counterGroupId: {
    type: Schema.Types.ObjectId,
    ref: 'DebateGroup',
    default: null
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

DebateGroupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DebateGroup', DebateGroupSchema);
