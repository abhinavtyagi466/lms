const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  activityType: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'login_failed',
      'password_change',
      'profile_update',
      'module_start',
      'module_complete',
      'quiz_start',
      'quiz_complete',
      'quiz_failed',
      'video_watch',
      'video_complete',
      'page_view',
      'search',
      'download',
      'upload',
      'warning_received',
      'achievement_earned',
      'kpi_update',
      'audit_scheduled',
      'training_assigned',
      'email_sent',
      'notification_read',
      'session_timeout',
      'device_change',
      'location_change',
      'other'
    ]
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  deviceInfo: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    os: String,
    browser: String,
    version: String
  },
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  sessionId: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    trim: true
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['module', 'quiz', 'video', 'document', 'notification', 'kpi', 'audit', 'training', 'other']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  tags: [{
    type: String,
    trim: true
  }],
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  isSuspicious: {
    type: Boolean,
    default: false
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });
userActivitySchema.index({ sessionId: 1 });
userActivitySchema.index({ ipAddress: 1 });
userActivitySchema.index({ isSuspicious: 1 });
userActivitySchema.index({ success: 1 });

// Static method to get user activity summary
userActivitySchema.statics.getUserActivitySummary = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$activityType',
        count: { $sum: 1 },
        lastActivity: { $max: '$createdAt' },
        successRate: {
          $avg: { $cond: ['$success', 1, 0] }
        },
        avgDuration: { $avg: '$duration' },
        suspiciousCount: {
          $sum: { $cond: ['$isSuspicious', 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get login attempts
userActivitySchema.statics.getLoginAttempts = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    activityType: { $in: ['login', 'login_failed'] },
    createdAt: { $gte: startDate }
  })
  .sort({ createdAt: -1 })
  .limit(50);
};

// Static method to get session data
userActivitySchema.statics.getSessionData = function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        sessionId: { $exists: true, $ne: null },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$sessionId',
        startTime: { $min: '$createdAt' },
        endTime: { $max: '$createdAt' },
        duration: { $sum: '$duration' },
        activityCount: { $sum: 1 },
        deviceInfo: { $first: '$deviceInfo' },
        ipAddress: { $first: '$ipAddress' },
        location: { $first: '$location' },
        lastActivity: { $max: '$createdAt' }
      }
    },
    {
      $sort: { startTime: -1 }
    }
  ]);
};

// Static method to get suspicious activities
userActivitySchema.statics.getSuspiciousActivities = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    $or: [
      { isSuspicious: true },
      { riskScore: { $gte: 70 } },
      { success: false }
    ],
    createdAt: { $gte: startDate }
  })
  .sort({ createdAt: -1 })
  .limit(20);
};

// Instance method to calculate risk score
userActivitySchema.methods.calculateRiskScore = function() {
  let riskScore = 0;
  
  // Failed login attempts
  if (this.activityType === 'login_failed') {
    riskScore += 20;
  }
  
  // Suspicious activity
  if (this.isSuspicious) {
    riskScore += 30;
  }
  
  // High severity activities
  if (this.severity === 'critical') {
    riskScore += 25;
  } else if (this.severity === 'high') {
    riskScore += 15;
  }
  
  // Device/location changes
  if (this.activityType === 'device_change' || this.activityType === 'location_change') {
    riskScore += 10;
  }
  
  // Session timeout
  if (this.activityType === 'session_timeout') {
    riskScore += 5;
  }
  
  this.riskScore = Math.min(riskScore, 100);
  return this.riskScore;
};

// Pre-save middleware to calculate risk score
userActivitySchema.pre('save', function(next) {
  if (this.isNew) {
    this.calculateRiskScore();
  }
  next();
});

module.exports = mongoose.model('UserActivity', userActivitySchema);
