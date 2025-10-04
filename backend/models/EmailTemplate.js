const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  
  type: {
    type: String,
    required: true,
    enum: [
      'kpi_outstanding',
      'kpi_excellent',
      'kpi_satisfactory',
      'kpi_need_improvement',
      'kpi_unsatisfactory',
      'training_assignment',
      'audit_schedule',
      'performance_warning',
      'welcome',
      'password_reset',
      'module_completion',
      'quiz_result',
      'certificate_issued',
      'custom'
    ]
  },
  
  category: {
    type: String,
    required: true,
    enum: ['kpi', 'training', 'audit', 'warning', 'general', 'achievement']
  },
  
  // Email Content
  subject: {
    type: String,
    required: true,
    trim: true
  },
  
  content: {
    type: String,
    required: true
  },
  
  // Template Variables
  variables: [{
    type: String,
    trim: true
  }],
  
  // Metadata
  description: {
    type: String,
    trim: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Recipient Configuration
  defaultRecipients: [{
    type: String,
    enum: ['FE', 'Coordinator', 'Manager', 'HOD', 'Compliance Team', 'Admin']
  }],
  
  // Usage Statistics
  usageCount: {
    type: Number,
    default: 0
  },
  
  lastUsed: {
    type: Date
  },
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
emailTemplateSchema.index({ type: 1, isActive: 1 });
emailTemplateSchema.index({ category: 1 });
emailTemplateSchema.index({ name: 'text', description: 'text' });

// Method to increment usage count
emailTemplateSchema.methods.recordUsage = async function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  await this.save();
};

// Static method to get template by type
emailTemplateSchema.statics.getByType = async function(type) {
  return await this.findOne({ type, isActive: true });
};

// Static method to render template with variables
emailTemplateSchema.statics.renderTemplate = function(template, variables) {
  let rendered = {
    subject: template.subject,
    content: template.content
  };
  
  // Replace all variables in subject and content
  Object.keys(variables).forEach(key => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    rendered.subject = rendered.subject.replace(placeholder, variables[key] || '');
    rendered.content = rendered.content.replace(placeholder, variables[key] || '');
  });
  
  return rendered;
};

// Validation: Check if all required variables are present
emailTemplateSchema.methods.validateVariables = function(providedVariables) {
  const missing = this.variables.filter(v => !(v in providedVariables));
  return {
    valid: missing.length === 0,
    missing: missing
  };
};

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

module.exports = EmailTemplate;

