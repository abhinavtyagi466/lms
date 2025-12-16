const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');
const KPIScore = require('../models/KPIScore');
const Notification = require('../models/Notification');
const AuditRecord = require('../models/AuditRecord');
const Award = require('../models/Award');
const emailService = require('../services/emailService');
const { authenticateToken, requireAdmin, requireAdminPanel, requireOwnershipOrAdmin, requireUserManagementAccess } = require('../middleware/auth');
const { validateCreateUser, validateUpdateUser, validateObjectId, validateUserId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// File upload storage for exit documents
const exitDocsDir = process.env.NODE_ENV === 'production'
  ? '/var/www/lms/backend/uploads/exit-documents'
  : path.join(__dirname, '..', 'uploads', 'exit-documents');
if (!fs.existsSync(exitDocsDir)) {
  fs.mkdirSync(exitDocsDir, { recursive: true });
}

const exitDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, exitDocsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `exit-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, uniqueName);
  }
});

const exitDocUpload = multer({
  storage: exitDocStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, and PNG files are allowed. Please upload a valid document.'));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    return res.status(400).json({
      error: 'File Upload Error',
      message: error.message
    });
  } else if (error) {
    // Handle busboy "Unexpected end of form" error gracefully
    if (error.message && error.message.includes('Unexpected end of form')) {
      console.warn('Empty or incomplete multipart form detected, continuing without file');
      // Clear any partial file data
      req.file = undefined;
      return next();
    }
    console.error('File upload error:', error);
    return res.status(400).json({
      error: 'File Upload Error',
      message: error.message
    });
  }
  next();
};

// Conditional multer middleware - only processes multipart/form-data requests
const conditionalMulter = (multerMiddleware) => {
  return (req, res, next) => {
    const contentType = req.get('Content-Type') || '';
    const contentTypeLower = contentType.toLowerCase();
    console.log('🔍 conditionalMulter - Content-Type:', contentType);
    console.log('🔍 conditionalMulter - Path:', req.path);
    console.log('🔍 conditionalMulter - Method:', req.method);
    console.log('🔍 conditionalMulter - Is multipart?', contentTypeLower.includes('multipart/form-data'));

    if (contentTypeLower.includes('multipart/form-data')) {
      console.log('✅ Multipart detected, using multer middleware');
      // Ensure req.body exists
      if (!req.body) {
        req.body = {};
      }
      console.log('📦 req.body before multer:', Object.keys(req.body));

      // Wrap in try-catch to handle busboy errors
      try {
        multerMiddleware(req, res, (err) => {
          if (err) {
            console.error('❌ Multer error:', err.message);
            // Handle busboy "Unexpected end of form" error gracefully
            if (err.message && (err.message.includes('Unexpected end of form') || err.message.includes('Unexpected end of multipart stream'))) {
              console.warn('⚠️ Empty or incomplete multipart form detected, continuing without file');
              req.file = undefined;
              // Ensure req.body exists even if parsing failed
              if (!req.body) {
                req.body = {};
              }
              console.log('📦 req.body after multer (error case):', Object.keys(req.body));
              return next();
            }
            return handleMulterError(err, req, res, next);
          }
          // Ensure req.body exists after successful parsing
          if (!req.body) {
            req.body = {};
          }
          console.log('✅ Multer completed successfully');
          console.log('📦 req.body after multer:', Object.keys(req.body));
          console.log('📦 req.body values:', req.body);
          next();
        });
      } catch (error) {
        console.error('❌ Multer catch error:', error.message);
        // Catch any synchronous errors
        if (error.message && (error.message.includes('Unexpected end of form') || error.message.includes('Unexpected end of multipart stream'))) {
          console.warn('⚠️ Empty or incomplete multipart form detected (sync), continuing without file');
          req.file = undefined;
          // Ensure req.body exists
          if (!req.body) {
            req.body = {};
          }
          return next();
        }
        return handleMulterError(error, req, res, next);
      }
    } else {
      // Not multipart, skip multer
      console.log('⏭️ Not multipart, skipping multer');
      next();
    }
  };
};

// File upload storage for warnings and certificates
const notificationsDir = process.env.NODE_ENV === 'production'
  ? '/var/www/lms/backend/uploads/notifications'
  : path.join(__dirname, '..', 'uploads', 'notifications');
if (!fs.existsSync(notificationsDir)) {
  fs.mkdirSync(notificationsDir, { recursive: true });
}

const notificationStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, notificationsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    const uniqueName = `notification-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, uniqueName);
  }
});

const notificationUpload = multer({
  storage: notificationStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// @route   GET /api/users/:id/profile
// @desc    Get user profile by ID
// @access  Private (user can access own profile, admin can access any)
router.get('/:id/profile', authenticateToken, validateObjectId, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Users route: Getting profile for userId:', userId);

    // Check if database is connected
    // if (mongoose.connection.readyState !== 1) {
    //   return res.status(503).json({
    //     error: 'Service Unavailable',
    //     message: 'Database connection is not available'
    //   });
    // }

    const user = await User.findById(userId).select('-password');
    console.log('Users route: Found user:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('Users route: User not found for userId:', userId);
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Get latest KPI score
    const latestKPI = await KPIScore.getLatestForUser(userId);

    const userProfile = {
      ...user.toJSON(),
      kpiScore: latestKPI ? latestKPI.overallScore : 0,
      kpiRating: latestKPI ? latestKPI.rating : 'No Score'
    };

    console.log('Users route: Sending user profile response');
    console.log('Users route: Avatar path in response:', userProfile.avatar);
    console.log('Users route: Documents count:', userProfile.documents?.length || 0);
    res.json(userProfile);

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user profile'
    });
  }
});

// Ensure GET /api/users returns users with required fields
// @access Private (Admin panel only)
router.get('/', authenticateToken, requireAdminPanel, async (req, res) => {
  try {
    const { filter, search, page = 1, limit = 50 } = req.query;
    let query = {};

    // Apply status filter
    if (filter && filter !== 'all') {
      if (filter === 'active') {
        query.isActive = true;
        // query.status = 'Active'; // Removed to include all active users (e.g. Warning, Audited)
      } else if (filter === 'inactive') {
        query.isActive = false;
      } else if (filter === 'warning') {
        query.status = 'Warning';
      } else if (filter === 'audited') {
        query.status = 'Audited';
      } else {
        query.status = filter;
      }
    }

    // Apply search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { aadhaarNo: { $regex: search, $options: 'i' } },
        { panNo: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    console.log('=== USERS API DEBUG ===');
    console.log('Users found:', users.length);
    console.log('First user userType:', users[0]?.userType);
    console.log('All userTypes:', users.map(u => u.userType));
    console.log('========================');

    res.json({ success: true, users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Error fetching users' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin panel only)
router.get('/stats', authenticateToken, requireAdminPanel, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ isActive: true, status: 'Active' });
    const warningUsers = await User.countDocuments({ status: 'Warning' });
    const auditedUsers = await User.countDocuments({ status: 'Audited' });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const stats = {
      total: totalUsers,
      active: activeUsers,
      warning: warningUsers,
      audited: auditedUsers,
      inactive: inactiveUsers
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Error fetching user stats' });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, validateCreateUser, async (req, res) => {
  try {
    console.log('Create user request received:', req.body);
    console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');

    // Clean req.body - remove empty objects that might come from FormData
    if (req.files || req.headers['content-type']?.includes('multipart/form-data')) {
      Object.keys(req.body).forEach(key => {
        const value = req.body[key];
        // Remove empty objects
        if (typeof value === 'object' && !Array.isArray(value) && value !== null && Object.keys(value).length === 0) {
          delete req.body[key];
        }
        // Remove empty arrays
        if (Array.isArray(value) && value.length === 0) {
          delete req.body[key];
        }
      });
    }

    const {
      name, email, password, phone, userType,
      dateOfBirth, fathersName,
      dateOfJoining, designation, department, reportingManager, highestEducation,
      currentAddress, nativeAddress, location, city, state, region,
      aadhaarNo, panNo
    } = req.body;

    // Check if database is connected
    // if (mongoose.connection.readyState !== 1) {
    //   return res.status(503).json({
    //     error: 'Service Unavailable',
    //     message: 'Database connection is not available'
    //   });
    // }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Check for duplicate Phone number
    if (phone && phone.trim()) {
      const existingPhone = await User.findOne({ phone: phone.trim() });
      if (existingPhone) {
        console.log('Duplicate Phone number:', phone);
        return res.status(409).json({
          error: 'Duplicate Phone',
          message: 'This mobile number is already registered with another user',
          field: 'phone'
        });
      }
    }

    // Check for duplicate Aadhaar number
    if (aadhaarNo && aadhaarNo.trim()) {
      const existingAadhaar = await User.findOne({ aadhaarNo: aadhaarNo.trim() });
      if (existingAadhaar) {
        console.log('Duplicate Aadhaar number:', aadhaarNo);
        return res.status(409).json({
          error: 'Duplicate Aadhaar',
          message: 'This Aadhaar number is already registered with another user',
          field: 'aadhaarNo'
        });
      }
    }

    // Check for duplicate PAN number
    if (panNo && panNo.trim()) {
      const existingPan = await User.findOne({ panNo: panNo.trim().toUpperCase() });
      if (existingPan) {
        console.log('Duplicate PAN number:', panNo);
        return res.status(409).json({
          error: 'Duplicate PAN',
          message: 'This PAN number is already registered with another user',
          field: 'panNo'
        });
      }
    }

    console.log('Creating new user...');

    // Custom validation: Reporting manager required for users only
    if (userType === 'user' && (!reportingManager || reportingManager.trim() === '')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Reporting manager is required for users',
        details: [{
          field: 'reportingManager',
          message: 'Reporting manager is required when user type is "user"',
          value: reportingManager
        }]
      });
    }

    // Handle avatar file upload before creating user
    let avatarPath = null;
    if (req.files && req.files.avatar) {
      try {
        const avatarFile = req.files.avatar;
        const uploadsDir = process.env.NODE_ENV === 'production'
          ? '/var/www/lms/backend/uploads/avatars'
          : path.join(__dirname, '..', process.env.LOCAL_UPLOAD_DIR || './uploads', 'avatars');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const avatarExt = path.extname(avatarFile.name);
        const uniqueId = Date.now() + '-' + Math.random().toString(36).slice(2);
        const avatarFileName = `avatar-${uniqueId}${avatarExt}`;
        const avatarFilePath = path.join(uploadsDir, avatarFileName);

        await avatarFile.mv(avatarFilePath);
        avatarPath = `/uploads/avatars/${avatarFileName}`;
        console.log('✅ Avatar uploaded successfully:', avatarPath);
        console.log('Avatar file saved at:', avatarFilePath);
      } catch (avatarError) {
        console.error('❌ Error uploading avatar:', avatarError);
        // Don't fail user creation if avatar upload fails
      }
    }

    // Handle document uploads before creating user
    const uploadedDocs = [];
    if (req.files && req.files.documents) {
      try {
        const documentsDir = process.env.NODE_ENV === 'production'
          ? '/var/www/lms/backend/uploads/documents'
          : path.join(__dirname, '..', process.env.LOCAL_UPLOAD_DIR || './uploads', 'documents');
        if (!fs.existsSync(documentsDir)) {
          fs.mkdirSync(documentsDir, { recursive: true });
        }

        const docFiles = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];

        for (const docFile of docFiles) {
          const docExt = path.extname(docFile.name);
          const uniqueId = Date.now() + '-' + Math.random().toString(36).slice(2);
          const docFileName = `doc-${uniqueId}${docExt}`;
          const docPath = path.join(documentsDir, docFileName);

          await docFile.mv(docPath);
          uploadedDocs.push({
            name: docFile.name,
            type: 'other', // Default type
            filePath: `/uploads/documents/${docFileName}`,
            uploadedAt: new Date()
          });
        }
        console.log('✅ Documents uploaded:', uploadedDocs.length);
      } catch (docError) {
        console.error('❌ Error uploading documents:', docError);
        // Don't fail user creation if document upload fails
      }
    }

    // Create new user - Employee ID will be auto-generated by the model
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      phone: phone?.trim(),
      userType: userType || 'user',

      // Personal Information
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      fathersName: fathersName?.trim(),

      // Employment Information
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : undefined,
      designation: designation?.trim(),
      department: department?.trim() || 'General',
      reportingManager: reportingManager?.trim(),
      highestEducation: highestEducation?.trim(),

      // Address Information
      currentAddress: currentAddress?.trim(),
      nativeAddress: nativeAddress?.trim(),
      location: location?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      region: region?.trim(),

      // Identification Documents
      aadhaarNo: aadhaarNo?.trim(),
      panNo: panNo?.trim(),

      // Avatar and Documents
      avatar: avatarPath,
      documents: uploadedDocs.length > 0 ? uploadedDocs : undefined,

      status: 'Active',
      isActive: true
    });

    console.log('Saving user to database...');
    console.log('📝 Data being saved:');
    console.log('  - Avatar path:', avatarPath);
    console.log('  - Documents array:', JSON.stringify(uploadedDocs, null, 2));

    await user.save();

    // Verify data was saved to database
    const savedUser = await User.findById(user._id).select('avatar documents');
    console.log('✅ User saved successfully with Employee ID:', user.employeeId);
    console.log('✅ DATABASE VERIFICATION:');
    console.log('  - Avatar in DB:', savedUser?.avatar);
    console.log('  - Documents in DB:', savedUser?.documents?.length || 0);
    if (savedUser?.documents && savedUser.documents.length > 0) {
      console.log('  - Documents details:', JSON.stringify(savedUser.documents, null, 2));
    }

    // Create lifecycle event
    const LifecycleEvent = require('../models/LifecycleEvent');
    await LifecycleEvent.createAutoEvent({
      userId: user._id,
      type: 'joined',
      title: 'User Account Created',
      description: `User account created by admin: ${req.user.name}`,
      category: 'milestone',
      createdBy: req.user._id
    });

    // Final verification - fetch from database to confirm
    const finalUser = await User.findById(user._id).select('avatar documents name email');
    console.log('🔍 FINAL DATABASE CHECK (Create):');
    console.log('  - User ID:', finalUser?._id);
    console.log('  - Avatar in final check:', finalUser?.avatar || 'NULL');
    console.log('  - Documents in final check:', finalUser?.documents?.length || 0);
    if (finalUser?.documents && finalUser.documents.length > 0) {
      finalUser.documents.forEach((doc, idx) => {
        console.log(`  - Document ${idx + 1}:`, doc.name, '->', doc.filePath);
      });
    }

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    // Clear cache for dashboard endpoints to ensure real-time updates
    if (global.appCache) {
      const cacheKeys = [
        '__express__/api/reports/admin/stats',
        '__express__/api/reports/admin/user-progress',
        '__express__/api/users?filter=all',
        '__express__/api/users?filter=active&limit=1000',
        '__express__/api/users?filter=active'
      ];
      cacheKeys.forEach(key => {
        global.appCache.del(key);
        console.log('🗑️ Cleared cache for:', key);
      });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: user._id,
      user: {
        ...userResponse,
        avatar: finalUser?.avatar || userResponse.avatar,
        documents: finalUser?.documents || userResponse.documents
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating user: ' + error.message
    });
  }
});

// @route   POST /api/users/:id/warning
// @desc    Send warning to user
// @access  Private (Admin panel only)
router.post('/:id/warning', authenticateToken, requireAdminPanel, validateObjectId, conditionalMulter(notificationUpload.single('attachment')), async (req, res) => {
  try {
    const userId = req.params.id;
    const { message } = req.body;

    // Check if req.user exists
    if (!req.user || !req.user._id) {
      console.error('Warning route: req.user is missing or invalid', { user: req.user });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    console.log('Warning route: req.user._id =', req.user._id);

    const user = await User.findById(userId);
    if (!user) {
      // Clean up uploaded file if user not found
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    if (!user.email) {
      // Clean up uploaded file if email not found
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User does not have a registered email address'
      });
    }

    // Update user status to warning
    user.status = 'Warning';
    await user.save({ validateModifiedOnly: true });

    const warningMessage = message || 'Your performance has been flagged for review. Please improve your KPI scores.';

    // Prepare attachments array if file was uploaded
    const attachments = [];
    if (req.file) {
      attachments.push({
        fileName: req.file.originalname,
        filePath: `/uploads/notifications/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });
    }

    // Create notification record for dashboard
    const notification = new Notification({
      userId: user._id,
      type: 'warning',
      title: 'Performance Warning',
      message: warningMessage,
      isRead: false,
      sentBy: req.user._id,
      attachments: attachments
    });
    await notification.save();

    // Create Warning record for User Details page
    const Warning = require('../models/Warning');
    const warning = new Warning({
      userId: user._id,
      type: 'warning',
      title: 'Warning Notice',
      description: warningMessage,
      severity: 'medium',
      status: 'active',
      issuedBy: req.user._id,
      issuedAt: new Date(),
      metadata: {
        attachmentUrl: req.file ? `/uploads/notifications/${req.file.filename}` : null
      }
    });
    await warning.save();
    console.log('✅ Warning document created:', warning._id);

    // Send email via SMTP to user's registered email
    try {
      // Prepare attachments with absolute path
      const emailAttachments = [];
      if (req.file) {
        const absolutePath = path.resolve(req.file.path);
        // Verify file exists
        if (fs.existsSync(absolutePath)) {
          emailAttachments.push({
            filename: req.file.originalname,
            path: absolutePath
          });
          console.log(`📎 Attachment prepared: ${req.file.originalname} at ${absolutePath}`);
        } else {
          console.error(`❌ File not found at path: ${absolutePath}`);
        }
      }

      await emailService.sendEmail(
        user.email,
        'warning',
        {
          userName: user.name,
          message: warningMessage
        },
        {
          recipientEmail: user.email,
          recipientRole: user.userType || 'fe',
          templateType: 'warning',
          userId: user._id,
          attachments: emailAttachments
        }
      );
      console.log(`✅ Warning email sent to ${user.email}${req.file ? ' with attachment' : ''}`);
    } catch (emailError) {
      console.error('Failed to send warning email:', emailError);
      console.error('Email error details:', emailError.message);
      // Continue even if email fails - notification is already created
    }

    // Clear cache for notifications and user-related endpoints to show instant updates
    if (global.appCache) {
      const cacheKeys = [
        `__express__/api/notifications/user/${userId}`,
        `__express__/api/users/${userId}/warnings`,
        `__express__/api/audits/user/${userId}`,
        '__express__/api/audits',
        '__express__/api/notifications'
      ];
      cacheKeys.forEach(key => {
        global.appCache.del(key);
        console.log('🗑️ Cleared cache for:', key);
      });
      // Also clear any keys containing this userId
      const allKeys = global.appCache.keys();
      allKeys.forEach(key => {
        if (key.includes(userId) || key.includes('notifications') || key.includes('warnings') || key.includes('audits')) {
          global.appCache.del(key);
          console.log('🗑️ Cleared cache for:', key);
        }
      });
    }

    res.json({
      success: true,
      message: 'Warning sent successfully via email and dashboard notification',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      },
      attachment: req.file ? {
        fileName: req.file.originalname,
        filePath: `/uploads/notifications/${req.file.filename}`
      } : null
    });

  } catch (error) {
    console.error('Send warning error:', error);
    // Clean up uploaded file if error occurs
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    res.status(500).json({
      error: 'Server Error',
      message: 'Error sending warning'
    });
  }
});

// @route   GET /api/users/:id/warnings
// @desc    Get all warnings for a user
// @access  Private (Admin or same user)
router.get('/:id/warnings', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user can access this data (admin panel users or same user)
    const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];
    if (!adminPanelRoles.includes(req.user.userType) && req.user._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    const Warning = require('../models/Warning');

    const warnings = await Warning.find({ userId: userId })
      .populate('issuedBy', 'name email')
      .sort({ issuedAt: -1 })
      .lean();

    console.log(`📋 Found ${warnings.length} warnings for user ${userId}`);

    // Log first warning to check structure
    if (warnings.length > 0) {
      console.log('Sample warning:', JSON.stringify(warnings[0], null, 2));
    }

    res.json({
      success: true,
      warnings: warnings
    });

  } catch (error) {
    console.error('Get warnings error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching warnings',
      details: error.message
    });
  }
});

// @route   GET /api/users/view-document/:path
// @desc    View document in browser (inline, not download)
// @access  Private
router.get('/view-document/:path(*)', authenticateToken, async (req, res) => {
  try {
    const documentPath = req.params.path;
    const absolutePath = process.env.NODE_ENV === 'production'
      ? path.join('/var/www/lms/backend/uploads', documentPath)
      : path.join(__dirname, '..', 'uploads', documentPath);

    console.log('📄 View document request:', documentPath);
    console.log('📂 Absolute path:', absolutePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.error('❌ File not found:', absolutePath);
      return res.status(404).json({ message: 'File not found' });
    }

    // Set content type based on file extension
    const ext = path.extname(absolutePath).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline'); // View in browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    console.log('✅ Sending file:', absolutePath);
    // Send file
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({ message: 'Error viewing document' });
  }
});


// @route   POST /api/users/:id/certificate
// @desc    Send certificate to user
// @access  Private (Admin panel only)
router.post('/:id/certificate', authenticateToken, requireAdminPanel, validateObjectId, conditionalMulter(notificationUpload.single('attachment')), async (req, res) => {
  try {
    const userId = req.params.id;
    const { title, message, certificateType } = req.body;

    // Check if req.user exists
    if (!req.user || !req.user._id) {
      console.error('Certificate route: req.user is missing or invalid', { user: req.user });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    console.log('Certificate route: req.user._id =', req.user._id);

    const user = await User.findById(userId);
    if (!user) {
      // Clean up uploaded file if user not found
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    if (!user.email) {
      // Clean up uploaded file if email not found
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User does not have a registered email address'
      });
    }

    // Check if user is active - certificates can only be sent to active users
    if (!user.isActive) {
      // Clean up uploaded file
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Certificates can only be sent to active users'
      });
    }

    const certificateTitle = title || certificateType || 'Performance Excellence Certificate';
    const certificateMessage = message || `Congratulations! You have been awarded a ${certificateTitle} certificate.`;

    // Prepare attachments array if file was uploaded
    const attachments = [];
    if (req.file) {
      attachments.push({
        fileName: req.file.originalname,
        filePath: `/uploads/notifications/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });
    }

    // Create notification record for dashboard
    const notification = new Notification({
      userId: user._id,
      type: 'certificate',
      title: certificateTitle,
      message: certificateMessage,
      isRead: false,
      sentBy: req.user._id,
      attachments: attachments
    });
    await notification.save();

    // Send email via SMTP to user's registered email
    try {
      // Prepare attachments with absolute path
      const emailAttachments = [];
      if (req.file) {
        const absolutePath = path.resolve(req.file.path);
        // Verify file exists
        if (fs.existsSync(absolutePath)) {
          emailAttachments.push({
            filename: req.file.originalname,
            path: absolutePath
          });
          console.log(`📎 Attachment prepared: ${req.file.originalname} at ${absolutePath}`);
        } else {
          console.error(`❌ File not found at path: ${absolutePath}`);
        }
      }

      await emailService.sendEmail(
        user.email,
        'certificate',
        {
          userName: user.name,
          title: certificateTitle,
          message: certificateMessage
        },
        {
          recipientEmail: user.email,
          recipientRole: user.userType || 'fe',
          templateType: 'certificate',
          userId: user._id,
          attachments: emailAttachments
        }
      );
      console.log(`✅ Certificate email sent to ${user.email}${req.file ? ' with attachment' : ''}`);
    } catch (emailError) {
      console.error('Failed to send certificate email:', emailError);
      console.error('Email error details:', emailError.message);
      // Continue even if email fails - notification is already created
    }

    // Clear cache for notifications and user-related endpoints to show instant updates
    if (global.appCache) {
      const cacheKeys = [
        `__express__/api/notifications/user/${userId}`,
        `__express__/api/users/${userId}/certificates`,
        `__express__/api/awards/user/${userId}`,
        '__express__/api/awards',
        '__express__/api/notifications'
      ];
      cacheKeys.forEach(key => {
        global.appCache.del(key);
        console.log('🗑️ Cleared cache for:', key);
      });
      // Also clear any keys containing this userId
      const allKeys = global.appCache.keys();
      allKeys.forEach(key => {
        if (key.includes(userId) || key.includes('notifications') || key.includes('awards') || key.includes('certificates')) {
          global.appCache.del(key);
          console.log('🗑️ Cleared cache for:', key);
        }
      });
    }

    res.json({
      success: true,
      message: 'Certificate sent successfully via email and dashboard notification',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      attachment: req.file ? {
        fileName: req.file.originalname,
        filePath: `/uploads/notifications/${req.file.filename}`
      } : null
    });

  } catch (error) {
    console.error('Send certificate error:', error);
    // Clean up uploaded file if error occurs
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    res.status(500).json({
      error: 'Server Error',
      message: 'Error sending certificate'
    });
  }
});

// @route   GET /api/users/:id/warnings
// @desc    Get user warnings
// @access  Private (user can access own warnings, admin can access any)
router.get('/:id/warnings', authenticateToken, validateObjectId, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const Warning = require('../models/Warning');

    // Fetch from Notifications first (legacy/primary source for some flows)
    const notificationWarnings = await Notification.find({
      userId: userId,
      type: 'warning'
    }).sort({ createdAt: -1 }).lean();

    // Fetch from Warning model (if used)
    const dbWarnings = await Warning.find({ userId: userId }).sort({ issuedAt: -1 }).lean();

    // Normalize and merge
    const normalizedWarnings = [
      ...notificationWarnings.map(n => ({
        _id: n._id,
        title: n.title,
        message: n.message,
        severity: n.priority || 'medium', // Default severity if missing
        createdAt: n.createdAt,
        metadata: {
          attachmentUrl: n.attachments && n.attachments.length > 0 ? n.attachments[0].filePath : null
        }
      })),
      ...dbWarnings.map(w => ({
        _id: w._id,
        title: w.title,
        message: w.description,
        severity: w.severity,
        createdAt: w.issuedAt,
        metadata: {
          attachmentUrl: w.metadata?.attachmentUrl || null
        }
      }))
    ];

    // Deduplicate based on ID if necessary (or just return all if they represent different events)
    // For now, simple merge is likely enough as they tend to be separate records

    // Sort combined list
    normalizedWarnings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      warnings: normalizedWarnings
    });

  } catch (error) {
    console.error('Get user warnings error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user warnings'
    });
  }
});

// @route   GET /api/users/:id/certificates
// @desc    Get user certificates
// @access  Private (user can access own certificates, admin can access any)
router.get('/:id/certificates', authenticateToken, validateObjectId, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch from Notifications (primary source for certificates sent via Admin Panel)
    const certificates = await Notification.find({
      userId: userId,
      type: 'certificate'
    })
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Map to normalized structure with metadata.attachmentUrl
    const normalizedCertificates = certificates.map(cert => ({
      _id: cert._id,
      type: 'Certificate',
      title: cert.title,
      description: cert.message,
      issueDate: cert.createdAt,
      metadata: {
        attachmentUrl: cert.attachments && cert.attachments.length > 0 ? cert.attachments[0].filePath : null
      }
    }));

    res.json({
      success: true,
      certificates: normalizedCertificates
    });

  } catch (error) {
    console.error('Get user certificates error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user certificates'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin panel only)
router.get('/stats', authenticateToken, requireAdminPanel, async (req, res) => {
  try {
    // Check if database is connected
    // if (mongoose.connection.readyState !== 1) {
    //   return res.status(503).json({
    //     error: 'Service Unavailable',
    //     message: 'Database connection is not available'
    //   });
    // }

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'Active', isActive: true });
    const warningUsers = await User.countDocuments({ status: 'Warning' });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const auditedUsers = await User.countDocuments({ status: 'Audited' });

    res.json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        warning: warningUsers,
        inactive: inactiveUsers,
        audited: auditedUsers
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user statistics'
    });
  }
});

// @route   GET /api/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin panel only)
router.get('/', authenticateToken, requireAdminPanel, validatePagination, async (req, res) => {
  try {
    const { filter = 'all', page = 1, limit = 10, search } = req.query;

    // Build query based on filter
    let query = {};

    if (filter !== 'all') {
      if (filter === 'active') {
        query.isActive = true;
        // query.status = 'Active'; // Removed to include all active users
      } else if (filter === 'inactive') {
        query.isActive = false;
      } else {
        query.status = filter.charAt(0).toUpperCase() + filter.slice(1);
      }
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { aadhaarNo: { $regex: search, $options: 'i' } },
        { panNo: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Enhance users with latest KPI scores
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const latestKPI = await KPIScore.getLatestForUser(user._id);
        return {
          ...user.toJSON(),
          kpiScore: latestKPI ? latestKPI.overallScore : 0
        };
      })
    );

    res.json({
      users: enhancedUsers,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching users'
    });
  }
});


// @route   PUT /api/users/:id
// @desc    Update user information
// @access  Private (user can update own profile, admin can update any)
router.put('/:id', authenticateToken, validateObjectId, requireUserManagementAccess, async (req, res) => {
  try {
    const userId = req.params.id;
    const bcrypt = require('bcryptjs');
    let updateData = {};

    // Find user first
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Check if this is a FormData request
    const isFormData = req.files ||
      req.headers['content-type']?.includes('multipart/form-data') ||
      (req.body && Object.keys(req.body).some(key => req.body[key] === '[object File]' || req.body[key] === ''));

    if (isFormData) {
      console.log('📦 FormData request detected');
      console.log('  - Content-Type:', req.headers['content-type']);
      console.log('  - Files received:', req.files ? Object.keys(req.files) : 'None');
      console.log('  - Body keys before cleaning:', Object.keys(req.body));

      // Clean req.body - remove empty objects that might come from FormData
      Object.keys(req.body).forEach(key => {
        const value = req.body[key];
        // Remove empty objects
        if (typeof value === 'object' && !Array.isArray(value) && value !== null && Object.keys(value).length === 0) {
          console.log(`  🗑️ Removing empty object from req.body: ${key}`);
          delete req.body[key];
        }
        // Remove empty arrays
        if (Array.isArray(value) && value.length === 0) {
          console.log(`  🗑️ Removing empty array from req.body: ${key}`);
          delete req.body[key];
        }
        // Remove empty strings that might represent missing files
        if (value === '' || value === '[object File]') {
          console.log(`  🗑️ Removing empty string/file placeholder from req.body: ${key}`);
          delete req.body[key];
        }
        // Remove avatar and documents from body if they're objects or empty (they should be in req.files)
        if ((key === 'avatar' || key === 'documents') && (typeof value === 'object' || value === '')) {
          console.log(`  🗑️ Removing ${key} from req.body (should be in req.files)`);
          delete req.body[key];
        }
      });

      console.log('  - Body keys after cleaning:', Object.keys(req.body));

      // Parse FormData fields from req.body
      // Note: FormData sends all fields as strings, so we need to parse dates
      const {
        name, email, password, phone, userType,
        dateOfBirth: dateOfBirthStr, fathersName,
        dateOfJoining: dateOfJoiningStr, reportingManager, highestEducation,
        currentAddress, location, city, state, region,
        aadhaarNo, panNo
      } = req.body;

      // Convert date strings to Date objects if they exist
      const dateOfBirth = dateOfBirthStr ? (dateOfBirthStr instanceof Date ? dateOfBirthStr : new Date(dateOfBirthStr)) : undefined;
      const dateOfJoining = dateOfJoiningStr ? (dateOfJoiningStr instanceof Date ? dateOfJoiningStr : new Date(dateOfJoiningStr)) : undefined;

      // Build updateData object - only add fields that are provided
      if (name !== undefined && name !== null && name !== '') updateData.name = name.trim();
      if (email !== undefined && email !== null && email !== '') updateData.email = email.toLowerCase().trim();
      if (phone !== undefined && phone !== null && phone !== '') updateData.phone = phone.trim();
      if (dateOfBirth !== undefined && dateOfBirth !== null && dateOfBirth !== '') {
        // dateOfBirth is already a Date object from the parsing above
        updateData.dateOfBirth = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
      }
      if (fathersName !== undefined && fathersName !== null && fathersName !== '') {
        updateData.fathersName = fathersName.trim();
      }
      if (dateOfJoining !== undefined && dateOfJoining !== null && dateOfJoining !== '') {
        // dateOfJoining is already a Date object from the parsing above
        updateData.dateOfJoining = dateOfJoining instanceof Date ? dateOfJoining : new Date(dateOfJoining);
      }
      if (reportingManager !== undefined && reportingManager !== null) {
        updateData.reportingManager = reportingManager.trim();
      }
      if (highestEducation !== undefined && highestEducation !== null && highestEducation !== '') {
        updateData.highestEducation = highestEducation.trim();
      }
      if (currentAddress !== undefined && currentAddress !== null && currentAddress !== '') {
        updateData.currentAddress = currentAddress.trim();
      }
      if (location !== undefined && location !== null && location !== '') {
        updateData.location = location.trim();
      }
      if (city !== undefined && city !== null && city !== '') {
        updateData.city = city.trim();
      }
      if (state !== undefined && state !== null && state !== '') {
        updateData.state = state.trim();
      }
      if (region !== undefined && region !== null && region !== '') {
        updateData.region = region.trim();
      }
      if (aadhaarNo !== undefined && aadhaarNo !== null && aadhaarNo !== '') {
        // Check for duplicate Aadhaar (excluding current user)
        const existingAadhaar = await User.findOne({
          aadhaarNo: aadhaarNo.trim(),
          _id: { $ne: userId }
        });
        if (existingAadhaar) {
          return res.status(409).json({
            error: 'Duplicate Aadhaar',
            message: 'This Aadhaar number is already registered with another user',
            field: 'aadhaarNo'
          });
        }
        updateData.aadhaarNo = aadhaarNo.trim();
      }
      if (panNo !== undefined && panNo !== null && panNo !== '') {
        // Check for duplicate PAN (excluding current user)
        const existingPan = await User.findOne({
          panNo: panNo.trim().toUpperCase(),
          _id: { $ne: userId }
        });
        if (existingPan) {
          return res.status(409).json({
            error: 'Duplicate PAN',
            message: 'This PAN number is already registered with another user',
            field: 'panNo'
          });
        }
        updateData.panNo = panNo.trim().toUpperCase();
      }

      // Handle password update (only if provided and not empty)
      // Don't hash here - the model's pre-save hook will handle bcrypt hashing
      if (password !== undefined && password !== null && password !== '') {
        updateData.password = password; // Raw password - will be hashed by pre-save hook
        console.log('🔐 Password will be updated (to be hashed by model pre-save hook)');
      }

      // Handle avatar file upload
      if (req.files && req.files.avatar) {
        try {
          const avatarFile = req.files.avatar;
          console.log('📸 Avatar upload detected:', avatarFile.name, 'Size:', avatarFile.size, 'bytes');

          const uploadsDir = path.join(__dirname, '..', process.env.LOCAL_UPLOAD_DIR || './uploads', 'avatars');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const avatarExt = path.extname(avatarFile.name);
          const avatarFileName = `avatar-${userId}-${Date.now()}${avatarExt}`;
          const avatarPath = path.join(uploadsDir, avatarFileName);

          console.log('💾 Saving avatar file to:', avatarPath);
          await avatarFile.mv(avatarPath);

          // Verify file was saved
          if (fs.existsSync(avatarPath)) {
            const stats = fs.statSync(avatarPath);
            console.log('✅ Avatar file saved successfully!');
            console.log('  - File size:', stats.size, 'bytes');
            console.log('  - File path:', avatarPath);
          } else {
            console.error('❌ Avatar file NOT found after save!');
          }

          updateData.avatar = `/uploads/avatars/${avatarFileName}`;
          console.log('📝 Avatar path to save in DB:', updateData.avatar);

          // Delete old avatar if exists
          if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
            const oldAvatarPath = path.join(__dirname, '..', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
              try {
                fs.unlinkSync(oldAvatarPath);
                console.log('🗑️ Old avatar deleted:', oldAvatarPath);
              } catch (err) {
                console.error('Error deleting old avatar:', err);
              }
            }
          }
        } catch (avatarError) {
          console.error('❌ Error uploading avatar:', avatarError);
          throw avatarError; // Re-throw to fail the update
        }
      }

      // Handle multiple document uploads
      if (req.files && req.files.documents) {
        try {
          const documentsDir = path.join(__dirname, '..', process.env.LOCAL_UPLOAD_DIR || './uploads', 'documents');
          if (!fs.existsSync(documentsDir)) {
            fs.mkdirSync(documentsDir, { recursive: true });
          }

          const docFiles = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];
          console.log('📄 Documents upload detected:', docFiles.length, 'file(s)');

          const uploadedDocs = [];

          for (const docFile of docFiles) {
            console.log('  - Processing document:', docFile.name, 'Size:', docFile.size, 'bytes');

            const docExt = path.extname(docFile.name);
            const docFileName = `doc-${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}${docExt}`;
            const docPath = path.join(documentsDir, docFileName);

            console.log('💾 Saving document to:', docPath);
            await docFile.mv(docPath);

            // Verify file was saved
            if (fs.existsSync(docPath)) {
              const stats = fs.statSync(docPath);
              console.log('✅ Document saved successfully!');
              console.log('  - File size:', stats.size, 'bytes');
            } else {
              console.error('❌ Document file NOT found after save!');
            }

            uploadedDocs.push({
              name: docFile.name,
              type: 'other', // Default type, can be enhanced later
              filePath: `/uploads/documents/${docFileName}`,
              uploadedAt: new Date()
            });
          }

          console.log('📝 Documents to save in DB:', JSON.stringify(uploadedDocs, null, 2));

          // Get existing documents and append new ones
          const existingDocs = user.documents || [];
          updateData.documents = [...existingDocs, ...uploadedDocs];
          console.log('📝 Total documents after merge:', updateData.documents.length);
        } catch (docError) {
          console.error('❌ Error uploading documents:', docError);
          throw docError; // Re-throw to fail the update
        }
      }

    } else {
      // Handle JSON data (for simple updates without files)
      updateData = { ...req.body };

      console.log('📝 JSON update request, original body keys:', Object.keys(req.body));

      // Remove sensitive fields that shouldn't be updated via this route
      delete updateData.password; // JSON route doesn't support password update for security
      delete updateData.userType;
      delete updateData.isActive;
      delete updateData.employeeId; // Employee ID cannot be changed

      // Remove empty objects for avatar and documents
      if (updateData.avatar) {
        if (typeof updateData.avatar === 'object' && !Array.isArray(updateData.avatar) && Object.keys(updateData.avatar).length === 0) {
          console.log('🗑️ Removing empty avatar object from JSON update');
          delete updateData.avatar;
        } else if (typeof updateData.avatar !== 'string') {
          console.log('🗑️ Removing invalid avatar (not string) from JSON update');
          delete updateData.avatar;
        }
      }
      if (updateData.documents) {
        if (!Array.isArray(updateData.documents) || updateData.documents.length === 0) {
          console.log('🗑️ Removing empty/invalid documents array from JSON update');
          delete updateData.documents;
        } else {
          // Filter out invalid document entries
          const validDocs = updateData.documents.filter(doc => {
            return doc &&
              typeof doc === 'object' &&
              !Array.isArray(doc) &&
              doc.name &&
              doc.type &&
              doc.filePath;
          });
          if (validDocs.length === 0) {
            console.log('🗑️ Removing documents array (no valid entries)');
            delete updateData.documents;
          } else {
            updateData.documents = validDocs;
            console.log('✅ Keeping', validDocs.length, 'valid document(s)');
          }
        }
      }

      // Clean up the data
      if (updateData.email) updateData.email = updateData.email.toLowerCase().trim();
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.panNo) updateData.panNo = updateData.panNo.trim().toUpperCase();

      // Handle date fields
      if (updateData.dateOfBirth && typeof updateData.dateOfBirth === 'string') {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }
      if (updateData.dateOfJoining && typeof updateData.dateOfJoining === 'string') {
        updateData.dateOfJoining = new Date(updateData.dateOfJoining);
      }

      console.log('📝 JSON updateData after cleaning:', Object.keys(updateData));
    }

    // Check for email uniqueness if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Email Exists',
          message: 'User with this email already exists'
        });
      }
    }

    // Check for Phone uniqueness
    if (updateData.phone && updateData.phone !== user.phone) {
      const existingPhone = await User.findOne({
        phone: updateData.phone.trim(),
        _id: { $ne: userId }
      });
      if (existingPhone) {
        return res.status(409).json({
          error: 'Duplicate Phone',
          message: 'This mobile number is already registered with another user',
          field: 'phone'
        });
      }
    }

    // Check for Aadhaar uniqueness
    if (updateData.aadhaarNo && updateData.aadhaarNo !== user.aadhaarNo) {
      const existingAadhaar = await User.findOne({
        aadhaarNo: updateData.aadhaarNo.trim(),
        _id: { $ne: userId }
      });
      if (existingAadhaar) {
        return res.status(409).json({
          error: 'Duplicate Aadhaar',
          message: 'This Aadhaar number is already registered with another user',
          field: 'aadhaarNo'
        });
      }
    }

    // Check for PAN uniqueness
    if (updateData.panNo && updateData.panNo !== user.panNo) {
      const existingPan = await User.findOne({
        panNo: updateData.panNo.trim().toUpperCase(),
        _id: { $ne: userId }
      });
      if (existingPan) {
        return res.status(409).json({
          error: 'Duplicate PAN',
          message: 'This PAN number is already registered with another user',
          field: 'panNo'
        });
      }
    }

    // Clean updateData - remove empty objects and invalid data
    const cleanedUpdateData = {};
    console.log('🧹 Cleaning updateData, original keys:', Object.keys(updateData));

    Object.keys(updateData).forEach(key => {
      const value = updateData[key];

      console.log(`  - Processing key "${key}":`, typeof value, value);

      // Skip undefined, null, or empty strings
      if (value === undefined || value === null || value === '') {
        console.log(`    ⏭️ Skipping ${key}: undefined/null/empty`);
        return;
      }

      // Skip empty objects (but not File objects or Date objects)
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        // Date objects are valid - convert them properly
        if (value instanceof Date) {
          console.log(`    ✅ Adding ${key} (Date):`, value);
          cleanedUpdateData[key] = value;
          return;
        }
        // Check if it's an empty object (not a File object)
        if (Object.keys(value).length === 0 && !(value instanceof File)) {
          console.log(`    ⏭️ Skipping ${key}: empty object`);
          return;
        }
        // If it's a File object, skip it (should be handled by req.files)
        if (value instanceof File) {
          console.log(`    ⏭️ Skipping ${key}: File object (should be in req.files)`);
          return;
        }
      }

      // For avatar, ensure it's a string
      if (key === 'avatar') {
        if (typeof value === 'string' && value.trim() !== '') {
          cleanedUpdateData[key] = value;
          console.log(`    ✅ Adding ${key}:`, value);
        } else {
          console.log(`    ⏭️ Skipping ${key}: not a valid string (type: ${typeof value})`);
        }
        return;
      }

      // For documents, ensure it's a valid array with required fields
      if (key === 'documents') {
        if (Array.isArray(value) && value.length > 0) {
          // Filter out invalid documents
          const validDocs = value.filter(doc => {
            const isValid = doc &&
              typeof doc === 'object' &&
              !Array.isArray(doc) &&
              doc.name &&
              typeof doc.name === 'string' &&
              doc.type &&
              typeof doc.type === 'string' &&
              doc.filePath &&
              typeof doc.filePath === 'string';
            if (!isValid) {
              console.log(`    ⚠️ Invalid document entry:`, doc);
            }
            return isValid;
          });
          if (validDocs.length > 0) {
            cleanedUpdateData[key] = validDocs;
            console.log(`    ✅ Adding ${key}: ${validDocs.length} valid document(s)`);
          } else {
            console.log(`    ⏭️ Skipping ${key}: no valid documents`);
          }
        } else {
          console.log(`    ⏭️ Skipping ${key}: not a valid array or empty`);
        }
        return;
      }

      // For all other fields, add them
      cleanedUpdateData[key] = value;
      console.log(`    ✅ Adding ${key}:`, value);
    });

    console.log('🧹 Cleaned updateData keys:', Object.keys(cleanedUpdateData));
    console.log('🧹 Cleaned updateData:', JSON.stringify(cleanedUpdateData, null, 2));

    // Update user fields - ONLY set fields that are in cleanedUpdateData
    // Double-check before setting to prevent validation errors
    Object.keys(cleanedUpdateData).forEach(key => {
      const value = cleanedUpdateData[key];

      // Final safety check before setting
      if (key === 'avatar') {
        if (typeof value === 'string' && value.trim() !== '') {
          console.log(`  ✅ Setting user.${key} =`, value);
          user[key] = value;
        } else {
          console.log(`  ⚠️ Skipping invalid avatar:`, typeof value, value);
        }
      } else if (key === 'documents') {
        if (Array.isArray(value) && value.length > 0) {
          // Final validation of documents
          const validDocs = value.filter(doc => {
            return doc &&
              typeof doc === 'object' &&
              !Array.isArray(doc) &&
              doc.name &&
              typeof doc.name === 'string' &&
              doc.type &&
              typeof doc.type === 'string' &&
              doc.filePath &&
              typeof doc.filePath === 'string';
          });
          if (validDocs.length > 0) {
            console.log(`  ✅ Setting user.${key} =`, validDocs.length, 'document(s)');
            user[key] = validDocs;
          } else {
            console.log(`  ⚠️ Skipping invalid documents array`);
          }
        } else {
          console.log(`  ⚠️ Skipping invalid documents:`, typeof value);
        }
      } else {
        // For other fields, set directly
        console.log(`  ✅ Setting user.${key} =`, value);
        user[key] = value;
      }
    });

    // Save to database
    console.log('💾 Saving user to database...');
    console.log('📝 Update data being saved:');
    console.log('  - Avatar:', updateData.avatar || 'Not updating');
    console.log('  - Documents:', updateData.documents ? `${updateData.documents.length} document(s)` : 'Not updating');

    await user.save({ validateModifiedOnly: true });

    // Verify data was saved to database
    const savedUser = await User.findById(userId).select('avatar documents');
    console.log('✅ User updated successfully in database:', userId);
    console.log('✅ DATABASE VERIFICATION:');
    console.log('  - Avatar in DB:', savedUser?.avatar || 'NULL');
    console.log('  - Documents in DB:', savedUser?.documents?.length || 0);
    if (savedUser?.documents && savedUser.documents.length > 0) {
      console.log('  - Documents details:', JSON.stringify(savedUser.documents.map(d => ({ name: d.name, filePath: d.filePath })), null, 2));
    }

    // Final verification - fetch from database to confirm
    const finalUser = await User.findById(userId).select('avatar documents name email');
    console.log('🔍 FINAL DATABASE CHECK (Update):');
    console.log('  - User ID:', finalUser?._id);
    console.log('  - Avatar in final check:', finalUser?.avatar || 'NULL');
    console.log('  - Documents in final check:', finalUser?.documents?.length || 0);
    if (finalUser?.documents && finalUser.documents.length > 0) {
      finalUser.documents.forEach((doc, idx) => {
        console.log(`  - Document ${idx + 1}:`, doc.name, '->', doc.filePath);
      });
    }

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    // Clear cache for dashboard endpoints to ensure real-time updates
    if (global.appCache) {
      const cacheKeys = [
        '__express__/api/reports/admin/stats',
        '__express__/api/reports/admin/user-progress',
        '__express__/api/users?filter=all',
        '__express__/api/users?filter=active&limit=1000',
        '__express__/api/users?filter=active'
      ];
      cacheKeys.forEach(key => {
        global.appCache.del(key);
        console.log('🗑️ Cleared cache for:', key);
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...userResponse,
        avatar: finalUser?.avatar || userResponse.avatar,
        documents: finalUser?.documents || userResponse.documents
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating user: ' + error.message
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Deactivate user (soft delete)
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;

    // Don't allow admin to deactivate themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Invalid Operation',
        message: 'You cannot deactivate your own account'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    user.status = 'Inactive';
    await user.save({ validateModifiedOnly: true });

    // Create lifecycle event
    const LifecycleEvent = require('../models/LifecycleEvent');
    await LifecycleEvent.createAutoEvent({
      userId: user._id,
      type: 'other',
      title: 'Account Deactivated',
      description: `Account deactivated by admin: ${req.user.name}`,
      category: 'negative',
      createdBy: req.user._id
    });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deactivating user'
    });
  }
});

// @route   POST /api/users/:id/activate
// @desc    Activate user
// @access  Private (Admin only)
router.post('/:id/activate', authenticateToken, requireUserManagementAccess, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    user.isActive = true;
    user.status = 'Active';
    await user.save({ validateModifiedOnly: true });

    // Create lifecycle event
    const LifecycleEvent = require('../models/LifecycleEvent');
    await LifecycleEvent.createAutoEvent({
      userId: user._id,
      type: 'other',
      title: 'Account Activated',
      description: `Account activated by admin: ${req.user.name}`,
      category: 'positive',
      createdBy: req.user._id
    });

    res.json({
      success: true,
      message: 'User activated successfully'
    });

  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error activating user'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin panel only)
router.get('/stats', authenticateToken, requireAdminPanel, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          statusDistribution: {
            $push: '$status'
          },
          departmentDistribution: {
            $addToSet: '$department'
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        statusDistribution: [],
        departmentDistribution: []
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user statistics'
    });
  }
});

// @route   PUT /api/users/:id/activate
// @desc    Activate user
// @access  Private (Admin only)
router.put('/:id/activate', authenticateToken, requireUserManagementAccess, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if database is connected
    // if (mongoose.connection.readyState !== 1) {
    //   return res.status(503).json({
    //     error: 'Service Unavailable',
    //     message: 'Database connection is not available'
    //   });
    // }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Activate user and clear exit details
    user.isActive = true;
    user.status = 'Active';

    // Clear exit details if they exist
    if (user.exitDetails) {
      user.exitDetails = undefined;
    }

    // Clear old inactive fields for backward compatibility
    user.inactiveReason = null;
    user.inactiveRemark = '';
    user.inactiveDate = null;
    user.inactiveBy = null;

    await user.save({ validateModifiedOnly: true });

    // Clear cache for user list to ensure instant updates on main page
    if (global.appCache) {
      const cacheKeys = [
        '__express__/api/users?filter=all',
        '__express__/api/users?filter=active&limit=1000',
        '__express__/api/users?filter=active',
        '__express__/api/reports/admin/stats',
        '__express__/api/reports/admin/user-progress'
      ];
      cacheKeys.forEach(key => {
        global.appCache.del(key);
        console.log('🗑️ Cleared cache for:', key);
      });
    }

    // Create lifecycle event for activation (shows in user details lifecycle tab)
    try {
      const LifecycleEvent = require('../models/LifecycleEvent');
      await LifecycleEvent.createAutoEvent({
        userId: user._id,
        type: 'reactivation',
        title: 'Account Activated',
        description: `User account has been activated by ${req.user.name}. Exit details have been cleared.`,
        category: 'positive',
        metadata: {
          activatedBy: req.user._id,
          activatedByName: req.user.name,
          activatedAt: new Date(),
          previousStatus: 'Inactive'
        },
        createdBy: req.user._id
      });
      console.log('✅ Lifecycle event created for user activation');
    } catch (lifecycleError) {
      console.error('⚠️  Error creating lifecycle event (non-critical):', lifecycleError.message);
    }

    // Create notification for dashboard
    try {
      const notification = new Notification({
        userId: user._id,
        type: 'success',
        title: 'Account Activated',
        message: `Your account has been activated. You can now access all features.`,
        isRead: false,
        sentBy: req.user._id
      });
      await notification.save();
      console.log('✅ Notification created for user activation');
    } catch (notificationError) {
      console.error('⚠️  Error creating notification (non-critical):', notificationError.message);
    }

    // Send email to user about activation
    if (user.email) {
      try {
        await emailService.sendEmail(
          user.email,
          'custom',
          {
            userName: user.name,
            subject: 'Account Activated',
            customContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                  <h2 style="color: #2e7d32; margin-bottom: 20px;">Account Activated</h2>
                  <p>Dear ${user.name},</p>
                  <p>Your account has been activated successfully. You can now access all features of the platform.</p>
                  <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2e7d32;">
                    <p><strong>Status:</strong> Active</p>
                    <p><strong>Activated Date:</strong> ${new Date().toLocaleDateString()}</p>
                  </div>
                  <p>If you have any questions, please contact the HR department.</p>
                  <p>Best regards,<br>Management Team</p>
                </div>
              </div>
            `
          },
          {
            recipientEmail: user.email,
            recipientRole: user.userType || 'fe',
            templateType: 'notification',
            userId: user._id
          }
        );
        console.log(`✅ Activation email sent to ${user.email}`);
      } catch (emailError) {
        console.error('⚠️  Failed to send activation email (non-critical):', emailError.message);
      }
    }

    res.json({
      success: true,
      message: 'User activated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error activating user'
    });
  }
});

// @route   PUT /api/users/:id/reactivate
// @desc    Reactivate user (clear inactive/exit details and activate)
// @access  Private (Admin only)
router.put('/:id/reactivate', authenticateToken, requireUserManagementAccess, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Reactivate user and clear exit/inactive details
    user.status = 'Active';
    user.isActive = true;

    // Clear exit details
    user.exitDetails = undefined;

    // Clear old inactive fields (backward compatibility)
    user.inactiveReason = undefined;
    user.inactiveRemark = undefined;
    user.inactiveDate = undefined;
    user.inactiveBy = undefined;

    await user.save({ validateModifiedOnly: true });

    // Clear cache for user list to ensure instant updates on main page
    if (global.appCache) {
      const cacheKeys = [
        '__express__/api/users?filter=all',
        '__express__/api/users?filter=active&limit=1000',
        '__express__/api/users?filter=active',
        '__express__/api/reports/admin/stats',
        '__express__/api/reports/admin/user-progress'
      ];
      cacheKeys.forEach(key => {
        global.appCache.del(key);
        console.log('🗑️ Cleared cache for:', key);
      });
    }

    // Create lifecycle event for reactivation (shows in user details lifecycle tab)
    try {
      const LifecycleEvent = require('../models/LifecycleEvent');
      await LifecycleEvent.createAutoEvent({
        userId: user._id,
        type: 'reactivation',
        title: 'Account Reactivated',
        description: `User account has been reactivated by ${req.user.name}. Previous exit/inactive status has been cleared.`,
        category: 'positive',
        metadata: {
          reactivatedBy: req.user._id,
          reactivatedByName: req.user.name,
          reactivatedAt: new Date(),
          previousStatus: 'Inactive'
        },
        createdBy: req.user._id
      });
      console.log('✅ Lifecycle event created for user reactivation');
    } catch (lifecycleError) {
      console.error('⚠️  Error creating lifecycle event (non-critical):', lifecycleError.message);
    }

    // Create notification
    try {
      const notification = new Notification({
        userId: user._id,
        type: 'success',
        title: 'Account Reactivated',
        message: `Your account has been reactivated. You can now access all features.`,
        read: false,
        sentBy: req.user._id
      });
      await notification.save();
    } catch (notifError) {
      console.error('Notification creation error:', notifError);
    }

    // Send email notification
    if (user.email) {
      emailService.sendEmail(
        user.email,
        'custom',
        {
          userName: user.name,
          subject: 'Account Reactivated',
          customContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #28a745; margin-bottom: 20px;">Account Reactivated</h2>
                <p>Dear ${user.name},</p>
                <p>Great news! Your account has been reactivated.</p>
                <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #28a745;">
                  <p><strong>Status:</strong> Active</p>
                  <p><strong>Reactivated on:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <p>You can now log in and access all features of the platform.</p>
                <p>Best regards,<br>Management Team</p>
              </div>
            </div>
          `
        },
        {
          recipientEmail: user.email,
          recipientRole: user.userType === 'user' ? 'fe' : user.userType,
          templateType: 'notification',
          userId: user._id
        }
      ).catch(err => console.error('Email sending error:', err.message));
    }

    res.json({
      success: true,
      message: 'User reactivated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error reactivating user'
    });
  }
});

// @route   PUT /api/users/:id/deactivate
// @desc    Deactivate user
// @access  Private (Admin only)
router.put('/:id/deactivate', authenticateToken, requireUserManagementAccess, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if database is connected
    // if (mongoose.connection.readyState !== 1) {
    //   return res.status(503).json({
    //     error: 'Service Unavailable',
    //     message: 'Database connection is not available'
    //   });
    // }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    user.isActive = false;
    user.status = 'Inactive';

    // Note: This simple deactivate doesn't set exit details
    // For full exit management, use /set-inactive endpoint

    await user.save({ validateModifiedOnly: true });

    // Clear cache for user list to ensure instant updates on main page
    if (global.appCache) {
      const cacheKeys = [
        '__express__/api/users?filter=all',
        '__express__/api/users?filter=active&limit=1000',
        '__express__/api/users?filter=active',
        '__express__/api/reports/admin/stats',
        '__express__/api/reports/admin/user-progress',
        '__express__/api/users/exit-records?page=1&limit=20'
      ];
      cacheKeys.forEach(key => {
        global.appCache.del(key);
        console.log('🗑️ Cleared cache for:', key);
      });
    }

    // Create notification for dashboard
    try {
      const notification = new Notification({
        userId: user._id,
        type: 'info',
        title: 'Account Deactivated',
        message: `Your account has been deactivated. Please contact HR for more information.`,
        isRead: false,
        sentBy: req.user._id
      });
      await notification.save();
      console.log('✅ Notification created for user deactivation');
    } catch (notificationError) {
      console.error('⚠️  Error creating notification (non-critical):', notificationError.message);
    }

    // Send email to user about deactivation
    if (user.email) {
      try {
        await emailService.sendEmail(
          user.email,
          'custom',
          {
            userName: user.name,
            subject: 'Account Deactivated',
            customContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                  <h2 style="color: #d32f2f; margin-bottom: 20px;">Account Deactivated</h2>
                  <p>Dear ${user.name},</p>
                  <p>This is to inform you that your account has been deactivated.</p>
                  <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #d32f2f;">
                    <p><strong>Status:</strong> Inactive</p>
                    <p><strong>Deactivated Date:</strong> ${new Date().toLocaleDateString()}</p>
                  </div>
                  <p>If you have any questions or concerns, please contact the HR department.</p>
                  <p>Best regards,<br>Management Team</p>
                </div>
              </div>
            `
          },
          {
            recipientEmail: user.email,
            recipientRole: (user.userType === 'user' ? 'fe' : user.userType) || 'fe',
            templateType: 'notification',
            userId: user._id
          }
        );
        console.log(`✅ Deactivation email sent to ${user.email}`);
      } catch (emailError) {
        console.error('⚠️  Failed to send deactivation email (non-critical):', emailError.message);
      }
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deactivating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if database is connected
    // if (mongoose.connection.readyState !== 1) {
    //   return res.status(503).json({
    //     error: 'Service Unavailable',
    //     message: 'Database connection is not available'
    //   });
    // }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting user'
    });
  }
});

// @route   GET /api/users/:userId/warnings
// @desc    Get user warnings
// @access  Private (user can access own warnings, admin can access any)
router.get('/:userId/warnings', authenticateToken, validateUserId, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get audit records that are warnings
    const warnings = await AuditRecord.find({
      userId,
      type: 'warning',
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .select('reason description severity createdAt');

    res.json({
      success: true,
      warnings: warnings
    });

  } catch (error) {
    console.error('Get user warnings error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user warnings'
    });
  }
});

// @route   GET /api/users/:userId/certificates
// @desc    Get user certificates
// @access  Private (user can access own certificates, admin can access any)
router.get('/:userId/certificates', authenticateToken, validateUserId, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get awards that are certificates
    const certificates = await Award.find({
      userId,
      type: 'certificate',
      status: 'approved'
    })
      .sort({ awardDate: -1 })
      .select('title description awardDate type');

    res.json({
      success: true,
      certificates: certificates
    });

  } catch (error) {
    console.error('Get user certificates error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user certificates'
    });
  }
});

// @route   PUT /api/users/:id/set-inactive
// @desc    Set user as inactive with comprehensive exit management
// @access  Private (Admin only)
// Use .any() to parse all fields and files, then we'll handle the file separately
router.put('/:id/set-inactive', authenticateToken, requireUserManagementAccess, validateObjectId, conditionalMulter(exitDocUpload.any()), async (req, res) => {
  // Extract proofDocument file from req.files (declare here for proper scope in catch block)
  const proofDocumentFile = req.files && Array.isArray(req.files)
    ? req.files.find(f => f.fieldname === 'proofDocument')
    : null;

  try {
    const userId = req.params.id;

    // Ensure req.body exists
    if (!req.body) {
      req.body = {};
    }

    // Extract fields from req.body (don't destructure - extract explicitly to handle FormData properly)
    let exitDate = req.body.exitDate;
    let mainCategory = req.body.mainCategory;
    let subCategory = req.body.subCategory;
    let exitReasonDescription = req.body.exitReasonDescription;
    let verifiedBy = req.body.verifiedBy;
    let remarks = req.body.remarks;
    // Keep backward compatibility
    let inactiveReason = req.body.inactiveReason;
    let inactiveRemark = req.body.inactiveRemark;


    // Clean up uploaded file helper function
    const cleanupFile = () => {
      if (proofDocumentFile && fs.existsSync(proofDocumentFile.path)) {
        try {
          fs.unlinkSync(proofDocumentFile.path);
          console.log('🗑️  Cleaned up uploaded file');
        } catch (cleanupError) {
          console.error('⚠️  Error cleaning up file:', cleanupError);
        }
      }
    };


    // Trim string fields - handle all possible cases
    if (exitDate !== undefined && exitDate !== null) {
      exitDate = String(exitDate).trim();
    } else {
      exitDate = '';
    }

    if (mainCategory !== undefined && mainCategory !== null) {
      mainCategory = String(mainCategory).trim();
    } else {
      mainCategory = '';
    }

    if (subCategory !== undefined && subCategory !== null) {
      subCategory = String(subCategory).trim();
    } else {
      subCategory = '';
    }

    if (exitReasonDescription !== undefined && exitReasonDescription !== null) {
      exitReasonDescription = String(exitReasonDescription).trim();
    } else {
      exitReasonDescription = '';
    }

    if (remarks !== undefined && remarks !== null) {
      remarks = String(remarks).trim();
    } else {
      remarks = '';
    }

    if (verifiedBy !== undefined && verifiedBy !== null) {
      verifiedBy = String(verifiedBy).trim();
    } else {
      verifiedBy = 'By Management';
    }

    if (inactiveReason !== undefined && inactiveReason !== null) {
      inactiveReason = String(inactiveReason).trim();
    } else {
      inactiveReason = '';
    }

    if (inactiveRemark !== undefined && inactiveRemark !== null) {
      inactiveRemark = String(inactiveRemark).trim();
    } else {
      inactiveRemark = '';
    }


    // Validate exitDate (required)
    // Check if exitDate is provided (either from new form or backward compatibility)
    let finalExitDate = null;
    if (exitDate && exitDate !== '') {
      finalExitDate = exitDate;
    } else if (inactiveReason && inactiveReason !== '') {
      // Backward compatibility: if inactiveReason is provided but no exitDate, use today's date
      finalExitDate = new Date().toISOString().split('T')[0];
    }

    if (!finalExitDate || finalExitDate === '') {
      cleanupFile();
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Exit date is required. Please select an exit date.'
      });
    }

    // Validate date format and ensure it's not in the future
    const exitDateObj = new Date(finalExitDate);
    if (isNaN(exitDateObj.getTime())) {
      cleanupFile();
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid exit date format. Please provide a valid date.'
      });
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (exitDateObj > today) {
      cleanupFile();
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Exit date cannot be in the future'
      });
    }

    // Validate mainCategory (required)
    const validMainCategories = ['Resignation', 'Termination', 'End of Contract / Project', 'Retirement', 'Death', 'Other'];
    const finalMainCategory = mainCategory || inactiveReason || null;

    if (!finalMainCategory) {
      cleanupFile();
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Exit reason main category is required'
      });
    }

    if (!validMainCategories.includes(finalMainCategory)) {
      cleanupFile();
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid exit reason category. Must be one of: ${validMainCategories.join(', ')}`
      });
    }

    // Validate subCategory if provided
    const validSubCategories = {
      'Resignation': ['Better employment opportunity', 'Higher salary expectation', 'Relocation', 'Career change', 'Personal/family reasons'],
      'Termination': ['Performance issues', 'Low KPI', 'Repeated warnings', 'Misconduct', 'Bribe', 'Unethical behaviour', 'Bad habits', 'Non compliance with rules', 'Fraudulent activity'],
      'End of Contract / Project': [],
      'Retirement': [],
      'Death': ['Natural death', 'Accidental death'],
      'Other': ['Health issues', 'Further studies', 'Migration', 'Own business']
    };

    if (subCategory && subCategory.trim() !== '') {
      const allowedSubCategories = validSubCategories[finalMainCategory] || [];
      if (allowedSubCategories.length > 0 && !allowedSubCategories.includes(subCategory)) {
        cleanupFile();
        return res.status(400).json({
          error: 'Validation Error',
          message: `Invalid sub-category for "${finalMainCategory}". Valid options: ${allowedSubCategories.join(', ')}`
        });
      }
    }

    // Validate exitReasonDescription (max 1000 characters)
    const finalExitReasonDescription = exitReasonDescription || inactiveRemark || '';
    if (finalExitReasonDescription.length > 1000) {
      cleanupFile();
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Exit reason description cannot exceed 1000 characters'
      });
    }

    // Validate verifiedBy (include 'Pending' for backwards compatibility)
    const validVerifiedBy = ['By Management', 'HR', 'Compliance', 'Pending'];
    const finalVerifiedBy = verifiedBy || 'By Management';
    if (!validVerifiedBy.includes(finalVerifiedBy)) {
      cleanupFile();
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid verifiedBy value. Must be one of: ${validVerifiedBy.join(', ')}`
      });
    }

    // Validate remarks (max 500 characters)
    const finalRemarks = remarks || '';
    if (finalRemarks.length > 500) {
      cleanupFile();
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Remarks cannot exceed 500 characters'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      // Clean up uploaded file if user not found
      cleanupFile();
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Prevent deactivation of admin users
    if (user.userType === 'admin') {
      cleanupFile();
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin users cannot be deactivated. Admin accounts are protected to maintain system integrity.'
      });
    }

    // Update user status and inactive details
    user.status = 'Inactive';
    user.isActive = false;

    // Set exit details with validated values
    user.exitDetails = {
      exitDate: exitDateObj,
      exitReason: {
        mainCategory: finalMainCategory,
        subCategory: (subCategory && subCategory.trim() !== '') ? subCategory.trim() : ''
      },
      exitReasonDescription: finalExitReasonDescription,
      verifiedBy: finalVerifiedBy,
      verifiedByUser: finalVerifiedBy !== 'By Management' ? req.user._id : null,
      verifiedAt: finalVerifiedBy !== 'By Management' ? new Date() : null,
      remarks: finalRemarks
    };

    // Handle file upload
    if (proofDocumentFile) {
      // Store relative path for easier access
      const relativePath = `/uploads/exit-documents/${path.basename(proofDocumentFile.path)}`;
      user.exitDetails.proofDocument = {
        fileName: proofDocumentFile.originalname,
        filePath: relativePath, // Store relative path
        absolutePath: proofDocumentFile.path, // Store absolute path for server access
        fileSize: proofDocumentFile.size,
        mimeType: proofDocumentFile.mimetype,
        uploadedAt: new Date()
      };
    }

    // Keep backward compatibility with old fields
    user.inactiveReason = finalMainCategory;
    user.inactiveRemark = finalExitReasonDescription;
    user.inactiveDate = exitDateObj;
    user.inactiveBy = req.user._id;

    // Save without validating unchanged fields (fixes phone validation for old users)
    await user.save({ validateModifiedOnly: true });

    // Clear cache for user list to ensure instant updates on main page
    if (global.appCache) {
      const cacheKeys = [
        '__express__/api/users?filter=all',
        '__express__/api/users?filter=active&limit=1000',
        '__express__/api/users?filter=active',
        '__express__/api/reports/admin/stats',
        '__express__/api/reports/admin/user-progress',
        '__express__/api/users/exit-records?page=1&limit=20'
      ];
      cacheKeys.forEach(key => {
        global.appCache.del(key);
        console.log('🗑️ Cleared cache for:', key);
      });
    }

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    // Send response immediately - don't wait for email/notifications
    res.json({
      success: true,
      message: 'User set as inactive successfully with exit details',
      user: userResponse,
      fileUploaded: !!proofDocumentFile
    });

    // Handle non-critical operations asynchronously (don't block response)
    setImmediate(async () => {
      try {
        // Run all async operations in parallel
        const asyncOperations = [];

        // Create notification
        asyncOperations.push(
          (async () => {
            try {
              const notification = new Notification({
                userId: user._id,
                type: 'info',
                title: 'Account Deactivated',
                message: `Your account has been deactivated. Exit reason: ${user.exitDetails.exitReason.mainCategory}${user.exitDetails.exitReason.subCategory ? ' - ' + user.exitDetails.exitReason.subCategory : ''}. ${user.exitDetails.exitReasonDescription ? 'Details: ' + user.exitDetails.exitReasonDescription : ''}`,
                read: false,
                sentBy: req.user._id
              });
              await notification.save();
            } catch (err) {
              console.error('Notification creation error:', err.message);
            }
          })()
        );

        // Send email (if email exists)
        if (user.email) {
          asyncOperations.push(
            emailService.sendEmail(
              user.email,
              'custom',
              {
                userName: user.name,
                subject: 'Account Deactivation Notice',
                customContent: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                      <h2 style="color: #d32f2f; margin-bottom: 20px;">Account Deactivation Notice</h2>
                      <p>Dear ${user.name},</p>
                      <p>This is to inform you that your account has been deactivated.</p>
                      <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #d32f2f;">
                        <p><strong>Exit Date:</strong> ${user.exitDetails.exitDate ? new Date(user.exitDetails.exitDate).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Exit Reason:</strong> ${user.exitDetails.exitReason.mainCategory}${user.exitDetails.exitReason.subCategory ? ' - ' + user.exitDetails.exitReason.subCategory : ''}</p>
                        ${user.exitDetails.exitReasonDescription ? `<p><strong>Details:</strong> ${user.exitDetails.exitReasonDescription}</p>` : ''}
                      </div>
                      <p>If you have any questions or concerns, please contact the HR department.</p>
                      <p>Best regards,<br>Management Team</p>
                    </div>
                  </div>
                `
              },
              {
                recipientEmail: user.email,
                recipientRole: (user.userType === 'user' ? 'fe' : user.userType) || 'fe',
                templateType: 'notification',
                userId: user._id
              }
            ).catch(err => console.error('Email sending error:', err.message))
          );
        }

        // Create audit record
        asyncOperations.push(
          (async () => {
            try {
              const auditRecord = new AuditRecord({
                userId: userId,
                type: 'other',
                title: 'User Deactivated - Exit Management',
                reason: `Exit Reason: ${user.exitDetails.exitReason.mainCategory}${user.exitDetails.exitReason.subCategory ? ' - ' + user.exitDetails.exitReason.subCategory : ''}`,
                description: `User deactivated by ${req.user.name}. Exit Date: ${user.exitDetails.exitDate.toLocaleDateString()}. ${user.exitDetails.exitReasonDescription ? 'Details: ' + user.exitDetails.exitReasonDescription : ''} ${proofDocumentFile ? 'Proof document uploaded.' : ''}`,
                severity: 'medium',
                status: 'completed',
                createdBy: req.user._id,
                tags: ['exit', 'deactivation', user.exitDetails.exitReason.mainCategory.toLowerCase().replace(/\s+/g, '-')]
              });
              await auditRecord.save();
            } catch (err) {
              console.error('Audit record creation error:', err.message);
            }
          })()
        );

        // Create lifecycle event
        const LifecycleEvent = require('../models/LifecycleEvent');
        asyncOperations.push(
          LifecycleEvent.createAutoEvent({
            userId: user._id,
            type: 'left',
            title: 'Employee Exit',
            description: `Exit reason: ${user.exitDetails.exitReason.mainCategory}${user.exitDetails.exitReason.subCategory ? ' - ' + user.exitDetails.exitReason.subCategory : ''}`,
            category: 'negative',
            createdBy: req.user._id
          }).catch(err => console.error('Lifecycle event creation error:', err.message))
        );

        // Execute all operations in parallel
        await Promise.all(asyncOperations);
      } catch (error) {
        console.error('Error in async operations:', error.message);
      }
    });

  } catch (error) {
    console.error('Set user inactive error:', error.message);

    // Clean up uploaded file if error occurs
    if (proofDocumentFile && fs.existsSync(proofDocumentFile.path)) {
      try {
        fs.unlinkSync(proofDocumentFile.path);
        console.log('🗑️  Cleaned up uploaded file after error');
      } catch (cleanupError) {
        console.error('⚠️  Error cleaning up file:', cleanupError);
      }
    }
    res.status(500).json({
      error: 'Server Error',
      message: 'Error setting user as inactive: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   PUT /api/users/:id/reactivate
// @desc    Reactivate user (clear inactive details)
// @access  Private (Admin only)
router.put('/:id/reactivate', authenticateToken, requireUserManagementAccess, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Reactivate user - clear all exit details
    user.status = 'Active';
    user.isActive = true;

    // Clear exit details if they exist
    if (user.exitDetails) {
      user.exitDetails = undefined;
    }

    // Clear old inactive fields for backward compatibility
    user.inactiveReason = null;
    user.inactiveRemark = '';
    user.inactiveDate = null;
    user.inactiveBy = null;

    // Save without validating unchanged fields (fixes phone validation for old users)
    await user.save({ validateModifiedOnly: true });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    // Send response immediately - don't wait for email/notifications
    res.json({
      success: true,
      message: 'User reactivated successfully',
      user: userResponse
    });

    // Handle non-critical operations asynchronously (don't block response)
    setImmediate(async () => {
      try {
        // Run all async operations in parallel
        const asyncOperations = [];

        // Create notification
        asyncOperations.push(
          (async () => {
            try {
              const notification = new Notification({
                userId: user._id,
                type: 'success',
                title: 'Account Reactivated',
                message: `Your account has been reactivated. You can now access all features.`,
                isRead: false,
                sentBy: req.user._id
              });
              await notification.save();
            } catch (err) {
              console.error('Notification creation error:', err.message);
            }
          })()
        );

        // Send email (if email exists)
        if (user.email) {
          asyncOperations.push(
            emailService.sendEmail(
              user.email,
              'custom',
              {
                userName: user.name,
                subject: 'Account Reactivated',
                customContent: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                      <h2 style="color: #2e7d32; margin-bottom: 20px;">Account Reactivated</h2>
                      <p>Dear ${user.name},</p>
                      <p>Your account has been reactivated successfully. You can now access all features of the platform.</p>
                      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2e7d32;">
                        <p><strong>Status:</strong> Active</p>
                        <p><strong>Reactivated Date:</strong> ${new Date().toLocaleDateString()}</p>
                      </div>
                      <p>If you have any questions, please contact the HR department.</p>
                      <p>Best regards,<br>Management Team</p>
                    </div>
                  </div>
                `
              },
              {
                recipientEmail: user.email,
                recipientRole: user.userType || 'fe',
                templateType: 'notification',
                userId: user._id
              }
            ).catch(err => console.error('Email sending error:', err.message))
          );
        }

        // Create audit record
        asyncOperations.push(
          (async () => {
            try {
              const auditRecord = new AuditRecord({
                userId: userId,
                type: 'other',
                title: 'User Reactivated',
                reason: `Account reactivated by admin: ${req.user.name}`,
                description: `User account has been reactivated and set to active status.`,
                severity: 'low',
                status: 'completed',
                createdBy: req.user._id,
                tags: ['reactivation', 'activation']
              });
              await auditRecord.save();
            } catch (err) {
              console.error('Audit record creation error:', err.message);
            }
          })()
        );

        // Create lifecycle event
        const LifecycleEvent = require('../models/LifecycleEvent');
        asyncOperations.push(
          LifecycleEvent.createAutoEvent({
            userId: user._id,
            type: 'achievement',
            title: 'Account Reactivated',
            description: `Account reactivated by admin: ${req.user.name}`,
            category: 'positive',
            createdBy: req.user._id
          }).catch(err => console.error('Lifecycle event creation error:', err.message))
        );

        // Execute all operations in parallel
        await Promise.all(asyncOperations);
      } catch (error) {
        console.error('Error in async operations:', error.message);
      }
    });

  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error reactivating user'
    });
  }
});

// @route   GET /api/users/exit-records/export
// @desc    Export exit records to CSV
// @access  Private (Admin panel only)
router.get('/exit-records/export', authenticateToken, requireAdminPanel, async (req, res) => {
  try {
    const {
      mainCategory,
      verifiedBy,
      startDate,
      endDate
    } = req.query;

    // Build query
    let query = { isActive: false, status: 'Inactive', 'exitDetails.exitDate': { $exists: true } };

    // Apply filters
    if (mainCategory) {
      query['exitDetails.exitReason.mainCategory'] = mainCategory;
    }

    if (verifiedBy) {
      query['exitDetails.verifiedBy'] = verifiedBy;
    }

    if (startDate || endDate) {
      query['exitDetails.exitDate'] = {};
      if (startDate) {
        query['exitDetails.exitDate'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['exitDetails.exitDate'].$lte = new Date(endDate);
      }
    }

    // Get all users with exit records
    const users = await User.find(query)
      .select('name email employeeId phone designation department dateOfJoining location city state exitDetails')
      .populate('inactiveBy', 'name email')
      .populate('exitDetails.verifiedByUser', 'name email')
      .sort({ 'exitDetails.exitDate': -1 });

    // Generate CSV
    const csvHeader = 'Employee ID,Name,Email,Phone,Designation,Department,Location,City,State,Date of Joining,Exit Date,Exit Reason (Main),Exit Reason (Sub),Exit Description,Verified By,Verified By User,Has Proof Document,Remarks\n';

    const csvRows = users.map(user => {
      const exitDetails = user.exitDetails || {};
      const exitReason = exitDetails.exitReason || {};
      const proofDoc = exitDetails.proofDocument || {};

      return [
        user.employeeId || '',
        `"${user.name || ''}"`,
        user.email || '',
        user.phone || '',
        `"${user.designation || ''}"`,
        `"${user.department || ''}"`,
        `"${user.location || ''}"`,
        `"${user.city || ''}"`,
        `"${user.state || ''}"`,
        user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString() : '',
        exitDetails.exitDate ? new Date(exitDetails.exitDate).toLocaleDateString() : '',
        `"${exitReason.mainCategory || ''}"`,
        `"${exitReason.subCategory || ''}"`,
        `"${(exitDetails.exitReasonDescription || '').replace(/"/g, '""')}"`,
        exitDetails.verifiedBy || '',
        exitDetails.verifiedByUser ? `"${exitDetails.verifiedByUser.name || ''}"` : '',
        proofDoc.fileName ? 'Yes' : 'No',
        `"${(exitDetails.remarks || '').replace(/"/g, '""')}"`
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=exit-records-${Date.now()}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Export exit records error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error exporting exit records'
    });
  }
});

// @route   GET /api/users/exit-records
// @desc    Get all exit records with filters
// @access  Private (Admin panel only)
router.get('/exit-records', authenticateToken, requireAdminPanel, async (req, res) => {
  try {
    const {
      mainCategory,
      verifiedBy,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    let query = { isActive: false, status: 'Inactive', 'exitDetails.exitDate': { $exists: true } };

    // Apply filters
    if (mainCategory) {
      query['exitDetails.exitReason.mainCategory'] = mainCategory;
    }

    if (verifiedBy) {
      query['exitDetails.verifiedBy'] = verifiedBy;
    }

    if (startDate || endDate) {
      query['exitDetails.exitDate'] = {};
      if (startDate) {
        query['exitDetails.exitDate'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['exitDetails.exitDate'].$lte = new Date(endDate);
      }
    }

    // Apply search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Get users with exit records
    const users = await User.find(query)
      .select('name email employeeId phone designation department exitDetails inactiveDate inactiveBy')
      .populate('inactiveBy', 'name email')
      .populate('exitDetails.verifiedByUser', 'name email')
      .sort({ 'exitDetails.exitDate': -1 })
      .skip(skip)
      .limit(limitNumber);

    // Get total count
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      exitRecords: users,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });

  } catch (error) {
    console.error('Get exit records error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching exit records'
    });
  }
});

// @route   GET /api/users/:id/exit-details
// @desc    Get specific user exit details with document
// @access  Private (Admin panel only)
router.get('/:id/exit-details', authenticateToken, requireAdminPanel, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .select('name email employeeId phone designation department exitDetails inactiveDate inactiveBy status isActive')
      .populate('inactiveBy', 'name email')
      .populate('exitDetails.verifiedByUser', 'name email');

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    if (!user.exitDetails || !user.exitDetails.exitDate) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No exit details found for this user'
      });
    }

    res.json({
      success: true,
      exitDetails: user
    });

  } catch (error) {
    console.error('Get exit details error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching exit details'
    });
  }
});

// @route   GET /api/users/:id/exit-document
// @desc    Download exit proof document
// @access  Private (Admin panel only)
router.get('/:id/exit-document', authenticateToken, requireAdminPanel, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select('exitDetails');

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    if (!user.exitDetails || !user.exitDetails.proofDocument || !user.exitDetails.proofDocument.filePath) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No exit document found for this user'
      });
    }

    const filePath = user.exitDetails.proofDocument.filePath;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document file not found on server'
      });
    }

    // Send file
    res.download(filePath, user.exitDetails.proofDocument.fileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Server Error',
            message: 'Error downloading document'
          });
        }
      }
    });

  } catch (error) {
    console.error('Download exit document error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error downloading exit document'
    });
  }
});

// @route   PUT /api/users/:id/exit-details/verify
// @desc    Update verification status of exit details
// @access  Private (Admin panel only)
router.put('/:id/exit-details/verify', authenticateToken, requireAdminPanel, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;
    const { verifiedBy, remarks } = req.body;

    if (!verifiedBy || !['HR', 'Compliance'].includes(verifiedBy)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid verification type (HR or Compliance) is required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    if (!user.exitDetails || !user.exitDetails.exitDate) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No exit details found for this user'
      });
    }

    // Update verification details
    user.exitDetails.verifiedBy = verifiedBy;
    user.exitDetails.verifiedByUser = req.user._id;
    user.exitDetails.verifiedAt = new Date();
    if (remarks) {
      user.exitDetails.remarks = remarks;
    }

    await user.save({ validateModifiedOnly: true });

    // Create audit record
    const auditRecord = new AuditRecord({
      userId: userId,
      action: 'exit_details_verified',
      details: {
        verifiedBy: verifiedBy,
        verifiedByUser: req.user._id,
        verifiedByUserName: req.user.name,
        remarks: remarks
      },
      performedBy: req.user._id,
      performedByName: req.user.name
    });

    await auditRecord.save();

    res.json({
      success: true,
      message: 'Exit details verified successfully',
      exitDetails: user.exitDetails
    });

  } catch (error) {
    console.error('Verify exit details error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error verifying exit details'
    });
  }
});

// ==================== WARNING ROUTES ====================
// Add these routes to users.js before "module.exports = router;"

// File upload storage for warning attachments
const warningsDir = path.join(__dirname, '..', 'uploads', 'warnings');
if (!fs.existsSync(warningsDir)) {
  fs.mkdirSync(warningsDir, { recursive: true });
}

const warningStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, warningsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `warning-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, uniqueName);
  }
});

const warningUpload = multer({
  storage: warningStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed for warning attachments.'));
    }
  }
});

// @route   POST /api/users/:userId/warning
// @desc    Send warning to user with optional attachment
// @access  Private (Admin only)
router.post('/:userId/warning', authenticateToken, requireAdmin, warningUpload.single('attachment'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;

    console.log('📢 Creating warning for user:', userId);
    console.log('Message:', message);
    console.log('File:', req.file);

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Warning message is required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    const Warning = require('../models/Warning');

    // Create warning document
    const warning = new Warning({
      userId: userId,
      type: 'warning',
      title: 'Warning Notice',
      description: message,
      severity: 'medium',
      status: 'active',
      issuedBy: req.user._id,
      issuedAt: new Date(),
      metadata: {
        attachmentUrl: req.file ? `/uploads/warnings/${req.file.filename}` : null
      }
    });

    await warning.save();

    console.log('✅ Warning created:', warning._id);

    // Clear cache for notifications and user-related endpoints to show instant updates
    if (global.appCache) {
      const cacheKeys = [
        `__express__/api/notifications/user/${userId}`,
        `__express__/api/users/${userId}/warnings`,
        `__express__/api/audits/user/${userId}`,
        '__express__/api/audits',
        '__express__/api/notifications'
      ];
      cacheKeys.forEach(key => {
        global.appCache.del(key);
        console.log('🗑️ Cleared cache for:', key);
      });
      // Also clear any keys containing this userId 
      const allKeys = global.appCache.keys();
      allKeys.forEach(key => {
        if (key.includes(userId) || key.includes('notifications') || key.includes('warnings')) {
          global.appCache.del(key);
          console.log('🗑️ Cleared cache for:', key);
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Warning sent successfully',
      warning: {
        _id: warning._id,
        userId: warning.userId,
        title: warning.title,
        description: warning.description,
        severity: warning.severity,
        status: warning.status,
        issuedAt: warning.issuedAt,
        metadata: warning.metadata
      }
    });

  } catch (error) {
    console.error('Send warning error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error sending warning',
      details: error.message
    });
  }
});

// @route   GET /api/users/:userId/warnings
// @desc    Get all warnings for a user
// @access  Private (Admin or same user)
router.get('/:userId/warnings', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user can access this data
    const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];
    if (!adminPanelRoles.includes(req.user.userType) && req.user._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    const Warning = require('../models/Warning');

    const warnings = await Warning.find({ userId: userId })
      .populate('issuedBy', 'name email')
      .sort({ issuedAt: -1 });

    console.log(`📋 Found ${warnings.length} warnings for user ${userId}`);

    res.json({
      success: true,
      warnings: warnings
    });

  } catch (error) {
    console.error('Get warnings error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching warnings',
      details: error.message
    });
  }
});


module.exports = router;
