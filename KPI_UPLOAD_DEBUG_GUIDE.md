# KPI Upload & Process - Debug Guide 🔧

## Changes Made for Better Debugging

### Frontend Changes (KPITriggerDashboard.tsx)
✅ **Added Detailed Console Logging**:
- File details (name, size)
- Period value
- API URL
- Token existence check
- Response status
- Response content type
- Full error stack traces

✅ **Better Error Messages**:
- Shows specific error types
- Asks user to check console
- Handles non-JSON responses
- Success message with ✅ emoji

### Backend Changes

#### 1. **kpiTriggers.js Route**
✅ **Enhanced Logging**:
- Request received confirmation
- User ID
- File details
- Period value
- Excel sheet name
- Number of rows
- Column names found
- Missing columns (if any)
- Processing status
- Results summary

✅ **Better Error Handling**:
- Detailed error types
- Error stack traces (in dev mode)
- Column validation feedback

#### 2. **auditScheduling.js Route**
✅ **Safe Training Fetch**:
- Wrapped TrainingAssignment fetch in try-catch
- Continues even if training data fails
- Logs warnings instead of crashing

## How to Debug "Something Went Wrong" Error

### Step 1: Open Browser Console
**Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
**Firefox**: Press `F12`

### Step 2: Upload & Process
1. Select your Excel file
2. Click "Preview Triggers" first
3. Check console for any errors
4. Then click "Upload & Process"

### Step 3: Check Console Logs

#### Frontend Logs (Browser Console)
Look for:
```
=== UPLOAD DEBUG ===
File: your-file.xlsx 12345 bytes
Period: Oct-25
API URL: /api/kpi-triggers/upload-excel
Token exists: true
Response status: 200
Response ok: true
Response content-type: application/json
Result: { success: true, ... }
```

#### Backend Logs (Terminal/Server Console)
Look for:
```
=== UPLOAD EXCEL REQUEST RECEIVED ===
User: 670c3c8a...
File received: your-file.xlsx
Body: { period: 'Oct-25' }
Reading Excel file...
Sheet name: Sheet1
Rows found: 15
Excel columns: [ 'FE', 'Total Case Done', 'TAT %', ... ]
Processing KPI data...
Processing complete!
Total results: 15
Successful: 15
Failed: 0
```

## Common Issues & Solutions

### Issue 1: "No Excel file uploaded"
**Cause**: File not being sent to server
**Check**:
- File size < 5MB
- File type is `.xlsx` or `.xls`
- File is actually selected

**Fix**:
```javascript
// Check in console:
File: undefined
```
→ Re-select the file

### Issue 2: "Period is required"
**Cause**: Period not detected from Excel or not set
**Check**:
- Excel has "Month" column
- Preview was clicked first

**Fix**:
1. Add "Month" column to Excel (e.g., "Oct-25")
2. Click "Preview Triggers" first
3. Then click "Upload & Process"

### Issue 3: "Missing required columns"
**Cause**: Excel doesn't have all required columns
**Check Console**: Will show which columns are missing
**Required Columns**:
- FE
- Total Case Done
- TAT %
- Major Negative %
- Negative %

**Fix**: Add missing columns to Excel

### Issue 4: Backend Server Not Running
**Cause**: Backend server crashed or not started
**Check**:
```
Response status: undefined
Error: Failed to fetch
```

**Fix**:
```bash
cd backend
npm start
```

### Issue 5: Authentication Failed
**Cause**: Token expired or invalid
**Check**:
```
Response status: 401
Token exists: false
```

**Fix**: Login again

### Issue 6: Server Error (500)
**Cause**: Error in processing KPI data
**Check Backend Logs**: Look for detailed error stack
**Common Causes**:
- Database connection issue
- KPI calculation error
- Email service error

**Fix**: Check backend console for specific error

## Testing Checklist

Before uploading, ensure:

- [ ] Backend server is running (`npm start` in backend folder)
- [ ] Frontend server is running (`npm run dev` in frontend folder)
- [ ] You are logged in as admin
- [ ] Excel file has all required columns
- [ ] Excel file has "Month" column (e.g., "Oct-25")
- [ ] File size is < 5MB
- [ ] Browser console is open (F12)

## Step-by-Step Upload Process

### 1. Select File
```
✅ File: kpi-data.xlsx
✅ Size: 2.5 MB
✅ Type: Excel
```

### 2. Preview First (Optional but Recommended)
```
Click "Preview Triggers"
→ Check matched users
→ Check KPI scores
→ Check triggers
→ Period auto-detected: Oct-25
```

### 3. Upload & Process
```
Click "Upload & Process"
→ Wait for processing
→ Check console logs
→ Success! ✅
```

### 4. View Results
```
Two options:
1. See results in current page
2. Click "View Live Data in Audit Dashboard"
```

## What Happens Behind the Scenes

### Upload Flow:
```
Frontend (KPITriggerDashboard.tsx)
  ↓
  1. Validate file & period
  ↓
  2. Create FormData
  ↓
  3. Send POST to /api/kpi-triggers/upload-excel
  ↓
Backend (kpiTriggers.js)
  ↓
  4. Receive file & period
  ↓
  5. Read Excel file
  ↓
  6. Validate columns
  ↓
  7. Process each row → KPITriggerService
  ↓
  8. Calculate KPI scores
  ↓
  9. Create training assignments
  ↓
  10. Create audit schedules
  ↓
  11. Send emails (FE, Coordinator, Managers, HOD, Compliance)
  ↓
  12. Return results
  ↓
Frontend
  ↓
  13. Show results
  ↓
  14. Redirect to Audit Dashboard
```

## Email Notifications Logic

### For Training (Score < 50):
**Recipients**: FE, Coordinator, Managers, HOD
**Template**: `training_assignment`
**Content**: Training type, reason, due date

### For Audits (Score < 85):
**Recipients**: Compliance Team, HOD
**Template**: `audit_schedule`
**Subject varies by score**:
- 70-84: "Audit Call Required"
- 50-69: "Audit Call + Cross-check Last 3 Months Required"
- 40-49: "Audit Call + Cross-check + Dummy Audit Required"
- <40: "Audit Call + Cross-check + Dummy Audit + Warning Letter Required"

### For Warning (Score < 40):
**Recipients**: FE, Coordinator, Manager, Compliance Team, HOD
**Template**: `performance_warning`
**Content**: Performance concerns, improvement areas

## Need Help?

If error persists:

1. **Take Screenshot** of browser console logs
2. **Copy Backend Logs** from terminal
3. **Check Excel File** format
4. **Verify Database** connection
5. **Check Email Service** configuration

## Quick Fixes

### Reset Everything:
```bash
# Stop servers
Ctrl+C (in both terminals)

# Restart backend
cd backend
npm start

# Restart frontend (in new terminal)
cd frontend
npm run dev

# Clear browser cache
Ctrl+Shift+Delete

# Login again as admin
```

### Check Logs Location:
- **Frontend**: Browser Console (F12)
- **Backend**: Terminal where `npm start` is running

---

**Last Updated**: October 8, 2025
**Status**: ✅ Debugging enabled with detailed logging

