const express = require('express');
const TrainingAssignment = require('../models/TrainingAssignment');
const KPIScore = require('../models/KPIScore');
const User = require('../models/User');
const LifecycleEvent = require('../models/LifecycleEvent');
const KPITriggerService = require('../services/kpiTriggerService');
const emailService = require('../services/emailService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateObjectId, validateUserId, validatePagination, handleValidationErrors } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

const router = express.Router();

// Validation rules for training assignments
const validateAutoAssign = [
  body('kpiScoreId')
    .isMongoId()
    .withMessage('Please provide a valid KPI score ID'),
  handleValidationErrors
];

const validateManualAssign = [
  body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('trainingType')
    .isIn(['basic', 'negativity_handling', 'dos_donts', 'app_usage'])
    .withMessage('Training type must be one of: basic, negativity_handling, dos_donts, app_usage'),
  body('dueDate')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid due date'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors
];

const validateCompleteTraining = [
  body('score')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors
];

// @route   POST /api/training-assignments/auto-assign
// @desc    Auto-assign trainings based on KPI triggers
// @access  Private (Admin only)
router.post('/auto-assign', authenticateToken, requireAdmin, validateAutoAssign, async (req, res) => {
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

    // Use KPITriggerService to process triggers and create training assignments
    const triggerResults = await KPITriggerService.processKPITriggers(kpiScore);

    if (!triggerResults.success) {
      return res.status(500).json({
        error: 'Processing Failed',
        message: 'Failed to process KPI triggers',
        details: triggerResults.errors
      });
    }

    // Get created training assignments
    const assignments = await TrainingAssignment.find({ kpiTriggerId: kpiScoreId })
      .populate('userId', 'name email employeeId')
      .populate('assignedByUser', 'name email')
      .sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      message: `Successfully created ${assignments.length} training assignment(s)`,
      data: {
        assignments,
        processingTime: triggerResults.processingTime,
        emailResults: triggerResults.emailLogs,
        lifecycleEvents: triggerResults.lifecycleEvents
      }
    });

  } catch (error) {
    console.error('Auto-assign training error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error auto-assigning training'
    });
  }
});

// @route   GET /api/training-assignments/pending
// @desc    Get all pending training assignments
// @access  Private (Admin only)
router.get('/pending', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {
      status: { $in: ['assigned', 'overdue'] },
      isActive: true
    };

    // Add training type filter if provided
    if (req.query.trainingType) {
      filter.trainingType = req.query.trainingType;
    }

    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Get pending assignments with pagination
    const assignments = await TrainingAssignment.find(filter)
      .populate('userId', 'name email employeeId department')
      .populate('assignedByUser', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await TrainingAssignment.countDocuments(filter);

    // Get statistics
    const stats = await TrainingAssignment.getTrainingStats(filter);

    res.json({
      success: true,
      data: {
        assignments,
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
    console.error('Get pending assignments error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching pending training assignments'
    });
  }
});

// @route   GET /api/training-assignments/overdue
// @desc    Get all overdue training assignments
// @access  Private (Admin only)
router.get('/overdue', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {
      status: 'overdue',
      isActive: true
    };

    // Add training type filter if provided
    if (req.query.trainingType) {
      filter.trainingType = req.query.trainingType;
    }

    // Get overdue assignments with pagination
    const assignments = await TrainingAssignment.find(filter)
      .populate('userId', 'name email employeeId department')
      .populate('assignedByUser', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await TrainingAssignment.countDocuments(filter);

    // Get statistics
    const stats = await TrainingAssignment.getTrainingStats(filter);

    res.json({
      success: true,
      data: {
        assignments,
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
    console.error('Get overdue assignments error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching overdue training assignments'
    });
  }
});

// @route   PUT /api/training-assignments/:id/complete
// @desc    Mark training as completed
// @access  Private (Admin only)
router.put('/:id/complete', authenticateToken, requireAdmin, validateObjectId, validateCompleteTraining, async (req, res) => {
  try {
    const { id } = req.params;
    const { score, notes } = req.body;

    // Get training assignment
    const assignment = await TrainingAssignment.findById(id)
      .populate('userId', 'name email employeeId')
      .populate('kpiTriggerId', 'overallScore rating period');

    if (!assignment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Training assignment not found'
      });
    }

    if (assignment.status === 'completed') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Training assignment is already completed'
      });
    }

    // Mark as completed
    await assignment.markCompleted(score, notes);

    // Create lifecycle event
    await LifecycleEvent.createAutoEvent({
      userId: assignment.userId._id,
      type: 'training',
      title: 'Training Completed',
      description: `Completed ${assignment.trainingType} training with score ${score || 'N/A'}`,
      category: 'positive',
      metadata: {
        trainingAssignmentId: assignment._id,
        trainingType: assignment.trainingType,
        score: score,
        completionDate: assignment.completionDate
      },
      createdBy: req.user._id
    });

    // Send completion notification email
    try {
      await emailService.sendTrainingNotification(assignment.userId._id, {
        userName: assignment.userId.name,
        trainingType: assignment.trainingType,
        reason: 'Training completed successfully',
        dueDate: assignment.completionDate.toLocaleDateString(),
        trainingLink: `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/training`
      });
    } catch (emailError) {
      console.error('Error sending completion notification:', emailError);
      // Don't fail the request if email fails
    }

    // Get updated assignment with populated data
    const updatedAssignment = await TrainingAssignment.findById(id)
      .populate('userId', 'name email employeeId')
      .populate('assignedByUser', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period');

    res.json({
      success: true,
      message: 'Training assignment marked as completed',
      data: updatedAssignment
    });

  } catch (error) {
    console.error('Complete training error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error completing training assignment'
    });
  }
});

// @route   GET /api/training-assignments/user/:userId
// @desc    Get user's training assignments
// @access  Private (user can access own, admin can access any)
router.get('/user/:userId', authenticateToken, validateUserId, validatePagination, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check permissions
    if (!['admin', 'manager', 'hod', 'hr'].includes(req.user.userType) && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
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

    // Add training type filter if provided
    if (req.query.trainingType) {
      filter.trainingType = req.query.trainingType;
    }

    // Get user's assignments with pagination
    const assignments = await TrainingAssignment.find(filter)
      .populate('assignedByUser', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await TrainingAssignment.countDocuments(filter);

    // Get user's training statistics
    const stats = await TrainingAssignment.getTrainingStats(filter);

    res.json({
      success: true,
      data: {
        assignments,
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
    console.error('Get user assignments error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user training assignments'
    });
  }
});

// @route   POST /api/training-assignments/manual
// @desc    Manually assign training
// @access  Private (Admin only)
router.post('/manual', authenticateToken, requireAdmin, validateManualAssign, async (req, res) => {
  try {
    const { userId, trainingType, dueDate, notes } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Create training assignment
    const assignment = new TrainingAssignment({
      userId,
      trainingType,
      assignedBy: 'manual',
      dueDate: new Date(dueDate),
      notes,
      assignedByUser: req.user._id
    });

    await assignment.save();

    // Send training assignment email
    try {
      await emailService.sendTrainingAssignmentEmail(userId, {
        userName: user.name,
        trainingTypes: [trainingType],
        trainingCount: 1,
        dueDate: assignment.dueDate.toLocaleDateString(),
        priority: assignment.dueDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'high' : 'medium',
        trainingAssignmentId: assignment._id
      });
    } catch (emailError) {
      console.error('Error sending training assignment email:', emailError);
      // Don't fail the request if email fails
    }

    // Create lifecycle event
    await LifecycleEvent.createAutoEvent({
      userId,
      type: 'training',
      title: 'Training Assigned',
      description: `Manually assigned ${trainingType} training`,
      category: 'neutral',
      metadata: {
        trainingAssignmentId: assignment._id,
        trainingType: trainingType,
        assignedBy: req.user._id,
        dueDate: assignment.dueDate
      },
      createdBy: req.user._id
    });

    // Get populated assignment
    const populatedAssignment = await TrainingAssignment.findById(assignment._id)
      .populate('userId', 'name email employeeId')
      .populate('assignedByUser', 'name email');

    res.status(201).json({
      success: true,
      message: 'Training assignment created successfully',
      data: populatedAssignment
    });

  } catch (error) {
    console.error('Manual assign training error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating manual training assignment'
    });
  }
});

// @route   DELETE /api/training-assignments/:id
// @desc    Cancel training assignment
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;

    // Get training assignment
    const assignment = await TrainingAssignment.findById(id)
      .populate('userId', 'name email employeeId');

    if (!assignment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Training assignment not found'
      });
    }

    if (assignment.status === 'completed') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot cancel completed training assignment'
      });
    }

    // Mark as inactive (soft delete)
    assignment.isActive = false;
    assignment.status = 'cancelled';
    await assignment.save();

    // Create lifecycle event
    await LifecycleEvent.createAutoEvent({
      userId: assignment.userId._id,
      type: 'training',
      title: 'Training Assignment Cancelled',
      description: `Cancelled ${assignment.trainingType} training assignment`,
      category: 'neutral',
      metadata: {
        trainingAssignmentId: assignment._id,
        trainingType: assignment.trainingType,
        cancelledBy: req.user._id,
        cancelledAt: new Date()
      },
      createdBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Training assignment cancelled successfully',
      data: {
        id: assignment._id,
        status: 'cancelled',
        cancelledAt: new Date()
      }
    });

  } catch (error) {
    console.error('Cancel training error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error cancelling training assignment'
    });
  }
});

// @route   GET /api/training-assignments/stats
// @desc    Get training assignment statistics
// @access  Private (Admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { trainingType, status, startDate, endDate } = req.query;

    // Build filter
    const filter = { isActive: true };

    if (trainingType) filter.trainingType = trainingType;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Get statistics
    const [stats, typeDistribution, statusDistribution] = await Promise.all([
      TrainingAssignment.getTrainingStats(filter),
      TrainingAssignment.getTrainingTypeDistribution(filter),
      TrainingAssignment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Get completion rate
    const totalAssignments = await TrainingAssignment.countDocuments(filter);
    const completedAssignments = await TrainingAssignment.countDocuments({ ...filter, status: 'completed' });
    const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

    res.json({
      success: true,
      data: {
        overallStats: stats,
        typeDistribution,
        statusDistribution,
        completionRate: Math.round(completionRate * 100) / 100,
        totalAssignments,
        completedAssignments
      }
    });

  } catch (error) {
    console.error('Get training stats error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching training statistics'
    });
  }
});

// @route   GET /api/training-assignments/:id
// @desc    Get specific training assignment
// @access  Private (user can access own, admin can access any)
router.get('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;

    // Get training assignment
    const assignment = await TrainingAssignment.findById(id)
      .populate('userId', 'name email employeeId department')
      .populate('assignedByUser', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period');

    if (!assignment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Training assignment not found'
      });
    }

    // Check authorization
    if (!['admin', 'manager', 'hod', 'hr'].includes(req.user.userType) && req.user._id.toString() !== assignment.userId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: assignment
    });

  } catch (error) {
    console.error('Get training assignment error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching training assignment'
    });
  }
});

// @route   PUT /api/training-assignments/:id
// @desc    Update training assignment
// @access  Private (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const { dueDate, notes, status } = req.body;

    // Get training assignment
    const assignment = await TrainingAssignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Training assignment not found'
      });
    }

    // Update fields
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (notes !== undefined) assignment.notes = notes;
    if (status && ['assigned', 'in_progress', 'completed', 'overdue'].includes(status)) {
      assignment.status = status;
    }

    await assignment.save();

    // Get updated assignment with populated data
    const updatedAssignment = await TrainingAssignment.findById(id)
      .populate('userId', 'name email employeeId')
      .populate('assignedByUser', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period');

    res.json({
      success: true,
      message: 'Training assignment updated successfully',
      data: updatedAssignment
    });

  } catch (error) {
    console.error('Update training assignment error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating training assignment'
    });
  }
});

// @route   GET /api/training-assignments/user/:userId
// @desc    Get all training assignments for a specific user
// @access  Private (Admin only)
router.get('/user/:userId', authenticateToken, requireAdmin, validateUserId, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { limit = 10, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const assignments = await TrainingAssignment.find({ userId })
      .sort({ assignedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'name email employeeId')
      .populate('assignedByUser', 'name email')
      .populate('kpiTriggerId', 'overallScore rating period');

    const total = await TrainingAssignment.countDocuments({ userId });

    res.json({
      success: true,
      data: assignments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get user training assignments error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user training assignments'
    });
  }
});

module.exports = router;
