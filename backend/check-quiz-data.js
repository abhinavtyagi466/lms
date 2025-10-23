// Check quiz attempts and results in database
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const QuizAttempt = require('./models/QuizAttempt');
const QuizResult = require('./models/QuizResult');
const Quiz = require('./models/Quiz');

async function checkQuizData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning_db');
    console.log('✅ Connected to MongoDB\n');

    // Find John Doe
    const johnDoe = await User.findOne({ 
      $or: [
        { name: /john doe/i },
        { email: /john.doe/i }
      ]
    });

    if (!johnDoe) {
      console.log('❌ John Doe not found!');
      await mongoose.connection.close();
      return;
    }

    console.log('👤 John Doe:');
    console.log(`   ID: ${johnDoe._id}`);
    console.log(`   Email: ${johnDoe.email}\n`);

    // Check QuizAttempts
    const attempts = await QuizAttempt.find({ userId: johnDoe._id })
      .populate('moduleId', 'title')
      .sort({ startTime: -1 });
    
    console.log(`📊 Quiz Attempts: ${attempts.length}`);
    if (attempts.length > 0) {
      attempts.forEach((attempt, index) => {
        console.log(`\n${index + 1}. Attempt #${attempt.attemptNumber}`);
        console.log(`   Module: ${attempt.moduleId?.title || 'Unknown'}`);
        console.log(`   Score: ${attempt.score}%`);
        console.log(`   Passed: ${attempt.passed ? '✅' : '❌'}`);
        console.log(`   Status: ${attempt.status}`);
        console.log(`   Time: ${attempt.startTime}`);
        console.log(`   Answers: ${attempt.answers?.length || 0}`);
      });
    } else {
      console.log('   ⚠️  No quiz attempts found!\n');
    }

    // Check QuizResults
    const results = await QuizResult.find({ userId: johnDoe._id })
      .populate('moduleId', 'title')
      .sort({ completedAt: -1 });
    
    console.log(`\n📊 Quiz Results: ${results.length}`);
    if (results.length > 0) {
      results.forEach((result, index) => {
        console.log(`\n${index + 1}. Result`);
        console.log(`   Module: ${result.moduleId?.title || 'Unknown'}`);
        console.log(`   Score: ${result.score}/${result.total} (${result.percentage}%)`);
        console.log(`   Passed: ${result.passed ? '✅' : '❌'}`);
        console.log(`   Attempt #: ${result.attemptNumber}`);
        console.log(`   Time: ${result.completedAt}`);
      });
    } else {
      console.log('   ⚠️  No quiz results found!\n');
    }

    // Check total in database
    const totalAttempts = await QuizAttempt.countDocuments();
    const totalResults = await QuizResult.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();

    console.log(`\n📊 Database Totals:`);
    console.log(`   Total Quiz Attempts: ${totalAttempts}`);
    console.log(`   Total Quiz Results: ${totalResults}`);
    console.log(`   Total Quizzes: ${totalQuizzes}`);

    // Show recent attempts from any user
    if (totalAttempts > 0) {
      console.log(`\n📋 Recent Quiz Attempts (All Users):`);
      const recentAttempts = await QuizAttempt.find()
        .populate('userId', 'name email')
        .populate('moduleId', 'title')
        .sort({ startTime: -1 })
        .limit(5);
      
      recentAttempts.forEach((attempt, index) => {
        console.log(`\n${index + 1}. ${attempt.userId?.name || 'Unknown'}`);
        console.log(`   Module: ${attempt.moduleId?.title || 'Unknown'}`);
        console.log(`   Score: ${attempt.score}%`);
        console.log(`   Time: ${attempt.startTime}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkQuizData();
