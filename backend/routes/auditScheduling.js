const express = require('express');
const AuditSchedule = require('../models/AuditSchedule');
const KPIScore = require('../models/KPIScore');
const User = require('../models/User');
const LifecycleEvent = require('../models/LifecycleEvent');
const KPITriggerService = require('../services/kpiTriggerService');
const emailService = require('../services/emailService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateObjectId, validateUserId, validatePagination, handleValidationErrors } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

const router = express.Router();

// Validation rules for audit scheduling
const validateScheduleKPIAudits = [
  body('kpiScoreId')
    .isMongoId()
    .withMessage('Please provide a valid KPI score ID'),
  handleValidationErrors
];

const validateManualSchedule = [
  body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('auditType')
    .isIn(['audit_call', 'cross_check', 'dummy_audit'])
    .withMessage('Audit type must be one of: audit_call, cross_check, dummy_audit'),
  body('scheduledDate')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid scheduled date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
  body('auditScope')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Audit scope cannot exceed 500 characters'),
  body('auditMethod')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Audit method cannot exceed 500 characters'),
  handleValidationErrors
];

const validateCompleteAudit = [
  body('findings')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Findings must be between 10 and 2000 characters'),
  body('recommendations')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Recommendations cannot exceed 1000 characters'),
  body('riskLevel')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Risk level must be one of: low, medium, high, critical'),
  body('complianceStatus')
    .optional()
    .isIn(['compliant', 'non_compliant', 'partially_compliant', 'not_assessed'])
    .withMessage('Compliance status must be one of: compliant, non_compliant, partially_compliant, not_assessed'),
  handleValidationErrors
];

// @route   POST /api/audits/schedule-kpi-audits
// @desc    Schedule audits based on KPI triggers
// @access  Private (Admin only)
router.post('/schedule-kpi-audits', authenticateToken, requireAdmin, validateScheduleKPIAudits, async (req, res) => {
  try {
    const { kpiScoreId } = req.body;

    // Get KPI score
    const kpiScore = await KPIScore.findById(kpiScoreId)
      .populate('userId', 'name email employeeId')
      .populate('submittedBy', 'name email');

    if (!kpiScore) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'KPI score not found'
      });
    }

    // Use KPITriggerService to process triggers and schedule audits
    const triggerResults = await KPITriggerService.processKPITriggers(kpiScore);

    if (!triggerResults.success) {
      return res.status(500).json({
        error: 'Processing Failed',
        message: 'Failed to process KPI triggers',
        details: triggerResults.errors
      });
    }

    // Get created audit schedules
    const auditSchedules = await AuditSchedule.find({ kpiTriggerId: kpiScoreId })
      .populate('userId', 'name email employeeId')
      .populate('assignedBy', 'name email')
      .sort({ scheduledDate: 1 });

    res.status(201).json({
      success: true,
      message: `Successfully scheduled ${auditSchedules.length} audit(s)`,
      data: {
        auditSchedules,
        processingTime: triggerResults.processingTime,
        emailResults: triggerResults.emailLogs,
        lifecycleEvents: triggerResults.lifecycleEvents
      }
    });

  } catch (error) {
    console.error('Schedule KPI audits error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error scheduling KPI audits'
    });
  }
});

// @route   GET /api/audits/scheduled
// @desc    Get all scheduled audits
// @access  Private (Admin only)
router.get('/scheduled', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { 
      status: 'scheduled',
      isActive: true 
    };

    // Add audit type filter if provided
    if (req.query.auditType) {
      filter.auditType = req.query.auditType;
    }

    // Add priority filter if provided
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Add date range filter if provided
    if (req.query.startDate || req.query.endDate) {
      filter.scheduledDate = {};
      if (req.query.startDate) {
        filter.scheduledDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.scheduledDate.$lte = new Date(req.query.endDate);
      }
    }

    // Get scheduled audits with pagination
    const audits = await AuditSchedule.find(filter)
      .populate('userId', 'name email employeeId department')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await AuditSchedule.countDocuments(filter);

    // Get statistics
    const stats = await AuditSchedule.getAuditStats(filter);

    res.json({
      success: true,
      data: {
        audits,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        },
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get scheduled audits error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching scheduled audits'
    });
  }
});

// @route   GET /api/audits/overdue
// @desc    Get all overdue audits
// @access  Private (Admin only)
router.get('/overdue', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter for overdue audits
    const filter = { 
      status: 'scheduled',
      scheduledDate: { $lt: new Date() },
      isActive: true 
    };

    // Add audit type filter if provided
    if (req.query.auditType) {
      filter.auditType = req.query.auditType;
    }

    // Add priority filter if provided
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Get overdue audits with pagination
    const audits = await AuditSchedule.find(filter)
      .populate('userId', 'name email employeeId department')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await AuditSchedule.countDocuments(filter);

    // Get statistics
    const stats = await AuditSchedule.getAuditStats(filter);

    res.json({
      success: true,
      data: {
        audits,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        },
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get overdue audits error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching overdue audits'
    });
  }
});

// @route   PUT /api/audits/:id/complete
// @desc    Mark audit as completed
// @access  Private (Admin only)
router.put('/:id/complete', authenticateToken, requireAdmin, validateObjectId, validateCompleteAudit, async (req, res) => {
  try {
    const { id } = req.params;
    const { findings, recommendations, riskLevel, complianceStatus } = req.body;

    // Get audit schedule
    const audit = await AuditSchedule.findById(id)
      .populate('userId', 'name email employeeId')
      .populate('kpiTriggerId', 'overallScore rating period');

    if (!audit) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Audit schedule not found'
      });
    }

    if (audit.status === 'completed') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Audit is already completed'
      });
    }

    // Mark as completed
    await audit.markCompleted(findings, recommendations);

    // Update additional fields if provided
    if (riskLevel) audit.riskLevel = riskLevel;
    if (complianceStatus) audit.complianceStatus = complianceStatus;
    await audit.save();

    // Create lifecycle event
    await LifecycleEvent.createAutoEvent({
      userId: audit.userId._id,
      type: 'audit',
      title: 'Audit Completed',
      description: `Completed ${audit.auditType} audit with findings: ${findings.substring(0, 100)}...`,
      category: complianceStatus === 'compliant' ? 'positive' : 'negative',
      metadata: {
        auditScheduleId: audit._id,
        auditType: audit.auditType,
        findings: findings,
        riskLevel: riskLevel,
        complianceStatus: complianceStatus,
        completionDate: audit.completedDate
      },
      createdBy: req.user._id
    });

    // Send completion notification email
    try {
      await emailService.sendAuditNotificationEmail(audit.userId._id, {
        userName: audit.userId.name,
        employeeId: audit.userId.employeeId,
        auditTypes: [audit.auditType],
        auditCount: 1,
        kpiScore: audit.kpiTriggerId?.overallScore || 'N/A',
        priority: audit.priority,
        auditScheduleId: audit._id
      });
    } catch (emailError) {
      console.error('Error sending audit completion notification:', emailError);
      // Don't fail the request if email fails
    }

    // Get updated audit with populated data
    const updatedAudit = await AuditSchedule.findById(id)
      .populate('userId', 'name email employeeId')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period');

    res.json({
      success: true,
      message: 'Audit marked as completed',
      data: updatedAudit
    });

  } catch (error) {
    console.error('Complete audit error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error completing audit'
    });
  }
});

// @route   GET /api/audits/user/:userId
// @desc    Get user's audit history
// @access  Private (user can access own, admin can access any)
router.get('/user/:userId', authenticateToken, validateUserId, validatePagination, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check authorization
    if (req.user.userType !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only access your own audit history'
      });
    }

    // Build filter
    const filter = { 
      userId,
      isActive: true 
    };

    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Add audit type filter if provided
    if (req.query.auditType) {
      filter.auditType = req.query.auditType;
    }

    // Add date range filter if provided
    if (req.query.startDate || req.query.endDate) {
      filter.scheduledDate = {};
      if (req.query.startDate) {
        filter.scheduledDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.scheduledDate.$lte = new Date(req.query.endDate);
      }
    }

    // Get user's audit history with pagination
    const audits = await AuditSchedule.find(filter)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await AuditSchedule.countDocuments(filter);

    // Get user's audit statistics
    const stats = await AuditSchedule.getAuditStats(filter);

    res.json({
      success: true,
      data: {
        audits,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        },
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get user audit history error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user audit history'
    });
  }
});

// @route   POST /api/audits/manual
// @desc    Manually schedule audit
// @access  Private (Admin only)
router.post('/manual', authenticateToken, requireAdmin, validateManualSchedule, async (req, res) => {
  try {
    const { userId, auditType, scheduledDate, priority, auditScope, auditMethod } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Create audit schedule
    const audit = new AuditSchedule({
      userId,
      auditType,
      scheduledDate: new Date(scheduledDate),
      priority: priority || 'medium',
      auditScope: auditScope || `Manual ${auditType} audit`,
      auditMethod: auditMethod || 'Standard audit procedure',
      assignedBy: req.user._id
    });

    await audit.save();

    // Send audit notification email
    try {
      await emailService.sendAuditNotificationEmail(userId, {
        userName: user.name,
        employeeId: user.employeeId,
        auditTypes: [auditType],
        auditCount: 1,
        kpiScore: 'N/A',
        priority: audit.priority,
        auditScheduleId: audit._id
      });
    } catch (emailError) {
      console.error('Error sending audit notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Create lifecycle event
    await LifecycleEvent.createAutoEvent({
      userId,
      type: 'audit',
      title: 'Audit Scheduled',
      description: `Manually scheduled ${auditType} audit`,
      category: 'neutral',
      metadata: {
        auditScheduleId: audit._id,
        auditType: auditType,
        scheduledDate: audit.scheduledDate,
        priority: audit.priority,
        assignedBy: req.user._id
      },
      createdBy: req.user._id
    });

    // Get populated audit
    const populatedAudit = await AuditSchedule.findById(audit._id)
      .populate('userId', 'name email employeeId')
      .populate('assignedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Audit scheduled successfully',
      data: populatedAudit
    });

  } catch (error) {
    console.error('Manual schedule audit error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error scheduling manual audit'
    });
  }
});

// @route   DELETE /api/audits/:id
// @desc    Cancel scheduled audit
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;

    // Get audit schedule
    const audit = await AuditSchedule.findById(id)
      .populate('userId', 'name email employeeId');

    if (!audit) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Audit schedule not found'
      });
    }

    if (audit.status === 'completed') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot cancel completed audit'
      });
    }

    // Mark as inactive (soft delete)
    audit.isActive = false;
    audit.status = 'cancelled';
    await audit.save();

    // Create lifecycle event
    await LifecycleEvent.createAutoEvent({
      userId: audit.userId._id,
      type: 'audit',
      title: 'Audit Cancelled',
      description: `Cancelled ${audit.auditType} audit`,
      category: 'neutral',
      metadata: {
        auditScheduleId: audit._id,
        auditType: audit.auditType,
        cancelledBy: req.user._id,
        cancelledAt: new Date()
      },
      createdBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Audit cancelled successfully',
      data: {
        id: audit._id,
        status: 'cancelled',
        cancelledAt: new Date()
      }
    });

  } catch (error) {
    console.error('Cancel audit error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error cancelling audit'
    });
  }
});

// @route   GET /api/audits/stats
// @desc    Get audit scheduling statistics
// @access  Private (Admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { auditType, status, priority, startDate, endDate } = req.query;

    // Build filter
    const filter = { isActive: true };
    
    if (auditType) filter.auditType = auditType;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Get statistics
    const [stats, typeDistribution, statusDistribution, priorityDistribution] = await Promise.all([
      AuditSchedule.getAuditStats(filter),
      AuditSchedule.getAuditTypeDistribution(filter),
      AuditSchedule.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      AuditSchedule.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Get completion rate
    const totalAudits = await AuditSchedule.countDocuments(filter);
    const completedAudits = await AuditSchedule.countDocuments({ ...filter, status: 'completed' });
    const completionRate = totalAudits > 0 ? (completedAudits / totalAudits) * 100 : 0;

    // Get overdue count
    const overdueAudits = await AuditSchedule.countDocuments({
      ...filter,
      status: 'scheduled',
      scheduledDate: { $lt: new Date() }
    });

    res.json({
      success: true,
      data: {
        overallStats: stats,
        typeDistribution,
        statusDistribution,
        priorityDistribution,
        completionRate: Math.round(completionRate * 100) / 100,
        totalAudits,
        completedAudits,
        overdueAudits
      }
    });

  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching audit statistics'
    });
  }
});

// @route   GET /api/audits/:id
// @desc    Get specific audit schedule
// @access  Private (user can access own, admin can access any)
router.get('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;

    // Get audit schedule
    const audit = await AuditSchedule.findById(id)
      .populate('userId', 'name email employeeId department')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period');

    if (!audit) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Audit schedule not found'
      });
    }

    // Check authorization
    if (req.user.userType !== 'admin' && req.user._id.toString() !== audit.userId._id.toString()) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only access your own audit schedules'
      });
    }

    res.json({
      success: true,
      data: audit
    });

  } catch (error) {
    console.error('Get audit schedule error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching audit schedule'
    });
  }
});

// @route   PUT /api/audits/:id
// @desc    Update audit schedule
// @access  Private (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, priority, auditScope, auditMethod, assignedTo } = req.body;

    // Get audit schedule
    const audit = await AuditSchedule.findById(id);

    if (!audit) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Audit schedule not found'
      });
    }

    // Update fields
    if (scheduledDate) audit.scheduledDate = new Date(scheduledDate);
    if (priority) audit.priority = priority;
    if (auditScope) audit.auditScope = auditScope;
    if (auditMethod) audit.auditMethod = auditMethod;
    if (assignedTo) audit.assignedTo = assignedTo;

    await audit.save();

    // Get updated audit with populated data
    const updatedAudit = await AuditSchedule.findById(id)
      .populate('userId', 'name email employeeId')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period');

    res.json({
      success: true,
      message: 'Audit schedule updated successfully',
      data: updatedAudit
    });

  } catch (error) {
    console.error('Update audit schedule error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating audit schedule'
    });
  }
});

// @route   GET /api/audits/upcoming
// @desc    Get upcoming audits
// @access  Private (Admin only)
router.get('/upcoming', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const limit = parseInt(req.query.limit) || 20;

    // Get upcoming audits
    const audits = await AuditSchedule.getUpcomingAudits(days, { isActive: true })
      .limit(limit);

    res.json({
      success: true,
      data: {
        audits,
        days,
        totalUpcoming: audits.length
      }
    });

  } catch (error) {
    console.error('Get upcoming audits error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching upcoming audits'
    });
  }
});

module.exports = router;
