const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/notifications/user/:id
// @desc    Get user's notifications
// @access  Private (user can access own notifications, admin can access any)
router.get('/user/:id', authenticateToken, validateObjectId, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { unreadOnly, limit } = req.query;

    const notifications = await Notification.getUserNotifications(userId, {
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit) || 50
    });

    res.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching notifications'
    });
  }
});

// @route   POST /api/notifications/mark-read
// @desc    Mark notifications as read
// @access  Private
router.post('/mark-read', authenticateToken, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Notification IDs array is required'
      });
    }

    await Notification.markAsRead(req.user._id, notificationIds);

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error marking notifications as read'
    });
  }
});


// @route   POST /api/notifications/send
// @desc    Send notification to user(s)
// @access  Private (Admin only)
router.post('/send', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userIds, title, message, type = 'info', priority = 'normal' } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User IDs array is required'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title and message are required'
      });
    }

    // Verify users exist
    const users = await User.find({ _id: { $in: userIds }, isActive: true });
    
    if (users.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No active users found with provided IDs'
      });
    }

    // Store notifications in database
    const notifications = await Promise.all(users.map(user => 
      new Notification({
        userId: user._id,
        title,
        message,
        type,
        priority,
        sentBy: req.user._id
      }).save()
    ));

    // Create lifecycle events for notifications
    const LifecycleEvent = require('../models/LifecycleEvent');
    
    for (const user of users) {
      await LifecycleEvent.createAutoEvent({
        userId: user._id,
        type: 'other',
        title: `Notification: ${title}`,
        description: message,
        category: type === 'warning' ? 'negative' : 'neutral',
        createdBy: req.user._id
      });
    }

    res.json({
      success: true,
      message: `Notification sent to ${users.length} user(s)`,
      notifications,
      sentCount: users.length,
      failedCount: userIds.length - users.length
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error sending notification'
    });
  }
});

// @route   POST /api/notifications/send-to-user/:id
// @desc    Send notification to specific user
// @access  Private (Admin only)
router.post('/send-to-user/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;
    const { title, message, type = 'info', priority = 'normal' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title and message are required'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        error: 'Invalid Operation',
        message: 'Cannot send notification to inactive user'
      });
    }

    // Create lifecycle event for notification
    const LifecycleEvent = require('../models/LifecycleEvent');
    await LifecycleEvent.createAutoEvent({
      userId: user._id,
      type: 'other',
      title: `Notification: ${title}`,
      description: message,
      category: type === 'warning' ? 'negative' : 'neutral',
      createdBy: req.user._id
    });

    // Store notification in database
    const notification = await new Notification({
      userId: user._id,
      title,
      message,
      type,
      priority,
      sentBy: req.user._id
    }).save();

    res.json({
      success: true,
      message: 'Notification sent successfully',
      notification
    });

  } catch (error) {
    console.error('Send user notification error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error sending notification'
    });
  }
});

// @route   POST /api/notifications/bulk-notify
// @desc    Send bulk notifications based on criteria
// @access  Private (Admin only)
router.post('/bulk-notify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      criteria, // 'all', 'low-performers', 'inactive', 'department'
      title, 
      message, 
      type = 'info', 
      priority = 'normal',
      department,
      kpiThreshold = 70
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title and message are required'
      });
    }

    let query = { isActive: true };

    // Build query based on criteria
    switch (criteria) {
      case 'all':
        // No additional filters
        break;
      case 'department':
        if (!department) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Department is required for department-based notifications'
          });
        }
        query.department = department;
        break;
      case 'inactive':
        query.isActive = false;
        break;
      default:
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid criteria. Use: all, low-performers, inactive, or department'
        });
    }

    let users = await User.find(query);

    // Handle low-performers separately (requires KPI lookup)
    if (criteria === 'low-performers') {
      const KPIScore = require('../models/KPIScore');
      const userIds = users.map(u => u._id);
      
      const lowPerformers = await KPIScore.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$userId', latestScore: { $first: '$overallScore' } } },
        { $match: { latestScore: { $lt: kpiThreshold } } }
      ]);

      const lowPerformerIds = lowPerformers.map(lp => lp._id);
      users = users.filter(user => lowPerformerIds.includes(user._id));
    }

    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'No users match the specified criteria',
        sentCount: 0
      });
    }

    // Create lifecycle events for all users
    const LifecycleEvent = require('../models/LifecycleEvent');
    
    for (const user of users) {
      await LifecycleEvent.createAutoEvent({
        userId: user._id,
        type: 'other',
        title: `Bulk Notification: ${title}`,
        description: message,
        category: type === 'warning' ? 'negative' : 'neutral',
        createdBy: req.user._id
      });
    }

    res.json({
      success: true,
      message: `Bulk notification sent to ${users.length} user(s)`,
      sentCount: users.length,
      criteria,
      users: users.map(u => ({ id: u._id, name: u.name, email: u.email }))
    });

  } catch (error) {
    console.error('Bulk notification error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error sending bulk notification'
    });
  }
});

module.exports = router;
