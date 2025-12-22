/**
 * Script to fix UserProgress collection index issues
 * This drops and recreates the compound index to resolve duplicate key errors
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning_db');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('userprogresses');

        console.log('\n=== Current Indexes ===');
        const indexes = await collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

        // Find the problematic index
        const compoundIndex = indexes.find(idx =>
            idx.key && idx.key.userId && idx.key.moduleId && idx.key.assignmentId
        );

        if (compoundIndex) {
            console.log('\n=== Dropping compound index ===');
            console.log('Index name:', compoundIndex.name);

            try {
                await collection.dropIndex(compoundIndex.name);
                console.log('Index dropped successfully');
            } catch (e) {
                console.log('Error dropping index:', e.message);
            }
        }

        // Check for duplicate documents
        console.log('\n=== Checking for duplicates ===');
        const duplicates = await collection.aggregate([
            {
                $group: {
                    _id: { userId: '$userId', moduleId: '$moduleId', assignmentId: '$assignmentId' },
                    count: { $sum: 1 },
                    docs: { $push: '$_id' }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();

        if (duplicates.length > 0) {
            console.log('Found', duplicates.length, 'duplicate groups');

            for (const dup of duplicates) {
                console.log('Duplicate:', dup._id, 'Count:', dup.count);
                // Keep the first one, delete the rest
                const toDelete = dup.docs.slice(1);
                console.log('Deleting', toDelete.length, 'duplicates');
                await collection.deleteMany({ _id: { $in: toDelete } });
            }
            console.log('Duplicates removed');
        } else {
            console.log('No duplicates found');
        }

        // Recreate the index
        console.log('\n=== Creating new compound index ===');
        await collection.createIndex(
            { userId: 1, moduleId: 1, assignmentId: 1 },
            { unique: true, name: 'userId_moduleId_assignmentId_unique' }
        );
        console.log('Index created successfully');

        // Show final indexes
        console.log('\n=== Final Indexes ===');
        const finalIndexes = await collection.indexes();
        console.log(JSON.stringify(finalIndexes, null, 2));

        // Show document count
        const count = await collection.countDocuments();
        console.log('\nTotal documents:', count);

        console.log('\n=== Done ===');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixIndex();
