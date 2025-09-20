const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Award = require('../models/Award');
const LifecycleEvent = require('../models/LifecycleEvent');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateCreateAward, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/awards
// @desc    Get all awards and recognitions
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;

    let query = { status: 'approved' };
    if (userId) query.userId = userId;

    const awards = await Award.find(query)
      .sort({ awardDate: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email employeeId')
      .populate('awardedBy', 'name email');

    res.json({
      success: true,
      awards
    });

  } catch (error) {
    console.error('Get awards error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching awards'
    });
  }
});

// @route   POST /api/awards
// @desc    Create a new award (admin only)
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, validateCreateAward, async (req, res) => {
  try {
    const { userId, type, title, description, awardDate, value, criteria } = req.body;

    const award = new Award({
      userId,
      type,
      title: title || type,
      description,
      awardDate: awardDate ? new Date(awardDate) : new Date(),
      value,
      criteria,
      awardedBy: req.user._id
    });

    await award.save();

    // Create lifecycle event
    await LifecycleEvent.createAutoEvent({
      userId,
      type: 'award',
      title: `Award Received: ${award.title}`,
      description: `Received ${award.type} award`,
      category: 'positive',
      metadata: {
        awardId: award._id,
        additionalData: { type: award.type, value: award.value }
      },
      createdBy: req.user._id
    });

    const populatedAward = await Award.findById(award._id)
      .populate('userId', 'name email employeeId')
      .populate('awardedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Award created successfully',
      awardId: award._id,
      award: populatedAward
    });

  } catch (error) {
    console.error('Create award error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating award'
    });
  }
});

// File upload storage for award certificates (PDF)
const awardsDir = path.join(__dirname, '..', 'uploads', 'awards');
if (!fs.existsSync(awardsDir)) {
  fs.mkdirSync(awardsDir, { recursive: true });
}

const awardStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, awardsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const awardUpload = multer({
  storage: awardStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
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

// Simple model for stored certificates metadata
// We will reuse Award collection by storing as a type 'certificate' with pdfUrl
// @route   POST /api/awards/sendCertificate
// @desc    Upload and record an award certificate PDF
// @access  Private (Admin only)
router.post('/sendCertificate', authenticateToken, requireAdmin, awardUpload.single('pdfFile'), handleMulterError, async (req, res) => {
  try {
    const { userId, awardTitle, description } = req.body;
    
    if (!userId || !awardTitle || !description) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: 'userId, awardTitle, description are required' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: 'PDF file is required' 
      });
    }

    const pdfUrl = `/uploads/awards/${req.file.filename}`;

    const award = new Award({
      userId,
      type: 'certificate',
      title: awardTitle,
      description,
      awardDate: new Date(),
      criteria: 'Uploaded certificate',
      value: 0,
      certificateUrl: pdfUrl,
      awardedBy: req.user._id
    });
    
    await award.save();

    res.status(201).json({ 
      success: true, 
      certificate: { 
        _id: award._id, 
        userId, 
        awardTitle, 
        description, 
        pdfUrl, 
        createdAt: award.awardDate 
      } 
    });
    
  } catch (error) {
    console.error('Send certificate error:', error);
    res.status(500).json({ 
      error: 'Server Error', 
      message: error.message || 'Error sending certificate' 
    });
  }
});

// @route   GET /api/awards/statistics
// @desc    Get award statistics
// @access  Private (Admin only)
router.get('/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await Award.getStatistics();

    res.json({
      success: true,
      statistics: stats[0] || {
        totalAwards: 0,
        thisMonth: 0,
        thisYear: 0,
        typeDistribution: []
      }
    });

  } catch (error) {
    console.error('Get award statistics error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching award statistics'
    });
  }
});

// @route   POST /api/awards/certificate
// @desc    Create a certificate/award specifically (admin only)
// @access  Private (Admin only)
router.post('/certificate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, type, title, description, criteria, value } = req.body;

    if (!userId || !type || !title) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User ID, type, and title are required'
      });
    }

    const award = new Award({
      userId,
      type,
      title,
      description,
      criteria,
      value: value || 0,
      awardDate: new Date(),
      awardedBy: req.user._id
    });

    await award.save();

    // Create lifecycle event
    await LifecycleEvent.createAutoEvent({
      userId,
      type: 'award',
      title: `Certificate Awarded: ${title}`,
      description: `Received ${type} certificate`,
      category: 'positive',
      metadata: {
        awardId: award._id,
        additionalData: { type: award.type, value: award.value }
      },
      createdBy: req.user._id
    });

    // Send notification to user
    const Notification = require('../models/Notification');
    await new Notification({
      userId,
      title: `Certificate Awarded: ${title}`,
      message: `Congratulations! You have been awarded the ${type} certificate.`,
      type: 'success',
      priority: 'normal',
      sentBy: req.user._id
    }).save();

    const populatedAward = await Award.findById(award._id)
      .populate('userId', 'name email employeeId')
      .populate('awardedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      awardId: award._id,
      award: populatedAward
    });

  } catch (error) {
    console.error('Create certificate error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating certificate'
    });
  }
});

module.exports = router;