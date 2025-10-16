const mongoose = require('mongoose');

const accuracyTestSchema = new mongoose.Schema({
  testId: {
    type: String,
    unique: true,
    default: () => `test_${Date.now()}`
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  verificationAccuracy: {
    expertOnly: {
      simple: {
        mean: Number,
        std: Number
      },
      moderate: {
        mean: Number,
        std: Number
      },
      complex: {
        mean: Number,
        std: Number
      }
    },
    voxVeritas: {
      simple: {
        mean: Number,
        std: Number
      },
      moderate: {
        mean: Number,
        std: Number
      },
      complex: {
        mean: Number,
        std: Number
      }
    }
  },
  engagementMetrics: {
    crossViewpointEngagement: {
      baseline: Number,
      forum: Number,
      voxVeritas: Number,
      improvement: Number
    },
    averageResponseLength: {
      baseline: Number,
      forum: Number,
      voxVeritas: Number,
      improvement: Number
    },
    evidenceLinkInclusion: {
      baseline: Number,
      forum: Number,
      voxVeritas: Number,
      improvement: Number
    },
    constructiveToneScore: {
      baseline: Number,
      forum: Number,
      voxVeritas: Number,
      improvement: Number
    }
  },
  totalNewsAnalyzed: {
    type: Number,
    default: 0
  },
  fakeNewsCorrectlyIdentified: {
    type: Number,
    default: 0
  },
  realNewsCorrectlyIdentified: {
    type: Number,
    default: 0
  },
  overallAccuracy: {
    type: Number,
    default: 0
  },
  calculationDuration: {
    type: Number, // in milliseconds
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
accuracyTestSchema.index({ lastCalculated: -1 });
accuracyTestSchema.index({ testId: 1 });

const AccuracyTest = mongoose.model('AccuracyTest', accuracyTestSchema);

module.exports = AccuracyTest;