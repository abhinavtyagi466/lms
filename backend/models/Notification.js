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
    enum: ['info', 'warning', 'success', 'error', 'certificate'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
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

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
