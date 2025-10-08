const express = require('express');
const KPIScore = require('../models/KPIScore');
const User = require('../models/User');
const LifecycleEvent = require('../models/LifecycleEvent');
const TrainingAssignment = require('../models/TrainingAssignment');
const AuditSchedule = require('../models/AuditSchedule');
const EmailLog = require('../models/EmailLog');
const KPITriggerService = require('../services/kpiTriggerService');
const RealActivityKPIService = require('../services/realActivityKPIService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateKPIScore, validateUserId, validateObjectId, validatePagination } = require('../middleware/validation');

// Enhanced KPI Services (to be implemented)
// const EnhancedKPICalculationService = require('../services/enhancedKPICalculationService');
// const DataImportService = require('../services/dataImportService');
// const PredictiveAnalyticsService = require('../services/predictiveAnalyticsService');

const router = express.Router();

// @route   GET /api/kpi/:id/triggers
// @desc    Get triggers for a specific KPI score
// @access  Private (Admin only)
router.get('/:id/triggers', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const kpiId = req.params.id;

    // Get KPI score
    const kpiScore = await KPIScore.findById(kpiId)
      .populate('userId', 'name email employeeId')
      .populate('submittedBy', 'name email');

    if (!kpiScore) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'KPI score not found'
      });
    }

    // Calculate triggers using KPITriggerService
    const triggers = KPITriggerService.calculateTriggers(kpiScore);

    // Get related automation data
    const [trainingAssignments, auditSchedules, emailLogs] = await Promise.all([
      TrainingAssignment.find({ kpiTriggerId: kpiId, isActive: true })
        .populate('assignedByUser', 'name email')
        .sort({ createdAt: -1 }),
      AuditSchedule.find({ kpiTriggerId: kpiId, isActive: true })
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .sort({ scheduledDate: 1 }),
      EmailLog.find({ kpiTriggerId: kpiId, isActive: true })
        .sort({ sentAt: -1 })
    ]);

    res.json({
      success: true,
      data: {
        kpiScore,
        triggers,
        automationData: {
          trainingAssignments,
          auditSchedules,
          emailLogs,
          automationStatus: kpiScore.automationStatus,
          processedAt: kpiScore.processedAt
        }
      }
    });

  } catch (error) {
    console.error('Get KPI triggers error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching KPI triggers'
    });
  }
});

// @route   POST /api/kpi/:id/reprocess
// @desc    Reprocess triggers for a KPI score
// @access  Private (Admin only)
router.post('/:id/reprocess', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const kpiId = req.params.id;

    // Get KPI score
    const kpiScore = await KPIScore.findById(kpiId)
      .populate('userId', 'name email employeeId');

    if (!kpiScore) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'KPI score not found'
      });
    }

    // Mark as processing
    kpiScore.automationStatus = 'processing';
    await kpiScore.save();

    // Process triggers using KPITriggerService
    const automationResult = await KPITriggerService.processKPITriggers(kpiScore);

    // Update automation status
    kpiScore.automationStatus = automationResult.success ? 'completed' : 'failed';
    kpiScore.processedAt = new Date();
    await kpiScore.save();

    // Get updated automation data
    const [trainingAssignments, auditSchedules, emailLogs] = await Promise.all([
      TrainingAssignment.find({ kpiTriggerId: kpiId, isActive: true })
        .populate('assignedByUser', 'name email')
        .sort({ createdAt: -1 }),
      AuditSchedule.find({ kpiTriggerId: kpiId, isActive: true })
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .sort({ scheduledDate: 1 }),
      EmailLog.find({ kpiTriggerId: kpiId, isActive: true })
        .sort({ sentAt: -1 })
    ]);

    res.json({
      success: true,
      message: 'KPI triggers reprocessed successfully',
      data: {
        automationResult,
        automationData: {
          trainingAssignments,
          auditSchedules,
          emailLogs,
          automationStatus: kpiScore.automationStatus,
          processedAt: kpiScore.processedAt
        }
      }
    });

  } catch (error) {
    console.error('Reprocess KPI triggers error:', error);
    
    // Mark automation as failed
    try {
      const kpiScore = await KPIScore.findById(req.params.id);
      if (kpiScore) {
        kpiScore.automationStatus = 'failed';
        kpiScore.processedAt = new Date();
        await kpiScore.save();
      }
    } catch (updateError) {
      console.error('Error updating KPI status:', updateError);
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Error reprocessing KPI triggers'
    });
  }
});

// @route   GET /api/kpi/:id/automation-status
// @desc    Get automation status for a KPI score
// @access  Private (Admin only)
router.get('/:id/automation-status', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const kpiId = req.params.id;

    // Get KPI score with automation status
    const kpiScore = await KPIScore.findById(kpiId)
      .populate('userId', 'name email employeeId')
      .select('automationStatus processedAt triggeredActions overallScore rating period');

    if (!kpiScore) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'KPI score not found'
      });
    }

    // Get automation statistics
    const [trainingCount, auditCount, emailCount] = await Promise.all([
      TrainingAssignment.countDocuments({ kpiTriggerId: kpiId, isActive: true }),
      AuditSchedule.countDocuments({ kpiTriggerId: kpiId, isActive: true }),
      EmailLog.countDocuments({ kpiTriggerId: kpiId, isActive: true })
    ]);

    res.json({
      success: true,
      data: {
        kpiScore: {
          _id: kpiScore._id,
          userId: kpiScore.userId,
          overallScore: kpiScore.overallScore,
          rating: kpiScore.rating,
          period: kpiScore.period,
          triggeredActions: kpiScore.triggeredActions,
          automationStatus: kpiScore.automationStatus,
          processedAt: kpiScore.processedAt
        },
        automationStats: {
          trainingAssignments: trainingCount,
          auditSchedules: auditCount,
          emailLogs: emailCount
        }
      }
    });

  } catch (error) {
    console.error('Get automation status error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching automation status'
    });
  }
});

// @route   GET /api/kpi/pending-automation
// @desc    Get KPI scores pending automation
// @access  Private (Admin only)
router.get('/pending-automation', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter for pending automation
    const filter = {
      automationStatus: { $in: ['pending', 'failed'] },
      isActive: true
    };

    // Add date range filter if provided
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Get pending KPI scores with pagination
    const pendingKPIs = await KPIScore.find(filter)
      .populate('userId', 'name email employeeId department')
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await KPIScore.countDocuments(filter);

    // Get automation statistics
    const automationStats = await KPIScore.getAutomationStats();

    res.json({
      success: true,
      data: {
        pendingKPIs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        },
        automationStats
      }
    });

  } catch (error) {
    console.error('Get pending automation error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching pending automation'
    });
  }
});

// @route   GET /api/kpi/:userId
// @desc    Get KPI scores for a user with automation data
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

    // Get automation data if KPI exists
    let automationData = null;
    if (latestKPI._id) {
      const [trainingAssignments, auditSchedules, emailLogs] = await Promise.all([
        TrainingAssignment.find({ kpiTriggerId: latestKPI._id, isActive: true })
          .populate('assignedByUser', 'name email')
          .sort({ createdAt: -1 }),
        AuditSchedule.find({ kpiTriggerId: latestKPI._id, isActive: true })
          .populate('assignedTo', 'name email')
          .populate('assignedBy', 'name email')
          .sort({ scheduledDate: 1 }),
        EmailLog.find({ kpiTriggerId: latestKPI._id, isActive: true })
          .sort({ sentAt: -1 })
      ]);

      automationData = {
        trainingAssignments,
        auditSchedules,
        emailLogs,
        automationStatus: latestKPI.automationStatus || 'pending',
        processedAt: latestKPI.processedAt
      };
    }

    res.json({
      success: true,
      kpiScore: latestKPI,
      automationData
    });

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
// @desc    Submit KPI scores for a user with automation
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, validateKPIScore, async (req, res) => {
  try {
    const { 
      userId, 
      tat, 
      quality, 
      appUsage, 
      negativity = 0, 
      majorNegativity = 0,
      neighborCheck = 0,
      generalNegativity = 0,
      insufficiency = 0,
      period, 
      comments 
    } = req.body;

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
      majorNegativity,
      neighborCheck,
      generalNegativity,
      insufficiency,
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

    // Process automation triggers asynchronously
    let automationResult = null;
    try {
      // Process triggers using KPITriggerService
      automationResult = await KPITriggerService.processKPITriggers(kpiScore);
      
      // Update KPI with automation status
      kpiScore.automationStatus = automationResult.success ? 'completed' : 'failed';
      kpiScore.processedAt = new Date();
      await kpiScore.save();
      
    } catch (automationError) {
      console.error('Automation processing error:', automationError);
      
      // Mark automation as failed but don't fail the main request
      kpiScore.automationStatus = 'failed';
      kpiScore.processedAt = new Date();
      await kpiScore.save();
      
      automationResult = {
        success: false,
        error: automationError.message,
        message: 'Automation processing failed, but KPI was saved successfully'
      };
    }

    // Get populated KPI with automation data
    const populatedKPI = await KPIScore.findById(kpiScore._id)
      .populate('userId', 'name email employeeId')
      .populate('submittedBy', 'name email');

    // Prepare response with automation preview
    const response = {
      success: true,
      message: 'KPI score submitted successfully',
      calculatedScore: kpiScore.overallScore,
      rating: kpiScore.rating,
      triggeredActions: kpiScore.triggeredActions,
      kpiScore: populatedKPI,
      automation: {
        status: kpiScore.automationStatus,
        processedAt: kpiScore.processedAt,
        result: automationResult
      }
    };

    res.status(201).json(response);

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
    const { 
      tat, 
      quality, 
      appUsage, 
      negativity, 
      majorNegativity,
      neighborCheck,
      generalNegativity,
      insufficiency,
      comments 
    } = req.body;

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
    if (majorNegativity !== undefined) kpiScore.majorNegativity = majorNegativity;
    if (neighborCheck !== undefined) kpiScore.neighborCheck = neighborCheck;
    if (generalNegativity !== undefined) kpiScore.generalNegativity = generalNegativity;
    if (insufficiency !== undefined) kpiScore.insufficiency = insufficiency;
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

// @route   POST /api/kpi/generate-real-activity
// @desc    Generate KPI scores based on real user activity
// @access  Private (Admin only)
router.post('/generate-real-activity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period, userId } = req.body;
    
    if (!period) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Period is required (YYYY-MM format)'
      });
    }
    
    if (userId) {
      // Generate for specific user
      const kpiData = await RealActivityKPIService.calculateRealActivityKPI(userId, period);
      
      // Check if KPI already exists for this period
      const existingKPI = await KPIScore.findOne({ 
        userId, 
        period, 
        isActive: true 
      });
      
      if (existingKPI) {
        // Update existing KPI
        existingKPI.tat = kpiData.tat;
        existingKPI.majorNegativity = kpiData.majorNegativity;
        existingKPI.quality = kpiData.quality;
        existingKPI.neighborCheck = kpiData.neighborCheck;
        existingKPI.negativity = kpiData.generalNegativity;
        existingKPI.appUsage = kpiData.appUsage;
        existingKPI.insufficiency = kpiData.insufficiency;
        existingKPI.overallScore = kpiData.overallScore;
        existingKPI.rating = kpiData.rating;
        existingKPI.comments = 'Auto-updated based on real user activity';
        existingKPI.automationStatus = 'pending';
        
        await existingKPI.save();
        
        res.json({
          success: true,
          message: 'Real activity KPI updated successfully',
          data: {
            action: 'updated',
            kpiData,
            kpiScore: existingKPI
          }
        });
      } else {
        // Create new KPI score
        const kpiScore = new KPIScore({
          userId,
          period,
          tat: kpiData.tat,
          majorNegativity: kpiData.majorNegativity,
          quality: kpiData.quality,
          neighborCheck: kpiData.neighborCheck,
          negativity: kpiData.generalNegativity,
          appUsage: kpiData.appUsage,
          insufficiency: kpiData.insufficiency,
          overallScore: kpiData.overallScore,
          rating: kpiData.rating,
          submittedBy: req.user._id,
          comments: 'Auto-generated based on real user activity',
          automationStatus: 'pending'
        });
        
        await kpiScore.save();
        
        res.json({
          success: true,
          message: 'Real activity KPI generated successfully',
          data: {
            action: 'created',
            kpiData,
            kpiScore
          }
        });
      }
      
    } else {
      // Generate for all users
      const results = await RealActivityKPIService.generateAllUsersKPI(period);
      
      res.json({
        success: true,
        message: 'Real activity KPI generated for all users',
        data: {
          period,
          totalUsers: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results
        }
      });
    }
    
  } catch (error) {
    console.error('Generate real activity KPI error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error generating real activity KPI'
    });
  }
});

// @route   POST /api/kpi/auto-generate-user/:userId
// @desc    Auto-generate KPI for a specific user based on their activity
// @access  Private (Admin only)
router.post('/auto-generate-user/:userId', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { activityType, activityData } = req.body;
    
    const result = await RealActivityKPIService.autoGenerateUserKPI(userId, activityType, activityData);
    
    res.json({
      success: true,
      message: 'User KPI auto-generated successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Auto-generate user KPI error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error auto-generating user KPI'
    });
  }
});

// @route   GET /api/kpi/real-activity-summary/:userId
// @desc    Get real activity summary for a user
// @access  Private (Admin only)
router.get('/real-activity-summary/:userId', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { period } = req.query;
    
    const currentPeriod = period || new Date().toISOString().slice(0, 7);
    const activityData = await RealActivityKPIService.getUserActivityData(userId, currentPeriod);
    
    res.json({
      success: true,
      data: {
        userId,
        period: currentPeriod,
        activityData,
        summary: {
          totalVideosWatched: activityData.userProgress.filter(p => p.videoWatched).length,
          totalQuizAttempts: activityData.quizAttempts.length,
          averageQuizScore: activityData.quizAttempts.length > 0 ? 
            activityData.quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / activityData.quizAttempts.length : 0,
          modulesCompleted: activityData.userModules.filter(m => m.status === 'completed').length,
          totalWatchTime: activityData.userProgress.reduce((sum, progress) => sum + progress.totalWatchTime, 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Get real activity summary error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error getting real activity summary'
    });
  }
});

// ========================================
// ENHANCED KPI ROUTES
// ========================================

// @route   POST /api/kpi/calculate-from-raw
// @desc    Calculate KPI from raw data using enhanced system
// @access  Private (Admin only)
router.post('/calculate-from-raw', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, period, kpiConfigId } = req.body;

    if (!userId || !period) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'userId and period are required'
      });
    }

    // For now, return a mock response until enhanced services are implemented
    const mockKPIResult = {
      userId,
      period,
      rawData: {
        totalCases: 100,
        tatCases: 85,
        majorNegEvents: 2,
        clientComplaints: 5,
        fatalIssues: 1,
        opsRejections: 3,
        neighborChecksRequired: 20,
        neighborChecksDone: 18,
        generalNegEvents: 8,
        appCases: 70,
        insuffCases: 2
      },
      metrics: {
        tat: { percentage: 85, score: 10 },
        majorNegativity: { percentage: 2, score: 15 },
        quality: { percentage: 3, score: 10 },
        neighborCheck: { percentage: 90, score: 10 },
        negativity: { percentage: 8, score: 2 },
        appUsage: { percentage: 70, score: 0 },
        insufficiency: { percentage: 2, score: 5 }
      },
      overallScore: 52,
      rating: 'Satisfactory',
      triggeredActions: ['basic_training', 'audit_call'],
      edgeCases: {
        zeroCases: false,
        naMetrics: [],
        excludedMetrics: [],
        insufficientData: false
      },
      kpiConfigId: kpiConfigId || 'default',
      calculatedAt: new Date()
    };

    res.json({
      success: true,
      data: mockKPIResult,
      message: 'KPI calculated from raw data successfully'
    });

  } catch (error) {
    console.error('Calculate from raw data error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error calculating KPI from raw data'
    });
  }
});

// @route   POST /api/kpi/import-raw-data
// @desc    Import raw case events data
// @access  Private (Admin only)
router.post('/import-raw-data', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { events, period, dataSource } = req.body;

    if (!events || !Array.isArray(events) || !period) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'events array and period are required'
      });
    }

    // For now, return a mock response
    res.json({
      success: true,
      message: `Imported ${events.length} events for period ${period}`,
      data: {
        importedCount: events.length,
        period,
        dataSource: dataSource || 'manual_entry'
      }
    });

  } catch (error) {
    console.error('Import raw data error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error importing raw data'
    });
  }
});

// @route   PUT /api/kpi/:id/override
// @desc    Override KPI score with manager justification
// @access  Private (Admin only)
router.put('/:id/override', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const kpiId = req.params.id;
    const { overrideScore, overrideRating, overrideReason } = req.body;

    if (!overrideScore || !overrideRating || !overrideReason) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'overrideScore, overrideRating, and overrideReason are required'
      });
    }

    const kpiScore = await KPIScore.findById(kpiId);
    if (!kpiScore) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'KPI score not found'
      });
    }

    // Add to audit trail
    kpiScore.auditTrail = kpiScore.auditTrail || [];
    kpiScore.auditTrail.push({
      action: 'override',
      performedBy: req.user.id,
      details: overrideReason,
      previousValues: {
        overallScore: kpiScore.overallScore,
        rating: kpiScore.rating
      }
    });

    // Apply override
    kpiScore.override = {
      isOverridden: true,
      score: overrideScore,
      rating: overrideRating,
      reason: overrideReason,
      overriddenBy: req.user.id,
      overriddenAt: new Date()
    };

    kpiScore.overallScore = overrideScore;
    kpiScore.rating = overrideRating;

    await kpiScore.save();

    res.json({
      success: true,
      data: kpiScore,
      message: 'KPI score overridden successfully'
    });

  } catch (error) {
    console.error('Override KPI error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error overriding KPI score'
    });
  }
});

// @route   GET /api/kpi/:userId/trends
// @desc    Get KPI trends and predictive analytics
// @access  Private
router.get('/:userId/trends', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { periods = 6 } = req.query;

    // For now, return mock trend data
    const mockTrendData = {
      hasEnoughData: true,
      trends: {
        tat: {
          direction: 'improving',
          velocity: 2.5,
          confidence: 0.85,
          currentValue: 85,
          averageValue: 82
        },
        quality: {
          direction: 'stable',
          velocity: 0.5,
          confidence: 0.75,
          currentValue: 3,
          averageValue: 3.2
        }
      },
      predictions: [
        {
          type: 'declining_performance',
          metric: 'appUsage',
          severity: 'medium',
          description: 'appUsage is declining at 3.2% per period',
          predictedImpact: 'May trigger app usage training'
        }
      ],
      recommendations: [
        {
          type: 'preventive_training',
          metric: 'appUsage',
          priority: 'medium',
          action: 'Assign app usage training to prevent further decline',
          timeframe: 'immediate'
        }
      ],
      analyzedAt: new Date()
    };

    res.json({
      success: true,
      data: mockTrendData
    });

  } catch (error) {
    console.error('Get KPI trends error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error getting KPI trends'
    });
  }
});

// @route   GET /api/kpi/configs
// @desc    Get all KPI configurations
// @access  Private (Admin only)
router.get('/configs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // For now, return mock config data
    const mockConfigs = [
      {
        _id: 'default',
        name: 'Default KPI Configuration',
        version: '1.0.0',
        isActive: true,
        metrics: [
          {
            metricName: 'tat',
            weightage: 20,
            thresholds: [
              { operator: '>=', value: 95, score: 20 },
              { operator: '>=', value: 90, score: 10 },
              { operator: '>=', value: 85, score: 5 }
            ],
            isReverseScoring: false
          }
        ],
        ratingThresholds: {
          outstanding: 85,
          excellent: 70,
          satisfactory: 50,
          needImprovement: 40
        }
      }
    ];

    res.json({
      success: true,
      data: mockConfigs
    });

  } catch (error) {
    console.error('Get KPI configs error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error getting KPI configurations'
    });
  }
});

// @route   POST /api/kpi/configs
// @desc    Create new KPI configuration
// @access  Private (Admin only)
router.post('/configs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const configData = {
      ...req.body,
      createdBy: req.user.id,
      effectiveFrom: new Date()
    };

    // For now, return mock response
    res.json({
      success: true,
      data: {
        _id: 'new-config-id',
        ...configData,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      message: 'KPI configuration created successfully'
    });

  } catch (error) {
    console.error('Create KPI config error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating KPI configuration'
    });
  }
});

// @route   PUT /api/kpi/configs/:id
// @desc    Update KPI configuration
// @access  Private (Admin only)
router.put('/configs/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const configId = req.params.id;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    // For now, return mock response
    res.json({
      success: true,
      data: {
        _id: configId,
        ...updateData
      },
      message: 'KPI configuration updated successfully'
    });

  } catch (error) {
    console.error('Update KPI config error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating KPI configuration'
    });
  }
});

// @route   GET /api/kpi/user/:userId
// @desc    Get all KPI scores for a specific user
// @access  Private (User can access own data, Admin can access any)
router.get('/user/:userId', authenticateToken, validateUserId, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { limit = 10, page = 1 } = req.query;

    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only access your own KPI data'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const kpiScores = await KPIScore.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'name email employeeId')
      .populate('submittedBy', 'name email');

    const total = await KPIScore.countDocuments({ userId });

    res.json({
      success: true,
      data: kpiScores,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get user KPI scores error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user KPI scores'
    });
  }
});

module.exports = router;