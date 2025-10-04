const EmailTemplate = require('../models/EmailTemplate');
const Notification = require('../models/Notification');
const EmailLog = require('../models/EmailLog');

/**
 * Email Template Service
 * Handles template-based email rendering and sending with notification creation
 */

class EmailTemplateService {
  /**
   * Render email template with variables
   * @param {string} templateType - Type of template (e.g., 'kpi_outstanding', 'training_assignment')
   * @param {object} variables - Variables to replace in template
   * @returns {object} Rendered email with subject and content
   */
  static async renderTemplate(templateType, variables) {
    try {
      const template = await EmailTemplate.getByType(templateType);
      
      if (!template) {
        throw new Error(`Email template not found for type: ${templateType}`);
      }

      // Validate variables
      const validation = template.validateVariables(variables);
      if (!validation.valid) {
        console.warn(`Missing variables for template ${templateType}:`, validation.missing);
        // Continue anyway - missing variables will be replaced with empty strings
      }

      // Render template
      const rendered = EmailTemplate.renderTemplate(template, variables);
      
      // Record usage
      await template.recordUsage();

      return {
        templateId: template._id,
        templateName: template.name,
        subject: rendered.subject,
        content: rendered.content,
        defaultRecipients: template.defaultRecipients
      };
    } catch (error) {
      console.error('Error rendering email template:', error);
      throw error;
    }
  }

  /**
   * Send email using template (console log for now, actual sending later)
   * @param {object} options - Email options
   * @returns {object} Email send result
   */
  static async sendEmail(options) {
    try {
      const {
        templateType,
        variables,
        recipients, // Array of {email, role}
        userId,
        sentBy,
        kpiTriggerId,
        trainingAssignmentId,
        auditScheduleId,
        createNotification = true,
        notificationMetadata = {}
      } = options;

      // Render template
      const rendered = await this.renderTemplate(templateType, variables);

      // Send to each recipient
      const results = [];
      for (const recipient of recipients) {
        try {
          // For now, just log to console (will add actual mailer later)
          console.log(`\n${'='.repeat(80)}`);
          console.log(`📧 EMAIL TO: ${recipient.email} (${recipient.role})`);
          console.log(`📋 SUBJECT: ${rendered.subject}`);
          console.log(`${'-'.repeat(80)}`);
          console.log(rendered.content);
          console.log(`${'='.repeat(80)}\n`);

          // Log email activity
          const emailLog = await EmailLog.create({
            recipientEmail: recipient.email,
            recipientRole: recipient.role,
            templateType: templateType,
            subject: rendered.subject,
            emailContent: rendered.content,
            status: 'sent', // Change to 'pending' when actual mailer is added
            userId: userId,
            kpiTriggerId: kpiTriggerId,
            trainingAssignmentId: trainingAssignmentId,
            auditScheduleId: auditScheduleId,
            sentAt: new Date(),
            deliveredAt: new Date() // Change to null when actual mailer is added
          });

          results.push({
            recipient: recipient.email,
            role: recipient.role,
            success: true,
            emailLogId: emailLog._id
          });

          // Create in-app notification for user
          if (createNotification && userId && recipient.role === 'FE') {
            await Notification.createNotification({
              userId: userId,
              title: rendered.subject,
              message: this.extractPlainText(rendered.content).substring(0, 200) + '...',
              type: this.getNotificationType(templateType),
              priority: this.getNotificationPriority(templateType),
              sentBy: sentBy,
              metadata: {
                ...notificationMetadata,
                emailLogId: emailLog._id,
                actionRequired: true,
                actionUrl: this.getActionUrl(templateType)
              }
            });
          }
        } catch (error) {
          console.error(`Error sending email to ${recipient.email}:`, error);
          results.push({
            recipient: recipient.email,
            role: recipient.role,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        templateType: templateType,
        results: results,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send KPI trigger emails
   * @param {object} kpiRecord - KPI score record
   * @param {object} user - User object
   * @param {array} triggers - Array of triggers
   * @param {object} sentBy - Admin user who triggered
   * @returns {array} Email results
   */
  static async sendKPITriggerEmails(kpiRecord, user, triggers, sentBy) {
    const emailResults = [];

    for (const trigger of triggers) {
      try {
        // Determine template type based on trigger
        let templateType;
        let recipients = [];
        let notificationMetadata = {};

        switch (trigger.type) {
          case 'training':
            templateType = 'training_assignment';
            recipients = await this.getRecipientsByRole(['FE', 'Coordinator', 'Manager', 'HOD'], user._id);
            notificationMetadata = {
              trainingId: trigger.trainingAssignmentId,
              actionUrl: '/training'
            };
            break;

          case 'audit':
            templateType = 'audit_schedule';
            recipients = await this.getRecipientsByRole(['Compliance Team', 'HOD'], user._id);
            notificationMetadata = {
              auditId: trigger.auditScheduleId,
              actionUrl: '/audits'
            };
            break;

          case 'warning':
            templateType = 'performance_warning';
            recipients = await this.getRecipientsByRole(['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'], user._id);
            notificationMetadata = {
              actionUrl: '/kpi-scores'
            };
            break;

          default:
            // Determine by rating
            if (kpiRecord.rating === 'Outstanding') {
              templateType = 'kpi_outstanding';
              recipients = await this.getRecipientsByRole(['FE', 'Manager', 'HOD'], user._id);
            } else if (kpiRecord.rating === 'Excellent') {
              templateType = 'kpi_excellent';
              recipients = await this.getRecipientsByRole(['FE', 'Coordinator'], user._id);
            } else {
              templateType = 'kpi_need_improvement';
              recipients = await this.getRecipientsByRole(['FE', 'Coordinator', 'Manager', 'HOD'], user._id);
            }
        }

        // Prepare variables
        const variables = {
          userName: user.name,
          email: user.email,
          employeeId: user.employeeId || 'N/A',
          kpiScore: kpiRecord.overallScore.toFixed(2),
          rating: kpiRecord.rating,
          period: kpiRecord.period,
          tatPercentage: kpiRecord.metrics.tat.percentage?.toFixed(2) || '0',
          majorNegPercentage: kpiRecord.metrics.majorNegativity.percentage?.toFixed(2) || '0',
          qualityPercentage: kpiRecord.metrics.quality.percentage?.toFixed(2) || '0',
          neighborCheckPercentage: kpiRecord.metrics.neighborCheck.percentage?.toFixed(2) || '0',
          generalNegPercentage: kpiRecord.metrics.negativity.percentage?.toFixed(2) || '0',
          onlinePercentage: kpiRecord.metrics.appUsage.percentage?.toFixed(2) || '0',
          insuffPercentage: kpiRecord.metrics.insufficiency.percentage?.toFixed(2) || '0',
          trainingType: trigger.details || 'Basic Training Module',
          trainingReason: trigger.reason || `KPI Score: ${kpiRecord.overallScore.toFixed(2)}%`,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          trainingDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          priority: trigger.priority || 'High',
          auditType: trigger.details || 'Audit Call',
          auditScope: trigger.reason || 'Performance review based on KPI triggers',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          preAuditDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          auditDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          performanceConcerns: trigger.reason || 'Low KPI performance',
          improvementAreas: `TAT: ${kpiRecord.metrics.tat.percentage?.toFixed(2)}%, Quality: ${kpiRecord.metrics.quality.percentage?.toFixed(2)}%`
        };

        // Send email
        const result = await this.sendEmail({
          templateType: templateType,
          variables: variables,
          recipients: recipients,
          userId: user._id,
          sentBy: sentBy,
          kpiTriggerId: kpiRecord._id,
          trainingAssignmentId: trigger.trainingAssignmentId,
          auditScheduleId: trigger.auditScheduleId,
          createNotification: true,
          notificationMetadata: {
            kpiScore: kpiRecord.overallScore,
            rating: kpiRecord.rating,
            period: kpiRecord.period,
            ...notificationMetadata
          }
        });

        emailResults.push(result);
      } catch (error) {
        console.error(`Error sending email for trigger ${trigger.type}:`, error);
        emailResults.push({
          success: false,
          trigger: trigger.type,
          error: error.message
        });
      }
    }

    return emailResults;
  }

  /**
   * Get recipients by role
   * @param {array} roles - Array of roles
   * @param {string} userId - User ID (for FE role)
   * @returns {array} Recipients with email and role
   */
  static async getRecipientsByRole(roles, userId = null) {
    const User = require('../models/User');
    const recipients = [];

    for (const role of roles) {
      switch (role) {
        case 'FE':
          if (userId) {
            const fe = await User.findById(userId).select('email name');
            if (fe && fe.email) {
              recipients.push({ email: fe.email, role: 'FE', name: fe.name });
            }
          }
          break;

        case 'Coordinator':
          // For now, use admin emails (you can add department field later)
          const coordinators = await User.find({ userType: 'admin' }).select('email name');
          recipients.push(...coordinators.filter(c => c.email).map(c => ({ email: c.email, role: 'Coordinator', name: c.name })));
          break;

        case 'Manager':
          const managers = await User.find({ userType: 'admin' }).select('email name');
          recipients.push(...managers.filter(m => m.email).map(m => ({ email: m.email, role: 'Manager', name: m.name })));
          break;

        case 'HOD':
          const hods = await User.find({ userType: 'admin' }).select('email name');
          recipients.push(...hods.filter(h => h.email).map(h => ({ email: h.email, role: 'HOD', name: h.name })));
          break;

        case 'Compliance Team':
          const compliance = await User.find({ userType: 'admin' }).select('email name');
          recipients.push(...compliance.filter(c => c.email).map(c => ({ email: c.email, role: 'Compliance Team', name: c.name })));
          break;
      }
    }

    // Remove duplicates by email
    const uniqueRecipients = recipients.filter((recipient, index, self) =>
      index === self.findIndex(r => r.email === recipient.email)
    );

    return uniqueRecipients;
  }

  /**
   * Extract plain text from HTML content
   * @param {string} html - HTML content
   * @returns {string} Plain text
   */
  static extractPlainText(html) {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Get notification type from template type
   * @param {string} templateType - Template type
   * @returns {string} Notification type
   */
  static getNotificationType(templateType) {
    const typeMap = {
      'kpi_outstanding': 'kpi',
      'kpi_excellent': 'kpi',
      'kpi_satisfactory': 'kpi',
      'kpi_need_improvement': 'performance',
      'kpi_unsatisfactory': 'performance',
      'training_assignment': 'training',
      'audit_schedule': 'audit',
      'performance_warning': 'warning'
    };
    return typeMap[templateType] || 'info';
  }

  /**
   * Get notification priority from template type
   * @param {string} templateType - Template type
   * @returns {string} Notification priority
   */
  static getNotificationPriority(templateType) {
    const priorityMap = {
      'kpi_outstanding': 'normal',
      'kpi_excellent': 'normal',
      'kpi_satisfactory': 'normal',
      'kpi_need_improvement': 'high',
      'kpi_unsatisfactory': 'urgent',
      'training_assignment': 'high',
      'audit_schedule': 'high',
      'performance_warning': 'urgent'
    };
    return priorityMap[templateType] || 'normal';
  }

  /**
   * Get action URL from template type
   * @param {string} templateType - Template type
   * @returns {string} Action URL
   */
  static getActionUrl(templateType) {
    const urlMap = {
      'training_assignment': '/training',
      'audit_schedule': '/audits',
      'performance_warning': '/kpi-scores',
      'kpi_outstanding': '/kpi-scores',
      'kpi_excellent': '/kpi-scores',
      'kpi_need_improvement': '/training'
    };
    return urlMap[templateType] || '/dashboard';
  }

  /**
   * Get all templates
   * @returns {array} All templates
   */
  static async getAllTemplates() {
    return await EmailTemplate.find().sort({ category: 1, name: 1 });
  }

  /**
   * Get template by ID
   * @param {string} id - Template ID
   * @returns {object} Template
   */
  static async getTemplateById(id) {
    return await EmailTemplate.findById(id);
  }

  /**
   * Create template
   * @param {object} templateData - Template data
   * @returns {object} Created template
   */
  static async createTemplate(templateData) {
    const template = new EmailTemplate(templateData);
    return await template.save();
  }

  /**
   * Update template
   * @param {string} id - Template ID
   * @param {object} updates - Updates
   * @returns {object} Updated template
   */
  static async updateTemplate(id, updates) {
    return await EmailTemplate.findByIdAndUpdate(id, updates, { new: true });
  }

  /**
   * Delete template
   * @param {string} id - Template ID
   * @returns {object} Deleted template
   */
  static async deleteTemplate(id) {
    return await EmailTemplate.findByIdAndDelete(id);
  }

  /**
   * Preview template with sample data
   * @param {string} templateId - Template ID
   * @param {object} sampleData - Sample data for preview
   * @returns {object} Rendered template
   */
  static async previewTemplate(templateId, sampleData) {
    const template = await EmailTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return EmailTemplate.renderTemplate(template, sampleData);
  }
}

module.exports = EmailTemplateService;

