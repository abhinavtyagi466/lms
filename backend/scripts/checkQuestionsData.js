const mongoose = require('mongoose');
const Question = require('../models/Question');
const Module = require('../models/Module');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/e-learning-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkQuestionsData() {
  try {
    console.log('=== CHECKING QUESTIONS DATA ===');
    
    // Get all questions
    const questions = await Question.find({});
    console.log(`Total questions in database: ${questions.length}`);
    
    if (questions.length > 0) {
      console.log('\n=== SAMPLE QUESTION STRUCTURE ===');
      const sampleQuestion = questions[0];
      console.log('Sample question:', JSON.stringify(sampleQuestion, null, 2));
      
      // Check field names
      console.log('\n=== FIELD ANALYSIS ===');
      console.log('moduleId:', sampleQuestion.moduleId);
      console.log('question:', sampleQuestion.question);
      console.log('options:', sampleQuestion.options);
      console.log('correctAnswer:', sampleQuestion.correctAnswer);
      console.log('marks:', sampleQuestion.marks);
      console.log('isActive:', sampleQuestion.isActive);
      
      // Check if moduleId exists
      const module = await Module.findById(sampleQuestion.moduleId);
      console.log('Referenced module exists:', !!module);
      if (module) {
        console.log('Module title:', module.title);
      }
    }
    
    // Check questions by module
    const modules = await Module.find({});
    console.log(`\n=== QUESTIONS BY MODULE ===`);
    
    for (const module of modules) {
      const moduleQuestions = await Question.find({ moduleId: module._id });
      console.log(`Module: ${module.title} (${module._id})`);
      console.log(`  Questions: ${moduleQuestions.length}`);
      
      if (moduleQuestions.length > 0) {
        console.log(`  Sample question: ${moduleQuestions[0].question.substring(0, 50)}...`);
      }
    }
    
    console.log('\n=== CHECK COMPLETE ===');
    
  } catch (error) {
    console.error('Error checking questions data:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkQuestionsData();
