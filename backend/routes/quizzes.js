const express = require('express');
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const Module = require('../models/Module');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/quizzes
// @desc    Get all quizzes (All authenticated users)
// @access  Private (All authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Admin gets all quizzes, users get only quizzes for published modules
    let query = { isActive: true };
    if (req.user.userType !== 'admin') {
      // For users, only show quizzes for published modules
      const publishedModules = await Module.find({ status: 'published' }).select('_id');
      const publishedModuleIds = publishedModules.map(m => m._id);
      query = { ...query, moduleId: { $in: publishedModuleIds } };
    }
    
    console.log('Fetching quizzes with query:', query);
    console.log('User type:', req.user.userType);
    
    const quizzes = await Quiz.find(query)
      .populate('moduleId', 'title status')
      .sort({ createdAt: -1 });

    console.log('Quizzes found:', quizzes.length);
    if (quizzes.length > 0) {
      console.log('First quiz sample:', {
        _id: quizzes[0]._id,
        moduleId: quizzes[0].moduleId,
        questionsCount: quizzes[0].questions?.length || 0
      });
    }

    res.json({
      success: true,
      quizzes: quizzes
    });

  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching quizzes'
    });
  }
});

// @route   GET /api/quizzes/:moduleId
// @desc    Get quiz for specific module (All authenticated users)
// @access  Private (All authenticated users)
router.get('/:moduleId', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ 
      moduleId: req.params.moduleId, 
      isActive: true 
    }).populate('moduleId', 'title');

    if (!quiz) {
      return res.status(404).json({
        error: 'Quiz not found',
        message: 'No quiz found for this module'
      });
    }

    res.json({
      success: true,
      quiz: quiz
    });

  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching quiz'
    });
  }
});

// @route   POST /api/quizzes
// @desc    Create new quiz (Admin only)
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { moduleId, questions, passPercent, estimatedTime } = req.body;

    // Validate required fields
    if (!moduleId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Module ID and questions array are required'
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

    // Check if quiz already exists for this module
    const existingQuiz = await Quiz.findOne({ moduleId });
    if (existingQuiz) {
      return res.status(409).json({
        error: 'Quiz already exists',
        message: 'A quiz already exists for this module'
      });
    }

    const quiz = new Quiz({
      moduleId,
      questions,
      passPercent: passPercent || 70,
      estimatedTime: estimatedTime || 10
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz: quiz
    });

  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating quiz'
    });
  }
});

// @route   PUT /api/quizzes/:moduleId
// @desc    Update quiz (Admin only)
// @access  Private (Admin only)
router.put('/:moduleId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { questions, passPercent, estimatedTime, isActive } = req.body;

    const quiz = await Quiz.findOne({ moduleId: req.params.moduleId });

    if (!quiz) {
      return res.status(404).json({
        error: 'Quiz not found',
        message: 'Quiz does not exist'
      });
    }

    if (questions) quiz.questions = questions;
    if (passPercent !== undefined) quiz.passPercent = passPercent;
    if (estimatedTime !== undefined) quiz.estimatedTime = estimatedTime;
    if (isActive !== undefined) quiz.isActive = isActive;

    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      quiz: quiz
    });

  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating quiz'
    });
  }
});

// @route   DELETE /api/quizzes/:moduleId
// @desc    Delete quiz (Admin only)
// @access  Private (Admin only)
router.delete('/:moduleId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ moduleId: req.params.moduleId });

    if (!quiz) {
      return res.status(404).json({
        error: 'Quiz not found',
        message: 'Quiz does not exist'
      });
    }

    await Quiz.findByIdAndDelete(quiz._id);

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting quiz'
    });
  }
});

// @route   POST /api/quizzes/:moduleId/upload-csv
// @desc    Upload questions via CSV (Admin only)
// @access  Private (Admin only)
router.post('/:moduleId/upload-csv', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { csvData } = req.body;

    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'CSV data array is required'
      });
    }

    // Handle both parsed questions format and raw CSV format
    let questions;
    
    if (csvData[0] && typeof csvData[0] === 'object' && csvData[0].question) {
      // Frontend has already parsed the CSV - use directly
      questions = csvData.map((row, index) => {
        if (!row.question || !row.options || !Array.isArray(row.options) || row.options.length < 2) {
          throw new Error(`Row ${index + 1}: question and at least 2 options are required`);
        }

        const correctOption = parseInt(row.correctOption);
        if (isNaN(correctOption) || correctOption < 0 || correctOption >= row.options.length) {
          throw new Error(`Row ${index + 1}: correctOption must be between 0 and ${row.options.length - 1}`);
        }

        return {
          question: row.question.trim(),
          options: row.options.map(opt => opt.trim()),
          correctOption: correctOption,
          explanation: row.explanation || '',
          marks: parseInt(row.marks) || 1
        };
      });
    } else {
      // Raw CSV format: question,optionA,optionB,optionC,optionD,correctOption
      questions = csvData.map((row, index) => {
        if (!row.question || !row.optionA || !row.optionB || !row.optionC || !row.optionD) {
          throw new Error(`Row ${index + 1}: question and all 4 options are required`);
        }

        const correctOption = parseInt(row.correctOption);
        if (isNaN(correctOption) || correctOption < 0 || correctOption > 3) {
          throw new Error(`Row ${index + 1}: correctOption must be 0, 1, 2, or 3`);
        }

        return {
          question: row.question.trim(),
          options: [
            row.optionA.trim(),
            row.optionB.trim(),
            row.optionC.trim(),
            row.optionD.trim()
          ],
          correctOption: correctOption,
          explanation: row.explanation || '',
          marks: parseInt(row.marks) || 1
        };
      });
    }

    // Update or create quiz
    let quiz = await Quiz.findOne({ moduleId: req.params.moduleId });
    
    if (quiz) {
      quiz.questions = questions;
    } else {
      quiz = new Quiz({
        moduleId: req.params.moduleId,
        questions,
        passPercent: 70,
        estimatedTime: 10
      });
    }

    await quiz.save();

    res.json({
      success: true,
      message: `Quiz updated with ${questions.length} questions`,
      quiz: quiz
    });

  } catch (error) {
    console.error('Upload CSV error:', error);
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }
});

// @route   POST /api/quiz/submit
// @desc    Submit quiz attempt (All authenticated users)
// @access  Private (All authenticated users)
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { userId, moduleId, answers, timeTaken } = req.body;

    // Validate required fields
    if (!userId || !moduleId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User ID, module ID, and answers array are required'
      });
    }

    // Get the quiz for this module
    const quiz = await Quiz.findOne({ moduleId, isActive: true });
    if (!quiz) {
      return res.status(404).json({
        error: 'Quiz not found',
        message: 'No quiz available for this module'
      });
    }

    // Calculate score
    let score = 0;
    const evaluatedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[index];
      const isCorrect = answer.selectedOption === question.correctOption;
      if (isCorrect) score++;
      
      return {
        questionIndex: index,
        selectedOption: answer.selectedOption,
        isCorrect,
        timeSpent: answer.timeSpent || 0
      };
    });

    const percentage = Math.round((score / quiz.questions.length) * 100);
    const passed = percentage >= quiz.passPercent;

    // Get attempt number
    const previousAttempts = await QuizResult.countDocuments({ userId, moduleId });
    const attemptNumber = previousAttempts + 1;

    // Create quiz result
    const quizResult = new QuizResult({
      userId,
      moduleId,
      quizId: quiz._id,
      score,
      total: quiz.questions.length,
      percentage,
      passed,
      answers: evaluatedAnswers,
      timeTaken: timeTaken || 0,
      attemptNumber,
      completedAt: new Date()
    });

    await quizResult.save();

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      result: {
        score,
        total: quiz.questions.length,
        percentage,
        passed,
        timeTaken: timeTaken || 0
      }
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error submitting quiz'
    });
  }
});

// @route   GET /api/quiz/results/:userId
// @desc    Get quiz results for a user (Admin only)
// @access  Private (Admin only)
router.get('/results/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const results = await QuizResult.find({ userId: req.params.userId })
      .populate('moduleId', 'title')
      .populate('quizId', 'passPercent')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching quiz results'
    });
  }
});

module.exports = router;
