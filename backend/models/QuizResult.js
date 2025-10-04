const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    moduleId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Module', 
      required: true, 
      index: true 
    },
    quizId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Quiz', 
      required: true, 
      index: true 
    },
    score: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    total: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    percentage: { 
      type: Number, 
      required: true, 
      min: 0, 
      max: 100 
    },
    passed: { 
      type: Boolean, 
      required: true 
    },
    answers: [{ 
      questionIndex: { type: Number, required: true },
      selectedOption: { type: Number, required: true },
      isCorrect: { type: Boolean, required: true },
      timeSpent: { type: Number, default: 0 } // in seconds
    }],
    timeTaken: { 
      type: Number, 
      default: 0 
    }, // total time in seconds
    startedAt: { 
      type: Date, 
      default: Date.now 
    },
    completedAt: { 
      type: Date 
    },
    attemptNumber: { 
      type: Number, 
      default: 1 
    }, // track multiple attempts
    // Personalised quiz result fields
    isPersonalised: { type: Boolean, default: false, index: true },
    personalisedModuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' }, // Reference to personalised module
    personalisedQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' } // Reference to personalised quiz
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Indexes for better performance
QuizResultSchema.index({ userId: 1, moduleId: 1 });
QuizResultSchema.index({ userId: 1, quizId: 1 });
QuizResultSchema.index({ moduleId: 1, createdAt: -1 });
QuizResultSchema.index({ passed: 1, createdAt: -1 });
QuizResultSchema.index({ isPersonalised: 1, userId: 1 });
QuizResultSchema.index({ personalisedModuleId: 1, userId: 1 });

// Virtual for pass/fail status
QuizResultSchema.virtual('status').get(function() {
  return this.passed ? 'Passed' : 'Failed';
});

// Set virtuals when converting to JSON
QuizResultSchema.set('toJSON', { virtuals: true });
QuizResultSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('QuizResult', QuizResultSchema);
