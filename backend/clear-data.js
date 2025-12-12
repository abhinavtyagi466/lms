const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/LMS';

// Import Models
const Module = require('./models/Module');
const Quiz = require('./models/Quiz');
const UserProgress = require('./models/UserProgress');
const TrainingAssignment = require('./models/TrainingAssignment');
// Questions are often embedded or separate, assume separate if model exists
// Checking common models...
// If Question model exists, delete it too. But I'll stick to the requested ones + Progress.

async function clearData() {
    try {
        console.log('Connecting to MongoDB...', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // 1. Clear Modules
        const modulesResult = await Module.deleteMany({});
        console.log(`Deleted ${modulesResult.deletedCount} Modules.`);

        // 2. Clear Quizzes
        const quizzesResult = await Quiz.deleteMany({});
        console.log(`Deleted ${quizzesResult.deletedCount} Quizzes.`);

        // 3. Clear User Progress (Crucial for resetting "sab zero" state)
        const progressResult = await UserProgress.deleteMany({});
        console.log(`Deleted ${progressResult.deletedCount} Progress Records.`);

        // 4. Clear Training Assignments
        const assignmentResult = await TrainingAssignment.deleteMany({});
        console.log(`Deleted ${assignmentResult.deletedCount} Training Assignments.`);

        // 5. Try to clear Questions if collection exists
        try {
            const Question = require('./models/Question');
            const questionsResult = await Question.deleteMany({});
            console.log(`Deleted ${questionsResult.deletedCount} Questions.`);
        } catch (e) {
            console.log('Question model not found or failed to delete, skipping.');
        }

        console.log('===========================================');
        console.log('DATABASE CLEARED SUCCESSFULLY. START FRESH.');
        console.log('===========================================');

        process.exit(0);
    } catch (error) {
        console.error('Error clearing data:', error);
        process.exit(1);
    }
}

clearData();
