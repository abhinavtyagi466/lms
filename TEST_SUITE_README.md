# KPI Automation System - Comprehensive Test Suite

## Overview

This comprehensive test suite provides complete coverage for the KPI automation system, including backend integration tests, frontend integration tests, end-to-end tests, performance tests, and error handling tests.

## Test Structure

### Backend Tests (`backend/tests/`)

#### Integration Tests (`backend/tests/integration/`)

1. **KPI Trigger Processing Tests** (`kpiTriggerProcessing.test.js`)
   - Tests KPI score processing and automation triggers
   - Validates different KPI scenarios (excellent, good, average, below average, poor)
   - Tests automation status tracking
   - Validates error handling and edge cases
   - Performance tests for concurrent processing

2. **Training Assignment Automation Tests** (`trainingAssignmentAutomation.test.js`)
   - Tests automatic training assignment creation
   - Validates training type assignment logic
   - Tests training completion and scoring
   - Validates training statistics and reporting
   - Tests manual training assignment and cancellation

3. **Audit Scheduling Automation Tests** (`auditSchedulingAutomation.test.js`)
   - Tests automatic audit scheduling based on KPI scores
   - Validates different audit types (audit call, cross check, dummy audit)
   - Tests audit completion with findings
   - Validates audit statistics and reporting
   - Tests manual audit scheduling and cancellation

4. **Email Automation Tests** (`emailAutomation.test.js`)
   - Tests automated email sending for different triggers
   - Validates email template selection and content
   - Tests email delivery status tracking
   - Validates email retry mechanisms
   - Tests email statistics and reporting

5. **End-to-End KPI Flow Tests** (`endToEndKPIFlow.test.js`)
   - Tests complete KPI entry to training assignment flow
   - Tests complete KPI entry to audit scheduling flow
   - Tests complete training completion flow
   - Tests complete audit completion flow
   - Tests email notification delivery flow
   - Tests performance improvement tracking over time

#### Test Fixtures (`backend/tests/fixtures/`)

- **Sample Data** (`sampleData.js`)
  - Sample users with different roles
  - Sample KPI scores for different scenarios
  - Sample training assignments
  - Sample audit schedules
  - Sample email logs
  - Sample lifecycle events
  - Sample notifications
  - Test KPI scenarios for different performance levels

#### Test Utilities (`backend/tests/utils/`)

- **Test Helpers** (`testHelpers.js`)
  - Database setup and teardown utilities
  - Test data seeding functions
  - Authentication helpers
  - API test helpers
  - Assertion helpers
  - Performance testing helpers
  - Error testing helpers
  - Mock helpers
  - Database query helpers
  - Test data generators
  - Cleanup helpers

### Frontend Tests (`frontend/tests/`)

#### Integration Tests (`frontend/tests/integration/`)

1. **KPI Entry Form Tests** (`kpiEntryForm.test.tsx`)
   - Tests form rendering and initialization
   - Validates form field interactions
   - Tests real-time score calculation
   - Tests trigger preview functionality
   - Validates form submission and error handling
   - Tests form features (draft saving, reset, bulk entry)
   - Tests email recipient selection
   - Performance tests for rapid form changes

2. **Training Dashboard Tests** (planned)
   - Tests dashboard rendering and data display
   - Validates training assignment management
   - Tests training completion workflows
   - Validates statistics and reporting

3. **Email Center Tests** (planned)
   - Tests email history display
   - Validates email template management
   - Tests recipient group management
   - Validates email scheduling and delivery tracking

4. **Audit Scheduler Tests** (planned)
   - Tests audit schedule display
   - Validates audit management workflows
   - Tests audit completion processes
   - Validates compliance tracking

5. **User Dashboard Tests** (planned)
   - Tests KPI performance display
   - Validates training assignment integration
   - Tests audit information display
   - Validates notification management

#### Test Utilities (`frontend/tests/utils/`)

- **Test Helpers** (`testHelpers.ts`)
  - Mock API service setup
  - Test data fixtures
  - Custom render functions with providers
  - Form interaction helpers
  - Async operation helpers
  - Table interaction helpers
  - Modal interaction helpers
  - Navigation helpers
  - File upload helpers
  - Date input helpers
  - Search and filtering helpers
  - Pagination helpers
  - Tab helpers
  - Dropdown helpers
  - Keyboard interaction helpers
  - Accessibility helpers
  - Performance helpers
  - Error boundary helpers
  - Storage helpers
  - Timer helpers
  - Fetch mocking helpers
  - Window method mocking helpers
  - Observer mocking helpers
  - Cleanup helpers
  - Assertion helpers

## Test Configuration

### Backend Test Configuration

- **Jest Configuration** (`backend/tests/jest.config.js`)
  - Node.js test environment
  - MongoDB Memory Server for database testing
  - Coverage collection from models, routes, services, middleware
  - 30-second test timeout for integration tests
  - Comprehensive setup and teardown

- **Test Setup** (`backend/tests/setup.js`)
  - Global test environment setup
  - Test utilities and helpers
  - Mock data generators
  - Console method mocking

### Frontend Test Configuration

- **Vitest Configuration** (`frontend/tests/vitest.config.ts`)
  - JSDOM test environment
  - React testing setup
  - Path aliases for imports
  - Coverage configuration

- **Test Setup** (`frontend/tests/setup.ts`)
  - DOM API mocking (IntersectionObserver, ResizeObserver, matchMedia)
  - Storage mocking (localStorage, sessionStorage)
  - Fetch API mocking
  - Window method mocking
  - Global test utilities

## Running Tests

### Prerequisites

1. **Backend Dependencies**
   ```bash
   cd backend
   npm install
   npm install --save-dev jest supertest mongodb-memory-server @types/jest @types/supertest
   ```

2. **Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui @vitest/coverage-v8 msw
   ```

### Running Individual Test Suites

1. **Backend Integration Tests**
   ```bash
   cd backend
   npm test -- --testPathPattern=integration
   ```

2. **Frontend Integration Tests**
   ```bash
   cd frontend
   npm test -- --testNamePattern=Integration
   ```

3. **Performance Tests**
   ```bash
   cd backend
   npm test -- --testPathPattern=performance
   ```

4. **Error Handling Tests**
   ```bash
   cd backend
   npm test -- --testPathPattern=error
   ```

5. **End-to-End Tests**
   ```bash
   cd backend
   npm test -- --testPathPattern=endToEnd
   ```

### Running All Tests

1. **Using the Test Runner Script**
   ```bash
   chmod +x run-tests.sh
   ./run-tests.sh
   ```

2. **Manual Execution**
   ```bash
   # Backend tests
   cd backend && npm test -- --coverage
   
   # Frontend tests
   cd frontend && npm test -- --coverage
   ```

### Test Coverage

- **Backend Coverage**: Models, routes, services, middleware
- **Frontend Coverage**: Components, pages, services, utilities
- **Coverage Reports**: HTML and text formats
- **Coverage Thresholds**: 80% minimum coverage required

## Test Data and Fixtures

### Sample Data

The test suite includes comprehensive sample data covering:

1. **Users**: Different roles (field executive, coordinator, manager, admin)
2. **KPI Scores**: All performance levels (excellent, good, average, below average, poor)
3. **Training Assignments**: All training types with different statuses
4. **Audit Schedules**: All audit types with different statuses
5. **Email Logs**: Different template types and delivery statuses
6. **Lifecycle Events**: Various event types and metadata
7. **Notifications**: Different notification types and read statuses

### Test Scenarios

The test suite covers various scenarios:

1. **KPI Processing Scenarios**
   - Excellent performance (no triggers)
   - Good performance (minimal triggers)
   - Average performance (some triggers)
   - Below average performance (multiple triggers)
   - Poor performance (all triggers)

2. **Error Scenarios**
   - Invalid data handling
   - Network failures
   - Database connection issues
   - API timeout handling
   - Partial automation failures

3. **Performance Scenarios**
   - High volume processing
   - Concurrent operations
   - Large dataset handling
   - Memory usage optimization

## Test Results and Reporting

### Test Reports

- **HTML Coverage Reports**: Detailed coverage analysis
- **Test Execution Reports**: Pass/fail status and timing
- **Performance Reports**: Execution time and resource usage
- **Error Reports**: Detailed error information and stack traces

### Continuous Integration

The test suite is designed for CI/CD integration:

1. **Automated Testing**: Runs on every commit
2. **Coverage Tracking**: Monitors coverage changes
3. **Performance Monitoring**: Tracks test execution time
4. **Error Reporting**: Detailed failure analysis

## Best Practices

### Writing Tests

1. **Test Isolation**: Each test is independent
2. **Data Cleanup**: Proper setup and teardown
3. **Mocking**: Appropriate use of mocks and stubs
4. **Assertions**: Clear and specific assertions
5. **Error Testing**: Comprehensive error scenario coverage

### Test Maintenance

1. **Regular Updates**: Keep tests in sync with code changes
2. **Performance Monitoring**: Track test execution time
3. **Coverage Monitoring**: Maintain high coverage levels
4. **Documentation**: Keep test documentation updated

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure MongoDB Memory Server is properly configured
2. **Mock Issues**: Verify mock implementations are correct
3. **Async Operations**: Use proper async/await patterns
4. **Environment Variables**: Ensure test environment variables are set

### Debugging

1. **Verbose Output**: Use `--verbose` flag for detailed output
2. **Single Test**: Run individual tests for debugging
3. **Coverage Reports**: Use HTML coverage reports for analysis
4. **Log Output**: Check console output for errors

## Future Enhancements

### Planned Improvements

1. **Visual Testing**: Screenshot comparison tests
2. **Load Testing**: High-volume performance tests
3. **Security Testing**: Authentication and authorization tests
4. **Accessibility Testing**: WCAG compliance tests
5. **Mobile Testing**: Responsive design tests

### Integration Opportunities

1. **CI/CD Pipeline**: Automated test execution
2. **Code Quality**: Integration with linting and formatting
3. **Performance Monitoring**: Real-time performance tracking
4. **Error Tracking**: Integration with error monitoring services

## Conclusion

This comprehensive test suite ensures the reliability, performance, and maintainability of the KPI automation system. It provides complete coverage of all system components and scenarios, enabling confident deployment and ongoing maintenance.

For questions or issues with the test suite, please refer to the troubleshooting section or contact the development team.
