const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates for different scenarios
const emailTemplates = {
  // Training notification template
  training: (data) => ({
    subject: `Training Required: ${data.trainingType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Training Assignment Notification</h2>
          <p>Dear ${data.userName},</p>
          <p>Based on your recent performance evaluation, you have been assigned to complete the following training:</p>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #1976d2; margin: 0;">${data.trainingType}</h3>
          </div>
          
          <p><strong>Reason:</strong> ${data.reason}</p>
          <p><strong>Required Completion Date:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.dueDate}</span></p>
          
          ${data.trainingLink ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${data.trainingLink}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Training Module</a>
            </div>
          ` : ''}
          
          <p>Please log in to the training platform to access your assigned module.</p>
          <p>Best regards,<br>Training Team</p>
        </div>
      </div>
    `
  }),

  // Training assignment template (enhanced)
  trainingAssignment: (data) => ({
    subject: `Training Assignment: ${data.trainingTypes?.join(', ') || 'Multiple Trainings'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Training Assignment Notification</h2>
          <p>Dear ${data.userName},</p>
          <p>Based on your recent performance evaluation, you have been assigned ${data.trainingCount} training(s):</p>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #2e7d32; margin: 0 0 10px 0;">Assigned Trainings:</h3>
            <ul style="margin: 0;">
              ${data.trainingTypes?.map(type => `<li style="margin: 5px 0;">${type.replace('_', ' ').toUpperCase()}</li>`).join('') || ''}
            </ul>
          </div>
          
          <p><strong>Due Date:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.dueDate}</span></p>
          <p><strong>Priority:</strong> <span style="color: ${data.priority === 'high' ? '#d32f2f' : '#f57c00'}; font-weight: bold;">${data.priority?.toUpperCase()}</span></p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/training" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Training Platform</a>
          </div>
          
          <p>Best regards,<br>Training Team</p>
        </div>
      </div>
    `
  }),

  // Audit notification template
  audit: (data) => ({
    subject: `Audit Notification: ${data.auditType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Audit Notification</h2>
          <p>Dear Compliance Team,</p>
          <p>An audit has been triggered for:</p>
          
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Field Executive:</strong> ${data.userName} (${data.employeeId})</p>
            <p><strong>Audit Type:</strong> ${data.auditType}</p>
            <p><strong>Trigger Reason:</strong> ${data.reason}</p>
            <p><strong>KPI Score:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.kpiScore}%</span></p>
            <p><strong>Scheduled Date:</strong> ${data.scheduledDate}</p>
          </div>
          
          <p>Please schedule and complete the audit at your earliest convenience.</p>
          <p>Best regards,<br>System Administrator</p>
        </div>
      </div>
    `
  }),

  // Audit notification template (enhanced)
  auditNotification: (data) => ({
    subject: `Audit Notification: ${data.auditTypes?.join(', ') || 'Multiple Audits'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Audit Notification</h2>
          <p>Dear Compliance Team,</p>
          <p>${data.auditCount} audit(s) have been triggered for:</p>
          
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Field Executive:</strong> ${data.userName} (${data.employeeId})</p>
            <p><strong>Audit Types:</strong> ${data.auditTypes?.join(', ')}</p>
            <p><strong>KPI Score:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.kpiScore}%</span></p>
            <p><strong>Priority:</strong> <span style="color: ${data.priority === 'high' ? '#d32f2f' : '#f57c00'}; font-weight: bold;">${data.priority?.toUpperCase()}</span></p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/admin/audits" style="background-color: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Audit Dashboard</a>
          </div>
          
          <p>Please schedule and complete the audit(s) at your earliest convenience.</p>
          <p>Best regards,<br>System Administrator</p>
        </div>
      </div>
    `
  }),

  // Warning letter template
  warning: (data) => ({
    subject: 'Performance Warning Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #d32f2f; margin-bottom: 20px;">Performance Warning Notice</h2>
          <p>Dear ${data.userName},</p>
          <p>This letter serves as a formal warning regarding your recent performance evaluation:</p>
          
          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #d32f2f;">
            <ul style="margin: 0;">
              <li><strong>Overall KPI Score:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.kpiScore}%</span></li>
              <li><strong>Rating:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.rating}</span></li>
              <li><strong>Evaluation Period:</strong> ${data.period}</li>
            </ul>
          </div>
          
          <p><strong>Areas requiring immediate improvement:</strong></p>
          <ul style="background-color: #fff3e0; padding: 15px; border-radius: 5px;">
            ${data.improvementAreas?.map(area => `<li style="margin: 5px 0;">${area}</li>`).join('') || ''}
          </ul>
          
          <p>Please note that immediate improvement is required in these areas. Support and training will be provided to help you meet the expected performance standards.</p>
          <p>Best regards,<br>Management Team</p>
        </div>
      </div>
    `
  }),

  // Warning letter template (enhanced)
  warningLetter: (data) => ({
    subject: 'Performance Warning Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #d32f2f; margin-bottom: 20px;">Performance Warning Notice</h2>
          <p>Dear ${data.userName},</p>
          <p>This letter serves as a formal warning regarding your recent performance evaluation:</p>
          
          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #d32f2f;">
            <ul style="margin: 0;">
              <li><strong>Overall KPI Score:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.kpiScore}%</span></li>
              <li><strong>Rating:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.rating}</span></li>
              <li><strong>Evaluation Period:</strong> ${data.period}</li>
              <li><strong>Warning Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          
          <p><strong>Areas requiring immediate improvement:</strong></p>
          <ul style="background-color: #fff3e0; padding: 15px; border-radius: 5px;">
            ${data.improvementAreas?.map(area => `<li style="margin: 5px 0;">${area}</li>`).join('') || ''}
          </ul>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #2e7d32; margin: 0 0 10px 0;">Support Available:</h3>
            <ul style="margin: 0;">
              <li>Training modules will be assigned</li>
              <li>Regular guidance from your coordinator</li>
              <li>Weekly review meetings with your manager</li>
              <li>Performance improvement plan</li>
            </ul>
          </div>
          
          <p>Please note that immediate improvement is required in these areas. Support and training will be provided to help you meet the expected performance standards.</p>
          <p>Best regards,<br>Management Team</p>
        </div>
      </div>
    `
  }),

  // KPI score notification template
  kpiScore: (data) => ({
    subject: `KPI Score Update: ${data.period}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">KPI Score Notification</h2>
          <p>Dear ${data.userName},</p>
          <p>Your performance evaluation for ${data.period} has been completed:</p>
          
          <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; margin: 15px 0;">
            <tr style="background-color: #e3f2fd;">
              <th style="text-align: left;">Metric</th>
              <th style="text-align: center;">Score</th>
              <th style="text-align: center;">Rating</th>
            </tr>
            <tr>
              <td>TAT</td>
              <td style="text-align: center;">${data.scores.tat.score}/20</td>
              <td style="text-align: center;">${data.scores.tat.percentage}%</td>
            </tr>
            <tr>
              <td>Major Negativity</td>
              <td style="text-align: center;">${data.scores.majorNegativity.score}/20</td>
              <td style="text-align: center;">${data.scores.majorNegativity.percentage}%</td>
            </tr>
            <tr>
              <td>Quality</td>
              <td style="text-align: center;">${data.scores.quality.score}/20</td>
              <td style="text-align: center;">${data.scores.quality.percentage}%</td>
            </tr>
            <tr>
              <td>Neighbor Check</td>
              <td style="text-align: center;">${data.scores.neighborCheck.score}/10</td>
              <td style="text-align: center;">${data.scores.neighborCheck.percentage}%</td>
            </tr>
            <tr>
              <td>Negativity</td>
              <td style="text-align: center;">${data.scores.negativity.score}/10</td>
              <td style="text-align: center;">${data.scores.negativity.percentage}%</td>
            </tr>
            <tr>
              <td>App Usage</td>
              <td style="text-align: center;">${data.scores.appUsage.score}/10</td>
              <td style="text-align: center;">${data.scores.appUsage.percentage}%</td>
            </tr>
            <tr>
              <td>Insufficiency</td>
              <td style="text-align: center;">${data.scores.insufficiency.score}/10</td>
              <td style="text-align: center;">${data.scores.insufficiency.percentage}%</td>
            </tr>
            <tr style="background-color: #e8f5e8; font-weight: bold;">
              <td colspan="2"><strong>Overall Score</strong></td>
              <td style="text-align: center;"><strong>${data.overallScore}%</strong></td>
            </tr>
            <tr style="background-color: #e8f5e8; font-weight: bold;">
              <td colspan="2"><strong>Rating</strong></td>
              <td style="text-align: center;"><strong>${data.rating}</strong></td>
            </tr>
          </table>
          
          ${data.actions && data.actions.length > 0 ? `
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Required Actions:</strong></p>
              <ul>
                ${data.actions.map(action => `<li style="margin: 5px 0;">${action}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <p>Best regards,<br>Performance Management Team</p>
        </div>
      </div>
    `
  }),

  // KPI score notification template (enhanced)
  kpiScoreNotification: (data) => ({
    subject: `KPI Score Update: ${data.period}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">KPI Score Notification</h2>
          <p>Dear ${data.userName},</p>
          <p>Your performance evaluation for ${data.period} has been completed:</p>
          
          <div style="background-color: ${data.overallScore >= 70 ? '#e8f5e8' : data.overallScore >= 50 ? '#fff3e0' : '#ffebee'}; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${data.overallScore >= 70 ? '#4caf50' : data.overallScore >= 50 ? '#ff9800' : '#f44336'};">
            <h3 style="margin: 0 0 10px 0; color: ${data.overallScore >= 70 ? '#2e7d32' : data.overallScore >= 50 ? '#f57c00' : '#d32f2f'};">Overall Performance: ${data.overallScore}% (${data.rating})</h3>
          </div>
          
          <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; margin: 15px 0;">
            <tr style="background-color: #e3f2fd;">
              <th style="text-align: left;">Metric</th>
              <th style="text-align: center;">Score</th>
              <th style="text-align: center;">Rating</th>
            </tr>
            <tr>
              <td>TAT</td>
              <td style="text-align: center;">${data.scores.tat.score}/20</td>
              <td style="text-align: center;">${data.scores.tat.percentage}%</td>
            </tr>
            <tr>
              <td>Major Negativity</td>
              <td style="text-align: center;">${data.scores.majorNegativity.score}/20</td>
              <td style="text-align: center;">${data.scores.majorNegativity.percentage}%</td>
            </tr>
            <tr>
              <td>Quality</td>
              <td style="text-align: center;">${data.scores.quality.score}/20</td>
              <td style="text-align: center;">${data.scores.quality.percentage}%</td>
            </tr>
            <tr>
              <td>Neighbor Check</td>
              <td style="text-align: center;">${data.scores.neighborCheck.score}/10</td>
              <td style="text-align: center;">${data.scores.neighborCheck.percentage}%</td>
            </tr>
            <tr>
              <td>Negativity</td>
              <td style="text-align: center;">${data.scores.negativity.score}/10</td>
              <td style="text-align: center;">${data.scores.negativity.percentage}%</td>
            </tr>
            <tr>
              <td>App Usage</td>
              <td style="text-align: center;">${data.scores.appUsage.score}/10</td>
              <td style="text-align: center;">${data.scores.appUsage.percentage}%</td>
            </tr>
            <tr>
              <td>Insufficiency</td>
              <td style="text-align: center;">${data.scores.insufficiency.score}/10</td>
              <td style="text-align: center;">${data.scores.insufficiency.percentage}%</td>
            </tr>
          </table>
          
          ${data.actions && data.actions.length > 0 ? `
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Required Actions:</strong></p>
              <ul>
                ${data.actions.map(action => `<li style="margin: 5px 0;">${action}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/dashboard" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a>
          </div>
          
          <p>Best regards,<br>Performance Management Team</p>
        </div>
      </div>
    `
  }),

  // Performance improvement template
  performanceImprovement: (data) => ({
    subject: 'Performance Improvement Suggestions',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Performance Improvement Suggestions</h2>
          <p>Dear ${data.userName},</p>
          <p>Based on your recent performance evaluation, here are some suggestions to help improve your performance:</p>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #2e7d32; margin: 0 0 10px 0;">Improvement Areas:</h3>
            <ul style="margin: 0;">
              ${data.improvementAreas?.map(area => `<li style="margin: 5px 0;">${area}</li>`).join('') || ''}
            </ul>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #1976d2; margin: 0 0 10px 0;">Recommended Actions:</h3>
            <ul style="margin: 0;">
              <li style="margin: 5px 0;">Complete assigned training modules</li>
              <li style="margin: 5px 0;">Focus on areas with low scores</li>
              <li style="margin: 5px 0;">Seek guidance from your coordinator</li>
              <li style="margin: 5px 0;">Regular performance reviews</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/training" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Training Modules</a>
          </div>
          
          <p>Best regards,<br>Performance Management Team</p>
        </div>
      </div>
    `
  }),

  // NEW: Enhanced Email Templates (ADDED WITHOUT TOUCHING EXISTING)
  
  // Training notification template for stakeholders
  trainingNotification: (data) => ({
    subject: `Training Assignment Notification: ${data.userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Training Assignment Notification</h2>
          <p>Dear ${data.recipientName},</p>
          <p>This is to inform you that training has been assigned to the following Field Executive:</p>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Field Executive:</strong> ${data.userName} (${data.employeeId})</p>
            <p><strong>Training Types:</strong> ${data.trainingTypes.join(', ')}</p>
            <p><strong>Reason:</strong> ${data.reason}</p>
            <p><strong>Priority:</strong> <span style="color: ${data.priority === 'high' ? '#d32f2f' : '#f57c00'}; font-weight: bold;">${data.priority?.toUpperCase()}</span></p>
            <p><strong>Due Date:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.dueDate}</span></p>
            <p><strong>Current KPI Score:</strong> ${data.kpiScore}%</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.platformLink}/admin/training" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Training Dashboard</a>
          </div>
          
          <p>Please monitor the training progress and provide necessary support.</p>
          <p>Best regards,<br>Training Team</p>
        </div>
      </div>
    `
  }),

  // Warning notification template for stakeholders
  warningNotification: (data) => ({
    subject: `Performance Warning Notification: ${data.userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #d32f2f; margin-bottom: 20px;">Performance Warning Notification</h2>
          <p>Dear ${data.recipientName},</p>
          <p>This is to inform you that a performance warning has been issued to the following Field Executive:</p>
          
          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #d32f2f;">
            <p><strong>Field Executive:</strong> ${data.userName} (${data.employeeId})</p>
            <p><strong>KPI Score:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.kpiScore}%</span></p>
            <p><strong>Rating:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.rating}</span></p>
            <p><strong>Evaluation Period:</strong> ${data.period}</p>
          </div>
          
          <p><strong>Areas requiring improvement:</strong></p>
          <ul style="background-color: #fff3e0; padding: 15px; border-radius: 5px;">
            ${data.improvementAreas.map(area => `<li>${area}</li>`).join('')}
          </ul>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.platformLink}/admin/performance" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Performance Dashboard</a>
          </div>
          
          <p>Please provide necessary support and monitoring to help improve performance.</p>
          <p>Best regards,<br>HR Team</p>
        </div>
      </div>
    `
  }),

  // Reward notification template for stakeholders
  rewardNotification: (data) => ({
    subject: `Award Notification: ${data.userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Award Notification</h2>
          <p>Dear ${data.recipientName},</p>
          <p>We are pleased to inform you that the following Field Executive has been recognized:</p>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Field Executive:</strong> ${data.userName} (${data.employeeId})</p>
            <p><strong>Award Type:</strong> ${data.awardType}</p>
            <p><strong>Award Title:</strong> ${data.awardTitle}</p>
            <p><strong>Award Date:</strong> ${data.awardDate}</p>
            ${data.amount ? `<p><strong>Amount:</strong> ₹${data.amount}</p>` : ''}
            <p><strong>Description:</strong> ${data.description}</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.platformLink}/admin/awards" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Awards Dashboard</a>
          </div>
          
          <p>Congratulations to the awardee and thank you for your continued support.</p>
          <p>Best regards,<br>HR Team</p>
        </div>
      </div>
    `
  }),

  // Custom template for email templates
  custom: (data) => ({
    subject: data.subject || 'Email from E-Learning Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">${data.subject || 'Email Notification'}</h2>
          <p>Dear ${data.userName},</p>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #1976d2;">
            ${data.customContent || data.content || 'This is a test email from the E-Learning Platform.'}
          </div>
          <p>Best regards,<br>E-Learning Platform Team</p>
        </div>
      </div>
    `
  })
};

// Function to send emails with logging
const sendEmail = async (to, template, data, emailLogData = null) => {
  try {
    const { subject, html } = emailTemplates[template](data);

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'E-Learning Platform'}" <${process.env.FROM_EMAIL || 'noreply@company.com'}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    // Log email activity if emailLogData is provided
    if (emailLogData) {
      await logEmailActivity({
        ...emailLogData,
        status: 'sent',
        sentAt: new Date(),
        deliveredAt: new Date()
      });
    }

    return info;
  } catch (error) {
    console.error('Email sending failed:', error);

    // Log failed email if emailLogData is provided
    if (emailLogData) {
      await logEmailActivity({
        ...emailLogData,
        status: 'failed',
        errorMessage: error.message,
        sentAt: new Date()
      });
    }

    throw error;
  }
};

// Function to schedule emails for future delivery
const scheduleEmail = async (to, template, data, scheduledFor, emailLogData = null) => {
  try {
    const { subject, html } = emailTemplates[template](data);

    // Log scheduled email
    if (emailLogData) {
      await logEmailActivity({
        ...emailLogData,
        status: 'pending',
        scheduledFor: new Date(scheduledFor),
        emailContent: html
      });
    }

    console.log(`Email scheduled for ${scheduledFor}:`, subject);
    return { messageId: 'scheduled', scheduledFor };
  } catch (error) {
    console.error('Email scheduling failed:', error);
    throw error;
  }
};

// Function to retry failed emails
const retryFailedEmail = async (emailLogId) => {
  try {
    const emailLog = await EmailLog.findById(emailLogId);
    if (!emailLog) {
      throw new Error('Email log not found');
    }

    if (!emailLog.canRetry()) {
      throw new Error('Email cannot be retried - max retries exceeded');
    }

    // Increment retry count
    await emailLog.incrementRetry();

    // Resend email
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'E-Learning Platform'}" <${process.env.FROM_EMAIL || 'noreply@company.com'}>`,
      to: emailLog.recipientEmail,
      subject: emailLog.subject,
      html: emailLog.emailContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email retry successful:', info.messageId);

    // Update email log
    await emailLog.markAsSent();

    return info;
  } catch (error) {
    console.error('Email retry failed:', error);
    
    // Update email log with failure
    const emailLog = await EmailLog.findById(emailLogId);
    if (emailLog) {
      await emailLog.markAsFailed(error.message);
    }

    throw error;
  }
};

// Helper function to get recipient list based on role
const getRecipientsByRole = async (roles, userId = null) => {
  const User = require('../models/User');
  const recipients = [];

  for (const role of roles) {
    switch (role) {
      case 'fe':
        if (userId) {
          const fe = await User.findById(userId).select('email');
          if (fe) recipients.push(fe.email);
        }
        break;
      case 'coordinator':
        const coordinators = await User.find({ userType: 'admin', department: 'Coordination' }).select('email');
        recipients.push(...coordinators.map(c => c.email));
        break;
      case 'manager':
        const managers = await User.find({ userType: 'admin', department: 'Management' }).select('email');
        recipients.push(...managers.map(m => m.email));
        break;
      case 'hod':
        const hods = await User.find({ userType: 'admin', department: 'HOD' }).select('email');
        recipients.push(...hods.map(h => h.email));
        break;
      case 'compliance':
        const compliance = await User.find({ userType: 'admin', department: 'Compliance' }).select('email');
        recipients.push(...compliance.map(c => c.email));
        break;
    }
  }

  return [...new Set(recipients)]; // Remove duplicates
};

// Helper function to get recipients by trigger type
const getRecipientsByTrigger = async (triggerType, userId = null) => {
  const User = require('../models/User');
  const recipients = [];

  switch (triggerType) {
    case 'training':
      // Training emails: FE, Coordinator, Manager, HOD
      if (userId) {
        const fe = await User.findById(userId).select('email');
        if (fe) recipients.push({ email: fe.email, role: 'fe' });
      }
      const coordinators = await User.find({ userType: 'admin', department: 'Coordination' }).select('email');
      recipients.push(...coordinators.map(c => ({ email: c.email, role: 'coordinator' })));
      const managers = await User.find({ userType: 'admin', department: 'Management' }).select('email');
      recipients.push(...managers.map(m => ({ email: m.email, role: 'manager' })));
      const hods = await User.find({ userType: 'admin', department: 'HOD' }).select('email');
      recipients.push(...hods.map(h => ({ email: h.email, role: 'hod' })));
      break;

    case 'audit':
      // Audit emails: Compliance Team, HOD
      const compliance = await User.find({ userType: 'admin', department: 'Compliance' }).select('email');
      recipients.push(...compliance.map(c => ({ email: c.email, role: 'compliance' })));
      const hodAudit = await User.find({ userType: 'admin', department: 'HOD' }).select('email');
      recipients.push(...hodAudit.map(h => ({ email: h.email, role: 'hod' })));
      break;

    case 'warning':
      // Warning emails: FE, Coordinator, Manager, Compliance, HOD
      if (userId) {
        const fe = await User.findById(userId).select('email');
        if (fe) recipients.push({ email: fe.email, role: 'fe' });
      }
      const coordinatorsWarning = await User.find({ userType: 'admin', department: 'Coordination' }).select('email');
      recipients.push(...coordinatorsWarning.map(c => ({ email: c.email, role: 'coordinator' })));
      const managersWarning = await User.find({ userType: 'admin', department: 'Management' }).select('email');
      recipients.push(...managersWarning.map(m => ({ email: m.email, role: 'manager' })));
      const complianceWarning = await User.find({ userType: 'admin', department: 'Compliance' }).select('email');
      recipients.push(...complianceWarning.map(c => ({ email: c.email, role: 'compliance' })));
      const hodWarning = await User.find({ userType: 'admin', department: 'HOD' }).select('email');
      recipients.push(...hodWarning.map(h => ({ email: h.email, role: 'hod' })));
      break;

    default:
      // Default: FE, Coordinator, Manager
      if (userId) {
        const fe = await User.findById(userId).select('email');
        if (fe) recipients.push({ email: fe.email, role: 'fe' });
      }
      const coordinatorsDefault = await User.find({ userType: 'admin', department: 'Coordination' }).select('email');
      recipients.push(...coordinatorsDefault.map(c => ({ email: c.email, role: 'coordinator' })));
      const managersDefault = await User.find({ userType: 'admin', department: 'Management' }).select('email');
      recipients.push(...managersDefault.map(m => ({ email: m.email, role: 'manager' })));
      break;
  }

  // Remove duplicates
  const uniqueRecipients = recipients.filter((recipient, index, self) =>
    index === self.findIndex(r => r.email === recipient.email)
  );

  return uniqueRecipients;
};

// Function to log email activity
const logEmailActivity = async (emailData) => {
  try {
    const emailLog = new EmailLog({
      recipientEmail: emailData.recipientEmail,
      recipientRole: emailData.recipientRole,
      templateType: emailData.templateType,
      subject: emailData.subject,
      status: emailData.status,
      kpiTriggerId: emailData.kpiTriggerId,
      userId: emailData.userId,
      trainingAssignmentId: emailData.trainingAssignmentId,
      auditScheduleId: emailData.auditScheduleId,
      emailContent: emailData.emailContent,
      sentAt: emailData.sentAt,
      scheduledFor: emailData.scheduledFor,
      deliveredAt: emailData.deliveredAt,
      errorMessage: emailData.errorMessage,
      retryCount: emailData.retryCount || 0,
      maxRetries: emailData.maxRetries || 3
    });

    await emailLog.save();
    console.log('Email activity logged:', emailLog._id);
    return emailLog;
  } catch (error) {
    console.error('Error logging email activity:', error);
    throw error;
  }
};

// Enhanced notification functions for different scenarios
const emailService = {
  // Send KPI trigger emails (main method for automation)
  sendKPITriggerEmails: async (kpiScore, triggers) => {
    const results = [];
    
    for (const trigger of triggers) {
      try {
        const recipients = await getRecipientsByTrigger(trigger.type, kpiScore.userId);
        
        for (const recipient of recipients) {
          const emailLogData = {
            recipientEmail: recipient.email,
            recipientRole: recipient.role,
            templateType: trigger.type,
            kpiTriggerId: kpiScore._id,
            userId: kpiScore.userId
          };

          const result = await sendEmail([recipient.email], trigger.type, trigger.data, emailLogData);
          results.push({ recipient: recipient.email, result, success: true });
        }
      } catch (error) {
        console.error(`Error sending ${trigger.type} email:`, error);
        results.push({ trigger: trigger.type, error: error.message, success: false });
      }
    }

    return results;
  },

  // Send training assignment email
  sendTrainingAssignmentEmail: async (userId, trainingData) => {
    const recipients = await getRecipientsByTrigger('training', userId);
    const results = [];

    for (const recipient of recipients) {
      try {
        const emailLogData = {
          recipientEmail: recipient.email,
          recipientRole: recipient.role,
          templateType: 'trainingAssignment',
          userId: userId,
          trainingAssignmentId: trainingData.trainingAssignmentId
        };

        const result = await sendEmail([recipient.email], 'trainingAssignment', trainingData, emailLogData);
        results.push({ recipient: recipient.email, result, success: true });
      } catch (error) {
        console.error(`Error sending training assignment email to ${recipient.email}:`, error);
        results.push({ recipient: recipient.email, error: error.message, success: false });
      }
    }

    return results;
  },

  // Send audit notification email
  sendAuditNotificationEmail: async (userId, auditData) => {
    const recipients = await getRecipientsByTrigger('audit', userId);
    const results = [];

    for (const recipient of recipients) {
      try {
        const emailLogData = {
          recipientEmail: recipient.email,
          recipientRole: recipient.role,
          templateType: 'auditNotification',
          userId: userId,
          auditScheduleId: auditData.auditScheduleId
        };

        const result = await sendEmail([recipient.email], 'auditNotification', auditData, emailLogData);
        results.push({ recipient: recipient.email, result, success: true });
      } catch (error) {
        console.error(`Error sending audit notification email to ${recipient.email}:`, error);
        results.push({ recipient: recipient.email, error: error.message, success: false });
      }
    }

    return results;
  },

  // Send warning letter email
  sendWarningLetterEmail: async (userId, warningData) => {
    const recipients = await getRecipientsByTrigger('warning', userId);
    const results = [];

    for (const recipient of recipients) {
      try {
        const emailLogData = {
          recipientEmail: recipient.email,
          recipientRole: recipient.role,
          templateType: 'warningLetter',
          userId: userId,
          kpiTriggerId: warningData.kpiTriggerId
        };

        const result = await sendEmail([recipient.email], 'warningLetter', warningData, emailLogData);
        results.push({ recipient: recipient.email, result, success: true });
      } catch (error) {
        console.error(`Error sending warning letter email to ${recipient.email}:`, error);
        results.push({ recipient: recipient.email, error: error.message, success: false });
      }
    }

    return results;
  },

  // Log email activity
  logEmailActivity: async (emailData) => {
    return await logEmailActivity(emailData);
  },

  // Send training notification (legacy method - enhanced)
  sendTrainingNotification: async (userId, trainingData) => {
    const recipients = await getRecipientsByRole(['fe', 'coordinator', 'manager', 'hod'], userId);
    return sendEmail(recipients, 'training', trainingData);
  },

  // Send audit notification (legacy method - enhanced)
  sendAuditNotification: async (userId, auditData) => {
    const recipients = await getRecipientsByRole(['compliance', 'hod'], userId);
    return sendEmail(recipients, 'audit', auditData);
  },

  // Send warning notification (legacy method - enhanced)
  sendWarningNotification: async (userId, warningData) => {
    const recipients = await getRecipientsByRole(['fe', 'coordinator', 'manager', 'compliance', 'hod'], userId);
    return sendEmail(recipients, 'warning', warningData);
  },

  // Send KPI score notification (legacy method - enhanced)
  sendKPIScoreNotification: async (userId, scoreData) => {
    const recipients = await getRecipientsByRole(['fe', 'coordinator', 'manager'], userId);
    return sendEmail(recipients, 'kpiScore', scoreData);
  },

  // Send performance improvement email
  sendPerformanceImprovementEmail: async (userId, improvementData) => {
    const recipients = await getRecipientsByRole(['fe', 'coordinator', 'manager'], userId);
    return sendEmail(recipients, 'performanceImprovement', improvementData);
  },

  // Schedule email for future delivery
  scheduleEmail: async (to, template, data, scheduledFor, emailLogData = null) => {
    return await scheduleEmail(to, template, data, scheduledFor, emailLogData);
  },

  // Retry failed email
  retryFailedEmail: async (emailLogId) => {
    return await retryFailedEmail(emailLogId);
  },

  // Get recipients by trigger type
  getRecipientsByTrigger: async (triggerType, userId = null) => {
    return await getRecipientsByTrigger(triggerType, userId);
  },

  // Get email statistics
  getEmailStats: async (filters = {}) => {
    return await EmailLog.getEmailStats(filters);
  },

  // Get failed emails
  getFailedEmails: async (filters = {}) => {
    return await EmailLog.getFailedEmails(filters);
  },

  // Get pending emails
  getPendingEmails: async (filters = {}) => {
    return await EmailLog.getPendingEmails(filters);
  },

  // Get emails for retry
  getEmailsForRetry: async () => {
    return await EmailLog.getEmailsForRetry();
  },

  // Get template type distribution
  getTemplateTypeDistribution: async (filters = {}) => {
    return await EmailLog.getTemplateTypeDistribution(filters);
  },

  // NEW: Enhanced Training Email Functions (ADDED WITHOUT TOUCHING EXISTING)
  
  // Send training assignment emails to all stakeholders
  sendTrainingAssignmentEmails: async (trainingData) => {
    try {
      const { userId, userName, employeeId, trainingTypes, reason, priority, dueDate, kpiScore } = trainingData;
      
      // Prepare email data
      const emailData = {
        userName,
        employeeId,
        trainingTypes,
        reason,
        priority,
        dueDate,
        kpiScore,
        trainingLink: `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/user/dashboard`,
        platformLink: `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}`
      };

      // Get user details for email addresses
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get stakeholders (FE, Coordinator, Manager, HOD)
      const stakeholders = await getTrainingStakeholders(userId);
      
      const results = [];
      
      // Send email to Field Executive
      if (user.email) {
        const feResult = await sendEmail(
          user.email,
          'trainingAssignment',
          emailData,
          {
            userId,
            templateType: 'trainingAssignment',
            recipientType: 'field_executive',
            priority,
            trainingTypes: trainingTypes.join(', ')
          }
        );
        results.push({ type: 'field_executive', email: user.email, result: feResult });
      }

      // Send emails to stakeholders
      for (const stakeholder of stakeholders) {
        if (stakeholder.email) {
          const stakeholderResult = await sendEmail(
            stakeholder.email,
            'trainingNotification',
            {
              ...emailData,
              stakeholderType: stakeholder.role,
              recipientName: stakeholder.name
            },
            {
              userId,
              templateType: 'trainingNotification',
              recipientType: stakeholder.role,
              priority,
              trainingTypes: trainingTypes.join(', ')
            }
          );
          results.push({ 
            type: stakeholder.role, 
            email: stakeholder.email, 
            result: stakeholderResult 
          });
        }
      }

      return {
        success: true,
        message: 'Training assignment emails sent successfully',
        results
      };

    } catch (error) {
      console.error('Error sending training assignment emails:', error);
      return {
        success: false,
        message: 'Failed to send training assignment emails',
        error: error.message
      };
    }
  },

  // Send audit notification emails to compliance team and HOD
  sendAuditNotificationEmails: async (auditData) => {
    try {
      const { userId, userName, employeeId, auditTypes, kpiScore, priority, reason } = auditData;
      
      // Prepare email data
      const emailData = {
        userName,
        employeeId,
        auditTypes,
        kpiScore,
        priority,
        reason,
        auditCount: auditTypes.length,
        auditLink: `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/admin/audits`
      };

      // Get compliance team and HOD emails
      const complianceEmails = await getComplianceTeamEmails();
      const hodEmails = await getHODEmails();
      
      const allRecipients = [...complianceEmails, ...hodEmails];
      const results = [];
      
      // Send emails to all recipients
      for (const recipient of allRecipients) {
        if (recipient.email) {
          const result = await sendEmail(
            recipient.email,
            'auditNotification',
            {
              ...emailData,
              recipientName: recipient.name,
              recipientRole: recipient.role
            },
            {
              userId,
              templateType: 'auditNotification',
              recipientType: recipient.role,
              priority,
              auditTypes: auditTypes.join(', ')
            }
          );
          results.push({ 
            type: recipient.role, 
            email: recipient.email, 
            result 
          });
        }
      }

      return {
        success: true,
        message: 'Audit notification emails sent successfully',
        results
      };

    } catch (error) {
      console.error('Error sending audit notification emails:', error);
      return {
        success: false,
        message: 'Failed to send audit notification emails',
        error: error.message
      };
    }
  },

  // Send warning letter emails to all stakeholders
  sendWarningLetterEmails: async (warningData) => {
    try {
      const { userId, userName, employeeId, kpiScore, rating, period, improvementAreas } = warningData;
      
      // Prepare email data
      const emailData = {
        userName,
        employeeId,
        kpiScore,
        rating,
        period,
        improvementAreas,
        platformLink: `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}`
      };

      // Get user details
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get stakeholders (FE, Coordinator, Manager, Compliance, HOD)
      const stakeholders = await getWarningStakeholders(userId);
      
      const results = [];
      
      // Send warning letter to Field Executive
      if (user.email) {
        const feResult = await sendEmail(
          user.email,
          'warning',
          emailData,
          {
            userId,
            templateType: 'warning',
            recipientType: 'field_executive',
            priority: 'high',
            kpiScore
          }
        );
        results.push({ type: 'field_executive', email: user.email, result: feResult });
      }

      // Send notification emails to stakeholders
      for (const stakeholder of stakeholders) {
        if (stakeholder.email) {
          const stakeholderResult = await sendEmail(
            stakeholder.email,
            'warningNotification',
            {
              ...emailData,
              stakeholderType: stakeholder.role,
              recipientName: stakeholder.name
            },
            {
              userId,
              templateType: 'warningNotification',
              recipientType: stakeholder.role,
              priority: 'high',
              kpiScore
            }
          );
          results.push({ 
            type: stakeholder.role, 
            email: stakeholder.email, 
            result: stakeholderResult 
          });
        }
      }

      return {
        success: true,
        message: 'Warning letter emails sent successfully',
        results
      };

    } catch (error) {
      console.error('Error sending warning letter emails:', error);
      return {
        success: false,
        message: 'Failed to send warning letter emails',
        error: error.message
      };
    }
  },

  // Send reward/recognition emails to all stakeholders
  sendRewardEmails: async (rewardData) => {
    try {
      const { userId, userName, employeeId, awardType, awardTitle, awardDate, description, amount } = rewardData;
      
      // Prepare email data
      const emailData = {
        userName,
        employeeId,
        awardType,
        awardTitle,
        awardDate,
        description,
        amount,
        platformLink: `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}`
      };

      // Get user details
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get stakeholders (FE, Coordinator, Manager, Compliance, HOD)
      const stakeholders = await getRewardStakeholders(userId);
      
      const results = [];
      
      // Send reward email to Field Executive
      if (user.email) {
        const feResult = await sendEmail(
          user.email,
          'reward',
          emailData,
          {
            userId,
            templateType: 'reward',
            recipientType: 'field_executive',
            priority: 'medium',
            awardType
          }
        );
        results.push({ type: 'field_executive', email: user.email, result: feResult });
      }

      // Send notification emails to stakeholders
      for (const stakeholder of stakeholders) {
        if (stakeholder.email) {
          const stakeholderResult = await sendEmail(
            stakeholder.email,
            'rewardNotification',
            {
              ...emailData,
              stakeholderType: stakeholder.role,
              recipientName: stakeholder.name
            },
            {
              userId,
              templateType: 'rewardNotification',
              recipientType: stakeholder.role,
              priority: 'medium',
              awardType
            }
          );
          results.push({ 
            type: stakeholder.role, 
            email: stakeholder.email, 
            result: stakeholderResult 
          });
        }
      }

      return {
        success: true,
        message: 'Reward emails sent successfully',
        results
      };

    } catch (error) {
      console.error('Error sending reward emails:', error);
      return {
        success: false,
        message: 'Failed to send reward emails',
        error: error.message
      };
    }
  }
};

// NEW: Helper Functions for Enhanced Email Service (ADDED WITHOUT TOUCHING EXISTING)

// Get training stakeholders (Coordinator, Manager, HOD)
async function getTrainingStakeholders(userId) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) return [];

    const stakeholders = [];
    
    // Get coordinator
    if (user.coordinatorId) {
      const coordinator = await User.findById(user.coordinatorId);
      if (coordinator && coordinator.email) {
        stakeholders.push({
          name: coordinator.name,
          email: coordinator.email,
          role: 'coordinator'
        });
      }
    }

    // Get manager
    if (user.managerId) {
      const manager = await User.findById(user.managerId);
      if (manager && manager.email) {
        stakeholders.push({
          name: manager.name,
          email: manager.email,
          role: 'manager'
        });
      }
    }

    // Get HOD (Head of Department)
    const hodUsers = await User.find({ userType: 'hod', isActive: true });
    hodUsers.forEach(hod => {
      if (hod.email) {
        stakeholders.push({
          name: hod.name,
          email: hod.email,
          role: 'hod'
        });
      }
    });

    return stakeholders;
  } catch (error) {
    console.error('Error getting training stakeholders:', error);
    return [];
  }
}

// Get compliance team emails
async function getComplianceTeamEmails() {
  try {
    const User = require('../models/User');
    const complianceUsers = await User.find({ 
      userType: { $in: ['compliance', 'admin'] }, 
      isActive: true 
    });
    
    return complianceUsers.map(user => ({
      name: user.name,
      email: user.email,
      role: user.userType
    })).filter(user => user.email);
  } catch (error) {
    console.error('Error getting compliance team emails:', error);
    return [];
  }
}

// Get HOD emails
async function getHODEmails() {
  try {
    const User = require('../models/User');
    const hodUsers = await User.find({ 
      userType: 'hod', 
      isActive: true 
    });
    
    return hodUsers.map(user => ({
      name: user.name,
      email: user.email,
      role: 'hod'
    })).filter(user => user.email);
  } catch (error) {
    console.error('Error getting HOD emails:', error);
    return [];
  }
}

// Get warning stakeholders (Coordinator, Manager, Compliance, HOD)
async function getWarningStakeholders(userId) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) return [];

    const stakeholders = [];
    
    // Get coordinator
    if (user.coordinatorId) {
      const coordinator = await User.findById(user.coordinatorId);
      if (coordinator && coordinator.email) {
        stakeholders.push({
          name: coordinator.name,
          email: coordinator.email,
          role: 'coordinator'
        });
      }
    }

    // Get manager
    if (user.managerId) {
      const manager = await User.findById(user.managerId);
      if (manager && manager.email) {
        stakeholders.push({
          name: manager.name,
          email: manager.email,
          role: 'manager'
        });
      }
    }

    // Get compliance team
    const complianceEmails = await getComplianceTeamEmails();
    stakeholders.push(...complianceEmails);

    // Get HOD
    const hodEmails = await getHODEmails();
    stakeholders.push(...hodEmails);

    return stakeholders;
  } catch (error) {
    console.error('Error getting warning stakeholders:', error);
    return [];
  }
}

// Get reward stakeholders (Coordinator, Manager, Compliance, HOD)
async function getRewardStakeholders(userId) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) return [];

    const stakeholders = [];
    
    // Get coordinator
    if (user.coordinatorId) {
      const coordinator = await User.findById(user.coordinatorId);
      if (coordinator && coordinator.email) {
        stakeholders.push({
          name: coordinator.name,
          email: coordinator.email,
          role: 'coordinator'
        });
      }
    }

    // Get manager
    if (user.managerId) {
      const manager = await User.findById(user.managerId);
      if (manager && manager.email) {
        stakeholders.push({
          name: manager.name,
          email: manager.email,
          role: 'manager'
        });
      }
    }

    // Get compliance team
    const complianceEmails = await getComplianceTeamEmails();
    stakeholders.push(...complianceEmails);

    // Get HOD
    const hodEmails = await getHODEmails();
    stakeholders.push(...hodEmails);

    return stakeholders;
  } catch (error) {
    console.error('Error getting reward stakeholders:', error);
    return [];
  }
}

module.exports = emailService;