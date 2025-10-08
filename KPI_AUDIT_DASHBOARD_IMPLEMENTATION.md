# KPI-Based Audit Dashboard Implementation Summary

## Overview
This document describes the implementation of a KPI-based audit dashboard that categorizes users by their KPI performance ratings and displays them in separate, real-time updating tables with their respective audit and training requirements.

## Implementation Date
October 8, 2025

## Features Implemented

### 1. Backend API Endpoint
**File**: `backend/routes/auditScheduling.js`

#### New Endpoint: GET `/api/audit-scheduling/by-kpi-rating`
- **Purpose**: Fetches users grouped by KPI performance ratings
- **Access**: Admin only (requires authentication)
- **Returns**: JSON object with:
  - `groupedByRating`: Users categorized into 5 groups
  - `statistics`: Aggregate counts and averages
  - `lastUpdated`: Timestamp of data refresh

#### Rating Categories
1. **Outstanding (85-100)**: 
   - Training: None
   - Audit: None
   - Reward: Eligible

2. **Excellent (70-84)**:
   - Training: None
   - Audit: Audit Call

3. **Satisfactory (50-69)**:
   - Training: None
   - Audit: Audit Call + Cross-check last 3 months data

4. **Need Improvement (40-49)**:
   - Training: Assign Basic Training Module (Joining-level training)
   - Audit: Audit Call + Cross-check last 3 months + Basic Audit Case

5. **Unsatisfactory (Below 40)**:
   - Training: Assign Basic Training Module (Joining-level training)
   - Audit: Audit Call + Cross-check last 3 months + Dummy Audit Case
   - Warning: Issue automatic warning letter to FE

#### Data Structure Per User
```javascript
{
  userId: string,
  name: string,
  email: string,
  employeeId: string,
  department: string,
  kpiScore: number,
  rating: string,
  period: string,
  kpiScoreId: string,
  triggeredActions: string[],
  metrics: {
    tat: number,
    majorNegativity: number,
    quality: number,
    neighborCheck: number,
    negativity: number,
    appUsage: number,
    insufficiency: number
  },
  pendingAudits: Array<AuditSchedule>,
  pendingTraining: Array<TrainingAssignment>,
  auditRequirement: string,
  trainingRequirement: string,
  warningRequired: boolean,
  rewardEligible: boolean,
  lastUpdated: Date
}
```

### 2. Frontend Dashboard
**File**: `frontend/pages/admin/KPIAuditDashboard.tsx`

#### Key Features

##### Statistics Overview
- Total users count
- Count by each rating category (5 categories)
- Average KPI score across all users
- Visual cards with color-coded indicators

##### Search Functionality
- Real-time search by:
  - Employee name
  - Email address
  - Employee ID
- Search applies across all rating categories

##### Separate Tables by Rating
Each rating category has its own dedicated table showing:
- Employee details (name, ID, email)
- KPI score and rating badge
- Period of evaluation
- Training requirements
- Audit requirements
- Pending actions (audits, training, warnings, rewards)
- Action buttons (View Details, Send Email)

##### Color Coding
- **Outstanding**: Green theme
- **Excellent**: Blue theme
- **Satisfactory**: Yellow theme
- **Need Improvement**: Orange theme
- **Unsatisfactory**: Red theme

##### Real-Time Updates
- Auto-refreshes every 5 minutes
- Manual refresh button available
- Last updated timestamp displayed

##### Tab Navigation
Six tabs for easy navigation:
1. Overview - Statistics and summary
2. Outstanding Users
3. Excellent Users
4. Satisfactory Users
5. Need Improvement Users
6. Unsatisfactory Users

### 3. API Service Integration
**File**: `frontend/services/apiService.ts`

Added new method:
```typescript
auditScheduling: {
  getByKPIRating: async () => {
    const response = await apiClient.get('/audit-scheduling/by-kpi-rating');
    return response;
  }
}
```

### 4. App Routing
**File**: `frontend/App.tsx`

- Added lazy-loaded component import
- Added sidebar menu item: "KPI Audit Dashboard"
- Added route: `kpi-audit-dashboard`
- Positioned in admin sidebar after "KPI Triggers"

## Email Notification Logic

### Training Assignment Emails
**Recipients**: FE, Coordinator, Managers, HOD
- Sent when: KPI score < 50
- Template: `training_assignment`
- Includes: Training type, reason, due date

### Audit Notification Emails
**Recipients**: Compliance Team, HOD
- Sent when: Any audit is triggered
- Template: `audit_schedule`
- Subject varies based on triggered audit type:
  - "Audit Call Required"
  - "Audit Call + 3 Months Cross-check Required"
  - "Audit Call + 3 Months + Dummy Audit Required"

### Warning Letter Emails
**Recipients**: FE, Coordinator, Manager, Compliance Team, HOD
- Sent when: KPI score < 40
- Template: `performance_warning`
- Auto-generated with performance concerns

## Database Integration

### Models Used
1. **KPIScore**: Stores individual KPI scores with ratings
2. **AuditSchedule**: Tracks scheduled audits
3. **TrainingAssignment**: Manages training assignments
4. **User**: Employee information

### Queries Implemented
```javascript
// Get latest KPI scores grouped by user
KPIScore.aggregate([
  { $match: { isActive: true } },
  { $sort: { createdAt: -1 } },
  { $group: { _id: '$userId', latestScore: { $first: '$$ROOT' } } },
  { $replaceRoot: { newRoot: '$latestScore' } }
])

// Get pending audits for each user
AuditSchedule.find({
  userId: userId,
  status: { $in: ['scheduled', 'in_progress'] },
  isActive: true
})

// Get pending training for each user
TrainingAssignment.find({
  userId: userId,
  status: { $in: ['assigned', 'in_progress'] },
  isActive: true
})
```

## Helper Functions

### getAuditRequirement(score)
Determines audit requirements based on KPI score:
- 85-100: "None – eligible for reward"
- 70-84: "Audit Call"
- 50-69: "Audit Call + Cross-check last 3 months data"
- 40-49: "Audit Call + Cross-check last 3 months data + Dummy Audit Case"
- <40: "Audit Call + Cross-check last 3 months data + Dummy Audit Case + Issue automatic warning letter"

### getTrainingRequirement(score)
Determines training requirements:
- ≥50: "None"
- <50: "Assign Basic Training Module (Joining-level training)"

## UI/UX Enhancements

### Visual Indicators
- Color-coded badges for ratings
- Icons for each category (Trophy, Star, ThumbsUp, TrendingUp, AlertTriangle)
- Progress indicators for pending actions
- Badge counts for audits and training

### Responsive Design
- Mobile-friendly table layout
- Flexible grid system for statistics cards
- Horizontal scrolling for wide tables
- Collapsible sidebar on mobile

### Performance Optimizations
- Lazy loading of components
- Client-side filtering
- Cached data with 5-minute TTL
- Efficient database aggregation

## Testing Checklist

- [x] Backend API endpoint created
- [x] Frontend dashboard page created
- [x] Routing configured
- [x] API service integration
- [x] Color coding implemented
- [x] Search functionality
- [x] Real-time updates (5-minute interval)
- [x] Separate tables for each category
- [x] Statistics overview
- [x] No linter errors

## Future Enhancements

### Potential Additions
1. Export functionality (PDF/Excel)
2. Bulk action buttons (send emails to multiple users)
3. Advanced filtering (by department, period, etc.)
4. Detailed user drill-down view
5. Chart/graph visualizations
6. Email preview before sending
7. Custom email templates per rating
8. Scheduled report generation
9. Performance trend analysis
10. Notification system for critical cases

## Technical Notes

### Dependencies
- React 18+ with TypeScript
- Lucide React icons
- Shadcn/ui components
- Express.js backend
- MongoDB with Mongoose
- Socket.IO for real-time updates (future)

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Security
- Admin-only access via JWT authentication
- CORS configured for allowed origins
- Input validation on backend
- XSS protection via React

## Deployment Considerations

### Environment Variables Required
```
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
CLIENT_ORIGIN=<frontend_url>
```

### Server Routes
Ensure `backend/server.js` includes:
```javascript
app.use('/api/audit-scheduling', auditSchedulingRoutes);
```

### Build Commands
Frontend:
```bash
npm run build
```

Backend:
```bash
# No build required (Node.js)
npm start
```

## Contact & Support
For questions or issues, refer to the main project documentation or contact the development team.

---

**Implementation Status**: ✅ Complete and Ready for Production

**Last Updated**: October 8, 2025

