const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const KPIScore = require('../models/KPIScore');
const Notification = require('../models/Notification');
const AuditRecord = require('../models/AuditRecord');
const Award = require('../models/Award');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateCreateUser, validateUpdateUser, validateObjectId, validateUserId, validatePagination } = require('../middleware/validation');

const router = express.Router();

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
// @access Private (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
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
      .select('name email phone employeeId department manager address location city state aadhaarNo panNo status kpiScore isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Error fetching users' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
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
      
      status: 'Active',
      isActive: true
    });

    console.log('Saving user to database...');
    await user.save();
    console.log('User saved successfully with Employee ID:', user.employeeId);

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

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: user._id,
      user: userResponse
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
// @access  Private (Admin only)
router.post('/:id/warning', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;
    const { message } = req.body;

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

    // Update user status to warning
    user.status = 'Warning';
    await user.save();

    // Create notification record
    const notification = new Notification({
      userId: user._id,
      type: 'warning',
      title: 'Performance Warning',
      message: message || 'Your performance has been flagged for review. Please improve your KPI scores.',
      isRead: false
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Warning sent successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Send warning error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error sending warning'
    });
  }
});

// @route   POST /api/users/:id/certificate
// @desc    Send certificate to user
// @access  Private (Admin only)
router.post('/:id/certificate', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;
    const { certificateType, message } = req.body;

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

    // Create notification record
    const notification = new Notification({
      userId: user._id,
      type: 'certificate',
      title: 'Certificate Awarded',
      message: message || `Congratulations! You have been awarded a ${certificateType || 'Performance'} certificate.`,
      isRead: false
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Certificate sent successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Send certificate error:', error);
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
// @access  Private (Admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
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
// @access  Private (Admin only)
router.get('/', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const { filter = 'all', page = 1, limit = 10, search } = req.query;

    // Build query based on filter
    let query = { isActive: true };

    if (filter !== 'all') {
      query.status = filter.charAt(0).toUpperCase() + filter.slice(1);
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
router.put('/:id', authenticateToken, validateObjectId, validateUpdateUser, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this route
    delete updateData.password;
    delete updateData.userType;
    delete updateData.isActive;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
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

    // Check for employeeId uniqueness if being updated
    if (updateData.employeeId && updateData.employeeId !== user.employeeId) {
      const existingEmployee = await User.findOne({ 
        employeeId: updateData.employeeId,
        _id: { $ne: userId }
      });
      
      if (existingEmployee) {
        return res.status(409).json({
          error: 'Employee ID Exists',
          message: 'User with this Employee ID already exists'
        });
      }
    }

    // Update user
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        user[key] = updateData[key];
      }
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating user'
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
    await user.save();

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
router.post('/:id/activate', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
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
    await user.save();

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
// @access  Private (Admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
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
router.put('/:id/activate', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
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
    await user.save();

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
router.put('/:id/deactivate', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
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
    await user.save();

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
// @desc    Set user as inactive with reason and remark
// @access  Private (Admin only)
router.put('/:id/set-inactive', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const userId = req.params.id;
    const { inactiveReason, inactiveRemark } = req.body;

    // Validate required fields
    if (!inactiveReason) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Inactive reason is required'
      });
    }

    // Validate reason is from allowed enum values
    const allowedReasons = ['Performance Issues', 'Policy Violation', 'Attendance Problems', 'Behavioral Issues', 'Resignation', 'Termination', 'Other'];
    if (!allowedReasons.includes(inactiveReason)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid inactive reason'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Update user status and inactive details
    user.status = 'Inactive';
    user.isActive = false;
    user.inactiveReason = inactiveReason;
    user.inactiveRemark = inactiveRemark?.trim() || '';
    user.inactiveDate = new Date();
    user.inactiveBy = req.user._id;

    await user.save();

    // Create audit record
    const auditRecord = new AuditRecord({
      userId: userId,
      action: 'user_deactivated',
      details: {
        reason: inactiveReason,
        remark: inactiveRemark,
        deactivatedBy: req.user._id,
        deactivatedByName: req.user.name
      },
      performedBy: req.user._id,
      performedByName: req.user.name
    });

    await auditRecord.save();

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User set as inactive successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Set user inactive error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error setting user as inactive'
    });
  }
});

// @route   PUT /api/users/:id/reactivate
// @desc    Reactivate user (clear inactive details)
// @access  Private (Admin only)
router.put('/:id/reactivate', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
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

    await user.save();

    // Create audit record
    const auditRecord = new AuditRecord({
      userId: userId,
      action: 'user_reactivated',
      details: {
        reactivatedBy: req.user._id,
        reactivatedByName: req.user.name
      },
      performedBy: req.user._id,
      performedByName: req.user.name
    });

    await auditRecord.save();

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

module.exports = router;