const mongoose = require('mongoose');

const kpiScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // TAT Score (20%)
  tat: {
    percentage: {
      type: Number,
      required: [true, 'TAT percentage is required'],
      min: 0,
      max: 100
    },
    score: {
      type: Number,
      min: 0,
      max: 20
    }
  },
  // Major Negativity Score (20%)
  majorNegativity: {
    percentage: {
      type: Number,
      required: [true, 'Major negativity percentage is required'],
      min: 0,
      max: 100
    },
    score: {
      type: Number,
      min: 0,
      max: 20
    }
  },
  // Quality Score (20%)
  quality: {
    percentage: {
      type: Number,
      required: [true, 'Quality percentage is required'],
      min: 0,
      max: 100
    },
    score: {
      type: Number,
      min: 0,
      max: 20
    }
  },
  // Neighbor Check Score (10%)
  neighborCheck: {
    percentage: {
      type: Number,
      required: [true, 'Neighbor check percentage is required'],
      min: 0,
      max: 100
    },
    score: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  // General Negativity Score (10%)
  negativity: {
    percentage: {
      type: Number,
      required: [true, 'Negativity percentage is required'],
      min: 0,
      max: 100
    },
    score: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  // App Usage Score (10%)
  appUsage: {
    percentage: {
      type: Number,
      required: [true, 'App usage percentage is required'],
      min: 0,
      max: 100
    },
    score: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  // Insufficiency Score (10%)
  insufficiency: {
    percentage: {
      type: Number,
      required: [true, 'Insufficiency percentage is required'],
      min: 0,
      max: 100
    },
    score: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  rating: {
    type: String,
    enum: ['Outstanding', 'Excellent', 'Satisfactory', 'Need Improvement', 'Unsatisfactory'],
    required: true
  },
  period: {
    type: String,
    required: true, // e.g., "2024-Q1", "2024-01"
    trim: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [500, 'Comments cannot be more than 500 characters']
  },
  triggeredActions: [{
    type: String,
    enum: ['training', 'audit', 'warning', 'recognition']
  }],
  trainingAssignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingAssignment'
  }],
  emailLogs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailLog'
  }],
  auditSchedules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuditSchedule'
  }],
  processedAt: {
    type: Date
  },
  automationStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for user and period uniqueness
kpiScoreSchema.index({ userId: 1, period: 1 }, { unique: true });
kpiScoreSchema.index({ userId: 1 });
kpiScoreSchema.index({ overallScore: 1 });
kpiScoreSchema.index({ rating: 1 });
kpiScoreSchema.index({ automationStatus: 1 });
kpiScoreSchema.index({ processedAt: 1 });
kpiScoreSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate scores and determine actions
kpiScoreSchema.pre('save', function (next) {
  // Calculate TAT score (20%)
  if (this.tat.percentage >= 95) this.tat.score = 20;
  else if (this.tat.percentage >= 90) this.tat.score = 10;
  else if (this.tat.percentage >= 85) this.tat.score = 5;
  else this.tat.score = 0;

  // Calculate Major Negativity score (20%)
  if (this.majorNegativity.percentage >= 2.5) this.majorNegativity.score = 0;
  else if (this.majorNegativity.percentage >= 2) this.majorNegativity.score = 5;
  else if (this.majorNegativity.percentage >= 1.5) this.majorNegativity.score = 15;
  else this.majorNegativity.score = 20;

  // Calculate Quality score (20%)
  if (this.quality.percentage === 0) this.quality.score = 20;
  else if (this.quality.percentage <= 0.25) this.quality.score = 15;
  else if (this.quality.percentage <= 0.5) this.quality.score = 10;
  else this.quality.score = 0;

  // Calculate Neighbor Check score (10%)
  if (this.neighborCheck.percentage >= 90) this.neighborCheck.score = 10;
  else if (this.neighborCheck.percentage >= 85) this.neighborCheck.score = 5;
  else if (this.neighborCheck.percentage >= 80) this.neighborCheck.score = 2;
  else this.neighborCheck.score = 0;

  // Calculate Negativity score (10%)
  if (this.negativity.percentage >= 25) this.negativity.score = 0;
  else if (this.negativity.percentage >= 20) this.negativity.score = 2;
  else if (this.negativity.percentage >= 15) this.negativity.score = 5;
  else this.negativity.score = 10;

  // Calculate App Usage score (10%)
  if (this.appUsage.percentage >= 90) this.appUsage.score = 10;
  else if (this.appUsage.percentage >= 85) this.appUsage.score = 5;
  else if (this.appUsage.percentage >= 80) this.appUsage.score = 2;
  else this.appUsage.score = 0;

  // Calculate Insufficiency score (10%)
  if (this.insufficiency.percentage < 1) this.insufficiency.score = 10;
  else if (this.insufficiency.percentage <= 1.5) this.insufficiency.score = 5;
  else if (this.insufficiency.percentage <= 2) this.insufficiency.score = 2;
  else this.insufficiency.score = 0;

  // Calculate overall score
  this.overallScore = Math.round(
    this.tat.score +
    this.majorNegativity.score +
    this.quality.score +
    this.neighborCheck.score +
    this.negativity.score +
    this.appUsage.score +
    this.insufficiency.score
  );

  // Determine rating based on score
  if (this.overallScore >= 85) {
    this.rating = 'Outstanding';
  } else if (this.overallScore >= 70) {
    this.rating = 'Excellent';
  } else if (this.overallScore >= 50) {
    this.rating = 'Satisfactory';
  } else if (this.overallScore >= 40) {
    this.rating = 'Need Improvement';
  } else {
    this.rating = 'Unsatisfactory';
  }

  // Determine triggered actions based on conditions
  this.triggeredActions = [];

  // KPI Score based triggers
  if (this.overallScore >= 85) {
    this.triggeredActions.push('reward');
  } else if (this.overallScore >= 70) {
    this.triggeredActions.push('audit_call');
  } else if (this.overallScore >= 50) {
    this.triggeredActions.push('audit_call');
    this.triggeredActions.push('cross_check_3_months');
  } else if (this.overallScore >= 40) {
    this.triggeredActions.push('basic_training');
    this.triggeredActions.push('audit_call');
    this.triggeredActions.push('cross_check_3_months');
    this.triggeredActions.push('dummy_audit');
  } else {
    this.triggeredActions.push('basic_training');
    this.triggeredActions.push('audit_call');
    this.triggeredActions.push('cross_check_3_months');
    this.triggeredActions.push('dummy_audit');
    this.triggeredActions.push('warning_letter');
  }

  // Condition based triggers
  if (this.overallScore < 55) {
    this.triggeredActions.push('basic_training');
    this.triggeredActions.push('audit_call');
    this.triggeredActions.push('cross_check_3_months');
    this.triggeredActions.push('dummy_audit');
  }

  if (this.majorNegativity.percentage > 0 && this.negativity.percentage < 25) {
    this.triggeredActions.push('negativity_training');
    this.triggeredActions.push('audit_call');
    this.triggeredActions.push('cross_check_3_months');
  }

  if (this.quality.percentage > 1) {
    this.triggeredActions.push('dos_donts_training');
    this.triggeredActions.push('audit_call');
    this.triggeredActions.push('cross_check_3_months');
    this.triggeredActions.push('rca_complaints');
  }

  if (this.appUsage.percentage < 80) {
    this.triggeredActions.push('app_usage_training');
  }

  if (this.insufficiency.percentage > 2) {
    this.triggeredActions.push('cross_verify_insuff');
  }

  // Remove duplicates from triggered actions
  this.triggeredActions = [...new Set(this.triggeredActions)];

  next();
});

// Static method to get user's latest KPI score
kpiScoreSchema.statics.getLatestForUser = function (userId) {
  return this.findOne({ userId, isActive: true })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email employeeId')
    .populate('submittedBy', 'name email');
};

// Static method to get KPI trends for a user
kpiScoreSchema.statics.getTrends = function (userId, limit = 6) {
  return this.find({ userId, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('overallScore rating period createdAt');
};

// Static method to get average KPI score for all users
kpiScoreSchema.statics.getOverallAverage = function () {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$userId',
        latestScore: { $last: '$overallScore' },
        latestRating: { $last: '$rating' }
      }
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$latestScore' },
        totalUsers: { $sum: 1 },
        ratingDistribution: {
          $push: '$latestRating'
        }
      }
    }
  ]);
};

// Instance method to check if action is required
kpiScoreSchema.methods.requiresAction = function () {
  return this.triggeredActions.length > 0;
};

// Instance method to get action priority
kpiScoreSchema.methods.getActionPriority = function () {
  if (this.triggeredActions.includes('audit')) return 'high';
  if (this.triggeredActions.includes('training')) return 'medium';
  if (this.triggeredActions.includes('recognition')) return 'positive';
  return 'low';
};

// Static method to get KPI scores pending automation
kpiScoreSchema.statics.getPendingAutomation = function () {
  return this.find({
    automationStatus: 'pending',
    isActive: true
  })
    .populate('userId', 'name email employeeId')
    .populate('submittedBy', 'name email')
    .sort({ createdAt: 1 });
};

// Static method to get KPI scores by automation status
kpiScoreSchema.statics.getByAutomationStatus = function (status) {
  return this.find({
    automationStatus: status,
    isActive: true
  })
    .populate('userId', 'name email employeeId')
    .populate('submittedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get KPI automation statistics
kpiScoreSchema.statics.getAutomationStats = function () {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$automationStatus',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Instance method to mark as processing
kpiScoreSchema.methods.markAsProcessing = function () {
  this.automationStatus = 'processing';
  this.processedAt = new Date();
  return this.save();
};

// Instance method to mark as completed
kpiScoreSchema.methods.markAsCompleted = function () {
  this.automationStatus = 'completed';
  this.processedAt = new Date();
  return this.save();
};

// Instance method to mark as failed
kpiScoreSchema.methods.markAsFailed = function () {
  this.automationStatus = 'failed';
  this.processedAt = new Date();
  return this.save();
};

// Instance method to add training assignment
kpiScoreSchema.methods.addTrainingAssignment = function (assignmentId) {
  if (!this.trainingAssignments.includes(assignmentId)) {
    this.trainingAssignments.push(assignmentId);
  }
  return this.save();
};

// Instance method to add email log
kpiScoreSchema.methods.addEmailLog = function (emailLogId) {
  if (!this.emailLogs.includes(emailLogId)) {
    this.emailLogs.push(emailLogId);
  }
  return this.save();
};

// Instance method to add audit schedule
kpiScoreSchema.methods.addAuditSchedule = function (auditScheduleId) {
  if (!this.auditSchedules.includes(auditScheduleId)) {
    this.auditSchedules.push(auditScheduleId);
  }
  return this.save();
};

module.exports = mongoose.model('KPIScore', kpiScoreSchema);
