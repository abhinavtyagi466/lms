// Quick test script to check if UserSession and UserActivity data exists
const mongoose = require('mongoose');
require('dotenv').config();

const UserSession = require('./models/UserSession');
const UserActivity = require('./models/UserActivity');

async function checkData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning_db');
    console.log('✅ Connected to MongoDB');

    // Check UserSessions
    const sessionCount = await UserSession.countDocuments();
    console.log(`\n📊 Total UserSessions: ${sessionCount}`);
    
    if (sessionCount > 0) {
      const recentSessions = await UserSession.find()
        .sort({ startTime: -1 })
        .limit(5)
        .populate('userId', 'name email');
      
      console.log('\n🔍 Recent Sessions:');
      recentSessions.forEach((session, index) => {
        console.log(`${index + 1}. User: ${session.userId?.name || 'Unknown'}`);
        console.log(`   Email: ${session.userId?.email || 'Unknown'}`);
        console.log(`   Device: ${session.deviceInfo?.type || 'Unknown'}`);
        console.log(`   Browser: ${session.deviceInfo?.browser || 'Unknown'}`);
        console.log(`   OS: ${session.deviceInfo?.os || 'Unknown'}`);
        console.log(`   Start Time: ${session.startTime}`);
        console.log(`   Active: ${session.isActive}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No UserSession records found!');
      console.log('   Please logout and login again to create session data.');
    }

    // Check UserActivities
    const activityCount = await UserActivity.countDocuments({ activityType: 'login' });
    console.log(`\n📊 Total Login Activities: ${activityCount}`);
    
    if (activityCount > 0) {
      const recentActivities = await UserActivity.find({ activityType: 'login' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email');
      
      console.log('\n🔍 Recent Login Activities:');
      recentActivities.forEach((activity, index) => {
        console.log(`${index + 1}. User: ${activity.userId?.name || 'Unknown'}`);
        console.log(`   Description: ${activity.description}`);
        console.log(`   Device: ${activity.deviceInfo?.type || 'Unknown'}`);
        console.log(`   Browser: ${activity.deviceInfo?.browser || 'Unknown'}`);
        console.log(`   Success: ${activity.success}`);
        console.log(`   Time: ${activity.createdAt}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No login activity records found!');
      console.log('   Please logout and login again to create activity data.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
