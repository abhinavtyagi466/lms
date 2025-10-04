const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[0-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  // Personal Information
  dateOfBirth: {
    type: Date
  },
  fathersName: {
    type: String,
    trim: true,
    maxlength: [100, 'Father\'s name cannot be more than 100 characters']
  },
  
  // Address Information
  currentAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Current address cannot be more than 500 characters']
  },
  nativeAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Native address cannot be more than 500 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City cannot be more than 50 characters']
  },
  state: {
    type: String,
    trim: true,
    maxlength: [50, 'State cannot be more than 50 characters']
  },
  region: {
    type: String,
    trim: true,
    maxlength: [100, 'Region cannot be more than 100 characters']
  },
  aadhaarNo: {
    type: String,
    trim: true,
    match: [/^[0-9]{12}$/, 'Aadhaar number must be exactly 12 digits'],
    sparse: true
  },
  panNo: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN number must be in format: ABCDE1234F'],
    sparse: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  userType: {
    type: String,
    enum: ['user', 'manager', 'hod', 'hr', 'admin'],
    default: 'user'
  },
  // Employment Information
  dateOfJoining: {
    type: Date
  },
  designation: {
    type: String,
    trim: true,
    maxlength: [100, 'Designation cannot be more than 100 characters']
  },
  department: {
    type: String,
    trim: true,
    default: 'General'
  },
  reportingManager: {
    type: String,
    trim: true,
    maxlength: [100, 'Reporting manager name cannot be more than 100 characters']
  },
  highestEducation: {
    type: String,
    trim: true,
    maxlength: [100, 'Education qualification cannot be more than 100 characters']
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Warning', 'Audited', 'Inactive'],
    default: 'Active'
  },
  kpiScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastLogin: {
    type: Date
  },
  sessionId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Document Uploads
  avatar: {
    type: String
  },
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['aadhaar', 'pan', 'education', 'experience', 'other'],
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  inactiveReason: {
    type: String,
    enum: ['Performance Issues', 'Policy Violation', 'Attendance Problems', 'Behavioral Issues', 'Resignation', 'Termination', 'Other'],
    default: null
  },
  inactiveRemark: {
    type: String,
    trim: true,
    maxlength: [500, 'Inactive remark cannot be more than 500 characters']
  },
  inactiveDate: {
    type: Date
  },
  inactiveBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Index for better query performance
userSchema.index({ status: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to generate unique employee ID
userSchema.statics.generateEmployeeId = async function() {
  try {
    console.log('Starting Employee ID generation...');
    let employeeId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate ID with format: FE + YY + MM + 4-digit sequential number
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      console.log(`Attempt ${attempts + 1}: Generating ID for ${year}-${month}`);
      
      // Get count of users created this month for sequential numbering
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const count = await this.countDocuments({
        createdAt: { $gte: startOfMonth }
      });
      
      const sequentialNumber = (count + 1).toString().padStart(4, '0');
      employeeId = `FE${year}${month}${sequentialNumber}`;
      
      console.log(`Generated Employee ID: ${employeeId}`);
      
      // Check if this ID already exists
      const existingUser = await this.findOne({ employeeId });
      if (!existingUser) {
        isUnique = true;
        console.log(`Employee ID ${employeeId} is unique!`);
      } else {
        console.log(`Employee ID ${employeeId} already exists, trying again...`);
      }
      
      attempts++;
    }

    if (!isUnique) {
      // Fallback to timestamp-based ID if we can't generate a unique sequential one
      employeeId = `FE${Date.now().toString().slice(-8)}`;
      console.log(`Using fallback Employee ID: ${employeeId}`);
    }

    console.log(`Final Employee ID: ${employeeId}`);
    return employeeId;
  } catch (error) {
    console.error('Error in generateEmployeeId:', error);
    // Return a simple fallback ID
    return `FE${Date.now().toString().slice(-8)}`;
  }
};

// Auto-generate employeeId if not provided
userSchema.pre('save', async function(next) {
  if (!this.employeeId && this.isNew) {
    try {
      console.log('Generating Employee ID for new user:', this.name);
      this.employeeId = await this.constructor.generateEmployeeId();
      console.log('Generated Employee ID:', this.employeeId);
    } catch (error) {
      console.error('Error generating employee ID:', error);
      console.error('Error details:', error.message);
      // Fallback to timestamp-based ID
      this.employeeId = `FE${Date.now().toString().slice(-8)}`;
      console.log('Using fallback Employee ID:', this.employeeId);
    }
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Instance method to generate new session ID
userSchema.methods.generateSessionId = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// Instance method to clear session
userSchema.methods.clearSession = function() {
  this.sessionId = undefined;
  return this.save();
};

// Static method to find users by status
userSchema.statics.findByStatus = function(status) {
  return this.find({ status: status, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
// Emit socket event when a new user is created
userSchema.post('save', function(doc) {
  if (this.isNew) {
    try {
      const app = require('../server');
      if (app && app.get) {
        const io = app.get('io');
        if (io) {
          io.emit('user:created', { _id: doc._id, name: doc.name, email: doc.email, createdAt: doc.createdAt });
        }
      }
    } catch (e) {
      // ignore errors
    }
  }
});