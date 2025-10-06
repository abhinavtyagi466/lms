const express = require('express');
const User = require('../models/User');
const Module = require('../models/Module');
const UserModule = require('../models/UserModule');
const KPIScore = require('../models/KPIScore');
const Award = require('../models/Award');
const AuditRecord = require('../models/AuditRecord');
const LifecycleEvent = require('../models/LifecycleEvent');
const Quiz = require('../models/Quiz'); // Added Quiz import
const UserProgress = require('../models/UserProgress'); // Added UserProgress import
const QuizAttempt = require('../models/QuizAttempt'); // NEW: Added QuizAttempt import
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateUserId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/reports/user/:userId
// @desc    Get reports for a specific user
// @access  Private (user can access own reports, admin can access any)
router.get('/user/:userId', authenticateToken, validateUserId, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get user's module progress
    const userModules = await UserModule.find({ userId })
      .populate('moduleId', 'title description category difficulty')
      .sort({ updatedAt: -1 });

    const modules = userModules.map(um => ({
      id: um.moduleId._id,
      name: um.moduleId.title,
      category: um.moduleId.category,
      score: um.highestScore,
      completionDate: um.completedAt,
      status: um.status,
      progress: um.progress,
      attempts: um.attemptCount
    }));

    // Get certificates (completed modules with passing scores)
    const certificates = userModules
      .filter(um => um.status === 'completed' && um.highestScore >= 70)
      .map(um => `${um.moduleId.title}_Certificate.pdf`);

    // Get KPI history
    const kpiHistory = await KPIScore.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(12)
      .select('overallScore rating period createdAt');

    // Get awards
    const awards = await Award.find({ userId, status: 'approved' })
      .sort({ awardDate: -1 })
      .select('type title awardDate description');

    // Get audit records
    const auditRecords = await AuditRecord.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type reason status createdAt severity');

    // Calculate summary statistics
    const completedModules = modules.filter(m => m.status === 'completed').length;
    const averageScore = modules.length > 0 
      ? Math.round(modules.reduce((sum, m) => sum + m.score, 0) / modules.length) 
      : 0;
    const latestKPI = kpiHistory.length > 0 ? kpiHistory[0] : null;

    res.json({
      success: true,
      summary: {
        completedModules,
        totalModules: modules.length,
        averageScore,
        certificatesEarned: certificates.length,
        awardsReceived: awards.length,
        currentKPIScore: latestKPI ? latestKPI.overallScore : 0,
        currentKPIRating: latestKPI ? latestKPI.rating : 'No Score'
      },
      modules,
      certificates,
      kpiHistory,
      awards,
      auditRecords
    });

  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user reports'
    });
  }
});

// @route   GET /api/reports/admin
// @desc    Get dashboard statistics for admin
// @access  Private (Admin only)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalModules = await Module.countDocuments(); // All modules (including inactive)
    const totalQuizzes = await Quiz.countDocuments();
    
    // Get active users (users who accessed in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await User.countDocuments({
      isActive: true,
      lastLoginAt: { $gte: thirtyDaysAgo }
    });

    // Get completion statistics
    const completedModules = await UserProgress.countDocuments({
      status: { $in: ['completed', 'certified'] }
    });

    // Calculate average progress across all users
    const allProgress = await UserProgress.aggregate([
      {
        $group: {
          _id: null,
          avgProgress: { $avg: '$videoProgress' },
          totalWatchTime: { $sum: '$totalWatchTime' }
        }
      }
    ]);

    const averageProgress = allProgress.length > 0 ? Math.round(allProgress[0].avgProgress || 0) : 0;
    const totalWatchTime = allProgress.length > 0 ? allProgress[0].totalWatchTime || 0 : 0;

    // Get certificates issued
    const certificatesIssued = await UserProgress.countDocuments({
      status: 'certified'
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalModules,
        totalQuizzes,
        activeUsers,
        completedModules,
        averageProgress,
        totalWatchTime,
        certificatesIssued
      }
    });

  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching admin reports'
    });
  }
});

// @route   GET /api/reports/admin/stats
// @desc    Get detailed admin statistics
// @access  Private (Admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get basic counts with error handling
    const [totalUsers, totalModules, totalQuizzes] = await Promise.allSettled([
      User.countDocuments({ isActive: true }),
      Module.countDocuments(),
      Quiz.countDocuments()
    ]);
    
    // Get active users (users who accessed in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await User.countDocuments({
      isActive: true,
      lastLoginAt: { $gte: thirtyDaysAgo }
    }).catch(() => 0);

    // Get completion statistics with error handling
    const completedModules = await UserProgress.countDocuments({
      status: { $in: ['completed', 'certified'] }
    }).catch(() => 0);

    // Calculate average progress across all users with error handling
    const allProgress = await UserProgress.aggregate([
      {
        $group: {
          _id: null,
          avgProgress: { $avg: '$videoProgress' },
          totalWatchTime: { $sum: '$totalWatchTime' }
        }
      }
    ]).catch(() => []);

    const averageProgress = allProgress.length > 0 ? Math.round(allProgress[0].avgProgress || 0) : 0;
    const totalWatchTime = allProgress.length > 0 ? allProgress[0].totalWatchTime || 0 : 0;

    // Get certificates issued with error handling
    const certificatesIssued = await UserProgress.countDocuments({
      status: 'certified'
    }).catch(() => 0);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers.status === 'fulfilled' ? totalUsers.value : 0,
        totalModules: totalModules.status === 'fulfilled' ? totalModules.value : 0,
        totalQuizzes: totalQuizzes.status === 'fulfilled' ? totalQuizzes.value : 0,
        activeUsers,
        completedModules,
        averageProgress,
        totalWatchTime,
        certificatesIssued
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching admin statistics: ' + error.message
    });
  }
});

// @route   GET /api/reports/admin/user-progress
// @desc    Get all user progress for admin dashboard
// @access  Private (Admin only)
router.get('/admin/user-progress', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // First check if UserProgress collection exists and has data
    const progressCount = await UserProgress.countDocuments();
    
    if (progressCount === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No user progress data found'
      });
    }

    // Use lean() for better performance and handle populate errors
    const userProgress = await UserProgress.find()
      .populate('userId', 'name email')
      .populate('moduleId', 'title ytVideoId')
      .sort({ lastAccessedAt: -1 })
      .lean()
      .exec();

    // Filter out any documents with null references
    const validProgress = userProgress.filter(progress => 
      progress.userId && progress.moduleId
    );

    res.json({
      success: true,
      data: validProgress
    });

  } catch (error) {
    console.error('Get user progress error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user progress: ' + error.message
    });
  }
});

// @route   GET /api/reports/analytics/performance
// @desc    Get performance analytics
// @access  Private (Admin only)
router.get('/analytics/performance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    let dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let userFilter = { isActive: true };
    if (department) userFilter.department = department;

    // Get KPI trends over time
    const kpiTrends = await KPIScore.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: { createdAt: dateFilter } }] : []),
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.isActive': true, ...(department && { 'user.department': department }) } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          averageScore: { $avg: '$overallScore' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get training completion trends
    const trainingTrends = await UserModule.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: { completedAt: dateFilter } }] : []),
      { $match: { status: 'completed' } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.isActive': true, ...(department && { 'user.department': department }) } },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' }
          },
          completions: { $sum: 1 },
          averageScore: { $avg: '$highestScore' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get department comparison
    const departmentComparison = await User.aggregate([
      { $match: userFilter },
      {
        $lookup: {
          from: 'kpiscores',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$userId'] }, isActive: true } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'latestKPI'
        }
      },
      {
        $group: {
          _id: '$department',
          userCount: { $sum: 1 },
          averageKPI: { 
            $avg: { 
              $ifNull: [{ $arrayElemAt: ['$latestKPI.overallScore', 0] }, 0] 
            }
          }
        }
      },
      { $sort: { averageKPI: -1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        kpiTrends,
        trainingTrends,
        departmentComparison
      }
    });

  } catch (error) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching performance analytics'
    });
  }
});

// @route   GET /api/reports/export/users
// @desc    Export user data (CSV format info)
// @access  Private (Admin only)
router.get('/export/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { format = 'json', department, status } = req.query;

    let query = { isActive: true };
    if (department) query.department = department;
    if (status) query.status = status;

    const users = await User.find(query)
      .select('-password')
      .lean();

    // Enhance with KPI data
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const latestKPI = await KPIScore.getLatestForUser(user._id);
        const moduleProgress = await UserModule.getUserProgress(user._id);
        
        return {
          ...user,
          latestKPIScore: latestKPI ? latestKPI.overallScore : 0,
          latestKPIRating: latestKPI ? latestKPI.rating : 'No Score',
          modulesCompleted: moduleProgress[0] ? moduleProgress[0].completedModules : 0,
          averageModuleScore: moduleProgress[0] ? Math.round(moduleProgress[0].averageScore) : 0
        };
      })
    );

    if (format === 'csv') {
      // In a real implementation, you would generate actual CSV
      res.json({
        success: true,
        message: 'CSV export functionality would be implemented here',
        data: enhancedUsers,
        downloadUrl: '/api/reports/download/users.csv'
      });
    } else {
      res.json({
        success: true,
        users: enhancedUsers,
        count: enhancedUsers.length
      });
    }

  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error exporting user data'
    });
  }
});

// NEW: User Score Reports Endpoints (ADDED WITHOUT TOUCHING EXISTING)

// @route   GET /api/reports/user-scores
// @desc    Get all user scores for admin dashboard
// @access  Private (Admin only)
router.get('/user-scores', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { searchTerm, selectedUser, sortBy, sortOrder, dateRange } = req.query;

    // Build aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'modules',
          localField: 'moduleId',
          foreignField: '_id',
          as: 'module'
        }
      },
      { $unwind: '$module' },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$user.name' },
          userEmail: { $first: '$user.email' },
          employeeId: { $first: '$user.employeeId' },
          totalModules: { $addToSet: '$moduleId' },
          completedModules: {
            $addToSet: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$moduleId', null]
            }
          },
          scores: { $push: '$score' },
          lastActivity: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          userId: '$_id',
          userName: 1,
          userEmail: 1,
          employeeId: 1,
          totalModules: { $size: '$totalModules' },
          completedModules: {
            $size: {
              $filter: {
                input: '$completedModules',
                cond: { $ne: ['$$this', null] }
              }
            }
          },
          averageScore: { $avg: '$scores' },
          lastActivity: 1
        }
      }
    ];

    // Apply filters
    if (selectedUser) {
      pipeline.push({ $match: { userId: selectedUser } });
    }

    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            { userName: { $regex: searchTerm, $options: 'i' } },
            { userEmail: { $regex: searchTerm, $options: 'i' } },
            { employeeId: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      });
    }

    // Apply sorting
    const sortField = sortBy || 'averageScore';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({ $sort: { [sortField]: sortDirection } });

    const userScores = await QuizAttempt.aggregate(pipeline);

    res.json({
      success: true,
      data: userScores
    });

  } catch (error) {
    console.error('Get user scores error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user scores'
    });
  }
});

// @route   POST /api/reports/export-user-scores
// @desc    Export user scores to CSV
// @access  Private (Admin only)
router.post('/export-user-scores', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { searchTerm, selectedUser, sortBy, sortOrder, dateRange } = req.body;

    // Get user scores data
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'modules',
          localField: 'moduleId',
          foreignField: '_id',
          as: 'module'
        }
      },
      { $unwind: '$module' },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$user.name' },
          userEmail: { $first: '$user.email' },
          employeeId: { $first: '$user.employeeId' },
          totalModules: { $addToSet: '$moduleId' },
          completedModules: {
            $addToSet: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$moduleId', null]
            }
          },
          scores: { $push: '$score' },
          lastActivity: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          userId: '$_id',
          userName: 1,
          userEmail: 1,
          employeeId: 1,
          totalModules: { $size: '$totalModules' },
          completedModules: {
            $size: {
              $filter: {
                input: '$completedModules',
                cond: { $ne: ['$$this', null] }
              }
            }
          },
          averageScore: { $avg: '$scores' },
          lastActivity: 1
        }
      }
    ];

    // Apply filters
    if (selectedUser) {
      pipeline.push({ $match: { userId: selectedUser } });
    }

    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            { userName: { $regex: searchTerm, $options: 'i' } },
            { userEmail: { $regex: searchTerm, $options: 'i' } },
            { employeeId: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      });
    }

    // Apply sorting
    const sortField = sortBy || 'averageScore';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({ $sort: { [sortField]: sortDirection } });

    const userScores = await QuizAttempt.aggregate(pipeline);

    // Generate CSV
    const csvHeader = 'User Name,Email,Employee ID,Total Modules,Completed Modules,Average Score,Completion Rate,Last Activity,Status\n';
    const csvRows = userScores.map(score => {
      const completionRate = score.totalModules > 0 ? Math.round((score.completedModules / score.totalModules) * 100) : 0;
      const status = score.totalModules > 0 ? 'Active' : 'Inactive';
      const lastActivity = score.lastActivity ? new Date(score.lastActivity).toLocaleDateString() : 'Never';
      
      return `"${score.userName || 'Unknown'}","${score.userEmail || ''}","${score.employeeId || ''}",${score.totalModules},${score.completedModules},${Math.round(score.averageScore || 0)}%,${completionRate}%,"${lastActivity}","${status}"`;
    }).join('\n');

    const csvData = csvHeader + csvRows;

    res.json({
      success: true,
      data: csvData
    });

  } catch (error) {
    console.error('Export user scores error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error exporting user scores'
    });
  }
});

// @route   POST /api/reports/export-user-scores-pdf
// @desc    Export user scores to PDF
// @access  Private (Admin only)
router.post('/export-user-scores-pdf', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { searchTerm, selectedUser, sortBy, sortOrder, dateRange } = req.body;

    // Get user scores data (same as CSV export)
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'modules',
          localField: 'moduleId',
          foreignField: '_id',
          as: 'module'
        }
      },
      { $unwind: '$module' },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$user.name' },
          userEmail: { $first: '$user.email' },
          employeeId: { $first: '$user.employeeId' },
          totalModules: { $addToSet: '$moduleId' },
          completedModules: {
            $addToSet: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$moduleId', null]
            }
          },
          scores: { $push: '$score' },
          lastActivity: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          userId: '$_id',
          userName: 1,
          userEmail: 1,
          employeeId: 1,
          totalModules: { $size: '$totalModules' },
          completedModules: {
            $size: {
              $filter: {
                input: '$completedModules',
                cond: { $ne: ['$$this', null] }
              }
            }
          },
          averageScore: { $avg: '$scores' },
          lastActivity: 1
        }
      }
    ];

    // Apply filters
    if (selectedUser) {
      pipeline.push({ $match: { userId: selectedUser } });
    }

    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            { userName: { $regex: searchTerm, $options: 'i' } },
            { userEmail: { $regex: searchTerm, $options: 'i' } },
            { employeeId: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      });
    }

    // Apply sorting
    const sortField = sortBy || 'averageScore';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({ $sort: { [sortField]: sortDirection } });

    const userScores = await QuizAttempt.aggregate(pipeline);

    // Generate PDF content (simplified - in real implementation, use a PDF library)
    const pdfContent = `
      User Score Report
      Generated on: ${new Date().toLocaleDateString()}
      
      Total Users: ${userScores.length}
      Average Score: ${userScores.length > 0 ? Math.round(userScores.reduce((sum, score) => sum + (score.averageScore || 0), 0) / userScores.length) : 0}%
      
      User Details:
      ${userScores.map(score => `
        Name: ${score.userName || 'Unknown'}
        Email: ${score.userEmail || ''}
        Employee ID: ${score.employeeId || ''}
        Total Modules: ${score.totalModules}
        Completed Modules: ${score.completedModules}
        Average Score: ${Math.round(score.averageScore || 0)}%
        Last Activity: ${score.lastActivity ? new Date(score.lastActivity).toLocaleDateString() : 'Never'}
        ---
      `).join('')}
    `;

    res.json({
      success: true,
      data: pdfContent
    });

  } catch (error) {
    console.error('Export user scores PDF error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error exporting user scores PDF'
    });
  }
});

// Helper functions
function getTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
}

function getActivityType(category, type) {
  if (category === 'positive' || type === 'award') return 'success';
  if (category === 'negative' || type === 'warning' || type === 'audit') return 'error';
  if (type === 'training') return 'info';
  return 'warning';
}

async function generateAlerts() {
  try {
    const alerts = [];

    // Low performers
    const lowPerformers = await KPIScore.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$userId',
          latestScore: { $last: '$overallScore' }
        }
      },
      { $match: { latestScore: { $lt: 60 } } }
    ]);

    if (lowPerformers.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Low Performers',
        message: `${lowPerformers.length} users have KPI scores below 60%`,
        count: lowPerformers.length,
        priority: 'high'
      });
    }

    // Overdue trainings
    const overdueTrainings = await UserModule.countDocuments({
      status: { $in: ['not_started', 'in_progress'] },
      dueDate: { $lt: new Date() }
    });

    if (overdueTrainings > 0) {
      alerts.push({
        type: 'error',
        title: 'Overdue Trainings',
        message: `${overdueTrainings} training assignments are overdue`,
        count: overdueTrainings,
        priority: 'high'
      });
    }

    // Pending audit records
    const pendingAudits = await AuditRecord.countDocuments({
      status: 'pending'
    });

    if (pendingAudits > 0) {
      alerts.push({
        type: 'warning',
        title: 'Pending Audits',
        message: `${pendingAudits} audit records require attention`,
        count: pendingAudits,
        priority: 'medium'
      });
    }

    return alerts;

  } catch (error) {
    console.error('Generate alerts error:', error);
    return [];
  }
}

module.exports = router;