const mongoose = require('mongoose');

const aiVerdictSchema = new mongoose.Schema({
  newsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News',
    required: true,
    unique: true // Only one verdict per news article
  },
  verdict: {
    type: String,
    required: true,
    maxlength: 2000 // AI analysis text (max 2000 chars for detailed 250-word analysis)
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // 0-100 scale (0 = fake, 100 = real)
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1 // 0-1 confidence level
  },
  topComments: {
    inFavor: [{
      commentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      commentType: {
        type: String,
        enum: ['community', 'expert'],
        required: true
      },
      commentText: {
        type: String,
        required: true
      },
      evidenceLinks: [{
        url: String,
        explanation: String
      }],
      upvoteCount: {
        type: Number,
        default: 0
      },
      downvoteCount: {
        type: Number,
        default: 0
      },
      score: {
        type: Number,
        default: 0
      }
    }],
    against: [{
      commentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      commentType: {
        type: String,
        enum: ['community', 'expert'],
        required: true
      },
      commentText: {
        type: String,
        required: true
      },
      evidenceLinks: [{
        url: String,
        explanation: String
      }],
      upvoteCount: {
        type: Number,
        default: 0
      },
      downvoteCount: {
        type: Number,
        default: 0
      },
      score: {
        type: Number,
        default: 0
      }
    }]
  },
  analysisMetadata: {
    totalCommentsAnalyzed: {
      type: Number,
      default: 0
    },
    commentsByStance: {
      inFavor: { type: Number, default: 0 },
      against: { type: Number, default: 0 },
      general: { type: Number, default: 0 }
    },
    averageScore: {
      inFavor: { type: Number, default: 0 },
      against: { type: Number, default: 0 }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastRegenerated: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    model: {
      type: String,
      default: 'gemini-3-flash-preview'
    },
    version: {
      type: String,
      default: '1.0'
    }
  }
});

// Index for faster queries
aiVerdictSchema.index({ newsId: 1 });
aiVerdictSchema.index({ createdAt: -1 });

const AIVerdict = mongoose.model('AIVerdict', aiVerdictSchema);

module.exports = AIVerdict;