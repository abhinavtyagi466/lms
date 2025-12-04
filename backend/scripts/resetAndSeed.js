const mongoose = require('mongoose');
require('dotenv').config();

// Import only models that exist
const User = require('../models/User');
const EmailTemplate = require('../models/EmailTemplate');
const UserProgress = require('../models/UserProgress');
const KPIScore = require('../models/KPIScore');
const Notification = require('../models/Notification');
const EmailLog = require('../models/EmailLog');

// Admin credentials
const ADMIN_EMAIL = 'admin@foxivision.com';
const ADMIN_PASSWORD = 'Admin@123';

// Email Templates Data
const emailTemplates = [
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

Failure to show improvement may result in further disciplinary action.

Best Regards,
Human Resources Department`,
    variables: ['userName', 'period', 'kpiScore', 'rating', 'employeeId', 'performanceConcerns', 'trainingDueDate', 'auditDate'],
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

For any questions, contact the Compliance Department.

Best Regards,
Compliance Team`,
    variables: ['userName', 'auditType', 'scheduledDate', 'period', 'priority', 'auditScope'],
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

Keep maintaining these high standards!

Best Regards,
Management Team`,
    variables: ['userName', 'period', 'kpiScore', 'rating', 'employeeId'],
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

We're here to support your growth. Please utilize all resources available.

Best Regards,
Training Team`,
    variables: ['userName', 'period', 'kpiScore', 'rating'],
    defaultRecipients: ['FE', 'Coordinator', 'Manager', 'HOD'],
    description: 'Sent for KPI score 40-49%',
    isActive: true
  },

  // Send Warning Email Template
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
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">⚠️ Performance Warning Notice</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">Dear <strong>{{userName}}</strong>,</p>
              <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.6; color: #555555;">This letter serves as a formal warning regarding your recent performance evaluation.</p>
              <table role="presentation" style="width: 100%; background-color: #ffebee; border-left: 4px solid #d32f2f; border-radius: 6px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #c62828; font-weight: 600;">{{message}}</p>
                    <p style="margin: 0; font-size: 14px; color: #555555;"><strong>Warning Date:</strong> {{warningDate}}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 25px 0 15px 0; font-size: 15px; line-height: 1.6; color: #555555;">Please note that immediate improvement is required.</p>
              <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #eeeeee;">
                <p style="margin: 0 0 10px 0; font-size: 15px; color: #555555;">Best regards,</p>
                <p style="margin: 0; font-size: 15px; color: #333333; font-weight: 600;">Management Team</p>
              </div>
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

  // Send Certificate Email Template
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
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🎉 Certificate Awarded</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">Dear <strong>{{userName}}</strong>,</p>
              <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.6; color: #555555;">Congratulations! You have been awarded a certificate for your outstanding performance.</p>
              <table role="presentation" style="width: 100%; background-color: #e8f5e9; border-left: 4px solid #2e7d32; border-radius: 6px; margin: 25px 0;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 15px;">🏆</div>
                    <h3 style="margin: 0 0 15px 0; font-size: 20px; color: #2e7d32; font-weight: 600;">{{title}}</h3>
                    <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #1b5e20;">{{message}}</p>
                    <p style="margin: 0; font-size: 14px; color: #555555;"><strong>Awarded on:</strong> {{awardDate}}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 25px 0 15px 0; font-size: 15px; line-height: 1.6; color: #555555;">Keep up the great work!</p>
              <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #eeeeee;">
                <p style="margin: 0 0 10px 0; font-size: 15px; color: #555555;">Best regards,</p>
                <p style="margin: 0; font-size: 15px; color: #333333; font-weight: 600;">Management Team</p>
              </div>
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

async function resetAndSeed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edutech-pro');
    console.log('✅ Connected to MongoDB\n');

    // ==================== FLUSH COLLECTIONS (Module & Quiz PRESERVED) ====================
    console.log('🗑️  Flushing database (Module & Quiz preserved)...');

    // Only flush collections that exist
    try {
      const userResult = await User.deleteMany({});
      console.log(`   ✓ Cleared ${userResult.deletedCount} Users`);
    } catch (e) { console.log('   ⚠ Users collection not found'); }

    try {
      const emailResult = await EmailTemplate.deleteMany({});
      console.log(`   ✓ Cleared ${emailResult.deletedCount} Email Templates`);
    } catch (e) { console.log('   ⚠ EmailTemplate collection not found'); }

    try {
      const progressResult = await UserProgress.deleteMany({});
      console.log(`   ✓ Cleared ${progressResult.deletedCount} User Progress`);
    } catch (e) { console.log('   ⚠ UserProgress collection not found'); }

    try {
      const kpiResult = await KPIScore.deleteMany({});
      console.log(`   ✓ Cleared ${kpiResult.deletedCount} KPI Scores`);
    } catch (e) { console.log('   ⚠ KPIScore collection not found'); }

    try {
      const notifResult = await Notification.deleteMany({});
      console.log(`   ✓ Cleared ${notifResult.deletedCount} Notifications`);
    } catch (e) { console.log('   ⚠ Notification collection not found'); }

    try {
      const emailLogResult = await EmailLog.deleteMany({});
      console.log(`   ✓ Cleared ${emailLogResult.deletedCount} Email Logs`);
    } catch (e) { console.log('   ⚠ EmailLog collection not found'); }

    console.log('\n✅ Database flushed successfully! (Module & Quiz preserved)\n');

    // ==================== SEED ADMIN USER ====================
    console.log('👤 Creating Admin User...');

    // Don't hash password here - User model's pre-save hook will hash it
    const adminUser = await User.create({
      name: 'Super Admin',
      email: ADMIN_EMAIL,
      phone: '9999999999',
      password: ADMIN_PASSWORD,  // Plain password - model will hash it
      userType: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`   ✓ Admin created: ${adminUser.email}`);
    console.log(`   ✓ Password: ${ADMIN_PASSWORD}`);
    console.log('\n✅ Admin user created successfully!\n');

    // ==================== SEED EMAIL TEMPLATES ====================
    console.log('📧 Seeding Email Templates...');

    const result = await EmailTemplate.insertMany(emailTemplates);
    console.log(`   ✓ Created ${result.length} email templates`);

    result.forEach(template => {
      console.log(`      - ${template.name} (${template.type})`);
    });

    console.log('\n✅ Email templates seeded successfully!\n');

    // ==================== SUMMARY ====================
    console.log('═'.repeat(50));
    console.log('🎉 DATABASE RESET AND SEED COMPLETED!');
    console.log('═'.repeat(50));
    console.log('\n📋 Summary:');
    console.log(`   • Admin Email: ${ADMIN_EMAIL}`);
    console.log(`   • Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`   • Email Templates: ${result.length}`);
    console.log('   • Module & Quiz: PRESERVED ✅');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetAndSeed();
