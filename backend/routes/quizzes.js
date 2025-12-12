const express = require('express');
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const QuizAttempt = require('../models/QuizAttempt');
const UserProgress = require('../models/UserProgress');
const Module = require('../models/Module');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/quizzes
// @desc    Get all quizzes (All authenticated users)
// @access  Private (All authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Admin gets all quizzes (including inactive), users get only active quizzes for published modules
    // Always exclude quizzes with null moduleId (orphaned quizzes)
    let query = {
      moduleId: { $ne: null, $exists: true }
    };

    // Admin users (admin, hr, manager, hod) can see ALL quizzes including inactive
    const isAdminUser = ['admin', 'hr', 'manager', 'hod'].includes(req.user.userType);

    if (!isAdminUser) {
      // For regular users, only show active quizzes for published modules
      query.isActive = true;
      const publishedModules = await Module.find({ status: 'published' }).select('_id');
      const publishedModuleIds = publishedModules.map(m => m._id);
      query.moduleId = { $in: publishedModuleIds, $ne: null, $exists: true };
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

// @route   DELETE /api/quizzes/cleanup/orphaned
// @desc    Delete all orphaned/corrupted quizzes (Admin only) - MUST be before :moduleId routes
// @access  Private (Admin only)
router.delete('/cleanup/orphaned', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('=== CLEANUP ORPHANED QUIZZES ===');
    console.log('User:', req.user?.email);

    // Find all orphaned quizzes (null moduleId, invalid moduleId, or empty questions)
    const orphanedByNull = await Quiz.deleteMany({
      $or: [
        { moduleId: null },
        { moduleId: { $exists: false } }
      ]
    });

    // Find quizzes with empty questions array
    const orphanedByEmpty = await Quiz.deleteMany({
      questions: { $size: 0 }
    });

    // Find quizzes where moduleId references a deleted module
    const allQuizzes = await Quiz.find({}).select('moduleId');
    const existingModules = await Module.find({}).select('_id');
    const existingModuleIds = existingModules.map(m => m._id.toString());

    let deletedOrphanedModules = 0;
    for (const quiz of allQuizzes) {
      if (quiz.moduleId && !existingModuleIds.includes(quiz.moduleId.toString())) {
        await Quiz.findByIdAndDelete(quiz._id);
        deletedOrphanedModules++;
      }
    }

    const totalDeleted = orphanedByNull.deletedCount + orphanedByEmpty.deletedCount + deletedOrphanedModules;

    console.log('Orphaned by null moduleId:', orphanedByNull.deletedCount);
    console.log('Orphaned by empty questions:', orphanedByEmpty.deletedCount);
    console.log('Orphaned by deleted module:', deletedOrphanedModules);
    console.log('Total deleted:', totalDeleted);

    res.json({
      success: true,
      message: `Cleanup complete. ${totalDeleted} orphaned quiz(es) deleted.`,
      details: {
        nullModuleId: orphanedByNull.deletedCount,
        emptyQuestions: orphanedByEmpty.deletedCount,
        deletedModule: deletedOrphanedModules,
        total: totalDeleted
      }
    });

  } catch (error) {
    console.error('Cleanup orphaned quizzes error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error cleaning up orphaned quizzes'
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
// @desc    Create or update quiz (Admin only) - Uses upsert logic
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { moduleId, questions, passPercent, estimatedTime } = req.body;

    console.log('=== QUIZ CREATE/UPDATE REQUEST ===');
    console.log('Module ID:', moduleId);
    console.log('Questions count:', questions?.length);
    console.log('User:', req.user?.email);

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

    // First, delete any orphaned quizzes for this module (those with isActive: false or corrupted)
    await Quiz.deleteMany({
      moduleId: moduleId,
      $or: [
        { isActive: false },
        { questions: { $size: 0 } }
      ]
    });

    // Find existing active quiz for this module
    let quiz = await Quiz.findOne({
      moduleId: moduleId,
      isActive: true
    });

    let isUpdate = false;
    if (quiz) {
      // Update existing quiz
      console.log('Updating existing quiz:', quiz._id);
      isUpdate = true;
      quiz.questions = questions;
      quiz.passPercent = passPercent || quiz.passPercent || 70;
      quiz.estimatedTime = estimatedTime || quiz.estimatedTime || 10;
      quiz.isActive = true; // Ensure active
    } else {
      // Check if there's any quiz at all for this module (even inactive)
      const anyExisting = await Quiz.findOne({ moduleId: moduleId });
      if (anyExisting) {
        // Delete the old one and create fresh
        console.log('Deleting old quiz and creating fresh:', anyExisting._id);
        await Quiz.findByIdAndDelete(anyExisting._id);
      }

      // Create new quiz
      console.log('Creating new quiz for module:', moduleId);
      quiz = new Quiz({
        moduleId: moduleId,
        questions,
        passPercent: passPercent || 70,
        estimatedTime: estimatedTime || 10,
        isActive: true
      });
    }

    await quiz.save();
    console.log('Quiz saved successfully:', quiz._id);
    console.log('Quiz isActive:', quiz.isActive);
    console.log('Quiz questions count:', quiz.questions?.length);

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Quiz updated successfully' : 'Quiz created successfully',
      quiz: quiz
    });

  } catch (error) {
    console.error('Create/Update quiz error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating/updating quiz'
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
// @desc    Delete quiz permanently (Admin only) - Progress data is preserved
// @access  Private (Admin only)
router.delete('/:moduleId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('=== QUIZ DELETE REQUEST ===');
    console.log('Module ID:', req.params.moduleId);
    console.log('User:', req.user?.email);

    // Delete ALL quizzes for this module (handles duplicates and orphaned records)
    const deleteResult = await Quiz.deleteMany({ moduleId: req.params.moduleId });

    console.log('Quizzes deleted:', deleteResult.deletedCount);

    if (deleteResult.deletedCount === 0) {
      // Try to find by quiz ID if moduleId didn't match
      const quizById = await Quiz.findById(req.params.moduleId);
      if (quizById) {
        await Quiz.findByIdAndDelete(req.params.moduleId);
        console.log('Quiz deleted by ID:', req.params.moduleId);
        return res.json({
          success: true,
          message: 'Quiz deleted successfully',
          deletedCount: 1
        });
      }

      return res.status(404).json({
        error: 'Quiz not found',
        message: 'No quiz found for this module'
      });
    }

    // Note: QuizResult and QuizAttempt are NOT deleted - progress is preserved
    res.json({
      success: true,
      message: `${deleteResult.deletedCount} quiz(es) deleted successfully. User progress data is preserved.`,
      deletedCount: deleteResult.deletedCount
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

    console.log('=== CSV UPLOAD DEBUG ===');
    console.log('Module ID:', req.params.moduleId);
    console.log('Questions parsed:', questions.length);

    // Update or create quiz
    let quiz = await Quiz.findOne({ moduleId: req.params.moduleId });

    if (quiz) {
      console.log('Updating existing quiz:', quiz._id);
      quiz.questions = questions;
    } else {
      console.log('Creating new quiz for module:', req.params.moduleId);
      quiz = new Quiz({
        moduleId: req.params.moduleId,
        questions,
        passPercent: 70,
        estimatedTime: 10
      });
    }

    await quiz.save();
    console.log('Quiz saved successfully:', quiz._id);
    console.log('Quiz moduleId after save:', quiz.moduleId);

    res.json({
      success: true,
      message: `Quiz ${quiz.isNew ? 'created' : 'updated'} with ${questions.length} questions`,
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

// @route   POST /api/quiz/start
// @desc    Start a quiz attempt (All authenticated users)
// @access  Private (All authenticated users)
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { userId, moduleId } = req.body;

    // Validate required fields
    if (!userId || !moduleId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User ID and module ID are required'
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

    // Get attempt number
    const previousAttempts = await QuizAttempt.countDocuments({ userId, moduleId });
    const attemptNumber = previousAttempts + 1;

    // Create quiz attempt record
    const quizAttempt = new QuizAttempt({
      userId,
      moduleId,
      attemptNumber,
      startTime: new Date(),
      timeSpent: 0,
      score: 0,
      passed: false,
      answers: [],
      violations: [],
      status: 'in_progress',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceInfo: req.get('User-Agent')
    });

    await quizAttempt.save();

    res.json({
      success: true,
      message: 'Quiz attempt started',
      attemptId: quizAttempt._id,
      attemptNumber,
      quiz: {
        _id: quiz._id,
        questions: quiz.questions,
        passPercent: quiz.passPercent,
        estimatedTime: quiz.estimatedTime
      }
    });

  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error starting quiz attempt'
    });
  }
});

// @route   POST /api/quiz/submit
// @desc    Submit quiz attempt (All authenticated users)
// @access  Private (All authenticated users)
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { userId, moduleId, answers, timeTaken, attemptId } = req.body;

    console.log('\n========================================');
    console.log('=== QUIZ SUBMISSION RECEIVED ===');
    console.log('========================================');
    console.log('User ID:', userId);
    console.log('Module ID:', moduleId);
    console.log('Answers count:', answers?.length);
    console.log('Answers:', JSON.stringify(answers, null, 2));
    console.log('Time Taken:', timeTaken);
    console.log('Attempt ID:', attemptId);
    console.log('Request User:', req.user?.email || req.user?._id);

    // Validate required fields
    if (!userId || !moduleId || !answers || !Array.isArray(answers)) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User ID, module ID, and answers array are required'
      });
    }

    // Get the quiz for this module
    console.log('Searching for quiz with moduleId:', moduleId);
    const quiz = await Quiz.findOne({ moduleId, isActive: true });

    if (!quiz) {
      console.log('❌ Quiz not found for moduleId:', moduleId);
      return res.status(404).json({
        error: 'Quiz not found',
        message: 'No quiz available for this module'
      });
    }

    console.log('✅ Quiz found:', quiz._id);
    console.log('   Questions count:', quiz.questions?.length);
    console.log('   Pass percent:', quiz.passPercent);

    // Validate answers array length matches questions
    if (answers.length !== quiz.questions.length) {
      console.log('⚠️ Warning: Answers count (', answers.length, ') does not match questions count (', quiz.questions.length, ')');
    }

    // Calculate score
    let score = 0;
    const evaluatedAnswers = answers.map((answer, index) => {
      // Helper to get selected option from answer (handles both number and object format)
      const getSelectedOption = (ans) => {
        if (typeof ans === 'number') return ans;
        if (ans?.selectedOption !== undefined) return Number(ans.selectedOption);
        return -1;
      };

      // Handle cases where answer array might be shorter than questions
      if (index >= quiz.questions.length) {
        return {
          questionIndex: index,
          selectedOption: getSelectedOption(answer),
          isCorrect: false,
          timeSpent: answer?.timeSpent || 0
        };
      }

      const question = quiz.questions[index];
      if (!question) {
        console.error('Question not found at index:', index);
        return {
          questionIndex: index,
          selectedOption: getSelectedOption(answer),
          isCorrect: false,
          timeSpent: answer?.timeSpent || 0
        };
      }

      // Handle both correctOption (0-3) format and ensure proper comparison
      // IMPORTANT: Handle BOTH array of numbers [0, 1, 2] AND array of objects [{selectedOption: 0}, ...]
      let selectedOption;
      if (typeof answer === 'number') {
        // Direct number format: [0, 1, 2]
        selectedOption = answer;
      } else if (answer?.selectedOption !== undefined) {
        // Object format: [{selectedOption: 0}, ...]
        selectedOption = Number(answer.selectedOption);
      } else {
        // Unanswered
        selectedOption = -1;
      }

      const correctOption = question.correctOption !== undefined ? Number(question.correctOption) : -1;
      const isCorrect = selectedOption === correctOption && selectedOption !== -1;

      if (isCorrect) {
        score++;
        console.log(`✅ Question ${index + 1}: Correct (Selected: ${selectedOption}, Correct: ${correctOption})`);
      } else {
        console.log(`❌ Question ${index + 1}: Incorrect (Selected: ${selectedOption}, Correct: ${correctOption})`);
      }

      return {
        questionIndex: index,
        selectedOption: selectedOption,
        isCorrect,
        timeSpent: answer?.timeSpent || 0
      };
    });

    const percentage = quiz.questions.length > 0
      ? Math.round((score / quiz.questions.length) * 100)
      : 0;
    const passed = percentage >= quiz.passPercent;

    console.log('📊 Score Calculation:');
    console.log('   Correct answers:', score, 'out of', quiz.questions.length);
    console.log('   Percentage:', percentage, '%');
    console.log('   Pass threshold:', quiz.passPercent, '%');
    console.log('   Passed:', passed);

    let quizAttempt;
    let attemptNumber;

    // Check if we're updating an existing attempt or creating a new one
    if (attemptId) {
      // Update existing attempt
      quizAttempt = await QuizAttempt.findById(attemptId);
      if (!quizAttempt || quizAttempt.userId.toString() !== userId) {
        return res.status(404).json({
          error: 'Quiz attempt not found',
          message: 'Invalid attempt ID'
        });
      }
      attemptNumber = quizAttempt.attemptNumber;

      // Update the attempt
      quizAttempt.endTime = new Date();
      quizAttempt.timeSpent = timeTaken || 0;
      quizAttempt.score = percentage;
      quizAttempt.passed = passed;
      quizAttempt.answers = evaluatedAnswers.map(answer => ({
        questionId: null, // Questions don't have _id in Quiz model
        questionIndex: answer.questionIndex,
        selectedAnswer: answer.selectedOption,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent || 0,
        weightage: 1
      }));
      quizAttempt.status = 'completed';

      try {
        await quizAttempt.save();
        console.log('✅ Quiz attempt updated successfully:', quizAttempt._id);
        console.log('   Score:', quizAttempt.score, '% | Passed:', quizAttempt.passed);
      } catch (saveError) {
        console.error('❌ Error saving quiz attempt:', saveError);
        throw saveError;
      }
    } else {
      // Create new attempt
      const previousAttempts = await QuizAttempt.countDocuments({ userId, moduleId });
      attemptNumber = previousAttempts + 1;

      quizAttempt = new QuizAttempt({
        userId,
        moduleId,
        attemptNumber,
        startTime: new Date(Date.now() - (timeTaken || 0) * 1000), // Estimate start time
        endTime: new Date(),
        timeSpent: timeTaken || 0,
        score: percentage,
        passed,
        answers: evaluatedAnswers.map(answer => ({
          questionId: null, // Questions don't have _id in Quiz model
          questionIndex: answer.questionIndex,
          selectedAnswer: answer.selectedOption,
          isCorrect: answer.isCorrect,
          timeSpent: answer.timeSpent || 0,
          weightage: 1
        })),
        violations: [], // No violations for now, can be enhanced later
        status: 'completed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('User-Agent'), // Can be enhanced with device detection
        // Personalised quiz fields
        isPersonalised: quiz.isPersonalised || false,
        personalisedModuleId: quiz.isPersonalised ? moduleId : null,
        personalisedQuizId: quiz.isPersonalised ? quiz._id : null
      });

      try {
        await quizAttempt.save();
        console.log('✅ Quiz attempt saved successfully:', quizAttempt._id);
        console.log('   Score:', quizAttempt.score, '% | Passed:', quizAttempt.passed);
      } catch (saveError) {
        console.error('❌ Error saving quiz attempt:', saveError);
        console.error('   Error details:', saveError.message);
        console.error('   Attempt data:', {
          userId,
          moduleId,
          score: percentage,
          passed,
          answersCount: quizAttempt.answers.length
        });
        throw saveError;
      }
    }

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
      completedAt: new Date(),
      // Personalised quiz fields
      isPersonalised: quiz.isPersonalised || false,
      personalisedModuleId: quiz.isPersonalised ? moduleId : null,
      personalisedQuizId: quiz.isPersonalised ? quiz._id : null
    });

    try {
      await quizResult.save();
      console.log('✅ Quiz result saved successfully:', quizResult._id);
      console.log('   Final score:', quizResult.percentage, '% | Passed:', quizResult.passed);
    } catch (saveError) {
      console.error('❌ Error saving quiz result:', saveError);
      console.error('   Error details:', saveError.message);
      // Don't throw here, as quiz attempt is already saved
      // But log the error for debugging
    }

    // Update UserProgress to track quiz completion
    try {
      // Pass assignmentId to getUserProgress to ensure we update the correct progress record
      let userProgress = await UserProgress.getUserProgress(userId, moduleId, req.body.assignmentId);

      if (!userProgress) {
        // Create new user progress if it doesn't exist
        userProgress = new UserProgress({
          userId,
          moduleId,
          assignmentId: req.body.assignmentId || null, // Set assignmentId if provided
          videoProgress: 0,
          videoWatched: false,
          bestScore: 0,
          bestPercentage: 0,
          passed: false,
          certificateIssued: false
        });
      }

      // Add quiz attempt to user progress
      const attemptData = {
        score,
        totalMarks: quiz.questions.length,
        percentage,
        passed,
        answers: evaluatedAnswers.map(answer => ({
          selectedAnswer: answer.selectedOption,
          isCorrect: answer.isCorrect,
          marks: answer.isCorrect ? 1 : 0
        })),
        timeTaken: timeTaken || 0,
        completedAt: new Date()
      };

      await userProgress.addQuizAttempt(attemptData);
      console.log('✅ UserProgress updated successfully');

      // Issue certificate if passed
      if (passed && !userProgress.certificateIssued) {
        await userProgress.issueCertificate();
        console.log('✅ Certificate issued to user');
      }
    } catch (progressError) {
      console.error('⚠️ Error updating UserProgress:', progressError);
      console.error('   Error details:', progressError.message);
      // Don't throw here, as quiz attempt and result are already saved
      // This is a non-critical update
    }

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      result: {
        score,
        total: quiz.questions.length,
        percentage,
        passed,
        timeTaken: timeTaken || 0,
        attemptNumber,
        quizAttemptId: quizAttempt._id,
        quizResultId: quizResult._id
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
// @desc    Get quiz results for a user (Users can access their own, Admin can access any)
// @access  Private
router.get('/results/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user._id;
    const isAdmin = req.user.userType === 'admin';

    // Check if user is accessing their own data or is admin
    // Convert both to ObjectId for proper comparison
    const requestedUserIdObj = new mongoose.Types.ObjectId(userId);
    const currentUserIdObj = new mongoose.Types.ObjectId(requestingUserId);

    if (!requestedUserIdObj.equals(currentUserIdObj) && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own quiz results'
      });
    }

    console.log('Fetching quiz results for userId:', userId);
    console.log('Requesting user:', requestingUserId.toString(), '| Is Admin:', isAdmin);
    const results = await QuizResult.find({ userId: requestedUserIdObj })
      .populate('moduleId', 'title')
      .populate('quizId', 'passPercent')
      .sort({ createdAt: -1 });

    console.log('Quiz results found:', results.length);

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
