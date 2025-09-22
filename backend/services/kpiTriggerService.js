const TrainingAssignment = require('../models/TrainingAssignment');
const EmailLog = require('../models/EmailLog');
const AuditSchedule = require('../models/AuditSchedule');
const KPIScore = require('../models/KPIScore');
const User = require('../models/User');
const emailService = require('./emailService');
const LifecycleService = require('./lifecycleService');

class KPITriggerService {
  /**
   * Main method to process all KPI triggers and automation
   * @param {Object} kpiScore - The KPI score document
   * @returns {Object} - Processing results
   */
  static async processKPITriggers(kpiScore) {
    const startTime = Date.now();
    const results = {
      success: false,
      trainingAssignments: [],
      auditSchedules: [],
      emailLogs: [],
      lifecycleEvents: [],
      errors: [],
      processingTime: 0
    };

    try {
      console.log(`Starting KPI trigger processing for user ${kpiScore.userId}, score: ${kpiScore.overallScore}%`);

      // Mark KPI as processing
      await kpiScore.markAsProcessing();

      // Get user details
      const user = await User.findById(kpiScore.userId);
      if (!user) {
        throw new Error(`User not found: ${kpiScore.userId}`);
      }

      // Calculate all triggers based on KPI score and individual metrics
      const triggers = this.calculateTriggers(kpiScore);
      console.log('Calculated triggers:', triggers);

      // Process training assignments
      if (triggers.trainings.length > 0) {
        results.trainingAssignments = await this.createTrainingAssignments(kpiScore, triggers.trainings);
        console.log(`Created ${results.trainingAssignments.length} training assignments`);
      }

      // Schedule audits
      if (triggers.audits.length > 0) {
        results.auditSchedules = await this.scheduleAudits(kpiScore, triggers.audits);
        console.log(`Scheduled ${results.auditSchedules.length} audits`);
      }

      // Send automated emails
      if (triggers.emails.length > 0) {
        results.emailLogs = await this.sendAutomatedEmails(kpiScore, triggers.emails, user);
        console.log(`Sent ${results.emailLogs.length} emails`);
      }

      // Update user status
      await this.updateUserStatus(kpiScore.userId, kpiScore);

      // Create lifecycle events
      if (triggers.lifecycleEvents.length > 0) {
        results.lifecycleEvents = await this.createLifecycleEvents(kpiScore.userId, triggers.lifecycleEvents);
        console.log(`Created ${results.lifecycleEvents.length} lifecycle events`);
      }

      // Mark KPI as completed
      await kpiScore.markAsCompleted();

      results.success = true;
      results.processingTime = Date.now() - startTime;

      console.log(`KPI trigger processing completed successfully in ${results.processingTime}ms`);

    } catch (error) {
      console.error('Error in KPI trigger processing:', error);
      results.errors.push({
        type: 'processing_error',
        message: error.message,
        timestamp: new Date()
      });

      // Mark KPI as failed
      await kpiScore.markAsFailed();

      results.processingTime = Date.now() - startTime;
    }

    return results;
  }

  /**
   * Calculate all triggers based on KPI score and individual metrics
   * @param {Object} kpiScore - The KPI score document
   * @returns {Object} - All calculated triggers
   */
  static calculateTriggers(kpiScore) {
    const triggers = {
      trainings: [],
      audits: [],
      emails: [],
      lifecycleEvents: []
    };

    const { overallScore, rating } = kpiScore;
    const { tat, majorNegativity, quality, neighborCheck, negativity, appUsage, insufficiency } = kpiScore;

    // Training assignment logic
    if (overallScore < 55 || overallScore < 40) {
      triggers.trainings.push({
        type: 'basic',
        reason: `Overall KPI score ${overallScore}% is below threshold`,
        priority: overallScore < 40 ? 'high' : 'medium'
      });
    }

    if (majorNegativity.percentage > 0 && negativity.percentage < 25) {
      triggers.trainings.push({
        type: 'negativity_handling',
        reason: `Major negativity ${majorNegativity.percentage}% detected with low general negativity ${negativity.percentage}%`,
        priority: 'medium'
      });
    }

    if (quality.percentage > 1) {
      triggers.trainings.push({
        type: 'dos_donts',
        reason: `Quality concerns ${quality.percentage}% above threshold`,
        priority: 'high'
      });
    }

    if (appUsage.percentage < 80) {
      triggers.trainings.push({
        type: 'app_usage',
        reason: `App usage ${appUsage.percentage}% below target`,
        priority: 'medium'
      });
    }

    // Audit scheduling logic
    if (overallScore < 70) {
      triggers.audits.push({
        type: 'audit_call',
        reason: `Overall KPI score ${overallScore}% below 70% threshold`,
        priority: overallScore < 50 ? 'high' : 'medium'
      });

      triggers.audits.push({
        type: 'cross_check',
        reason: `Cross-check last 3 months data required for score ${overallScore}%`,
        priority: 'medium'
      });
    }

    if (overallScore < 50) {
      triggers.audits.push({
        type: 'dummy_audit',
        reason: `Dummy audit case required for score ${overallScore}% below 50%`,
        priority: 'high'
      });
    }

    if (insufficiency.percentage > 2) {
      triggers.audits.push({
        type: 'cross_verify_insuff',
        reason: `Insufficiency rate ${insufficiency.percentage}% above 2% threshold`,
        priority: 'high'
      });
    }

    // Email notification logic
    if (triggers.trainings.length > 0) {
      triggers.emails.push({
        type: 'training',
        recipients: ['fe', 'coordinator', 'manager', 'hod'],
        data: {
          trainingCount: triggers.trainings.length,
          trainingTypes: triggers.trainings.map(t => t.type)
        }
      });
    }

    if (triggers.audits.length > 0) {
      triggers.emails.push({
        type: 'audit',
        recipients: ['compliance', 'hod'],
        data: {
          auditCount: triggers.audits.length,
          auditTypes: triggers.audits.map(a => a.type)
        }
      });
    }

    if (overallScore < 40) {
      triggers.emails.push({
        type: 'warning',
        recipients: ['fe', 'coordinator', 'manager', 'compliance', 'hod'],
        data: {
          kpiScore: overallScore,
          rating: rating,
          improvementAreas: this.getImprovementAreas(kpiScore)
        }
      });
    }

    // Always send KPI score notification
    triggers.emails.push({
      type: 'kpi_score',
      recipients: ['fe', 'coordinator', 'manager'],
      data: {
        kpiScore: overallScore,
        rating: rating,
        period: kpiScore.period,
        scores: { tat, majorNegativity, quality, neighborCheck, negativity, appUsage, insufficiency },
        actions: [...triggers.trainings.map(t => t.reason), ...triggers.audits.map(a => a.reason)]
      }
    });

    // Lifecycle events
    if (overallScore < 50) {
      triggers.lifecycleEvents.push({
        type: 'audit',
        title: 'KPI Audit Triggered',
        description: `Audit triggered due to low KPI score: ${overallScore}%`,
        category: 'negative'
      });
    }

    if (overallScore < 40) {
      triggers.lifecycleEvents.push({
        type: 'warning',
        title: 'Performance Warning Issued',
        description: `Warning issued due to KPI score: ${overallScore}%`,
        category: 'negative'
      });
    }

    if (triggers.trainings.length > 0) {
      triggers.lifecycleEvents.push({
        type: 'training',
        title: 'Training Assignments Created',
        description: `${triggers.trainings.length} training(s) assigned based on KPI performance`,
        category: 'neutral'
      });
    }

    return triggers;
  }

  /**
   * Create training assignments based on triggers
   * @param {Object} kpiScore - The KPI score document
   * @param {Array} trainingTriggers - Array of training triggers
   * @returns {Array} - Created training assignments
   */
  static async createTrainingAssignments(kpiScore, trainingTriggers) {
    const assignments = [];

    for (const trigger of trainingTriggers) {
      try {
        // Calculate due date (7 days from now for high priority, 14 days for others)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (trigger.priority === 'high' ? 7 : 14));

        const assignment = new TrainingAssignment({
          userId: kpiScore.userId,
          trainingType: trigger.type,
          assignedBy: 'kpi_trigger',
          dueDate: dueDate,
          kpiTriggerId: kpiScore._id,
          notes: trigger.reason
        });

        await assignment.save();

        // Add to KPI score
        await kpiScore.addTrainingAssignment(assignment._id);

        assignments.push(assignment);

        console.log(`Created training assignment: ${trigger.type} for user ${kpiScore.userId}`);

      } catch (error) {
        console.error(`Error creating training assignment ${trigger.type}:`, error);
        throw error;
      }
    }

    return assignments;
  }

  /**
   * Schedule audits based on triggers
   * @param {Object} kpiScore - The KPI score document
   * @param {Array} auditTriggers - Array of audit triggers
   * @returns {Array} - Created audit schedules
   */
  static async scheduleAudits(kpiScore, auditTriggers) {
    const schedules = [];

    for (const trigger of auditTriggers) {
      try {
        // Calculate scheduled date (3 days from now for high priority, 7 days for others)
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + (trigger.priority === 'high' ? 3 : 7));

        const schedule = new AuditSchedule({
          userId: kpiScore.userId,
          auditType: trigger.type,
          scheduledDate: scheduledDate,
          kpiTriggerId: kpiScore._id,
          priority: trigger.priority,
          auditScope: trigger.reason,
          auditMethod: this.getAuditMethod(trigger.type)
        });

        await schedule.save();

        // Add to KPI score
        await kpiScore.addAuditSchedule(schedule._id);

        schedules.push(schedule);

        console.log(`Scheduled audit: ${trigger.type} for user ${kpiScore.userId}`);

      } catch (error) {
        console.error(`Error scheduling audit ${trigger.type}:`, error);
        throw error;
      }
    }

    return schedules;
  }

  /**
   * Send automated emails based on triggers
   * @param {Object} kpiScore - The KPI score document
   * @param {Array} emailTriggers - Array of email triggers
   * @param {Object} user - User document
   * @returns {Array} - Created email logs
   */
  static async sendAutomatedEmails(kpiScore, emailTriggers, user) {
    const emailLogs = [];

    for (const trigger of emailTriggers) {
      try {
        // Get recipients based on roles
        const recipients = await this.getRecipientsByRoles(trigger.recipients, kpiScore.userId);

        for (const recipient of recipients) {
          try {
            // Send email using existing email service
            let emailResult;
            const emailData = {
              userName: user.name,
              employeeId: user.employeeId,
              period: kpiScore.period,
              ...trigger.data
            };

            switch (trigger.type) {
              case 'training':
                emailResult = await emailService.sendTrainingNotification(kpiScore.userId, emailData);
                break;
              case 'audit':
                emailResult = await emailService.sendAuditNotification(kpiScore.userId, emailData);
                break;
              case 'warning':
                emailResult = await emailService.sendWarningNotification(kpiScore.userId, emailData);
                break;
              case 'kpi_score':
                emailResult = await emailService.sendKPIScoreNotification(kpiScore.userId, emailData);
                break;
              default:
                throw new Error(`Unknown email type: ${trigger.type}`);
            }

            // Log successful email
            const emailLog = new EmailLog({
              recipientEmail: recipient.email,
              recipientRole: recipient.role,
              templateType: trigger.type,
              subject: this.getEmailSubject(trigger.type, emailData),
              status: 'sent',
              kpiTriggerId: kpiScore._id,
              userId: kpiScore.userId,
              sentAt: new Date()
            });

            await emailLog.save();

            // Add to KPI score
            await kpiScore.addEmailLog(emailLog._id);

            emailLogs.push(emailLog);

            console.log(`Sent ${trigger.type} email to ${recipient.email}`);

          } catch (emailError) {
            console.error(`Error sending email to ${recipient.email}:`, emailError);

            // Log failed email
            const emailLog = new EmailLog({
              recipientEmail: recipient.email,
              recipientRole: recipient.role,
              templateType: trigger.type,
              subject: this.getEmailSubject(trigger.type, trigger.data),
              status: 'failed',
              kpiTriggerId: kpiScore._id,
              userId: kpiScore.userId,
              errorMessage: emailError.message,
              sentAt: new Date()
            });

            await emailLog.save();
            emailLogs.push(emailLog);
          }
        }

      } catch (error) {
        console.error(`Error processing email trigger ${trigger.type}:`, error);
        throw error;
      }
    }

    return emailLogs;
  }

  /**
   * Update user status based on KPI score
   * @param {String} userId - User ID
   * @param {Object} kpiScore - KPI score document
   */
  static async updateUserStatus(userId, kpiScore) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Update user status based on KPI score
      let newStatus = 'Active';
      if (kpiScore.overallScore < 50) {
        newStatus = 'Audited';
      } else if (kpiScore.overallScore < 70) {
        newStatus = 'Warning';
      }

      // Update KPI score in user document
      user.kpiScore = kpiScore.overallScore;
      user.status = newStatus;

      await user.save();

      console.log(`Updated user ${userId} status to ${newStatus} with KPI score ${kpiScore.overallScore}%`);

    } catch (error) {
      console.error(`Error updating user status for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create lifecycle events based on triggers
   * @param {String} userId - User ID
   * @param {Array} lifecycleTriggers - Array of lifecycle event triggers
   * @returns {Array} - Created lifecycle events
   */
  static async createLifecycleEvents(userId, lifecycleTriggers) {
    const events = [];

    for (const trigger of lifecycleTriggers) {
      try {
        const event = await LifecycleService.trackLifecycleEvent(userId, {
          type: trigger.type,
          title: trigger.title,
          description: trigger.description,
          category: trigger.category,
          metadata: {
            timestamp: new Date(),
            automated: true
          }
        });

        events.push(event);

        console.log(`Created lifecycle event: ${trigger.title} for user ${userId}`);

      } catch (error) {
        console.error(`Error creating lifecycle event ${trigger.title}:`, error);
        throw error;
      }
    }

    return events;
  }

  /**
   * Get recipients by roles
   * @param {Array} roles - Array of role names
   * @param {String} userId - User ID for FE role
   * @returns {Array} - Array of recipient objects
   */
  static async getRecipientsByRoles(roles, userId) {
    const recipients = [];

    for (const role of roles) {
      switch (role) {
        case 'fe':
          if (userId) {
            const fe = await User.findById(userId).select('email');
            if (fe) recipients.push({ email: fe.email, role: 'fe' });
          }
          break;
        case 'coordinator':
          const coordinators = await User.find({ userType: 'admin', department: 'Coordination' }).select('email');
          recipients.push(...coordinators.map(c => ({ email: c.email, role: 'coordinator' })));
          break;
        case 'manager':
          const managers = await User.find({ userType: 'admin', department: 'Management' }).select('email');
          recipients.push(...managers.map(m => ({ email: m.email, role: 'manager' })));
          break;
        case 'hod':
          const hods = await User.find({ userType: 'admin', department: 'HOD' }).select('email');
          recipients.push(...hods.map(h => ({ email: h.email, role: 'hod' })));
          break;
        case 'compliance':
          const compliance = await User.find({ userType: 'admin', department: 'Compliance' }).select('email');
          recipients.push(...compliance.map(c => ({ email: c.email, role: 'compliance' })));
          break;
      }
    }

    // Remove duplicates
    const uniqueRecipients = recipients.filter((recipient, index, self) =>
      index === self.findIndex(r => r.email === recipient.email)
    );

    return uniqueRecipients;
  }

  /**
   * Get audit method based on audit type
   * @param {String} auditType - Type of audit
   * @returns {String} - Audit method description
   */
  static getAuditMethod(auditType) {
    const methods = {
      'audit_call': 'Phone call audit with performance review',
      'cross_check': 'Cross-verification of last 3 months data',
      'dummy_audit': 'Dummy case audit to test performance',
      'cross_verify_insuff': 'Cross-verification of insufficient cases by another FE'
    };
    return methods[auditType] || 'Standard audit procedure';
  }

  /**
   * Get email subject based on email type
   * @param {String} emailType - Type of email
   * @param {Object} data - Email data
   * @returns {String} - Email subject
   */
  static getEmailSubject(emailType, data) {
    const subjects = {
      'training': `Training Required: ${data.trainingTypes?.join(', ') || 'Multiple Trainings'}`,
      'audit': `Audit Notification: ${data.auditTypes?.join(', ') || 'Multiple Audits'}`,
      'warning': 'Performance Warning Notice',
      'kpi_score': `KPI Score Update: ${data.period}`
    };
    return subjects[emailType] || 'System Notification';
  }

  /**
   * Get improvement areas based on KPI scores
   * @param {Object} kpiScore - KPI score document
   * @returns {Array} - Array of improvement areas
   */
  static getImprovementAreas(kpiScore) {
    const areas = [];
    const { tat, majorNegativity, quality, neighborCheck, negativity, appUsage, insufficiency } = kpiScore;

    if (tat.score < 10) areas.push('Turn Around Time (TAT) below target');
    if (majorNegativity.score < 10) areas.push('High Major Negativity rate');
    if (quality.score < 10) areas.push('Quality concerns');
    if (neighborCheck.score < 5) areas.push('Insufficient neighbor checks');
    if (negativity.score < 5) areas.push('High general negativity rate');
    if (appUsage.score < 5) areas.push('Low application usage');
    if (insufficiency.score < 5) areas.push('High insufficiency rate');

    return areas;
  }

  /**
   * Process pending KPI scores for automation
   * @returns {Object} - Processing results
   */
  static async processPendingKPIs() {
    try {
      const pendingKPIs = await KPIScore.getPendingAutomation();
      const results = {
        processed: 0,
        failed: 0,
        errors: []
      };

      console.log(`Found ${pendingKPIs.length} pending KPI scores for automation`);

      for (const kpiScore of pendingKPIs) {
        try {
          await this.processKPITriggers(kpiScore);
          results.processed++;
        } catch (error) {
          console.error(`Error processing KPI ${kpiScore._id}:`, error);
          results.failed++;
          results.errors.push({
            kpiId: kpiScore._id,
            error: error.message
          });
        }
      }

      console.log(`Processed ${results.processed} KPI scores, ${results.failed} failed`);
      return results;

    } catch (error) {
      console.error('Error processing pending KPIs:', error);
      throw error;
    }
  }

  /**
   * Get automation statistics
   * @returns {Object} - Automation statistics
   */
  static async getAutomationStats() {
    try {
      const [kpiStats, trainingStats, emailStats, auditStats] = await Promise.all([
        KPIScore.getAutomationStats(),
        TrainingAssignment.getTrainingStats(),
        EmailLog.getEmailStats(),
        AuditSchedule.getAuditStats()
      ]);

      return {
        kpi: kpiStats,
        training: trainingStats,
        email: emailStats,
        audit: auditStats,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error getting automation stats:', error);
      throw error;
    }
  }
}

module.exports = KPITriggerService;
