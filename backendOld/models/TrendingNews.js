const mongoose = require('mongoose');

const trendingNewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  source: {
    type: String,
    default: 'NDTV'
  },
  category: {
    type: String,
    default: 'India'
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reposts: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityUser',
      required: true
    },
    repostedAt: {
      type: Date,
      default: Date.now
    },
    comment: {
      type: String,
      default: ''
    }
  }],
  repostCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better performance
trendingNewsSchema.index({ fetchedAt: -1 });
trendingNewsSchema.index({ link: 1 });
trendingNewsSchema.index({ isActive: 1 });

module.exports = mongoose.model('TrendingNews', trendingNewsSchema);
