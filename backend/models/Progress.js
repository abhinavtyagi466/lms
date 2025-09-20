const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: String,
    required: true
  },
  currentTime: {
    type: Number,
    default: 0,
    min: 0
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique user-video combination
progressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

// Index for efficient queries
progressSchema.index({ userId: 1 });
progressSchema.index({ videoId: 1 });

// Static method to get all progress for a user
progressSchema.statics.getUserProgress = function(userId) {
  return this.find({ userId }).sort({ lastUpdated: -1 });
};

// Static method to get progress for a specific video
progressSchema.statics.getVideoProgress = function(userId, videoId) {
  return this.findOne({ userId, videoId });
};

// Instance method to update progress
progressSchema.methods.updateProgress = function(currentTime, duration) {
  this.currentTime = currentTime;
  this.duration = duration;
  this.lastUpdated = new Date();
  return this.save();
};

module.exports = mongoose.model('Progress', progressSchema);
