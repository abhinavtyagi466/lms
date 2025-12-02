const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
require('dotenv').config();

async function cleanupOrphanedQuizzes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
        console.log('Connected to MongoDB');

        // Find all quizzes with null moduleId
        const orphanedQuizzes = await Quiz.find({
            $or: [
                { moduleId: null },
                { moduleId: { $exists: false } }
            ]
        });

        console.log('Found orphaned quizzes:', orphanedQuizzes.length);

        if (orphanedQuizzes.length > 0) {
            console.log('Deleting orphaned quizzes...');

            // Delete all orphaned quizzes
            const result = await Quiz.deleteMany({
                $or: [
                    { moduleId: null },
                    { moduleId: { $exists: false } }
                ]
            });

            console.log('Successfully deleted:', result.deletedCount, 'quizzes');
        } else {
            console.log('No orphaned quizzes found');
        }

        // Show remaining quizzes
        const remainingQuizzes = await Quiz.countDocuments({});
        console.log('Remaining quizzes in database:', remainingQuizzes);

        console.log('Cleanup completed successfully');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('Error during cleanup:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the cleanup
cleanupOrphanedQuizzes();

