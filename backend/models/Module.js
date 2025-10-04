const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    ytVideoId: { type: String, required: true, trim: true },
    ytThumbnail: { type: String, trim: true },
    ytDuration: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    estimatedDuration: { type: Number, default: 0 }, // in minutes
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
    completionCount: { type: Number, default: 0 },
    // Personalised module fields
    isPersonalised: { type: Boolean, default: false, index: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Specific users this module is assigned to
    personalisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who created this personalised module
    personalisedAt: { type: Date, default: null },
    personalisedReason: { type: String, trim: true }, // Reason for personalisation
    personalisedPriority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Indexes for better performance
moduleSchema.index({ status: 1, createdAt: -1 });
moduleSchema.index({ ytVideoId: 1 });
moduleSchema.index({ tags: 1 });
moduleSchema.index({ isPersonalised: 1, assignedTo: 1 });
moduleSchema.index({ assignedTo: 1, status: 1 });

// Virtual for YouTube embed URL
moduleSchema.virtual('embedUrl').get(function() {
  return `https://www.youtube.com/embed/${this.ytVideoId}`;
});

// Virtual for YouTube thumbnail
moduleSchema.virtual('thumbnailUrl').get(function() {
  return `https://img.youtube.com/vi/${this.ytVideoId}/maxresdefault.jpg`;
});

// Set virtuals when converting to JSON
moduleSchema.set('toJSON', { virtuals: true });
moduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Module', moduleSchema);