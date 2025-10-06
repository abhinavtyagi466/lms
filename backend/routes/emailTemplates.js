const express = require('express');
const router = express.Router();
const EmailTemplateService = require('../services/emailTemplateService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all email templates
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const templates = await EmailTemplateService.getAllTemplates();
    
    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email templates',
      error: error.message
    });
  }
});

// Get template by ID
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const template = await EmailTemplateService.getTemplateById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message
    });
  }
});

// Create new template
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user._id
    };

    const template = await EmailTemplateService.createTemplate(templateData);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Template with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
});

// Update template
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updates = {
      ...req.body,
      updatedBy: req.user._id
    };

    const template = await EmailTemplateService.updateTemplate(req.params.id, updates);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
});

// Delete template
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const template = await EmailTemplateService.deleteTemplate(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
      data: template
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  }
});

// Preview template with sample data
router.post('/:id/preview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sampleData } = req.body;

    const preview = await EmailTemplateService.previewTemplate(req.params.id, sampleData || {
      userName: 'John Doe',
      employeeId: 'EMP001',
      email: 'john.doe@example.com',
      kpiScore: '75.50',
      rating: 'Excellent',
      period: 'Oct-2025',
      tatPercentage: '92.50',
      majorNegPercentage: '2.30',
      qualityPercentage: '0.45',
      neighborCheckPercentage: '88.00',
      generalNegPercentage: '18.00',
      onlinePercentage: '85.00',
      insuffPercentage: '1.20',
      trainingType: 'Basic Training Module',
      trainingReason: 'Performance improvement required',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      trainingDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      priority: 'High',
      auditType: 'Audit Call + Cross-check',
      auditScope: 'Last 3 months performance review',
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      preAuditDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      auditDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      performanceConcerns: 'Low TAT, Quality issues, Insufficiency rate above target',
      improvementAreas: 'TAT Management, Quality Control, Documentation'
    });

    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview template',
      error: error.message
    });
  }
});

// Send test email
router.post('/:id/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { testEmail, sampleData } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }

    const template = await EmailTemplateService.getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const result = await EmailTemplateService.sendEmail({
      templateType: template.type,
      variables: sampleData || {
        userName: 'Test User',
        employeeId: 'TEST001',
        email: testEmail,
        kpiScore: '75.50',
        rating: 'Excellent',
        period: 'Oct-2025',
        tatPercentage: '92.50',
        majorNegPercentage: '2.30',
        qualityPercentage: '0.45',
        neighborCheckPercentage: '88.00',
        generalNegPercentage: '18.00',
        onlinePercentage: '85.00',
        insuffPercentage: '1.20'
      },
      recipients: [{ email: testEmail, role: 'Test' }],
      userId: req.user._id,
      sentBy: req.user._id,
      createNotification: false
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// Get template statistics
router.get('/stats/usage', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const EmailTemplate = require('../models/EmailTemplate');
    
    const stats = await EmailTemplate.aggregate([
      {
        $group: {
          _id: '$category',
          totalTemplates: { $sum: 1 },
          activeTemplates: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          totalUsage: { $sum: '$usageCount' }
        }
      },
      {
        $sort: { totalUsage: -1 }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching template stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template statistics',
      error: error.message
    });
  }
});

// NEW: Update Email Template Endpoint (ADDED WITHOUT TOUCHING EXISTING)
// @route   PUT /api/email-templates/:id
// @desc    Update an existing email template
// @access  Private (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate required fields
    if (!updateData.name || !updateData.subject || !updateData.content) {
      return res.status(400).json({
        success: false,
        message: 'Name, subject, and content are required'
      });
    }

    // Update template using service
    const updatedTemplate = await EmailTemplateService.updateTemplate(id, updateData);
    
    if (!updatedTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
});

module.exports = router;

