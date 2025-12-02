const mongoose = require('mongoose');
require('dotenv').config();

// Import Quiz model
const quizSchema = new mongoose.Schema({
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    questions: Array,
    passPercent: Number,
    isActive: Boolean,
    estimatedTime: Number
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);

async function forceCleanup() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
        console.log('Connected successfully');

        // Count all quizzes before
        const totalBefore = await Quiz.countDocuments({});
        console.log('Total quizzes before cleanup:', totalBefore);

        // Find quizzes with null moduleId
        const orphaned = await Quiz.find({
            $or: [
                { moduleId: null },
                { moduleId: { $exists: false } }
            ]
        });
        console.log('Orphaned quizzes found:', orphaned.length);

        if (orphaned.length > 0) {
            console.log('\nOrphaned quiz IDs:');
            orphaned.forEach(q => {
                console.log(`  - ${q._id} (moduleId: ${q.moduleId}, questions: ${q.questions?.length || 0})`);
            });

            // Force delete
            console.log('\nDeleting orphaned quizzes...');
            const deleteResult = await Quiz.deleteMany({
                $or: [
                    { moduleId: null },
                    { moduleId: { $exists: false } }
                ]
            });
            console.log('Delete result:', deleteResult);
            console.log('Deleted count:', deleteResult.deletedCount);
        }

        // Count remaining
        const totalAfter = await Quiz.countDocuments({});
        console.log('\nTotal quizzes after cleanup:', totalAfter);

        // Show remaining quizzes
        const remaining = await Quiz.find({}).select('_id moduleId');
        console.log('\nRemaining quizzes:');
        for (const quiz of remaining) {
            console.log(`  - ${quiz._id} (moduleId: ${quiz.moduleId})`);
        }

        console.log('\n✅ Cleanup completed');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

forceCleanup();
