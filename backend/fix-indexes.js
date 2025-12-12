const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/LMS';

async function fixIndexes() {
    try {
        console.log('Connecting to MongoDB...', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('userprogresses');

        // List indexes
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes.map(i => i.name));

        // Drop the problematic index
        const indexName = 'userId_1_moduleId_1';
        const indexExists = indexes.some(idx => idx.name === indexName);

        if (indexExists) {
            console.log(`Dropping index: ${indexName}`);
            await collection.dropIndex(indexName);
            console.log('Index dropped successfully');
        } else {
            console.log(`Index ${indexName} not found.`);
        }

        // Note: The correct index userId_1_moduleId_1_assignmentId_1 is defined in the model
        // and Mongoose should create it automatically when the app restarts.

        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixIndexes();
