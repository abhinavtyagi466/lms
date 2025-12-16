const mongoose = require('mongoose');
require('dotenv').config();

// Load models
const UserProgress = require('../models/UserProgress');
const QuizAttempt = require('../models/QuizAttempt');
const QuizResult = require('../models/QuizResult');
const KPIScore = require('../models/KPIScore');
const UserActivity = require('../models/UserActivity');
const UserSession = require('../models/UserSession');

async function resetProgressOnly() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edutech-pro');
        console.log('✅ Connected to MongoDB\n');

        console.log('🗑️  Clearing User Progress & Activity Data...');

        // 1. Clear Module Progress
        try {
            const progResult = await UserProgress.deleteMany({});
            console.log(`   ✓ Cleared ${progResult.deletedCount} UserProgress records`);
        } catch (e) {
            console.log('   ⚠ UserProgress collection error:', e.message);
        }

        // 2. Clear Quiz Attempts & Results
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

        // 3. Clear KPI Scores (Performance Data)
        try {
            const kpiResult = await KPIScore.deleteMany({});
            console.log(`   ✓ Cleared ${kpiResult.deletedCount} KPIScores`);
        } catch (e) {
            console.log('   ⚠ KPIScore collection error:', e.message);
        }

        // 4. Clear User Activity/Sessions (Optional, but good for clean slate)
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

        console.log('\n===================================================');
        console.log('✅ PROGRESS RESET COMPLETE');
        console.log('===================================================');
        console.log('The following data was PRESERVED:');
        console.log('   • Users (Accounts)');
        console.log('   • Modules (Training Content)');
        console.log('   • Quizzes & Questions');
        console.log('   • Email Templates');
        console.log('   • Warnings');
        console.log('   • Certificates/Awards');
        console.log('   • Notifications');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

resetProgressOnly();
