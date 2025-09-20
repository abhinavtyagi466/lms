const mongoose = require('mongoose');

const awardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: [true, 'Award type is required'],
    enum: [
      'Employee of the Month',
      'Top Performer',
      'Quality Excellence',
      'Innovation Award',
      'Leadership Award',
      'Team Player',
      'Customer Service Excellence',
      'Sales Achievement',
      'Training Excellence',
      'certificate',
      'Other'
    ]
  },
  title: {
    type: String,
    required: [true, 'Award title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  image: {
    type: String,
    trim: true
  },
  certificateUrl: {
    type: String,
    trim: true
  },
  awardedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  awardDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  value: {
    type: Number, // monetary value if applicable
    default: 0
  },
  criteria: {
    type: String,
    trim: true,
    maxlength: [500, 'Criteria cannot be more than 500 characters']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'presented', 'cancelled'],
    default: 'approved'
  },
  category: {
    type: String,
    enum: ['performance', 'behavior', 'achievement', 'milestone', 'other'],
    default: 'performance'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
awardSchema.index({ userId: 1 });
awardSchema.index({ awardedBy: 1 });
awardSchema.index({ type: 1 });
awardSchema.index({ awardDate: -1 });
awardSchema.index({ status: 1 });
awardSchema.index({ category: 1 });

// Virtual for display name
awardSchema.virtual('displayTitle').get(function() {
  return this.title || this.type;
});

// Virtual for award year
awardSchema.virtual('awardYear').get(function() {
  return this.awardDate.getFullYear();
});

// Virtual for award month
awardSchema.virtual('awardMonth').get(function() {
  return this.awardDate.toLocaleDateString('en-US', { month: 'long' });
});

// Static method to get user's awards
awardSchema.statics.getUserAwards = function(userId) {
  return this.find({ userId, isPublic: true })
    .sort({ awardDate: -1 })
    .populate('awardedBy', 'name email')
    .populate('userId', 'name email employeeId');
};

// Static method to get recent awards
awardSchema.statics.getRecentAwards = function(limit = 10) {
  return this.find({ isPublic: true, status: 'approved' })
    .sort({ awardDate: -1 })
    .limit(limit)
    .populate('userId', 'name email employeeId')
    .populate('awardedBy', 'name email');
};

// Static method to get award statistics
awardSchema.statics.getStatistics = function() {
  return this.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: null,
        totalAwards: { $sum: 1 },
        thisMonth: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$awardDate', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                  { $lt: ['$awardDate', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)] }
                ]
              },
              1,
              0
            ]
          }
        },
        thisYear: {
          $sum: {
            $cond: [
              { $gte: ['$awardDate', new Date(new Date().getFullYear(), 0, 1)] },
              1,
              0
            ]
          }
        },
        typeDistribution: { $addToSet: '$type' }
      }
    }
  ]);
};

// Static method to get top recipients
awardSchema.statics.getTopRecipients = function(limit = 5) {
  return this.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: '$userId',
        awardCount: { $sum: 1 },
        latestAward: { $last: '$awardDate' },
        awards: { $push: { type: '$type', date: '$awardDate' } }
      }
    },
    { $sort: { awardCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' }
  ]);
};

// Instance method to mark as presented
awardSchema.methods.markAsPresented = function() {
  this.status = 'presented';
  return this.save();
};

module.exports = mongoose.model('Award', awardSchema);