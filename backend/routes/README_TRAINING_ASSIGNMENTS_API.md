# Training Assignment API Routes

This document describes the comprehensive API routes for training assignment management in the KPI automation system.

## Overview

The training assignment API provides complete management of training assignments including:
- Automated assignment based on KPI triggers
- Manual assignment by administrators
- Status tracking and completion
- User-specific assignment views
- Statistics and reporting

## Base URL

All endpoints are prefixed with `/api/training-assignments`

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Auto-Assign Trainings

**POST** `/api/training-assignments/auto-assign`

**Description**: Automatically assign trainings based on KPI triggers.

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
  "message": "Successfully created 2 training assignment(s)",
  "data": {
    "assignments": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "John Doe",
          "email": "john@company.com",
          "employeeId": "FE2401001"
        },
        "trainingType": "basic",
        "assignedBy": "kpi_trigger",
        "dueDate": "2024-02-15T00:00:00.000Z",
        "status": "assigned",
        "kpiTriggerId": "507f1f77bcf86cd799439011",
        "notes": "Overall KPI score 45% is below threshold"
      }
    ],
    "processingTime": 1250,
    "emailResults": [...],
    "lifecycleEvents": [...]
  }
}
```

### 2. Get Pending Assignments

**GET** `/api/training-assignments/pending`

**Description**: Get all pending training assignments with pagination and filtering.

**Access**: Admin only

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `trainingType` (optional): Filter by training type
- `status` (optional): Filter by status

**Response**:
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "John Doe",
          "email": "john@company.com",
          "employeeId": "FE2401001",
          "department": "Sales"
        },
        "trainingType": "basic",
        "dueDate": "2024-02-15T00:00:00.000Z",
        "status": "assigned",
        "assignedByUser": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Admin User",
          "email": "admin@company.com"
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
        "_id": "assigned",
        "count": 35
      },
      {
        "_id": "overdue",
        "count": 12
      }
    ]
  }
}
```

### 3. Get Overdue Assignments

**GET** `/api/training-assignments/overdue`

**Description**: Get all overdue training assignments.

**Access**: Admin only

**Query Parameters**: Same as pending assignments

**Response**: Same format as pending assignments

### 4. Complete Training

**PUT** `/api/training-assignments/:id/complete`

**Description**: Mark a training assignment as completed.

**Access**: Admin only

**Request Body**:
```json
{
  "score": 85,
  "notes": "Completed successfully with good understanding"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Training assignment marked as completed",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@company.com",
      "employeeId": "FE2401001"
    },
    "trainingType": "basic",
    "status": "completed",
    "completionDate": "2024-02-10T10:30:00.000Z",
    "score": 85,
    "notes": "Completed successfully with good understanding"
  }
}
```

### 5. Get User Assignments

**GET** `/api/training-assignments/user/:userId`

**Description**: Get training assignments for a specific user.

**Access**: User can access own assignments, admin can access any

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status
- `trainingType` (optional): Filter by training type

**Response**: Same format as pending assignments

### 6. Manual Assignment

**POST** `/api/training-assignments/manual`

**Description**: Manually assign training to a user.

**Access**: Admin only

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439013",
  "trainingType": "negativity_handling",
  "dueDate": "2024-02-20T00:00:00.000Z",
  "notes": "Manual assignment for performance improvement"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Training assignment created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@company.com",
      "employeeId": "FE2401001"
    },
    "trainingType": "negativity_handling",
    "assignedBy": "manual",
    "dueDate": "2024-02-20T00:00:00.000Z",
    "status": "assigned",
    "notes": "Manual assignment for performance improvement",
    "assignedByUser": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Admin User",
      "email": "admin@company.com"
    }
  }
}
```

### 7. Cancel Assignment

**DELETE** `/api/training-assignments/:id`

**Description**: Cancel a training assignment.

**Access**: Admin only

**Response**:
```json
{
  "success": true,
  "message": "Training assignment cancelled successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "status": "cancelled",
    "cancelledAt": "2024-02-10T10:30:00.000Z"
  }
}
```

### 8. Get Statistics

**GET** `/api/training-assignments/stats`

**Description**: Get training assignment statistics.

**Access**: Admin only

**Query Parameters**:
- `trainingType` (optional): Filter by training type
- `status` (optional): Filter by status
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response**:
```json
{
  "success": true,
  "data": {
    "overallStats": [
      {
        "_id": "assigned",
        "count": 35
      },
      {
        "_id": "completed",
        "count": 28
      },
      {
        "_id": "overdue",
        "count": 7
      }
    ],
    "typeDistribution": [
      {
        "_id": "basic",
        "count": 25,
        "completed": 20
      },
      {
        "_id": "negativity_handling",
        "count": 15,
        "completed": 8
      }
    ],
    "statusDistribution": [
      {
        "_id": "assigned",
        "count": 35
      },
      {
        "_id": "completed",
        "count": 28
      }
    ],
    "completionRate": 80.0,
    "totalAssignments": 70,
    "completedAssignments": 56
  }
}
```

### 9. Get Specific Assignment

**GET** `/api/training-assignments/:id`

**Description**: Get a specific training assignment.

**Access**: User can access own assignments, admin can access any

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
    "trainingType": "basic",
    "assignedBy": "kpi_trigger",
    "dueDate": "2024-02-15T00:00:00.000Z",
    "status": "assigned",
    "kpiTriggerId": {
      "_id": "507f1f77bcf86cd799439011",
      "overallScore": 45,
      "rating": "Need Improvement",
      "period": "2024-01"
    },
    "notes": "Overall KPI score 45% is below threshold"
  }
}
```

### 10. Update Assignment

**PUT** `/api/training-assignments/:id`

**Description**: Update a training assignment.

**Access**: Admin only

**Request Body**:
```json
{
  "dueDate": "2024-02-25T00:00:00.000Z",
  "notes": "Extended due date",
  "status": "in_progress"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Training assignment updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@company.com",
      "employeeId": "FE2401001"
    },
    "trainingType": "basic",
    "dueDate": "2024-02-25T00:00:00.000Z",
    "status": "in_progress",
    "notes": "Extended due date"
  }
}
```

## Training Types

The following training types are supported:

- `basic`: Basic Training Module
- `negativity_handling`: Negativity Handling Training
- `dos_donts`: Do's & Don'ts Training
- `app_usage`: Application Usage Training

## Status Values

Training assignments can have the following statuses:

- `assigned`: Training has been assigned
- `in_progress`: Training is in progress
- `completed`: Training has been completed
- `overdue`: Training is past due date
- `cancelled`: Training assignment has been cancelled

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
- Auto-assign endpoint integrates with KPITriggerService
- Automatic training assignment based on KPI performance
- Complete automation workflow

### Email Service
- Automatic email notifications for assignments
- Completion notifications
- Integration with EmailLog model

### Lifecycle Service
- Automatic lifecycle event creation
- Training completion tracking
- Performance improvement tracking

### User Management
- User status updates based on training completion
- Progress tracking
- Performance correlation

## Usage Examples

### Auto-Assign Based on KPI
```javascript
// Trigger automatic training assignment
const response = await fetch('/api/training-assignments/auto-assign', {
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
console.log(`Created ${result.data.assignments.length} training assignments`);
```

### Get User's Assignments
```javascript
// Get user's training assignments
const response = await fetch('/api/training-assignments/user/507f1f77bcf86cd799439013?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
console.log(`Found ${result.data.assignments.length} assignments`);
```

### Complete Training
```javascript
// Mark training as completed
const response = await fetch('/api/training-assignments/507f1f77bcf86cd799439012/complete', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    score: 85,
    notes: 'Completed successfully'
  })
});

const result = await response.json();
console.log('Training completed:', result.message);
```

## Performance Considerations

1. **Pagination**: All list endpoints support pagination
2. **Filtering**: Efficient filtering by status, type, and date
3. **Indexing**: Database indexes for optimal query performance
4. **Caching**: Consider implementing caching for statistics
5. **Batch Operations**: Support for bulk operations

## Security Features

1. **Authentication**: JWT token required for all endpoints
2. **Authorization**: Role-based access control
3. **Input Validation**: Comprehensive input validation
4. **SQL Injection Prevention**: Parameterized queries
5. **Rate Limiting**: API rate limiting applied

This API provides a complete solution for training assignment management with full integration into the KPI automation system.
