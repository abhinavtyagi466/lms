const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: [0, 'Score cannot be negative']
  },
  totalMarks: {
    type: Number,
    required: true,
    min: [1, 'Total marks must be at least 1']
  },
  percentage: {
    type: Number,
    required: true,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  passed: {
    type: Boolean,
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    selectedAnswer: Number,
    isCorrect: Boolean,
    marks: Number
  }],
  timeTaken: {
    type: Number, // in seconds
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module ID is required']
  },
  videoProgress: {
    type: Number,
    default: 0,
    min: [0, 'Video progress cannot be negative'],
    max: [100, 'Video progress cannot exceed 100']
  },
  videoWatched: {
    type: Boolean,
    default: false
  },
  videoWatchedAt: {
    type: Date,
    default: null
  },
  videoStartTime: {
    type: Date,
    default: null
  },
  videoLastPaused: {
    type: Date,
    default: null
  },
  totalWatchTime: {
    type: Number,
    default: 0 // in seconds
  },
  watchSessions: [{
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    duration: { type: Number, default: 0 } // in seconds
  }],
  quizAttempts: [quizAttemptSchema],
  bestScore: {
    type: Number,
    default: 0,
    min: [0, 'Best score cannot be negative']
  },
  bestPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Best percentage cannot be negative'],
    max: [100, 'Best percentage cannot exceed 100']
  },
  passed: {
    type: Boolean,
    default: false
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'certified'],
    default: 'not_started'
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index for unique user-module combination
userProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });
userProgressSchema.index({ userId: 1 });
userProgressSchema.index({ moduleId: 1 });
userProgressSchema.index({ passed: 1 });

// Static method to get user progress
userProgressSchema.statics.getUserProgress = function(userId, moduleId) {
  return this.findOne({ userId, moduleId }).populate('moduleId');
};

// Static method to get all user progress
userProgressSchema.statics.getAllUserProgress = function(userId) {
  return this.find({ userId }).populate('moduleId').sort({ createdAt: 1 });
};

// Static method to get completed modules
userProgressSchema.statics.getCompletedModules = function(userId) {
  return this.find({ userId, passed: true }).populate('moduleId');
};

// Static method to get user statistics
userProgressSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalModules: { $sum: 1 },
        completedModules: { $sum: { $cond: ['$passed', 1, 0] } },
        averageScore: { $avg: '$bestPercentage' },
        totalCertificates: { $sum: { $cond: ['$certificateIssued', 1, 0] } }
      }
    }
  ]);
};

// Instance method to update video progress
userProgressSchema.methods.updateVideoProgress = function(progress) {
  this.videoProgress = Math.min(100, Math.max(0, progress));
  this.lastAccessedAt = new Date();
  
  if (this.videoProgress >= 90) { // Consider 90% as watched
    this.videoWatched = true;
    this.videoWatchedAt = new Date();
  }
  
  return this.save();
};

// Instance method to add quiz attempt
userProgressSchema.methods.addQuizAttempt = function(attemptData) {
  this.quizAttempts.push(attemptData);
  
  // Update best score
  if (attemptData.percentage > this.bestPercentage) {
    this.bestPercentage = attemptData.percentage;
    this.bestScore = attemptData.score;
  }
  
  // Check if passed
  if (attemptData.passed) {
    this.passed = true;
    this.completedAt = new Date();
  }
  
  this.lastAccessedAt = new Date();
  return this.save();
};

// Instance method to issue certificate
userProgressSchema.methods.issueCertificate = function() {
  if (this.passed && !this.certificateIssued) {
    this.certificateIssued = true;
    this.certificateIssuedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('UserProgress', userProgressSchema);
