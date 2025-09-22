#!/bin/bash

# Comprehensive Test Runner for E-Learning Platform KPI Automation System

echo "🚀 Starting Comprehensive Test Suite for KPI Automation System"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run tests with error handling
run_tests() {
    local test_type=$1
    local test_command=$2
    local test_description=$3
    
    print_status "Running $test_description..."
    
    if eval "$test_command"; then
        print_success "$test_description completed successfully"
        return 0
    else
        print_error "$test_description failed"
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Create test results directory
mkdir -p test-results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test-results/test_run_$TIMESTAMP"
mkdir -p "$RESULTS_DIR"

print_status "Test results will be saved to: $RESULTS_DIR"

# Initialize test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Backend Tests
print_status "Starting Backend Integration Tests..."
echo "============================================="

# Install backend test dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Run backend integration tests
run_tests "backend" "cd backend && npm test -- --testPathPattern=integration --coverage --coverageReporters=text --coverageReporters=html" "Backend Integration Tests"
if [ $? -eq 0 ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    # Copy coverage reports
    if [ -d "backend/coverage" ]; then
        cp -r backend/coverage "$RESULTS_DIR/backend-coverage"
    fi
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Frontend Tests
print_status "Starting Frontend Integration Tests..."
echo "=============================================="

# Install frontend test dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Run frontend integration tests
run_tests "frontend" "cd frontend && npm test -- --testNamePattern=Integration --coverage" "Frontend Integration Tests"
if [ $? -eq 0 ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    # Copy coverage reports
    if [ -d "frontend/coverage" ]; then
        cp -r frontend/coverage "$RESULTS_DIR/frontend-coverage"
    fi
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Performance Tests
print_status "Starting Performance Tests..."
echo "===================================="

# Run performance tests
run_tests "performance" "cd backend && npm test -- --testPathPattern=performance" "Performance Tests"
if [ $? -eq 0 ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Error Handling Tests
print_status "Starting Error Handling Tests..."
echo "======================================="

# Run error handling tests
run_tests "error" "cd backend && npm test -- --testPathPattern=error" "Error Handling Tests"
if [ $? -eq 0 ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# End-to-End Tests
print_status "Starting End-to-End Tests..."
echo "==================================="

# Run end-to-end tests
run_tests "e2e" "cd backend && npm test -- --testPathPattern=endToEnd" "End-to-End Tests"
if [ $? -eq 0 ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Generate Test Report
print_status "Generating Test Report..."
echo "=============================="

cat > "$RESULTS_DIR/test-report.md" << EOF
# KPI Automation System Test Report

**Test Run Date:** $(date)
**Test Run ID:** $TIMESTAMP

## Test Summary

- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS
- **Failed:** $FAILED_TESTS
- **Success Rate:** $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%

## Test Categories

### Backend Integration Tests
- KPI Trigger Processing Tests
- Training Assignment Automation Tests
- Audit Scheduling Automation Tests
- Email Automation Tests
- End-to-End KPI Flow Tests

### Frontend Integration Tests
- KPI Entry Form Tests
- Training Dashboard Tests
- Email Center Tests
- Audit Scheduler Tests
- User Dashboard Tests

### Performance Tests
- KPI Processing Performance
- Email Delivery Performance
- Database Query Performance
- Frontend Rendering Performance

### Error Handling Tests
- Invalid KPI Data Handling
- Email Delivery Failures
- Database Connection Failures
- API Timeout Handling

## Coverage Reports

- Backend Coverage: backend-coverage/
- Frontend Coverage: frontend-coverage/

## Test Data

All tests use comprehensive test fixtures including:
- Sample KPI scores for different scenarios
- Sample user data
- Sample training assignments
- Sample audit schedules
- Sample email logs

## Recommendations

EOF

if [ $FAILED_TESTS -gt 0 ]; then
    echo "- **Action Required:** $FAILED_TESTS test(s) failed. Please review the test results and fix the issues." >> "$RESULTS_DIR/test-report.md"
else
    echo "- **All tests passed successfully!** The KPI automation system is ready for deployment." >> "$RESULTS_DIR/test-report.md"
fi

# Final Summary
echo ""
echo "=============================================================="
echo "🏁 Test Suite Complete"
echo "=============================================================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%"
echo ""
echo "Test results saved to: $RESULTS_DIR"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 All tests passed! The KPI automation system is working correctly."
    exit 0
else
    print_error "❌ $FAILED_TESTS test(s) failed. Please review the test results."
    exit 1
fi
