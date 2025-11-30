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
const exitDocsDir = path.join(__dirname, '..', 'uploads', 'exit-documents');
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
    console.error('File upload error:', error);
    return res.status(400).json({
      error: 'File Upload Error',
      message: error.message
    });
  }
  next();
};

// File upload storage for warnings and certificates
const notificationsDir = path.join(__dirname, '..', 'uploads', 'notifications');
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
        query.status = 'Active';
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
        const uploadsDir = path.join(__dirname, '..', process.env.LOCAL_UPLOAD_DIR || './uploads', 'avatars');
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
        const documentsDir = path.join(__dirname, '..', process.env.LOCAL_UPLOAD_DIR || './uploads', 'documents');
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
        '__express__/api/users?filter=all'
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
router.post('/:id/warning', authenticateToken, requireAdminPanel, validateObjectId, notificationUpload.single('attachment'), handleMulterError, async (req, res) => {
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

// @route   POST /api/users/:id/certificate
// @desc    Send certificate to user
// @access  Private (Admin panel only)
router.post('/:id/certificate', authenticateToken, requireAdminPanel, validateObjectId, notificationUpload.single('attachment'), handleMulterError, async (req, res) => {
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

    const warnings = await Notification.find({
      userId: userId,
      type: 'warning'
    }).sort({ createdAt: -1 });

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

// @route   GET /api/users/:id/certificates
// @desc    Get user certificates
// @access  Private (user can access own certificates, admin can access any)
router.get('/:id/certificates', authenticateToken, validateObjectId, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const certificates = await Notification.find({
      userId: userId,
      type: 'certificate'
    }).sort({ createdAt: -1 });

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
        query.status = 'Active';
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
        updateData.aadhaarNo = aadhaarNo.trim();
      }
      if (panNo !== undefined && panNo !== null && panNo !== '') {
        updateData.panNo = panNo.trim().toUpperCase();
      }

      // Handle password update (only if provided and not empty)
      if (password !== undefined && password !== null && password !== '') {
        updateData.password = await bcrypt.hash(password, 10);
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
        '__express__/api/users?filter=all'
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

    user.isActive = true;
    user.status = 'Active';
    await user.save({ validateModifiedOnly: true });

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
    await user.save({ validateModifiedOnly: true });

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
router.put('/:id/set-inactive', authenticateToken, requireUserManagementAccess, validateObjectId, exitDocUpload.single('proofDocument'), handleMulterError, async (req, res) => {
  try {
    const userId = req.params.id;
    const { 
      exitDate, 
      mainCategory, 
      subCategory, 
      exitReasonDescription, 
      verifiedBy, 
      remarks,
      // Keep backward compatibility
      inactiveReason,
      inactiveRemark
    } = req.body;

    console.log('Set inactive request received for user:', userId);
    console.log('File uploaded:', req.file ? 'Yes - ' + req.file.originalname : 'No');

    // Validate required fields
    if (!exitDate && !inactiveReason) {
      // Clean up uploaded file if validation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Exit date or inactive reason is required'
      });
    }

    if (!mainCategory && !inactiveReason) {
      // Clean up uploaded file if validation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Exit reason main category is required'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      // Clean up uploaded file if user not found
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Update user status and inactive details
    user.status = 'Inactive';
    user.isActive = false;
    
    // Set exit details
    user.exitDetails = {
      exitDate: exitDate ? new Date(exitDate) : new Date(),
      exitReason: {
        mainCategory: mainCategory || inactiveReason || 'Other',
        subCategory: subCategory || ''
      },
      exitReasonDescription: exitReasonDescription || inactiveRemark || '',
      verifiedBy: verifiedBy || 'Pending',
      verifiedByUser: verifiedBy !== 'Pending' ? req.user._id : null,
      verifiedAt: verifiedBy !== 'Pending' ? new Date() : null,
      remarks: remarks || ''
    };

    // Handle file upload
    if (req.file) {
      user.exitDetails.proofDocument = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      };
    }

    // Keep backward compatibility with old fields
    user.inactiveReason = mainCategory || inactiveReason || 'Other';
    user.inactiveRemark = exitReasonDescription || inactiveRemark || '';
    user.inactiveDate = exitDate ? new Date(exitDate) : new Date();
    user.inactiveBy = req.user._id;

    // Save without validating unchanged fields (fixes phone validation for old users)
    await user.save({ validateModifiedOnly: true });
    console.log('✅ User saved successfully as inactive');

    // Create audit record (don't block response on this)
    try {
      const auditRecord = new AuditRecord({
        userId: userId,
        type: 'other',
        title: 'User Deactivated - Exit Management',
        reason: `Exit Reason: ${user.exitDetails.exitReason.mainCategory}${user.exitDetails.exitReason.subCategory ? ' - ' + user.exitDetails.exitReason.subCategory : ''}`,
        description: `User deactivated by ${req.user.name}. Exit Date: ${user.exitDetails.exitDate.toLocaleDateString()}. ${user.exitDetails.exitReasonDescription ? 'Details: ' + user.exitDetails.exitReasonDescription : ''} ${req.file ? 'Proof document uploaded.' : ''}`,
        severity: 'medium',
        status: 'completed',
        createdBy: req.user._id,
        tags: ['exit', 'deactivation', user.exitDetails.exitReason.mainCategory.toLowerCase().replace(/\s+/g, '-')]
      });

      await auditRecord.save();
      console.log('✅ Audit record created successfully');
    } catch (auditError) {
      console.error('⚠️  Error creating audit record (non-critical):', auditError.message);
      // Don't fail the whole operation if audit record fails
    }

    // Create lifecycle event (don't block response on this)
    try {
      const LifecycleEvent = require('../models/LifecycleEvent');
      await LifecycleEvent.createAutoEvent({
        userId: user._id,
        type: 'left',
        title: 'Employee Exit',
        description: `Exit reason: ${user.exitDetails.exitReason.mainCategory}${user.exitDetails.exitReason.subCategory ? ' - ' + user.exitDetails.exitReason.subCategory : ''}`,
        category: 'negative',
        createdBy: req.user._id
      });
      console.log('✅ Lifecycle event created successfully');
    } catch (lifecycleError) {
      console.error('⚠️  Error creating lifecycle event (non-critical):', lifecycleError.message);
      // Don't fail the whole operation if lifecycle event fails
    }

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    console.log('✅ User deactivated successfully, sending response');
    res.json({
      success: true,
      message: 'User set as inactive successfully with exit details',
      user: userResponse,
      fileUploaded: !!req.file
    });

  } catch (error) {
    console.error('❌ Set user inactive error:', error);
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️  Cleaned up uploaded file after error');
      } catch (cleanupError) {
        console.error('⚠️  Error cleaning up file:', cleanupError);
      }
    }
    res.status(500).json({
      error: 'Server Error',
      message: 'Error setting user as inactive: ' + error.message
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

    // Reactivate user
    user.status = 'Active';
    user.isActive = true;
    user.inactiveReason = null;
    user.inactiveRemark = '';
    user.inactiveDate = null;
    user.inactiveBy = null;

    // Save without validating unchanged fields (fixes phone validation for old users)
    await user.save({ validateModifiedOnly: true });

    // Create audit record
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

    // Create lifecycle event (use 'achievement' type for reactivation as it's a positive event)
    try {
      const LifecycleEvent = require('../models/LifecycleEvent');
      await LifecycleEvent.createAutoEvent({
        userId: user._id,
        type: 'achievement',
        title: 'Account Reactivated',
        description: `Account reactivated by admin: ${req.user.name}`,
        category: 'positive',
        createdBy: req.user._id
      });
      console.log('✅ Lifecycle event created successfully');
    } catch (lifecycleError) {
      console.error('⚠️  Error creating lifecycle event (non-critical):', lifecycleError.message);
      // Don't fail the whole operation if lifecycle event fails
    }

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User reactivated successfully',
      user: userResponse
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

module.exports = router;