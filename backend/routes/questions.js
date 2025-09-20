const express = require('express');
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Module = require('../models/Module');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/questions/module/:moduleId
// @desc    Get all questions for a module (Admin only)
// @access  Private (Admin only)
router.get('/module/:moduleId', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const questions = await Question.find({ moduleId, isActive: true })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Question.countDocuments({ moduleId, isActive: true });

    res.json({
      questions,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching questions'
    });
  }
});

// @route   POST /api/questions
// @desc    Create new question (Admin only)
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      moduleId,
      question,
      options,
      correctAnswer,
      explanation,
      marks,
      questionType,
      difficulty
    } = req.body;

    // Validate required fields
    if (!moduleId || !question || !options || correctAnswer === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Module ID, question, options, and correct answer are required'
      });
    }

    // Validate options array
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'At least 2 options are required'
      });
    }

    // Validate correct answer index
    if (correctAnswer < 0 || correctAnswer >= options.length) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Correct answer index must be valid'
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

    const newQuestion = new Question({
      moduleId,
      question: question.trim(),
      options: options.map(option => option.trim()),
      correctAnswer: parseInt(correctAnswer),
      explanation: explanation ? explanation.trim() : '',
      marks: marks || 1,
      questionType: questionType || 'multiple_choice',
      difficulty: difficulty || 'medium'
    });

    await newQuestion.save();

    // Update module question count
    await Module.findByIdAndUpdate(moduleId, {
      $inc: { totalQuestions: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question: newQuestion.toJSON()
    });

  } catch (error) {
    console.error('Create question error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating question'
    });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update question (Admin only)
// @access  Private (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const {
      question,
      options,
      correctAnswer,
      explanation,
      marks,
      questionType,
      difficulty,
      isActive
    } = req.body;

    const questionDoc = await Question.findById(req.params.id);
    
    if (!questionDoc) {
      return res.status(404).json({
        error: 'Question not found',
        message: 'Question does not exist'
      });
    }

    // Update fields
    if (question) questionDoc.question = question.trim();
    if (options) {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'At least 2 options are required'
        });
      }
      questionDoc.options = options.map(option => option.trim());
    }
    if (correctAnswer !== undefined) {
      const optionsLength = questionDoc.options.length;
      if (correctAnswer < 0 || correctAnswer >= optionsLength) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Correct answer index must be valid'
        });
      }
      questionDoc.correctAnswer = parseInt(correctAnswer);
    }
    if (explanation !== undefined) questionDoc.explanation = explanation.trim();
    if (marks !== undefined) questionDoc.marks = marks;
    if (questionType) questionDoc.questionType = questionType;
    if (difficulty) questionDoc.difficulty = difficulty;
    if (isActive !== undefined) questionDoc.isActive = isActive;

    await questionDoc.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      question: questionDoc.toJSON()
    });

  } catch (error) {
    console.error('Update question error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating question'
    });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete question (Admin only)
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        error: 'Question not found',
        message: 'Question does not exist'
      });
    }

    // Update module question count
    await Module.findByIdAndUpdate(question.moduleId, {
      $inc: { totalQuestions: -1 }
    });

    // Delete the question
    await Question.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting question'
    });
  }
});

// @route   POST /api/questions/bulk
// @desc    Create multiple questions from CSV or array (Admin only)
// @access  Private (Admin only)
router.post('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { moduleId, questions } = req.body;

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

    const createdQuestions = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      try {
        // Validate question data
        if (!q.question || !q.options || q.correctAnswer === undefined) {
          errors.push(`Question ${i + 1}: Missing required fields`);
          continue;
        }

        if (!Array.isArray(q.options) || q.options.length < 2) {
          errors.push(`Question ${i + 1}: At least 2 options required`);
          continue;
        }

        if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          errors.push(`Question ${i + 1}: Invalid correct answer index`);
          continue;
        }

        const newQuestion = new Question({
          moduleId,
          question: q.question.trim(),
          options: q.options.map(option => option.trim()),
          correctAnswer: parseInt(q.correctAnswer),
          explanation: q.explanation ? q.explanation.trim() : '',
          marks: q.marks || 1,
          questionType: q.questionType || 'multiple_choice',
          difficulty: q.difficulty || 'medium'
        });

        await newQuestion.save();
        createdQuestions.push(newQuestion.toJSON());

      } catch (error) {
        errors.push(`Question ${i + 1}: ${error.message}`);
      }
    }

    // Update module question count
    if (createdQuestions.length > 0) {
      await Module.findByIdAndUpdate(moduleId, {
        $inc: { totalQuestions: createdQuestions.length }
      });
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdQuestions.length} questions successfully`,
      created: createdQuestions.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk create questions error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating questions'
    });
  }
});

// @route   GET /api/questions/:id
// @desc    Get single question by ID (Admin only)
// @access  Private (Admin only)
router.get('/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        error: 'Question not found',
        message: 'Question does not exist'
      });
    }

    res.json({
      question: question.toJSON()
    });

  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching question'
    });
  }
});

// @route   GET /api/questions/user/:moduleId
// @desc    Get questions for a module (User access for quizzes)
// @access  Private (Authenticated users)
router.get('/user/:moduleId', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    // Get questions for the module (without admin restriction)
    const questions = await Question.find({ 
      moduleId, 
      isActive: true 
    });
    
    // Transform questions to match frontend expectations
    const transformedQuestions = questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      correctIndex: q.correctAnswer, // Transform correctAnswer to correctIndex
      marks: q.marks,
      type: q.questionType === 'multiple_choice' ? 'mcq' : 'boolean', // Transform type
      moduleId: q.moduleId
    }));
    
    res.json({
      questions: transformedQuestions,
      total: transformedQuestions.length
    });

  } catch (error) {
    console.error('Get user questions error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching questions'
    });
  }
});

module.exports = router;
