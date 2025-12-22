const express = require('express');
const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress');
const Module = require('../models/Module');
const Question = require('../models/Question');
const { authenticateToken } = require('../middleware/auth');
const { validateObjectId, validateUserId, validateUserModuleParams } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/user-progress/:userId
// @desc    Get all user progress for a user
// @access  Private
router.get('/:userId', authenticateToken, validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is accessing their own data or has admin panel access
    const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];
    if (req.user._id.toString() !== userId && !adminPanelRoles.includes(req.user.userType)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own progress data'
      });
    }

    const userProgress = await UserProgress.getAllUserProgress(userId);

    res.json({
      success: true,
      userProgress
    });

  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user progress'
    });
  }
});

// @route   GET /api/user-progress/:userId/:moduleId
// @desc    Get user progress for a specific module
// @access  Private
router.get('/:userId/:moduleId', authenticateToken, validateUserModuleParams, async (req, res) => {
  try {
    const { userId, moduleId } = req.params;

    // Check if user is accessing their own data or has admin panel access
    const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];
    if (req.user._id.toString() !== userId && !adminPanelRoles.includes(req.user.userType)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own progress data'
      });
    }

    // Convert assignmentId to ObjectId if provided
    const { assignmentId } = req.query;
    let effectiveAssignmentId = null;
    if (assignmentId && typeof assignmentId === 'string' && assignmentId.length === 24) {
      try {
        effectiveAssignmentId = new mongoose.Types.ObjectId(assignmentId);
      } catch (e) {
        effectiveAssignmentId = null;
      }
    }

    const userProgress = await UserProgress.getUserProgress(userId, moduleId, effectiveAssignmentId);

    if (!userProgress) {
      // Return a default progress object instead of 404 for new modules
      // This prevents errors on the frontend for modules not yet started
      return res.json({
        success: true,
        userProgress: {
          userId,
          moduleId,
          assignmentId: effectiveAssignmentId,
          videoProgress: 0,
          videoWatched: false,
          bestScore: 0,
          bestPercentage: 0,
          passed: false,
          certificateIssued: false,
          lastVideoPosition: 0,
          status: 'not_started'
        }
      });
    }

    res.json({
      success: true,
      userProgress
    });

  } catch (error) {
    console.error('Get module progress error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching module progress'
    });
  }
});

// @route   PUT /api/user-progress/:userId/:moduleId/video
// @desc    Update video progress for a module
// @access  Private
router.put('/:userId/:moduleId/video', authenticateToken, validateUserModuleParams, async (req, res) => {
  try {
    const { userId, moduleId } = req.params;
    const { progress, assignmentId, currentTime } = req.body;

    console.log('[VideoProgress] === START ===');
    console.log('[VideoProgress] Params:', { userId, moduleId });
    console.log('[VideoProgress] Body:', { progress, assignmentId, currentTime });

    // Check if user is accessing their own data or has admin panel access
    const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];
    if (req.user._id.toString() !== userId && !adminPanelRoles.includes(req.user.userType)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own progress data'
      });
    }

    // Validate progress value
    const progressValue = Number(progress);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Progress must be a number between 0 and 100'
      });
    }

    // Convert IDs to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const moduleObjectId = new mongoose.Types.ObjectId(moduleId);

    // Convert assignmentId to ObjectId if valid, otherwise null
    let assignmentObjectId = null;
    if (assignmentId && typeof assignmentId === 'string' && assignmentId.length === 24) {
      try {
        assignmentObjectId = new mongoose.Types.ObjectId(assignmentId);
        console.log('[VideoProgress] Personalised module - assignmentId:', assignmentObjectId);
      } catch (e) {
        console.log('[VideoProgress] Invalid assignmentId, treating as regular module');
      }
    }

    // Build the query - IMPORTANT: assignmentId must match exactly (including null)
    const query = {
      userId: userObjectId,
      moduleId: moduleObjectId,
      assignmentId: assignmentObjectId
    };

    console.log('[VideoProgress] Query:', JSON.stringify(query));

    // Try to find existing progress first
    let existingProgress = await UserProgress.findOne(query);
    console.log('[VideoProgress] Existing progress found:', !!existingProgress);

    if (existingProgress) {
      // UPDATE existing record
      existingProgress.videoProgress = Math.min(100, Math.max(0, progressValue));
      existingProgress.lastAccessedAt = new Date();

      if (progressValue >= 90) {
        existingProgress.videoWatched = true;
        if (!existingProgress.videoWatchedAt) {
          existingProgress.videoWatchedAt = new Date();
        }
      }

      if (currentTime !== undefined) {
        existingProgress.lastVideoPosition = currentTime;
      }

      if (existingProgress.status === 'not_started') {
        existingProgress.status = 'in_progress';
      }

      await existingProgress.save();
      console.log('[VideoProgress] Updated existing progress to:', existingProgress.videoProgress);

      return res.json({
        success: true,
        message: 'Video progress updated successfully',
        userProgress: existingProgress.toJSON()
      });
    }

    // CREATE new record - use try-catch for duplicate key handling
    try {
      const newProgress = new UserProgress({
        userId: userObjectId,
        moduleId: moduleObjectId,
        assignmentId: assignmentObjectId,
        videoProgress: Math.min(100, Math.max(0, progressValue)),
        videoWatched: progressValue >= 90,
        videoWatchedAt: progressValue >= 90 ? new Date() : null,
        lastVideoPosition: currentTime || 0,
        lastAccessedAt: new Date(),
        bestScore: 0,
        bestPercentage: 0,
        passed: false,
        certificateIssued: false,
        quizAttempts: [],
        status: 'in_progress'
      });

      await newProgress.save();
      console.log('[VideoProgress] Created new progress record:', newProgress.videoProgress);

      return res.json({
        success: true,
        message: 'Video progress created successfully',
        userProgress: newProgress.toJSON()
      });
    } catch (saveError) {
      // Handle duplicate key error - try to find and update instead
      if (saveError.code === 11000) {
        console.log('[VideoProgress] Duplicate key detected, retrying with findOneAndUpdate');

        const updated = await UserProgress.findOneAndUpdate(
          query,
          {
            $set: {
              videoProgress: Math.min(100, Math.max(0, progressValue)),
              lastAccessedAt: new Date(),
              ...(progressValue >= 90 && { videoWatched: true, videoWatchedAt: new Date() }),
              ...(currentTime !== undefined && { lastVideoPosition: currentTime }),
              status: 'in_progress'
            }
          },
          { new: true }
        );

        if (updated) {
          console.log('[VideoProgress] Updated via retry:', updated.videoProgress);
          return res.json({
            success: true,
            message: 'Video progress updated successfully (retry)',
            userProgress: updated.toJSON()
          });
        }
      }

      throw saveError;
    }

  } catch (error) {
    console.error('[VideoProgress] ERROR:', error.message);
    console.error('[VideoProgress] Stack:', error.stack);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating video progress',
      details: error.message
    });
  }
});

// @route   POST /api/user-progress/:userId/:moduleId/quiz
// @desc    Submit quiz answers and calculate results
// @access  Private
router.post('/:userId/:moduleId/quiz', authenticateToken, validateUserModuleParams, async (req, res) => {
  try {
    const { userId, moduleId } = req.params;
    const { answers, assignmentId } = req.body;

    // Check if user is accessing their own data or has admin panel access
    const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];
    if (req.user._id.toString() !== userId && !adminPanelRoles.includes(req.user.userType)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only submit your own quiz answers'
      });
    }

    // Validate answers
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Answers must be an array'
      });
    }

    // Check if module exists
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        error: 'Module not found',
        message: 'Module does not exist'
      });
    }

    // Get questions for this module
    const questions = await Question.getByModule(moduleId);
    if (questions.length === 0) {
      return res.status(400).json({
        error: 'No Questions',
        message: 'This module has no questions available'
      });
    }

    // Calculate results
    let score = 0;
    let totalMarks = 0;
    const answerDetails = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = answers[i];

      totalMarks += question.marks;

      const isCorrect = question.isCorrectAnswer(userAnswer);
      if (isCorrect) {
        score += question.marks;
      }

      answerDetails.push({
        questionId: question._id,
        selectedAnswer: userAnswer,
        isCorrect,
        marks: isCorrect ? question.marks : 0
      });
    }

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const passed = percentage >= module.passPercentage;

    // Get or create user progress
    let userProgress = await UserProgress.getUserProgress(userId, moduleId, assignmentId);

    if (!userProgress) {
      userProgress = new UserProgress({
        userId,
        moduleId,
        assignmentId: assignmentId || null,
        videoProgress: 0,
        videoWatched: false,
        bestScore: 0,
        bestPercentage: 0,
        passed: false,
        certificateIssued: false
      });
    }

    // Add quiz attempt
    const attemptData = {
      score,
      totalMarks,
      percentage,
      passed,
      answers: answerDetails,
      timeTaken: 0, // Could be calculated if needed
      completedAt: new Date()
    };

    await userProgress.addQuizAttempt(attemptData);

    // Issue certificate if passed
    if (passed) {
      await userProgress.issueCertificate();
    }

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      results: {
        score,
        totalMarks,
        percentage,
        passed,
        passPercentage: module.passPercentage,
        certificateIssued: userProgress.certificateIssued
      },
      userProgress: userProgress.toJSON()
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error submitting quiz'
    });
  }
});

// @route   GET /api/user-progress/:userId/stats
// @desc    Get user statistics
// @access  Private
router.get('/:userId/stats', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is accessing their own data or has admin panel access
    const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];
    if (req.user._id.toString() !== userId && !adminPanelRoles.includes(req.user.userType)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own statistics'
      });
    }

    const stats = await UserProgress.getUserStats(userId);

    res.json({
      success: true,
      stats: stats[0] || {
        totalModules: 0,
        completedModules: 0,
        averageScore: 0,
        totalCertificates: 0
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user statistics'
    });
  }
});

// @route   GET /api/user-progress/:userId/completed
// @desc    Get completed modules for a user
// @access  Private
router.get('/:userId/completed', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is accessing their own data or has admin panel access
    const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];
    if (req.user._id.toString() !== userId && !adminPanelRoles.includes(req.user.userType)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own completed modules'
      });
    }

    const completedModules = await UserProgress.getCompletedModules(userId);

    res.json({
      success: true,
      completedModules
    });

  } catch (error) {
    console.error('Get completed modules error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching completed modules'
    });
  }
});

module.exports = router;
