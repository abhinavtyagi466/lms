const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, process.env.LOCAL_UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

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
      'https://marasasarovarpremiere.in',
      'https://www.marasasarovarpremiere.in',
      'http://marasasarovarpremiere.in',
      'http://www.marasasarovarpremiere.in',
      'https://marasasarovarpremiere.in:3000',
      'https://marasasarovarpremiere.in:3001',
      'http://marasasarovarpremiere.in:3000',
      'http://marasasarovarpremiere.in:3001',
      'http://193.203.160.107:3000',
      'http://193.203.160.107:3001',
      'https://193.203.160.107:3000',
      'https://193.203.160.107:3001'
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB max
  },
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded'
}));

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edutech-pro';

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

// Static files
app.use('/uploads', express.static(uploadsDir));

// Try to connect to MongoDB (optional for development)
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
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
const autoKPIScheduler = require('./services/autoKPIScheduler');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/quizzes', quizRoutes);
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
