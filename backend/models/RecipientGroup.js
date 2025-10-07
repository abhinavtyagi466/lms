const mongoose = require('mongoose');

const recipientGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  recipients: [{
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['fe', 'coordinator', 'manager', 'hod', 'compliance', 'admin', 'other'],
      default: 'other'
    },
    department: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  criteria: {
    userTypes: [{
      type: String,
      enum: ['user', 'admin']
    }],
    departments: [String],
    roles: [String],
    kpiRanges: {
      min: Number,
      max: Number
    },
    trainingStatus: {
      type: String,
      enum: ['completed', 'in_progress', 'not_started', 'overdue']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
recipientGroupSchema.index({ name: 1 });
recipientGroupSchema.index({ 'recipients.email': 1 });
recipientGroupSchema.index({ isActive: 1 });

// Virtual for recipient count
recipientGroupSchema.virtual('recipientCount').get(function() {
  return this.recipients.filter(r => r.isActive).length;
});

// Method to add recipient
recipientGroupSchema.methods.addRecipient = function(recipientData) {
  const existingRecipient = this.recipients.find(r => r.email === recipientData.email);
  if (existingRecipient) {
    existingRecipient.isActive = true;
    Object.assign(existingRecipient, recipientData);
  } else {
    this.recipients.push(recipientData);
  }
  return this.save();
};

// Method to remove recipient
recipientGroupSchema.methods.removeRecipient = function(email) {
  const recipient = this.recipients.find(r => r.email === email);
  if (recipient) {
    recipient.isActive = false;
  }
  return this.save();
};

// Method to get active recipients
recipientGroupSchema.methods.getActiveRecipients = function() {
  return this.recipients.filter(r => r.isActive);
};

// Static method to find groups by criteria
recipientGroupSchema.statics.findByCriteria = function(criteria) {
  const query = { isActive: true };
  
  if (criteria.userTypes && criteria.userTypes.length > 0) {
    query['criteria.userTypes'] = { $in: criteria.userTypes };
  }
  
  if (criteria.departments && criteria.departments.length > 0) {
    query['criteria.departments'] = { $in: criteria.departments };
  }
  
  if (criteria.roles && criteria.roles.length > 0) {
    query['criteria.roles'] = { $in: criteria.roles };
  }
  
  return this.find(query);
};

// Pre-save middleware to update lastUsed
recipientGroupSchema.pre('save', function(next) {
  if (this.isModified('usageCount')) {
    this.lastUsed = new Date();
  }
  next();
});

module.exports = mongoose.model('RecipientGroup', recipientGroupSchema);
