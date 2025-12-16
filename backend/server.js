const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
// const rateLimit = require('express-rate-limit'); // Disabled for unlimited API calls
const compression = require('compression');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const NodeCache = require('node-cache');

require('dotenv').config();

const app = express();

// Trust proxy - required when behind Nginx/reverse proxy for rate limiting
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize cache with TTL (Time To Live) settings
const cache = new NodeCache({
  stdTTL: 300, // Default TTL: 5 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Better performance
});

// Export cache for use in routes
global.appCache = cache;

// Create uploads directory if it doesn't exist
const uploadsDir = process.env.NODE_ENV === 'production'
  ? '/var/www/lms/backend/uploads'
  : path.join(__dirname, process.env.LOCAL_UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting - DISABLED for continuous monitoring
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // limit each IP to 500 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// CORS Configuration - ENHANCED FIX for preflight requests
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'https://feportal.foxivision.net',
      'https://www.feportal.foxivision.net',
      'http://feportal.foxivision.net',
      'http://www.feportal.foxivision.net',
      'https://feportal.foxivision.net:3000',
      'https://feportal.foxivision.net:3001',
      'http://feportal.foxivision.net:3000',
      'http://feportal.foxivision.net:3001',
      'http://72.60.99.209:3000',
      'http://72.60.99.209:3001',
      'https://72.60.99.209:3000',
      'https://72.60.99.209:3001'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-HTTP-Method-Override',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware BEFORE all other middleware
app.use(cors(corsOptions));

// Explicit preflight handler for all routes - MUST be before other routes
app.options('*', (req, res) => {
  console.log('Preflight request received for:', req.originalUrl);
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-HTTP-Method-Override, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

// Enhanced preflight handling for additional security
app.use((req, res, next) => {
  // Set CORS headers for all responses
  const origin = req.headers.origin;
  if (origin && ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-HTTP-Method-Override, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests explicitly
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request handled for:', req.originalUrl);
    res.status(200).end();
    return;
  }

  next();
});

// Compression middleware
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware - FIXED: Skip for multipart/form-data
app.use((req, res, next) => {
  // Skip body parsing for multipart/form-data (let multer handle it)
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

app.use((req, res, next) => {
  // Skip for multipart/form-data
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next();
  }
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

// File upload middleware - SKIP for routes that use multer instead
app.use((req, res, next) => {
  // Skip fileUpload for routes that use multer (they handle file uploads themselves)
  // kpi-triggers routes use multer
  if (req.path.startsWith('/api/kpi-triggers')) {
    return next();
  }
  // Users routes that use multer for file uploads
  if (req.path.startsWith('/api/users') && (
    req.path.includes('/set-inactive') ||
    req.path.includes('/warning') ||
    req.path.includes('/certificate')
  )) {
    return next();
  }
  // Apply fileUpload for other routes
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB max
    },
    abortOnLimit: true,
    responseOnLimit: 'File size limit exceeded'
  })(req, res, next);
});

// Cache middleware
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = cache.get(key);

    if (cachedBody) {
      console.log(`Cache hit for: ${key}`);
      return res.json(cachedBody);
    } else {
      // Store the original res.json method
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function (body) {
        // Cache successful responses
        if (res.statusCode === 200) {
          cache.set(key, body, duration);
          console.log(`Cached response for: ${key} (TTL: ${duration}s)`);
        }
        originalJson.call(this, body);
      };

      next();
    }
  };
};

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edutech-pro';
// Initialize session without MongoDB store for development
app.use(session({
  secret: process.env.SESSION_SECRET || 'devsecretdevsecretdevsecretdevsecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Static files - with debug logging
console.log('📁 Uploads directory path:', uploadsDir);
console.log('📁 Uploads directory exists:', fs.existsSync(uploadsDir));
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  // For viewing documents in browser instead of downloading
  if (req.path.match(/\.(pdf|jpg|jpeg|png)$/i)) {
    res.header('Content-Disposition', 'inline');
  }
  next();
}, express.static(uploadsDir));

// Try to connect to MongoDB with optimized settings
mongoose.connect(mongoUri, {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
})
  .then(() => {
    console.log('✅ Connected to MongoDB with optimized settings');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Server running without database connection for development...');
  });

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const moduleRoutes = require('./routes/modules');
const quizRoutes = require('./routes/quizzes');
const questionRoutes = require('./routes/questions');
const userProgressRoutes = require('./routes/userProgress');
const progressRoutes = require('./routes/progress');
const kpiRoutes = require('./routes/kpi');
const reportRoutes = require('./routes/reports');
const awardRoutes = require('./routes/awards');
const auditRoutes = require('./routes/audits');
const auditSchedulingRoutes = require('./routes/auditScheduling');
const lifecycleRoutes = require('./routes/lifecycle');
const notificationRoutes = require('./routes/notifications');
const trainingAssignmentRoutes = require('./routes/trainingAssignments');
const quizAttemptRoutes = require('./routes/quizAttempts');
const userActivityRoutes = require('./routes/userActivity');
const kpiTriggerRoutes = require('./routes/kpiTriggers');
const emailTemplateRoutes = require('./routes/emailTemplates');
const emailLogRoutes = require('./routes/emailLogs');
const recipientGroupRoutes = require('./routes/recipientGroups');
const autoKPIScheduler = require('./services/autoKPIScheduler');

// Apply caching to read-only endpoints (but skip dashboard endpoints for real-time updates)
app.use('/api/users', (req, res, next) => {
  // Skip cache for user profile endpoints that need real-time data
  if (req.path.includes('/profile') || req.path.includes('/stats')) {
    return next();
  }
  return cacheMiddleware(300)(req, res, next); // 5 minutes
});
app.use('/api/modules', (req, res, next) => {
  // Skip cache for personalised and user module endpoints to show real-time progress
  if (req.path.includes('/personalised') || req.path.includes('/user/')) {
    return next();
  }
  return cacheMiddleware(600)(req, res, next); // 10 minutes for other module endpoints
});
app.use('/api/reports', (req, res, next) => {
  // Skip cache for dashboard/stats endpoints to enable real-time updates
  if (req.path.includes('/admin/stats') || req.path.includes('/admin/user-progress')) {
    return next();
  }
  return cacheMiddleware(60)(req, res, next); // 1 minute for other reports
});
app.use('/api/awards', (req, res, next) => {
  // Skip cache for user-specific award/certificate queries to show real-time data
  if (req.path.includes('/user/') || req.query.userId) {
    return next();
  }
  return cacheMiddleware(30)(req, res, next); // 30 seconds for general awards list
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quiz', quizRoutes); // Alias for backward compatibility
app.use('/api/questions', questionRoutes);
app.use('/api/user-progress', userProgressRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/awards', awardRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/audit-scheduling', auditSchedulingRoutes);
app.use('/api/lifecycle', lifecycleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/training-assignments', trainingAssignmentRoutes);
app.use('/api/quiz-attempts', quizAttemptRoutes);
app.use('/api/user-activity', userActivityRoutes);
app.use('/api/kpi-triggers', kpiTriggerRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/email-logs', emailLogRoutes);
app.use('/api/recipient-groups', recipientGroupRoutes);
app.use('/api/kpi-configuration', require('./routes/kpiConfiguration'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'EduTech Pro API Server',
    version: '1.0.0',
    status: 'Running',
    documentation: '/api/docs'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      message: 'The provided ID is not valid'
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'A record with this information already exists'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 EduTech Pro API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

// Start Auto KPI Scheduler
if (process.env.NODE_ENV !== 'test') {
  autoKPIScheduler.start();
  console.log('Auto KPI Scheduler started');
}

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  autoKPIScheduler.stop();
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
// expose io for models/hooks
app.set('io', io);
