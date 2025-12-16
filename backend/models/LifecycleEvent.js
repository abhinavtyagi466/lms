const mongoose = require('mongoose');
const path = require('path');

const lifecycleEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'joined',           // When FE joins
      'training',         // Training assignments/completions
      'audit',           // Audit events
      'warning',         // Warning letters
      'achievement',     // Awards/recognitions
      'exit',            // When FE leaves
      'left',            // Alternative for exit (when user is marked inactive)
      'reactivation',    // When user is reactivated after being inactive
      'other'            // Other events
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'milestone',    // Important career events
      'positive',     // Achievements, awards
      'negative',     // Warnings, penalties
      'neutral'       // Regular events
    ]
  },
  attachments: [{
    type: {
      type: String,
      required: true,
      enum: [
        'warning_letter',
        'appreciation_letter',
        'audit_report',
        'training_certificate',
        'other'
      ]
    },
    path: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
lifecycleEventSchema.index({ userId: 1, createdAt: -1 });
lifecycleEventSchema.index({ type: 1 });
lifecycleEventSchema.index({ category: 1 });
lifecycleEventSchema.index({ createdAt: -1 });

// Static method to create automated event
lifecycleEventSchema.statics.createAutoEvent = async function (eventData) {
  try {
    const event = await this.create({
      userId: eventData.userId,
      type: eventData.type,
      title: eventData.title,
      description: eventData.description,
      category: eventData.category,
      attachments: eventData.attachments || [],
      metadata: eventData.metadata || {},
      createdBy: eventData.createdBy
    });

    // If it's a warning, create warning letter
    if (event.type === 'warning') {
      const LifecycleService = require('../services/lifecycleService');
      await LifecycleService.createWarningRecord(event.userId, event.metadata);
    }

    return event;
  } catch (error) {
    console.error('Error creating lifecycle event:', error);
    throw error;
  }
};

// Static method to get user's career timeline
lifecycleEventSchema.statics.getCareerTimeline = async function (userId) {
  try {
    const timeline = await this.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email employeeId')
      .populate('createdBy', 'name email');

    // Group events by year and month
    const groupedTimeline = timeline.reduce((acc, event) => {
      const date = new Date(event.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth();

      if (!acc[year]) acc[year] = {};
      if (!acc[year][month]) acc[year][month] = [];

      acc[year][month].push(event);
      return acc;
    }, {});

    return groupedTimeline;
  } catch (error) {
    console.error('Error getting career timeline:', error);
    throw error;
  }
};

// Static method to get performance metrics
lifecycleEventSchema.statics.getPerformanceMetrics = async function (userId) {
  try {
    const events = await this.find({ userId, isActive: true });

    return {
      totalEvents: events.length,
      warnings: events.filter(e => e.type === 'warning').length,
      achievements: events.filter(e => e.type === 'achievement').length,
      audits: events.filter(e => e.type === 'audit').length,
      trainings: events.filter(e => e.type === 'training').length,
      milestones: events.filter(e => e.category === 'milestone').length,
      lastWarning: events.find(e => e.type === 'warning')?.createdAt,
      lastAchievement: events.find(e => e.type === 'achievement')?.createdAt,
      careerStart: events.find(e => e.type === 'joined')?.createdAt
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    throw error;
  }
};

// Instance method to get event details with attachments
lifecycleEventSchema.methods.getFullDetails = async function () {
  await this.populate('userId', 'name email employeeId');
  await this.populate('createdBy', 'name email');

  const details = this.toObject();

  // Add signed URLs for attachments if needed
  details.attachments = details.attachments.map(attachment => ({
    ...attachment,
    url: `/uploads/${path.basename(attachment.path)}`
  }));

  return details;
};

// Static method to get user lifecycle events
lifecycleEventSchema.statics.getUserLifecycle = async function (userId) {
  try {
    const events = await this.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email employeeId')
      .populate('createdBy', 'name email');

    return events;
  } catch (error) {
    console.error('Error getting user lifecycle:', error);
    throw error;
  }
};

// Static method to get timeline with date filters
lifecycleEventSchema.statics.getTimeline = async function (userId, startDate, endDate) {
  try {
    let query = { userId, isActive: true };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const events = await this.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email employeeId')
      .populate('createdBy', 'name email');

    return events;
  } catch (error) {
    console.error('Error getting timeline:', error);
    throw error;
  }
};

// Static method to get statistics
lifecycleEventSchema.statics.getStatistics = async function (userId) {
  try {
    const events = await this.find({ userId, isActive: true });

    const stats = {
      totalEvents: events.length,
      positiveEvents: events.filter(e => e.category === 'positive').length,
      negativeEvents: events.filter(e => e.category === 'negative').length,
      milestones: events.filter(e => e.category === 'milestone').length,
      typeDistribution: events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {}),
      latestEvent: events.length > 0 ? events[0] : null,
      firstEvent: events.length > 0 ? events[events.length - 1] : null
    };

    return [stats]; // Return as array to match route expectation
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
};

module.exports = mongoose.model('LifecycleEvent', lifecycleEventSchema);
