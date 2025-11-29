const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Multiple users data - Admin, Manager, HR, HOD, and Regular Users
const users = [
  // Admin Users
  {
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '9876543210',
    password: 'password123',
    userType: 'admin',
    department: 'Administration',
    designation: 'System Administrator',
    status: 'Active',
    isActive: true
  },
  {
    name: 'Super Admin',
    email: 'superadmin@example.com',
    phone: '9876543211',
    password: 'password123',
    userType: 'admin',
    department: 'Administration',
    designation: 'Super Administrator',
    status: 'Active',
    isActive: true
  },
  // Manager Users
  {
    name: 'Manager User',
    email: 'manager@example.com',
    phone: '9876543212',
    password: 'password123',
    userType: 'manager',
    department: 'Operations',
    designation: 'Operations Manager',
    status: 'Active',
    isActive: true
  },
  {
    name: 'Senior Manager',
    email: 'seniormanager@example.com',
    phone: '9876543213',
    password: 'password123',
    userType: 'manager',
    department: 'Operations',
    designation: 'Senior Operations Manager',
    status: 'Active',
    isActive: true
  },
  // HR Users
  {
    name: 'HR User',
    email: 'hr@example.com',
    phone: '9876543214',
    password: 'password123',
    userType: 'hr',
    department: 'Human Resources',
    designation: 'HR Manager',
    status: 'Active',
    isActive: true
  },
  {
    name: 'HR Executive',
    email: 'hrexecutive@example.com',
    phone: '9876543215',
    password: 'password123',
    userType: 'hr',
    department: 'Human Resources',
    designation: 'HR Executive',
    status: 'Active',
    isActive: true
  },
  // HOD Users
  {
    name: 'HOD User',
    email: 'hod@example.com',
    phone: '9876543216',
    password: 'password123',
    userType: 'hod',
    department: 'Operations',
    designation: 'Head of Department',
    status: 'Active',
    isActive: true
  },
  {
    name: 'Department Head',
    email: 'depthead@example.com',
    phone: '9876543217',
    password: 'password123',
    userType: 'hod',
    department: 'Operations',
    designation: 'Department Head',
    status: 'Active',
    isActive: true
  },
  // Regular Users (Field Executives)
  {
    name: 'Test User 1',
    email: 'user1@example.com',
    phone: '9876543218',
    password: 'password123',
    userType: 'user',
    department: 'General',
    designation: 'Field Executive',
    status: 'Active',
    isActive: true
  },
  {
    name: 'Test User 2',
    email: 'user2@example.com',
    phone: '9876543219',
    password: 'password123',
    userType: 'user',
    department: 'General',
    designation: 'Field Executive',
    status: 'Active',
    isActive: true
  },
  {
    name: 'Test User 3',
    email: 'user3@example.com',
    phone: '9876543220',
    password: 'password123',
    userType: 'user',
    department: 'General',
    designation: 'Field Executive',
    status: 'Active',
    isActive: true
  },
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '9876543221',
    password: 'password123',
    userType: 'user',
    department: 'General',
    designation: 'Field Executive',
    status: 'Active',
    isActive: true
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '9876543222',
    password: 'password123',
    userType: 'user',
    department: 'General',
    designation: 'Field Executive',
    status: 'Active',
    isActive: true
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edutech-pro';
    console.log('🔄 Connecting to MongoDB...');
    console.log(`📍 Connection URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}\n`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB successfully\n');

    // Generate salt for password hashing
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    console.log('🔐 Password hashing salt generated\n');

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const userData = users[i];

      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email.toLowerCase() });

        if (existingUser) {
          console.log(`⚠️  [${i + 1}/${users.length}] User already exists: ${userData.email} (${userData.userType})`);
          skippedCount++;
          continue;
        }

        // Validate required fields
        if (!userData.name || !userData.email || !userData.phone || !userData.password) {
          throw new Error(`Missing required fields for user: ${userData.email}`);
        }

        // Validate password length
        if (userData.password.length < 6) {
          throw new Error(`Password must be at least 6 characters for user: ${userData.email}`);
        }

        // Validate userType
        const validUserTypes = ['user', 'manager', 'hod', 'hr', 'admin'];
        if (!validUserTypes.includes(userData.userType)) {
          throw new Error(`Invalid userType '${userData.userType}' for user: ${userData.email}`);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Create user object
        const userToCreate = {
          name: userData.name.trim(),
          email: userData.email.toLowerCase().trim(),
          phone: userData.phone.trim(),
          password: hashedPassword,
          userType: userData.userType,
          department: userData.department || 'General',
          designation: userData.designation || 'Field Executive',
          status: userData.status || 'Active',
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          dateOfJoining: userData.dateOfJoining || new Date(),
          kpiScore: userData.kpiScore || 0
        };

        // Create user (employeeId will be auto-generated by pre-save hook)
        const user = await User.create(userToCreate);

        console.log(`✅ [${i + 1}/${users.length}] Created ${userData.userType.toUpperCase()}: ${userData.email} (Employee ID: ${user.employeeId || 'N/A'})`);
        createdCount++;

      } catch (error) {
        errorCount++;
        const errorMsg = `❌ [${i + 1}/${users.length}] Error creating user ${userData.email}: ${error.message}`;
        console.error(errorMsg);
        errors.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${createdCount} users`);
    console.log(`⚠️  Skipped (already exist): ${skippedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);

    if (errors.length > 0) {
      console.log('\n❌ Error Details:');
      errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.email}: ${err.error}`);
      });
    }

    // Login credentials summary
    console.log('\n' + '='.repeat(60));
    console.log('🔑 LOGIN CREDENTIALS');
    console.log('='.repeat(60));
    console.log('Default password for all users: password123\n');

    const userTypes = ['admin', 'manager', 'hr', 'hod', 'user'];
    userTypes.forEach(type => {
      const typeUsers = users.filter(u => u.userType === type);
      if (typeUsers.length > 0) {
        console.log(`\n${type.toUpperCase()} Users (can access ${type === 'user' ? 'User' : 'Admin'} panel):`);
        typeUsers.forEach(u => {
          console.log(`   📧 Email: ${u.email}`);
          console.log(`   🔑 Password: password123`);
          console.log(`   👤 UserType: ${type}`);
          console.log('');
        });
      }
    });

    console.log('='.repeat(60));
    console.log('✅ Seeding completed!\n');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error during seeding:', error.message);

    if (error.name === 'MongoServerSelectionError' || error.name === 'MongooseServerSelectionError') {
      console.error('\n💡 MongoDB connection failed. Please check:');
      console.error('   1. Is MongoDB running?');
      console.error('   2. Is the connection URI correct?');
      console.error('   3. Check your .env file for MONGODB_URI');
      console.error(`\n   Current URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/edutech-pro'}`);
    } else {
      console.error('Error details:', error);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
    }

    // Try to close connection
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    } catch (closeError) {
      // Ignore close errors
    }

    process.exit(1);
  }
}

// Run the seeding function
seedUsers();

