// Reset Database Script - Keeps Users and Email Data Only
// This script removes all data EXCEPT:
// - Users (admins, FEs, etc.)
// - Email templates and email logs
// Everything else will be deleted (modules, quizzes, progress, etc.)

const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning_db';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Collections to KEEP (will NOT be deleted)
        const collectionsToKeep = [
            'users',           // All users (admins, FEs, etc.)
            'emailtemplates',  // Email templates
            'emaillogs',       // Email logs/history
            'emailconfigs',    // Email configurations
        ];

        // Get all collections in the database
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        console.log('📋 All collections in database:');
        collectionNames.forEach(name => {
            const keep = collectionsToKeep.includes(name.toLowerCase());
            console.log(`   ${keep ? '🔒 KEEP' : '🗑️  DELETE'}: ${name}`);
        });

        console.log('\n⚠️  The following will be DELETED:');
        const toDelete = collectionNames.filter(name =>
            !collectionsToKeep.includes(name.toLowerCase())
        );
        toDelete.forEach(name => console.log(`   - ${name}`));

        console.log('\n✅ The following will be KEPT:');
        collectionsToKeep.forEach(name => {
            const exists = collectionNames.some(c => c.toLowerCase() === name.toLowerCase());
            console.log(`   - ${name} ${exists ? '(exists)' : '(not found)'}`);
        });

        // Ask for confirmation
        console.log('\n🚨 WARNING: This action is IRREVERSIBLE!');
        console.log('   All progress, modules, quizzes, attempts, etc. will be permanently deleted.');
        console.log('\n   To proceed, run: node reset-database.js --confirm\n');

        // Check for --confirm flag
        if (process.argv.includes('--confirm')) {
            console.log('🔄 Starting database reset...\n');

            let deletedCount = 0;
            for (const collectionName of toDelete) {
                try {
                    const result = await db.collection(collectionName).deleteMany({});
                    console.log(`   ✅ Cleared ${collectionName}: ${result.deletedCount} documents deleted`);
                    deletedCount += result.deletedCount;
                } catch (err) {
                    console.log(`   ⚠️  Error clearing ${collectionName}:`, err.message);
                }
            }

            console.log(`\n🎉 Database reset complete! ${deletedCount} total documents deleted.`);
            console.log('   Users and email data have been preserved.');
        }

        await mongoose.connection.close();
        console.log('\n✅ Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resetDatabase();
