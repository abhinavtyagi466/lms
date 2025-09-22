# Admin KPI Entry Guide

## Overview

This guide provides step-by-step instructions for administrators on how to use the KPI entry system to submit performance scores and manage the automated training and audit processes.

## Accessing the KPI Entry System

### 1. Login as Admin
1. Navigate to the application login page
2. Enter your admin credentials
3. Click "Login"

### 2. Navigate to KPI Management
1. From the admin dashboard, click on "KPI Management" in the sidebar
2. Select "KPI Entry" tab
3. You'll see the comprehensive KPI entry form

## KPI Entry Form

### Form Overview
The KPI entry form includes fields for all 7 KPI metrics:

1. **TAT (Turn Around Time)** - Response time performance
2. **Major Negativity** - Critical performance issues
3. **Quality** - Service quality metrics
4. **Neighbor Check** - Cross-verification performance
5. **General Negativity** - Overall negative feedback
6. **App Usage** - Application utilization
7. **Insufficiency** - Resource adequacy

### Step-by-Step Entry Process

#### Step 1: Select User
1. Click on the "User" dropdown
2. Search for the field executive by name or email
3. Select the appropriate user

#### Step 2: Select Period
1. Click on the "Period" dropdown
2. Select the month and year for the KPI score
3. Format: YYYY-MM (e.g., 2024-03)

#### Step 3: Enter KPI Metrics
Fill in each KPI metric with the appropriate score:

**TAT (Turn Around Time)**
- Range: 0-100
- Higher scores indicate better performance
- Example: 85 (good response time)

**Major Negativity**
- Range: 0-10
- Lower scores indicate better performance
- Example: 1 (minimal major issues)

**Quality**
- Range: 0-100
- Higher scores indicate better quality
- Example: 90 (high quality service)

**Neighbor Check**
- Range: 0-100
- Higher scores indicate better cross-verification
- Example: 80 (good neighbor check performance)

**General Negativity**
- Range: 0-100
- Lower scores indicate better performance
- Example: 15 (low general negativity)

**App Usage**
- Range: 0-100
- Higher scores indicate better app utilization
- Example: 95 (excellent app usage)

**Insufficiency**
- Range: 0-10
- Lower scores indicate better resource adequacy
- Example: 1 (minimal insufficiency)

#### Step 4: Review Real-Time Calculations
As you enter the KPI metrics, the system automatically:
- Calculates the overall score
- Determines the performance rating
- Shows the trigger preview

**Performance Ratings:**
- **Excellent (90-100)**: Outstanding performance
- **Good (70-89)**: Above average performance
- **Average (55-69)**: Satisfactory performance
- **Below Average (40-54)**: Needs improvement
- **Poor (0-39)**: Requires immediate attention

#### Step 5: Select Email Recipients
Choose who should receive email notifications:
- **Field Executive**: The employee whose KPI is being entered
- **Coordinator**: Direct supervisor
- **Manager**: Department manager
- **HOD**: Head of Department
- **Compliance**: Compliance team

#### Step 6: Review Trigger Preview
The system shows what will be automatically triggered:

**Training Assignments:**
- Basic Training (if overall score < 55)
- Negativity Handling (if major negativity > 0 and general negativity < 25)
- Do's & Don'ts (if quality > 1)
- App Usage Training (if app usage < 80)

**Audit Schedules:**
- Audit Call (if overall score < 70)
- Cross-check (if overall score < 70)
- Dummy Audit (if overall score < 50)
- Cross-verification (if insufficiency > 2)

**Email Notifications:**
- KPI notification to selected recipients
- Training assignment notifications
- Audit scheduling notifications
- Warning letters (if performance is poor)

#### Step 7: Submit KPI Score
1. Review all entered data
2. Verify the trigger preview
3. Click "Submit KPI" button
4. Wait for the automation process to complete

## Form Features

### Draft Saving
1. Click "Save as Draft" to save incomplete data
2. Drafts are saved locally in your browser
3. Return later to complete the entry

### Form Reset
1. Click "Reset Form" to clear all fields
2. Confirms before clearing all data
3. Useful for starting a new entry

### Load Previous KPI
1. Click "Load Previous KPI" to load the last submitted score
2. Useful for making adjustments or corrections
3. Loads the most recent KPI for the selected user

### Bulk Entry
1. Click "Bulk Entry" to switch to bulk mode
2. Upload a CSV file with multiple KPI entries
3. CSV format: User, TAT, Major Negativity, Quality, Neighbor Check, General Negativity, App Usage, Insufficiency

## Validation and Error Handling

### Input Validation
The system validates all inputs:
- **Required Fields**: All fields must be filled
- **Score Ranges**: All scores must be within valid ranges
- **Period Format**: Must be in YYYY-MM format
- **User Selection**: Must select a valid user

### Error Messages
Common error messages and solutions:

**"Please fill in all required fields"**
- Solution: Complete all KPI metric fields

**"KPI scores must be between 0 and 100"**
- Solution: Enter valid scores within the specified ranges

**"Period must be in YYYY-MM format"**
- Solution: Use the correct date format (e.g., 2024-03)

**"Please select a user"**
- Solution: Select a user from the dropdown

**"Duplicate KPI score for this period"**
- Solution: Check if KPI already exists for this user and period

## Automation Process

### What Happens After Submission
1. **KPI Score Creation**: The score is saved to the database
2. **Trigger Calculation**: System calculates what actions to take
3. **Training Assignment**: Automatically assigns required trainings
4. **Audit Scheduling**: Schedules necessary audits
5. **Email Notifications**: Sends emails to selected recipients
6. **Lifecycle Tracking**: Records the event in the employee's lifecycle

### Automation Status
Monitor the automation status:
- **Pending**: Automation is queued
- **Processing**: Automation is in progress
- **Completed**: Automation finished successfully
- **Failed**: Automation encountered an error

### Manual Reprocessing
If automation fails:
1. Go to the KPI details page
2. Click "Reprocess Triggers"
3. System will retry the automation process

## Best Practices

### Data Entry
1. **Accuracy**: Double-check all entered scores
2. **Consistency**: Use consistent scoring criteria
3. **Timeliness**: Submit KPI scores promptly
4. **Documentation**: Keep records of scoring decisions

### User Selection
1. **Verification**: Ensure you're selecting the correct user
2. **Search**: Use the search function for large user lists
3. **Confirmation**: Verify user details before submission

### Period Management
1. **Consistency**: Use consistent period formats
2. **Completeness**: Ensure all periods are covered
3. **Timeliness**: Submit scores for the correct period

### Email Recipients
1. **Relevance**: Only select relevant recipients
2. **Completeness**: Include all necessary stakeholders
3. **Consistency**: Use consistent recipient selection

## Troubleshooting

### Common Issues

**Form Not Loading**
- Solution: Refresh the page and try again
- Check internet connection
- Clear browser cache

**User Not Found**
- Solution: Verify user exists in the system
- Check spelling in search
- Contact system administrator

**Validation Errors**
- Solution: Check all field values
- Ensure scores are within valid ranges
- Verify period format

**Automation Failures**
- Solution: Check system logs
- Try manual reprocessing
- Contact technical support

### Getting Help
1. **Documentation**: Refer to this guide
2. **System Logs**: Check for error messages
3. **Technical Support**: Contact the development team
4. **Training**: Request additional training if needed

## Advanced Features

### KPI History
1. View previous KPI scores for any user
2. Track performance trends over time
3. Compare scores across different periods

### Performance Analytics
1. View overall performance statistics
2. Identify trends and patterns
3. Generate performance reports

### Bulk Operations
1. Submit multiple KPI scores at once
2. Use CSV import for large datasets
3. Batch process automation triggers

## Security and Compliance

### Data Protection
- All KPI data is encrypted
- Access is restricted to authorized personnel
- Audit trails are maintained

### Compliance
- Follow company policies for KPI scoring
- Maintain confidentiality of performance data
- Ensure fair and consistent scoring

### Backup and Recovery
- Regular backups of KPI data
- Disaster recovery procedures
- Data retention policies

## Training and Support

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
