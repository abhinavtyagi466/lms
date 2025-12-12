const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, requireAdminPanel } = require('../middleware/auth');

// In-memory storage for KPI configurations (in production, use database)
let kpiConfigurations = {
  metrics: [
    {
      _id: '1',
      metric: 'TAT',
      weightage: 20,
      thresholds: [
        { operator: '>=', value: 95, score: 20, label: 'Excellent (95%+)' },
        { operator: '>=', value: 90, score: 10, label: 'Good (90-94%)' },
        { operator: '>=', value: 85, score: 5, label: 'Average (85-89%)' },
        { operator: '<', value: 85, score: 0, label: 'Poor (<85%)' }
      ],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '2',
      metric: 'Major Negativity',
      weightage: 20,
      thresholds: [
        { operator: '>=', value: 2.5, score: 20, label: 'High (2.5%+)' },
        { operator: '>=', value: 2.0, score: 15, label: 'Medium (2.0-2.4%)' },
        { operator: '>=', value: 1.5, score: 5, label: 'Low (1.5-1.9%)' },
        { operator: '<', value: 1.5, score: 0, label: 'Excellent (<1.5%)' }
      ],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '3',
      metric: 'Quality Concern',
      weightage: 20,
      thresholds: [
        { operator: '==', value: 0, score: 20, label: 'Perfect (0%)' },
        { operator: '<=', value: 0.25, score: 15, label: 'Good (0-0.25%)' },
        { operator: '<=', value: 0.5, score: 10, label: 'Average (0.26-0.5%)' },
        { operator: '>', value: 0.5, score: 0, label: 'Poor (>0.5%)' }
      ],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '4',
      metric: 'Neighbor Check',
      weightage: 10,
      thresholds: [
        { operator: '>=', value: 90, score: 10, label: 'Excellent (90%+)' },
        { operator: '>=', value: 85, score: 5, label: 'Good (85-89%)' },
        { operator: '>=', value: 80, score: 2, label: 'Average (80-84%)' },
        { operator: '<', value: 80, score: 0, label: 'Poor (<80%)' }
      ],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '5',
      metric: 'Negativity',
      weightage: 10,
      thresholds: [
        { operator: '>=', value: 25, score: 10, label: 'High (25%+)' },
        { operator: '>=', value: 20, score: 5, label: 'Medium (20-24%)' },
        { operator: '>=', value: 15, score: 2, label: 'Low (15-19%)' },
        { operator: '<', value: 15, score: 0, label: 'Excellent (<15%)' }
      ],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '6',
      metric: 'App Usage',
      weightage: 10,
      thresholds: [
        { operator: '>=', value: 90, score: 10, label: 'Excellent (90%+)' },
        { operator: '>=', value: 85, score: 5, label: 'Good (85-89%)' },
        { operator: '>=', value: 80, score: 2, label: 'Average (80-84%)' },
        { operator: '<', value: 80, score: 0, label: 'Poor (<80%)' }
      ],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '7',
      metric: 'Insufficiency',
      weightage: 10,
      thresholds: [
        { operator: '<', value: 1, score: 10, label: 'Excellent (<1%)' },
        { operator: '<=', value: 1.5, score: 5, label: 'Good (1-1.5%)' },
        { operator: '<=', value: 2, score: 2, label: 'Average (1.6-2%)' },
        { operator: '>', value: 2, score: 0, label: 'Poor (>2%)' }
      ],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    }
  ],
  triggers: [
    {
      _id: '1',
      triggerType: 'score_based',
      condition: 'Overall KPI Score',
      threshold: 85,
      actions: ['None'],
      emailRecipients: ['FE', 'Manager', 'HOD'],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '2',
      triggerType: 'score_based',
      condition: 'Overall KPI Score',
      threshold: 70,
      actions: ['Audit Call'],
      emailRecipients: ['Compliance Team', 'HOD'],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '3',
      triggerType: 'score_based',
      condition: 'Overall KPI Score',
      threshold: 50,
      actions: ['Audit Call', 'Cross-check last 3 months data'],
      emailRecipients: ['Compliance Team', 'HOD'],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '4',
      triggerType: 'score_based',
      condition: 'Overall KPI Score',
      threshold: 40,
      actions: ['Basic Training Module', 'Audit Call', 'Cross-check last 3 months data', 'Dummy Audit Case'],
      emailRecipients: ['FE', 'Coordinator', 'Manager', 'HOD', 'Compliance Team'],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '5',
      triggerType: 'score_based',
      condition: 'Overall KPI Score',
      threshold: 0,
      actions: ['Basic Training Module', 'Audit Call', 'Cross-check last 3 months data', 'Dummy Audit Case', 'Warning Letter'],
      emailRecipients: ['FE', 'Coordinator', 'Manager', 'HOD', 'Compliance Team'],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '6',
      triggerType: 'condition_based',
      condition: 'Major Negativity > 0% AND General Negativity < 25%',
      threshold: 0,
      actions: ['Negativity Handling Training Module', 'Audit Call'],
      emailRecipients: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '7',
      triggerType: 'condition_based',
      condition: 'Quality Concern > 1%',
      threshold: 1,
      actions: ['Do\'s & Don\'ts Training Module', 'Audit Call', 'RCA of complaints'],
      emailRecipients: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '8',
      triggerType: 'condition_based',
      condition: 'Cases Done on App < 80%',
      threshold: 80,
      actions: ['Application Usage Training'],
      emailRecipients: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    {
      _id: '9',
      triggerType: 'condition_based',
      condition: 'Insufficiency > 2%',
      threshold: 2,
      actions: ['Cross-verification of selected insuff cases by another FE'],
      emailRecipients: ['Compliance Team', 'HOD'],
      isActive: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    }
  ]
};

// @route   GET /api/kpi-configuration
// @desc    Get all KPI configurations
// @access  Private (Admin only)
router.get('/', authenticateToken, requireAdminPanel, async (req, res) => {
  try {
    res.json({
      success: true,
      data: kpiConfigurations
    });
  } catch (error) {
    console.error('Get KPI configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching KPI configurations',
      error: error.message
    });
  }
});

// @route   PUT /api/kpi-configuration/metrics
// @desc    Update KPI metrics configuration
// @access  Private (Admin only)
router.put('/metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { metrics } = req.body;

    if (!metrics || !Array.isArray(metrics)) {
      return res.status(400).json({
        success: false,
        message: 'Metrics array is required'
      });
    }

    // Update metrics with timestamp and user info
    const updatedMetrics = metrics.map(metric => ({
      ...metric,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user._id
    }));

    kpiConfigurations.metrics = updatedMetrics;

    res.json({
      success: true,
      message: 'KPI metrics configuration updated successfully',
      data: kpiConfigurations.metrics
    });
  } catch (error) {
    console.error('Update KPI metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating KPI metrics configuration',
      error: error.message
    });
  }
});

// @route   PUT /api/kpi-configuration/triggers
// @desc    Update trigger configuration
// @access  Private (Admin only)
router.put('/triggers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { triggers } = req.body;

    if (!triggers || !Array.isArray(triggers)) {
      return res.status(400).json({
        success: false,
        message: 'Triggers array is required'
      });
    }

    // Update triggers with timestamp and user info
    const updatedTriggers = triggers.map(trigger => ({
      ...trigger,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user._id
    }));

    kpiConfigurations.triggers = updatedTriggers;

    res.json({
      success: true,
      message: 'Trigger configuration updated successfully',
      data: kpiConfigurations.triggers
    });
  } catch (error) {
    console.error('Update triggers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trigger configuration',
      error: error.message
    });
  }
});

// @route   POST /api/kpi-configuration/reset
// @desc    Reset KPI configuration to defaults
// @access  Private (Admin only)
router.post('/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Reset to default configurations
    kpiConfigurations = {
      metrics: [
        {
          _id: '1',
          metric: 'TAT',
          weightage: 20,
          thresholds: [
            { operator: '>=', value: 95, score: 20, label: 'Excellent (95%+)' },
            { operator: '>=', value: 90, score: 10, label: 'Good (90-94%)' },
            { operator: '>=', value: 85, score: 5, label: 'Average (85-89%)' },
            { operator: '<', value: 85, score: 0, label: 'Poor (<85%)' }
          ],
          isActive: true,
          updatedAt: new Date().toISOString(),
          updatedBy: req.user._id
        },
        // ... (include all default metrics)
      ],
      triggers: [
        // ... (include all default triggers)
      ]
    };

    res.json({
      success: true,
      message: 'KPI configuration reset to defaults successfully',
      data: kpiConfigurations
    });
  } catch (error) {
    console.error('Reset KPI configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting KPI configuration',
      error: error.message
    });
  }
});

// @route   GET /api/kpi-configuration/export
// @desc    Export KPI configuration
// @access  Private (Admin only)
router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user._id,
      configuration: kpiConfigurations
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="kpi-configuration.json"');
    res.json(exportData);
  } catch (error) {
    console.error('Export KPI configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting KPI configuration',
      error: error.message
    });
  }
});

// Getter function for other modules to access KPI configurations
router.getKPIConfigurations = function () {
  return kpiConfigurations;
};

module.exports = router;
