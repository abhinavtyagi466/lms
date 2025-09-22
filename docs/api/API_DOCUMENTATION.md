# KPI Automation System - API Documentation

## Overview

This document provides comprehensive API documentation for the KPI automation system, including all endpoints, request/response formats, error codes, and examples.

## Base URL

```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## KPI Management API

### Submit KPI Score with Automation

**POST** `/api/kpi`

Submit a KPI score and automatically trigger training assignments, audit scheduling, and email notifications.

#### Request Body
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "period": "2024-03",
  "tat": 85,
  "majorNegativity": 1,
  "quality": 90,
  "neighborCheck": 80,
  "generalNegativity": 15,
  "appUsage": 95,
  "insufficiency": 1,
  "emailRecipients": ["field_executive", "coordinator", "manager"]
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "userId": "507f1f77bcf86cd799439011",
    "period": "2024-03",
    "overallScore": 75,
    "rating": "good",
    "tat": 85,
    "majorNegativity": 1,
    "quality": 90,
    "neighborCheck": 80,
    "generalNegativity": 15,
    "appUsage": 95,
    "insufficiency": 1,
    "automationStatus": "completed",
    "processedAt": "2024-03-15T10:00:00Z",
    "trainingAssignments": [],
    "auditSchedules": [],
    "emailLogs": ["507f1f77bcf86cd799439051"],
    "createdAt": "2024-03-15T10:00:00Z",
    "updatedAt": "2024-03-15T10:00:00Z"
  },
  "automationResult": {
    "trainingAssignments": 0,
    "audits": 0,
    "emails": 1,
    "processingTime": 1250
  }
}
```

### Get User KPI Data

**GET** `/api/kpi/:userId`

Get KPI data for a specific user including automation status and related data.

#### Response
```json
{
  "success": true,
  "data": {
    "currentKPI": {
      "_id": "507f1f77bcf86cd799439021",
      "period": "2024-03",
      "overallScore": 75,
      "rating": "good",
      "automationStatus": "completed"
    },
    "kpiHistory": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "period": "2024-02",
        "overallScore": 65,
        "rating": "average"
      }
    ],
    "trainingAssignments": [
      {
        "_id": "507f1f77bcf86cd799439031",
        "trainingType": "app_usage",
        "status": "assigned",
        "dueDate": "2024-04-01"
      }
    ],
    "auditSchedules": [
      {
        "_id": "507f1f77bcf86cd799439041",
        "auditType": "audit_call",
        "status": "scheduled",
        "scheduledDate": "2024-04-10"
      }
    ],
    "emailLogs": [
      {
        "_id": "507f1f77bcf86cd799439051",
        "templateType": "kpi_notification",
        "status": "sent",
        "sentAt": "2024-03-15T10:00:00Z"
      }
    ]
  }
}
```

### Get KPI Triggers

**GET** `/api/kpi/:id/triggers`

Get calculated triggers for a specific KPI score.

#### Response
```json
{
  "success": true,
  "data": {
    "kpiScoreId": "507f1f77bcf86cd799439021",
    "overallScore": 45,
    "rating": "below average",
    "triggers": {
      "trainingAssignments": [
        {
          "type": "basic",
          "reason": "Overall score below 55",
          "priority": "high"
        },
        {
          "type": "negativity_handling",
          "reason": "Major negativity > 0 and general negativity < 25",
          "priority": "medium"
        }
      ],
      "audits": [
        {
          "type": "audit_call",
          "reason": "Overall score below 70",
          "priority": "high"
        }
      ],
      "emails": [
        {
          "template": "kpi_notification",
          "recipients": ["field_executive", "coordinator", "manager"],
          "priority": "medium"
        }
      ]
    }
  }
}
```

### Reprocess KPI Triggers

**POST** `/api/kpi/:id/reprocess`

Manually reprocess triggers for a KPI score.

#### Response
```json
{
  "success": true,
  "data": {
    "automationStatus": "completed",
    "processedAt": "2024-03-15T10:05:00Z",
    "results": {
      "trainingAssignments": 2,
      "audits": 1,
      "emails": 3
    }
  }
}
```

### Get KPI Statistics

**GET** `/api/kpi/stats`

Get comprehensive KPI statistics and analytics.

#### Response
```json
{
  "success": true,
  "data": {
    "totalKPIScores": 150,
    "averageScore": 72.5,
    "scoreDistribution": {
      "excellent": 25,
      "good": 45,
      "average": 35,
      "belowAverage": 30,
      "poor": 15
    },
    "automationStats": {
      "totalProcessed": 150,
      "successful": 145,
      "failed": 5,
      "pending": 0
    },
    "trends": {
      "monthlyAverage": [70, 72, 75, 73],
      "improvementRate": 4.3
    }
  }
}
```

## Training Assignment API

### Auto-Assign Training

**POST** `/api/training-assignments/auto-assign`

Automatically assign training based on KPI triggers.

#### Request Body
```json
{
  "kpiScoreId": "507f1f77bcf86cd799439021"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "trainingAssignments": [
      {
        "_id": "507f1f77bcf86cd799439031",
        "userId": "507f1f77bcf86cd799439011",
        "trainingType": "basic",
        "assignedBy": "kpi_trigger",
        "dueDate": "2024-04-01",
        "status": "assigned",
        "kpiTriggerId": "507f1f77bcf86cd799439021"
      }
    ],
    "totalAssigned": 1
  }
}
```

### Get Pending Training Assignments

**GET** `/api/training-assignments/pending`

Get all pending training assignments with pagination.

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `trainingType` (optional): Filter by training type
- `status` (optional): Filter by status

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439031",
      "userId": "507f1f77bcf86cd799439011",
      "user": {
        "name": "John Doe",
        "email": "john.doe@example.com"
      },
      "trainingType": "basic",
      "status": "assigned",
      "dueDate": "2024-04-01",
      "assignedBy": "kpi_trigger",
      "createdAt": "2024-03-15T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45,
    "itemsPerPage": 10
  }
}
```

### Complete Training Assignment

**PUT** `/api/training-assignments/:id/complete`

Mark a training assignment as completed with score.

#### Request Body
```json
{
  "score": 85,
  "completionDate": "2024-03-25T14:30:00Z",
  "notes": "Completed successfully with good understanding"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "status": "completed",
    "score": 85,
    "completionDate": "2024-03-25T14:30:00Z",
    "notes": "Completed successfully with good understanding",
    "updatedAt": "2024-03-25T14:30:00Z"
  }
}
```

### Get Training Statistics

**GET** `/api/training-assignments/stats`

Get training assignment statistics and analytics.

#### Response
```json
{
  "success": true,
  "data": {
    "total": 120,
    "assigned": 25,
    "inProgress": 15,
    "completed": 75,
    "overdue": 5,
    "completionRate": 78.1,
    "averageScore": 82.5,
    "byType": {
      "basic": 30,
      "negativity_handling": 25,
      "dos_donts": 20,
      "app_usage": 45
    }
  }
}
```

## Audit Scheduling API

### Schedule KPI Audits

**POST** `/api/audit-scheduling/schedule-kpi-audits`

Automatically schedule audits based on KPI triggers.

#### Request Body
```json
{
  "kpiScoreId": "507f1f77bcf86cd799439021"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "auditSchedules": [
      {
        "_id": "507f1f77bcf86cd799439041",
        "userId": "507f1f77bcf86cd799439011",
        "auditType": "audit_call",
        "scheduledDate": "2024-04-10",
        "status": "scheduled",
        "kpiTriggerId": "507f1f77bcf86cd799439021"
      }
    ],
    "totalScheduled": 1
  }
}
```

### Get Scheduled Audits

**GET** `/api/audit-scheduling/scheduled`

Get all scheduled audits with pagination.

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `auditType` (optional): Filter by audit type
- `status` (optional): Filter by status

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439041",
      "userId": "507f1f77bcf86cd799439011",
      "user": {
        "name": "John Doe",
        "email": "john.doe@example.com"
      },
      "auditType": "audit_call",
      "scheduledDate": "2024-04-10",
      "status": "scheduled",
      "kpiTriggerId": "507f1f77bcf86cd799439021",
      "createdAt": "2024-03-15T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

### Complete Audit

**PUT** `/api/audit-scheduling/:id/complete`

Mark an audit as completed with findings.

#### Request Body
```json
{
  "findings": "Good performance overall, minor improvements needed in customer interaction",
  "completionDate": "2024-04-10T15:00:00Z",
  "score": 8.5
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439041",
    "status": "completed",
    "findings": "Good performance overall, minor improvements needed in customer interaction",
    "completionDate": "2024-04-10T15:00:00Z",
    "score": 8.5,
    "updatedAt": "2024-04-10T15:00:00Z"
  }
}
```

### Get Audit Statistics

**GET** `/api/audit-scheduling/stats`

Get audit scheduling statistics and analytics.

#### Response
```json
{
  "success": true,
  "data": {
    "total": 80,
    "scheduled": 20,
    "inProgress": 10,
    "completed": 45,
    "overdue": 5,
    "completionRate": 81.8,
    "averageScore": 7.8,
    "byType": {
      "audit_call": 30,
      "cross_check": 25,
      "dummy_audit": 25
    }
  }
}
```

## Email Management API

### Get Email Logs

**GET** `/api/email-logs`

Get all email logs with filtering and pagination.

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `templateType` (optional): Filter by template type
- `status` (optional): Filter by status
- `recipientEmail` (optional): Filter by recipient email

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439051",
      "recipientEmail": "john.doe@example.com",
      "recipientRole": "field_executive",
      "templateType": "kpi_notification",
      "subject": "KPI Score Notification - March 2024",
      "sentAt": "2024-03-15T10:00:00Z",
      "status": "sent",
      "kpiTriggerId": "507f1f77bcf86cd799439021"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 95,
    "itemsPerPage": 10
  }
}
```

### Resend Failed Email

**POST** `/api/email-logs/:id/resend`

Resend a failed email.

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439051",
    "status": "sent",
    "sentAt": "2024-03-15T10:05:00Z",
    "retryCount": 1
  }
}
```

### Retry All Failed Emails

**POST** `/api/email-logs/retry-failed`

Retry all failed emails.

#### Response
```json
{
  "success": true,
  "data": {
    "retriedCount": 5,
    "successfulRetries": 4,
    "failedRetries": 1,
    "retryResults": [
      {
        "emailId": "507f1f77bcf86cd799439051",
        "status": "sent"
      }
    ]
  }
}
```

### Get Email Statistics

**GET** `/api/email-stats`

Get email statistics and analytics.

#### Response
```json
{
  "success": true,
  "data": {
    "total": 500,
    "sent": 480,
    "failed": 15,
    "pending": 5,
    "successRate": 96.0,
    "byTemplate": {
      "kpi_notification": 200,
      "training_assignment": 150,
      "audit_notification": 100,
      "warning_letter": 50
    },
    "deliveryStats": {
      "averageDeliveryTime": 2.5,
      "retryRate": 3.0
    }
  }
}
```

## Error Codes

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `AUTHENTICATION_ERROR` | Invalid or missing authentication | 401 |
| `AUTHORIZATION_ERROR` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `DUPLICATE_ERROR` | Duplicate resource | 409 |
| `PROCESSING_ERROR` | Automation processing failed | 422 |
| `SERVER_ERROR` | Internal server error | 500 |

### KPI-Specific Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_KPI_SCORE` | KPI score out of valid range | 400 |
| `DUPLICATE_KPI_PERIOD` | KPI already exists for this period | 409 |
| `AUTOMATION_FAILED` | KPI automation processing failed | 422 |
| `TRIGGER_CALCULATION_ERROR` | Error calculating triggers | 422 |

### Training-Specific Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_TRAINING_TYPE` | Invalid training type | 400 |
| `TRAINING_NOT_FOUND` | Training assignment not found | 404 |
| `TRAINING_ALREADY_COMPLETED` | Training already completed | 409 |
| `INVALID_COMPLETION_SCORE` | Invalid completion score | 400 |

### Audit-Specific Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_AUDIT_TYPE` | Invalid audit type | 400 |
| `AUDIT_NOT_FOUND` | Audit schedule not found | 404 |
| `AUDIT_ALREADY_COMPLETED` | Audit already completed | 409 |
| `INVALID_SCHEDULE_DATE` | Invalid schedule date | 400 |

### Email-Specific Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_EMAIL_TEMPLATE` | Invalid email template | 400 |
| `EMAIL_SEND_FAILED` | Email sending failed | 422 |
| `INVALID_RECIPIENT` | Invalid email recipient | 400 |
| `EMAIL_ALREADY_SENT` | Email already sent | 409 |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per minute per IP
- **KPI submission**: 10 requests per minute per user
- **Email operations**: 20 requests per minute per user
- **Bulk operations**: 5 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

Most list endpoints support pagination:

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

### Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 95,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Filtering and Sorting

### Filtering
Most endpoints support filtering using query parameters:
- `status`: Filter by status
- `type`: Filter by type
- `dateFrom`: Filter from date (ISO format)
- `dateTo`: Filter to date (ISO format)

### Sorting
Sorting is supported using the `sort` query parameter:
- `sort=field:asc` - Sort by field in ascending order
- `sort=field:desc` - Sort by field in descending order
- `sort=field1:asc,field2:desc` - Multiple field sorting

## Webhooks

The system supports webhooks for real-time notifications:

### Webhook Events
- `kpi.submitted` - KPI score submitted
- `kpi.automation.completed` - KPI automation completed
- `training.assigned` - Training assignment created
- `training.completed` - Training assignment completed
- `audit.scheduled` - Audit scheduled
- `audit.completed` - Audit completed
- `email.sent` - Email sent successfully
- `email.failed` - Email sending failed

### Webhook Payload
```json
{
  "event": "kpi.submitted",
  "timestamp": "2024-03-15T10:00:00Z",
  "data": {
    "kpiScoreId": "507f1f77bcf86cd799439021",
    "userId": "507f1f77bcf86cd799439011",
    "overallScore": 75,
    "rating": "good"
  }
}
```

## Testing

### Test Environment
Use the test environment for development and testing:
```
Base URL: http://localhost:3001/api
```

### Test Data
The system includes comprehensive test data for all scenarios:
- Sample KPI scores for different performance levels
- Sample training assignments
- Sample audit schedules
- Sample email logs

### API Testing Tools
Recommended tools for API testing:
- **Postman**: For manual testing and collection management
- **Insomnia**: Alternative API testing tool
- **curl**: Command-line testing
- **Jest**: Automated testing (included in test suite)

## Support

For API support and questions:
- **Documentation**: This API documentation
- **Test Suite**: Comprehensive test suite included
- **Error Logs**: Check server logs for detailed error information
- **Contact**: Development team for technical support
