# Enhanced Email Service - Complete KPI Automation Support

This document describes the enhanced email service that provides complete automation support for the KPI system.

## Overview

The enhanced `emailService.js` provides comprehensive email automation including:
- KPI trigger-based email notifications
- Training assignment notifications
- Audit scheduling notifications
- Warning letter generation
- Email logging and tracking
- Scheduling and retry functionality

## New Methods Added

### 1. `sendKPITriggerEmails(kpiScore, triggers)`

**Purpose**: Main method for sending all KPI trigger emails.

**Parameters**:
- `kpiScore` (Object): The KPI score document
- `triggers` (Array): Array of email triggers

**Returns**: Array of results with success/failure status for each recipient

**Usage**:
```javascript
const results = await emailService.sendKPITriggerEmails(kpiScore, triggers);
```

### 2. `sendTrainingAssignmentEmail(userId, trainingData)`

**Purpose**: Send training assignment notifications.

**Parameters**:
- `userId` (String): User ID
- `trainingData` (Object): Training assignment data

**Returns**: Array of results for each recipient

**Usage**:
```javascript
const results = await emailService.sendTrainingAssignmentEmail(userId, {
  userName: 'John Doe',
  trainingTypes: ['basic', 'negativity_handling'],
  trainingCount: 2,
  dueDate: '2024-02-15',
  priority: 'high'
});
```

### 3. `sendAuditNotificationEmail(userId, auditData)`

**Purpose**: Send audit notification emails.

**Parameters**:
- `userId` (String): User ID
- `auditData` (Object): Audit data

**Returns**: Array of results for each recipient

**Usage**:
```javascript
const results = await emailService.sendAuditNotificationEmail(userId, {
  userName: 'John Doe',
  employeeId: 'FE2401001',
  auditTypes: ['audit_call', 'cross_check'],
  auditCount: 2,
  kpiScore: 45,
  priority: 'high'
});
```

### 4. `sendWarningLetterEmail(userId, warningData)`

**Purpose**: Send warning letter emails.

**Parameters**:
- `userId` (String): User ID
- `warningData` (Object): Warning data

**Returns**: Array of results for each recipient

**Usage**:
```javascript
const results = await emailService.sendWarningLetterEmail(userId, {
  userName: 'John Doe',
  kpiScore: 35,
  rating: 'Unsatisfactory',
  period: '2024-01',
  improvementAreas: ['TAT', 'Quality', 'App Usage']
});
```

### 5. `logEmailActivity(emailData)`

**Purpose**: Log email activity to EmailLog model.

**Parameters**:
- `emailData` (Object): Email activity data

**Returns**: EmailLog document

**Usage**:
```javascript
const emailLog = await emailService.logEmailActivity({
  recipientEmail: 'user@company.com',
  recipientRole: 'fe',
  templateType: 'training',
  subject: 'Training Required',
  status: 'sent',
  kpiTriggerId: 'kpi123'
});
```

## Enhanced Email Templates

### 1. Training Assignment Template

**Features**:
- Professional HTML styling
- Dynamic training type display
- Priority indicators
- Due date highlighting
- Action buttons for training access

**Template Variables**:
- `userName`: User's name
- `trainingTypes`: Array of training types
- `trainingCount`: Number of trainings
- `dueDate`: Due date
- `priority`: Priority level (high/medium)

### 2. Audit Notification Template

**Features**:
- Compliance-focused design
- Audit type details
- Priority indicators
- KPI score display
- Dashboard access links

**Template Variables**:
- `userName`: User's name
- `employeeId`: Employee ID
- `auditTypes`: Array of audit types
- `auditCount`: Number of audits
- `kpiScore`: KPI score
- `priority`: Priority level

### 3. Warning Letter Template

**Features**:
- Formal warning design
- Performance metrics display
- Improvement areas list
- Support information
- Professional styling

**Template Variables**:
- `userName`: User's name
- `kpiScore`: Overall KPI score
- `rating`: Performance rating
- `period`: Evaluation period
- `improvementAreas`: Array of improvement areas

### 4. KPI Score Notification Template

**Features**:
- Comprehensive score table
- Color-coded performance indicators
- Action items display
- Dashboard access
- Professional formatting

**Template Variables**:
- `userName`: User's name
- `period`: Evaluation period
- `overallScore`: Overall KPI score
- `rating`: Performance rating
- `scores`: Individual metric scores
- `actions`: Required actions

### 5. Performance Improvement Template

**Features**:
- Improvement-focused design
- Actionable recommendations
- Support resources
- Training access links
- Positive reinforcement

**Template Variables**:
- `userName`: User's name
- `improvementAreas`: Areas needing improvement
- `recommendations`: Suggested actions

## Recipient Management

### `getRecipientsByTrigger(triggerType, userId)`

**Purpose**: Get appropriate email recipients based on trigger type.

**Trigger Types**:
- **training**: FE, Coordinator, Manager, HOD
- **audit**: Compliance Team, HOD
- **warning**: FE, Coordinator, Manager, Compliance, HOD
- **default**: FE, Coordinator, Manager

**Returns**: Array of recipient objects with email and role

**Usage**:
```javascript
const recipients = await emailService.getRecipientsByTrigger('training', userId);
```

## Email Scheduling and Retry

### 1. `scheduleEmail(to, template, data, scheduledFor, emailLogData)`

**Purpose**: Schedule emails for future delivery.

**Parameters**:
- `to`: Recipient email(s)
- `template`: Email template name
- `data`: Template data
- `scheduledFor`: Scheduled delivery date
- `emailLogData`: Email logging data

**Usage**:
```javascript
const result = await emailService.scheduleEmail(
  'user@company.com',
  'training',
  trainingData,
  new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  emailLogData
);
```

### 2. `retryFailedEmail(emailLogId)`

**Purpose**: Retry failed email delivery.

**Parameters**:
- `emailLogId`: EmailLog document ID

**Returns**: Email delivery result

**Usage**:
```javascript
const result = await emailService.retryFailedEmail('emailLog123');
```

## Email Statistics and Management

### 1. `getEmailStats(filters)`

**Purpose**: Get email delivery statistics.

**Returns**: Email statistics by status

**Usage**:
```javascript
const stats = await emailService.getEmailStats();
```

### 2. `getFailedEmails(filters)`

**Purpose**: Get all failed emails.

**Returns**: Array of failed email logs

**Usage**:
```javascript
const failedEmails = await emailService.getFailedEmails();
```

### 3. `getPendingEmails(filters)`

**Purpose**: Get all pending emails.

**Returns**: Array of pending email logs

**Usage**:
```javascript
const pendingEmails = await emailService.getPendingEmails();
```

### 4. `getEmailsForRetry()`

**Purpose**: Get emails eligible for retry.

**Returns**: Array of emails that can be retried

**Usage**:
```javascript
const retryEmails = await emailService.getEmailsForRetry();
```

### 5. `getTemplateTypeDistribution(filters)`

**Purpose**: Get email distribution by template type.

**Returns**: Statistics by template type

**Usage**:
```javascript
const distribution = await emailService.getTemplateTypeDistribution();
```

## Email Logging Integration

All email activities are automatically logged to the EmailLog model with:

- **Recipient Information**: Email, role
- **Template Details**: Type, subject, content
- **Delivery Status**: Sent, failed, pending
- **Timing Information**: Sent, scheduled, delivered
- **Error Handling**: Error messages, retry counts
- **Relationships**: Links to KPI, training, audit records

## Error Handling

The service includes comprehensive error handling:

1. **Individual Recipient Errors**: Failed emails don't affect others
2. **Retry Mechanism**: Automatic retry for failed emails
3. **Error Logging**: All errors are logged with context
4. **Graceful Degradation**: Service continues even with partial failures
5. **Status Tracking**: Real-time status updates

## HTML Template Features

All email templates include:

- **Responsive Design**: Works on all devices
- **Professional Styling**: Company branding
- **Color Coding**: Performance indicators
- **Action Buttons**: Direct links to relevant pages
- **Accessibility**: Screen reader friendly
- **Cross-Client Compatibility**: Works in all email clients

## Environment Variables

Required environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_NAME=E-Learning Platform
FROM_EMAIL=noreply@company.com
CLIENT_ORIGIN=http://localhost:3000
```

## Usage Examples

### Complete KPI Automation
```javascript
// Process KPI triggers and send all emails
const triggers = [
  { type: 'training', data: trainingData },
  { type: 'audit', data: auditData },
  { type: 'warning', data: warningData }
];

const results = await emailService.sendKPITriggerEmails(kpiScore, triggers);
```

### Training Assignment
```javascript
// Send training assignment email
const trainingData = {
  userName: 'John Doe',
  trainingTypes: ['basic', 'negativity_handling'],
  trainingCount: 2,
  dueDate: '2024-02-15',
  priority: 'high'
};

const results = await emailService.sendTrainingAssignmentEmail(userId, trainingData);
```

### Email Management
```javascript
// Get failed emails and retry them
const failedEmails = await emailService.getFailedEmails();
for (const email of failedEmails) {
  if (email.canRetry()) {
    await emailService.retryFailedEmail(email._id);
  }
}
```

## Performance Considerations

1. **Batch Processing**: Multiple emails sent efficiently
2. **Async Operations**: Non-blocking email delivery
3. **Error Isolation**: Individual failures don't affect batch
4. **Logging Optimization**: Efficient database operations
5. **Template Caching**: Templates are pre-compiled

## Security Features

1. **Input Validation**: All inputs are validated
2. **SQL Injection Prevention**: Parameterized queries
3. **Email Validation**: Proper email format checking
4. **Access Control**: Role-based recipient selection
5. **Error Information**: Limited error details in responses

This enhanced email service provides a robust, scalable foundation for complete KPI automation with comprehensive tracking, error handling, and professional email templates.
