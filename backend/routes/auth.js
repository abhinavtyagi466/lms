const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LifecycleEvent = require('../models/LifecycleEvent');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
      try {
      const { email, password, userType } = req.body;

      // Check if database is connected
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Database connection is not available'
        });
      }



    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account Deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Enhanced user type validation with enum-based access control
    const adminPanelTypes = ['manager', 'hod', 'hr', 'admin'];
    const userPanelTypes = ['user'];
    
    console.log(`Login attempt: ${email} (${user.userType}) trying to access ${userType} dashboard`);
    
    if (userType === 'admin' && !adminPanelTypes.includes(user.userType)) {
      console.log(`Access denied: ${user.userType} cannot access admin dashboard`);
      return res.status(401).json({
        error: 'Access Denied',
        message: `Access denied. ${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)} accounts cannot access the admin dashboard.`,
        userType: user.userType,
        attemptedAccess: 'admin'
      });
    }
    
    if (userType === 'user' && !userPanelTypes.includes(user.userType)) {
      console.log(`Access denied: ${user.userType} cannot access user dashboard`);
      return res.status(401).json({
        error: 'Access Denied',
        message: `Access denied. ${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)} accounts cannot access the user dashboard.`,
        userType: user.userType,
        attemptedAccess: 'user'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }

    // Check if user already has an active session
    if (user.sessionId) {
      console.log(`User ${user.email} already has an active session. Invalidating previous session.`);
    }

    // Generate new session ID and clear any existing session
    const sessionId = user.generateSessionId();
    user.sessionId = sessionId;
    
    console.log(`New session created for user ${user.email} with sessionId: ${sessionId}`);
    
    // Update last login
    await user.updateLastLogin();

    // Generate JWT token with session ID
    const token = generateToken(user._id, sessionId);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        ...userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during login'
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
    // Clear the user's session ID to invalidate all tokens
    await req.user.clearSession();
    
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
    
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // TODO: Implement password reset logic
    // 1. Generate reset token
    // 2. Save token to database with expiration
    // 3. Send email with reset link
    
    res.json({
      success: true,
      message: 'Password reset functionality will be implemented'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error processing password reset request'
    });
  }
});

module.exports = router;