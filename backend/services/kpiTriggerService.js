const User = require('../models/User');
const KPIScore = require('../models/KPIScore');
const TrainingAssignment = require('../models/TrainingAssignment');
const AuditSchedule = require('../models/AuditSchedule');
const Notification = require('../models/Notification');
const EmailTemplateService = require('./emailTemplateService');

class KPITriggerService {
  constructor() {
    this.triggerRules = {
      // KPI Score based triggers
      scoreBased: {
        '85-100': {
          rating: 'Outstanding',
          training: null,
          audit: null,
          reward: true
        },
        '70-84': {
          rating: 'Excellent',
          training: null,
          audit: 'Audit Call'
        },
        '50-69': {
          rating: 'Satisfactory',
          training: null,
          audit: 'Audit Call + Cross-check last 3 months data'
        },
        '40-49': {
          rating: 'Need Improvement',
          training: 'Basic Training Module (Joining-level training)',
          audit: 'Audit Call + Cross-check last 3 months data + Dummy Audit Case'
        },
        'below-40': {
          rating: 'Unsatisfactory',
          training: 'Basic Training Module (Joining-level training)',
          audit: 'Audit Call + Cross-check last 3 months data + Dummy Audit Case',
          warning: true
        }
      }
    };
  }

  // Process KPI data from Excel and trigger actions
  async processKPIFromExcel(excelData, period, submittedBy = null) {
    const results = [];
    
    for (const row of excelData) {
      try {
        const result = await this.processKPIRow(row, period, submittedBy);
        results.push(result);
      } catch (error) {
        console.error(`Error processing KPI row for ${row.FE}:`, error);
        results.push({
          fe: row.FE,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Process individual KPI row
  async processKPIRow(row, period, submittedBy = null) {
    const fe = row.FE;
    const kpiScore = this.calculateKPIScore(row);
    const rating = this.getRating(kpiScore);
    
    // Find or create user
    const user = await this.findOrCreateUser(fe, row['Email'], row['Employee ID']);
    
    // Save KPI score
    const kpiRecord = await this.saveKPIScore(user._id, period, kpiScore, rating, row, submittedBy);
    
    // Get admin user for context
    const User = require('../models/User');
    const adminUser = submittedBy ? await User.findById(submittedBy) : null;
    
    // Process triggers
    const triggers = await this.processTriggers(user, kpiRecord, row, adminUser);
    
    return {
      fe: fe,
      userId: user._id,
      kpiScore: kpiScore,
      rating: rating,
      triggers: triggers,
      success: true
    };
  }

  // Calculate KPI score from Excel row data - ENHANCED with exact KPI logic
  calculateKPIScore(row) {
    const tatPercentage = parseFloat(row['TAT %']) || 0;
    const majorNegPercentage = parseFloat(row['Major Negative %']) || 0;
    const negPercentage = parseFloat(row['Negative %']) || 0;
    const qualityPercentage = parseFloat(row['Quality Concern % Age']) || 0;
    const insuffPercentage = parseFloat(row['Insuff %']) || 0;
    const neighborCheckPercentage = parseFloat(row['Neighbor Check % Age']) || 0;
    const onlinePercentage = parseFloat(row['Online % Age']) || 0;

    // Calculate individual scores based on KPI criteria (weightage: 20%, 20%, 20%, 10%, 10%, 10%, 10%)
    let tatScore = 0;
    if (tatPercentage >= 95) tatScore = 20;
    else if (tatPercentage >= 90) tatScore = 10;
    else if (tatPercentage >= 85) tatScore = 5;
    else tatScore = 0;

    let majorNegScore = 0;
    if (majorNegPercentage >= 2.5) majorNegScore = 20;
    else if (majorNegPercentage >= 2.0) majorNegScore = 15;
    else if (majorNegPercentage >= 1.5) majorNegScore = 5;
    else majorNegScore = 0;

    let qualityScore = 0;
    if (qualityPercentage === 0) qualityScore = 20;
    else if (qualityPercentage <= 0.25) qualityScore = 15;
    else if (qualityPercentage <= 0.5) qualityScore = 10;
    else qualityScore = 0;

    let neighborScore = 0;
    if (neighborCheckPercentage >= 90) neighborScore = 10;
    else if (neighborCheckPercentage >= 85) neighborScore = 5;
    else if (neighborCheckPercentage >= 80) neighborScore = 2;
    else neighborScore = 0;

    let negScore = 0;
    if (negPercentage >= 25) negScore = 10;
    else if (negPercentage >= 20) negScore = 5;
    else if (negPercentage >= 15) negScore = 2;
    else negScore = 0;

    let onlineScore = 0;
    if (onlinePercentage >= 90) onlineScore = 10;
    else if (onlinePercentage >= 85) onlineScore = 5;
    else if (onlinePercentage >= 80) onlineScore = 2;
    else onlineScore = 0;

    let insuffScore = 0;
    if (insuffPercentage < 1) insuffScore = 10;
    else if (insuffPercentage <= 1.5) insuffScore = 5;
    else if (insuffPercentage <= 2) insuffScore = 2;
    else insuffScore = 0;

    // Sum all scores
    const overallScore = tatScore + majorNegScore + qualityScore + neighborScore + negScore + onlineScore + insuffScore;

    return Math.round(overallScore * 100) / 100;
  }

  // Get rating based on score
  getRating(score) {
    if (score >= 85) return 'Outstanding';
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Satisfactory';
    if (score >= 40) return 'Need Improvement';
    return 'Unsatisfactory';
  }

  // Find or create user based on FE name
  // Find or create user by employeeId, email, or name (priority order)
  async findOrCreateUser(feName, email = null, employeeId = null) {
    let user = null;
    
    // Priority 1: Find by Employee ID
    if (employeeId) {
      user = await User.findOne({ employeeId: employeeId });
    }
    
    // Priority 2: Find by Email
    if (!user && email) {
      user = await User.findOne({ email: email });
    }
    
    // Priority 3: Find by Name (regex)
    if (!user && feName) {
      user = await User.findOne({ 
        name: { $regex: feName, $options: 'i' }
      });
    }
    
    // Create new user if still not found
    if (!user) {
      const [firstName, lastName] = feName.split(' ');
      user = new User({
        name: feName,
        email: email || `${firstName?.toLowerCase() || 'user'}@company.com`,
        employeeId: employeeId || `FE-${Date.now()}`,
        password: 'defaultPassword123',
        userType: 'user',
        isActive: true,
        department: 'Field Operations'
      });
      await user.save();
    }

    return user;
  }

  // Save KPI score to database
  async saveKPIScore(userId, period, score, rating, rawData, submittedBy = null) {
    const kpiScore = new KPIScore({
      userId: userId,
      period: period,
      overallScore: score,
      rating: rating,
      // All required percentage fields
      tat: {
        percentage: parseFloat(rawData['TAT %']) || 0
      },
      majorNegativity: {
        percentage: parseFloat(rawData['Major Negative %']) || 0
      },
      quality: {
        percentage: parseFloat(rawData['Quality Concern % Age']) || 0
      },
      neighborCheck: {
        percentage: parseFloat(rawData['Neighbor Check % Age']) || 0
      },
      negativity: {
        percentage: parseFloat(rawData['Negative %']) || 0
      },
      appUsage: {
        percentage: parseFloat(rawData['Online % Age']) || 0
      },
      insufficiency: {
        percentage: parseFloat(rawData['Insuff %']) || 0
      },
      submittedBy: submittedBy, // Required field
      isActive: true
    });

    await kpiScore.save();
    return kpiScore;
  }

  // Process all triggers for a user - ENHANCED with condition-based triggers
  async processTriggers(user, kpiRecord, rawData, adminUser = null) {
    const triggers = [];

    // 1. Score-based triggers
    const scoreTriggers = this.getScoreBasedTriggers(kpiRecord.overallScore);
    for (const trigger of scoreTriggers) {
      const result = await this.executeTrigger(user, kpiRecord, trigger, rawData, adminUser);
      triggers.push(result);
    }

    // 2. Condition-based triggers
    const conditionTriggers = this.getConditionBasedTriggers(kpiRecord.overallScore, rawData);
    for (const trigger of conditionTriggers) {
      const result = await this.executeTrigger(user, kpiRecord, trigger, rawData, adminUser);
      triggers.push(result);
    }

    // 3. Create main KPI notification for user dashboard
    await this.createKPINotification(user, kpiRecord, triggers, adminUser);

    return triggers;
  }

  // Get condition-based triggers
  getConditionBasedTriggers(overallScore, rawData) {
    const triggers = [];
    const majorNegPercentage = parseFloat(rawData['Major Negative %']) || 0;
    const negPercentage = parseFloat(rawData['Negative %']) || 0;
    const qualityPercentage = parseFloat(rawData['Quality Concern % Age']) || 0;
    const onlinePercentage = parseFloat(rawData['Online % Age']) || 0;
    const insuffPercentage = parseFloat(rawData['Insuff %']) || 0;

    // Condition 1: Overall KPI Score < 55%
    if (overallScore < 55) {
      triggers.push({
        training: 'Basic Training Module (Joining-level training)',
        audit: 'Audit Call + Cross-check last 3 months data + Dummy Audit Case',
        conditionMet: 'Overall KPI Score < 55%',
        emailRecipients: {
          training: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
          audit: ['Compliance Team', 'HOD']
        }
      });
    }

    // Condition 2: Overall KPI Score < 40%
    if (overallScore < 40) {
      triggers.push({
        training: 'Basic Training Module (Joining-level training)',
        audit: 'Audit Call + Cross-check last 3 months data + Dummy Audit Case',
        warning: true,
        conditionMet: 'Overall KPI Score < 40%',
        emailRecipients: {
          training: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
          audit: ['Compliance Team', 'HOD'],
          warning: ['FE', 'Coordinator', 'Manager', 'Compliance', 'HOD']
        }
      });
    }

    // Condition 3: Major Negativity > 0% AND General Negativity < 25%
    if (majorNegPercentage > 0 && negPercentage < 25) {
      triggers.push({
        training: 'Negativity Handling Training Module',
        audit: 'Audit Call + Cross-check last 3 months',
        conditionMet: 'Major Negativity > 0% AND General Negativity < 25%',
        emailRecipients: {
          training: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
          audit: ['Compliance Team', 'HOD']
        }
      });
    }

    // Condition 4: Quality Concern > 1%
    if (qualityPercentage > 1) {
      triggers.push({
        training: "Do's & Don'ts Training Module",
        audit: 'Audit Call + Cross-check last 3 months + RCA of complaints',
        conditionMet: 'Quality Concern > 1%',
        emailRecipients: {
          training: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
          audit: ['Compliance Team', 'HOD']
        }
      });
    }

    // Condition 5: Cases Done on App < 80%
    if (onlinePercentage < 80) {
      triggers.push({
        training: 'Application Usage Training',
        audit: null,
        conditionMet: 'Cases Done on App < 80%',
        emailRecipients: {
          training: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD']
        }
      });
    }

    // Condition 6: Insufficiency > 2%
    if (insuffPercentage > 2) {
      triggers.push({
        training: null,
        audit: 'Cross-verification of selected insuff cases by another FE',
        conditionMet: 'Insufficiency > 2%',
        emailRecipients: {
          audit: ['Compliance Team', 'HOD']
        }
      });
    }

    return triggers;
  }

  // Get score-based triggers
  getScoreBasedTriggers(score) {
    const triggers = [];

    if (score >= 85) {
      triggers.push(this.triggerRules.scoreBased['85-100']);
    } else if (score >= 70) {
      triggers.push(this.triggerRules.scoreBased['70-84']);
    } else if (score >= 50) {
      triggers.push(this.triggerRules.scoreBased['50-69']);
    } else if (score >= 40) {
      triggers.push(this.triggerRules.scoreBased['40-49']);
    } else {
      triggers.push(this.triggerRules.scoreBased['below-40']);
    }

    return triggers;
  }

  // Execute individual trigger - ENHANCED with email template service
  async executeTrigger(user, kpiRecord, trigger, rawData, adminUser) {
    const result = {
      type: trigger.training ? 'training' : trigger.audit ? 'audit' : 'warning',
      action: trigger.training || trigger.audit || 'Warning Letter',
      executed: false,
      error: null,
      conditionMet: trigger.conditionMet || null,
      emailsSent: []
    };

    try {
      let trainingId = null;
      let auditId = null;

      // Create training assignment if needed
      if (trigger.training) {
        const training = await this.createTrainingAssignment(user, trigger.training, kpiRecord, trigger.conditionMet);
        trainingId = training._id;
        
        // Send email notifications using template service
        if (trigger.emailRecipients?.training) {
          const emailResult = await this.sendTemplatedEmail(
            'training',
            user,
            kpiRecord,
            trigger,
            adminUser,
            { trainingAssignmentId: training._id, trainingDetails: training }
          );
          result.emailsSent.push(...emailResult.results);
        }
        
        result.executed = true;
        result.trainingAssignmentId = training._id;
      }

      // Create audit schedule if needed
      if (trigger.audit) {
        const audit = await this.createAuditSchedule(user, trigger.audit, kpiRecord, trigger.conditionMet);
        auditId = audit._id;
        
        // Send email notifications using template service
        if (trigger.emailRecipients?.audit) {
          const emailResult = await this.sendTemplatedEmail(
            'audit',
            user,
            kpiRecord,
            trigger,
            adminUser,
            { auditScheduleId: audit._id, auditDetails: audit }
          );
          result.emailsSent.push(...emailResult.results);
        }
        
        result.executed = true;
        result.auditScheduleId = audit._id;
      }

      // Send warning letter if needed
      if (trigger.warning) {
        // Send email notifications using template service
        if (trigger.emailRecipients?.warning) {
          const emailResult = await this.sendTemplatedEmail(
            'warning',
            user,
            kpiRecord,
            trigger,
            adminUser,
            {}
          );
          result.emailsSent.push(...emailResult.results);
        }
        
        result.executed = true;
      }

    } catch (error) {
      result.error = error.message;
      console.error('Error executing trigger:', error);
    }

    return result;
  }

  // Create main KPI notification for user dashboard
  async createKPINotification(user, kpiRecord, triggers, adminUser) {
    try {
      const Notification = require('../models/Notification');
      
      // Determine notification type and priority based on rating and triggers
      let notificationType = 'kpi';
      let priority = 'normal';
      let title = `KPI Score Update - ${kpiRecord.period}`;
      let message = `Your KPI score for ${kpiRecord.period} is ${kpiRecord.overallScore.toFixed(2)}% (${kpiRecord.rating}).`;

      // Check if there are any active triggers
      const activeTriggers = triggers.filter(t => t.executed);
      if (activeTriggers.length > 0) {
        priority = 'high';
        const triggerActions = activeTriggers.map(t => t.action).join(', ');
        message += ` Actions triggered: ${triggerActions}.`;
        
        // Set specific notification type based on triggers
        if (activeTriggers.some(t => t.type === 'training')) {
          notificationType = 'training';
          title = `Training Assignment - ${kpiRecord.period}`;
        } else if (activeTriggers.some(t => t.type === 'audit')) {
          notificationType = 'audit';
          title = `Audit Scheduled - ${kpiRecord.period}`;
        } else if (activeTriggers.some(t => t.type === 'warning')) {
          notificationType = 'performance';
          title = `Performance Warning - ${kpiRecord.period}`;
          priority = 'urgent';
        }
      }

      // Create notification
      await Notification.createNotification({
        userId: user._id,
        title: title,
        message: message,
        type: notificationType,
        priority: priority,
        sentBy: adminUser?._id || user._id,
        metadata: {
          kpiScore: kpiRecord.overallScore,
          rating: kpiRecord.rating,
          period: kpiRecord.period,
          kpiRecordId: kpiRecord._id,
          triggersExecuted: activeTriggers.length,
          actionRequired: activeTriggers.length > 0,
          actionUrl: activeTriggers.length > 0 ? '/notifications' : null
        }
      });

      console.log(`✅ Created KPI notification for user ${user.name} (${user.email}) - ${notificationType} - ${priority}`);
      
    } catch (error) {
      console.error('Error creating KPI notification:', error);
    }
  }

  // Send templated emails using EmailTemplateService
  async sendTemplatedEmail(type, user, kpiRecord, trigger, adminUser, additionalData = {}) {
    try {
      // Determine template type and recipients
      let templateType;
      let recipientRoles = [];

      switch (type) {
        case 'training':
          templateType = 'training_assignment';
          recipientRoles = trigger.emailRecipients?.training || ['FE', 'Coordinator', 'Manager', 'HOD'];
          break;

        case 'audit':
          templateType = 'audit_schedule';
          recipientRoles = trigger.emailRecipients?.audit || ['Compliance Team', 'HOD'];
          break;

        case 'warning':
          templateType = 'performance_warning';
          recipientRoles = trigger.emailRecipients?.warning || ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'];
          break;

        default:
          // Determine by rating
          if (kpiRecord.rating === 'Outstanding') {
            templateType = 'kpi_outstanding';
            recipientRoles = ['FE', 'Manager', 'HOD'];
          } else if (kpiRecord.rating === 'Excellent') {
            templateType = 'kpi_excellent';
            recipientRoles = ['FE', 'Coordinator'];
          } else {
            templateType = 'kpi_need_improvement';
            recipientRoles = ['FE', 'Coordinator', 'Manager', 'HOD'];
          }
      }

      // Get recipients
      const recipients = await EmailTemplateService.getRecipientsByRole(recipientRoles, user._id);

      // Prepare variables for template
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
        trainingType: trigger.training || 'Basic Training Module',
        trainingReason: trigger.conditionMet || `KPI Score: ${kpiRecord.overallScore.toFixed(2)}%`,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        trainingDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        priority: 'High',
        auditType: trigger.audit || 'Audit Call',
        auditScope: trigger.conditionMet || 'Performance review based on KPI triggers',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        preAuditDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        auditDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        performanceConcerns: trigger.conditionMet || 'Low KPI performance',
        improvementAreas: `TAT: ${kpiRecord.metrics.tat.percentage?.toFixed(2)}%, Quality: ${kpiRecord.metrics.quality.percentage?.toFixed(2)}%`
      };

      // Send email
      const result = await EmailTemplateService.sendEmail({
        templateType: templateType,
        variables: variables,
        recipients: recipients,
        userId: user._id,
        sentBy: adminUser?._id || user._id,
        kpiTriggerId: kpiRecord._id,
        trainingAssignmentId: additionalData.trainingAssignmentId,
        auditScheduleId: additionalData.auditScheduleId,
        createNotification: true,
        notificationMetadata: {
          kpiScore: kpiRecord.overallScore,
          rating: kpiRecord.rating,
          period: kpiRecord.period,
          trainingId: additionalData.trainingAssignmentId,
          auditId: additionalData.auditScheduleId
        }
      });

      return result;
    } catch (error) {
      console.error('Error sending templated email:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  // Create user notification
  async createUserNotification(user, type, action, kpiRecord) {
    const notification = new Notification({
      userId: user._id,
      type: type,
      title: `New ${type === 'training' ? 'Training' : 'Audit'} Assignment`,
      message: `You have been assigned: ${action}. KPI Score: ${kpiRecord.overallScore}% (${kpiRecord.rating})`,
      priority: 'high',
      isRead: false,
      metadata: {
        kpiScoreId: kpiRecord._id,
        period: kpiRecord.period,
        score: kpiRecord.overallScore,
        rating: kpiRecord.rating
      }
    });

    await notification.save();
    return notification;
  }

  // Send training notifications via email
  async sendTrainingNotifications(user, training, kpiRecord, recipients) {
    const emailData = {
      fe: user.name,
      feEmail: user.email,
      trainingType: training.trainingType,
      kpiScore: kpiRecord.overallScore,
      rating: kpiRecord.rating,
      period: kpiRecord.period,
      dueDate: training.dueDate.toLocaleDateString()
    };

    // Send to specified recipients
    if (recipients.includes('FE')) {
      console.log(`[EMAIL] Training notification sent to FE: ${user.email}`);
    }
    if (recipients.includes('Coordinator')) {
      console.log(`[EMAIL] Training notification sent to Coordinator for FE: ${user.name}`);
    }
    if (recipients.includes('Manager')) {
      console.log(`[EMAIL] Training notification sent to Manager for FE: ${user.name}`);
    }
    if (recipients.includes('HOD')) {
      console.log(`[EMAIL] Training notification sent to HOD for FE: ${user.name}`);
    }
    if (recipients.includes('Compliance Team')) {
      console.log(`[EMAIL] Training notification sent to Compliance Team for FE: ${user.name}`);
    }

    // TODO: Implement actual email sending using emailService
    // await emailService.sendTrainingAssignmentEmail(emailData, recipients);
  }

  // Send audit notifications via email
  async sendAuditNotifications(user, audit, kpiRecord, recipients) {
    const emailData = {
      fe: user.name,
      feEmail: user.email,
      auditType: audit.auditType,
      kpiScore: kpiRecord.overallScore,
      rating: kpiRecord.rating,
      period: kpiRecord.period,
      scheduledDate: audit.scheduledDate.toLocaleDateString()
    };

    // Send to specified recipients
    if (recipients.includes('Compliance Team')) {
      console.log(`[EMAIL] Audit notification sent to Compliance Team for FE: ${user.name}`);
    }
    if (recipients.includes('HOD')) {
      console.log(`[EMAIL] Audit notification sent to HOD for FE: ${user.name}`);
    }

    // TODO: Implement actual email sending using emailService
    // await emailService.sendAuditScheduleEmail(emailData, recipients);
  }

  // Send warning notifications via email
  async sendWarningNotifications(user, kpiRecord, recipients) {
    const emailData = {
      fe: user.name,
      feEmail: user.email,
      kpiScore: kpiRecord.overallScore,
      rating: kpiRecord.rating,
      period: kpiRecord.period,
      warningReason: `Performance below acceptable standards (${kpiRecord.overallScore}%)`
    };

    // Send to specified recipients
    for (const recipient of recipients) {
      console.log(`[EMAIL] Warning letter sent to ${recipient} for FE: ${user.name}`);
    }

    // TODO: Implement actual email sending using emailService
    // await emailService.sendWarningLetterEmail(emailData, recipients);
  }

  // Create training assignment - ENHANCED with condition tracking
  async createTrainingAssignment(user, trainingType, kpiRecord, conditionMet = null) {
    const trainingAssignment = new TrainingAssignment({
      userId: user._id,
      trainingType: trainingType,
      assignedBy: 'system',
      assignedAt: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'assigned',
      priority: 'high',
      reason: conditionMet || `KPI Score: ${kpiRecord.overallScore}% (${kpiRecord.rating})`,
      notes: `Automatically assigned based on KPI performance for period ${kpiRecord.period}`
    });

    await trainingAssignment.save();
    return trainingAssignment;
  }

  // Create audit schedule - ENHANCED with condition tracking
  async createAuditSchedule(user, auditType, kpiRecord, conditionMet = null) {
    const auditSchedule = new AuditSchedule({
      userId: user._id,
      auditType: auditType,
      scheduledBy: 'system',
      scheduledAt: new Date(),
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: 'scheduled',
      priority: 'high',
      reason: conditionMet || `KPI Score: ${kpiRecord.overallScore}% (${kpiRecord.rating})`,
      notes: `Automatically scheduled based on KPI performance for period ${kpiRecord.period}`
    });

    await auditSchedule.save();
    return auditSchedule;
  }

  // Send warning letter
  async sendWarningLetter(user, kpiRecord) {
    const notification = new Notification({
      userId: user._id,
      type: 'warning',
      title: 'Performance Warning Letter',
      message: `Your KPI score of ${kpiRecord.overallScore}% (${kpiRecord.rating}) requires immediate attention. Please improve your performance to meet company standards.`,
      priority: 'high',
      isRead: false
    });

    await notification.save();
    return notification;
  }

  // Get all pending triggers
  async getPendingTriggers() {
    const pendingTraining = await TrainingAssignment.find({ status: 'assigned' })
      .populate('userId', 'name email')
      .sort({ assignedAt: -1 });

    const pendingAudits = await AuditSchedule.find({ status: 'scheduled' })
      .populate('userId', 'name email')
      .sort({ scheduledAt: -1 });

    return {
      training: pendingTraining,
      audits: pendingAudits
    };
  }

  // Get trigger history for a user
  async getTriggerHistory(userId, limit = 10) {
    const trainingAssignments = await TrainingAssignment.find({ userId })
      .sort({ assignedAt: -1 })
      .limit(limit);

    const auditSchedules = await AuditSchedule.find({ userId })
      .sort({ scheduledAt: -1 })
      .limit(limit);

    return {
      training: trainingAssignments,
      audits: auditSchedules
    };
  }
}

module.exports = new KPITriggerService();