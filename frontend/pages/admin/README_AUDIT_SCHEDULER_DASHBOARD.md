# Audit Scheduler Dashboard

## Overview
The Audit Scheduler Dashboard provides comprehensive audit management and compliance tracking capabilities for administrators.

## Features

### 1. Dashboard Overview
- **Statistics Cards**: Total audits, scheduled, in progress, completed, and completion rate
- **Real-time Data**: Live updates of audit statistics and status
- **Quick Access**: Easy navigation to different audit management sections

### 2. Audit Management
- **Schedule New Audits**: Manual audit scheduling with user selection, audit type, and date/time
- **View Audit Details**: Comprehensive audit information display
- **Mark as Complete**: Complete audits with findings and observations
- **Reschedule Audits**: Modify scheduled audit dates and times
- **Cancel Audits**: Remove unnecessary or invalid audit schedules

### 3. Audit Types Supported
- **Audit Call**: Phone-based audits for performance review
- **Cross Check**: Cross-verification of work quality
- **Dummy Audit**: Practice audits for training purposes

### 4. Filtering and Search
- **Search Functionality**: Search by user name or email
- **Status Filtering**: Filter by audit status (scheduled, in progress, completed)
- **Type Filtering**: Filter by audit type
- **Real-time Filtering**: Instant results as you type or select filters

### 5. Compliance Tracking
- **Compliance Overview**: Overall compliance percentage and metrics
- **Audit Completion Rates**: Track completion rates over time
- **Overdue Audits**: Identify and manage overdue audits
- **Risk Assessment**: Compliance risk evaluation (placeholder for future implementation)

### 6. Analytics and Reporting
- **Audit Analytics**: Performance trends and statistics (placeholder)
- **Compliance Reports**: Generate compliance reports (placeholder)
- **Export Functionality**: Export audit data for external analysis (placeholder)

## User Interface

### Navigation Tabs
1. **Scheduled Audits**: Main audit management interface
2. **Compliance**: Compliance tracking and overview
3. **Analytics**: Audit analytics and trends
4. **Reports**: Report generation and exports

### Key Components
- **Statistics Dashboard**: Overview cards showing key metrics
- **Audit Table**: Sortable and filterable table of all audits
- **Schedule Dialog**: Modal for creating new audit schedules
- **Complete Dialog**: Modal for marking audits as complete with findings
- **Search and Filters**: Advanced filtering options

## API Integration

### Required API Endpoints
- `GET /api/audit-scheduling/scheduled` - Get all scheduled audits
- `GET /api/audit-scheduling/stats` - Get audit statistics
- `POST /api/audit-scheduling/manual` - Schedule new audit manually
- `PUT /api/audit-scheduling/:id/complete` - Mark audit as completed
- `GET /api/audit-scheduling/overdue` - Get overdue audits
- `GET /api/audit-scheduling/upcoming` - Get upcoming audits

### Data Models
```typescript
interface AuditSchedule {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    role: string;
  };
  auditType: 'audit_call' | 'cross_check' | 'dummy_audit';
  scheduledDate: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  kpiTriggerId?: string;
  completedDate?: string;
  findings?: string;
  createdAt: string;
}

interface AuditStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionRate: number;
}
```

## Usage Instructions

### Scheduling a New Audit
1. Click the "Schedule Audit" button in the top right
2. Fill in the user ID, audit type, and scheduled date/time
3. Add any additional notes
4. Click "Schedule Audit" to create the audit

### Completing an Audit
1. Find the audit in the table
2. Click the checkmark button in the Actions column
3. Add findings and observations in the dialog
4. Click "Complete Audit" to mark as completed

### Managing Audits
1. Use the search bar to find specific audits
2. Use status and type filters to narrow down results
3. Click the eye icon to view detailed audit information
4. Use the refresh button to update the audit list

## Technical Implementation

### State Management
- React hooks for local state management
- Real-time updates through API calls
- Error handling and loading states

### UI Components
- Responsive design using Tailwind CSS
- Shadcn/UI components for consistent styling
- Lucide React icons for visual elements
- Table components for data display

### Error Handling
- Graceful error handling for API failures
- Loading states during data fetching
- User feedback for successful actions

## Future Enhancements

### Planned Features
1. **Calendar View**: Visual calendar for audit scheduling
2. **Bulk Operations**: Mass schedule/complete/cancel audits
3. **Automated Reminders**: Email/SMS reminders for upcoming audits
4. **Advanced Analytics**: Detailed performance metrics and trends
5. **Compliance Reporting**: Automated compliance report generation
6. **Audit Templates**: Predefined audit templates for different scenarios
7. **Mobile Optimization**: Enhanced mobile interface for field auditors

### Integration Opportunities
1. **KPI Integration**: Direct integration with KPI trigger system
2. **Email Automation**: Automated audit notifications
3. **User Dashboard**: Show upcoming audits on user dashboard
4. **Lifecycle Events**: Track audit events in user lifecycle
5. **Performance Tracking**: Link audit results to performance metrics

## Troubleshooting

### Common Issues
1. **Data Not Loading**: Check API endpoint availability and authentication
2. **Filters Not Working**: Verify filter state management and API parameters
3. **Scheduling Errors**: Validate form data and API payload structure
4. **Permission Issues**: Ensure proper admin authentication and authorization

### Debug Information
- Check browser console for API errors
- Verify authentication tokens
- Confirm backend service availability
- Review API response formats
