// Create UserSession and UserActivity records for all active users
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const UserSession = require('./models/UserSession');
const UserActivity = require('./models/UserActivity');

async function createSessionsForUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning_db');
    console.log('✅ Connected to MongoDB\n');

    // Get all active users
    const users = await User.find({ isActive: true });
    console.log(`Found ${users.length} active users\n`);

    let sessionsCreated = 0;
    let activitiesCreated = 0;

    for (const user of users) {
      try {
        // Check if user already has a session
        const existingSession = await UserSession.findOne({ 
          userId: user._id,
          isActive: true 
        });

        if (existingSession) {
          console.log(`⏭️  ${user.name} already has an active session`);
          continue;
        }

        // Create session ID
        const sessionId = user.sessionId || `session_${user._id}_${Date.now()}`;

        // Create UserSession
        const userSession = new UserSession({
          userId: user._id,
          sessionId: sessionId,
          startTime: user.lastLogin || new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Manual Session Creation',
          deviceInfo: {
            type: 'desktop',
            os: 'Unknown',
            browser: 'Unknown',
            version: 'Unknown'
          },
          location: {
            country: 'Unknown',
            region: 'Unknown',
            city: 'Unknown'
          },
          isActive: true,
          lastActivity: user.lastLogin || new Date(),
          activityCount: 1,
          pageViews: 1,
          actions: []
        });

        await userSession.save();
        sessionsCreated++;
        console.log(`✅ Created session for ${user.name}`);

        // Create UserActivity
        const userActivity = new UserActivity({
          userId: user._id,
          activityType: 'login',
          description: `User session created (manual)`,
          ipAddress: '127.0.0.1',
          userAgent: 'Manual Session Creation',
          deviceInfo: {
            type: 'desktop',
            os: 'Unknown',
            browser: 'Unknown',
            version: 'Unknown'
          },
          location: {
            country: 'Unknown',
            region: 'Unknown',
            city: 'Unknown'
          },
          sessionId: sessionId,
          success: true,
          severity: 'low',
          isSuspicious: false
        });

        await userActivity.save();
        activitiesCreated++;

      } catch (error) {
        console.error(`❌ Error creating session for ${user.name}:`, error.message);
      }
    }

    console.log(`\n✅ Summary:`);
    console.log(`   Sessions created: ${sessionsCreated}`);
    console.log(`   Activities created: ${activitiesCreated}`);

    await mongoose.connection.close();
    console.log('\n✅ Done');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSessionsForUsers();
