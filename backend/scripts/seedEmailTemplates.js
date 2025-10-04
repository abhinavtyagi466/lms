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
  }
];

async function seedEmailTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edutech-pro');
    console.log('Connected to MongoDB');

    // Clear existing templates (optional - remove in production)
    const deleteResult = await EmailTemplate.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing templates`);

    // Insert default templates
    const result = await EmailTemplate.insertMany(defaultTemplates);
    console.log(`✅ Successfully seeded ${result.length} email templates`);
    
    console.log('\nTemplates created:');
    result.forEach(template => {
      console.log(`- ${template.name} (${template.type})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding email templates:', error);
    process.exit(1);
  }
}

seedEmailTemplates();

