# KPI Trigger Service - Complete Automation System

This document describes the comprehensive KPI trigger service that handles complete automation of the KPI system.

## Overview

The `KPITriggerService` class provides complete automation for KPI-based triggers including:
- Training assignments
- Audit scheduling
- Email notifications
- User status updates
- Lifecycle event tracking

## Main Methods

### 1. `processKPITriggers(kpiScore)`

**Purpose**: Main method that orchestrates all automation processes.

**Parameters**:
- `kpiScore` (Object): The KPI score document to process

**Returns**:
```javascript
{
  success: boolean,
  trainingAssignments: Array,
  auditSchedules: Array,
  emailLogs: Array,
  lifecycleEvents: Array,
  errors: Array,
  processingTime: number
}
```

**Process Flow**:
1. Mark KPI as processing
2. Calculate all triggers based on KPI metrics
3. Create training assignments
4. Schedule audits
5. Send automated emails
6. Update user status
7. Create lifecycle events
8. Mark KPI as completed

### 2. `calculateTriggers(kpiScore)`

**Purpose**: Calculate all triggers based on KPI score and individual metrics.

**Training Assignment Logic**:
- **Basic Training**: `overallScore < 55` OR `overallScore < 40`
- **Negativity Handling**: `majorNegativity > 0` AND `negativity < 25`
- **Do's & Don'ts**: `quality > 1`
- **App Usage**: `appUsage < 80`

**Audit Scheduling Logic**:
- **Audit Call**: `overallScore < 70`
- **Cross-check**: `overallScore < 70`
- **Dummy Audit**: `overallScore < 50`
- **Cross-verify Insuff**: `insufficiency > 2`

**Email Recipient Logic**:
- **Training emails**: FE, Coordinator, Manager, HOD
- **Audit emails**: Compliance Team, HOD
- **Warning emails**: FE, Coordinator, Manager, Compliance, HOD

### 3. `createTrainingAssignments(kpiScore, trainingTriggers)`

**Purpose**: Create training assignments based on calculated triggers.

**Features**:
- Automatic due date calculation (7 days for high priority, 14 days for others)
- Links to KPI trigger
- Comprehensive notes with trigger reason
- Integration with KPI score tracking

### 4. `scheduleAudits(kpiScore, auditTriggers)`

**Purpose**: Schedule audits based on calculated triggers.

**Features**:
- Automatic scheduling (3 days for high priority, 7 days for others)
- Priority assignment based on trigger severity
- Audit scope and method documentation
- Integration with KPI score tracking

### 5. `sendAutomatedEmails(kpiScore, emailTriggers, user)`

**Purpose**: Send automated email notifications to appropriate recipients.

**Email Types**:
- **Training**: Training assignment notifications
- **Audit**: Audit scheduling notifications
- **Warning**: Performance warning letters
- **KPI Score**: KPI score notifications

**Features**:
- Role-based recipient selection
- Email logging and tracking
- Error handling for failed emails
- Retry mechanism support

### 6. `updateUserStatus(userId, kpiScore)`

**Purpose**: Update user status based on KPI performance.

**Status Logic**:
- **Active**: `overallScore >= 70`
- **Warning**: `overallScore < 70` AND `overallScore >= 50`
- **Audited**: `overallScore < 50`

### 7. `createLifecycleEvents(userId, lifecycleTriggers)`

**Purpose**: Create lifecycle events for audit trail and tracking.

**Event Types**:
- **Audit**: Audit-related events
- **Warning**: Warning-related events
- **Training**: Training-related events

## Utility Methods

### `getRecipientsByRoles(roles, userId)`

**Purpose**: Get email recipients based on roles.

**Supported Roles**:
- `fe`: Field Executive (specific user)
- `coordinator`: Coordination team members
- `manager`: Management team members
- `hod`: Head of Department
- `compliance`: Compliance team members

### `getAuditMethod(auditType)`

**Purpose**: Get audit method description based on audit type.

### `getEmailSubject(emailType, data)`

**Purpose**: Generate email subject based on email type and data.

### `getImprovementAreas(kpiScore)`

**Purpose**: Identify areas needing improvement based on KPI scores.

## Batch Processing

### `processPendingKPIs()`

**Purpose**: Process all pending KPI scores for automation.

**Features**:
- Batch processing of multiple KPIs
- Error handling and reporting
- Progress tracking

### `getAutomationStats()`

**Purpose**: Get comprehensive automation statistics.

**Returns**:
```javascript
{
  kpi: Array,        // KPI automation statistics
  training: Array,   // Training assignment statistics
  email: Array,      // Email delivery statistics
  audit: Array,      // Audit scheduling statistics
  timestamp: Date
}
```

## Error Handling

The service includes comprehensive error handling:

1. **Individual Operation Errors**: Each operation is wrapped in try-catch
2. **Rollback Support**: Failed operations don't affect successful ones
3. **Error Logging**: All errors are logged with context
4. **Status Tracking**: KPI status is updated to reflect processing state
5. **Retry Support**: Failed operations can be retried

## Integration Points

### Database Models
- **KPIScore**: Main trigger source
- **TrainingAssignment**: Training assignment tracking
- **EmailLog**: Email notification tracking
- **AuditSchedule**: Audit scheduling tracking
- **User**: User status updates
- **LifecycleEvent**: Event tracking

### External Services
- **emailService**: Email delivery
- **lifecycleService**: Lifecycle event management

## Usage Examples

### Basic Usage
```javascript
const KPITriggerService = require('./kpiTriggerService');

// Process a single KPI score
const result = await KPITriggerService.processKPITriggers(kpiScore);
console.log(`Processed ${result.trainingAssignments.length} training assignments`);
```

### Batch Processing
```javascript
// Process all pending KPIs
const batchResult = await KPITriggerService.processPendingKPIs();
console.log(`Processed ${batchResult.processed} KPIs, ${batchResult.failed} failed`);
```

### Statistics
```javascript
// Get automation statistics
const stats = await KPITriggerService.getAutomationStats();
console.log('Automation statistics:', stats);
```

## Performance Considerations

1. **Async Processing**: All operations are asynchronous
2. **Batch Operations**: Multiple operations are batched where possible
3. **Error Isolation**: Individual failures don't affect other operations
4. **Logging**: Comprehensive logging for debugging and monitoring
5. **Status Tracking**: Real-time status updates for monitoring

## Monitoring and Debugging

The service provides extensive logging:
- Processing start/completion times
- Individual operation results
- Error details with context
- Performance metrics
- Status updates

## Future Enhancements

Potential improvements:
1. **Queue System**: For high-volume processing
2. **Retry Logic**: Automatic retry for failed operations
3. **Webhooks**: Real-time notifications
4. **Analytics**: Advanced reporting and analytics
5. **Customization**: Configurable trigger thresholds

This service provides a robust, scalable foundation for complete KPI automation with comprehensive error handling and monitoring capabilities.
