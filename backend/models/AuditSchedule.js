const mongoose = require('mongoose');

const auditScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  auditType: {
    type: String,
    required: [true, 'Audit type is required'],
    enum: {
      values: ['audit_call', 'cross_check', 'dummy_audit'],
      message: 'Audit type must be one of: audit_call, cross_check, dummy_audit'
    },
    index: true
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
    index: true
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['scheduled', 'in_progress', 'completed'],
      message: 'Status must be one of: scheduled, in_progress, completed'
    },
    default: 'scheduled',
    index: true
  },
  kpiTriggerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KPIScore'
  },
  completedDate: {
    type: Date,
    index: true
  },
  findings: {
    type: String,
    trim: true,
    maxlength: [2000, 'Findings cannot be more than 2000 characters']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledBy: {
    type: String,
    enum: {
      values: ['manual', 'system', 'kpi_trigger'],
      message: 'Scheduled by must be one of: manual, system, kpi_trigger'
    },
    default: 'manual',
    index: true
  },
  scheduledAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot be more than 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Priority must be one of: low, medium, high, critical'
    },
    default: 'medium',
    index: true
  },
  auditScope: {
    type: String,
    trim: true,
    maxlength: [500, 'Audit scope cannot be more than 500 characters']
  },
  auditMethod: {
    type: String,
    trim: true,
    maxlength: [500, 'Audit method cannot be more than 500 characters']
  },
  documents: [{
    name: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  recommendations: {
    type: String,
    trim: true,
    maxlength: [1000, 'Recommendations cannot be more than 1000 characters']
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  followUpNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Follow-up notes cannot be more than 500 characters']
  },
  riskLevel: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Risk level must be one of: low, medium, high, critical'
    },
    default: 'medium'
  },
  complianceStatus: {
    type: String,
    enum: {
      values: ['compliant', 'non_compliant', 'partially_compliant', 'not_assessed'],
      message: 'Compliance status must be one of: compliant, non_compliant, partially_compliant, not_assessed'
    },
    default: 'not_assessed'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
auditScheduleSchema.index({ userId: 1, status: 1 });
auditScheduleSchema.index({ auditType: 1, status: 1 });
auditScheduleSchema.index({ scheduledDate: 1, status: 1 });
auditScheduleSchema.index({ kpiTriggerId: 1 });
auditScheduleSchema.index({ assignedTo: 1, status: 1 });
auditScheduleSchema.index({ priority: 1, status: 1 });
auditScheduleSchema.index({ createdAt: -1 });

// Pre-save middleware to update status based on scheduled date
auditScheduleSchema.pre('save', function(next) {
  // If audit is scheduled for past and status is scheduled, mark as overdue
  if (this.status === 'scheduled' && this.scheduledDate < new Date()) {
    // Keep as scheduled but could add overdue logic here if needed
  }
  next();
});

// Static method to get scheduled audits
auditScheduleSchema.statics.getScheduledAudits = function(filters = {}) {
  const query = { 
    status: 'scheduled',
    isActive: true,
    ...filters
  };
  
  return this.find(query)
    .populate('userId', 'name email employeeId')
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .populate('kpiTriggerId', 'overallScore rating period')
    .sort({ scheduledDate: 1 });
};

// Static method to get overdue audits
auditScheduleSchema.statics.getOverdueAudits = function(filters = {}) {
  const query = { 
    status: 'scheduled',
    scheduledDate: { $lt: new Date() },
    isActive: true,
    ...filters
  };
  
  return this.find(query)
    .populate('userId', 'name email employeeId')
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .populate('kpiTriggerId', 'overallScore rating period')
    .sort({ scheduledDate: 1 });
};

// Static method to get user's audit history
auditScheduleSchema.statics.getUserAuditHistory = function(userId, filters = {}) {
  const query = { 
    userId,
    isActive: true,
    ...filters
  };
  
  return this.find(query)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .populate('kpiTriggerId', 'overallScore rating period')
    .sort({ createdAt: -1 });
};

// Static method to get audit statistics
auditScheduleSchema.statics.getAuditStats = function(filters = {}) {
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

// Static method to get audit type distribution
auditScheduleSchema.statics.getAuditTypeDistribution = function(filters = {}) {
  const query = { 
    isActive: true,
    ...filters
  };
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$auditType',
        count: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get audits by priority
auditScheduleSchema.statics.getAuditsByPriority = function(priority, filters = {}) {
  const query = { 
    priority,
    isActive: true,
    ...filters
  };
  
  return this.find(query)
    .populate('userId', 'name email employeeId')
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .populate('kpiTriggerId', 'overallScore rating period')
    .sort({ scheduledDate: 1 });
};

// Static method to get upcoming audits
auditScheduleSchema.statics.getUpcomingAudits = function(days = 7, filters = {}) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  const query = { 
    status: 'scheduled',
    scheduledDate: { 
      $gte: new Date(),
      $lte: futureDate
    },
    isActive: true,
    ...filters
  };
  
  return this.find(query)
    .populate('userId', 'name email employeeId')
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .populate('kpiTriggerId', 'overallScore rating period')
    .sort({ scheduledDate: 1 });
};

// Instance method to mark as in progress
auditScheduleSchema.methods.markInProgress = function(assignedTo = null) {
  this.status = 'in_progress';
  if (assignedTo) this.assignedTo = assignedTo;
  return this.save();
};

// Instance method to mark as completed
auditScheduleSchema.methods.markCompleted = function(findings, recommendations = null) {
  this.status = 'completed';
  this.completedDate = new Date();
  this.findings = findings;
  if (recommendations) this.recommendations = recommendations;
  return this.save();
};

// Instance method to check if overdue
auditScheduleSchema.methods.isOverdue = function() {
  return this.status === 'scheduled' && this.scheduledDate < new Date();
};

// Instance method to get days until scheduled
auditScheduleSchema.methods.getDaysUntilScheduled = function() {
  const now = new Date();
  const diffTime = this.scheduledDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Instance method to add document
auditScheduleSchema.methods.addDocument = function(documentData) {
  this.documents.push({
    name: documentData.name,
    path: documentData.path,
    uploadedAt: new Date(),
    uploadedBy: documentData.uploadedBy
  });
  return this.save();
};

// Instance method to set follow-up
auditScheduleSchema.methods.setFollowUp = function(followUpDate, notes = null) {
  this.followUpRequired = true;
  this.followUpDate = followUpDate;
  if (notes) this.followUpNotes = notes;
  return this.save();
};

module.exports = mongoose.model('AuditSchedule', auditScheduleSchema);
