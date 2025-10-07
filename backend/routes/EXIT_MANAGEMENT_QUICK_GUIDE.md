# Exit Management System - Quick Implementation Guide

## Overview

The Exit Management system has been successfully added to the existing User Management functionality. **No new pages were created** - all functionality is integrated into existing endpoints.

## What Was Added

### 1. Enhanced User Model
- Added comprehensive `exitDetails` field to User model
- Stores exit date, reasons (main + sub-category), description, documents, and verification status
- Maintains backward compatibility with existing `inactiveReason` fields

### 2. File Upload Support
- Exit proof documents can be uploaded (PDF, DOC, DOCX, Images)
- Max file size: 10MB
- Stored in: `backend/uploads/exit-documents/`
- Automatic file cleanup on errors

### 3. New API Endpoints

All endpoints work with your existing inactive users tab:

#### Primary Endpoint (Enhanced)
- `PUT /api/users/:id/set-inactive` - Now accepts multipart/form-data with file upload

#### View & Manage
- `GET /api/users/exit-records` - List all exit records with filters
- `GET /api/users/:id/exit-details` - Get specific user exit details
- `GET /api/users/:id/exit-document` - Download exit proof document
- `PUT /api/users/:id/exit-details/verify` - Verify exit details (HR/Compliance)

#### Export
- `GET /api/users/exit-records/export` - Export to CSV

---

## Frontend Integration

### Step 1: Update the Inactive User Form

**Current Form (Old):**
```typescript
interface InactiveFormData {
  inactiveReason: string;
  inactiveRemark: string;
}
```

**Enhanced Form (New):**
```typescript
interface ExitFormData {
  exitDate: string;              // Required
  mainCategory: string;          // Required - Dropdown
  subCategory: string;           // Optional - Dependent dropdown
  exitReasonDescription: string; // Optional - Textarea
  verifiedBy: 'HR' | 'Compliance' | 'Pending';
  remarks: string;
  proofDocument: File;           // Optional - File upload
}
```

### Step 2: Dropdown Options

**Main Category Dropdown:**
```typescript
const mainCategories = [
  'Resignation',
  'Termination',
  'End of Contract / Project',
  'Retirement',
  'Death',
  'Other'
];

const subCategories = {
  'Resignation': [
    'Better employment opportunity',
    'Higher salary expectation',
    'Relocation',
    'Career change',
    'Personal/family reasons'
  ],
  'Termination': [
    'Performance issues',
    'Low KPI',
    'Repeated warnings',
    'Misconduct',
    'Bribe',
    'Unethical behaviour',
    'Bad habits',
    'Non compliance with rules',
    'Fraudulent activity'
  ],
  'Death': [
    'Natural death',
    'Accidental death'
  ],
  'Other': [
    'Health issues',
    'Further studies',
    'Migration',
    'Own business'
  ]
};
```

### Step 3: Form Submission

```typescript
const handleSetInactive = async (userId: string, formData: ExitFormData) => {
  const form = new FormData();
  
  // Required fields
  form.append('exitDate', formData.exitDate);
  form.append('mainCategory', formData.mainCategory);
  
  // Optional fields
  if (formData.subCategory) {
    form.append('subCategory', formData.subCategory);
  }
  if (formData.exitReasonDescription) {
    form.append('exitReasonDescription', formData.exitReasonDescription);
  }
  if (formData.verifiedBy) {
    form.append('verifiedBy', formData.verifiedBy);
  }
  if (formData.remarks) {
    form.append('remarks', formData.remarks);
  }
  if (formData.proofDocument) {
    form.append('proofDocument', formData.proofDocument);
  }
  
  try {
    const response = await fetch(`/api/users/${userId}/set-inactive`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Success - refresh user list
      console.log('User set as inactive:', data.user);
    } else {
      // Handle error
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### Step 4: Display Exit Details in User Details Modal

**Fetch Exit Details:**
```typescript
const fetchExitDetails = async (userId: string) => {
  try {
    const response = await fetch(`/api/users/${userId}/exit-details`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.exitDetails;
    }
  } catch (error) {
    console.error('Error fetching exit details:', error);
    return null;
  }
};
```

**Display Component:**
```typescript
interface ExitDetailsDisplayProps {
  exitDetails: any;
}

const ExitDetailsDisplay: React.FC<ExitDetailsDisplayProps> = ({ exitDetails }) => {
  const handleDownloadDocument = async () => {
    window.open(`/api/users/${exitDetails._id}/exit-document?token=${token}`, '_blank');
  };
  
  return (
    <div className="exit-details">
      <h3>Exit Information</h3>
      
      <div className="detail-row">
        <label>Exit Date:</label>
        <span>{new Date(exitDetails.exitDetails.exitDate).toLocaleDateString()}</span>
      </div>
      
      <div className="detail-row">
        <label>Exit Reason:</label>
        <span>
          {exitDetails.exitDetails.exitReason.mainCategory}
          {exitDetails.exitDetails.exitReason.subCategory && 
            ` - ${exitDetails.exitDetails.exitReason.subCategory}`
          }
        </span>
      </div>
      
      <div className="detail-row">
        <label>Description:</label>
        <p>{exitDetails.exitDetails.exitReasonDescription}</p>
      </div>
      
      {exitDetails.exitDetails.proofDocument && (
        <div className="detail-row">
          <label>Proof Document:</label>
          <button onClick={handleDownloadDocument}>
            Download {exitDetails.exitDetails.proofDocument.fileName}
          </button>
        </div>
      )}
      
      <div className="detail-row">
        <label>Verification Status:</label>
        <span className={`badge ${exitDetails.exitDetails.verifiedBy.toLowerCase()}`}>
          {exitDetails.exitDetails.verifiedBy}
        </span>
      </div>
      
      {exitDetails.exitDetails.verifiedByUser && (
        <div className="detail-row">
          <label>Verified By:</label>
          <span>{exitDetails.exitDetails.verifiedByUser.name}</span>
        </div>
      )}
      
      {exitDetails.exitDetails.remarks && (
        <div className="detail-row">
          <label>Remarks:</label>
          <p>{exitDetails.exitDetails.remarks}</p>
        </div>
      )}
    </div>
  );
};
```

### Step 5: Exit Records Table in Inactive Tab

```typescript
const fetchExitRecords = async (filters: any) => {
  const params = new URLSearchParams({
    page: filters.page || '1',
    limit: filters.limit || '50',
    ...(filters.mainCategory && { mainCategory: filters.mainCategory }),
    ...(filters.verifiedBy && { verifiedBy: filters.verifiedBy }),
    ...(filters.search && { search: filters.search }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate })
  });
  
  const response = await fetch(`/api/users/exit-records?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data;
};

// Usage in component
const [exitRecords, setExitRecords] = useState([]);
const [filters, setFilters] = useState({});

useEffect(() => {
  fetchExitRecords(filters).then(data => {
    if (data.success) {
      setExitRecords(data.exitRecords);
    }
  });
}, [filters]);
```

### Step 6: CSV Export

```typescript
const handleExportExitRecords = () => {
  const params = new URLSearchParams({
    ...(filters.mainCategory && { mainCategory: filters.mainCategory }),
    ...(filters.verifiedBy && { verifiedBy: filters.verifiedBy }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate })
  });
  
  window.open(`/api/users/exit-records/export?${params}&token=${token}`, '_blank');
};
```

---

## UI/UX Recommendations

### 1. Inactive User Modal Enhancement

Add these fields to your existing "Set Inactive" modal:

```
┌─────────────────────────────────────────┐
│  Set User as Inactive                   │
├─────────────────────────────────────────┤
│                                         │
│  FE Name: [Auto-filled from user]      │
│                                         │
│  Exit Date: [Date Picker] *Required    │
│                                         │
│  Reason for Leaving: [Dropdown] *Req   │
│  ├─ Resignation                         │
│  ├─ Termination                         │
│  ├─ End of Contract / Project           │
│  ├─ Retirement                          │
│  ├─ Death                               │
│  └─ Other                               │
│                                         │
│  Specific Reason: [Dependent Dropdown]  │
│  (Shows options based on main category) │
│                                         │
│  Description: [Textarea]                │
│  (Optional - max 1000 chars)            │
│                                         │
│  Proof Document: [File Upload]          │
│  (Optional - PDF, DOC, Images, max 10MB)│
│                                         │
│  Verified By: [Radio Buttons]           │
│  ○ Pending  ○ HR  ○ Compliance          │
│                                         │
│  Remarks: [Text Input]                  │
│  (Optional)                             │
│                                         │
│  [Cancel]              [Set Inactive]   │
└─────────────────────────────────────────┘
```

### 2. User Details Modal - Add Exit Section

When viewing an inactive user's details, add an "Exit Details" section:

```
┌─────────────────────────────────────────┐
│  User Details - John Doe                │
├─────────────────────────────────────────┤
│  ... (existing user info) ...           │
│                                         │
│  ▼ Exit Information                     │
│  ├─ Exit Date: Jan 15, 2024             │
│  ├─ Reason: Resignation -               │
│  │           Better employment opp.     │
│  ├─ Description: [Full text...]         │
│  ├─ Proof: [Download Button]            │
│  ├─ Status: ✓ Verified by HR            │
│  └─ Verified By: Admin User             │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Inactive Tab - Enhanced Table

Update the inactive users table to show exit information:

```
┌──────────────────────────────────────────────────────────────┐
│  Filters: [Category ▼] [Verification ▼] [Date Range] [Export]│
├──────────────────────────────────────────────────────────────┤
│ ID      │ Name      │ Exit Date  │ Reason        │ Verified  │
├──────────────────────────────────────────────────────────────┤
│ FE2401  │ John Doe  │ 2024-01-15 │ Resignation   │ ✓ HR      │
│ FE2402  │ Jane Smith│ 2024-01-20 │ Termination   │ ⏳Pending │
│ FE2403  │ Bob Brown │ 2024-01-25 │ Retirement    │ ✓ HR      │
└──────────────────────────────────────────────────────────────┘
```

---

## API Service Integration

Add these methods to your API service (`services/apiService.ts`):

```typescript
class UserService {
  // ... existing methods ...
  
  async setUserInactive(userId: string, exitData: FormData) {
    return await fetch(`${API_BASE_URL}/api/users/${userId}/set-inactive`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: exitData
    });
  }
  
  async getExitRecords(filters: any) {
    const params = new URLSearchParams(filters);
    return await fetch(`${API_BASE_URL}/api/users/exit-records?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      }
    });
  }
  
  async getExitDetails(userId: string) {
    return await fetch(`${API_BASE_URL}/api/users/${userId}/exit-details`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      }
    });
  }
  
  async downloadExitDocument(userId: string) {
    return await fetch(`${API_BASE_URL}/api/users/${userId}/exit-document`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      }
    });
  }
  
  async verifyExitDetails(userId: string, verificationData: any) {
    return await fetch(`${API_BASE_URL}/api/users/${userId}/exit-details/verify`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(verificationData)
    });
  }
  
  exportExitRecords(filters: any) {
    const params = new URLSearchParams(filters);
    window.open(`${API_BASE_URL}/api/users/exit-records/export?${params}&token=${this.getToken()}`, '_blank');
  }
}
```

---

## Testing

### 1. Test Setting User as Inactive

Use Postman or similar tool:

```
PUT http://localhost:5000/api/users/{userId}/set-inactive
Headers:
  Authorization: Bearer {token}
  
Body (form-data):
  exitDate: 2024-01-15
  mainCategory: Resignation
  subCategory: Better employment opportunity
  exitReasonDescription: Received better offer
  verifiedBy: HR
  proofDocument: [file]
```

### 2. Test Fetching Exit Records

```
GET http://localhost:5000/api/users/exit-records?mainCategory=Resignation&verifiedBy=HR
Headers:
  Authorization: Bearer {token}
```

### 3. Test CSV Export

```
GET http://localhost:5000/api/users/exit-records/export?mainCategory=Resignation
Headers:
  Authorization: Bearer {token}
```

---

## Backward Compatibility

✅ **Existing functionality preserved:**
- Old `inactiveReason` and `inactiveRemark` fields still work
- Existing inactive users continue to work
- You can use either old or new format
- API gracefully handles both formats

---

## Summary

**What you need to do on frontend:**

1. ✅ Update the "Set Inactive" modal to include new fields
2. ✅ Add file upload component for proof documents
3. ✅ Update User Details modal to show exit information
4. ✅ Add exit records table/view in Inactive tab
5. ✅ Add CSV export button
6. ✅ Add API service methods

**What's already done on backend:**

✅ User model updated with exit details
✅ File upload configuration
✅ Enhanced set-inactive endpoint
✅ Exit records listing with filters
✅ Exit details view
✅ Document download
✅ CSV export
✅ Verification endpoint
✅ Audit trail and lifecycle events
✅ Full API documentation

---

## Need Help?

Refer to:
- `README_EXIT_MANAGEMENT_API.md` - Complete API documentation
- Existing routes in `backend/routes/users.js`
- User model in `backend/models/User.js`

All backend APIs are ready and tested! Just implement the frontend UI to consume these endpoints. 🚀

