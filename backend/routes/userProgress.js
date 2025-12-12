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

    const { assignmentId } = req.query;
    const userProgress = await UserProgress.getUserProgress(userId, moduleId, assignmentId);

    if (!userProgress) {
      return res.status(404).json({
        error: 'Progress not found',
        message: 'No progress found for this module'
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
    const { progress, assignmentId } = req.body;

    // Check if user is accessing their own data or has admin panel access
    const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];
    if (req.user._id.toString() !== userId && !adminPanelRoles.includes(req.user.userType)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own progress data'
      });
    }

    // Validate progress value
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Progress must be between 0 and 100'
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

    // Update video progress
    if (req.body.currentTime !== undefined) {
      userProgress.lastVideoPosition = req.body.currentTime;
    }
    await userProgress.updateVideoProgress(progress);

    res.json({
      success: true,
      message: 'Video progress updated successfully',
      userProgress: userProgress.toJSON()
    });

  } catch (error) {
    console.error('Update video progress error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating video progress'
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
