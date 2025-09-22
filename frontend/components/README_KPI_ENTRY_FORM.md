# KPI Entry Form Component

This document describes the comprehensive KPI Entry Form component for the E-Learning Platform for Field Executives.

## Overview

The KPI Entry Form is a complete solution for submitting KPI scores with real-time automation processing. It provides:

- Complete form for all 7 KPI metrics
- Real-time score calculation and trigger preview
- Email recipient selection
- Training assignment and audit scheduling preview
- Form validation and error handling
- Draft saving and loading functionality
- Integration with the enhanced KPI automation system

## Component Structure

### Main Component: `KPIEntryForm.tsx`

Located at: `frontend/components/KPIEntryForm.tsx`

### Props Interface

```typescript
interface KPIEntryFormProps {
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
  initialData?: Partial<KPIFormData>;
  mode?: 'create' | 'edit' | 'bulk';
}
```

### Data Interfaces

```typescript
interface KPIMetrics {
  tat: number;
  majorNegativity: number;
  quality: number;
  neighborCheck: number;
  negativity: number;
  appUsage: number;
  insufficiency: number;
}

interface KPITriggers {
  training: {
    basic: boolean;
    negativity_handling: boolean;
    dos_donts: boolean;
    app_usage: boolean;
  };
  audit: {
    audit_call: boolean;
    cross_check: boolean;
    dummy_audit: boolean;
    cross_verify_insuff: boolean;
  };
  email: {
    kpi_notification: boolean;
    training_assignment: boolean;
    audit_notification: boolean;
    warning_letter: boolean;
  };
}

interface EmailRecipients {
  fe: boolean;
  coordinator: boolean;
  manager: boolean;
  hod: boolean;
  compliance: boolean;
}
```

## Features

### 1. Complete KPI Metrics Form

#### Supported Metrics:
- **TAT (Turn Around Time)**: 0-100 (percentage)
- **Quality**: 0-100 (percentage)
- **App Usage**: 0-100 (percentage)
- **Neighbor Check**: 0-100 (percentage)
- **General Negativity**: 0-100 (percentage)
- **Major Negativity**: 0-10 (count)
- **Insufficiency**: 0-10 (count)

#### Form Fields:
- User selection dropdown with search
- Period selection (YYYY-MM format)
- All 7 KPI metric inputs with proper validation
- Comments textarea for additional notes
- Email recipient checkboxes

### 2. Real-time Score Calculation

#### Automatic Calculation:
- Weighted average calculation using predefined weights
- Real-time overall score updates
- Performance rating determination
- Trigger calculation based on metrics

#### Weight Distribution:
```typescript
const weights = {
  tat: 0.25,           // 25%
  quality: 0.20,       // 20%
  appUsage: 0.20,      // 20%
  neighborCheck: 0.15, // 15%
  negativity: 0.10,    // 10%
  majorNegativity: 0.05, // 5%
  insufficiency: 0.05  // 5%
};
```

#### Rating System:
- **Outstanding**: ≥ 85%
- **Excellent**: ≥ 70%
- **Satisfactory**: ≥ 50%
- **Need Improvement**: ≥ 40%
- **Unsatisfactory**: < 40%

### 3. Trigger Preview System

#### Training Triggers:
- **Basic Training**: Overall score < 55 or < 40
- **Negativity Handling Training**: Major negativity > 0 and negativity < 25
- **Do's & Don'ts Training**: Quality > 1
- **Application Usage Training**: App usage < 80

#### Audit Triggers:
- **Audit Call**: Overall score < 70
- **Cross-check**: Overall score < 70
- **Dummy Audit**: Overall score < 50
- **Cross-verification**: Insufficiency > 2

#### Email Triggers:
- **KPI Notification**: Always sent
- **Training Assignment**: When training is required
- **Audit Notification**: When audits are required
- **Warning Letter**: When score < 40

### 4. Form Validation

#### Required Field Validation:
- User selection
- Period selection
- All KPI metrics

#### Range Validation:
- Percentages: 0-100
- Counts: 0-10
- Period format: YYYY-MM

#### Real-time Validation:
- Immediate feedback on input errors
- Field-specific error messages
- Form submission prevention with invalid data

### 5. User Experience Features

#### Draft Management:
- Save form as draft to localStorage
- Load previously saved drafts
- Draft status indicators

#### Form Actions:
- Reset form to initial state
- Cancel form submission
- Submit with loading states

#### Preview System:
- Toggle preview panel
- Real-time trigger visualization
- Score and rating display

### 6. Email Recipient Management

#### Recipient Types:
- **Field Executive**: The user being evaluated
- **Coordinator**: Direct supervisor
- **Manager**: Department manager
- **Head of Department**: HOD
- **Compliance Team**: Compliance officers

#### Default Selection:
- FE: Always selected
- Coordinator: Always selected
- Manager: Always selected
- HOD: Optional
- Compliance: Optional

## Integration

### API Integration

The form integrates with the enhanced KPI API through `apiService.kpi.submitKPI()`:

```typescript
const response = await apiService.kpi.submitKPI({
  userId: formData.userId,
  period: formData.period,
  comments: formData.comments,
  tat: formData.metrics.tat,
  quality: formData.metrics.quality,
  appUsage: formData.metrics.appUsage,
  negativity: formData.metrics.negativity,
  majorNegativity: formData.metrics.majorNegativity,
  neighborCheck: formData.metrics.neighborCheck,
  generalNegativity: formData.metrics.negativity,
  insufficiency: formData.metrics.insufficiency
});
```

### Automation Integration

The form automatically triggers:
1. **KPI Score Submission**: Saves KPI data to database
2. **Automation Processing**: Triggers KPITriggerService
3. **Training Assignments**: Creates required training assignments
4. **Audit Scheduling**: Schedules required audits
5. **Email Notifications**: Sends emails to selected recipients
6. **Lifecycle Events**: Creates tracking events

## Usage Examples

### Basic Usage

```tsx
import { KPIEntryForm } from '../components/KPIEntryForm';

function AdminDashboard() {
  const handleKPISuccess = (result) => {
    console.log('KPI submitted:', result);
    // Handle success (show notification, redirect, etc.)
  };

  return (
    <KPIEntryForm 
      onSuccess={handleKPISuccess}
      mode="create"
    />
  );
}
```

### With Initial Data

```tsx
const initialData = {
  userId: '507f1f77bcf86cd799439011',
  period: '2024-01',
  metrics: {
    tat: 85,
    quality: 90,
    appUsage: 75,
    // ... other metrics
  }
};

<KPIEntryForm 
  initialData={initialData}
  mode="edit"
  onSuccess={handleSuccess}
  onCancel={handleCancel}
/>
```

### Bulk Entry Mode

```tsx
<KPIEntryForm 
  mode="bulk"
  onSuccess={handleBulkSuccess}
/>
```

## Enhanced KPITriggers Page

The existing KPITriggers page has been enhanced with tabs:

### Tab Structure:
1. **KPI Entry**: Complete form for submitting KPIs
2. **Rule Simulator**: Original rule engine simulator
3. **Analytics**: KPI analytics and insights (placeholder)

### Integration:
- Seamless integration with existing simulator
- Maintains backward compatibility
- Enhanced user experience with tabbed interface

## Error Handling

### Validation Errors:
- Field-specific error messages
- Real-time validation feedback
- Form submission prevention

### API Errors:
- Network error handling
- Server error display
- Retry mechanisms

### User Feedback:
- Loading states during submission
- Success/error notifications
- Draft save confirmations

## Styling and UI

### Design System:
- Uses existing UI components (Card, Button, Input, etc.)
- Consistent with platform design
- Responsive layout for all screen sizes

### Color Coding:
- Score-based color coding for ratings
- Status-based colors for triggers
- Error/success state indicators

### Accessibility:
- Proper form labels
- Keyboard navigation support
- Screen reader compatibility

## Performance Considerations

### Real-time Calculations:
- Efficient trigger calculations
- Debounced input handling
- Optimized re-renders

### Data Management:
- Local storage for drafts
- Efficient user loading
- Pagination for large user lists

### API Optimization:
- Single API call for submission
- Proper error handling
- Loading state management

## Future Enhancements

### Planned Features:
1. **Bulk KPI Entry**: Support for multiple users
2. **KPI Templates**: Predefined metric sets
3. **Historical Data**: Previous KPI loading
4. **Advanced Analytics**: Performance trends
5. **Export Functionality**: PDF/Excel export
6. **Notification System**: Real-time updates

### Integration Opportunities:
1. **Dashboard Integration**: KPI widgets
2. **Reporting System**: Automated reports
3. **Mobile Support**: Mobile-optimized form
4. **Offline Support**: Offline form submission

## Troubleshooting

### Common Issues:

#### Form Not Submitting:
- Check all required fields are filled
- Verify user selection
- Ensure valid period format

#### Validation Errors:
- Check metric ranges (0-100 for percentages, 0-10 for counts)
- Verify period format (YYYY-MM)
- Ensure user is selected

#### API Errors:
- Check network connection
- Verify backend server is running
- Check authentication token

#### Draft Issues:
- Clear browser storage if drafts are corrupted
- Check localStorage permissions
- Verify draft data format

## Security Considerations

### Data Validation:
- Client-side validation for UX
- Server-side validation for security
- Input sanitization

### Authentication:
- JWT token validation
- Role-based access control
- Session management

### Data Protection:
- Secure API communication
- No sensitive data in localStorage
- Proper error message handling

This comprehensive KPI Entry Form provides a complete solution for KPI management with full automation integration, maintaining the existing design patterns while adding powerful new functionality.
