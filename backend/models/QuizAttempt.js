const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
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
  attemptNumber: {
    type: Number,
    default: 1
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
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
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    weightage: {
      type: Number,
      default: 1
    }
  }],
  violations: [{
    type: {
      type: String,
      enum: ['fullscreen_exit', 'tab_switch', 'time_limit_exceeded', 'multiple_windows', 'copy_paste'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  }],
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'terminated', 'violation'],
    default: 'in_progress'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  deviceInfo: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
quizAttemptSchema.index({ userId: 1, moduleId: 1 });
quizAttemptSchema.index({ startTime: -1 });
quizAttemptSchema.index({ status: 1 });
quizAttemptSchema.index({ violations: 1 });

// Virtual for duration
quizAttemptSchema.virtual('duration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime - this.startTime) / 1000);
  }
  return this.timeSpent;
});

// Static method to get user's quiz history
quizAttemptSchema.statics.getUserHistory = function(userId, moduleId = null) {
  const query = { userId };
  if (moduleId) query.moduleId = moduleId;
  
  return this.find(query)
    .sort({ startTime: -1 })
    .populate('moduleId', 'title')
    .populate('userId', 'name email');
};

// Static method to get violations for admin
quizAttemptSchema.statics.getViolations = function(filters = {}) {
  const query = { 'violations.0': { $exists: true } };
  
  if (filters.userId) query.userId = filters.userId;
  if (filters.moduleId) query.moduleId = filters.moduleId;
  if (filters.severity) query['violations.severity'] = filters.severity;
  
  return this.find(query)
    .sort({ startTime: -1 })
    .populate('moduleId', 'title')
    .populate('userId', 'name email employeeId');
};

// Instance method to add violation
quizAttemptSchema.methods.addViolation = function(violationData) {
  this.violations.push(violationData);
  this.status = 'violation';
  return this.save();
};

// Instance method to complete attempt
quizAttemptSchema.methods.complete = function(endTime, score, passed, answers) {
  this.endTime = endTime;
  this.score = score;
  this.passed = passed;
  this.answers = answers;
  this.status = 'completed';
  this.timeSpent = Math.round((endTime - this.startTime) / 1000);
  return this.save();
};

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
