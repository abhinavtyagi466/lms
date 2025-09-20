const mongoose = require('mongoose');

const auditRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: [true, 'Record type is required'],
    enum: ['warning', 'penalty', 'audit', 'performance_review', 'disciplinary', 'other']
  },
  title: {
    type: String,
    required: [true, 'Record title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [1000, 'Reason cannot be more than 1000 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'closed', 'cancelled'],
    default: 'pending'
  },
  document: {
    type: String, // file path
    trim: true
  },
  documentName: {
    type: String,
    trim: true
  },
  documentType: {
    type: String,
    trim: true
  },
  actionRequired: {
    type: String,
    trim: true,
    maxlength: [500, 'Action required cannot be more than 500 characters']
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalatedDate: {
    type: Date
  },
  relatedKPIScore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KPIScore'
  },
  outcome: {
    type: String,
    trim: true,
    maxlength: [1000, 'Outcome cannot be more than 1000 characters']
  },
  impactAssessment: {
    type: String,
    enum: ['none', 'minimal', 'moderate', 'significant', 'severe'],
    default: 'none'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditRecordSchema.index({ userId: 1 });
auditRecordSchema.index({ createdBy: 1 });
auditRecordSchema.index({ type: 1 });
auditRecordSchema.index({ status: 1 });
auditRecordSchema.index({ severity: 1 });
auditRecordSchema.index({ dueDate: 1 });
auditRecordSchema.index({ createdAt: -1 });

// Virtual for overdue status
auditRecordSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'completed' && this.status !== 'closed';
});

// Virtual for days until due
auditRecordSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const today = new Date();
  const diffTime = this.dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for record age
auditRecordSchema.virtual('ageInDays').get(function() {
  const today = new Date();
  const diffTime = today - this.createdAt;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to set default title
auditRecordSchema.pre('save', function(next) {
  if (!this.title) {
    this.title = `${this.type.charAt(0).toUpperCase() + this.type.slice(1)} Record`;
  }
  next();
});

// Static method to get user's records
auditRecordSchema.statics.getUserRecords = function(userId) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('escalatedTo', 'name email');
};

// Static method to get pending records
auditRecordSchema.statics.getPendingRecords = function() {
  return this.find({ status: { $in: ['pending', 'in_progress'] } })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email employeeId')
    .populate('createdBy', 'name email');
};

// Static method to get overdue records
auditRecordSchema.statics.getOverdueRecords = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'closed', 'cancelled'] }
  })
    .sort({ dueDate: 1 })
    .populate('userId', 'name email employeeId')
    .populate('createdBy', 'name email');
};

// Static method to get statistics
auditRecordSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        pendingRecords: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        completedRecords: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        overdueRecords: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ['$dueDate', new Date()] },
                  { $nin: ['$status', ['completed', 'closed', 'cancelled']] }
                ]
              },
              1,
              0
            ]
          }
        },
        typeDistribution: { $addToSet: '$type' },
        severityDistribution: { $addToSet: '$severity' }
      }
    }
  ]);
};

// Instance method to mark as completed
auditRecordSchema.methods.markCompleted = function(outcome) {
  this.status = 'completed';
  this.completedDate = new Date();
  if (outcome) this.outcome = outcome;
  return this.save();
};

// Instance method to escalate
auditRecordSchema.methods.escalate = function(escalatedTo) {
  this.escalated = true;
  this.escalatedTo = escalatedTo;
  this.escalatedDate = new Date();
  this.severity = this.severity === 'critical' ? 'critical' : 
                   this.severity === 'high' ? 'critical' : 'high';
  return this.save();
};

module.exports = mongoose.model('AuditRecord', auditRecordSchema);