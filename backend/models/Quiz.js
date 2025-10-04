const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: [{ type: String, required: true, trim: true }], // 4 options for MCQ
    correctOption: { type: Number, required: true, min: 0, max: 3 }, // 0-3 for 4 options
    explanation: { type: String, trim: true }, // Optional explanation
    marks: { type: Number, default: 1 }
  },
  { _id: false }
);

const QuizSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
    questions: { type: [QuestionSchema], default: [] },
    passPercent: { type: Number, default: 70, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    totalQuestions: { type: Number, default: 0 },
    estimatedTime: { type: Number, default: 10 }, // in minutes
    // Personalised quiz fields
    isPersonalised: { type: Boolean, default: false, index: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Specific users this quiz is assigned to
    personalisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who created this personalised quiz
    personalisedAt: { type: Date, default: null },
    personalisedReason: { type: String, trim: true }, // Reason for personalisation
    personalisedPriority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Pre-save middleware to update totalQuestions
QuizSchema.pre('save', function(next) {
  this.totalQuestions = this.questions.length;
  next();
});

// Indexes for better performance
QuizSchema.index({ moduleId: 1, isActive: 1 });
QuizSchema.index({ isActive: 1 });
QuizSchema.index({ isPersonalised: 1, assignedTo: 1 });
QuizSchema.index({ assignedTo: 1, isActive: 1 });

module.exports = mongoose.model('Quiz', QuizSchema);
