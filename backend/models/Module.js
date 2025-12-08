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

// Helper function to extract video ID from YouTube URL or return as-is if already an ID
const extractVideoId = (ytVideoId) => {
  if (!ytVideoId) return null;

  const input = ytVideoId.trim();

  // If it's already an 11-character video ID, return directly
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Try to extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/i,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})(?:&|$)/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Last resort: find any 11-character alphanumeric sequence
  const lastResort = input.match(/([a-zA-Z0-9_-]{11})/);
  if (lastResort && lastResort[1]) {
    return lastResort[1];
  }

  return input; // Return original if nothing matches
};

// Virtual for YouTube embed URL
moduleSchema.virtual('embedUrl').get(function () {
  const videoId = extractVideoId(this.ytVideoId);
  return `https://www.youtube.com/embed/${videoId}`;
});

// Virtual for YouTube thumbnail
moduleSchema.virtual('thumbnailUrl').get(function () {
  const videoId = extractVideoId(this.ytVideoId);
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
});

// Also add a method to get the clean video ID
moduleSchema.methods.getCleanVideoId = function () {
  return extractVideoId(this.ytVideoId);
};

// Set virtuals when converting to JSON
moduleSchema.set('toJSON', { virtuals: true });
moduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Module', moduleSchema);