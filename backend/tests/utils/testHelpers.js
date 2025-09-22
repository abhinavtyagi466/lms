// Test utilities and helpers for KPI automation system tests

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Test database setup
let mongoServer;

const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  return mongoUri;
};

const teardownTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

// Test data seeding
const seedTestData = async (models, fixtures) => {
  const { User, KPIScore, TrainingAssignment, AuditSchedule, EmailLog, LifecycleEvent, Notification } = models;
  const { 
    sampleUsers, 
    sampleKPIScores, 
    sampleTrainingAssignments, 
    sampleAuditSchedules, 
    sampleEmailLogs, 
    sampleLifecycleEvents, 
    sampleNotifications 
  } = fixtures;

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    KPIScore.deleteMany({}),
    TrainingAssignment.deleteMany({}),
    AuditSchedule.deleteMany({}),
    EmailLog.deleteMany({}),
    LifecycleEvent.deleteMany({}),
    Notification.deleteMany({})
  ]);

  // Insert test data
  await Promise.all([
    User.insertMany(sampleUsers),
    KPIScore.insertMany(sampleKPIScores),
    TrainingAssignment.insertMany(sampleTrainingAssignments),
    AuditSchedule.insertMany(sampleAuditSchedules),
    EmailLog.insertMany(sampleEmailLogs),
    LifecycleEvent.insertMany(sampleLifecycleEvents),
    Notification.insertMany(sampleNotifications)
  ]);
};

// Authentication helpers
const createTestToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

const createTestHeaders = (token) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// API test helpers
const makeAuthenticatedRequest = async (app, method, url, data = null, token = null) => {
  const request = require('supertest')(app);
  let req = request[method.toLowerCase()](url);
  
  if (token) {
    req = req.set('Authorization', `Bearer ${token}`);
  }
  
  if (data) {
    req = req.send(data);
  }
  
  return req;
};

// Assertion helpers
const assertKPIProcessing = (kpiScore, expectedTriggers) => {
  // Check if KPI score has been processed
  expect(kpiScore.automationStatus).toBe('completed');
  expect(kpiScore.processedAt).toBeDefined();
  
  // Check if training assignments were created
  if (expectedTriggers.trainingAssignments.length > 0) {
    expect(kpiScore.trainingAssignments).toHaveLength(expectedTriggers.trainingAssignments.length);
  }
  
  // Check if audits were scheduled
  if (expectedTriggers.audits.length > 0) {
    expect(kpiScore.auditSchedules).toHaveLength(expectedTriggers.audits.length);
  }
  
  // Check if emails were sent
  if (expectedTriggers.emails.length > 0) {
    expect(kpiScore.emailLogs).toHaveLength(expectedTriggers.emails.length);
  }
};

const assertTrainingAssignment = (assignment, expectedType, expectedStatus = 'assigned') => {
  expect(assignment.trainingType).toBe(expectedType);
  expect(assignment.status).toBe(expectedStatus);
  expect(assignment.assignedBy).toBe('kpi_trigger');
  expect(assignment.kpiTriggerId).toBeDefined();
  expect(assignment.dueDate).toBeDefined();
};

const assertAuditSchedule = (audit, expectedType, expectedStatus = 'scheduled') => {
  expect(audit.auditType).toBe(expectedType);
  expect(audit.status).toBe(expectedStatus);
  expect(audit.kpiTriggerId).toBeDefined();
  expect(audit.scheduledDate).toBeDefined();
};

const assertEmailLog = (emailLog, expectedTemplateType, expectedStatus = 'sent') => {
  expect(emailLog.templateType).toBe(expectedTemplateType);
  expect(emailLog.status).toBe(expectedStatus);
  expect(emailLog.kpiTriggerId).toBeDefined();
  expect(emailLog.sentAt).toBeDefined();
};

// Performance testing helpers
const measureExecutionTime = async (fn) => {
  const start = Date.now();
  await fn();
  const end = Date.now();
  return end - start;
};

const assertPerformanceThreshold = (executionTime, thresholdMs) => {
  expect(executionTime).toBeLessThan(thresholdMs);
};

// Error testing helpers
const expectValidationError = (response, field) => {
  expect(response.status).toBe(400);
  expect(response.body.error).toContain(field);
};

const expectAuthenticationError = (response) => {
  expect(response.status).toBe(401);
  expect(response.body.error).toContain('authentication');
};

const expectNotFoundError = (response) => {
  expect(response.status).toBe(404);
  expect(response.body.error).toContain('not found');
};

// Mock helpers
const mockEmailService = () => {
  const mockSendEmail = jest.fn().mockResolvedValue({ success: true, messageId: 'test-message-id' });
  const mockLogEmail = jest.fn().mockResolvedValue({ success: true });
  
  return {
    sendKPITriggerEmails: mockSendEmail,
    sendTrainingAssignmentEmail: mockSendEmail,
    sendAuditNotificationEmail: mockSendEmail,
    sendWarningLetterEmail: mockSendEmail,
    logEmailActivity: mockLogEmail,
    mockSendEmail,
    mockLogEmail
  };
};

const mockKPITriggerService = () => {
  const mockProcessKPITriggers = jest.fn().mockResolvedValue({
    success: true,
    trainingAssignments: [],
    audits: [],
    emails: []
  });
  
  return {
    processKPITriggers: mockProcessKPITriggers,
    mockProcessKPITriggers
  };
};

// Database query helpers
const findUserByEmail = async (User, email) => {
  return await User.findOne({ email });
};

const findKPIScoreByUserAndPeriod = async (KPIScore, userId, period) => {
  return await KPIScore.findOne({ userId, period });
};

const findTrainingAssignmentsByUser = async (TrainingAssignment, userId) => {
  return await TrainingAssignment.find({ userId });
};

const findAuditSchedulesByUser = async (AuditSchedule, userId) => {
  return await AuditSchedule.find({ userId });
};

const findEmailLogsByUser = async (EmailLog, userId) => {
  return await EmailLog.find({ 
    recipientEmail: { $regex: userId, $options: 'i' } 
  });
};

// Test data generators
const generateKPIScore = (overrides = {}) => {
  return {
    userId: '507f1f77bcf86cd799439011',
    period: '2024-03',
    overallScore: 75,
    rating: 'good',
    tat: 85,
    majorNegativity: 1,
    quality: 90,
    neighborCheck: 80,
    generalNegativity: 15,
    appUsage: 95,
    insufficiency: 1,
    automationStatus: 'pending',
    processedAt: null,
    ...overrides
  };
};

const generateTrainingAssignment = (overrides = {}) => {
  return {
    userId: '507f1f77bcf86cd799439011',
    trainingType: 'basic',
    assignedBy: 'kpi_trigger',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'assigned',
    kpiTriggerId: '507f1f77bcf86cd799439022',
    completionDate: null,
    score: null,
    ...overrides
  };
};

const generateAuditSchedule = (overrides = {}) => {
  return {
    userId: '507f1f77bcf86cd799439011',
    auditType: 'audit_call',
    scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    status: 'scheduled',
    kpiTriggerId: '507f1f77bcf86cd799439022',
    completedDate: null,
    findings: null,
    ...overrides
  };
};

// Cleanup helpers
const cleanupTestData = async (models) => {
  const { User, KPIScore, TrainingAssignment, AuditSchedule, EmailLog, LifecycleEvent, Notification } = models;
  
  await Promise.all([
    User.deleteMany({}),
    KPIScore.deleteMany({}),
    TrainingAssignment.deleteMany({}),
    AuditSchedule.deleteMany({}),
    EmailLog.deleteMany({}),
    LifecycleEvent.deleteMany({}),
    Notification.deleteMany({})
  ]);
};

module.exports = {
  setupTestDB,
  teardownTestDB,
  seedTestData,
  createTestToken,
  createTestHeaders,
  makeAuthenticatedRequest,
  assertKPIProcessing,
  assertTrainingAssignment,
  assertAuditSchedule,
  assertEmailLog,
  measureExecutionTime,
  assertPerformanceThreshold,
  expectValidationError,
  expectAuthenticationError,
  expectNotFoundError,
  mockEmailService,
  mockKPITriggerService,
  findUserByEmail,
  findKPIScoreByUserAndPeriod,
  findTrainingAssignmentsByUser,
  findAuditSchedulesByUser,
  findEmailLogsByUser,
  generateKPIScore,
  generateTrainingAssignment,
  generateAuditSchedule,
  cleanupTestData
};
