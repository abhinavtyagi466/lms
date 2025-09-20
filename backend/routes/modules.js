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

    // Get all published modules
    const modules = await Module.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .select('title description ytVideoId tags status createdBy');

    // Get user's progress for all videos
    const userProgress = await Progress.find({ userId });

    // Get all quizzes for the modules
    const moduleIds = modules.map(module => module._id);
    const quizzes = await Quiz.find({ 
      moduleId: { $in: moduleIds }, 
      isActive: true 
    });

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

    // Combine modules with progress and quiz availability
    const modulesWithProgress = modules.map(module => {
      const progress = progressMap[module.ytVideoId] || { currentTime: 0, duration: 0 };
      const progressPercent = progress.duration > 0 ? (progress.currentTime / progress.duration) : 0;
      const quiz = quizMap[module._id.toString()];
      
      return {
        moduleId: module._id,
        title: module.title,
        description: module.description,
        ytVideoId: module.ytVideoId,
        tags: module.tags,
        status: module.status,
        progress: progressPercent,
        quizAvailable: quiz ? progressPercent >= 0.95 : false,
        quizInfo: quiz || null
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

module.exports = router;