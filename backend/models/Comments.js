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
  // Evidence links array (experts can also provide evidence)
  evidenceLinks: [{
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Evidence link must be a valid URL'
      }
    },
    explanation: {
      type: String,
      required: true,
      maxlength: 500
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Expert voting system (experts can vote on other expert comments)
  expertVotes: [{
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpertUser',
      required: true
    },
    voteType: {
      type: String,
      enum: ['upvote', 'downvote'],
      required: true
    },
    explanation: {
      type: String,
      required: true,
      maxlength: 300
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Vote counts for quick access
  upvoteCount: {
    type: Number,
    default: 0
  },
  downvoteCount: {
    type: Number,
    default: 0
  },
  // New stance field - expert's position on the news
  stance: {
    type: String,
    enum: ['in_favor', 'against', 'general'],
    default: 'general'
  },
  // Comment score calculated as upvotes - downvotes
  score: {
    type: Number,
    default: 0
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
  // Evidence links array
  evidenceLinks: [{
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Evidence link must be a valid URL'
      }
    },
    explanation: {
      type: String,
      required: true,
      maxlength: 500
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Expert voting system
  expertVotes: [{
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpertUser',
      required: true
    },
    voteType: {
      type: String,
      enum: ['upvote', 'downvote'],
      required: true
    },
    explanation: {
      type: String,
      required: true,
      maxlength: 300
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Vote counts for quick access
  upvoteCount: {
    type: Number,
    default: 0
  },
  downvoteCount: {
    type: Number,
    default: 0
  },
  // New stance field - community user's position on the news
  stance: {
    type: String,
    enum: ['in_favor', 'against', 'general'],
    default: 'general'
  },
  // Comment score calculated as upvotes - downvotes
  score: {
    type: Number,
    default: 0
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

// Middleware to automatically calculate score before saving
expertCommentSchema.pre('save', function(next) {
  this.score = this.upvoteCount - this.downvoteCount;
  next();
});

communityCommentSchema.pre('save', function(next) {
  this.score = this.upvoteCount - this.downvoteCount;
  next();
});

const CommunityComment = mongoose.model('CommunityComment', communityCommentSchema);

const ExpertComment = mongoose.model('ExpertComment', expertCommentSchema);

module.exports = { CommunityComment, ExpertComment };
