const express = require('express');
const QuizAttempt = require('../models/QuizAttempt');
const QuizResult = require('../models/QuizResult');
const User = require('../models/User');
const Module = require('../models/Module');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUserId, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// ========================================
// USER QUIZ ATTEMPT ROUTES
// ========================================

// @route   GET /api/quiz-attempts/user/:userId
// @desc    Get user's quiz attempts with pagination
// @access  Private
router.get('/user/:userId', authenticateToken, validateUserId, validatePagination, async (req, res) => {
  try {
    const { userId } = req.params;
    const { moduleId, limit = 10, page = 1 } = req.query;
    
    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own quiz attempts'
      });
    }

    const query = { userId };
    if (moduleId) query.moduleId = moduleId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [attempts, total] = await Promise.all([
      QuizAttempt.find(query)
        .populate('moduleId', 'title')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      QuizAttempt.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: attempts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user quiz attempts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch quiz attempts'
    });
  }
});

// @route   GET /api/quiz-attempts/stats/:userId
// @desc    Get user's quiz attempt statistics
// @access  Private
router.get('/stats/:userId', authenticateToken, validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own quiz statistics'
      });
    }

    // Get all quiz attempts for the user
    const attempts = await QuizAttempt.find({ userId })
      .populate('moduleId', 'title')
      .sort({ startTime: -1 });

    if (attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          totalAttempts: 0,
          totalQuizzes: 0,
          averageScore: 0,
          passRate: 0,
          totalTimeSpent: 0,
          violations: 0,
          recentAttempts: [],
          moduleStats: []
        }
      });
    }

    // Calculate statistics
    const totalAttempts = attempts.length;
    const uniqueModules = new Set(attempts.map(a => a.moduleId._id.toString()));
    const totalQuizzes = uniqueModules.size;
    
    const completedAttempts = attempts.filter(a => a.status === 'completed');
    const averageScore = completedAttempts.length > 0 
      ? completedAttempts.reduce((sum, a) => sum + a.score, 0) / completedAttempts.length 
      : 0;
    
    const passedAttempts = completedAttempts.filter(a => a.passed);
    const passRate = completedAttempts.length > 0 
      ? (passedAttempts.length / completedAttempts.length) * 100 
      : 0;
    
    const totalTimeSpent = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    const violations = attempts.reduce((sum, a) => sum + a.violations.length, 0);
    
    // Get recent attempts (last 10)
    const recentAttempts = attempts.slice(0, 10);
    
    // Calculate module-specific stats
    const moduleStats = Array.from(uniqueModules).map(moduleId => {
      const moduleAttempts = attempts.filter(a => a.moduleId._id.toString() === moduleId);
      const moduleTitle = moduleAttempts[0]?.moduleId?.title || 'Unknown Module';
      const bestScore = Math.max(...moduleAttempts.map(a => a.score));
      const lastAttempt = moduleAttempts[0]?.startTime;
      const passed = moduleAttempts.some(a => a.passed);
      
      return {
        moduleId,
        moduleTitle,
        attempts: moduleAttempts.length,
        bestScore,
        lastAttempt,
        passed
      };
    });

    res.json({
      success: true,
      data: {
        totalAttempts,
        totalQuizzes,
        averageScore,
        passRate,
        totalTimeSpent,
        violations,
        recentAttempts,
        moduleStats
      }
    });
  } catch (error) {
    console.error('Error fetching quiz attempt stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch quiz statistics'
    });
  }
});

// @route   GET /api/quiz-attempts/history/:userId
// @desc    Get user's quiz attempt history
// @access  Private
router.get('/history/:userId', authenticateToken, validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const { moduleId } = req.query;
    
    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own quiz history'
      });
    }

    const query = { userId };
    if (moduleId) query.moduleId = moduleId;

    const attempts = await QuizAttempt.find(query)
      .populate('moduleId', 'title')
      .sort({ startTime: -1 })
      .limit(50); // Limit to last 50 attempts

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    console.error('Error fetching quiz attempt history:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch quiz history'
    });
  }
});

// @route   GET /api/quiz-attempts/violations/:userId
// @desc    Get user's quiz violations
// @access  Private
router.get('/violations/:userId', authenticateToken, validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own quiz violations'
      });
    }

    const attempts = await QuizAttempt.find({ 
      userId, 
      'violations.0': { $exists: true } 
    })
      .populate('moduleId', 'title')
      .sort({ startTime: -1 });

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    console.error('Error fetching quiz violations:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch quiz violations'
    });
  }
});

// ========================================
// ADMIN QUIZ ATTEMPT ROUTES
// ========================================

// @route   GET /api/quiz-attempts
// @desc    Get all quiz attempts (Admin only)
// @access  Private (Admin only)
router.get('/', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const { userId, moduleId, status, limit = 20, page = 1 } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    if (moduleId) query.moduleId = moduleId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [attempts, total] = await Promise.all([
      QuizAttempt.find(query)
        .populate('userId', 'name email employeeId')
        .populate('moduleId', 'title')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      QuizAttempt.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: attempts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all quiz attempts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch quiz attempts'
    });
  }
});

// @route   GET /api/quiz-attempts/analytics
// @desc    Get quiz attempt analytics (Admin only)
// @access  Private (Admin only)
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, moduleId } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    if (moduleId) query.moduleId = moduleId;

    const attempts = await QuizAttempt.find(query)
      .populate('userId', 'name email employeeId')
      .populate('moduleId', 'title')
      .sort({ startTime: -1 });

    // Calculate analytics
    const totalAttempts = attempts.length;
    const uniqueUsers = new Set(attempts.map(a => a.userId._id.toString()));
    const uniqueModules = new Set(attempts.map(a => a.moduleId._id.toString()));
    
    const completedAttempts = attempts.filter(a => a.status === 'completed');
    const averageScore = completedAttempts.length > 0 
      ? completedAttempts.reduce((sum, a) => sum + a.score, 0) / completedAttempts.length 
      : 0;
    
    const passedAttempts = completedAttempts.filter(a => a.passed);
    const passRate = completedAttempts.length > 0 
      ? (passedAttempts.length / completedAttempts.length) * 100 
      : 0;
    
    const violations = attempts.reduce((sum, a) => sum + a.violations.length, 0);
    
    // User performance ranking
    const userStats = Array.from(uniqueUsers).map(userId => {
      const userAttempts = attempts.filter(a => a.userId._id.toString() === userId);
      const userCompleted = userAttempts.filter(a => a.status === 'completed');
      const userPassed = userCompleted.filter(a => a.passed);
      const userAvgScore = userCompleted.length > 0 
        ? userCompleted.reduce((sum, a) => sum + a.score, 0) / userCompleted.length 
        : 0;
      const userPassRate = userCompleted.length > 0 
        ? (userPassed.length / userCompleted.length) * 100 
        : 0;
      
      return {
        userId,
        userName: userAttempts[0]?.userId?.name || 'Unknown',
        userEmail: userAttempts[0]?.userId?.email || 'Unknown',
        employeeId: userAttempts[0]?.userId?.employeeId || 'Unknown',
        totalAttempts: userAttempts.length,
        completedAttempts: userCompleted.length,
        averageScore: userAvgScore,
        passRate: userPassRate,
        violations: userAttempts.reduce((sum, a) => sum + a.violations.length, 0)
      };
    }).sort((a, b) => b.averageScore - a.averageScore);

    // Module performance
    const moduleStats = Array.from(uniqueModules).map(moduleId => {
      const moduleAttempts = attempts.filter(a => a.moduleId._id.toString() === moduleId);
      const moduleCompleted = moduleAttempts.filter(a => a.status === 'completed');
      const modulePassed = moduleCompleted.filter(a => a.passed);
      const moduleAvgScore = moduleCompleted.length > 0 
        ? moduleCompleted.reduce((sum, a) => sum + a.score, 0) / moduleCompleted.length 
        : 0;
      const modulePassRate = moduleCompleted.length > 0 
        ? (modulePassed.length / moduleCompleted.length) * 100 
        : 0;
      
      return {
        moduleId,
        moduleTitle: moduleAttempts[0]?.moduleId?.title || 'Unknown Module',
        totalAttempts: moduleAttempts.length,
        completedAttempts: moduleCompleted.length,
        averageScore: moduleAvgScore,
        passRate: modulePassRate,
        violations: moduleAttempts.reduce((sum, a) => sum + a.violations.length, 0)
      };
    }).sort((a, b) => b.averageScore - a.averageScore);

    res.json({
      success: true,
      data: {
        summary: {
          totalAttempts,
          uniqueUsers: uniqueUsers.size,
          uniqueModules: uniqueModules.size,
          averageScore,
          passRate,
          violations
        },
        userStats,
        moduleStats,
        recentAttempts: attempts.slice(0, 20)
      }
    });
  } catch (error) {
    console.error('Error fetching quiz attempt analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch quiz analytics'
    });
  }
});

// @route   GET /api/quiz-attempts/:attemptId
// @desc    Get specific quiz attempt details
// @access  Private
router.get('/:attemptId', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    const attempt = await QuizAttempt.findById(attemptId)
      .populate('userId', 'name email employeeId')
      .populate('moduleId', 'title');

    if (!attempt) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Quiz attempt not found'
      });
    }

    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== attempt.userId._id.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own quiz attempts'
      });
    }

    res.json({
      success: true,
      data: attempt
    });
  } catch (error) {
    console.error('Error fetching quiz attempt:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch quiz attempt'
    });
  }
});

module.exports = router;
