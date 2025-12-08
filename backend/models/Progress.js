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
  // For personalised modules - tracks progress separately per assignment
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingAssignment',
    default: null
  },
  // Flag to indicate if this is personalised module progress
  isPersonalised: {
    type: Boolean,
    default: false
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

// Compound index for unique user-video-assignment combination
// This allows separate progress tracking for personalised modules
progressSchema.index({ userId: 1, videoId: 1, assignmentId: 1 }, { unique: true });

// Index for efficient queries
progressSchema.index({ userId: 1 });
progressSchema.index({ videoId: 1 });
progressSchema.index({ assignmentId: 1 });

// Static method to get all progress for a user
progressSchema.statics.getUserProgress = function (userId) {
  return this.find({ userId }).sort({ lastUpdated: -1 });
};

// Static method to get progress for a specific video (optional assignmentId for personalised)
progressSchema.statics.getVideoProgress = function (userId, videoId, assignmentId = null) {
  const query = { userId, videoId };
  // For personalised modules, we need to match the assignmentId
  // For regular modules, assignmentId should be null
  query.assignmentId = assignmentId;
  return this.findOne(query);
};

// Static method to get regular module progress only (assignmentId is null)
progressSchema.statics.getRegularVideoProgress = function (userId, videoId) {
  return this.findOne({ userId, videoId, assignmentId: null });
};

// Static method to get personalised module progress (assignmentId must be provided)
progressSchema.statics.getPersonalisedVideoProgress = function (userId, videoId, assignmentId) {
  return this.findOne({ userId, videoId, assignmentId });
};

// Instance method to update progress
progressSchema.methods.updateProgress = function (currentTime, duration) {
  this.currentTime = currentTime;
  this.duration = duration;
  this.lastUpdated = new Date();
  return this.save();
};

module.exports = mongoose.model('Progress', progressSchema);
