const express = require('express');
const mongoose = require('mongoose');
const Module = require('../models/Module');
const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/modules
// @desc    Get all modules (All authenticated users)
// @access  Private (All authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Admin gets all modules, users get only published modules
    let query = {};
    if (req.user.userType !== 'admin') {
      query = { status: 'published' };
    }
    
    const modules = await Module.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      modules: modules
    });

  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching modules'
    });
  }
});

// @route   GET /api/modules/user
// @desc    Get all published modules for users
// @access  Private (All authenticated users)
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const modules = await Module.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .select('title description ytVideoId tags status createdBy');

    res.json({
      success: true,
      modules: modules
    });

  } catch (error) {
    console.error('Get user modules error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching modules'
    });
  }
});

// @route   GET /api/modules/user/:userId
// @desc    Get all published modules for a specific user with progress and quiz availability
// @access  Private (User can access own data, admin can access any)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own module data'
      });
    }

    // Get all regular modules for the user (published only)
    const regularModules = await Module.find({ 
      status: 'published',
      isPersonalised: { $ne: true } // Exclude personalised modules
    })
      .sort({ createdAt: 1 }) // Sort by creation date (oldest first) for sequential processing
      .select('title description ytVideoId tags status createdBy');

    // Get personalised modules assigned to this user
    const personalisedModules = await Module.find({
      status: 'published',
      isPersonalised: true,
      assignedTo: userId
    })
      .sort({ personalisedAt: 1 }) // Sort by personalisation date
      .select('title description ytVideoId tags status createdBy isPersonalised personalisedReason personalisedPriority personalisedBy personalisedAt');

    // Combine regular and personalised modules
    const modules = [...regularModules, ...personalisedModules];

    // Get user's progress for all videos
    const userProgress = await Progress.find({ userId });

    // Get all quizzes for the modules
    const moduleIds = modules.map(module => module._id);
    const quizzes = await Quiz.find({ 
      moduleId: { $in: moduleIds }, 
      isActive: true 
    });

    // Get quiz results for the user (to check which quizzes are passed)
    const QuizResult = require('../models/QuizResult');
    const quizResults = await QuizResult.find({
      userId,
      moduleId: { $in: moduleIds },
      passed: true
    }).select('moduleId passed percentage');

    // Create a map of video progress
    const progressMap = {};
    userProgress.forEach(progress => {
      progressMap[progress.videoId] = {
        currentTime: progress.currentTime,
        duration: progress.duration
      };
    });

    // Create a map of quiz availability
    const quizMap = {};
    quizzes.forEach(quiz => {
      quizMap[quiz.moduleId.toString()] = {
        hasQuiz: true,
        questionCount: quiz.questions.length,
        estimatedTime: quiz.estimatedTime
      };
    });

    // Create a map of passed modules
    const passedModulesMap = {};
    quizResults.forEach(result => {
      passedModulesMap[result.moduleId.toString()] = {
        passed: result.passed,
        percentage: result.percentage
      };
    });

    // SEQUENTIAL UNLOCK LOGIC: User must complete previous module to unlock next
    let previousModuleCompleted = true; // First module is always unlocked
    let regularModuleIndex = 0; // Track regular module index for sequential unlock
    
    const modulesWithProgress = modules.map((module, index) => {
      const progress = progressMap[module.ytVideoId] || { currentTime: 0, duration: 0 };
      const progressPercent = progress.duration > 0 ? (progress.currentTime / progress.duration) : 0;
      const quiz = quizMap[module._id.toString()];
      const quizPassed = passedModulesMap[module._id.toString()];
      
      // Check if this module is completed (video watched 95% + quiz passed with 70%+)
      const videoCompleted = progressPercent >= 0.95;
      const quizCompleted = quiz ? (quizPassed?.passed || false) : videoCompleted;
      const moduleCompleted = videoCompleted && quizCompleted;
      
      // Determine if module is locked
      let isLocked = false;
      let unlockMessage = null;
      
      if (module.isPersonalised) {
        // Personalised modules are always unlocked (no sequential requirement)
        isLocked = false;
        unlockMessage = null;
      } else {
        // Regular modules follow sequential unlock logic
        isLocked = regularModuleIndex > 0 && !previousModuleCompleted;
        unlockMessage = isLocked ? 'Complete the previous module (video + quiz) to unlock' : null;
        
        // Update for next regular module iteration
        if (!isLocked) {
          previousModuleCompleted = moduleCompleted;
        }
        regularModuleIndex++;
      }
      
      return {
        moduleId: module._id,
        title: module.title,
        description: module.description,
        ytVideoId: module.ytVideoId,
        tags: module.tags,
        status: module.status,
        progress: progressPercent,
        quizAvailable: quiz ? (progressPercent >= 0.95 && !isLocked) : false,
        quizInfo: quiz || null,
        quizPassed: quizPassed?.passed || false,
        quizScore: quizPassed?.percentage || 0,
        isLocked: isLocked,
        isCompleted: moduleCompleted,
        unlockMessage: unlockMessage,
        // Personalised module fields
        isPersonalised: module.isPersonalised || false,
        personalisedReason: module.personalisedReason || null,
        personalisedPriority: module.personalisedPriority || null,
        personalisedBy: module.personalisedBy || null,
        personalisedAt: module.personalisedAt || null
      };
    });

    res.json({
      success: true,
      modules: modulesWithProgress
    });

  } catch (error) {
    console.error('Get user modules with progress error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user modules with progress'
    });
  }
});


// @route   GET /api/modules/public
// @desc    Get public module information (no auth required)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const modules = await Module.find({ isActive: true, status: 'published' })
      .sort({ order: 1, createdAt: -1 })
      .select('title description duration difficulty category totalQuestions thumbnail tags');

    res.json({
      success: true,
      modules: modules
    });

  } catch (error) {
    console.error('Get public modules error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching modules'
    });
  }
});

// @route   POST /api/modules
// @desc    Create new module (Admin only)
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, ytVideoId, tags, status } = req.body;

    // Validate required fields
    if (!title || !ytVideoId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title and YouTube Video ID are required'
      });
    }

    const module = new Module({
      title: title.trim(),
      description: description?.trim() || '',
      ytVideoId: ytVideoId.trim(),
      tags: tags || [],
      status: status || 'draft',
      createdBy: req.user._id
    });

    await module.save();

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      module: module
    });

  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating module'
    });
  }
});

// @route   GET /api/modules/:id
// @desc    Get single module by ID
// @access  Private (All authenticated users)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!module) {
      return res.status(404).json({
        error: 'Module not found',
        message: 'Module does not exist'
      });
    }

    // Users can only access published modules (unless they're admin)
    if (req.user.userType !== 'admin' && module.status !== 'published') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'This module is not available'
      });
    }

    res.json({
      success: true,
      module: module
    });

  } catch (error) {
    console.error('Get module by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching module'
    });
  }
});

// @route   DELETE /api/modules/:id
// @desc    Delete module (Admin only)
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        error: 'Module not found',
        message: 'Module does not exist'
      });
    }

    await Module.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });

  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting module'
    });
  }
});

// @route   POST /api/modules/personalised
// @desc    Create personalised module assignment
// @access  Private (Admin only)
router.post('/personalised', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, moduleId, reason, priority } = req.body;

    if (!userId || !moduleId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'User ID, Module ID, and reason are required'
      });
    }

    // Find the module
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check if user exists
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create a copy of the module for personalised assignment
    const personalisedModule = new Module({
      ...module.toObject(),
      _id: new mongoose.Types.ObjectId(), // Generate new ID
      isPersonalised: true,
      assignedTo: [userId],
      personalisedBy: req.user._id,
      personalisedAt: new Date(),
      personalisedReason: reason,
      personalisedPriority: priority || 'medium',
      status: 'published' // Make it immediately available to the user
    });

    await personalisedModule.save();

    // Also create personalised quiz if original module has one
    const originalQuiz = await Quiz.findOne({ moduleId: moduleId });
    if (originalQuiz) {
      const personalisedQuiz = new Quiz({
        ...originalQuiz.toObject(),
        _id: new mongoose.Types.ObjectId(), // Generate new ID
        moduleId: personalisedModule._id,
        isPersonalised: true,
        assignedTo: [userId],
        personalisedBy: req.user._id,
        personalisedAt: new Date(),
        personalisedReason: reason,
        personalisedPriority: priority || 'medium'
      });

      await personalisedQuiz.save();
    }

    res.json({
      success: true,
      message: 'Personalised module assigned successfully',
      data: {
        personalisedModuleId: personalisedModule._id,
        originalModuleId: moduleId,
        assignedTo: userId,
        reason: reason,
        priority: priority
      }
    });

  } catch (error) {
    console.error('Create personalised module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating personalised module',
      error: error.message
    });
  }
});

// @route   GET /api/modules/personalised/:userId
// @desc    Get personalised modules for a specific user
// @access  Private (Admin or same user)
router.get('/personalised/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user can access this data
    if (req.user.userType !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const personalisedModules = await Module.find({
      isPersonalised: true,
      assignedTo: userId,
      status: 'published'
    })
    .sort({ personalisedAt: -1 })
    .populate('personalisedBy', 'name email')
    .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: personalisedModules
    });

  } catch (error) {
    console.error('Get personalised modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching personalised modules',
      error: error.message
    });
  }
});

// @route   DELETE /api/modules/personalised/:moduleId
// @desc    Remove personalised module assignment
// @access  Private (Admin only)
router.delete('/personalised/:moduleId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { moduleId } = req.params;

    const module = await Module.findOneAndDelete({
      _id: moduleId,
      isPersonalised: true
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Personalised module not found'
      });
    }

    // Also delete associated personalised quiz
    await Quiz.deleteMany({
      moduleId: moduleId,
      isPersonalised: true
    });

    res.json({
      success: true,
      message: 'Personalised module removed successfully'
    });

  } catch (error) {
    console.error('Delete personalised module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing personalised module',
      error: error.message
    });
  }
});

module.exports = router;