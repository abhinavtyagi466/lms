/**
 * Script to check and fix UserProgress records for the problematic user+module
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixRecords() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning_db');
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.db.collection('userprogresses');

        // Test IDs from the error
        const testUserId = new mongoose.Types.ObjectId('69413fd4db40800f22910c59');
        const testModuleId = new mongoose.Types.ObjectId('6941407d0c16960995d795ee');
        const testAssignmentId = new mongoose.Types.ObjectId('694145180c16960995d798b4');

        console.log('\n=== Finding all records for this user + module ===');
        const records = await collection.find({
            userId: testUserId,
            moduleId: testModuleId
        }).toArray();

        console.log('Found', records.length, 'records:');
        records.forEach((r, i) => {
            console.log(`\n  Record ${i + 1}:`);
            console.log('    _id:', r._id);
            console.log('    assignmentId:', r.assignmentId || 'NULL');
            console.log('    videoProgress:', r.videoProgress);
            console.log('    lastAccessedAt:', r.lastAccessedAt);
        });

        // Check if there's a record with assignmentId = null that might be conflicting
        const nullRecord = records.find(r => r.assignmentId === null);
        const assignmentRecord = records.find(r => r.assignmentId && r.assignmentId.toString() === testAssignmentId.toString());

        if (nullRecord && !assignmentRecord) {
            console.log('\n=== Found record with null assignmentId ===');
            console.log('This might be causing issues. For personalised modules, we need a record with the assignmentId.');
            console.log('Updating this record to have the correct assignmentId...');

            await collection.updateOne(
                { _id: nullRecord._id },
                { $set: { assignmentId: testAssignmentId } }
            );
            console.log('Updated successfully!');
        } else if (!assignmentRecord) {
            console.log('\n=== No record with assignmentId exists ===');
            console.log('Creating one...');

            await collection.insertOne({
                userId: testUserId,
                moduleId: testModuleId,
                assignmentId: testAssignmentId,
                videoProgress: 0,
                videoWatched: false,
                lastVideoPosition: 0,
                lastAccessedAt: new Date(),
                bestScore: 0,
                bestPercentage: 0,
                passed: false,
                certificateIssued: false,
                quizAttempts: [],
                status: 'not_started',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('Created successfully!');
        } else {
            console.log('\n=== Record with correct assignmentId already exists ===');
            console.log('ID:', assignmentRecord._id);
            console.log('Progress:', assignmentRecord.videoProgress);
        }

        console.log('\n=== Final state ===');
        const finalRecords = await collection.find({
            userId: testUserId,
            moduleId: testModuleId
        }).toArray();

        finalRecords.forEach((r, i) => {
            console.log(`  ${i + 1}. assignmentId: ${r.assignmentId || 'NULL'}, progress: ${r.videoProgress}%`);
        });

        console.log('\n=== Done ===');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixRecords();
