# Exit Management API Documentation

This document provides comprehensive information about the Exit Management API endpoints for tracking employee exits with detailed reasons, documentation, and verification.

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Data Model](#data-model)
4. [Usage Examples](#usage-examples)

## Overview

The Exit Management system allows administrators to:
- Set users as inactive with comprehensive exit details
- Upload and store proof documents for exits
- Track exit reasons with hierarchical categories
- Verify exit details through HR or Compliance
- View and export exit records with filtering
- Download exit proof documents

### Key Features
- ✅ **Comprehensive Exit Tracking** - Detailed exit reasons with main and sub-categories
- ✅ **Document Management** - Upload and store proof documents (PDF, DOC, DOCX, Images)
- ✅ **Verification System** - HR/Compliance verification workflow
- ✅ **CSV Export** - Export exit records for reporting
- ✅ **Backward Compatible** - Works with existing inactive user functionality

## API Endpoints

### 1. Set User as Inactive (Enhanced)

**Endpoint:** `PUT /api/users/:id/set-inactive`

**Description:** Mark a user as inactive with comprehensive exit management details including file upload.

**Access:** Admin only

**Request:**
- Content-Type: `multipart/form-data`
- Auth: Bearer token required

**Form Data Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| exitDate | Date | Yes | Date of exit (format: YYYY-MM-DD) |
| mainCategory | String | Yes | Main exit reason category |
| subCategory | String | No | Sub-category for specific reason |
| exitReasonDescription | String | No | Detailed description of exit reason |
| verifiedBy | String | No | Verification type: 'HR', 'Compliance', or 'Pending' (default) |
| remarks | String | No | Additional remarks |
| proofDocument | File | No | Proof document (PDF, DOC, DOCX, or Image, max 10MB) |

**Exit Reason Categories:**

**Main Categories:**
1. `Resignation`
   - Better employment opportunity
   - Higher salary expectation
   - Relocation
   - Career change
   - Personal/family reasons

2. `Termination`
   - Performance issues
   - Low KPI
   - Repeated warnings
   - Misconduct
   - Bribe
   - Unethical behaviour
   - Bad habits
   - Non compliance with rules
   - Fraudulent activity

3. `End of Contract / Project`

4. `Retirement`

5. `Death`
   - Natural death
   - Accidental death

6. `Other`
   - Health issues
   - Further studies
   - Migration
   - Own business

**Response:**
```json
{
  "success": true,
  "message": "User set as inactive successfully with exit details",
  "user": {
    "_id": "userId",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "Inactive",
    "isActive": false,
    "exitDetails": {
      "exitDate": "2024-01-15T00:00:00.000Z",
      "exitReason": {
        "mainCategory": "Resignation",
        "subCategory": "Better employment opportunity"
      },
      "exitReasonDescription": "Received better offer from competitor",
      "proofDocument": {
        "fileName": "resignation_letter.pdf",
        "filePath": "uploads/exit-documents/exit-1234567890.pdf",
        "fileSize": 45678,
        "mimeType": "application/pdf",
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      },
      "verifiedBy": "HR",
      "verifiedByUser": "adminUserId",
      "verifiedAt": "2024-01-15T10:30:00.000Z",
      "remarks": "Smooth transition"
    }
  }
}
```

---

### 2. Get All Exit Records

**Endpoint:** `GET /api/users/exit-records`

**Description:** Retrieve all exit records with filtering and pagination.

**Access:** Admin only

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| mainCategory | String | No | Filter by main exit category |
| verifiedBy | String | No | Filter by verification status (HR/Compliance/Pending) |
| search | String | No | Search by name, email, or employee ID |
| startDate | Date | No | Filter exits from this date onwards |
| endDate | Date | No | Filter exits up to this date |
| page | Number | No | Page number (default: 1) |
| limit | Number | No | Records per page (default: 50) |

**Response:**
```json
{
  "success": true,
  "exitRecords": [
    {
      "_id": "userId",
      "name": "John Doe",
      "email": "john@example.com",
      "employeeId": "FE240115",
      "phone": "1234567890",
      "designation": "Field Executive",
      "department": "Sales",
      "exitDetails": {
        "exitDate": "2024-01-15T00:00:00.000Z",
        "exitReason": {
          "mainCategory": "Resignation",
          "subCategory": "Better employment opportunity"
        },
        "exitReasonDescription": "Received better offer",
        "verifiedBy": "HR",
        "verifiedByUser": {
          "_id": "adminId",
          "name": "Admin User"
        }
      },
      "inactiveBy": {
        "_id": "adminId",
        "name": "Admin User"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

---

### 3. Get User Exit Details

**Endpoint:** `GET /api/users/:id/exit-details`

**Description:** Get detailed exit information for a specific user.

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "exitDetails": {
    "_id": "userId",
    "name": "John Doe",
    "email": "john@example.com",
    "employeeId": "FE240115",
    "exitDetails": {
      "exitDate": "2024-01-15T00:00:00.000Z",
      "exitReason": {
        "mainCategory": "Resignation",
        "subCategory": "Better employment opportunity"
      },
      "exitReasonDescription": "Detailed description...",
      "proofDocument": {
        "fileName": "resignation_letter.pdf",
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      },
      "verifiedBy": "HR",
      "verifiedByUser": {
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "verifiedAt": "2024-01-15T10:30:00.000Z",
      "remarks": "Smooth transition"
    }
  }
}
```

---

### 4. Download Exit Document

**Endpoint:** `GET /api/users/:id/exit-document`

**Description:** Download the proof document for a user's exit.

**Access:** Admin only

**Response:** File download (PDF, DOC, DOCX, or Image)

---

### 5. Export Exit Records to CSV

**Endpoint:** `GET /api/users/exit-records/export`

**Description:** Export filtered exit records to CSV format.

**Access:** Admin only

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| mainCategory | String | No | Filter by main exit category |
| verifiedBy | String | No | Filter by verification status |
| startDate | Date | No | Filter exits from this date onwards |
| endDate | Date | No | Filter exits up to this date |

**Response:** CSV file download

**CSV Columns:**
- Employee ID
- Name
- Email
- Phone
- Designation
- Department
- Location
- City
- State
- Date of Joining
- Exit Date
- Exit Reason (Main)
- Exit Reason (Sub)
- Exit Description
- Verified By
- Verified By User
- Has Proof Document
- Remarks

---

### 6. Verify Exit Details

**Endpoint:** `PUT /api/users/:id/exit-details/verify`

**Description:** Update the verification status of exit details by HR or Compliance.

**Access:** Admin only

**Request Body:**
```json
{
  "verifiedBy": "HR",
  "remarks": "Verified and approved"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| verifiedBy | String | Yes | Must be 'HR' or 'Compliance' |
| remarks | String | No | Additional verification remarks |

**Response:**
```json
{
  "success": true,
  "message": "Exit details verified successfully",
  "exitDetails": {
    "exitDate": "2024-01-15T00:00:00.000Z",
    "verifiedBy": "HR",
    "verifiedByUser": "adminUserId",
    "verifiedAt": "2024-01-15T11:00:00.000Z",
    "remarks": "Verified and approved"
  }
}
```

---

## Data Model

### Exit Details Schema

```javascript
exitDetails: {
  exitDate: Date,
  exitReason: {
    mainCategory: String,  // Enum: ['Resignation', 'Termination', 'End of Contract / Project', 'Retirement', 'Death', 'Other']
    subCategory: String    // Specific sub-category based on main category
  },
  exitReasonDescription: String,
  proofDocument: {
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: Date
  },
  verifiedBy: String,      // Enum: ['HR', 'Compliance', 'Pending']
  verifiedByUser: ObjectId,
  verifiedAt: Date,
  remarks: String
}
```

---

## Usage Examples

### Example 1: Set User as Inactive with Document Upload (JavaScript/Fetch)

```javascript
const formData = new FormData();
formData.append('exitDate', '2024-01-15');
formData.append('mainCategory', 'Resignation');
formData.append('subCategory', 'Better employment opportunity');
formData.append('exitReasonDescription', 'Received better offer from competitor');
formData.append('verifiedBy', 'HR');
formData.append('remarks', 'Smooth transition');
formData.append('proofDocument', fileInput.files[0]);

const response = await fetch('/api/users/userId123/set-inactive', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log(data);
```

### Example 2: Get Exit Records with Filters

```javascript
const params = new URLSearchParams({
  mainCategory: 'Resignation',
  verifiedBy: 'HR',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  page: 1,
  limit: 50
});

const response = await fetch(`/api/users/exit-records?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.exitRecords);
```

### Example 3: Export Exit Records to CSV

```javascript
const params = new URLSearchParams({
  mainCategory: 'Termination',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

window.location.href = `/api/users/exit-records/export?${params}&token=${token}`;
// or
const response = await fetch(`/api/users/exit-records/export?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `exit-records-${Date.now()}.csv`;
a.click();
```

### Example 4: Verify Exit Details

```javascript
const response = await fetch('/api/users/userId123/exit-details/verify', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    verifiedBy: 'HR',
    remarks: 'Verified and approved'
  })
});

const data = await response.json();
console.log(data);
```

### Example 5: Download Exit Document

```javascript
const response = await fetch('/api/users/userId123/exit-document', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'exit-document.pdf';
a.click();
```

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

**Common Error Codes:**
- `400` - Validation Error (missing or invalid parameters)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (user or document not found)
- `500` - Server Error (internal server error)

---

## Integration Notes

### Backward Compatibility

The exit management system maintains backward compatibility with the existing `inactiveReason` and `inactiveRemark` fields. When setting a user as inactive:

- If only old fields are provided, they work as before
- If new exit details are provided, both old and new fields are populated
- Existing inactive users without exit details continue to work normally

### File Storage

Exit documents are stored in: `backend/uploads/exit-documents/`

Files are named with the pattern: `exit-{timestamp}-{random}.{ext}`

Supported file types:
- PDF (`.pdf`)
- Word Documents (`.doc`, `.docx`)
- Images (`.jpg`, `.jpeg`, `.png`)

Maximum file size: 10MB

### Audit Trail

All exit management actions are logged in the AuditRecord collection with:
- Action type: `user_deactivated` or `exit_details_verified`
- User performing the action
- Timestamp
- Detailed information about the exit

### Lifecycle Events

When a user is set as inactive with exit details, a lifecycle event is automatically created with:
- Type: `left`
- Category: `negative`
- Description: Exit reason details

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Only admin users can access these endpoints
3. **File Validation**: Uploaded files are validated for type and size
4. **Path Traversal Protection**: File paths are sanitized
5. **SQL Injection Protection**: MongoDB queries are parameterized

---

## Best Practices

1. **Always provide exit date** - Required for proper record keeping
2. **Upload proof documents** - Helps with audit and compliance
3. **Verify exit details** - HR/Compliance should verify all exits
4. **Regular exports** - Export exit records periodically for reporting
5. **Detailed descriptions** - Provide clear exit reason descriptions

---

## Support

For issues or questions about the Exit Management API, please contact the development team or refer to the main API documentation.

## Version History

- **v1.0** - Initial release with comprehensive exit management features

