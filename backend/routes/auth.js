const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LifecycleEvent = require('../models/LifecycleEvent');
const UserSession = require('../models/UserSession');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    console.log('=== LOGIN REQUEST ===');
    console.log('Email:', email);
    console.log('UserType requested:', userType);
    console.log('Password provided:', password ? 'Yes (hidden)' : 'No');

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ Database not connected');
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database connection is not available'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }

    console.log(`✅ User found: ${user.email}, userType: ${user.userType}, isActive: ${user.isActive}`);

    // Check if account is active
    if (!user.isActive) {
      console.log(`❌ Account deactivated: ${user.email}`);
      return res.status(401).json({
        error: 'Account Deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Enhanced user type validation with enum-based access control
    const adminPanelTypes = ['manager', 'hod', 'hr', 'admin'];
    const userPanelTypes = ['user'];

    console.log(`Login attempt: ${email} (userType in DB: ${user.userType}) trying to access ${userType} dashboard`);

    // Check if user is trying to access admin dashboard
    if (userType === 'admin' && !adminPanelTypes.includes(user.userType)) {
      console.log(`Access denied: ${user.userType} cannot access admin dashboard`);
      return res.status(403).json({
        error: 'Access Denied',
        message: `Access denied. ${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)} accounts cannot access the admin dashboard.`,
        userType: user.userType,
        attemptedAccess: 'admin'
      });
    }

    // Check if user is trying to access user dashboard
    if (userType === 'user' && !userPanelTypes.includes(user.userType)) {
      console.log(`Access denied: ${user.userType} cannot access user dashboard`);
      return res.status(403).json({
        error: 'Access Denied',
        message: `Access denied. ${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)} accounts cannot access the user dashboard.`,
        userType: user.userType,
        attemptedAccess: 'user'
      });
    }

    // Check password
    console.log('🔐 Checking password...');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`❌ Password mismatch for: ${user.email}`);
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }

    console.log('✅ Password verified');

    // Check if user already has an active session
    if (user.sessionId) {
      console.log(`User ${user.email} already has an active session. Invalidating previous session.`);
      // End previous session in DB if exists
      await UserSession.findOneAndUpdate(
        { sessionId: user.sessionId },
        {
          isActive: false,
          endTime: new Date(),
          terminatedReason: 'new_login'
        }
      );
    }

    // Generate new session ID and clear any existing session
    const sessionId = user.generateSessionId();
    user.sessionId = sessionId;
    user.lastLogin = new Date();

    console.log(`New session created for user ${user.email} with sessionId: ${sessionId}`);

    // Save user with sessionId and lastLogin
    await user.save({ validateModifiedOnly: true });
    console.log(`✅ User saved with sessionId: ${user.sessionId}`);

    // Create new UserSession record
    try {
      const userAgent = req.get('User-Agent') || 'Unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

      // Simple device detection logic
      let deviceType = 'desktop';
      if (/mobile/i.test(userAgent)) deviceType = 'mobile';
      else if (/tablet/i.test(userAgent)) deviceType = 'tablet';

      await UserSession.create({
        userId: user._id,
        sessionId: sessionId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        isActive: true,
        startTime: new Date(),
        deviceInfo: {
          type: deviceType,
          browser: 'Unknown', // Could be parsed from UA
          os: 'Unknown'      // Could be parsed from UA
        }
      });
      console.log('✅ UserSession created successfully');
    } catch (sessionError) {
      console.error('Error creating UserSession:', sessionError);
      // Don't block login if session creation fails, but log it
    }

    // Generate JWT token with session ID
    const token = generateToken(user._id, sessionId);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    console.log(`Login successful for user: ${user.email}, userType: ${user.userType}, accessing: ${userType} dashboard`);

    // Emit login event
    const io = req.app.get('io');
    if (io) {
      io.emit('user:login', {
        userId: user._id,
        name: user.name,
        email: user.email,
        loginTime: new Date()
      });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        ...userResponse,
        token,
        mustChangePassword: user.mustChangePassword
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if database is connected
    // if (mongoose.connection.readyState !== 1) {
    //   return res.status(503).json({
    //     error: 'Service Unavailable',
    //     message: 'Database connection is not available. Please try again later.'
    //   });
    // }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        error: 'Registration Failed',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      password,
      userType: 'user' // Default to regular user
    });

    await user.save();

    // Create lifecycle event for joining
    await LifecycleEvent.createAutoEvent({
      userId: user._id,
      type: 'joined',
      title: 'Joined Company',
      description: `${user.name} joined as a Field Executive`,
      category: 'milestone'
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        ...userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Registration Failed',
        message: 'User with this information already exists'
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during registration'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const currentSessionId = req.user.sessionId;

    // Clear the user's session ID to invalidate all tokens
    await req.user.clearSession();

    // End UserSession in DB
    if (currentSessionId) {
      await UserSession.findOneAndUpdate(
        { sessionId: currentSessionId },
        {
          isActive: false,
          endTime: new Date(),
          terminatedReason: 'normal_logout'
        }
      );
    }

    // Emit logout event
    const io = req.app.get('io');
    if (io) {
      io.emit('user:logout', {
        userId: req.user._id,
        lastSeen: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during logout'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('department');

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user information'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Generate new token with current session ID
    const token = generateToken(req.user._id, req.user.sessionId);

    res.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error refreshing token'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Check if user exists and is active
    if (!user || !user.isActive) {
      // Don't reveal if user exists for security, unless specifically requested to be verbose,
      // but standard practice is to return generic success.
      // User requested: "sirf active user hi password reset krr payeinn baki ko bole data not found in database"
      // So if not found or not active -> "Data not found"
      return res.status(404).json({
        error: 'Not Found',
        message: 'Data not found in database'
      });
    }

    // Generate temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let tempPassword = '';
    for (let i = 0; i < 10; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // DEBUG: Log the temporary password so developer can see it
    console.log('------------------------------------------------');
    console.log(`Generated Temp Password for ${user.email}: ${tempPassword}`);
    console.log('------------------------------------------------');

    // Set the plain text password - The User model pre-save hook will handle hashing
    user.password = tempPassword;
    user.mustChangePassword = true;

    // Save updated user - this triggers the pre-save hook which hashes the password
    await user.save();

    // Send email with temporary password
    try {
      const emailService = require('../services/emailService');

      if (typeof emailService.sendPasswordResetEmail === 'function') {
        await emailService.sendPasswordResetEmail(user, tempPassword);
        console.log(`✅ Password reset email sent to ${user.email}`);
      } else {
        // Fallback to generic send function if specific one doesn't exist
        await emailService.sendEmail(
          user.email,
          'passwordReset',
          {
            userName: user.name,
            tempPassword: tempPassword
          }
        );
        console.log(`✅ Password reset email sent (generic) to ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      // Continue even if email fails - user can get password from admin or logs
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error processing password reset request'
    });
  }
});

// @route   POST /api/auth/update-password
// @desc    Update password (force change)
// @access  Private
router.post('/update-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = password;
    user.mustChangePassword = false; // Reset the flag

    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
});

module.exports = router;