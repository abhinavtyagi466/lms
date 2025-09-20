const express = require('express');
const LifecycleEvent = require('../models/LifecycleEvent');
const { authenticateToken, requireOwnershipOrAdmin, requireAdmin } = require('../middleware/auth');
const { validateUserId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/lifecycle/:userId
// @desc    Get lifecycle events for a user
// @access  Private (user can access own lifecycle, admin can access any)
router.get('/:userId', authenticateToken, validateUserId, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { startDate, endDate, limit = 50 } = req.query;

    let events;
    if (startDate || endDate) {
      events = await LifecycleEvent.getTimeline(userId, startDate, endDate);
    } else {
      events = await LifecycleEvent.getUserLifecycle(userId);
    }

    if (limit) {
      events = events.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      events
    });

  } catch (error) {
    console.error('Get lifecycle events error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching lifecycle events'
    });
  }
});

// @route   GET /api/lifecycle/:userId/statistics
// @desc    Get lifecycle statistics for a user
// @access  Private
router.get('/:userId/statistics', authenticateToken, validateUserId, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;

    const stats = await LifecycleEvent.getStatistics(userId);

    res.json({
      success: true,
      statistics: stats[0] || {
        totalEvents: 0,
        positiveEvents: 0,
        negativeEvents: 0,
        milestones: 0,
        typeDistribution: [],
        latestEvent: null,
        firstEvent: null
      }
    });

  } catch (error) {
    console.error('Get lifecycle statistics error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching lifecycle statistics'
    });
  }
});

// @route   GET /api/lifecycle/recent
// @desc    Get recent activity for admin dashboard
// @access  Private (Admin only)
router.get('/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent lifecycle events from all users
    const recentEvents = await LifecycleEvent.find()
      .populate('userId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      events: recentEvents
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching recent activity'
    });
  }
});

// @route   GET /api/lifecycle/system
// @desc    Get system-wide activity for admin dashboard
// @access  Private (Admin only)
router.get('/system', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query;

    let dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let query = {};
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }

    const systemEvents = await LifecycleEvent.find(query)
      .populate('userId', 'name email department')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      events: systemEvents
    });

  } catch (error) {
    console.error('Get system activity error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching system activity'
    });
  }
});

module.exports = router;