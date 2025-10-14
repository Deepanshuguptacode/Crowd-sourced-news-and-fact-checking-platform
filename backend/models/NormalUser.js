const mongoose = require('mongoose');

const normalUserSchema = new mongoose.Schema({
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
    default: 'User', // Should be 'Normal'
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
  // Face Authentication Fields
  faceEmbedding: {
    type: [Number], // Array of numbers representing face embedding
    default: null,
  },
  faceRegisteredAt: {
    type: Date,
    default: null,
  },
  hasFaceAuth: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('NormalUser', normalUserSchema);