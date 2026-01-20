/**
 * Script to insert 200 dummy users for testing User Management page performance
 * Run: node scripts/insertDummyUsers.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    phone: String,
    userType: { type: String, enum: ['user', 'admin', 'manager', 'hod', 'hr'], default: 'user' },
    employeeId: String,
    status: { type: String, default: 'Active' },
    isActive: { type: Boolean, default: true },
    dateOfBirth: Date,
    fathersName: String,
    dateOfJoining: Date,
    designation: String,
    department: String,
    reportingManager: String,
    highestEducation: String,
    currentAddress: String,
    nativeAddress: String,
    location: String,
    city: String,
    state: String,
    region: String,
    aadhaarNo: String,
    panNo: String,
    avatar: String,
    documents: Array,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { strict: false });

const User = mongoose.model('User', userSchema);

// Indian names for realistic data
const firstNames = ['Rahul', 'Amit', 'Priya', 'Neha', 'Vikram', 'Anjali', 'Suresh', 'Pooja', 'Rajesh', 'Sneha',
    'Arun', 'Divya', 'Kiran', 'Manish', 'Swati', 'Deepak', 'Kavita', 'Sanjay', 'Ritu', 'Mohit',
    'Anita', 'Vikas', 'Sunita', 'Ashok', 'Meera', 'Ramesh', 'Geeta', 'Sunil', 'Rekha', 'Manoj'];
const lastNames = ['Sharma', 'Verma', 'Singh', 'Kumar', 'Patel', 'Gupta', 'Joshi', 'Mishra', 'Yadav', 'Reddy',
    'Nair', 'Pillai', 'Iyer', 'Menon', 'Das', 'Ghosh', 'Banerjee', 'Mukherjee', 'Roy', 'Sen'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'];
const designations = ['Field Executive', 'Senior Executive', 'Team Lead', 'Associate', 'Trainee'];
const departments = ['Sales', 'Marketing', 'Operations', 'Support', 'Field'];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateEmployeeId(index) {
    return `FE${new Date().getFullYear().toString().slice(-2)}${String(100000 + index).slice(-6)}`;
}

function generatePhone() {
    return '9' + Math.floor(100000000 + Math.random() * 900000000).toString();
}

function generateAadhaar() {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

function generatePAN() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * 26)] +
        letters[Math.floor(Math.random() * 26)] +
        letters[Math.floor(Math.random() * 26)] +
        letters[Math.floor(Math.random() * 26)] +
        letters[Math.floor(Math.random() * 26)] +
        Math.floor(1000 + Math.random() * 9000).toString() +
        letters[Math.floor(Math.random() * 26)];
}

async function insertDummyUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const hashedPassword = await bcrypt.hash('Test@123', 10);
        const users = [];

        // Create 200 dummy users
        for (let i = 1; i <= 200; i++) {
            const firstName = getRandomItem(firstNames);
            const lastName = getRandomItem(lastNames);
            const cityIndex = Math.floor(Math.random() * cities.length);

            // Mix of user types: 180 users, 8 managers, 5 hod, 4 hr, 3 admin
            let userType = 'user';
            if (i > 197) userType = 'admin';
            else if (i > 193) userType = 'hr';
            else if (i > 188) userType = 'hod';
            else if (i > 180) userType = 'manager';

            // Some inactive users for testing
            const isActive = i <= 190;
            const status = isActive ? 'Active' : 'Inactive';

            users.push({
                name: `${firstName} ${lastName}`,
                email: `dummy.user${i}@testlms.com`,
                password: hashedPassword,
                phone: generatePhone(),
                userType: userType,
                employeeId: generateEmployeeId(i),
                status: status,
                isActive: isActive,
                dateOfBirth: new Date(1985 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                fathersName: `${getRandomItem(firstNames)} ${lastName}`,
                dateOfJoining: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                designation: getRandomItem(designations),
                department: getRandomItem(departments),
                reportingManager: userType === 'user' ? `Manager ${Math.ceil(i / 25)}` : '',
                highestEducation: getRandomItem(['B.Com', 'BBA', 'MBA', 'B.Tech', 'B.Sc', '12th Pass']),
                currentAddress: `${Math.floor(Math.random() * 500) + 1}, Street ${Math.floor(Math.random() * 50) + 1}, ${cities[cityIndex]}`,
                city: cities[cityIndex],
                state: states[cityIndex],
                region: getRandomItem(['North', 'South', 'East', 'West', 'Central']),
                aadhaarNo: generateAadhaar(),
                panNo: generatePAN(),
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        console.log('📝 Inserting 200 dummy users...');

        // Insert in batches to avoid timeout
        const batchSize = 50;
        let inserted = 0;

        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            try {
                await User.insertMany(batch, { ordered: false });
                inserted += batch.length;
                console.log(`   ✅ Inserted batch ${Math.ceil((i + 1) / batchSize)}: ${inserted}/${users.length} users`);
            } catch (err) {
                // Handle duplicate key errors (if some users already exist)
                if (err.code === 11000) {
                    console.log(`   ⚠️  Some users in batch ${Math.ceil((i + 1) / batchSize)} already exist, skipping duplicates`);
                } else {
                    throw err;
                }
            }
        }

        const totalCount = await User.countDocuments({});
        console.log(`\n✅ Done! Total users in database: ${totalCount}`);
        console.log('\n📊 User Type Distribution:');
        console.log(`   - Users (FE): ${await User.countDocuments({ userType: 'user' })}`);
        console.log(`   - Managers: ${await User.countDocuments({ userType: 'manager' })}`);
        console.log(`   - HOD: ${await User.countDocuments({ userType: 'hod' })}`);
        console.log(`   - HR: ${await User.countDocuments({ userType: 'hr' })}`);
        console.log(`   - Admins: ${await User.countDocuments({ userType: 'admin' })}`);
        console.log(`   - Active: ${await User.countDocuments({ isActive: true })}`);
        console.log(`   - Inactive: ${await User.countDocuments({ isActive: false })}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

insertDummyUsers();
