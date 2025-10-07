const express = require('express');
const router = express.Router();
const RecipientGroupService = require('../services/recipientGroupService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all recipient groups
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    const groups = await RecipientGroupService.getAllGroups({ search });
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedGroups = groups.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedGroups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: groups.length,
        pages: Math.ceil(groups.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recipient groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipient groups',
      error: error.message
    });
  }
});

// Get recipient group by ID
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const group = await RecipientGroupService.getGroupById(req.params.id);
    
    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error fetching recipient group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipient group',
      error: error.message
    });
  }
});

// Create new recipient group
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const group = await RecipientGroupService.createGroup(req.body, req.user._id);
    
    res.status(201).json({
      success: true,
      message: 'Recipient group created successfully',
      data: group
    });
  } catch (error) {
    console.error('Error creating recipient group:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Recipient group with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create recipient group',
      error: error.message
    });
  }
});

// Update recipient group
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const group = await RecipientGroupService.updateGroup(req.params.id, req.body, req.user._id);
    
    res.json({
      success: true,
      message: 'Recipient group updated successfully',
      data: group
    });
  } catch (error) {
    console.error('Error updating recipient group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recipient group',
      error: error.message
    });
  }
});

// Delete recipient group
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const group = await RecipientGroupService.deleteGroup(req.params.id);
    
    res.json({
      success: true,
      message: 'Recipient group deleted successfully',
      data: group
    });
  } catch (error) {
    console.error('Error deleting recipient group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipient group',
      error: error.message
    });
  }
});

// Add recipient to group
router.post('/:id/recipients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const group = await RecipientGroupService.addRecipient(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Recipient added successfully',
      data: group
    });
  } catch (error) {
    console.error('Error adding recipient to group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add recipient to group',
      error: error.message
    });
  }
});

// Remove recipient from group
router.delete('/:id/recipients/:email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const group = await RecipientGroupService.removeRecipient(req.params.id, req.params.email);
    
    res.json({
      success: true,
      message: 'Recipient removed successfully',
      data: group
    });
  } catch (error) {
    console.error('Error removing recipient from group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove recipient from group',
      error: error.message
    });
  }
});

// Get group recipients
router.get('/:id/recipients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const recipients = await RecipientGroupService.getGroupRecipients(req.params.id);
    
    res.json({
      success: true,
      data: recipients
    });
  } catch (error) {
    console.error('Error getting group recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group recipients',
      error: error.message
    });
  }
});

// Auto-populate group based on criteria
router.post('/:id/auto-populate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const group = await RecipientGroupService.autoPopulateGroup(req.params.id);
    
    res.json({
      success: true,
      message: 'Group auto-populated successfully',
      data: group
    });
  } catch (error) {
    console.error('Error auto-populating group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-populate group',
      error: error.message
    });
  }
});

// Get group statistics
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await RecipientGroupService.getGroupStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting group stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group statistics',
      error: error.message
    });
  }
});

module.exports = router;
