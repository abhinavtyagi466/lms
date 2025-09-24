const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  userAgent: {
    type: String,
    required: true,
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
    version: String,
    screenResolution: String,
    language: String,
    timezone: String
  },
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    isp: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  activityCount: {
    type: Number,
    default: 0
  },
  pageViews: {
    type: Number,
    default: 0
  },
  actions: [{
    type: {
      type: String,
      required: true
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  loginAttempts: {
    type: Number,
    default: 1
  },
  isSuspicious: {
    type: Boolean,
    default: false
  },
  riskFactors: [{
    factor: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  terminatedReason: {
    type: String,
    enum: ['normal_logout', 'timeout', 'security_breach', 'admin_termination', 'device_change', 'location_change', 'suspicious_activity', 'other']
  },
  terminatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSessionSchema.index({ userId: 1, startTime: -1 });
userSessionSchema.index({ sessionId: 1 });
userSessionSchema.index({ ipAddress: 1 });
userSessionSchema.index({ isActive: 1 });
userSessionSchema.index({ isSuspicious: 1 });

// Virtual for session duration
userSessionSchema.virtual('sessionDuration').get(function() {
  if (this.endTime) {
    return Math.round((this.endTime - this.startTime) / 1000);
  }
  return Math.round((Date.now() - this.startTime) / 1000);
});

// Static method to get user session summary
userSessionSchema.statics.getUserSessionSummary = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        startTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' },
        totalPageViews: { $sum: '$pageViews' },
        totalActions: { $sum: '$activityCount' },
        suspiciousSessions: {
          $sum: { $cond: ['$isSuspicious', 1, 0] }
        },
        uniqueDevices: { $addToSet: '$deviceInfo.type' },
        uniqueLocations: { $addToSet: '$location.city' },
        lastSession: { $max: '$startTime' }
      }
    }
  ]);
};

// Static method to get recent sessions
userSessionSchema.statics.getRecentSessions = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ startTime: -1 })
    .limit(limit)
    .select('sessionId startTime endTime duration ipAddress deviceInfo location isActive lastActivity activityCount pageViews isSuspicious terminatedReason');
};

// Static method to get device usage patterns
userSessionSchema.statics.getDeviceUsagePatterns = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        startTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          deviceType: '$deviceInfo.type',
          os: '$deviceInfo.os',
          browser: '$deviceInfo.browser'
        },
        sessionCount: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' },
        lastUsed: { $max: '$startTime' }
      }
    },
    {
      $sort: { sessionCount: -1 }
    }
  ]);
};

// Static method to get location patterns
userSessionSchema.statics.getLocationPatterns = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        startTime: { $gte: startDate },
        'location.city': { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: {
          city: '$location.city',
          region: '$location.region',
          country: '$location.country'
        },
        sessionCount: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        lastUsed: { $max: '$startTime' }
      }
    },
    {
      $sort: { sessionCount: -1 }
    }
  ]);
};

// Instance method to add activity
userSessionSchema.methods.addActivity = function(activityType, description, metadata = {}) {
  this.actions.push({
    type: activityType,
    description,
    metadata,
    timestamp: new Date()
  });
  this.activityCount += 1;
  this.lastActivity = new Date();
  return this.save();
};

// Instance method to add page view
userSessionSchema.methods.addPageView = function(page, metadata = {}) {
  this.pageViews += 1;
  this.addActivity('page_view', `Viewed page: ${page}`, { page, ...metadata });
  return this.save();
};

// Instance method to terminate session
userSessionSchema.methods.terminate = function(reason = 'normal_logout', terminatedBy = null) {
  this.endTime = new Date();
  this.duration = Math.round((this.endTime - this.startTime) / 1000);
  this.isActive = false;
  this.terminatedReason = reason;
  if (terminatedBy) {
    this.terminatedBy = terminatedBy;
  }
  return this.save();
};

// Instance method to check for suspicious activity
userSessionSchema.methods.checkSuspiciousActivity = function() {
  let isSuspicious = false;
  const riskFactors = [];
  
  // Check for multiple failed login attempts
  if (this.loginAttempts > 3) {
    isSuspicious = true;
    riskFactors.push({
      factor: 'multiple_login_attempts',
      severity: 'high',
      description: `Multiple login attempts: ${this.loginAttempts}`
    });
  }
  
  // Check for unusual session duration
  const sessionDuration = this.sessionDuration;
  if (sessionDuration > 8 * 60 * 60) { // More than 8 hours
    isSuspicious = true;
    riskFactors.push({
      factor: 'unusual_session_duration',
      severity: 'medium',
      description: `Session duration: ${Math.round(sessionDuration / 3600)} hours`
    });
  }
  
  // Check for high activity count
  if (this.activityCount > 1000) {
    isSuspicious = true;
    riskFactors.push({
      factor: 'high_activity_count',
      severity: 'medium',
      description: `High activity count: ${this.activityCount}`
    });
  }
  
  this.isSuspicious = isSuspicious;
  this.riskFactors = riskFactors;
  
  return isSuspicious;
};

// Pre-save middleware to check for suspicious activity
userSessionSchema.pre('save', function(next) {
  if (this.isModified('activityCount') || this.isModified('loginAttempts')) {
    this.checkSuspiciousActivity();
  }
  next();
});

module.exports = mongoose.model('UserSession', userSessionSchema);
