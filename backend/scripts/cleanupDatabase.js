const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edutech-pro';

const cleanupDatabase = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.collections();
        const preservedCollections = ['users', 'modules'];

        console.log('Starting database cleanup...');
        console.log(`Preserving collections: ${preservedCollections.join(', ')}`);

        for (const collection of collections) {
            const collectionName = collection.collectionName;

            if (!preservedCollections.includes(collectionName)) {
                console.log(`Dropping collection: ${collectionName}`);
                try {
                    await collection.drop();
                    console.log(`✅ Dropped ${collectionName}`);
                } catch (error) {
                    console.error(`❌ Failed to drop ${collectionName}:`, error.message);
                }
            } else {
                console.log(`🛡️  Skipping preserved collection: ${collectionName}`);
            }
        }

        console.log('Database cleanup completed.');
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};

cleanupDatabase();
