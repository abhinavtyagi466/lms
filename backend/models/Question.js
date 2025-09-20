const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module ID is required']
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: [{
    type: String,
    required: [true, 'Question options are required'],
    trim: true
  }],
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: [0, 'Correct answer index must be 0 or greater']
  },
  explanation: {
    type: String,
    trim: true
  },
  marks: {
    type: Number,
    default: 1,
    min: [1, 'Marks must be at least 1']
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'fill_blank'],
    default: 'multiple_choice'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for better query performance
questionSchema.index({ moduleId: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ questionType: 1 });

// Static method to get questions by module
questionSchema.statics.getByModule = function(moduleId) {
  return this.find({ moduleId, isActive: true }).sort({ createdAt: 1 });
};

// Static method to get random questions for quiz
questionSchema.statics.getRandomQuestions = function(moduleId, limit = 10) {
  return this.aggregate([
    { $match: { moduleId: new mongoose.Types.ObjectId(moduleId), isActive: true } },
    { $sample: { size: limit } },
    { $sort: { createdAt: 1 } }
  ]);
};

// Instance method to check if answer is correct
questionSchema.methods.isCorrectAnswer = function(selectedAnswer) {
  return selectedAnswer === this.correctAnswer;
};

// Instance method to get total marks for module
questionSchema.statics.getTotalMarks = function(moduleId) {
  return this.aggregate([
    { $match: { moduleId: new mongoose.Types.ObjectId(moduleId), isActive: true } },
    { $group: { _id: null, totalMarks: { $sum: '$marks' } } }
  ]);
};

module.exports = mongoose.model('Question', questionSchema);
