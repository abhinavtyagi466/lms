const express = require('express');
const mongoose = require('mongoose');
const Progress = require('../models/Progress');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/progress
// @desc    Update video progress (every 5 seconds)
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId, videoId, currentTime, duration } = req.body;

    // Validate required fields
    if (!userId || !videoId || currentTime === undefined || duration === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userId, videoId, currentTime, and duration are required'
      });
    }

    // Validate data types
    if (typeof currentTime !== 'number' || typeof duration !== 'number') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'currentTime and duration must be numbers'
      });
    }

    // Validate ranges
    if (currentTime < 0 || duration < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'currentTime and duration cannot be negative'
      });
    }

    // Check if user is updating their own progress or is admin
    if (req.user._id.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own progress'
      });
    }

    // Find existing progress or create new one
    let progress = await Progress.getVideoProgress(userId, videoId);
    
    if (progress) {
      // Update existing progress
      await progress.updateProgress(currentTime, duration);
    } else {
      // Create new progress record
      progress = new Progress({
        userId,
        videoId,
        currentTime,
        duration
      });
      await progress.save();
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      progress: {
        userId: progress.userId,
        videoId: progress.videoId,
        currentTime: progress.currentTime,
        duration: progress.duration,
        lastUpdated: progress.lastUpdated
      }
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating progress'
    });
  }
});

// @route   GET /api/progress/:userId
// @desc    Get all progress for a user
// @access  Private
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own progress data'
      });
    }

    const progressRecords = await Progress.getUserProgress(userId);

    // Format response as requested
    const progress = {};
    progressRecords.forEach(record => {
      progress[record.videoId] = {
        currentTime: record.currentTime,
        duration: record.duration
      };
    });

    res.json({
      success: true,
      userId: userId,
      progress: progress
    });

  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user progress'
    });
  }
});

// @route   GET /api/progress/:userId/:videoId
// @desc    Get progress for a specific video
// @access  Private
router.get('/:userId/:videoId', authenticateToken, async (req, res) => {
  try {
    const { userId, videoId } = req.params;

    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own progress data'
      });
    }

    const progress = await Progress.getVideoProgress(userId, videoId);

    if (!progress) {
      return res.status(404).json({
        error: 'Progress not found',
        message: 'No progress found for this video'
      });
    }

    res.json({
      success: true,
      progress: {
        userId: progress.userId,
        videoId: progress.videoId,
        currentTime: progress.currentTime,
        duration: progress.duration,
        lastUpdated: progress.lastUpdated
      }
    });

  } catch (error) {
    console.error('Get video progress error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching video progress'
    });
  }
});

module.exports = router;
