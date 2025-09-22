# Audit Scheduling API Routes

This document describes the comprehensive API routes for audit scheduling management in the KPI automation system.

## Overview

The audit scheduling API provides complete management of audit scheduling including:
- Automated scheduling based on KPI triggers
- Manual scheduling by administrators
- Status tracking and completion
- User-specific audit history
- Statistics and reporting

## Base URL

All endpoints are prefixed with `/api/audit-scheduling`

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Schedule KPI Audits

**POST** `/api/audit-scheduling/schedule-kpi-audits`

**Description**: Automatically schedule audits based on KPI triggers.

**Access**: Admin only

**Request Body**:
```json
{
  "kpiScoreId": "507f1f77bcf86cd799439011"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully scheduled 2 audit(s)",
  "data": {
    "auditSchedules": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "John Doe",
          "email": "john@company.com",
          "employeeId": "FE2401001"
        },
        "auditType": "audit_call",
        "scheduledDate": "2024-02-15T00:00:00.000Z",
        "status": "scheduled",
        "priority": "high",
        "kpiTriggerId": "507f1f77bcf86cd799439011",
        "auditScope": "Overall KPI score 45% is below threshold"
      }
    ],
    "processingTime": 1250,
    "emailResults": [...],
    "lifecycleEvents": [...]
  }
}
```

### 2. Get Scheduled Audits

**GET** `/api/audit-scheduling/scheduled`

**Description**: Get all scheduled audits with pagination and filtering.

**Access**: Admin only

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `auditType` (optional): Filter by audit type
- `priority` (optional): Filter by priority
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response**:
```json
{
  "success": true,
  "data": {
    "audits": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "John Doe",
          "email": "john@company.com",
          "employeeId": "FE2401001",
          "department": "Sales"
        },
        "auditType": "audit_call",
        "scheduledDate": "2024-02-15T00:00:00.000Z",
        "status": "scheduled",
        "priority": "high",
        "assignedTo": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Compliance Officer",
          "email": "compliance@company.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10
    },
    "statistics": [
      {
        "_id": "scheduled",
        "count": 35
      },
      {
        "_id": "in_progress",
        "count": 12
      }
    ]
  }
}
```

### 3. Get Overdue Audits

**GET** `/api/audit-scheduling/overdue`

**Description**: Get all overdue audits.

**Access**: Admin only

**Query Parameters**: Same as scheduled audits

**Response**: Same format as scheduled audits

### 4. Complete Audit

**PUT** `/api/audit-scheduling/:id/complete`

**Description**: Mark an audit as completed with findings.

**Access**: Admin only

**Request Body**:
```json
{
  "findings": "Audit completed successfully. No major issues found. Minor improvements needed in documentation.",
  "recommendations": "Improve documentation standards and implement regular review process",
  "riskLevel": "low",
  "complianceStatus": "compliant"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Audit marked as completed",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@company.com",
      "employeeId": "FE2401001"
    },
    "auditType": "audit_call",
    "status": "completed",
    "completedDate": "2024-02-10T10:30:00.000Z",
    "findings": "Audit completed successfully. No major issues found.",
    "recommendations": "Improve documentation standards",
    "riskLevel": "low",
    "complianceStatus": "compliant"
  }
}
```

### 5. Get User Audit History

**GET** `/api/audit-scheduling/user/:userId`

**Description**: Get audit history for a specific user.

**Access**: User can access own history, admin can access any

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status
- `auditType` (optional): Filter by audit type
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response**: Same format as scheduled audits

### 6. Manual Audit Scheduling

**POST** `/api/audit-scheduling/manual`

**Description**: Manually schedule an audit for a user.

**Access**: Admin only

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439013",
  "auditType": "cross_check",
  "scheduledDate": "2024-02-20T00:00:00.000Z",
  "priority": "medium",
  "auditScope": "Cross-verification of last 3 months data",
  "auditMethod": "Data review and verification process"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Audit scheduled successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@company.com",
      "employeeId": "FE2401001"
    },
    "auditType": "cross_check",
    "scheduledDate": "2024-02-20T00:00:00.000Z",
    "status": "scheduled",
    "priority": "medium",
    "auditScope": "Cross-verification of last 3 months data",
    "auditMethod": "Data review and verification process",
    "assignedBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Admin User",
      "email": "admin@company.com"
    }
  }
}
```

### 7. Cancel Audit

**DELETE** `/api/audit-scheduling/:id`

**Description**: Cancel a scheduled audit.

**Access**: Admin only

**Response**:
```json
{
  "success": true,
  "message": "Audit cancelled successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "status": "cancelled",
    "cancelledAt": "2024-02-10T10:30:00.000Z"
  }
}
```

### 8. Get Statistics

**GET** `/api/audit-scheduling/stats`

**Description**: Get audit scheduling statistics.

**Access**: Admin only

**Query Parameters**:
- `auditType` (optional): Filter by audit type
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response**:
```json
{
  "success": true,
  "data": {
    "overallStats": [
      {
        "_id": "scheduled",
        "count": 35
      },
      {
        "_id": "completed",
        "count": 28
      },
      {
        "_id": "in_progress",
        "count": 7
      }
    ],
    "typeDistribution": [
      {
        "_id": "audit_call",
        "count": 25,
        "completed": 20
      },
      {
        "_id": "cross_check",
        "count": 15,
        "completed": 8
      }
    ],
    "statusDistribution": [
      {
        "_id": "scheduled",
        "count": 35
      },
      {
        "_id": "completed",
        "count": 28
      }
    ],
    "priorityDistribution": [
      {
        "_id": "high",
        "count": 15
      },
      {
        "_id": "medium",
        "count": 30
      },
      {
        "_id": "low",
        "count": 10
      }
    ],
    "completionRate": 80.0,
    "totalAudits": 70,
    "completedAudits": 56,
    "overdueAudits": 5
  }
}
```

### 9. Get Specific Audit

**GET** `/api/audit-scheduling/:id`

**Description**: Get a specific audit schedule.

**Access**: User can access own audits, admin can access any

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@company.com",
      "employeeId": "FE2401001",
      "department": "Sales"
    },
    "auditType": "audit_call",
    "scheduledDate": "2024-02-15T00:00:00.000Z",
    "status": "scheduled",
    "priority": "high",
    "kpiTriggerId": {
      "_id": "507f1f77bcf86cd799439011",
      "overallScore": 45,
      "rating": "Need Improvement",
      "period": "2024-01"
    },
    "auditScope": "Overall KPI score 45% is below threshold"
  }
}
```

### 10. Update Audit Schedule

**PUT** `/api/audit-scheduling/:id`

**Description**: Update an audit schedule.

**Access**: Admin only

**Request Body**:
```json
{
  "scheduledDate": "2024-02-25T00:00:00.000Z",
  "priority": "critical",
  "auditScope": "Updated audit scope",
  "assignedTo": "507f1f77bcf86cd799439014"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Audit schedule updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@company.com",
      "employeeId": "FE2401001"
    },
    "auditType": "audit_call",
    "scheduledDate": "2024-02-25T00:00:00.000Z",
    "priority": "critical",
    "auditScope": "Updated audit scope",
    "assignedTo": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Compliance Officer",
      "email": "compliance@company.com"
    }
  }
}
```

### 11. Get Upcoming Audits

**GET** `/api/audit-scheduling/upcoming`

**Description**: Get upcoming audits within specified days.

**Access**: Admin only

**Query Parameters**:
- `days` (optional): Number of days ahead (default: 7)
- `limit` (optional): Maximum number of results (default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "audits": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "John Doe",
          "email": "john@company.com",
          "employeeId": "FE2401001"
        },
        "auditType": "audit_call",
        "scheduledDate": "2024-02-15T00:00:00.000Z",
        "priority": "high"
      }
    ],
    "days": 7,
    "totalUpcoming": 5
  }
}
```

## Audit Types

The following audit types are supported:

- `audit_call`: Audit Call
- `cross_check`: Cross-check last 3 months data
- `dummy_audit`: Dummy Audit Case

## Status Values

Audit schedules can have the following statuses:

- `scheduled`: Audit has been scheduled
- `in_progress`: Audit is in progress
- `completed`: Audit has been completed
- `cancelled`: Audit has been cancelled

## Priority Levels

Audit schedules can have the following priority levels:

- `low`: Low priority
- `medium`: Medium priority
- `high`: High priority
- `critical`: Critical priority

## Compliance Status

Completed audits can have the following compliance statuses:

- `compliant`: Fully compliant
- `non_compliant`: Non-compliant
- `partially_compliant`: Partially compliant
- `not_assessed`: Not assessed

## Risk Levels

Completed audits can have the following risk levels:

- `low`: Low risk
- `medium`: Medium risk
- `high`: High risk
- `critical`: Critical risk

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Human readable error message",
  "details": "Additional error details (optional)"
}
```

Common error types:
- `Validation Error`: Input validation failed
- `Not Found`: Resource not found
- `Access Denied`: Insufficient permissions
- `Server Error`: Internal server error

## Integration Points

### KPI Trigger Service
- Schedule KPI audits endpoint integrates with KPITriggerService
- Automatic audit scheduling based on KPI performance
- Complete automation workflow

### Email Service
- Automatic email notifications for audit scheduling
- Completion notifications
- Integration with EmailLog model

### Lifecycle Service
- Automatic lifecycle event creation
- Audit completion tracking
- Performance correlation

### User Management
- User status updates based on audit results
- Progress tracking
- Performance correlation

## Usage Examples

### Schedule Audits Based on KPI
```javascript
// Trigger automatic audit scheduling
const response = await fetch('/api/audit-scheduling/schedule-kpi-audits', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    kpiScoreId: '507f1f77bcf86cd799439011'
  })
});

const result = await response.json();
console.log(`Scheduled ${result.data.auditSchedules.length} audits`);
```

### Get Scheduled Audits
```javascript
// Get scheduled audits
const response = await fetch('/api/audit-scheduling/scheduled?page=1&limit=10&auditType=audit_call', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
console.log(`Found ${result.data.audits.length} scheduled audits`);
```

### Complete Audit
```javascript
// Mark audit as completed
const response = await fetch('/api/audit-scheduling/507f1f77bcf86cd799439012/complete', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    findings: 'Audit completed successfully. No major issues found.',
    recommendations: 'Improve documentation standards',
    riskLevel: 'low',
    complianceStatus: 'compliant'
  })
});

const result = await response.json();
console.log('Audit completed:', result.message);
```

### Get User Audit History
```javascript
// Get user's audit history
const response = await fetch('/api/audit-scheduling/user/507f1f77bcf86cd799439013?status=completed', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
console.log(`Found ${result.data.audits.length} completed audits`);
```

## Performance Considerations

1. **Pagination**: All list endpoints support pagination
2. **Filtering**: Efficient filtering by status, type, priority, and date
3. **Indexing**: Database indexes for optimal query performance
4. **Caching**: Consider implementing caching for statistics
5. **Batch Operations**: Support for bulk operations

## Security Features

1. **Authentication**: JWT token required for all endpoints
2. **Authorization**: Role-based access control
3. **Input Validation**: Comprehensive input validation
4. **SQL Injection Prevention**: Parameterized queries
5. **Rate Limiting**: API rate limiting applied

This API provides a complete solution for audit scheduling management with full integration into the KPI automation system.
