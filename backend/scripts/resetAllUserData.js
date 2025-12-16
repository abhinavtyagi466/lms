const mongoose = require('mongoose');
require('dotenv').config();

// Load models
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const QuizAttempt = require('../models/QuizAttempt');
const QuizResult = require('../models/QuizResult');
const KPIScore = require('../models/KPIScore');
const UserActivity = require('../models/UserActivity');
const UserSession = require('../models/UserSession');
const Notification = require('../models/Notification');
const Award = require('../models/Award');
// Add other models if necessary, e.g., AuditRecord, TrainingAssignment

async function resetAllUserDataExceptAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edutech-pro');
        console.log('✅ Connected to MongoDB\n');

        console.log('⚠️  STARTING COMPLETE USER DATA RESET...');
        console.log('    (Preserving Admin accounts, Modules, Quizzes, Email Data)\n');

        // 1. Delete Non-Admin Users
        try {
            const userResult = await User.deleteMany({ userType: { $ne: 'admin' } });
            console.log(`   ✓ Deleted ${userResult.deletedCount} User accounts (Non-Admin)`);
        } catch (e) {
            console.log('   ⚠ User collection error:', e.message);
        }

        // 2. Clear All Progress Data (Since users are gone, their progress is orphan, but good to clean all)
        try {
            const progResult = await UserProgress.deleteMany({});
            console.log(`   ✓ Cleared ${progResult.deletedCount} UserProgress records`);
        } catch (e) {
            console.log('   ⚠ UserProgress collection error:', e.message);
        }

        // 3. Clear Quiz Attempts & Results
        try {
            const attemptResult = await QuizAttempt.deleteMany({});
            console.log(`   ✓ Cleared ${attemptResult.deletedCount} QuizAttempts`);
        } catch (e) {
            console.log('   ⚠ QuizAttempt collection error:', e.message);
        }

        try {
            const resultResult = await QuizResult.deleteMany({});
            console.log(`   ✓ Cleared ${resultResult.deletedCount} QuizResults`);
        } catch (e) {
            console.log('   ⚠ QuizResult collection error:', e.message);
        }

        // 4. Clear KPI Scores
        try {
            const kpiResult = await KPIScore.deleteMany({});
            console.log(`   ✓ Cleared ${kpiResult.deletedCount} KPIScores`);
        } catch (e) {
            console.log('   ⚠ KPIScore collection error:', e.message);
        }

        // 5. Clear Activity & Sessions
        try {
            const activityResult = await UserActivity.deleteMany({});
            console.log(`   ✓ Cleared ${activityResult.deletedCount} UserActivity logs`);
        } catch (e) {
            console.log('   ⚠ UserActivity collection error:', e.message);
        }

        try {
            const sessionResult = await UserSession.deleteMany({});
            console.log(`   ✓ Cleared ${sessionResult.deletedCount} UserSessions`);
        } catch (e) {
            console.log('   ⚠ UserSession collection error:', e.message);
        }

        // 6. Clear Notifications (Usually user-specific)
        try {
            const notifResult = await Notification.deleteMany({});
            console.log(`   ✓ Cleared ${notifResult.deletedCount} Notifications`);
        } catch (e) {
            console.log('   ⚠ Notification collection error:', e.message);
        }

        // 7. Clear Awards/Certificates
        try {
            const awardResult = await Award.deleteMany({});
            console.log(`   ✓ Cleared ${awardResult.deletedCount} Awards`);
        } catch (e) {
            console.log('   ⚠ Award collection error:', e.message);
        }


        console.log('\n===================================================');
        console.log('✅ SYSTEM RESET COMPLETE');
        console.log('===================================================');
        console.log('PRESERVED DATA:');
        console.log('   • Admin Accounts');
        console.log('   • Modules (Training Content)');
        console.log('   • Quizzes (Questions & Config)');
        console.log('   • Email Templates / System Config');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

resetAllUserDataExceptAdmin();
