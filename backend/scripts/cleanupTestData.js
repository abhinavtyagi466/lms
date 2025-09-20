const mongoose = require('mongoose');
const User = require('../models/User');

require('dotenv').config();

async function cleanupTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edutech-pro');
    console.log('Connected to MongoDB');

    // Delete all test users (emails starting with 'test')
    const result = await User.deleteMany({
      email: { $regex: /^test/, $options: 'i' }
    });

    console.log(`Cleaned up ${result.deletedCount} test users`);
    console.log('Test data cleanup completed');

    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    process.exit(1);
  }
}

cleanupTestData();
