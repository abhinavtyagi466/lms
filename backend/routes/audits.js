const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AuditRecord = require('../models/AuditRecord');
const AuditNotice = require('../models/AuditNotice');
const LifecycleEvent = require('../models/LifecycleEvent');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateCreateAuditRecord, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/audits
// @desc    Get audit and warning records (Admin: all, User: own records)
// @access  Private (All authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type, userId, page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    
    // Admin can see all records, users can only see their own
    if (req.user.userType === 'admin') {
      if (userId) query.userId = userId;
    } else {
      query.userId = req.user._id; // Users can only see their own records
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const records = await AuditRecord.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .populate('userId', 'name email employeeId')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    const total = await AuditRecord.countDocuments(query);

    res.json({
      success: true,
      records,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });

  } catch (error) {
    console.error('Get audit records error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching audit records'
    });
  }
});

// @route   POST /api/audits
// @desc    Create a new audit/warning record (admin only)
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, validateCreateAuditRecord, async (req, res) => {
  try {
    const { userId, type, reason, description, severity, dueDate, actionRequired } = req.body;

    const auditRecord = new AuditRecord({
      userId,
      type,
      reason,
      description,
      severity: severity || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      actionRequired,
      createdBy: req.user._id
    });

    await auditRecord.save();

    // Create lifecycle event
    await LifecycleEvent.createAutoEvent({
      userId,
      type: type === 'audit' ? 'audit' : 'warning',
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Record Created`,
      description: reason,
      category: 'negative',
      metadata: {
        auditId: auditRecord._id,
        additionalData: { type, severity: auditRecord.severity }
      },
      createdBy: req.user._id
    });

    const populatedRecord = await AuditRecord.findById(auditRecord._id)
      .populate('userId', 'name email employeeId')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Audit record created successfully',
      recordId: auditRecord._id,
      record: populatedRecord
    });

  } catch (error) {
    console.error('Create audit record error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating audit record'
    });
  }
});

// File upload storage for audit notices (PDF)
const noticesDir = path.join(__dirname, '..', 'uploads', 'notices');
if (!fs.existsSync(noticesDir)) {
  fs.mkdirSync(noticesDir, { recursive: true });
}

const noticeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, noticesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const noticeUpload = multer({
  storage: noticeStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

// @route   POST /api/audits/sendNotice
// @desc    Send audit/warning notice with PDF attachment
// @access  Private (Admin only)
router.post('/sendNotice', authenticateToken, requireAdmin, noticeUpload.single('pdfFile'), async (req, res) => {
  try {
    const { userId, title, description } = req.body;

    if (!userId || !title || !description) {
      return res.status(400).json({ error: 'Validation Error', message: 'userId, title and description are required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Validation Error', message: 'PDF file is required' });
    }

    const pdfUrl = `/uploads/notices/${req.file.filename}`;

    const notice = await AuditNotice.create({ userId, title, description, pdfUrl });

    res.status(201).json({ success: true, notice });
  } catch (error) {
    console.error('Send audit notice error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Error sending audit notice' });
  }
});

// @route   GET /api/audits/notices
// @desc    List all audit notices (admin) or own (user)
// @access  Private
router.get('/notices', authenticateToken, async (req, res) => {
  try {
    const query = req.user.userType === 'admin' ? {} : { userId: req.user._id };
    const notices = await AuditNotice.find(query).sort({ createdAt: -1 }).populate('userId', 'name email');
    res.json({ success: true, notices });
  } catch (error) {
    console.error('List audit notices error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Error fetching notices' });
  }
});

// @route   POST /api/audits/warning
// @desc    Create a warning record specifically (admin only)
// @access  Private (Admin only)
router.post('/warning', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, title, reason, description, severity, actionRequired, dueDate } = req.body;

    if (!userId || !title || !reason) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User ID, title, and reason are required'
      });
    }

    const auditRecord = new AuditRecord({
      userId,
      type: 'warning',
      title,
      reason,
      description,
      severity: severity || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      actionRequired,
      createdBy: req.user._id
    });

    await auditRecord.save();

    // Create lifecycle event
    await LifecycleEvent.createAutoEvent({
      userId,
      type: 'warning',
      title: `Warning: ${title}`,
      description: reason,
      category: 'negative',
      metadata: {
        auditId: auditRecord._id,
        additionalData: { severity: auditRecord.severity }
      },
      createdBy: req.user._id
    });

    // Send notification to user
    const Notification = require('../models/Notification');
    await new Notification({
      userId,
      title: `Warning: ${title}`,
      message: reason,
      type: 'warning',
      priority: severity === 'critical' ? 'high' : severity === 'high' ? 'high' : 'normal',
      sentBy: req.user._id
    }).save();

    const populatedRecord = await AuditRecord.findById(auditRecord._id)
      .populate('userId', 'name email employeeId')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Warning created successfully',
      recordId: auditRecord._id,
      record: populatedRecord
    });

  } catch (error) {
    console.error('Create warning error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating warning'
    });
  }
});

// @route   GET /api/audits/user/:userId
// @desc    Get all audit records for a specific user
// @access  Private (Admin only)
router.get('/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { limit = 10, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const audits = await AuditRecord.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'name email employeeId')
      .populate('auditedBy', 'name email');

    const total = await AuditRecord.countDocuments({ userId });

    res.json({
      success: true,
      data: audits,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get user audit records error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user audit records'
    });
  }
});

module.exports = router;