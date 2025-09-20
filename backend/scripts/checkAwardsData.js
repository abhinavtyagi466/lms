const mongoose = require('mongoose');
const Award = require('../models/Award');
const AuditNotice = require('../models/AuditNotice');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';

const checkAwardsData = async () => {
  try {
    console.log('Checking awards and notices data in database...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check Award collection
    const awards = await Award.find({});
    console.log(`\n=== AWARD COLLECTION ===`);
    console.log(`Total awards found: ${awards.length}`);
    
    if (awards.length > 0) {
      console.log('Sample awards:');
      awards.slice(0, 3).forEach(award => {
        console.log(`- ID: ${award._id}`);
        console.log(`  Type: ${award.type}`);
        console.log(`  Title: ${award.title}`);
        console.log(`  Certificate URL: ${award.certificateUrl || 'N/A'}`);
        console.log(`  Created: ${award.createdAt}`);
        console.log('---');
      });
    }
    
    // Check AuditNotice collection
    const notices = await AuditNotice.find({});
    console.log(`\n=== AUDIT NOTICE COLLECTION ===`);
    console.log(`Total notices found: ${notices.length}`);
    
    if (notices.length > 0) {
      console.log('Sample notices:');
      notices.slice(0, 3).forEach(notice => {
        console.log(`- ID: ${notice._id}`);
        console.log(`  Title: ${notice.title}`);
        console.log(`  PDF URL: ${notice.pdfUrl || 'N/A'}`);
        console.log(`  Created: ${notice.createdAt}`);
        console.log('---');
      });
    }
    
    // Check for any documents with certificate-like data
    console.log(`\n=== SEARCHING FOR CERTIFICATE DATA ===`);
    
    // Search in Award collection for certificates
    const awardCertificates = await Award.find({ type: 'certificate' });
    console.log(`Award certificates: ${awardCertificates.length}`);
    
    // Search in AuditNotice collection for any certificate-like entries
    const noticeCertificates = await AuditNotice.find({ 
      $or: [
        { title: { $regex: /certificate/i } },
        { description: { $regex: /certificate/i } }
      ]
    });
    console.log(`Notice certificates: ${noticeCertificates.length}`);
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
};

// Run check if this script is executed directly
if (require.main === module) {
  checkAwardsData();
}

module.exports = { checkAwardsData };
