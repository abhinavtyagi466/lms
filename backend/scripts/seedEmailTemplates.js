const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
require('dotenv').config();

const defaultTemplates = [
  {
    name: 'KPI Outstanding Performance',
    type: 'kpi_outstanding',
    category: 'kpi',
    subject: '🎉 Outstanding Performance - {{period}}',
    content: `Dear {{userName}},

Congratulations! Your KPI performance for {{period}} is Outstanding!

📊 Performance Summary:
- Overall Score: {{kpiScore}}%
- Rating: {{rating}}
- Employee ID: {{employeeId}}

🏆 Achievement Highlights:
Your exceptional performance demonstrates excellence in:
- TAT Management: {{tatPercentage}}%
- Quality Standards: {{qualityPercentage}}%
- Neighbor Check Compliance: {{neighborCheckPercentage}}%

🎁 Recognition:
You are eligible for performance rewards and recognition. Our management team will contact you shortly with details.

Keep up the excellent work!

Best Regards,
Management Team`,
    variables: ['userName', 'period', 'kpiScore', 'rating', 'employeeId', 'tatPercentage', 'qualityPercentage', 'neighborCheckPercentage'],
    defaultRecipients: ['FE', 'Manager', 'HOD'],
    description: 'Sent to field executives with KPI score 85-100%',
    isActive: true
  },

  {
    name: 'Training Assignment Notification',
    type: 'training_assignment',
    category: 'training',
    subject: '📚 New Training Assignment - Action Required',
    content: `Dear {{userName}},

You have been assigned a new training module based on your recent performance review.

📋 Training Details:
- Training Type: {{trainingType}}
- Period: {{period}}
- Due Date: {{dueDate}}
- Priority: {{priority}}

📊 Performance Context:
- Your KPI Score: {{kpiScore}}%
- Rating: {{rating}}

📝 Why This Training:
{{trainingReason}}

⏰ Action Required:
Please complete this training by {{dueDate}} to improve your performance and meet company standards.

Access your training modules from the dashboard: http://localhost:3000/#/modules

For any questions, contact your coordinator.

Best Regards,
Training & Development Team`,
    variables: ['userName', 'trainingType', 'period', 'dueDate', 'priority', 'kpiScore', 'rating', 'trainingReason'],
    defaultRecipients: ['FE', 'Coordinator', 'Manager', 'HOD'],
    description: 'Sent when training is assigned based on KPI performance',
    isActive: true
  },

  {
    name: 'Performance Warning Letter',
    type: 'performance_warning',
    category: 'warning',
    subject: '⚠️ Performance Warning - Immediate Action Required',
    content: `Dear {{userName}},

This is an official performance warning regarding your recent KPI assessment.

📊 Performance Summary:
- Period: {{period}}
- Overall Score: {{kpiScore}}%
- Rating: {{rating}}
- Employee ID: {{employeeId}}

⚠️ Areas of Concern:
{{performanceConcerns}}

📋 Required Actions:
1. Complete assigned training modules by {{trainingDueDate}}
2. Attend mandatory audit session on {{auditDate}}
3. Submit performance improvement plan within 7 days

⏰ Timeline:
You have 30 days to demonstrate significant improvement in:
- TAT Performance: Current {{tatPercentage}}% (Target: 90%+)
- Quality Standards: Current {{qualityPercentage}}% (Target: <0.5%)
- General Negativity: Current {{generalNegPercentage}}% (Target: <25%)

🎯 Support Available:
- Your coordinator will schedule one-on-one coaching sessions
- Access to all training materials and resources
- Weekly progress reviews

Failure to show improvement may result in further disciplinary action.

For immediate assistance, contact HR or your reporting manager.

Best Regards,
Human Resources Department`,
    variables: ['userName', 'period', 'kpiScore', 'rating', 'employeeId', 'performanceConcerns', 'trainingDueDate', 'auditDate', 'tatPercentage', 'qualityPercentage', 'generalNegPercentage'],
    defaultRecipients: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
    description: 'Sent for KPI score below 40% - official warning',
    isActive: true
  },

  {
    name: 'Audit Schedule Notification',
    type: 'audit_schedule',
    category: 'audit',
    subject: '📅 Audit Scheduled - {{auditType}}',
    content: `Dear {{userName}},

An audit has been scheduled for your recent performance based on KPI assessment.

📅 Audit Details:
- Audit Type: {{auditType}}
- Scheduled Date: {{scheduledDate}}
- Period Under Review: {{period}}
- Priority: {{priority}}

📊 Audit Scope:
{{auditScope}}

📋 What to Prepare:
- Review your case records for {{period}}
- Prepare documentation for:
  * TAT compliance records
  * Quality control reports
  * Neighbor check verification
  * Insufficiency cases explanation

⏰ Audit Process:
1. Pre-audit document submission: {{preAuditDate}}
2. Audit session: {{scheduledDate}}
3. Post-audit review: Within 7 days

💼 Audit Team:
The audit will be conducted by the Compliance Team. You will receive a detailed agenda 48 hours before the session.

For any questions, contact the Compliance Department.

Best Regards,
Compliance Team`,
    variables: ['userName', 'auditType', 'scheduledDate', 'period', 'priority', 'auditScope', 'preAuditDate'],
    defaultRecipients: ['Compliance Team', 'HOD', 'FE'],
    description: 'Sent when audit is scheduled based on KPI triggers',
    isActive: true
  },

  {
    name: 'KPI Excellent Performance',
    type: 'kpi_excellent',
    category: 'kpi',
    subject: '👏 Excellent Performance - {{period}}',
    content: `Dear {{userName}},

Well done! Your KPI performance for {{period}} is Excellent!

📊 Performance Summary:
- Overall Score: {{kpiScore}}%
- Rating: {{rating}}
- Employee ID: {{employeeId}}

✨ Key Strengths:
- TAT: {{tatPercentage}}%
- Quality: {{qualityPercentage}}%
- App Usage: {{onlinePercentage}}%

📋 Next Steps:
A routine audit call has been scheduled to review your processes and identify best practices that can be shared with the team.

Keep maintaining these high standards!

Best Regards,
Management Team`,
    variables: ['userName', 'period', 'kpiScore', 'rating', 'employeeId', 'tatPercentage', 'qualityPercentage', 'onlinePercentage'],
    defaultRecipients: ['FE', 'Coordinator'],
    description: 'Sent for KPI score 70-84%',
    isActive: true
  },

  {
    name: 'KPI Need Improvement',
    type: 'kpi_need_improvement',
    category: 'kpi',
    subject: '📊 Performance Review - Improvement Needed',
    content: `Dear {{userName}},

Your KPI performance for {{period}} requires attention and improvement.

📊 Performance Summary:
- Overall Score: {{kpiScore}}%
- Rating: {{rating}}

📚 Support Provided:
1. Training Assignment: {{trainingType}}
2. Audit Schedule: {{auditDate}}
3. Dummy cases for practice

⚠️ Focus Areas:
{{improvementAreas}}

We're here to support your growth. Please utilize all resources available.

Best Regards,
Training Team`,
    variables: ['userName', 'period', 'kpiScore', 'rating', 'trainingType', 'auditDate', 'improvementAreas'],
    defaultRecipients: ['FE', 'Coordinator', 'Manager', 'HOD'],
    description: 'Sent for KPI score 40-49%',
    isActive: true
  },

  // NEW: Send Warning Email Template (Professional HTML)
  {
    name: 'Send Warning Email',
    type: 'send_warning',
    category: 'warning',
    subject: '⚠️ Performance Warning Notice',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Warning Notice</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">⚠️ Performance Warning Notice</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">Dear <strong>{{userName}}</strong>,</p>
              
              <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.6; color: #555555;">
                This letter serves as a formal warning regarding your recent performance evaluation.
              </p>
              
              <!-- Warning Box -->
              <table role="presentation" style="width: 100%; background-color: #ffebee; border-left: 4px solid #d32f2f; border-radius: 6px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #c62828; font-weight: 600;">
                      {{message}}
                    </p>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #555555;"><strong>Warning Date:</strong></td>
                        <td style="padding: 8px 0; font-size: 14px; color: #d32f2f; font-weight: 600; text-align: right;">{{warningDate}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Support Section -->
              <table role="presentation" style="width: 100%; background-color: #e8f5e9; border-radius: 6px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #2e7d32; font-weight: 600;">📋 Support Available:</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.8;">
                      <li>Training modules will be assigned</li>
                      <li>Regular guidance from your coordinator</li>
                      <li>Weekly review meetings with your manager</li>
                      <li>Performance improvement plan</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 15px 0; font-size: 15px; line-height: 1.6; color: #555555;">
                Please note that immediate improvement is required. Support and training will be provided to help you meet the expected performance standards.
              </p>
              
              <p style="margin: 15px 0 0 0; font-size: 15px; line-height: 1.6; color: #555555;">
                You can view this warning in your dashboard.
              </p>
              
              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #eeeeee;">
                <p style="margin: 0 0 10px 0; font-size: 15px; color: #555555;">Best regards,</p>
                <p style="margin: 0; font-size: 15px; color: #333333; font-weight: 600;">Management Team</p>
              </div>
            </td>
          </tr>
          
          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #777777;">
                This is an automated email from E-Learning Platform. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    variables: ['userName', 'message', 'warningDate'],
    defaultRecipients: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
    description: 'Professional warning email template sent from User Management',
    isActive: true
  },

  // NEW: Send Certificate Email Template (Professional HTML)
  {
    name: 'Send Certificate Email',
    type: 'send_certificate',
    category: 'achievement',
    subject: '🎉 Certificate Awarded - {{title}}',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate Awarded</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🎉 Certificate Awarded</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">Dear <strong>{{userName}}</strong>,</p>
              
              <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.6; color: #555555;">
                Congratulations! You have been awarded a certificate for your outstanding performance.
              </p>
              
              <!-- Certificate Box -->
              <table role="presentation" style="width: 100%; background-color: #e8f5e9; border-left: 4px solid #2e7d32; border-radius: 6px; margin: 25px 0;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 15px;">🏆</div>
                    <h3 style="margin: 0 0 15px 0; font-size: 20px; color: #2e7d32; font-weight: 600;">{{title}}</h3>
                    <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #1b5e20;">
                      {{message}}
                    </p>
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #555555; text-align: center;">
                          <strong>Awarded on:</strong> {{awardDate}}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Recognition Section -->
              <table role="presentation" style="width: 100%; background-color: #fff3e0; border-radius: 6px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #f57c00; font-weight: 600;">✨ Recognition</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #555555;">
                      This certificate recognizes your dedication, hard work, and commitment to excellence. Your outstanding performance sets a benchmark for others to follow.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 15px 0; font-size: 15px; line-height: 1.6; color: #555555;">
                Keep up the great work! You can view this certificate in your dashboard.
              </p>
              
              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #eeeeee;">
                <p style="margin: 0 0 10px 0; font-size: 15px; color: #555555;">Best regards,</p>
                <p style="margin: 0; font-size: 15px; color: #333333; font-weight: 600;">Management Team</p>
              </div>
            </td>
          </tr>
          
          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #777777;">
                This is an automated email from E-Learning Platform. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    variables: ['userName', 'title', 'message', 'awardDate'],
    defaultRecipients: ['FE', 'Manager', 'HOD'],
    description: 'Professional certificate award email template sent from User Management',
    isActive: true
  }
];

async function seedEmailTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edutech-pro');
    console.log('✅ Connected to MongoDB');

    // Clear existing templates
    const deleteResult = await EmailTemplate.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing templates`);

    // Insert default templates
    const result = await EmailTemplate.insertMany(defaultTemplates);
    console.log(`✅ Successfully seeded ${result.length} email templates`);

    console.log('\n📧 Templates created:');
    result.forEach(template => {
      console.log(`   ✓ ${template.name} (${template.type})`);
    });

    console.log('\n🎉 Email template seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    process.exit(1);
  }
}

seedEmailTemplates();
