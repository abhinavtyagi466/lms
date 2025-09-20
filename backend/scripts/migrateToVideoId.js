const mongoose = require('mongoose');
const Module = require('../models/Module');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';

// Function to extract video ID from YouTube URL
const getVideoId = (url) => {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

// Migration function
const migrateToVideoId = async () => {
  try {
    console.log('Starting migration from ytUrl to ytVideoId...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all modules with ytUrl field
    const modules = await Module.find({});
    console.log(`Found ${modules.length} modules to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const module of modules) {
      try {
        // Check if module has ytUrl field
        if (module.ytUrl) {
          const videoId = getVideoId(module.ytUrl);
          
          if (videoId) {
            // Update the module with ytVideoId
            await Module.findByIdAndUpdate(module._id, {
              $set: { ytVideoId: videoId },
              $unset: { ytUrl: 1 }
            });
            
            console.log(`✓ Migrated module "${module.title}": ${module.ytUrl} → ${videoId}`);
            migratedCount++;
          } else {
            console.log(`⚠ Skipped module "${module.title}": Invalid YouTube URL - ${module.ytUrl}`);
            skippedCount++;
          }
        } else if (module.ytVideoId) {
          console.log(`ℹ Module "${module.title}" already has ytVideoId: ${module.ytVideoId}`);
          skippedCount++;
        } else {
          console.log(`⚠ Module "${module.title}" has no video URL`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`✗ Error migrating module "${module.title}":`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total modules: ${modules.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (migratedCount > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('You can now restart your backend server.');
    } else {
      console.log('\nℹ No modules needed migration.');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToVideoId();
}

module.exports = { migrateToVideoId };
