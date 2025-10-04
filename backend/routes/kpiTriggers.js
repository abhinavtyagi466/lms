const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const kpiTriggerService = require('../services/kpiTriggerService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage instead of disk storage

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @route   POST /api/kpi-triggers/upload-excel
// @desc    Upload Excel file and process KPI triggers
// @access  Private (Admin only)
router.post('/upload-excel', authenticateToken, requireAdmin, upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No Excel file uploaded'
      });
    }

    const { period } = req.body;
    if (!period) {
      return res.status(400).json({
        success: false,
        message: 'Period is required (e.g., Apr-25)'
      });
    }

    // Read Excel file from buffer
    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
    // Validate Excel structure
    if (jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty or invalid format'
      });
    }

    // Check required columns
    const requiredColumns = ['FE', 'Total Case Done', 'TAT %', 'Major Negative %', 'Negative %'];
    const firstRow = jsonData[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }

    // Process KPI data and triggers
    const results = await kpiTriggerService.processKPIFromExcel(jsonData, period, req.user._id);

    res.json({
      success: true,
      message: 'KPI data processed successfully',
      data: {
        period: period,
        totalRecords: results.length,
        successfulRecords: results.filter(r => r.success).length,
        failedRecords: results.filter(r => !r.success).length,
        results: results
      }
    });

  } catch (error) {
    console.error('Excel upload error:', error);

    res.status(500).json({
      success: false,
      message: 'Error processing Excel file',
      error: error.message
    });
  }
});

// @route   POST /api/kpi-triggers/preview
// @desc    Preview KPI triggers without executing them - ENHANCED with user matching
// @access  Private (Admin only)
router.post('/preview', authenticateToken, requireAdmin, (req, res) => {
  console.log('=== PREVIEW REQUEST DEBUG ===');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  
  // Manually handle multer with error catching
  const uploadHandler = upload.single('excelFile');
  
  uploadHandler(req, res, async (err) => {
    if (err) {
      console.error('===== MULTER ERROR =====');
      console.error('Error:', err.message);
      console.error('Error type:', err.name);
      console.error('========================');
      return res.status(400).json({
        success: false,
        message: 'File upload failed: ' + err.message
      });
    }
    
    console.log('File received:', req.file ? req.file.originalname : 'NO FILE');
    console.log('File size:', req.file ? req.file.size : 'N/A');
    console.log('Body:', req.body);
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No Excel file uploaded'
      });
    }

    // Read Excel file from buffer
    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
    // Validate Excel structure
    if (jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty or invalid format'
      });
    }

    // Check required columns - flexible checking
    const firstRow = jsonData[0];
    const columnNames = Object.keys(firstRow);
    
    console.log('Excel columns found:', columnNames);
    
    // Required columns with flexible matching
    const requiredFields = {
      month: ['Month', 'month', 'MONTH'],
      fe: ['FE', 'fe', 'Field Executive', 'Name'],
      totalCases: ['Total Case Done', 'Total Cases', 'Cases Done'],
      tat: ['TAT %', 'TAT', 'TAT Percentage'],
      majorNeg: ['Major Negative %', 'Major Negativity %', 'Major Neg %'],
      negative: ['Negative %', 'Negativity %', 'General Negativity %']
    };
    
    const missingColumns = [];
    for (const [field, possibleNames] of Object.entries(requiredFields)) {
      const found = possibleNames.some(name => columnNames.includes(name));
      if (!found) {
        missingColumns.push(possibleNames[0]);
      }
    }
    
    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }

    // Auto-detect period from Excel Month column (or use provided period)
    let period = req.body.period;
    if (!period && firstRow['Month']) {
      period = firstRow['Month'];
      console.log('Auto-detected period from Excel:', period);
    }
    
    if (!period) {
      return res.status(400).json({
        success: false,
        message: 'Period not found. Please include "Month" column in Excel (e.g., Oct-25)'
      });
    }

    // Generate preview WITH user matching
    const previewResults = [];
    const User = require('../models/User');
    
    for (const row of jsonData) {
      try {
        const feName = row.FE;
        const feEmail = row['Email'];
        const feEmployeeId = row['Employee ID'];
        
        // Try to find matching user in database - ENHANCED matching strategy
        let matchQuery = [];
        
        // Priority 1: Match by Employee ID (most accurate)
        if (feEmployeeId) {
          matchQuery.push({ employeeId: feEmployeeId });
        }
        
        // Priority 2: Match by Email (very accurate)
        if (feEmail) {
          matchQuery.push({ email: { $regex: feEmail, $options: 'i' } });
        }
        
        // Priority 3: Match by Name (less accurate but fallback)
        if (feName) {
          matchQuery.push({ name: { $regex: feName, $options: 'i' } });
        }
        
        const matchedUser = matchQuery.length > 0 
          ? await User.findOne({ $or: matchQuery }).select('_id name email employeeId department')
          : null;

        // Calculate KPI
        const kpiScore = kpiTriggerService.calculateKPIScore(row);
        const rating = kpiTriggerService.getRating(kpiScore);
        
        // Get all triggers (score-based + condition-based)
        const scoreTriggers = kpiTriggerService.getScoreBasedTriggers(kpiScore);
        const conditionTriggers = kpiTriggerService.getConditionBasedTriggers(kpiScore, row);
        const allTriggers = [...scoreTriggers, ...conditionTriggers];
        
        previewResults.push({
          fe: feName,
          matched: !!matchedUser,
          user: matchedUser ? {
            id: matchedUser._id,
            name: matchedUser.name,
            email: matchedUser.email,
            employeeId: matchedUser.employeeId,
            department: matchedUser.department
          } : null,
          kpiScore: kpiScore,
          rating: rating,
          triggers: allTriggers.map(trigger => ({
            type: trigger.training ? 'training' : trigger.audit ? 'audit' : 'warning',
            action: trigger.training || trigger.audit || 'Warning Letter',
            warning: trigger.warning || false,
            conditionMet: trigger.conditionMet || null,
            emailRecipients: trigger.emailRecipients || {}
          })),
          rawData: {
            totalCases: parseInt(row['Total Case Done']) || 0,
            tatPercentage: parseFloat(row['TAT %']) || 0,
            majorNegPercentage: parseFloat(row['Major Negative %']) || 0,
            generalNegPercentage: parseFloat(row['Negative %']) || 0,
            qualityPercentage: parseFloat(row['Quality Concern % Age']) || 0,
            insuffPercentage: parseFloat(row['Insuff %']) || 0,
            neighborCheckPercentage: parseFloat(row['Neighbor Check % Age']) || 0,
            onlinePercentage: parseFloat(row['Online % Age']) || 0
          }
        });
      } catch (error) {
        console.error(`Error processing preview for ${row.FE}:`, error);
        previewResults.push({
          fe: row.FE,
          matched: false,
          error: error.message,
          success: false
        });
      }
    }

    // Calculate summary
    const matchedCount = previewResults.filter(r => r.matched).length;
    const unmatchedCount = previewResults.filter(r => !r.matched).length;

    res.json({
      success: true,
      message: 'Preview generated successfully',
      data: {
        period: period,
        totalRecords: previewResults.length,
        matchedUsers: matchedCount,
        unmatchedUsers: unmatchedCount,
        previewResults: previewResults
      }
    });

    } catch (error) {
      console.error('Preview error:', error);

      res.status(500).json({
        success: false,
        message: 'Error generating preview',
        error: error.message
      });
    }
  }); // Close uploadHandler callback
});

// @route   GET /api/kpi-triggers/pending
// @desc    Get all pending triggers
// @access  Private (Admin only)
router.get('/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingTriggers = await kpiTriggerService.getPendingTriggers();
    
    res.json({
      success: true,
      data: pendingTriggers
    });
  } catch (error) {
    console.error('Get pending triggers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending triggers',
      error: error.message
    });
  }
});

// @route   GET /api/kpi-triggers/history/:userId
// @desc    Get trigger history for a user
// @access  Private (Admin only)
router.get('/history/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    const history = await kpiTriggerService.getTriggerHistory(userId, parseInt(limit));
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get trigger history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trigger history',
      error: error.message
    });
  }
});

// @route   POST /api/kpi-triggers/process-single
// @desc    Process KPI for a single user manually - ENHANCED
// @access  Private (Admin only)
router.post('/process-single', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, period, kpiData, sendEmail } = req.body;
    
    if (!period || !kpiData) {
      return res.status(400).json({
        success: false,
        message: 'period and kpiData are required'
      });
    }

    const User = require('../models/User');
    let user;

    // If userId provided, use it; otherwise find by name
    if (userId) {
      user = await User.findById(userId);
    } else {
      // Find user by FE name from Excel
      const feName = kpiData.FE;
      user = await User.findOne({ 
        $or: [
          { name: { $regex: feName, $options: 'i' } },
          { employeeId: feName }
        ]
      });
    }

    if (!user) {
      // If user not found and sendEmail is true, still send email
      if (sendEmail) {
        console.log(`[EMAIL] Sending to unmatched user: ${kpiData.FE}`);
        return res.json({
          success: true,
          message: 'Email sent to unmatched user',
          data: {
            fe: kpiData.FE,
            matched: false,
            emailSent: true
          }
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    const result = await kpiTriggerService.processKPIRow(kpiData, period, req.user._id);
    
    res.json({
      success: true,
      message: 'KPI processed successfully',
      data: {
        ...result,
        emailSent: sendEmail || false
      }
    });
  } catch (error) {
    console.error('Process single KPI error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing KPI',
      error: error.message
    });
  }
});

// @route   POST /api/kpi-triggers/process-bulk
// @desc    Process KPI for multiple users (bulk execution)
// @access  Private (Admin only)
router.post('/process-bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period, kpiDataList, sendEmail } = req.body;
    
    if (!period || !kpiDataList || !Array.isArray(kpiDataList)) {
      return res.status(400).json({
        success: false,
        message: 'period and kpiDataList (array) are required'
      });
    }

    const results = [];
    const User = require('../models/User');

    for (const kpiData of kpiDataList) {
      try {
        const feName = kpiData.FE;
        
        // Find user
        const user = await User.findOne({ 
          $or: [
            { name: { $regex: feName, $options: 'i' } },
            { employeeId: feName }
          ]
        });

        if (!user) {
          // If user not found but sendEmail is true
          if (sendEmail) {
            console.log(`[EMAIL] Sending to unmatched user: ${feName}`);
            results.push({
              fe: feName,
              matched: false,
              emailSent: true,
              success: true
            });
          } else {
            results.push({
              fe: feName,
              matched: false,
              success: false,
              error: 'User not found in database'
            });
          }
          continue;
        }

        // Process KPI with admin user context
        const result = await kpiTriggerService.processKPIRow(kpiData, period, req.user._id);
        results.push({
          ...result,
          emailSent: sendEmail || false
        });

      } catch (error) {
        console.error(`Error processing ${kpiData.FE}:`, error);
        results.push({
          fe: kpiData.FE,
          success: false,
          error: error.message
        });
      }
    }

    // Calculate summary
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const matchedCount = results.filter(r => r.matched !== false).length;
    const unmatchedCount = results.filter(r => r.matched === false).length;

    res.json({
      success: true,
      message: `Processed ${successCount} out of ${results.length} records successfully`,
      data: {
        period: period,
        totalRecords: results.length,
        successCount: successCount,
        failureCount: failureCount,
        matchedUsers: matchedCount,
        unmatchedUsers: unmatchedCount,
        results: results
      }
    });

  } catch (error) {
    console.error('Bulk processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bulk KPI data',
      error: error.message
    });
  }
});

// @route   GET /api/kpi-triggers/template
// @desc    Download Excel template for KPI data - ENHANCED with Email and Employee ID
// @access  Private (Admin only)
router.get('/template', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get current month for template
    const currentDate = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = `${monthNames[currentDate.getMonth()]}-${currentDate.getFullYear().toString().slice(-2)}`;
    
    // Create sample data for template with realistic examples
      const templateData = [
        {
          'Month': currentMonth,
          'FE': 'John Doe',
          'Employee ID': 'EMP001',
          'Email': 'john.doe@company.com',
        'Total Case Done': 120,
        'IN TAT': 115,
        'TAT %': 95.83,
        'Major Negative': 3,
        'Major Negative %': 2.50,
        'Negative': 30,
        'Negative %': 25.00,
        'Quality Concern': 0,
        'Quality Concern % Age': 0.00,
        'Insuff': 1,
        'Insuff %': 0.83,
        'Neighbor Check': 110,
        'Neighbor Check % Age': 91.67,
        'Online': 108,
        'Online % Age': 90.00
      },
      {
        'Month': currentMonth,
        'FE': 'Jane Smith',
        'Employee ID': 'FE002',
        'Email': 'jane.smith@company.com',
        'Total Case Done': 95,
        'IN TAT': 88,
        'TAT %': 92.63,
        'Major Negative': 2,
        'Major Negative %': 2.11,
        'Negative': 18,
        'Negative %': 18.95,
        'Quality Concern': 1,
        'Quality Concern % Age': 1.05,
        'Insuff': 2,
        'Insuff %': 2.11,
        'Neighbor Check': 85,
        'Neighbor Check % Age': 89.47,
        'Online': 80,
        'Online % Age': 84.21
      },
      {
        'Month': currentMonth,
        'FE': 'Rajesh Kumar',
        'Employee ID': 'FE003',
        'Email': 'rajesh.kumar@company.com',
        'Total Case Done': 150,
        'IN TAT': 145,
        'TAT %': 96.67,
        'Major Negative': 4,
        'Major Negative %': 2.67,
        'Negative': 40,
        'Negative %': 26.67,
        'Quality Concern': 0,
        'Quality Concern % Age': 0.00,
        'Insuff': 0,
        'Insuff %': 0.00,
        'Neighbor Check': 140,
        'Neighbor Check % Age': 93.33,
        'Online': 138,
        'Online % Age': 92.00
      }
    ];

    // Create workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(templateData);
    
    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'KPI Data');
    
    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=kpi-template.xlsx');
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating template',
      error: error.message
    });
  }
});

module.exports = router;
