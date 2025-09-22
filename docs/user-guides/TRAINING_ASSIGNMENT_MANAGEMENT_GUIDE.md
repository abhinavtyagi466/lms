# Training Assignment Management Guide

## Overview

This guide provides comprehensive instructions for managing training assignments in the KPI automation system, including automated assignments, manual management, and tracking completion.

## Accessing Training Management

### 1. Login as Admin
1. Navigate to the application login page
2. Enter your admin credentials
3. Click "Login"

### 2. Navigate to Training Management
1. From the admin dashboard, click on "Training Management" in the sidebar
2. You'll see the comprehensive training dashboard

## Training Dashboard Overview

### Dashboard Sections
1. **Overview Statistics**: Total assignments, completion rates, overdue items
2. **Training Assignments Table**: List of all training assignments
3. **Filtering and Search**: Tools to find specific assignments
4. **Bulk Actions**: Mass operations on multiple assignments
5. **Training Statistics**: Charts and analytics

### Key Metrics
- **Total Assignments**: Number of all training assignments
- **Pending**: Assignments waiting to be started
- **In Progress**: Assignments currently being completed
- **Completed**: Successfully finished assignments
- **Overdue**: Assignments past their due date

## Training Types

### 1. Basic Training
- **Purpose**: Fundamental skills and knowledge
- **Trigger**: Overall KPI score below 55
- **Duration**: 2-3 hours
- **Content**: Core competencies and procedures

### 2. Negativity Handling Training
- **Purpose**: Managing negative feedback and complaints
- **Trigger**: Major negativity > 0 and general negativity < 25
- **Duration**: 1-2 hours
- **Content**: Communication skills and conflict resolution

### 3. Do's & Don'ts Training
- **Purpose**: Best practices and compliance
- **Trigger**: Quality score > 1
- **Duration**: 1 hour
- **Content**: Guidelines and standards

### 4. App Usage Training
- **Purpose**: Application proficiency
- **Trigger**: App usage score < 80
- **Duration**: 1-2 hours
- **Content**: System features and optimization

## Automated Training Assignment

### How It Works
1. **KPI Submission**: Admin submits KPI score
2. **Trigger Calculation**: System calculates required trainings
3. **Automatic Assignment**: Trainings are automatically assigned
4. **Notification**: User receives assignment notification
5. **Tracking**: System tracks progress and completion

### Assignment Criteria
- **Overall Score < 55**: Basic Training
- **Major Negativity > 0 AND General Negativity < 25**: Negativity Handling
- **Quality > 1**: Do's & Don'ts Training
- **App Usage < 80**: App Usage Training

### Assignment Details
- **Due Date**: Automatically calculated (typically 7-14 days)
- **Priority**: Based on performance level
- **Assigned By**: Marked as "KPI Trigger"
- **Status**: Initially set to "Assigned"

## Manual Training Assignment

### Creating Manual Assignments
1. Click "Assign Training" button
2. Select user from dropdown
3. Choose training type
4. Set due date
5. Add notes (optional)
6. Click "Assign"

### Assignment Form Fields
- **User**: Select from dropdown or search
- **Training Type**: Choose from available types
- **Due Date**: Set completion deadline
- **Priority**: High, Medium, Low
- **Notes**: Additional instructions or context
- **Assigned By**: Automatically set to current admin

### Bulk Assignment
1. Select multiple users
2. Choose training type
3. Set common due date
4. Add bulk notes
5. Click "Bulk Assign"

## Managing Training Assignments

### Viewing Assignments
1. **All Assignments**: Complete list with filters
2. **Pending**: Assignments not yet started
3. **In Progress**: Currently active assignments
4. **Overdue**: Past due date assignments
5. **Completed**: Finished assignments

### Filtering and Search
- **By User**: Filter by specific user
- **By Training Type**: Filter by training category
- **By Status**: Filter by assignment status
- **By Date Range**: Filter by assignment or due date
- **By Priority**: Filter by priority level

### Assignment Details
Click on any assignment to view:
- **User Information**: Name, email, department
- **Training Details**: Type, content, duration
- **Assignment Info**: Assigned date, due date, priority
- **Progress**: Current status and completion percentage
- **History**: All related activities and updates

## Training Completion Management

### Marking as Complete
1. Navigate to assignment details
2. Click "Mark Complete"
3. Enter completion score (0-100)
4. Add completion notes
5. Upload completion certificate (optional)
6. Click "Complete"

### Completion Requirements
- **Score**: Must be between 0-100
- **Date**: Completion date (defaults to current date)
- **Notes**: Optional completion comments
- **Certificate**: Optional proof of completion

### Completion Validation
- **Score Validation**: Ensures score is within range
- **Date Validation**: Completion date cannot be before assignment date
- **Required Fields**: Score is mandatory
- **Duplicate Prevention**: Prevents duplicate completions

## Training Statistics and Analytics

### Overview Statistics
- **Total Assignments**: Count of all assignments
- **Completion Rate**: Percentage of completed assignments
- **Average Score**: Mean completion score
- **Overdue Rate**: Percentage of overdue assignments

### Performance Metrics
- **By Training Type**: Completion rates by category
- **By User**: Individual performance tracking
- **By Department**: Department-level analytics
- **By Time Period**: Historical performance trends

### Charts and Graphs
- **Completion Rate Chart**: Visual representation of completion rates
- **Training Type Distribution**: Pie chart of training types
- **Performance Trends**: Line chart showing improvement over time
- **Overdue Analysis**: Bar chart of overdue assignments

## Bulk Operations

### Bulk Actions Available
1. **Bulk Assign**: Assign same training to multiple users
2. **Bulk Reschedule**: Change due dates for multiple assignments
3. **Bulk Cancel**: Cancel multiple assignments
4. **Bulk Export**: Export assignment data to CSV
5. **Bulk Notify**: Send notifications to multiple users

### Performing Bulk Operations
1. Select multiple assignments using checkboxes
2. Choose bulk action from dropdown
3. Configure action parameters
4. Confirm the operation
5. Monitor progress and results

## Reporting and Export

### Available Reports
1. **Training Completion Report**: Detailed completion statistics
2. **Overdue Assignments Report**: List of overdue items
3. **Performance Analysis Report**: User performance trends
4. **Training Effectiveness Report**: Impact of training on performance

### Export Options
- **CSV Export**: Download data in spreadsheet format
- **PDF Report**: Generate formatted reports
- **Email Reports**: Send reports via email
- **Scheduled Reports**: Automatic report generation

### Report Customization
- **Date Range**: Select specific time periods
- **User Filter**: Include/exclude specific users
- **Training Type**: Filter by training categories
- **Status Filter**: Include specific assignment statuses

## Notifications and Communication

### Automatic Notifications
- **Assignment Notification**: Sent when training is assigned
- **Reminder Notifications**: Sent before due date
- **Overdue Notifications**: Sent when assignment is overdue
- **Completion Notifications**: Sent when training is completed

### Manual Notifications
1. Select assignments or users
2. Click "Send Notification"
3. Choose notification type
4. Customize message content
5. Send notification

### Notification Types
- **Email**: Standard email notifications
- **In-App**: Internal system notifications
- **SMS**: Text message notifications (if configured)
- **Push**: Mobile app notifications (if available)

## Troubleshooting

### Common Issues

**Assignment Not Created**
- Check if user exists in system
- Verify training type is valid
- Ensure due date is in the future
- Check for duplicate assignments

**Completion Not Recorded**
- Verify completion score is valid
- Check completion date is correct
- Ensure all required fields are filled
- Check for system errors

**Notifications Not Sent**
- Verify email configuration
- Check user email addresses
- Ensure notification settings are enabled
- Check system logs for errors

**Statistics Not Updating**
- Refresh the dashboard
- Check data synchronization
- Verify database connections
- Contact technical support

### Error Messages and Solutions

**"User not found"**
- Solution: Verify user exists and is active
- Check spelling in user selection
- Ensure user has proper permissions

**"Invalid training type"**
- Solution: Select from available training types
- Check training type configuration
- Verify system settings

**"Due date must be in the future"**
- Solution: Set due date to future date
- Check system date and time
- Verify date format

**"Assignment already exists"**
- Solution: Check for existing assignments
- Use different training type if needed
- Cancel existing assignment first

## Best Practices

### Assignment Management
1. **Timely Assignment**: Assign trainings promptly after KPI submission
2. **Appropriate Due Dates**: Set realistic completion deadlines
3. **Clear Instructions**: Provide detailed assignment notes
4. **Regular Monitoring**: Check assignment status regularly

### Completion Tracking
1. **Accurate Scoring**: Use consistent scoring criteria
2. **Detailed Notes**: Document completion details
3. **Certificate Management**: Maintain completion certificates
4. **Follow-up**: Monitor post-training performance

### Communication
1. **Clear Notifications**: Send clear and actionable notifications
2. **Regular Reminders**: Send timely reminders
3. **Progress Updates**: Keep stakeholders informed
4. **Feedback Collection**: Gather user feedback

### Data Management
1. **Regular Backups**: Ensure data is backed up
2. **Data Validation**: Verify data accuracy
3. **Audit Trails**: Maintain complete audit trails
4. **Privacy Protection**: Protect user data

## Advanced Features

### Training Paths
- **Sequential Training**: Assign trainings in specific order
- **Prerequisites**: Require completion of prerequisite trainings
- **Learning Paths**: Create structured learning journeys
- **Certification Tracks**: Multi-level certification programs

### Integration Features
- **LMS Integration**: Connect with Learning Management Systems
- **Video Platform**: Integrate with video training platforms
- **Assessment Tools**: Connect with testing and assessment systems
- **Analytics Platforms**: Integrate with business intelligence tools

### Automation Rules
- **Custom Triggers**: Create custom assignment triggers
- **Conditional Logic**: Set up complex assignment rules
- **Scheduling**: Automate assignment scheduling
- **Escalation**: Set up escalation procedures

## Support and Training

### Training Resources
1. **User Manual**: This comprehensive guide
2. **Video Tutorials**: Step-by-step video instructions
3. **Webinars**: Live training sessions
4. **Documentation**: Additional technical documentation

### Support Channels
1. **Help Desk**: Internal support system
2. **Email Support**: Direct email to support team
3. **Phone Support**: Emergency support line
4. **Online Chat**: Real-time support chat

### Feedback and Improvements
1. **User Feedback**: Submit feedback on the system
2. **Feature Requests**: Request new features
3. **Bug Reports**: Report system issues
4. **Training Needs**: Request additional training
