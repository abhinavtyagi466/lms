const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    selectedAnswer: {
      type: Number,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const userModuleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'failed'],
    default: 'not_started'
  },
  highestScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  attempts: [attemptSchema],
  videoWatched: {
    type: Boolean,
    default: false
  },
  videoWatchTime: {
    type: Number, // percentage watched
    default: 0,
    min: 0,
    max: 100
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  certificateGenerated: {
    type: Boolean,
    default: false
  },
  certificateUrl: {
    type: String
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure unique user-module combinations
userModuleSchema.index({ userId: 1, moduleId: 1 }, { unique: true });
userModuleSchema.index({ userId: 1 });
userModuleSchema.index({ moduleId: 1 });
userModuleSchema.index({ status: 1 });

// Virtual for attempt count
userModuleSchema.virtual('attemptCount').get(function() {
  return this.attempts.length;
});

// Virtual for latest attempt
userModuleSchema.virtual('latestAttempt').get(function() {
  if (this.attempts.length === 0) return null;
  return this.attempts[this.attempts.length - 1];
});

// Virtual for completion status
userModuleSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Instance method to record attempt
userModuleSchema.methods.recordAttempt = function(attemptData) {
  this.attempts.push(attemptData);
  
  // Update highest score
  if (attemptData.score > this.highestScore) {
    this.highestScore = attemptData.score;
  }
  
  // Update status based on latest attempt
  if (attemptData.passed) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.progress = 100;
  } else {
    this.status = 'failed';
  }
  
  return this.save();
};

// Instance method to mark video as watched
userModuleSchema.methods.markVideoWatched = function(watchPercentage = 100) {
  this.videoWatched = watchPercentage >= 80; // Consider watched if 80% or more
  this.videoWatchTime = watchPercentage;
  
  if (!this.startedAt) {
    this.startedAt = new Date();
    this.status = 'in_progress';
  }
  
  return this.save();
};

// Static method to get user progress summary
userModuleSchema.statics.getUserProgress = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalModules: { $sum: 1 },
        completedModules: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgressModules: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        averageScore: { $avg: '$highestScore' }
      }
    }
  ]);
};

module.exports = mongoose.model('UserModule', userModuleSchema);