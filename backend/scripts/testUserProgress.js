/**
 * Test script to verify UserProgress model works correctly
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testUserProgress() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning_db');
        console.log('Connected to MongoDB');

        const UserProgress = require('../models/UserProgress');

        // Test data
        const testUserId = new mongoose.Types.ObjectId('69413fd4db40800f22910c59');
        const testModuleId = new mongoose.Types.ObjectId('6941407d0c16960995d795ee');
        const testAssignmentId = new mongoose.Types.ObjectId('694145180c16960995d798b4');

        console.log('\n=== Test 1: Find existing progress for personalised module ===');
        const existingQuery = {
            userId: testUserId,
            moduleId: testModuleId,
            assignmentId: testAssignmentId
        };
        console.log('Query:', JSON.stringify(existingQuery));

        let existingProgress = await UserProgress.findOne(existingQuery);
        console.log('Found:', existingProgress ? 'Yes' : 'No');

        if (!existingProgress) {
            console.log('\n=== Test 2: Create new progress record ===');
            try {
                const newProgress = new UserProgress({
                    userId: testUserId,
                    moduleId: testModuleId,
                    assignmentId: testAssignmentId,
                    videoProgress: 25,
                    videoWatched: false,
                    lastVideoPosition: 50,
                    lastAccessedAt: new Date(),
                    status: 'in_progress'
                });

                await newProgress.save();
                console.log('Created successfully!');
                console.log('Progress:', newProgress.videoProgress);
                console.log('ID:', newProgress._id);

                existingProgress = newProgress;
            } catch (createError) {
                console.error('Create failed:', createError.message);

                if (createError.code === 11000) {
                    console.log('Duplicate key - trying to find with looser query...');

                    // Try to find any progress for this user+module
                    const anyProgress = await UserProgress.find({
                        userId: testUserId,
                        moduleId: testModuleId
                    });

                    console.log('Found', anyProgress.length, 'records for this user+module:');
                    anyProgress.forEach((p, i) => {
                        console.log(`  ${i + 1}. assignmentId: ${p.assignmentId}, progress: ${p.videoProgress}%`);
                    });
                }
            }
        }

        console.log('\n=== Test 3: Update existing progress ===');
        if (existingProgress) {
            existingProgress.videoProgress = 50;
            existingProgress.lastAccessedAt = new Date();
            await existingProgress.save();
            console.log('Updated successfully to:', existingProgress.videoProgress);
        }

        console.log('\n=== Test 4: List all progress for this user ===');
        const allProgress = await UserProgress.find({ userId: testUserId });
        console.log('Total records:', allProgress.length);
        allProgress.forEach((p, i) => {
            console.log(`  ${i + 1}. module: ${p.moduleId}, assignment: ${p.assignmentId || 'null'}, progress: ${p.videoProgress}%`);
        });

        console.log('\n=== Test 5: Check indexes ===');
        const collection = mongoose.connection.db.collection('userprogresses');
        const indexes = await collection.indexes();
        console.log('Indexes:');
        indexes.forEach((idx, i) => {
            console.log(`  ${i + 1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        console.log('\n=== All tests passed! ===');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testUserProgress();
