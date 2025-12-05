require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'name email userType isActive');
    console.log('\n=== ALL USERS ===');
    console.log(`Total: ${users.length} users`);
    console.log('');

    users.forEach(u => {
        console.log(`${u.name} | Type: ${u.userType} | Active: ${u.isActive}`);
    });

    // Count by type
    const userCount = await User.countDocuments({ userType: 'user' });
    const activeUserCount = await User.countDocuments({ userType: 'user', isActive: true });
    const adminCount = await User.countDocuments({ userType: 'admin' });

    console.log('\n=== COUNTS ===');
    console.log(`Total with userType='user': ${userCount}`);
    console.log(`Active with userType='user' and isActive=true: ${activeUserCount}`);
    console.log(`Admins: ${adminCount}`);

    mongoose.disconnect();
});
