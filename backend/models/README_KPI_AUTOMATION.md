# KPI Automation Database Models

This document describes the enhanced database models for complete KPI automation system.

## New Models Created

### 1. TrainingAssignment Model (`TrainingAssignment.js`)

**Purpose**: Manages automated training assignments based on KPI triggers.

**Key Fields**:
- `userId`: Reference to User who needs training
- `trainingType`: Type of training (basic, negativity_handling, dos_donts, app_usage)
- `assignedBy`: How it was assigned (kpi_trigger, manual, scheduled)
- `dueDate`: When training must be completed
- `status`: Current status (assigned, in_progress, completed, overdue)
- `kpiTriggerId`: Reference to KPIScore that triggered this assignment
- `completionDate`: When training was completed
- `score`: Training completion score

**Key Methods**:
- `getPendingAssignments()`: Get all pending training assignments
- `getOverdueAssignments()`: Get overdue training assignments
- `getUserAssignments(userId)`: Get user's training assignments
- `getTrainingStats()`: Get training statistics
- `markCompleted()`: Mark training as completed

### 2. EmailLog Model (`EmailLog.js`)

**Purpose**: Tracks all automated email notifications sent by the system.

**Key Fields**:
- `recipientEmail`: Email address of recipient
- `recipientRole`: Role of recipient (fe, coordinator, manager, hod, compliance, admin)
- `templateType`: Type of email template used
- `subject`: Email subject line
- `sentAt`: When email was sent
- `status`: Email status (sent, failed, pending)
- `kpiTriggerId`: Reference to KPIScore that triggered this email
- `errorMessage`: Error message if email failed
- `retryCount`: Number of retry attempts
- `scheduledFor`: When email is scheduled to be sent

**Key Methods**:
- `getFailedEmails()`: Get all failed emails
- `getPendingEmails()`: Get pending emails
- `getEmailStats()`: Get email statistics
- `getTemplateTypeDistribution()`: Get distribution by template type
- `markAsSent()`: Mark email as successfully sent
- `markAsFailed()`: Mark email as failed
- `canRetry()`: Check if email can be retried

### 3. AuditSchedule Model (`AuditSchedule.js`)

**Purpose**: Manages automated audit scheduling based on KPI triggers.

**Key Fields**:
- `userId`: Reference to User to be audited
- `auditType`: Type of audit (audit_call, cross_check, dummy_audit)
- `scheduledDate`: When audit is scheduled
- `status`: Current status (scheduled, in_progress, completed)
- `kpiTriggerId`: Reference to KPIScore that triggered this audit
- `completedDate`: When audit was completed
- `findings`: Audit findings
- `assignedTo`: Who is assigned to conduct the audit
- `priority`: Audit priority level
- `riskLevel`: Risk level assessment
- `complianceStatus`: Compliance status result

**Key Methods**:
- `getScheduledAudits()`: Get all scheduled audits
- `getOverdueAudits()`: Get overdue audits
- `getUserAuditHistory(userId)`: Get user's audit history
- `getAuditStats()`: Get audit statistics
- `getUpcomingAudits()`: Get upcoming audits
- `markInProgress()`: Mark audit as in progress
- `markCompleted()`: Mark audit as completed
- `addDocument()`: Add audit document

## Enhanced Models

### 4. Updated KPIScore Model (`KPIScore.js`)

**New Fields Added**:
- `trainingAssignments`: Array of TrainingAssignment references
- `emailLogs`: Array of EmailLog references
- `auditSchedules`: Array of AuditSchedule references
- `processedAt`: When automation was processed
- `automationStatus`: Automation status (pending, processing, completed, failed)

**New Methods Added**:
- `getPendingAutomation()`: Get KPI scores pending automation
- `getByAutomationStatus(status)`: Get KPI scores by automation status
- `getAutomationStats()`: Get automation statistics
- `markAsProcessing()`: Mark as being processed
- `markAsCompleted()`: Mark automation as completed
- `markAsFailed()`: Mark automation as failed
- `addTrainingAssignment()`: Add training assignment reference
- `addEmailLog()`: Add email log reference
- `addAuditSchedule()`: Add audit schedule reference

## Database Indexes

All models include comprehensive indexing for optimal query performance:

### TrainingAssignment Indexes:
- `userId + status`
- `trainingType + status`
- `dueDate + status`
- `kpiTriggerId`
- `createdAt`

### EmailLog Indexes:
- `recipientEmail + status`
- `templateType + status`
- `kpiTriggerId`
- `userId + status`
- `sentAt`
- `scheduledFor + status`

### AuditSchedule Indexes:
- `userId + status`
- `auditType + status`
- `scheduledDate + status`
- `kpiTriggerId`
- `assignedTo + status`
- `priority + status`
- `createdAt`

### KPIScore Indexes (Enhanced):
- `automationStatus`
- `processedAt`
- All existing indexes maintained

## Integration Points

These models work together to provide complete KPI automation:

1. **KPI Score Entry** → Triggers automation process
2. **Training Assignments** → Created based on KPI triggers
3. **Email Notifications** → Sent to appropriate stakeholders
4. **Audit Scheduling** → Scheduled based on KPI performance
5. **Status Tracking** → Complete audit trail of all automation activities

## Usage Examples

```javascript
// Get pending training assignments
const pendingTrainings = await TrainingAssignment.getPendingAssignments();

// Get failed emails for retry
const failedEmails = await EmailLog.getFailedEmails();

// Get overdue audits
const overdueAudits = await AuditSchedule.getOverdueAudits();

// Get KPI scores pending automation
const pendingKPIs = await KPIScore.getPendingAutomation();

// Mark training as completed
await trainingAssignment.markCompleted(85, 'Good performance');

// Mark audit as completed
await auditSchedule.markCompleted('No issues found', 'Continue current practices');
```

## Next Steps

With these models in place, the next implementation steps are:

1. Create KPI Trigger Service for automation logic
2. Enhance Email Service for automated notifications
3. Create API routes for training assignment management
4. Create API routes for audit scheduling
5. Create API routes for email management
6. Update frontend components to use new data structures

This foundation provides a robust, scalable system for complete KPI automation with full audit trails and comprehensive tracking capabilities.
