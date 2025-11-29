# Form Validation Implementation Guide for UserManagement.tsx

## Overview
This guide will help you add comprehensive validation to the "Add New User" form with:
- Real-time input validation
- Red borders for invalid fields
- Error messages below each field
- Input sanitization (phone accepts only numbers, PAN auto-uppercase, etc.)

## Step 1: Add Import Statement

**Location:** Line 31-33 (after the existing imports)

**Add this:**
```typescript
import { 
  validateName, 
  validateEmail, 
  validatePassword, 
  validatePhone, 
  validateAadhaar, 
  validatePAN, 
  validateTextOnly,
  sanitizeNumericInput,
  sanitizePANInput,
  sanitizeTextInput
} from '../../utils/formValidation';
```

## Step 2: Add Validation State

**Location:** Line 100 (after `const [isCreatingUser, setIsCreatingUser] = useState(false);`)

**Add this:**
```typescript
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
```

## Step 3: Update handleCreateUser Function

**Location:** Line 141-156 (replace the validation section)

**Replace this:**
```typescript
// Validate required fields
const requiredFields = [
  'name', 'email', 'password', 'phone'
];

const missingFields = requiredFields.filter(field => !createUserData[field as keyof typeof createUserData]);

if (missingFields.length > 0) {
  toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
  return;
}
```

**With this:**
```typescript
// Validate all fields
const errors: Record<string, string> = {};

const nameValidation = validateName(createUserData.name);
if (!nameValidation.isValid) errors.name = nameValidation.error;

const emailValidation = validateEmail(createUserData.email);
if (!emailValidation.isValid) errors.email = emailValidation.error;

const passwordValidation = validatePassword(createUserData.password);
if (!passwordValidation.isValid) errors.password = passwordValidation.error;

const phoneValidation = validatePhone(createUserData.phone);
if (!phoneValidation.isValid) errors.phone = phoneValidation.error;

if (createUserData.aadhaarNo) {
  const aadhaarValidation = validateAadhaar(createUserData.aadhaarNo);
  if (!aadhaarValidation.isValid) errors.aadhaarNo = aadhaarValidation.error;
}

if (createUserData.panNo) {
  const panValidation = validatePAN(createUserData.panNo);
  if (!panValidation.isValid) errors.panNo = panValidation.error;
}

if (createUserData.fathersName) {
  const fathersNameValidation = validateTextOnly(createUserData.fathersName, "Father's Name");
  if (!fathersNameValidation.isValid) errors.fathersName = fathersNameValidation.error;
}

if (createUserData.city) {
  const cityValidation = validateTextOnly(createUserData.city, "City");
  if (!cityValidation.isValid) errors.city = cityValidation.error;
}

if (createUserData.state) {
  const stateValidation = validateTextOnly(createUserData.state, "State");
  if (!stateValidation.isValid) errors.state = stateValidation.error;
}

if (createUserData.location) {
  const locationValidation = validateTextOnly(createUserData.location, "Location");
  if (!locationValidation.isValid) errors.location = locationValidation.error;
}

if (createUserData.region) {
  const regionValidation = validateTextOnly(createUserData.region, "Region");
  if (!regionValidation.isValid) errors.region = regionValidation.error;
}

// If there are validation errors, show them and return
if (Object.keys(errors).length > 0) {
  setValidationErrors(errors);
  toast.error('Please fix the validation errors before submitting');
  return;
}

// Clear validation errors
setValidationErrors({});
```

## Step 4: Update Form Input Fields

### Name Field (Line ~1178-1183)

**Replace:**
```typescript
<div>
  <Label htmlFor="name">Name *</Label>
  <Input
    id="name"
    value={createUserData.name}
    onChange={(e) => setCreateUserData(prev => ({ ...prev, name: e.target.value }))}
    placeholder="Enter full name"
  />
</div>
```

**With:**
```typescript
<div>
  <Label htmlFor="name">Name *</Label>
  <Input
    id="name"
    value={createUserData.name}
    onChange={(e) => {
      const value = sanitizeTextInput(e.target.value);
      setCreateUserData(prev => ({ ...prev, name: value }));
      const validation = validateName(value);
      setValidationErrors(prev => ({ ...prev, name: validation.error }));
    }}
    placeholder="Enter full name"
    className={validationErrors.name ? 'border-red-500 focus:border-red-500' : ''}
  />
  {validationErrors.name && (
    <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
  )}
</div>
```

### Email Field (Line ~1187-1195)

**Replace:**
```typescript
<div>
  <Label htmlFor="email">Email *</Label>
  <Input
    id="email"
    type="email"
    value={createUserData.email}
    onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
    placeholder="Enter email address"
  />
</div>
```

**With:**
```typescript
<div>
  <Label htmlFor="email">Email *</Label>
  <Input
    id="email"
    type="email"
    value={createUserData.email}
    onChange={(e) => {
      const value = e.target.value;
      setCreateUserData(prev => ({ ...prev, email: value }));
      const validation = validateEmail(value);
      setValidationErrors(prev => ({ ...prev, email: validation.error }));
    }}
    placeholder="Enter email address"
    className={validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}
  />
  {validationErrors.email && (
    <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
  )}
</div>
```

### Password Field (Line ~1200-1208)

**Replace:**
```typescript
<div>
  <Label htmlFor="password">Password *</Label>
  <Input
    id="password"
    type="password"
    value={createUserData.password}
    onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
    placeholder="Enter password"
  />
</div>
```

**With:**
```typescript
<div>
  <Label htmlFor="password">Password *</Label>
  <Input
    id="password"
    type="password"
    value={createUserData.password}
    onChange={(e) => {
      const value = e.target.value;
      setCreateUserData(prev => ({ ...prev, password: value }));
      const validation = validatePassword(value);
      setValidationErrors(prev => ({ ...prev, password: validation.error }));
    }}
    placeholder="Enter password (min 6 characters)"
    className={validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}
  />
  {validationErrors.password && (
    <p className="text-xs text-red-500 mt-1">{validationErrors.password}</p>
  )}
</div>
```

### Phone Field (Line ~1210-1218)

**Replace:**
```typescript
<div>
  <Label htmlFor="phone">Phone</Label>
  <Input
    id="phone"
    value={createUserData.phone}
    onChange={(e) => setCreateUserData(prev => ({ ...prev, phone: e.target.value }))}
    placeholder="Enter phone number"
  />
</div>
```

**With:**
```typescript
<div>
  <Label htmlFor="phone">Phone *</Label>
  <Input
    id="phone"
    value={createUserData.phone}
    onChange={(e) => {
      const value = sanitizeNumericInput(e.target.value);
      setCreateUserData(prev => ({ ...prev, phone: value }));
      const validation = validatePhone(value);
      setValidationErrors(prev => ({ ...prev, phone: validation.error }));
    }}
    placeholder="Enter 10-digit phone number"
    maxLength={10}
    className={validationErrors.phone ? 'border-red-500 focus:border-red-500' : ''}
  />
  {validationErrors.phone && (
    <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
  )}
</div>
```

### Father's Name Field (Line ~1237-1244)

**Replace:**
```typescript
<div>
  <Label htmlFor="fathersName">Father's Name</Label>
  <Input
    id="fathersName"
    value={createUserData.fathersName}
    onChange={(e) => setCreateUserData(prev => ({ ...prev, fathersName: e.target.value }))}
    placeholder="Enter father's name"
  />
</div>
```

**With:**
```typescript
<div>
  <Label htmlFor="fathersName">Father's Name</Label>
  <Input
    id="fathersName"
    value={createUserData.fathersName}
    onChange={(e) => {
      const value = sanitizeTextInput(e.target.value);
      setCreateUserData(prev => ({ ...prev, fathersName: value }));
      const validation = validateTextOnly(value, "Father's Name");
      setValidationErrors(prev => ({ ...prev, fathersName: validation.error }));
    }}
    placeholder="Enter father's name"
    className={validationErrors.fathersName ? 'border-red-500 focus:border-red-500' : ''}
  />
  {validationErrors.fathersName && (
    <p className="text-xs text-red-500 mt-1">{validationErrors.fathersName}</p>
  )}
</div>
```

### City Field (Line ~1345-1352)

**Replace:**
```typescript
<div>
  <Label htmlFor="city">City</Label>
  <Input
    id="city"
    value={createUserData.city}
    onChange={(e) => setCreateUserData(prev => ({ ...prev, city: e.target.value }))}
    placeholder="Enter city"
  />
</div>
```

**With:**
```typescript
<div>
  <Label htmlFor="city">City</Label>
  <Input
    id="city"
    value={createUserData.city}
    onChange={(e) => {
      const value = sanitizeTextInput(e.target.value);
      setCreateUserData(prev => ({ ...prev, city: value }));
      const validation = validateTextOnly(value, "City");
      setValidationErrors(prev => ({ ...prev, city: validation.error }));
    }}
    placeholder="Enter city"
    className={validationErrors.city ? 'border-red-500 focus:border-red-500' : ''}
  />
  {validationErrors.city && (
    <p className="text-xs text-red-500 mt-1">{validationErrors.city}</p>
  )}
</div>
```

### State Field (Line ~1353-1361)

**Replace:**
```typescript
<div>
  <Label htmlFor="state">State</Label>
  <Input
    id="state"
    value={createUserData.state}
    onChange={(e) => setCreateUserData(prev => ({ ...prev, state: e.target.value }))}
    placeholder="Enter state"
  />
</div>
```

**With:**
```typescript
<div>
  <Label htmlFor="state">State</Label>
  <Input
    id="state"
    value={createUserData.state}
    onChange={(e) => {
      const value = sanitizeTextInput(e.target.value);
      setCreateUserData(prev => ({ ...prev, state: value }));
      const validation = validateTextOnly(value, "State");
      setValidationErrors(prev => ({ ...prev, state: validation.error }));
    }}
    placeholder="Enter state"
    className={validationErrors.state ? 'border-red-500 focus:border-red-500' : ''}
  />
  {validationErrors.state && (
    <p className="text-xs text-red-500 mt-1">{validationErrors.state}</p>
  )}
</div>
```

### Location Field (Line ~1336-1343)

**Replace:**
```typescript
<div>
  <Label htmlFor="location">Location</Label>
  <Input
    id="location"
    value={createUserData.location}
    onChange={(e) => setCreateUserData(prev => ({ ...prev, location: e.target.value }))}
    placeholder="Enter location/area"
  />
</div>
```

**With:**
```typescript
<div>
  <Label htmlFor="location">Location</Label>
  <Input
    id="location"
    value={createUserData.location}
    onChange={(e) => {
      const value = sanitizeTextInput(e.target.value);
      setCreateUserData(prev => ({ ...prev, location: value }));
      const validation = validateTextOnly(value, "Location");
      setValidationErrors(prev => ({ ...prev, location: validation.error }));
    }}
    placeholder="Enter location/area"
    className={validationErrors.location ? 'border-red-500 focus:border-red-500' : ''}
  />
  {validationErrors.location && (
    <p className="text-xs text-red-500 mt-1">{validationErrors.location}</p>
  )}
</div>
```

### Region Field (Line ~1365-1372)

**Replace:**
```typescript
<div>
  <Label htmlFor="region">Region Assigned</Label>
  <Input
    id="region"
    value={createUserData.region}
    onChange={(e) => setCreateUserData(prev => ({ ...prev, region: e.target.value }))}
    placeholder="Enter assigned region"
  />
</div>
```

**With:**
```typescript
<div>
  <Label htmlFor="region">Region Assigned</Label>
  <Input
    id="region"
    value={createUserData.region}
    onChange={(e) => {
      const value = sanitizeTextInput(e.target.value);
      setCreateUserData(prev => ({ ...prev, region: value }));
      const validation = validateTextOnly(value, "Region");
      setValidationErrors(prev => ({ ...prev, region: validation.error }));
    }}
    placeholder="Enter assigned region"
    className={validationErrors.region ? 'border-red-500 focus:border-red-500' : ''}
  />
  {validationErrors.region && (
    <p className="text-xs text-red-500 mt-1">{validationErrors.region}</p>
  )}
</div>
```

### Aadhaar Field (Line ~1381-1390)

**Replace:**
```typescript
<div>
  <Label htmlFor="aadhaarNo">Aadhaar Number</Label>
  <Input
    id="aadhaarNo"
    value={createUserData.aadhaarNo}
    onChange={(e) => setCreateUserData(prev => ({ ...prev, aadhaarNo: e.target.value }))}
    placeholder="Enter 12-digit Aadhaar number"
    maxLength={12}
  />
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">12-digit Aadhaar number</p>
</div>
```

**With:**
```typescript
<div>
  <Label htmlFor="aadhaarNo">Aadhaar Number</Label>
  <Input
    id="aadhaarNo"
    value={createUserData.aadhaarNo}
    onChange={(e) => {
      const value = sanitizeNumericInput(e.target.value);
      setCreateUserData(prev => ({ ...prev, aadhaarNo: value }));
      const validation = validateAadhaar(value);
      setValidationErrors(prev => ({ ...prev, aadhaarNo: validation.error }));
    }}
    placeholder="Enter 12-digit Aadhaar number"
    maxLength={12}
    className={validationErrors.aadhaarNo ? 'border-red-500 focus:border-red-500' : ''}
  />
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">12-digit Aadhaar number</p>
  {validationErrors.aadhaarNo && (
    <p className="text-xs text-red-500 mt-1">{validationErrors.aadhaarNo}</p>
  )}
</div>
```

### PAN Field (Line ~1391-1401)

**Replace:**
```typescript
<div>
  <Label htmlFor="panNo">PAN Number</Label>
  <Input
    id="panNo"
    value={createUserData.panNo}
    onChange={(e) => setCreateUserData(prev => ({ ...prev, panNo: e.target.value.toUpperCase() }))}
    placeholder="Enter PAN number (ABCDE1234F)"
    maxLength={10}
  />
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: ABCDE1234F</p>
</div>
```

**With:**
```typescript
<div>
  <Label htmlFor="panNo">PAN Number</Label>
  <Input
    id="panNo"
    value={createUserData.panNo}
    onChange={(e) => {
      const value = sanitizePANInput(e.target.value);
      setCreateUserData(prev => ({ ...prev, panNo: value }));
      const validation = validatePAN(value);
      setValidationErrors(prev => ({ ...prev, panNo: validation.error }));
    }}
    placeholder="Enter PAN number (ABCDE1234F)"
    maxLength={10}
    className={validationErrors.panNo ? 'border-red-500 focus:border-red-500' : ''}
  />
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: ABCDE1234F</p>
  {validationErrors.panNo && (
    <p className="text-xs text-red-500 mt-1">{validationErrors.panNo}</p>
  )}
</div>
```

## Step 5: Clear Validation Errors on Modal Close

**Location:** Line 547-568 (in the "Add New User" button onClick)

**Add this line after `setShowCreateModal(true);`:**
```typescript
setValidationErrors({});
```

So it becomes:
```typescript
onClick={() => {
  setCreateUserData({
    name: '',
    email: '',
    password: '',
    phone: '',
    userType: 'user',
    dateOfBirth: '',
    fathersName: '',
    dateOfJoining: '',
    reportingManager: '',
    highestEducation: '',
    currentAddress: '',
    location: '',
    city: '',
    state: '',
    region: '',
    aadhaarNo: '',
    panNo: '',
    documents: [],
    avatar: null
  });
  setValidationErrors({});  // Add this line
  setShowCreateModal(true);
}}
```

## Summary

After implementing all these changes:

1. ✅ Phone field will only accept numbers (10 digits)
2. ✅ Aadhaar field will only accept numbers (12 digits)
3. ✅ PAN field will auto-convert to uppercase and validate format
4. ✅ Name, father's name, city, state, location, region will only accept letters, spaces, and dots
5. ✅ Email will validate proper email format
6. ✅ Password will require minimum 6 characters
7. ✅ All invalid fields will show red borders
8. ✅ Error messages will appear below each invalid field in red
9. ✅ Real-time validation as user types
10. ✅ Form submission blocked if any validation errors exist

The validation utility file (`frontend/utils/formValidation.ts`) has already been created and is ready to use!
