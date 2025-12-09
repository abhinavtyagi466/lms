const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  recipientEmail: {
    type: String,
    required: [true, 'Recipient email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  recipientRole: {
    type: String,
    required: [true, 'Recipient role is required'],
    enum: {
      values: ['fe', 'user', 'coordinator', 'manager', 'hod', 'compliance', 'admin'],
      message: 'Recipient role must be one of: fe, user, coordinator, manager, hod, compliance, admin'
    },
    index: true
  },
  templateType: {
    type: String,
    required: [true, 'Template type is required'],
    enum: {
      values: ['training', 'audit', 'warning', 'kpi_score', 'performance_improvement', 'notification'],
      message: 'Template type must be one of: training, audit, warning, kpi_score, performance_improvement, notification'
    },
    index: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot be more than 200 characters']
  },
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['sent', 'failed', 'pending'],
      message: 'Status must be one of: sent, failed, pending'
    },
    default: 'pending',
    index: true
  },
  kpiTriggerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KPIScore'
  },
  errorMessage: {
    type: String,
    trim: true,
    maxlength: [500, 'Error message cannot be more than 500 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  trainingAssignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingAssignment',
    index: true
  },
  auditScheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuditSchedule',
    index: true
  },
  emailContent: {
    type: String,
    trim: true
  },
  retryCount: {
    type: Number,
    default: 0,
    min: [0, 'Retry count cannot be negative']
  },
  maxRetries: {
    type: Number,
    default: 3,
    min: [0, 'Max retries cannot be negative']
  },
  scheduledFor: {
    type: Date,
    index: true
  },
  deliveredAt: {
    type: Date
  },
  openedAt: {
    type: Date
  },
  clickedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
emailLogSchema.index({ recipientEmail: 1, status: 1 });
emailLogSchema.index({ templateType: 1, status: 1 });
emailLogSchema.index({ kpiTriggerId: 1 });
emailLogSchema.index({ userId: 1, status: 1 });
emailLogSchema.index({ sentAt: -1 });
emailLogSchema.index({ scheduledFor: 1, status: 1 });

// Pre-save middleware to update status based on scheduled time
emailLogSchema.pre('save', function (next) {
  // If email is scheduled for future and status is pending, don't change status
  if (this.scheduledFor && this.scheduledFor > new Date() && this.status === 'pending') {
    // Keep as pending
  } else if (this.scheduledFor && this.scheduledFor <= new Date() && this.status === 'pending') {
    // Mark as ready to send
    this.sentAt = new Date();
  }
  next();
});

// Static method to get failed emails
emailLogSchema.statics.getFailedEmails = function (filters = {}) {
  const query = {
    status: 'failed',
    isActive: true,
    ...filters
  };

  return this.find(query)
    .populate('userId', 'name email employeeId')
    .populate('kpiTriggerId', 'overallScore rating period')
    .sort({ sentAt: -1 });
};

// Static method to get pending emails
emailLogSchema.statics.getPendingEmails = function (filters = {}) {
  const query = {
    status: 'pending',
    isActive: true,
    ...filters
  };

  return this.find(query)
    .populate('userId', 'name email employeeId')
    .populate('kpiTriggerId', 'overallScore rating period')
    .sort({ scheduledFor: 1 });
};

// Static method to get email statistics
emailLogSchema.statics.getEmailStats = function (filters = {}) {
  const query = {
    isActive: true,
    ...filters
  };

  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get template type distribution
emailLogSchema.statics.getTemplateTypeDistribution = function (filters = {}) {
  const query = {
    isActive: true,
    ...filters
  };

  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$templateType',
        count: { $sum: 1 },
        sent: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get emails by recipient role
emailLogSchema.statics.getEmailsByRole = function (role, filters = {}) {
  const query = {
    recipientRole: role,
    isActive: true,
    ...filters
  };

  return this.find(query)
    .populate('userId', 'name email employeeId')
    .populate('kpiTriggerId', 'overallScore rating period')
    .sort({ sentAt: -1 });
};

// Static method to get emails for retry
emailLogSchema.statics.getEmailsForRetry = function () {
  const query = {
    status: 'failed',
    retryCount: { $lt: '$maxRetries' },
    isActive: true
  };

  return this.find(query)
    .populate('userId', 'name email employeeId')
    .sort({ sentAt: 1 });
};

// Instance method to mark as sent
emailLogSchema.methods.markAsSent = function () {
  this.status = 'sent';
  this.sentAt = new Date();
  this.deliveredAt = new Date();
  return this.save();
};

// Instance method to mark as failed
emailLogSchema.methods.markAsFailed = function (errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  return this.save();
};

// Instance method to increment retry count
emailLogSchema.methods.incrementRetry = function () {
  this.retryCount += 1;
  return this.save();
};

// Instance method to check if can retry
emailLogSchema.methods.canRetry = function () {
  return this.status === 'failed' && this.retryCount < this.maxRetries;
};

// Instance method to get delivery time
emailLogSchema.methods.getDeliveryTime = function () {
  if (this.deliveredAt && this.sentAt) {
    return this.deliveredAt - this.sentAt;
  }
  return null;
};

module.exports = mongoose.model('EmailLog', emailLogSchema);
