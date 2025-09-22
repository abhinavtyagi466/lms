// Test setup file for backend integration tests

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.EMAIL_HOST = 'localhost';
  process.env.EMAIL_PORT = '587';
  process.env.EMAIL_USER = 'test@example.com';
  process.env.EMAIL_PASS = 'test-password';
});

afterAll(async () => {
  // Cleanup after all tests
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Global test utilities
global.testUtils = {
  // Helper to create test user
  createTestUser: async (userData = {}) => {
    const User = require('../models/User');
    const defaultUser = {
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      role: 'field_executive',
      department: 'Sales',
      phone: '+1234567890',
      isActive: true,
      ...userData
    };
    return await User.create(defaultUser);
  },

  // Helper to create test KPI score
  createTestKPIScore: async (kpiData = {}) => {
    const KPIScore = require('../models/KPIScore');
    const defaultKPI = {
      userId: new mongoose.Types.ObjectId(),
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
      ...kpiData
    };
    return await KPIScore.create(defaultKPI);
  },

  // Helper to create test training assignment
  createTestTrainingAssignment: async (trainingData = {}) => {
    const TrainingAssignment = require('../models/TrainingAssignment');
    const defaultTraining = {
      userId: new mongoose.Types.ObjectId(),
      trainingType: 'basic',
      assignedBy: 'kpi_trigger',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'assigned',
      kpiTriggerId: new mongoose.Types.ObjectId(),
      ...trainingData
    };
    return await TrainingAssignment.create(defaultTraining);
  },

  // Helper to create test audit schedule
  createTestAuditSchedule: async (auditData = {}) => {
    const AuditSchedule = require('../models/AuditSchedule');
    const defaultAudit = {
      userId: new mongoose.Types.ObjectId(),
      auditType: 'audit_call',
      scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'scheduled',
      kpiTriggerId: new mongoose.Types.ObjectId(),
      ...auditData
    };
    return await AuditSchedule.create(defaultAudit);
  },

  // Helper to create test email log
  createTestEmailLog: async (emailData = {}) => {
    const EmailLog = require('../models/EmailLog');
    const defaultEmail = {
      recipientEmail: 'test@example.com',
      recipientRole: 'field_executive',
      templateType: 'kpi_notification',
      subject: 'Test Email',
      sentAt: new Date(),
      status: 'sent',
      kpiTriggerId: new mongoose.Types.ObjectId(),
      ...emailData
    };
    return await EmailLog.create(defaultEmail);
  },

  // Helper to wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate random ObjectId
  generateObjectId: () => new mongoose.Types.ObjectId(),

  // Helper to generate random date
  generateDate: (daysFromNow = 0) => new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000)
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
