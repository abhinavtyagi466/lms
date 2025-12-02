const mongoose = require('mongoose');
const Warning = require('./models/Warning');
require('dotenv').config();

const checkWarnings = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const warnings = await Warning.find({}).sort({ issuedAt: -1 }).limit(5);
        console.log('Latest 5 Warnings:');
        console.log(JSON.stringify(warnings, null, 2));

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkWarnings();
