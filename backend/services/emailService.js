const nodemailer = require('nodemailer');

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
      <h2>Training Assignment Notification</h2>
      <p>Dear ${data.userName},</p>
      <p>Based on your recent performance evaluation, you have been assigned to complete the following training:</p>
      <h3>${data.trainingType}</h3>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p><strong>Required Completion Date:</strong> ${data.dueDate}</p>
      <p>Please log in to the training platform to access your assigned module.</p>
      <p>Best regards,<br>Training Team</p>
    `
  }),

  // Audit notification template
  audit: (data) => ({
    subject: `Audit Notification: ${data.auditType}`,
    html: `
      <h2>Audit Notification</h2>
      <p>Dear Compliance Team,</p>
      <p>An audit has been triggered for:</p>
      <p><strong>Field Executive:</strong> ${data.userName}</p>
      <p><strong>Audit Type:</strong> ${data.auditType}</p>
      <p><strong>Trigger Reason:</strong> ${data.reason}</p>
      <p><strong>KPI Score:</strong> ${data.kpiScore}</p>
      <p>Please schedule and complete the audit at your earliest convenience.</p>
      <p>Best regards,<br>System Administrator</p>
    `
  }),

  // Warning letter template
  warning: (data) => ({
    subject: 'Performance Warning Notice',
    html: `
      <h2>Performance Warning Notice</h2>
      <p>Dear ${data.userName},</p>
      <p>This letter serves as a formal warning regarding your recent performance evaluation:</p>
      <ul>
        <li>Overall KPI Score: ${data.kpiScore}%</li>
        <li>Rating: ${data.rating}</li>
        <li>Evaluation Period: ${data.period}</li>
      </ul>
      <p>Areas requiring immediate improvement:</p>
      <ul>
        ${data.improvementAreas.map(area => `<li>${area}</li>`).join('')}
      </ul>
      <p>Please note that immediate improvement is required in these areas. Support and training will be provided to help you meet the expected performance standards.</p>
      <p>Best regards,<br>Management Team</p>
    `
  }),

  // KPI score notification template
  kpiScore: (data) => ({
    subject: `KPI Score Update: ${data.period}`,
    html: `
      <h2>KPI Score Notification</h2>
      <p>Dear ${data.userName},</p>
      <p>Your performance evaluation for ${data.period} has been completed:</p>
      <table border="1" cellpadding="10" style="border-collapse: collapse;">
        <tr>
          <th>Metric</th>
          <th>Score</th>
          <th>Rating</th>
        </tr>
        <tr>
          <td>TAT</td>
          <td>${data.scores.tat.score}/20</td>
          <td>${data.scores.tat.percentage}%</td>
        </tr>
        <tr>
          <td>Major Negativity</td>
          <td>${data.scores.majorNegativity.score}/20</td>
          <td>${data.scores.majorNegativity.percentage}%</td>
        </tr>
        <tr>
          <td>Quality</td>
          <td>${data.scores.quality.score}/20</td>
          <td>${data.scores.quality.percentage}%</td>
        </tr>
        <tr>
          <td>Neighbor Check</td>
          <td>${data.scores.neighborCheck.score}/10</td>
          <td>${data.scores.neighborCheck.percentage}%</td>
        </tr>
        <tr>
          <td>Negativity</td>
          <td>${data.scores.negativity.score}/10</td>
          <td>${data.scores.negativity.percentage}%</td>
        </tr>
        <tr>
          <td>App Usage</td>
          <td>${data.scores.appUsage.score}/10</td>
          <td>${data.scores.appUsage.percentage}%</td>
        </tr>
        <tr>
          <td>Insufficiency</td>
          <td>${data.scores.insufficiency.score}/10</td>
          <td>${data.scores.insufficiency.percentage}%</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Overall Score</strong></td>
          <td><strong>${data.overallScore}%</strong></td>
        </tr>
        <tr>
          <td colspan="2"><strong>Rating</strong></td>
          <td><strong>${data.rating}</strong></td>
        </tr>
      </table>
      ${data.actions.length > 0 ? `
        <p><strong>Required Actions:</strong></p>
        <ul>
          ${data.actions.map(action => `<li>${action}</li>`).join('')}
        </ul>
      ` : ''}
      <p>Best regards,<br>Performance Management Team</p>
    `
  })
};

// Function to send emails
const sendEmail = async (to, template, data) => {
  try {
    const { subject, html } = emailTemplates[template](data);

    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
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
        const coordinators = await User.find({ role: 'coordinator' }).select('email');
        recipients.push(...coordinators.map(c => c.email));
        break;
      case 'manager':
        const managers = await User.find({ role: 'manager' }).select('email');
        recipients.push(...managers.map(m => m.email));
        break;
      case 'hod':
        const hods = await User.find({ role: 'hod' }).select('email');
        recipients.push(...hods.map(h => h.email));
        break;
      case 'compliance':
        const compliance = await User.find({ role: 'compliance' }).select('email');
        recipients.push(...compliance.map(c => c.email));
        break;
    }
  }

  return [...new Set(recipients)]; // Remove duplicates
};

// Notification functions for different scenarios
const emailService = {
  // Send training notification
  sendTrainingNotification: async (userId, trainingData) => {
    const recipients = await getRecipientsByRole(['fe', 'coordinator', 'manager', 'hod'], userId);
    return sendEmail(recipients, 'training', trainingData);
  },

  // Send audit notification
  sendAuditNotification: async (userId, auditData) => {
    const recipients = await getRecipientsByRole(['compliance', 'hod'], userId);
    return sendEmail(recipients, 'audit', auditData);
  },

  // Send warning notification
  sendWarningNotification: async (userId, warningData) => {
    const recipients = await getRecipientsByRole(['fe', 'coordinator', 'manager', 'compliance', 'hod'], userId);
    return sendEmail(recipients, 'warning', warningData);
  },

  // Send KPI score notification
  sendKPIScoreNotification: async (userId, scoreData) => {
    const recipients = await getRecipientsByRole(['fe', 'coordinator', 'manager'], userId);
    return sendEmail(recipients, 'kpiScore', scoreData);
  }
};

module.exports = emailService;
