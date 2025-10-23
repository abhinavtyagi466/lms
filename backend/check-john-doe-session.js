// Check if John Doe has session data
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const UserSession = require('./models/UserSession');
const UserActivity = require('./models/UserActivity');

async function checkJohnDoe() {
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
      console.log('❌ John Doe not found in database!');
      await mongoose.connection.close();
      return;
    }

    console.log('👤 Found John Doe:');
    console.log(`   ID: ${johnDoe._id}`);
    console.log(`   Name: ${johnDoe.name}`);
    console.log(`   Email: ${johnDoe.email}`);
    console.log(`   User Type: ${johnDoe.userType}`);
    console.log(`   Last Login: ${johnDoe.lastLogin}`);
    console.log(`   Session ID: ${johnDoe.sessionId || 'None'}`);

    // Check UserSessions
    const sessions = await UserSession.find({ userId: johnDoe._id })
      .sort({ startTime: -1 })
      .limit(5);
    
    console.log(`\n📊 UserSessions: ${sessions.length}`);
    if (sessions.length > 0) {
      sessions.forEach((session, index) => {
        console.log(`\n${index + 1}. Session ID: ${session.sessionId}`);
        console.log(`   Start: ${session.startTime}`);
        console.log(`   Active: ${session.isActive}`);
        console.log(`   Device: ${session.deviceInfo?.type || 'Unknown'}`);
        console.log(`   Browser: ${session.deviceInfo?.browser || 'Unknown'}`);
        console.log(`   OS: ${session.deviceInfo?.os || 'Unknown'}`);
        console.log(`   IP: ${session.ipAddress}`);
      });
    } else {
      console.log('   ⚠️  No sessions found!');
    }

    // Check UserActivities
    const activities = await UserActivity.find({ 
      userId: johnDoe._id,
      activityType: 'login'
    })
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`\n📊 Login Activities: ${activities.length}`);
    if (activities.length > 0) {
      activities.forEach((activity, index) => {
        console.log(`\n${index + 1}. ${activity.description}`);
        console.log(`   Time: ${activity.createdAt}`);
        console.log(`   Success: ${activity.success}`);
        console.log(`   Device: ${activity.deviceInfo?.type || 'Unknown'}`);
        console.log(`   Browser: ${activity.deviceInfo?.browser || 'Unknown'}`);
      });
    } else {
      console.log('   ⚠️  No login activities found!');
    }

    // Check all UserSessions in database
    const totalSessions = await UserSession.countDocuments();
    console.log(`\n📊 Total UserSessions in database: ${totalSessions}`);

    const totalActivities = await UserActivity.countDocuments({ activityType: 'login' });
    console.log(`📊 Total Login Activities in database: ${totalActivities}`);

    await mongoose.connection.close();
    console.log('\n✅ Done');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkJohnDoe();
