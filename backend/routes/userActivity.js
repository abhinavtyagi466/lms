const express = require('express');
const UserActivity = require('../models/UserActivity');
const UserSession = require('../models/UserSession');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUserId, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// ========================================
// USER ACTIVITY ROUTES
// ========================================

// @route   GET /api/user-activity/summary/:userId
// @desc    Get user activity summary
// @access  Private
router.get('/summary/:userId', authenticateToken, validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own activity data'
      });
    }

    const activitySummary = await UserActivity.getUserActivitySummary(userId, parseInt(days));
    
    // Get additional metrics
    const totalActivities = await UserActivity.countDocuments({ userId });
    const suspiciousActivities = await UserActivity.countDocuments({ 
      userId, 
      $or: [{ isSuspicious: true }, { riskScore: { $gte: 70 } }] 
    });
    
    const recentActivities = await UserActivity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('activityType description createdAt success isSuspicious riskScore');

    res.json({
      success: true,
      data: {
        summary: activitySummary,
        totalActivities,
        suspiciousActivities,
        recentActivities,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Error fetching user activity summary:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch activity summary'
    });
  }
});

// @route   GET /api/user-activity/login-attempts/:userId
// @desc    Get user login attempts
// @access  Private
router.get('/login-attempts/:userId', authenticateToken, validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own login data'
      });
    }

    const loginAttempts = await UserActivity.getLoginAttempts(userId, parseInt(days));
    
    // Calculate login statistics
    const totalAttempts = loginAttempts.length;
    const successfulLogins = loginAttempts.filter(attempt => attempt.success).length;
    const failedLogins = totalAttempts - successfulLogins;
    const successRate = totalAttempts > 0 ? (successfulLogins / totalAttempts) * 100 : 0;
    
    // Get unique IPs and devices
    const uniqueIPs = [...new Set(loginAttempts.map(attempt => attempt.ipAddress))];
    const uniqueDevices = [...new Set(loginAttempts.map(attempt => attempt.deviceInfo?.type))];

    res.json({
      success: true,
      data: {
        attempts: loginAttempts,
        statistics: {
          totalAttempts,
          successfulLogins,
          failedLogins,
          successRate: Math.round(successRate),
          uniqueIPs: uniqueIPs.length,
          uniqueDevices: uniqueDevices.length
        },
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Error fetching login attempts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch login attempts'
    });
  }
});

// @route   GET /api/user-activity/sessions/:userId
// @desc    Get user session data
// @access  Private
router.get('/sessions/:userId', authenticateToken, validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own session data'
      });
    }

    const sessionSummary = await UserSession.getUserSessionSummary(userId, parseInt(days));
    const recentSessions = await UserSession.getRecentSessions(userId, 10);
    const devicePatterns = await UserSession.getDeviceUsagePatterns(userId, parseInt(days));
    const locationPatterns = await UserSession.getLocationPatterns(userId, parseInt(days));

    res.json({
      success: true,
      data: {
        summary: sessionSummary[0] || {
          totalSessions: 0,
          totalDuration: 0,
          avgDuration: 0,
          totalPageViews: 0,
          totalActions: 0,
          suspiciousSessions: 0,
          uniqueDevices: [],
          uniqueLocations: [],
          lastSession: null
        },
        recentSessions,
        devicePatterns,
        locationPatterns,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Error fetching session data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch session data'
    });
  }
});

// @route   GET /api/user-activity/suspicious/:userId
// @desc    Get suspicious activities
// @access  Private
router.get('/suspicious/:userId', authenticateToken, validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own activity data'
      });
    }

    const suspiciousActivities = await UserActivity.getSuspiciousActivities(userId, parseInt(days));
    
    // Calculate risk metrics
    const totalSuspicious = suspiciousActivities.length;
    const highRiskActivities = suspiciousActivities.filter(activity => activity.riskScore >= 80).length;
    const criticalActivities = suspiciousActivities.filter(activity => activity.severity === 'critical').length;

    res.json({
      success: true,
      data: {
        activities: suspiciousActivities,
        riskMetrics: {
          totalSuspicious,
          highRiskActivities,
          criticalActivities,
          riskLevel: highRiskActivities > 5 ? 'high' : highRiskActivities > 2 ? 'medium' : 'low'
        },
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Error fetching suspicious activities:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch suspicious activities'
    });
  }
});

// @route   GET /api/user-activity/recent/:userId
// @desc    Get recent user activities
// @access  Private
router.get('/recent/:userId', authenticateToken, validateUserId, validatePagination, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own activity data'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [activities, total] = await Promise.all([
      UserActivity.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('activityType description createdAt success isSuspicious riskScore metadata'),
      UserActivity.countDocuments({ userId })
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch recent activities'
    });
  }
});

// ========================================
// ADMIN ROUTES
// ========================================

// @route   GET /api/user-activity/admin/analytics
// @desc    Get system-wide activity analytics (Admin only)
// @access  Private (Admin only)
router.get('/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get system-wide statistics
    const [
      totalActivities,
      totalSessions,
      suspiciousActivities,
      failedLogins,
      activeUsers,
      deviceStats,
      locationStats
    ] = await Promise.all([
      UserActivity.countDocuments({ createdAt: { $gte: startDate } }),
      UserSession.countDocuments({ startTime: { $gte: startDate } }),
      UserActivity.countDocuments({ 
        createdAt: { $gte: startDate },
        $or: [{ isSuspicious: true }, { riskScore: { $gte: 70 } }]
      }),
      UserActivity.countDocuments({ 
        createdAt: { $gte: startDate },
        activityType: 'login_failed'
      }),
      UserSession.distinct('userId', { 
        startTime: { $gte: startDate },
        isActive: true 
      }),
      UserActivity.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$deviceInfo.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      UserActivity.aggregate([
        { $match: { 
          createdAt: { $gte: startDate },
          'location.city': { $exists: true, $ne: null }
        }},
        { $group: { _id: '$location.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalActivities,
          totalSessions,
          suspiciousActivities,
          failedLogins,
          activeUsers: activeUsers.length,
          period: `${days} days`
        },
        deviceStats,
        locationStats
      }
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch analytics'
    });
  }
});

// @route   POST /api/user-activity/track
// @desc    Track user activity (Internal use)
// @access  Private
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const {
      activityType,
      description,
      metadata = {},
      duration = 0,
      success = true,
      errorMessage,
      relatedEntity
    } = req.body;

    if (!activityType || !description) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'activityType and description are required'
      });
    }

    const activity = new UserActivity({
      userId: req.user.id,
      activityType,
      description,
      metadata,
      duration,
      success,
      errorMessage,
      relatedEntity,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID
    });

    await activity.save();

    res.json({
      success: true,
      message: 'Activity tracked successfully',
      activityId: activity._id
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to track activity'
    });
  }
});

module.exports = router;
