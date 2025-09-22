# Enhanced KPI API Routes

This document describes the enhanced KPI API routes with complete automation support.

## Overview

The enhanced KPI API provides comprehensive KPI management including:
- Complete automation integration with KPITriggerService
- Support for all 7 KPI metrics
- Training assignment and audit scheduling automation
- Email notification automation
- Automation status tracking and management
- Backward compatibility with existing frontend code

## Base URL

All endpoints are prefixed with `/api/kpi`

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Enhanced Endpoints

### 1. Submit KPI Score with Automation

**POST** `/api/kpi`

**Description**: Submit KPI scores for a user with automatic trigger processing.

**Access**: Admin only

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "tat": 85.5,
  "quality": 92.0,
  "appUsage": 78.5,
  "negativity": 15.0,
  "majorNegativity": 2,
  "neighborCheck": 88.0,
  "generalNegativity": 12.0,
  "insufficiency": 1,
  "period": "2024-01",
  "comments": "Good performance overall with minor areas for improvement"
}
```

**Response**:
```json
{
  "success": true,
  "message": "KPI score submitted successfully",
  "calculatedScore": 78.5,
  "rating": "Good",
  "triggeredActions": ["training", "audit"],
  "kpiScore": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@company.com",
      "employeeId": "FE2401001"
    },
    "tat": 85.5,
    "quality": 92.0,
    "appUsage": 78.5,
    "negativity": 15.0,
    "majorNegativity": 2,
    "neighborCheck": 88.0,
    "generalNegativity": 12.0,
    "insufficiency": 1,
    "overallScore": 78.5,
    "rating": "Good",
    "triggeredActions": ["training", "audit"],
    "automationStatus": "completed",
    "processedAt": "2024-02-10T10:30:00.000Z",
    "period": "2024-01",
    "comments": "Good performance overall with minor areas for improvement",
    "submittedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Admin User",
      "email": "admin@company.com"
    }
  },
  "automation": {
    "status": "completed",
    "processedAt": "2024-02-10T10:30:00.000Z",
    "result": {
      "success": true,
      "processingTime": 1250,
      "trainingAssignments": 2,
      "auditSchedules": 1,
      "emailsSent": 5,
      "lifecycleEvents": 3
    }
  }
}
```

### 2. Get User KPI with Automation Data

**GET** `/api/kpi/:userId`

**Description**: Get KPI scores for a user with complete automation data.

**Access**: User can access own KPI, admin can access any

**Response**:
```json
{
  "success": true,
  "kpiScore": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@company.com",
      "employeeId": "FE2401001"
    },
    "tat": 85.5,
    "quality": 92.0,
    "appUsage": 78.5,
    "negativity": 15.0,
    "majorNegativity": 2,
    "neighborCheck": 88.0,
    "generalNegativity": 12.0,
    "insufficiency": 1,
    "overallScore": 78.5,
    "rating": "Good",
    "triggeredActions": ["training", "audit"],
    "automationStatus": "completed",
    "processedAt": "2024-02-10T10:30:00.000Z",
    "period": "2024-01"
  },
  "automationData": {
    "trainingAssignments": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "trainingType": "basic",
        "status": "assigned",
        "dueDate": "2024-02-20T00:00:00.000Z",
        "priority": "medium",
        "assignedByUser": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Admin User",
          "email": "admin@company.com"
        }
      }
    ],
    "auditSchedules": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "auditType": "audit_call",
        "status": "scheduled",
        "scheduledDate": "2024-02-15T00:00:00.000Z",
        "priority": "high",
        "assignedTo": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Compliance Officer",
          "email": "compliance@company.com"
        }
      }
    ],
    "emailLogs": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "recipientEmail": "john@company.com",
        "recipientRole": "fe",
        "templateType": "kpiScoreNotification",
        "subject": "KPI Score Notification - January 2024",
        "status": "sent",
        "sentAt": "2024-02-10T10:30:00.000Z"
      }
    ],
    "automationStatus": "completed",
    "processedAt": "2024-02-10T10:30:00.000Z"
  }
}
```

### 3. Get KPI Triggers

**GET** `/api/kpi/:id/triggers`

**Description**: Get detailed triggers for a specific KPI score.

**Access**: Admin only

**Response**:
```json
{
  "success": true,
  "data": {
    "kpiScore": {
      "_id": "507f1f77bcf86cd799439012",
      "userId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@company.com",
        "employeeId": "FE2401001"
      },
      "overallScore": 78.5,
      "rating": "Good",
      "triggeredActions": ["training", "audit"]
    },
    "triggers": {
      "training": {
        "basic": {
          "triggered": true,
          "reason": "Overall score 78.5% is below 80% threshold",
          "priority": "medium"
        },
        "negativity_handling": {
          "triggered": true,
          "reason": "Major negativity count 2 is above 0 threshold",
          "priority": "high"
        }
      },
      "audit": {
        "audit_call": {
          "triggered": true,
          "reason": "Overall score 78.5% is below 80% threshold",
          "priority": "high"
        }
      },
      "email": {
        "kpi_notification": {
          "triggered": true,
          "recipients": ["fe", "coordinator", "manager"],
          "priority": "medium"
        }
      }
    },
    "automationData": {
      "trainingAssignments": [...],
      "auditSchedules": [...],
      "emailLogs": [...],
      "automationStatus": "completed",
      "processedAt": "2024-02-10T10:30:00.000Z"
    }
  }
}
```

### 4. Reprocess KPI Triggers

**POST** `/api/kpi/:id/reprocess`

**Description**: Reprocess triggers for a KPI score.

**Access**: Admin only

**Response**:
```json
{
  "success": true,
  "message": "KPI triggers reprocessed successfully",
  "data": {
    "automationResult": {
      "success": true,
      "processingTime": 1250,
      "trainingAssignments": 2,
      "auditSchedules": 1,
      "emailsSent": 5,
      "lifecycleEvents": 3
    },
    "automationData": {
      "trainingAssignments": [...],
      "auditSchedules": [...],
      "emailLogs": [...],
      "automationStatus": "completed",
      "processedAt": "2024-02-10T10:30:00.000Z"
    }
  }
}
```

### 5. Get Automation Status

**GET** `/api/kpi/:id/automation-status`

**Description**: Get automation status for a KPI score.

**Access**: Admin only

**Response**:
```json
{
  "success": true,
  "data": {
    "kpiScore": {
      "_id": "507f1f77bcf86cd799439012",
      "userId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@company.com",
        "employeeId": "FE2401001"
      },
      "overallScore": 78.5,
      "rating": "Good",
      "period": "2024-01",
      "triggeredActions": ["training", "audit"],
      "automationStatus": "completed",
      "processedAt": "2024-02-10T10:30:00.000Z"
    },
    "automationStats": {
      "trainingAssignments": 2,
      "auditSchedules": 1,
      "emailLogs": 5
    }
  }
}
```

### 6. Get Pending Automation

**GET** `/api/kpi/pending-automation`

**Description**: Get KPI scores pending automation processing.

**Access**: Admin only

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response**:
```json
{
  "success": true,
  "data": {
    "pendingKPIs": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@company.com",
          "employeeId": "FE2401001",
          "department": "Sales"
        },
        "overallScore": 78.5,
        "rating": "Good",
        "automationStatus": "pending",
        "period": "2024-01",
        "submittedBy": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Admin User",
          "email": "admin@company.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    },
    "automationStats": {
      "pending": 15,
      "processing": 2,
      "completed": 150,
      "failed": 3
    }
  }
}
```

## KPI Metrics

The enhanced KPI system supports all 7 metrics:

### Core Metrics
- **TAT (Turn Around Time)**: 0-100 (percentage)
- **Quality**: 0-100 (percentage)
- **App Usage**: 0-100 (percentage)

### Negativity Metrics
- **Negativity**: 0-100 (percentage)
- **Major Negativity**: 0-10 (count)
- **General Negativity**: 0-100 (percentage)

### Additional Metrics
- **Neighbor Check**: 0-100 (percentage)
- **Insufficiency**: 0-10 (count)

## Automation Status

KPI scores can have the following automation statuses:

- `pending`: Automation not yet processed
- `processing`: Automation currently being processed
- `completed`: Automation completed successfully
- `failed`: Automation failed

## Triggered Actions

Based on KPI scores, the following actions can be triggered:

### Training Assignments
- **Basic Training**: Overall score < 55 or < 40
- **Negativity Handling Training**: Major negativity > 0 and negativity < 25
- **Do's & Don'ts Training**: Quality > 1
- **Application Usage Training**: App usage < 80

### Audit Scheduling
- **Audit Call**: Overall score < 70
- **Cross-check**: Overall score < 70
- **Dummy Audit**: Overall score < 50
- **Cross-verification**: Insufficiency > 2

### Email Notifications
- **KPI Score Notification**: All users
- **Training Assignment**: Training triggers
- **Audit Notification**: Audit triggers
- **Warning Letter**: Warning triggers

## Validation Rules

### KPI Score Validation
- `userId`: Valid MongoDB ObjectId
- `tat`: Float between 0-100
- `quality`: Float between 0-100
- `appUsage`: Float between 0-100
- `negativity`: Float between 0-100 (optional)
- `majorNegativity`: Integer between 0-10 (optional)
- `neighborCheck`: Float between 0-100 (optional)
- `generalNegativity`: Float between 0-100 (optional)
- `insufficiency`: Integer between 0-10 (optional)
- `period`: String in YYYY-MM format
- `comments`: String up to 500 characters (optional)

### Period Format
Period must be in YYYY-MM format (e.g., "2024-01", "2024-12")

## Error Handling

### Automation Failures
- KPI scores are saved even if automation fails
- Automation status is marked as 'failed'
- Error details are logged
- Manual reprocessing is available

### Validation Errors
```json
{
  "error": "Validation Error",
  "message": "Validation failed",
  "details": [
    {
      "field": "tat",
      "message": "TAT must be between 0 and 100"
    }
  ]
}
```

### Server Errors
```json
{
  "error": "Server Error",
  "message": "Error processing KPI score"
}
```

## Backward Compatibility

The enhanced API maintains backward compatibility:

### Existing Endpoints
- All existing endpoints continue to work
- Response format is enhanced but compatible
- Additional fields are optional

### Frontend Integration
- Existing frontend code continues to work
- New automation data is available in responses
- Enhanced validation provides better error messages

## Usage Examples

### Submit KPI with All Metrics
```javascript
const response = await fetch('/api/kpi', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: '507f1f77bcf86cd799439011',
    tat: 85.5,
    quality: 92.0,
    appUsage: 78.5,
    negativity: 15.0,
    majorNegativity: 2,
    neighborCheck: 88.0,
    generalNegativity: 12.0,
    insufficiency: 1,
    period: '2024-01',
    comments: 'Good performance overall'
  })
});

const result = await response.json();
console.log('KPI submitted:', result.message);
console.log('Automation status:', result.automation.status);
```

### Get User KPI with Automation Data
```javascript
const response = await fetch('/api/kpi/507f1f77bcf86cd799439011', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
console.log('KPI Score:', result.kpiScore.overallScore);
console.log('Training Assignments:', result.automationData.trainingAssignments.length);
console.log('Audit Schedules:', result.automationData.auditSchedules.length);
```

### Get KPI Triggers
```javascript
const response = await fetch('/api/kpi/507f1f77bcf86cd799439012/triggers', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
console.log('Triggers:', result.data.triggers);
```

### Reprocess KPI Triggers
```javascript
const response = await fetch('/api/kpi/507f1f77bcf86cd799439012/reprocess', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
console.log('Reprocessing result:', result.data.automationResult);
```

### Get Pending Automation
```javascript
const response = await fetch('/api/kpi/pending-automation?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
console.log('Pending KPIs:', result.data.pendingKPIs.length);
console.log('Automation stats:', result.data.automationStats);
```

## Performance Considerations

1. **Asynchronous Processing**: Automation runs asynchronously to avoid blocking KPI submission
2. **Error Resilience**: KPI scores are saved even if automation fails
3. **Pagination**: All list endpoints support pagination
4. **Indexing**: Database indexes for optimal query performance
5. **Caching**: Consider implementing caching for frequently accessed data

## Security Features

1. **Authentication**: JWT token required for all endpoints
2. **Authorization**: Role-based access control
3. **Input Validation**: Comprehensive input validation
4. **SQL Injection Prevention**: Parameterized queries
5. **Rate Limiting**: API rate limiting applied

## Integration Points

### KPITriggerService
- Complete integration with automation service
- Automatic trigger processing
- Training assignment creation
- Audit scheduling
- Email notification sending

### Email Service
- Automatic email notifications
- Template-based emails
- Delivery tracking
- Retry mechanisms

### Lifecycle Service
- Automatic lifecycle event creation
- Performance tracking
- Status updates

### User Management
- User status updates
- Progress tracking
- Performance correlation

This enhanced KPI API provides a complete solution for KPI management with full automation integration, maintaining backward compatibility while adding powerful new features.
