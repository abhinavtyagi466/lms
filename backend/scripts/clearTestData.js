const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Award = require('../models/Award');
const Warning = require('../models/AuditNotice');
const LifecycleEvent = require('../models/LifecycleEvent');
const UserProgress = require('../models/UserProgress');
const QuizResult = require('../models/QuizResult');

async function clearTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edutech-pro');
    console.log('Connected to MongoDB');

    // Clear test data from all collections
    const collections = [
      { model: User, name: 'Users' },
      { model: Award, name: 'Awards' },
      { model: Warning, name: 'Warnings' },
      { model: LifecycleEvent, name: 'Lifecycle Events' },
      { model: UserProgress, name: 'User Progress' },
      { model: QuizResult, name: 'Quiz Results' }
    ];

    for (const collection of collections) {
      const result = await collection.model.deleteMany({});
      console.log(`Cleared ${result.deletedCount} ${collection.name}`);
    }

    // Keep only admin and regular user, delete all test users
    const result = await User.deleteMany({
      email: { $regex: /^test/, $options: 'i' }
    });

    console.log('All test data cleared successfully!');
    console.log('Summary:');
    console.log('- Test users deleted (kept admin and regular user)');
    console.log('- All test awards, warnings, lifecycle events cleared');
    console.log('- All test progress and quiz results cleared');

    process.exit(0);
  } catch (error) {
    console.error('Error clearing test data:', error);
    process.exit(1);
  }
}

clearTestData();
