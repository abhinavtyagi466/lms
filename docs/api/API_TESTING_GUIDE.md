# API Testing Guide

## Overview

This guide provides comprehensive instructions for testing the KPI automation system APIs, including setup, test scenarios, and best practices.

## Prerequisites

### Required Tools
- **Postman** or **Insomnia** for API testing
- **curl** for command-line testing
- **Node.js** for running the test suite
- **MongoDB** for database testing

### Environment Setup
1. Start the backend server: `cd backend && npm run dev`
2. Ensure MongoDB is running
3. Set up test environment variables
4. Run database migrations

## Authentication Testing

### 1. User Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### 2. Token Validation
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

## KPI Management Testing

### 1. Submit KPI Score (Excellent Performance)
```bash
curl -X POST http://localhost:3001/api/kpi \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "period": "2024-03",
    "tat": 95,
    "majorNegativity": 0,
    "quality": 95,
    "neighborCheck": 90,
    "generalNegativity": 5,
    "appUsage": 98,
    "insufficiency": 0,
    "emailRecipients": ["field_executive"]
  }'
```

**Expected Result:** No training assignments or audits triggered, only KPI notification email.

### 2. Submit KPI Score (Poor Performance)
```bash
curl -X POST http://localhost:3001/api/kpi \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "period": "2024-03",
    "tat": 40,
    "majorNegativity": 8,
    "quality": 50,
    "neighborCheck": 45,
    "generalNegativity": 60,
    "appUsage": 60,
    "insufficiency": 5,
    "emailRecipients": ["field_executive", "coordinator", "manager", "hod"]
  }'
```

**Expected Result:** All training assignments, audits, and warning emails triggered.

### 3. Get KPI Triggers
```bash
curl -X GET http://localhost:3001/api/kpi/507f1f77bcf86cd799439021/triggers \
  -H "Authorization: Bearer <your-token>"
```

### 4. Reprocess KPI Triggers
```bash
curl -X POST http://localhost:3001/api/kpi/507f1f77bcf86cd799439021/reprocess \
  -H "Authorization: Bearer <your-token>"
```

## Training Assignment Testing

### 1. Auto-Assign Training
```bash
curl -X POST http://localhost:3001/api/training-assignments/auto-assign \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "kpiScoreId": "507f1f77bcf86cd799439021"
  }'
```

### 2. Get Pending Training Assignments
```bash
curl -X GET "http://localhost:3001/api/training-assignments/pending?page=1&limit=10" \
  -H "Authorization: Bearer <your-token>"
```

### 3. Complete Training Assignment
```bash
curl -X PUT http://localhost:3001/api/training-assignments/507f1f77bcf86cd799439031/complete \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 85,
    "completionDate": "2024-03-25T14:30:00Z",
    "notes": "Completed successfully"
  }'
```

### 4. Get Training Statistics
```bash
curl -X GET http://localhost:3001/api/training-assignments/stats \
  -H "Authorization: Bearer <your-token>"
```

## Audit Scheduling Testing

### 1. Schedule KPI Audits
```bash
curl -X POST http://localhost:3001/api/audit-scheduling/schedule-kpi-audits \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "kpiScoreId": "507f1f77bcf86cd799439021"
  }'
```

### 2. Get Scheduled Audits
```bash
curl -X GET "http://localhost:3001/api/audit-scheduling/scheduled?page=1&limit=10" \
  -H "Authorization: Bearer <your-token>"
```

### 3. Complete Audit
```bash
curl -X PUT http://localhost:3001/api/audit-scheduling/507f1f77bcf86cd799439041/complete \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "findings": "Good performance overall, minor improvements needed",
    "completionDate": "2024-04-10T15:00:00Z",
    "score": 8.5
  }'
```

### 4. Get Audit Statistics
```bash
curl -X GET http://localhost:3001/api/audit-scheduling/stats \
  -H "Authorization: Bearer <your-token>"
```

## Email Management Testing

### 1. Get Email Logs
```bash
curl -X GET "http://localhost:3001/api/email-logs?page=1&limit=10&status=sent" \
  -H "Authorization: Bearer <your-token>"
```

### 2. Resend Failed Email
```bash
curl -X POST http://localhost:3001/api/email-logs/507f1f77bcf86cd799439051/resend \
  -H "Authorization: Bearer <your-token>"
```

### 3. Retry All Failed Emails
```bash
curl -X POST http://localhost:3001/api/email-logs/retry-failed \
  -H "Authorization: Bearer <your-token>"
```

### 4. Get Email Statistics
```bash
curl -X GET http://localhost:3001/api/email-stats \
  -H "Authorization: Bearer <your-token>"
```

## Error Testing

### 1. Invalid KPI Score
```bash
curl -X POST http://localhost:3001/api/kpi \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "period": "2024-03",
    "tat": 150,
    "majorNegativity": -5,
    "quality": 200
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "tat": "TAT score must be between 0 and 100",
    "majorNegativity": "Major negativity cannot be negative",
    "quality": "Quality score must be between 0 and 100"
  }
}
```

### 2. Duplicate KPI Period
```bash
curl -X POST http://localhost:3001/api/kpi \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "period": "2024-03",
    "tat": 85,
    "majorNegativity": 1,
    "quality": 90,
    "neighborCheck": 80,
    "generalNegativity": 15,
    "appUsage": 95,
    "insufficiency": 1
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "KPI score already exists for this period",
  "code": "DUPLICATE_KPI_PERIOD"
}
```

### 3. Invalid Authentication
```bash
curl -X GET http://localhost:3001/api/kpi/stats \
  -H "Authorization: Bearer invalid-token"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid authentication token",
  "code": "AUTHENTICATION_ERROR"
}
```

### 4. Resource Not Found
```bash
curl -X GET http://localhost:3001/api/kpi/507f1f77bcf86cd799439999 \
  -H "Authorization: Bearer <your-token>"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "KPI score not found",
  "code": "NOT_FOUND"
}
```

## Performance Testing

### 1. Load Testing with Multiple Requests
```bash
# Test concurrent KPI submissions
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/kpi \
    -H "Authorization: Bearer <your-token>" \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"507f1f77bcf86cd799439011\",
      \"period\": \"2024-0$i\",
      \"tat\": 85,
      \"majorNegativity\": 1,
      \"quality\": 90,
      \"neighborCheck\": 80,
      \"generalNegativity\": 15,
      \"appUsage\": 95,
      \"insufficiency\": 1
    }" &
done
wait
```

### 2. Large Dataset Testing
```bash
# Test with large number of training assignments
curl -X GET "http://localhost:3001/api/training-assignments/pending?limit=100" \
  -H "Authorization: Bearer <your-token>"
```

## Postman Collection

### Import Collection
1. Download the Postman collection file
2. Import into Postman
3. Set up environment variables:
   - `base_url`: http://localhost:3001/api
   - `auth_token`: Your JWT token
   - `user_id`: Test user ID

### Environment Variables
```json
{
  "base_url": "http://localhost:3001/api",
  "auth_token": "{{jwt_token}}",
  "user_id": "507f1f77bcf86cd799439011",
  "kpi_score_id": "507f1f77bcf86cd799439021",
  "training_assignment_id": "507f1f77bcf86cd799439031",
  "audit_schedule_id": "507f1f77bcf86cd799439041",
  "email_log_id": "507f1f77bcf86cd799439051"
}
```

### Pre-request Scripts
```javascript
// Set authorization header
pm.request.headers.add({
  key: 'Authorization',
  value: 'Bearer ' + pm.environment.get('auth_token')
});
```

### Test Scripts
```javascript
// Test response status
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test response structure
pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

// Test response time
pm.test("Response time is less than 5000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});
```

## Automated Testing

### Running the Test Suite
```bash
# Run all tests
cd backend && npm test

# Run specific test categories
npm test -- --testPathPattern=integration
npm test -- --testPathPattern=kpi
npm test -- --testPathPattern=training
npm test -- --testPathPattern=audit
npm test -- --testPathPattern=email

# Run with coverage
npm test -- --coverage
```

### Test Data Setup
```bash
# Seed test data
npm run seed:test

# Clean test data
npm run clean:test
```

## Best Practices

### 1. Test Data Management
- Use consistent test data across all tests
- Clean up test data after each test
- Use unique identifiers for test data
- Avoid hardcoded values in tests

### 2. Error Testing
- Test all error scenarios
- Verify error codes and messages
- Test edge cases and boundary conditions
- Test authentication and authorization

### 3. Performance Testing
- Test with realistic data volumes
- Monitor response times
- Test concurrent operations
- Test under load conditions

### 4. Security Testing
- Test authentication mechanisms
- Test authorization rules
- Test input validation
- Test for SQL injection and XSS

### 5. Integration Testing
- Test complete workflows
- Test data consistency
- Test automation triggers
- Test email delivery

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify JWT token is valid
   - Check token expiration
   - Ensure proper header format

2. **Validation Errors**
   - Check required fields
   - Verify data types and formats
   - Check field constraints

3. **Database Errors**
   - Ensure MongoDB is running
   - Check database connection
   - Verify data exists

4. **Email Errors**
   - Check SMTP configuration
   - Verify email credentials
   - Check email service status

### Debug Mode
Enable debug mode for detailed logging:
```bash
DEBUG=kpi-automation:* npm run dev
```

### Log Analysis
Check server logs for detailed error information:
```bash
tail -f logs/app.log
```

## Test Reports

### Coverage Reports
- HTML coverage reports in `coverage/` directory
- Text coverage reports in console output
- Coverage thresholds: 80% minimum

### Performance Reports
- Response time metrics
- Throughput measurements
- Resource usage statistics

### Error Reports
- Error frequency analysis
- Error type distribution
- Error resolution tracking

## Continuous Integration

### GitHub Actions
```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

### Test Automation
- Automated test execution on code changes
- Coverage reporting
- Performance monitoring
- Error tracking and alerting
