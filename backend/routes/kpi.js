const express = require('express');
const KPIScore = require('../models/KPIScore');
const User = require('../models/User');
const LifecycleEvent = require('../models/LifecycleEvent');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateKPIScore, validateUserId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/kpi/:userId
// @desc    Get KPI scores for a user
// @access  Private (user can access own KPI, admin can access any)
router.get('/:userId', authenticateToken, validateUserId, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check authorization
    if (req.user.userType !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only access your own KPI scores'
      });
    }

    const latestKPI = await KPIScore.getLatestForUser(userId);

    if (!latestKPI) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No KPI scores found for this user'
      });
    }

    res.json(latestKPI);

  } catch (error) {
    console.error('Get KPI score error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching KPI score'
    });
  }
});

// @route   GET /api/kpi/:userId/history
// @desc    Get KPI score history for a user
// @access  Private
router.get('/:userId/history', authenticateToken, validateUserId, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { limit = 6 } = req.query;

    // Check authorization
    if (req.user.userType !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only access your own KPI history'
      });
    }

    const kpiHistory = await KPIScore.getTrends(userId, parseInt(limit));

    res.json({
      success: true,
      history: kpiHistory
    });

  } catch (error) {
    console.error('Get KPI history error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching KPI history'
    });
  }
});

// @route   POST /api/kpi
// @desc    Submit KPI scores for a user
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, validateKPIScore, async (req, res) => {
  try {
    const { userId, tat, quality, appUsage, negativity = 0, period, comments } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Check if KPI already exists for this period
    const existingKPI = await KPIScore.findOne({ userId, period, isActive: true });
    if (existingKPI) {
      return res.status(409).json({
        error: 'KPI Exists',
        message: 'KPI score already exists for this period. Use PUT to update.'
      });
    }

    // Create KPI score (pre-save middleware will calculate overall score and rating)
    const kpiScore = new KPIScore({
      userId,
      tat,
      quality,
      appUsage,
      negativity,
      period,
      comments,
      submittedBy: req.user._id
    });

    await kpiScore.save();

    // Update user's KPI score
    user.kpiScore = kpiScore.overallScore;
    
    // Update user status based on KPI score
    if (kpiScore.overallScore < 50) {
      user.status = 'Audited';
    } else if (kpiScore.overallScore < 70) {
      user.status = 'Warning';
    } else {
      user.status = 'Active';
    }
    
    await user.save();

    // Create lifecycle events based on triggered actions
    if (kpiScore.triggeredActions.includes('audit')) {
      await LifecycleEvent.createAutoEvent({
        userId,
        type: 'audit',
        title: 'KPI Audit Triggered',
        description: `Audit triggered due to low KPI score: ${kpiScore.overallScore}%`,
        category: 'negative',
        metadata: {
          kpiScoreId: kpiScore._id,
          additionalData: { score: kpiScore.overallScore }
        },
        createdBy: req.user._id
      });
    }

    if (kpiScore.triggeredActions.includes('warning')) {
      await LifecycleEvent.createAutoEvent({
        userId,
        type: 'warning',
        title: 'Performance Warning',
        description: `Warning issued due to KPI score: ${kpiScore.overallScore}%`,
        category: 'negative',
        metadata: {
          kpiScoreId: kpiScore._id,
          additionalData: { score: kpiScore.overallScore }
        },
        createdBy: req.user._id
      });
    }

    if (kpiScore.triggeredActions.includes('recognition')) {
      await LifecycleEvent.createAutoEvent({
        userId,
        type: 'award',
        title: 'Excellence Recognition',
        description: `Recognized for excellent KPI score: ${kpiScore.overallScore}%`,
        category: 'positive',
        metadata: {
          kpiScoreId: kpiScore._id,
          additionalData: { score: kpiScore.overallScore }
        },
        createdBy: req.user._id
      });
    }

    const populatedKPI = await KPIScore.findById(kpiScore._id)
      .populate('userId', 'name email employeeId')
      .populate('submittedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'KPI score submitted successfully',
      calculatedScore: kpiScore.overallScore,
      rating: kpiScore.rating,
      triggeredActions: kpiScore.triggeredActions,
      kpiScore: populatedKPI
    });

  } catch (error) {
    console.error('Submit KPI score error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error submitting KPI score'
    });
  }
});

// @route   PUT /api/kpi/:id
// @desc    Update KPI score
// @access  Private (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const kpiId = req.params.id;
    const { tat, quality, appUsage, negativity, comments } = req.body;

    const kpiScore = await KPIScore.findById(kpiId);
    
    if (!kpiScore) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'KPI score not found'
      });
    }

    // Update KPI values
    if (tat !== undefined) kpiScore.tat = tat;
    if (quality !== undefined) kpiScore.quality = quality;
    if (appUsage !== undefined) kpiScore.appUsage = appUsage;
    if (negativity !== undefined) kpiScore.negativity = negativity;
    if (comments !== undefined) kpiScore.comments = comments;

    await kpiScore.save(); // Pre-save middleware will recalculate score and rating

    // Update user's KPI score
    const user = await User.findById(kpiScore.userId);
    if (user) {
      user.kpiScore = kpiScore.overallScore;
      
      // Update user status based on new KPI score
      if (kpiScore.overallScore < 50) {
        user.status = 'Audited';
      } else if (kpiScore.overallScore < 70) {
        user.status = 'Warning';
      } else {
        user.status = 'Active';
      }
      
      await user.save();
    }

    const populatedKPI = await KPIScore.findById(kpiScore._id)
      .populate('userId', 'name email employeeId')
      .populate('submittedBy', 'name email');

    res.json({
      success: true,
      message: 'KPI score updated successfully',
      kpiScore: populatedKPI
    });

  } catch (error) {
    console.error('Update KPI score error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating KPI score'
    });
  }
});

// @route   GET /api/kpi/overview/stats
// @desc    Get overall KPI statistics
// @access  Private (Admin only)
router.get('/overview/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await KPIScore.getOverallAverage();

    // Get distribution by rating
    const ratingDistribution = await KPIScore.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$userId',
          latestRating: { $last: '$rating' }
        }
      },
      {
        $group: {
          _id: '$latestRating',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get users requiring action
    const usersRequiringAction = await KPIScore.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$userId',
          latestScore: { $last: '$overallScore' },
          triggeredActions: { $last: '$triggeredActions' }
        }
      },
      {
        $match: {
          $or: [
            { latestScore: { $lt: 70 } },
            { triggeredActions: { $ne: [] } }
          ]
        }
      },
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

    res.json({
      success: true,
      statistics: {
        overall: stats[0] || { averageScore: 0, totalUsers: 0 },
        ratingDistribution,
        usersRequiringAction
      }
    });

  } catch (error) {
    console.error('Get KPI stats error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching KPI statistics'
    });
  }
});

// @route   GET /api/kpi/alerts/low-performers
// @desc    Get users with low KPI scores
// @access  Private (Admin only)
router.get('/alerts/low-performers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { threshold = 70 } = req.query;

    const lowPerformers = await KPIScore.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$userId',
          latestScore: { $last: '$overallScore' },
          latestRating: { $last: '$rating' },
          latestDate: { $last: '$createdAt' },
          triggeredActions: { $last: '$triggeredActions' }
        }
      },
      {
        $match: {
          latestScore: { $lt: parseInt(threshold) }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $sort: { latestScore: 1 }
      }
    ]);

    res.json({
      success: true,
      lowPerformers,
      count: lowPerformers.length
    });

  } catch (error) {
    console.error('Get low performers error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching low performers'
    });
  }
});

// @route   DELETE /api/kpi/:id
// @desc    Deactivate KPI score (soft delete)
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const kpiId = req.params.id;

    const kpiScore = await KPIScore.findById(kpiId);
    
    if (!kpiScore) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'KPI score not found'
      });
    }

    kpiScore.isActive = false;
    await kpiScore.save();

    res.json({
      success: true,
      message: 'KPI score deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate KPI score error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deactivating KPI score'
    });
  }
});

module.exports = router;