/**
 * Script to clear all module progress data
 * This removes:
 * - All UserProgress records
 * - All Progress records (legacy)
 * - All TrainingAssignments (personalised modules)
 * - All QuizAttempts
 * - All QuizResults
 * 
 * This KEEPS:
 * - Modules (the actual training modules)
 * - Questions (quiz questions)
 * - Quizzes (quiz configurations)
 * - Users
 * 
 * Usage: node scripts/clearModuleProgress.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

async function clearModuleProgress() {
    try {
        console.log('\n===========================================');
        console.log('   MODULE PROGRESS DATA CLEANUP SCRIPT');
        console.log('===========================================\n');

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning_db');
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Check current data counts
        console.log('📊 Current data counts:');
        const collections = [
            'userprogresses',
            'progresses',
            'trainingassignments',
            'quizattempts',
            'quizresults'
        ];

        const counts = {};
        for (const col of collections) {
            try {
                counts[col] = await db.collection(col).countDocuments();
                console.log(`   ${col}: ${counts[col]} documents`);
            } catch (e) {
                counts[col] = 0;
                console.log(`   ${col}: 0 documents (collection doesn't exist)`);
            }
        }

        const totalToDelete = Object.values(counts).reduce((a, b) => a + b, 0);

        if (totalToDelete === 0) {
            console.log('\n✅ Nothing to delete! All collections are already empty.');
            process.exit(0);
        }

        console.log(`\n⚠️  Total documents to delete: ${totalToDelete}`);
        console.log('\nThis will DELETE ALL:');
        console.log('  - User video progress');
        console.log('  - Personalised module assignments');
        console.log('  - Quiz attempts and results');
        console.log('\nThis will KEEP:');
        console.log('  - Training modules');
        console.log('  - Quiz questions');
        console.log('  - User accounts');

        // Ask for confirmation
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise((resolve) => {
            rl.question('\n❓ Are you sure you want to proceed? (yes/no): ', resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'yes') {
            console.log('\n❌ Cancelled. No data was deleted.');
            process.exit(0);
        }

        // Delete data
        console.log('\n🗑️  Deleting data...\n');

        for (const col of collections) {
            try {
                const result = await db.collection(col).deleteMany({});
                console.log(`   ✅ ${col}: Deleted ${result.deletedCount} documents`);
            } catch (e) {
                console.log(`   ⚠️  ${col}: Skipped (${e.message})`);
            }
        }

        // Also fix/recreate indexes
        console.log('\n🔧 Fixing indexes...');
        try {
            const userProgressCol = db.collection('userprogresses');

            // Drop all indexes except _id
            const indexes = await userProgressCol.indexes();
            for (const idx of indexes) {
                if (idx.name !== '_id_') {
                    try {
                        await userProgressCol.dropIndex(idx.name);
                        console.log(`   Dropped index: ${idx.name}`);
                    } catch (e) {
                        // Ignore
                    }
                }
            }

            // Recreate compound index
            await userProgressCol.createIndex(
                { userId: 1, moduleId: 1, assignmentId: 1 },
                { unique: true, name: 'userId_moduleId_assignmentId_unique' }
            );
            console.log('   ✅ Recreated compound index');
        } catch (e) {
            console.log('   ⚠️  Index fix skipped:', e.message);
        }

        console.log('\n===========================================');
        console.log('   ✅ CLEANUP COMPLETE!');
        console.log('===========================================');
        console.log('\nAll module progress data has been cleared.');
        console.log('Users can now start fresh with their modules.\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

clearModuleProgress();
