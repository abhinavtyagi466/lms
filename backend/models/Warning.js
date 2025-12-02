const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    type: {
        type: String,
        default: 'warning',
        enum: ['warning', 'notice', 'alert']
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'dismissed'],
        default: 'active',
        index: true
    },
    issuedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Issued by is required']
    },
    resolvedAt: {
        type: Date
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for better query performance
warningSchema.index({ userId: 1, status: 1 });
warningSchema.index({ userId: 1, issuedAt: -1 });
warningSchema.index({ createdAt: -1 });

// Virtual for attachment URL (stored in metadata)
warningSchema.virtual('attachmentUrl').get(function () {
    return this.metadata?.attachmentUrl;
});

// Ensure virtuals are included in JSON
warningSchema.set('toJSON', { virtuals: true });
warningSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Warning', warningSchema);
