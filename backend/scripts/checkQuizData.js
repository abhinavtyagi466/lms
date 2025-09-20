const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Module = require('../models/Module');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';

const checkQuizData = async () => {
  try {
    console.log('Checking quiz data in database...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check all quizzes
    const quizzes = await Quiz.find({});
    console.log(`\nTotal quizzes found: ${quizzes.length}`);
    
    if (quizzes.length === 0) {
      console.log('No quizzes found in database.');
      return;
    }
    
    // Check each quiz
    for (const quiz of quizzes) {
      console.log(`\nQuiz ID: ${quiz._id}`);
      console.log(`Module ID: ${quiz.moduleId}`);
      console.log(`Questions count: ${quiz.questions.length}`);
      console.log(`Pass percent: ${quiz.passPercent}`);
      
      // Check if module exists
      const module = await Module.findById(quiz.moduleId);
      if (module) {
        console.log(`✓ Module found: "${module.title}"`);
      } else {
        console.log(`✗ Module NOT found for ID: ${quiz.moduleId}`);
      }
    }
    
    // Check all modules
    const modules = await Module.find({});
    console.log(`\nTotal modules found: ${modules.length}`);
    
    if (modules.length > 0) {
      console.log('Available modules:');
      modules.forEach(module => {
        console.log(`- ${module._id}: "${module.title}"`);
      });
    }
    
  } catch (error) {
    console.error('Error checking quiz data:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
};

// Run check if this script is executed directly
if (require.main === module) {
  checkQuizData();
}

module.exports = { checkQuizData };
