const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'certificate', 'training', 'audit', 'kpi', 'performance'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  read: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Enhanced metadata for different notification types
  metadata: {
    kpiScore: Number,
    rating: String,
    period: String,
    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingAssignment'
    },
    auditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuditSchedule'
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module'
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    emailLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailLog'
    },
    actionRequired: Boolean,
    actionUrl: String,
    expiresAt: Date
  },
  // Action tracking
  actionTaken: {
    type: Boolean,
    default: false
  },
  actionTakenAt: {
    type: Date
  },
  // Acknowledgment
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Static method to get user's notifications
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const query = { userId };
  if (options.unreadOnly) {
    query.read = false;
  }
  
  return this.find(query)
    .sort({ sentAt: -1 })
    .limit(options.limit || 50)
    .populate('sentBy', 'name');
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(userId, notificationIds) {
  return this.updateMany(
    { 
      userId,
      _id: { $in: notificationIds }
    },
    { $set: { read: true } }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, read: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );
};

// Static method to acknowledge notification
notificationSchema.statics.acknowledgeNotification = async function(userId, notificationId) {
  return this.findOneAndUpdate(
    { _id: notificationId, userId },
    { 
      $set: { 
        acknowledged: true, 
        acknowledgedAt: new Date(),
        read: true 
      } 
    },
    { new: true }
  );
};

// Static method to create notification with metadata
notificationSchema.statics.createNotification = async function(data) {
  return this.create({
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type || 'info',
    priority: data.priority || 'normal',
    sentBy: data.sentBy,
    metadata: data.metadata || {}
  });
};

// Static method to get notifications by type
notificationSchema.statics.getByType = async function(userId, type, options = {}) {
  return this.find({ userId, type })
    .sort({ sentAt: -1 })
    .limit(options.limit || 20)
    .populate('sentBy', 'name');
};

// Instance method to mark action taken
notificationSchema.methods.markActionTaken = async function() {
  this.actionTaken = true;
  this.actionTakenAt = new Date();
  this.read = true;
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
