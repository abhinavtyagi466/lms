const mongoose = require('mongoose');

const trainingAssignmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  trainingType: {
    type: String,
    required: [true, 'Training type is required'],
    enum: {
      values: ['basic', 'negativity_handling', 'dos_donts', 'app_usage'],
      message: 'Training type must be one of: basic, negativity_handling, dos_donts, app_usage'
    },
    index: true
  },
  assignedBy: {
    type: String,
    required: [true, 'Assigned by is required'],
    enum: {
      values: ['kpi_trigger', 'manual', 'scheduled', 'system'],
      message: 'Assigned by must be one of: kpi_trigger, manual, scheduled, system'
    },
    default: 'kpi_trigger',
    index: true
  },
  assignedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    index: true
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['assigned', 'in_progress', 'completed', 'overdue'],
      message: 'Status must be one of: assigned, in_progress, completed, overdue'
    },
    default: 'assigned',
    index: true
  },
  kpiTriggerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KPIScore'
  },
  completionDate: {
    type: Date,
    index: true
  },
  score: {
    type: Number,
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  assignedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  trainingModuleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
trainingAssignmentSchema.index({ userId: 1, status: 1 });
trainingAssignmentSchema.index({ trainingType: 1, status: 1 });
trainingAssignmentSchema.index({ dueDate: 1, status: 1 });
trainingAssignmentSchema.index({ kpiTriggerId: 1 });
trainingAssignmentSchema.index({ createdAt: -1 });

// Pre-save middleware to update status based on due date
trainingAssignmentSchema.pre('save', function(next) {
  // If status is assigned and due date has passed, mark as overdue
  if (this.status === 'assigned' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  next();
});

// Static method to get pending training assignments
trainingAssignmentSchema.statics.getPendingAssignments = function(filters = {}) {
  const query = { 
    status: { $in: ['assigned', 'overdue'] },
    isActive: true,
    ...filters
  };
  
  return this.find(query)
    .populate('userId', 'name email employeeId')
    .populate('kpiTriggerId', 'overallScore rating period')
    .populate('assignedByUser', 'name email')
    .sort({ dueDate: 1 });
};

// Static method to get overdue training assignments
trainingAssignmentSchema.statics.getOverdueAssignments = function(filters = {}) {
  const query = { 
    status: 'overdue',
    isActive: true,
    ...filters
  };
  
  return this.find(query)
    .populate('userId', 'name email employeeId')
    .populate('kpiTriggerId', 'overallScore rating period')
    .populate('assignedByUser', 'name email')
    .sort({ dueDate: 1 });
};

// Static method to get user's training assignments
trainingAssignmentSchema.statics.getUserAssignments = function(userId, filters = {}) {
  const query = { 
    userId,
    isActive: true,
    ...filters
  };
  
  return this.find(query)
    .populate('kpiTriggerId', 'overallScore rating period')
    .populate('assignedByUser', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get training statistics
trainingAssignmentSchema.statics.getTrainingStats = function(filters = {}) {
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

// Static method to get training type distribution
trainingAssignmentSchema.statics.getTrainingTypeDistribution = function(filters = {}) {
  const query = { 
    isActive: true,
    ...filters
  };
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$trainingType',
        count: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Instance method to mark as completed
trainingAssignmentSchema.methods.markCompleted = function(score = null, notes = null) {
  this.status = 'completed';
  this.completionDate = new Date();
  if (score !== null) this.score = score;
  if (notes) this.notes = notes;
  return this.save();
};

// Instance method to check if overdue
trainingAssignmentSchema.methods.isOverdue = function() {
  return this.status === 'assigned' && this.dueDate < new Date();
};

// Instance method to get days until due
trainingAssignmentSchema.methods.getDaysUntilDue = function() {
  const now = new Date();
  const diffTime = this.dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('TrainingAssignment', trainingAssignmentSchema);
