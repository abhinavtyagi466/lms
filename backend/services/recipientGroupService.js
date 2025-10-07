const RecipientGroup = require('../models/RecipientGroup');
const User = require('../models/User');

class RecipientGroupService {
  /**
   * Get all recipient groups
   */
  static async getAllGroups(filters = {}) {
    try {
      const query = { isActive: true };
      
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }
      
      const groups = await RecipientGroup.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 });
      
      return groups;
    } catch (error) {
      console.error('Error fetching recipient groups:', error);
      throw error;
    }
  }

  /**
   * Get recipient group by ID
   */
  static async getGroupById(groupId) {
    try {
      const group = await RecipientGroup.findById(groupId)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
      
      if (!group) {
        throw new Error('Recipient group not found');
      }
      
      return group;
    } catch (error) {
      console.error('Error fetching recipient group:', error);
      throw error;
    }
  }

  /**
   * Create new recipient group
   */
  static async createGroup(groupData, createdBy) {
    try {
      const group = new RecipientGroup({
        ...groupData,
        createdBy
      });
      
      await group.save();
      await group.populate('createdBy', 'name email');
      
      return group;
    } catch (error) {
      console.error('Error creating recipient group:', error);
      throw error;
    }
  }

  /**
   * Update recipient group
   */
  static async updateGroup(groupId, updateData, updatedBy) {
    try {
      const group = await RecipientGroup.findByIdAndUpdate(
        groupId,
        { ...updateData, updatedBy },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email')
       .populate('updatedBy', 'name email');
      
      if (!group) {
        throw new Error('Recipient group not found');
      }
      
      return group;
    } catch (error) {
      console.error('Error updating recipient group:', error);
      throw error;
    }
  }

  /**
   * Delete recipient group (soft delete)
   */
  static async deleteGroup(groupId) {
    try {
      const group = await RecipientGroup.findByIdAndUpdate(
        groupId,
        { isActive: false },
        { new: true }
      );
      
      if (!group) {
        throw new Error('Recipient group not found');
      }
      
      return group;
    } catch (error) {
      console.error('Error deleting recipient group:', error);
      throw error;
    }
  }

  /**
   * Add recipient to group
   */
  static async addRecipient(groupId, recipientData) {
    try {
      const group = await RecipientGroup.findById(groupId);
      
      if (!group) {
        throw new Error('Recipient group not found');
      }
      
      await group.addRecipient(recipientData);
      await group.populate('createdBy', 'name email');
      
      return group;
    } catch (error) {
      console.error('Error adding recipient to group:', error);
      throw error;
    }
  }

  /**
   * Remove recipient from group
   */
  static async removeRecipient(groupId, email) {
    try {
      const group = await RecipientGroup.findById(groupId);
      
      if (!group) {
        throw new Error('Recipient group not found');
      }
      
      await group.removeRecipient(email);
      await group.populate('createdBy', 'name email');
      
      return group;
    } catch (error) {
      console.error('Error removing recipient from group:', error);
      throw error;
    }
  }

  /**
   * Get recipients from group
   */
  static async getGroupRecipients(groupId) {
    try {
      const group = await RecipientGroup.findById(groupId);
      
      if (!group) {
        throw new Error('Recipient group not found');
      }
      
      return group.getActiveRecipients();
    } catch (error) {
      console.error('Error getting group recipients:', error);
      throw error;
    }
  }

  /**
   * Auto-populate group based on criteria
   */
  static async autoPopulateGroup(groupId) {
    try {
      const group = await RecipientGroup.findById(groupId);
      
      if (!group) {
        throw new Error('Recipient group not found');
      }
      
      if (!group.criteria) {
        return group;
      }
      
      // Build user query based on criteria
      const userQuery = { isActive: true };
      
      if (group.criteria.userTypes && group.criteria.userTypes.length > 0) {
        userQuery.userType = { $in: group.criteria.userTypes };
      }
      
      if (group.criteria.departments && group.criteria.departments.length > 0) {
        userQuery.department = { $in: group.criteria.departments };
      }
      
      if (group.criteria.roles && group.criteria.roles.length > 0) {
        userQuery.role = { $in: group.criteria.roles };
      }
      
      // Get users matching criteria
      const users = await User.find(userQuery).select('name email userType department role');
      
      // Clear existing recipients and add new ones
      group.recipients = users.map(user => ({
        email: user.email,
        name: user.name,
        role: user.role || 'other',
        department: user.department,
        isActive: true
      }));
      
      await group.save();
      await group.populate('createdBy', 'name email');
      
      return group;
    } catch (error) {
      console.error('Error auto-populating group:', error);
      throw error;
    }
  }

  /**
   * Get group statistics
   */
  static async getGroupStats() {
    try {
      const stats = await RecipientGroup.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: null,
            totalGroups: { $sum: 1 },
            totalRecipients: { $sum: { $size: '$recipients' } },
            activeRecipients: {
              $sum: {
                $size: {
                  $filter: {
                    input: '$recipients',
                    cond: { $eq: ['$$this.isActive', true] }
                  }
                }
              }
            },
            averageRecipientsPerGroup: { $avg: { $size: '$recipients' } }
          }
        }
      ]);
      
      const usageStats = await RecipientGroup.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: null,
            totalUsage: { $sum: '$usageCount' },
            mostUsedGroup: { $max: '$usageCount' }
          }
        }
      ]);
      
      return {
        ...stats[0] || { totalGroups: 0, totalRecipients: 0, activeRecipients: 0, averageRecipientsPerGroup: 0 },
        ...usageStats[0] || { totalUsage: 0, mostUsedGroup: 0 }
      };
    } catch (error) {
      console.error('Error getting group stats:', error);
      throw error;
    }
  }

  /**
   * Increment usage count
   */
  static async incrementUsage(groupId) {
    try {
      await RecipientGroup.findByIdAndUpdate(
        groupId,
        { $inc: { usageCount: 1 } }
      );
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      throw error;
    }
  }
}

module.exports = RecipientGroupService;
