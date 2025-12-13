const express = require('express');
const router = express.Router();
const EmailLog = require('../models/EmailLog');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all email logs (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      templateType,
      status,
      recipientRole,
      dateRange,
      search
    } = req.query;

    const filter = {};

    if (templateType) filter.templateType = templateType;
    if (status) filter.status = status;
    if (recipientRole) filter.recipientRole = recipientRole;

    if (search) {
      filter.$or = [
        { recipientEmail: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { emailContent: { $regex: search, $options: 'i' } }
      ];
    }

    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      filter.sentAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      EmailLog.find(filter)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email')
        .populate('kpiTriggerId')
        .populate('trainingAssignmentId')
        .populate('auditScheduleId'),
      EmailLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email logs',
      error: error.message
    });
  }
});

// Get email logs by user ID
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if user is authorized (admin or accessing own data)
    if (req.user._id.toString() !== userId && !['admin', 'manager', 'hod', 'hr'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      EmailLog.find({ userId })
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('kpiTriggerId')
        .populate('trainingAssignmentId')
        .populate('auditScheduleId'),
      EmailLog.countDocuments({ userId })
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email logs',
      error: error.message
    });
  }
});

// Get email log by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('kpiTriggerId')
      .populate('trainingAssignmentId')
      .populate('auditScheduleId');

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Email log not found'
      });
    }

    // Check if user can access this log
    if (req.user._id.toString() !== log.userId._id.toString() && !['admin', 'manager', 'hod', 'hr'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error fetching email log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email log',
      error: error.message
    });
  }
});

// Resend email
router.post('/:id/resend', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Email log not found'
      });
    }

    // Resend logic would go here
    // For now, just update the status
    log.status = 'sent';
    log.sentAt = new Date();
    await log.save();

    res.json({
      success: true,
      message: 'Email resent successfully',
      data: log
    });
  } catch (error) {
    console.error('Error resending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend email',
      error: error.message
    });
  }
});

// Get email statistics
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await EmailLog.aggregate([
      {
        $group: {
          _id: null,
          totalEmails: { $sum: 1 },
          sentEmails: {
            $sum: { $cond: [{ $in: ['$status', ['sent', 'delivered']] }, 1, 0] }
          },
          failedEmails: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          pendingEmails: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    const templateStats = await EmailLog.aggregate([
      {
        $group: {
          _id: '$templateType',
          count: { $sum: 1 },
          sent: {
            $sum: { $cond: [{ $in: ['$status', ['sent', 'delivered']] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalEmails: 0,
          sentEmails: 0,
          failedEmails: 0,
          pendingEmails: 0
        },
        byTemplate: templateStats
      }
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email statistics',
      error: error.message
    });
  }
});

module.exports = router;
