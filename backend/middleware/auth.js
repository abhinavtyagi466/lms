const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Enhanced logging for debugging auth issues
    console.log(`[AUTH] Request to: ${req.method} ${req.originalUrl}`);
    console.log(`[AUTH] Token present: ${!!token}`);

    if (!token) {
      console.log('[AUTH] ❌ No token provided');
      return res.status(401).json({
        error: 'Access Denied',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret-key');
    console.log(`[AUTH] Token decoded for userId: ${decoded.userId}`);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.log(`[AUTH] ❌ User not found for userId: ${decoded.userId}`);
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      console.log(`[AUTH] ❌ User ${user.email} is deactivated`);
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Account is deactivated'
      });
    }

    // Check session validity - only allow one active session per user
    if (!decoded.sessionId || user.sessionId !== decoded.sessionId) {
      console.log(`[AUTH] ❌ Session mismatch for user ${user.email}`);
      console.log(`[AUTH]    Token sessionId: ${decoded.sessionId}`);
      console.log(`[AUTH]    DB sessionId:    ${user.sessionId}`);

      return res.status(401).json({
        error: 'Access Denied',
        message: 'Session expired or invalid - please login again'
      });
    }

    console.log(`[AUTH] ✅ User authenticated: ${user.email} (${user.userType})`);
    req.user = user;
    next();
  } catch (error) {
    console.log(`[AUTH] ❌ Token verification error: ${error.name} - ${error.message}`);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Token has expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Invalid token'
      });
    }

    return res.status(500).json({
      error: 'Server Error',
      message: 'Error verifying token'
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Access Denied',
      message: 'Authentication required'
    });
  }

  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Admin privileges required'
    });
  }

  next();
};

// Middleware to check if user has admin panel access (admin, hr, manager, hod)
const requireAdminPanel = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Access Denied',
      message: 'Authentication required'
    });
  }

  const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];

  if (!adminPanelRoles.includes(req.user.userType)) {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Admin panel access required'
    });
  }

  next();
};

// Middleware to check if user owns resource or is admin panel user
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Access Denied',
      message: 'Authentication required'
    });
  }

  const userId = req.params.userId || req.params.id || req.body.userId;
  const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];

  // All admin panel users can access any user's resources
  if (adminPanelRoles.includes(req.user.userType) || req.user._id.toString() === userId) {
    return next();
  }

  return res.status(403).json({
    error: 'Access Denied',
    message: 'You can only access your own resources'
  });
};

// Middleware to check if user can edit/manage other users
// All admin panel users (admin, hr, manager, hod) have same full access
const requireUserManagementAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Access Denied',
      message: 'Authentication required'
    });
  }

  const currentUserRole = req.user.userType;
  const adminPanelRoles = ['admin', 'hr', 'manager', 'hod'];

  // All admin panel users have full access to manage all users
  if (adminPanelRoles.includes(currentUserRole)) {
    return next();
  }

  // Regular users don't have access
  return res.status(403).json({
    error: 'Access Denied',
    message: 'You do not have permission to manage users'
  });
};

// Middleware to attach user info to request (optional authentication)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret-key');
      const user = await User.findById(decoded.userId).select('-password');

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Utility function to generate JWT token
const generateToken = (userId, sessionId) => {
  return jwt.sign(
    { userId, sessionId },
    process.env.JWT_SECRET || 'dev-jwt-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Utility function to decode token without verification
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminPanel,
  requireOwnershipOrAdmin,
  requireUserManagementAccess,
  optionalAuth,
  generateToken,
  decodeToken
};