const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret-key');
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Account is deactivated'
      });
    }

    // Check session validity - only allow one active session per user
    if (!decoded.sessionId || user.sessionId !== decoded.sessionId) {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Session expired or invalid - please login again'
      });
    }

    req.user = user;
    next();
  } catch (error) {
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

// Middleware to check if user owns resource or is admin
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Access Denied',
      message: 'Authentication required'
    });
  }

  const userId = req.params.userId || req.params.id || req.body.userId;
  
  if (req.user.userType === 'admin' || req.user._id.toString() === userId) {
    return next();
  }

  return res.status(403).json({
    error: 'Access Denied',
    message: 'You can only access your own resources'
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
  requireOwnershipOrAdmin,
  optionalAuth,
  generateToken,
  decodeToken
};