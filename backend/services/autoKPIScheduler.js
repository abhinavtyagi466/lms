const cron = require('node-cron');
const RealActivityKPIService = require('./realActivityKPIService');
const KPITriggerService = require('./kpiTriggerService');
const UserProgress = require('../models/UserProgress');
const UserModule = require('../models/UserModule');
const QuizAttempt = require('../models/QuizAttempt');
const KPIScore = require('../models/KPIScore');

class AutoKPIScheduler {
  constructor() {
    this.isRunning = false;
    this.scheduledJobs = new Map();
  }

  /**
   * Start the auto KPI scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('Auto KPI Scheduler is already running');
      return;
    }

    console.log('Starting Auto KPI Scheduler...');
    this.isRunning = true;

    // Schedule daily KPI generation at 2 AM
    this.scheduleDailyKPIGeneration();

    // Schedule real-time KPI updates (every 30 minutes)
    this.scheduleRealTimeKPIUpdates();

    // Schedule monthly KPI generation (1st of every month at 3 AM)
    this.scheduleMonthlyKPIGeneration();

    console.log('Auto KPI Scheduler started successfully');
  }

  /**
   * Stop the auto KPI scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('Auto KPI Scheduler is not running');
      return;
    }

    console.log('Stopping Auto KPI Scheduler...');
    
    // Stop all scheduled jobs
    this.scheduledJobs.forEach((job, name) => {
      job.destroy();
      console.log(`Stopped job: ${name}`);
    });
    
    this.scheduledJobs.clear();
    this.isRunning = false;
    
    console.log('Auto KPI Scheduler stopped successfully');
  }

  /**
   * Schedule daily KPI generation
   */
  scheduleDailyKPIGeneration() {
    const job = cron.schedule('0 2 * * *', async () => {
      console.log('Running daily KPI generation...');
      try {
        await this.generateDailyKPIs();
        console.log('Daily KPI generation completed successfully');
      } catch (error) {
        console.error('Error in daily KPI generation:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.scheduledJobs.set('dailyKPI', job);
    console.log('Daily KPI generation scheduled for 2:00 AM IST');
  }

  /**
   * Schedule real-time KPI updates
   */
  scheduleRealTimeKPIUpdates() {
    const job = cron.schedule('*/30 * * * *', async () => {
      console.log('Running real-time KPI updates...');
      try {
        await this.updateRealTimeKPIs();
        console.log('Real-time KPI updates completed successfully');
      } catch (error) {
        console.error('Error in real-time KPI updates:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.scheduledJobs.set('realTimeKPI', job);
    console.log('Real-time KPI updates scheduled every 30 minutes');
  }

  /**
   * Schedule monthly KPI generation
   */
  scheduleMonthlyKPIGeneration() {
    const job = cron.schedule('0 3 1 * *', async () => {
      console.log('Running monthly KPI generation...');
      try {
        await this.generateMonthlyKPIs();
        console.log('Monthly KPI generation completed successfully');
      } catch (error) {
        console.error('Error in monthly KPI generation:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.scheduledJobs.set('monthlyKPI', job);
    console.log('Monthly KPI generation scheduled for 1st of every month at 3:00 AM IST');
  }

  /**
   * Generate daily KPIs for all active users
   */
  async generateDailyKPIs() {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      console.log(`Generating daily KPIs for period: ${currentPeriod}`);
      
      const results = await RealActivityKPIService.generateAllUsersKPI(currentPeriod);
      
      // Process automation triggers for newly created/updated KPIs
      await this.processAutomationTriggers(results);
      
      console.log(`Daily KPI generation completed: ${results.filter(r => r.success).length} successful, ${results.filter(r => !r.success).length} failed`);
      
      return results;
      
    } catch (error) {
      console.error('Error in generateDailyKPIs:', error);
      throw error;
    }
  }

  /**
   * Update real-time KPIs for users with recent activity
   */
  async updateRealTimeKPIs() {
    try {
      console.log('Updating real-time KPIs for users with recent activity...');
      
      // Find users with activity in the last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const [recentProgress, recentModules, recentQuizAttempts] = await Promise.all([
        UserProgress.find({
          lastAccessedAt: { $gte: thirtyMinutesAgo }
        }).distinct('userId'),
        
        UserModule.find({
          updatedAt: { $gte: thirtyMinutesAgo }
        }).distinct('userId'),
        
        QuizAttempt.find({
          startTime: { $gte: thirtyMinutesAgo }
        }).distinct('userId')
      ]);
      
      // Get unique user IDs with recent activity
      const activeUserIds = [...new Set([...recentProgress, ...recentModules, ...recentQuizAttempts])];
      
      console.log(`Found ${activeUserIds.length} users with recent activity`);
      
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const results = [];
      
      for (const userId of activeUserIds) {
        try {
          const result = await RealActivityKPIService.autoGenerateUserKPI(userId, 'real_time_update');
          results.push({ userId, success: true, result });
          
          // Process automation triggers for this user
          const kpiScore = await KPIScore.findOne({ 
            userId, 
            period: currentPeriod, 
            isActive: true 
          });
          
          if (kpiScore && kpiScore.automationStatus === 'pending') {
            await KPITriggerService.processKPITriggers(kpiScore);
          }
          
        } catch (error) {
          console.error(`Error updating real-time KPI for user ${userId}:`, error);
          results.push({ userId, success: false, error: error.message });
        }
      }
      
      console.log(`Real-time KPI updates completed: ${results.filter(r => r.success).length} successful, ${results.filter(r => !r.success).length} failed`);
      
      return results;
      
    } catch (error) {
      console.error('Error in updateRealTimeKPIs:', error);
      throw error;
    }
  }

  /**
   * Generate monthly KPIs
   */
  async generateMonthlyKPIs() {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      console.log(`Generating monthly KPIs for period: ${currentPeriod}`);
      
      const results = await RealActivityKPIService.generateAllUsersKPI(currentPeriod);
      
      // Process automation triggers for all KPIs
      await this.processAutomationTriggers(results);
      
      console.log(`Monthly KPI generation completed: ${results.filter(r => r.success).length} successful, ${results.filter(r => !r.success).length} failed`);
      
      return results;
      
    } catch (error) {
      console.error('Error in generateMonthlyKPIs:', error);
      throw error;
    }
  }

  /**
   * Process automation triggers for KPI results
   */
  async processAutomationTriggers(results) {
    try {
      console.log('Processing automation triggers for KPI results...');
      
      const currentPeriod = new Date().toISOString().slice(0, 7);
      let processedCount = 0;
      
      for (const result of results) {
        if (result.success) {
          try {
            // Find the KPI score for this user
            const kpiScore = await KPIScore.findOne({
              userId: result.userId,
              period: currentPeriod,
              isActive: true
            });
            
            if (kpiScore && kpiScore.automationStatus === 'pending') {
              await KPITriggerService.processKPITriggers(kpiScore);
              processedCount++;
            }
            
          } catch (error) {
            console.error(`Error processing automation triggers for user ${result.userId}:`, error);
          }
        }
      }
      
      console.log(`Automation triggers processed for ${processedCount} users`);
      
    } catch (error) {
      console.error('Error in processAutomationTriggers:', error);
      throw error;
    }
  }

  /**
   * Manually trigger KPI generation for a specific user
   */
  async triggerUserKPI(userId, activityType = 'manual_trigger') {
    try {
      console.log(`Manually triggering KPI generation for user ${userId}`);
      
      const result = await RealActivityKPIService.autoGenerateUserKPI(userId, activityType);
      
      // Process automation triggers
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const kpiScore = await KPIScore.findOne({
        userId,
        period: currentPeriod,
        isActive: true
      });
      
      if (kpiScore && kpiScore.automationStatus === 'pending') {
        await KPITriggerService.processKPITriggers(kpiScore);
      }
      
      console.log(`Manual KPI trigger completed for user ${userId}`);
      
      return result;
      
    } catch (error) {
      console.error(`Error in triggerUserKPI for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      jobCount: this.scheduledJobs.size
    };
  }

  /**
   * Get scheduler statistics
   */
  async getStatistics() {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      
      const [totalKPIs, pendingKPIs, completedKPIs, failedKPIs] = await Promise.all([
        KPIScore.countDocuments({ period: currentPeriod, isActive: true }),
        KPIScore.countDocuments({ period: currentPeriod, isActive: true, automationStatus: 'pending' }),
        KPIScore.countDocuments({ period: currentPeriod, isActive: true, automationStatus: 'completed' }),
        KPIScore.countDocuments({ period: currentPeriod, isActive: true, automationStatus: 'failed' })
      ]);
      
      return {
        currentPeriod,
        totalKPIs,
        pendingKPIs,
        completedKPIs,
        failedKPIs,
        schedulerStatus: this.getStatus()
      };
      
    } catch (error) {
      console.error('Error getting scheduler statistics:', error);
      throw error;
    }
  }
}

// Create singleton instance
const autoKPIScheduler = new AutoKPIScheduler();

module.exports = autoKPIScheduler;
