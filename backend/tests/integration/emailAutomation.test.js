// Integration tests for email automation

const request = require('supertest');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, createTestToken, makeAuthenticatedRequest, assertEmailLog, cleanupTestData, mockEmailService } = require('../utils/testHelpers');

// Import models
const User = require('../../models/User');
const KPIScore = require('../../models/KPIScore');
const EmailLog = require('../../models/EmailLog');
const emailService = require('../../services/emailService');

describe('Email Automation Integration Tests', () => {
  let app;
  let testUser;
  let authToken;
  let models;
  let mockEmail;

  beforeAll(async () => {
    await setupTestDB();
    app = require('../../server');
    models = { User, KPIScore, EmailLog };
    
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      role: 'field_executive',
      department: 'Sales',
      phone: '+1234567890',
      isActive: true
    });
    await testUser.save();
    
    authToken = createTestToken(testUser);
    
    // Mock email service
    mockEmail = mockEmailService();
  });

  afterAll(async () => {
    await cleanupTestData(models);
    await teardownTestDB();
  });

  beforeEach(async () => {
    await Promise.all([
      KPIScore.deleteMany({}),
      EmailLog.deleteMany({})
    ]);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('KPI Trigger Email Automation', () => {
    test('should send KPI notification email for new score', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
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
        automationStatus: 'pending'
      });
      await kpiScore.save();

      // Mock email service methods
      emailService.sendKPITriggerEmails = mockEmail.mockSendEmail;
      emailService.logEmailActivity = mockEmail.mockLogEmail;

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiScore.toObject(),
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify email was sent
      expect(mockEmail.mockSendEmail).toHaveBeenCalled();
      expect(mockEmail.mockLogEmail).toHaveBeenCalled();

      // Verify email log was created
      const emailLogs = await EmailLog.find({ recipientEmail: testUser.email });
      expect(emailLogs).toHaveLength(1);
      expect(emailLogs[0].templateType).toBe('kpi_notification');
      expect(emailLogs[0].status).toBe('sent');
    });

    test('should send training assignment email', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 45,
        rating: 'below average',
        tat: 60,
        majorNegativity: 5,
        quality: 70,
        neighborCheck: 65,
        generalNegativity: 35,
        appUsage: 80,
        insufficiency: 3,
        automationStatus: 'pending'
      });
      await kpiScore.save();

      // Mock email service
      emailService.sendTrainingAssignmentEmail = mockEmail.mockSendEmail;
      emailService.logEmailActivity = mockEmail.mockLogEmail;

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiScore.toObject(),
        authToken
      );

      expect(response.status).toBe(201);

      // Verify training assignment email was sent
      const emailLogs = await EmailLog.find({ 
        recipientEmail: testUser.email,
        templateType: 'training_assignment'
      });
      expect(emailLogs.length).toBeGreaterThan(0);
    });

    test('should send audit notification email', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 45,
        rating: 'below average',
        tat: 60,
        majorNegativity: 5,
        quality: 70,
        neighborCheck: 65,
        generalNegativity: 35,
        appUsage: 80,
        insufficiency: 3,
        automationStatus: 'pending'
      });
      await kpiScore.save();

      // Mock email service
      emailService.sendAuditNotificationEmail = mockEmail.mockSendEmail;
      emailService.logEmailActivity = mockEmail.mockLogEmail;

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiScore.toObject(),
        authToken
      );

      expect(response.status).toBe(201);

      // Verify audit notification email was sent
      const emailLogs = await EmailLog.find({ 
        recipientEmail: testUser.email,
        templateType: 'audit_notification'
      });
      expect(emailLogs.length).toBeGreaterThan(0);
    });

    test('should send warning letter email for poor performance', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 25,
        rating: 'poor',
        tat: 40,
        majorNegativity: 8,
        quality: 50,
        neighborCheck: 45,
        generalNegativity: 60,
        appUsage: 60,
        insufficiency: 5,
        automationStatus: 'pending'
      });
      await kpiScore.save();

      // Mock email service
      emailService.sendWarningLetterEmail = mockEmail.mockSendEmail;
      emailService.logEmailActivity = mockEmail.mockLogEmail;

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiScore.toObject(),
        authToken
      );

      expect(response.status).toBe(201);

      // Verify warning letter email was sent
      const emailLogs = await EmailLog.find({ 
        recipientEmail: testUser.email,
        templateType: 'warning_letter'
      });
      expect(emailLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Email Log Management', () => {
    test('should get all email logs', async () => {
      const emailLogs = [
        {
          recipientEmail: testUser.email,
          recipientRole: 'field_executive',
          templateType: 'kpi_notification',
          subject: 'KPI Score Notification',
          sentAt: new Date(),
          status: 'sent',
          kpiTriggerId: new mongoose.Types.ObjectId(),
          errorMessage: null
        },
        {
          recipientEmail: testUser.email,
          recipientRole: 'field_executive',
          templateType: 'training_assignment',
          subject: 'Training Assignment',
          sentAt: new Date(),
          status: 'failed',
          kpiTriggerId: new mongoose.Types.ObjectId(),
          errorMessage: 'SMTP connection failed'
        }
      ];
      await EmailLog.insertMany(emailLogs);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/email-logs',
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test('should get email log by ID', async () => {
      const emailLog = new EmailLog({
        recipientEmail: testUser.email,
        recipientRole: 'field_executive',
        templateType: 'kpi_notification',
        subject: 'KPI Score Notification',
        sentAt: new Date(),
        status: 'sent',
        kpiTriggerId: new mongoose.Types.ObjectId(),
        errorMessage: null
      });
      await emailLog.save();

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/email-logs/${emailLog._id}`,
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(emailLog._id.toString());
    });

    test('should resend failed email', async () => {
      const emailLog = new EmailLog({
        recipientEmail: testUser.email,
        recipientRole: 'field_executive',
        templateType: 'kpi_notification',
        subject: 'KPI Score Notification',
        sentAt: new Date(),
        status: 'failed',
        kpiTriggerId: new mongoose.Types.ObjectId(),
        errorMessage: 'SMTP connection failed'
      });
      await emailLog.save();

      // Mock successful resend
      emailService.sendKPITriggerEmails = mockEmail.mockSendEmail;

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/email-logs/${emailLog._id}/resend`,
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockEmail.mockSendEmail).toHaveBeenCalled();
    });

    test('should retry all failed emails', async () => {
      const failedEmails = [
        {
          recipientEmail: testUser.email,
          recipientRole: 'field_executive',
          templateType: 'kpi_notification',
          subject: 'KPI Score Notification',
          sentAt: new Date(),
          status: 'failed',
          kpiTriggerId: new mongoose.Types.ObjectId(),
          errorMessage: 'SMTP connection failed'
        },
        {
          recipientEmail: testUser.email,
          recipientRole: 'field_executive',
          templateType: 'training_assignment',
          subject: 'Training Assignment',
          sentAt: new Date(),
          status: 'failed',
          kpiTriggerId: new mongoose.Types.ObjectId(),
          errorMessage: 'Invalid recipient'
        }
      ];
      await EmailLog.insertMany(failedEmails);

      // Mock successful retry
      emailService.sendKPITriggerEmails = mockEmail.mockSendEmail;
      emailService.sendTrainingAssignmentEmail = mockEmail.mockSendEmail;

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/email-logs/retry-failed',
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.retriedCount).toBe(2);
    });
  });

  describe('Email Scheduling', () => {
    test('should schedule email for future delivery', async () => {
      const scheduleData = {
        templateId: '507f1f77bcf86cd799439999',
        recipientGroupId: '507f1f77bcf86cd799439998',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        subject: 'Scheduled KPI Notification',
        content: 'This is a scheduled email'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/email-logs/schedule',
        scheduleData,
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduledFor).toBeDefined();
    });

    test('should cancel scheduled email', async () => {
      const emailLog = new EmailLog({
        recipientEmail: testUser.email,
        recipientRole: 'field_executive',
        templateType: 'kpi_notification',
        subject: 'Scheduled KPI Notification',
        sentAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'pending',
        kpiTriggerId: new mongoose.Types.ObjectId(),
        errorMessage: null
      });
      await emailLog.save();

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/email-logs/${emailLog._id}/cancel`,
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify email was cancelled
      const cancelledEmail = await EmailLog.findById(emailLog._id);
      expect(cancelledEmail.status).toBe('cancelled');
    });
  });

  describe('Email Statistics', () => {
    test('should get email statistics', async () => {
      const emailLogs = [
        {
          recipientEmail: testUser.email,
          recipientRole: 'field_executive',
          templateType: 'kpi_notification',
          subject: 'KPI Score Notification',
          sentAt: new Date(),
          status: 'sent',
          kpiTriggerId: new mongoose.Types.ObjectId(),
          errorMessage: null
        },
        {
          recipientEmail: testUser.email,
          recipientRole: 'field_executive',
          templateType: 'training_assignment',
          subject: 'Training Assignment',
          sentAt: new Date(),
          status: 'sent',
          kpiTriggerId: new mongoose.Types.ObjectId(),
          errorMessage: null
        },
        {
          recipientEmail: testUser.email,
          recipientRole: 'field_executive',
          templateType: 'audit_notification',
          subject: 'Audit Notification',
          sentAt: new Date(),
          status: 'failed',
          kpiTriggerId: new mongoose.Types.ObjectId(),
          errorMessage: 'SMTP connection failed'
        }
      ];
      await EmailLog.insertMany(emailLogs);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/email-stats',
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.sent).toBe(2);
      expect(response.body.data.failed).toBe(1);
      expect(response.body.data.successRate).toBe(66.67);
    });

    test('should get delivery statistics', async () => {
      const emailLogs = [
        {
          recipientEmail: testUser.email,
          recipientRole: 'field_executive',
          templateType: 'kpi_notification',
          subject: 'KPI Score Notification',
          sentAt: new Date(),
          status: 'sent',
          kpiTriggerId: new mongoose.Types.ObjectId(),
          errorMessage: null
        }
      ];
      await EmailLog.insertMany(emailLogs);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/email-stats/delivery',
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle email sending failures gracefully', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
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
        automationStatus: 'pending'
      });
      await kpiScore.save();

      // Mock email service to fail
      emailService.sendKPITriggerEmails = jest.fn().mockRejectedValue(new Error('SMTP connection failed'));

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiScore.toObject(),
        authToken
      );

      // Should still create KPI score but with failed automation status
      expect(response.status).toBe(201);
      expect(response.body.data.automationStatus).toBe('failed');

      // Verify failed email log was created
      const emailLogs = await EmailLog.find({ recipientEmail: testUser.email });
      expect(emailLogs).toHaveLength(1);
      expect(emailLogs[0].status).toBe('failed');
      expect(emailLogs[0].errorMessage).toContain('SMTP connection failed');
    });

    test('should handle invalid email template', async () => {
      const emailLog = new EmailLog({
        recipientEmail: testUser.email,
        recipientRole: 'field_executive',
        templateType: 'invalid_template',
        subject: 'Invalid Template',
        sentAt: new Date(),
        status: 'failed',
        kpiTriggerId: new mongoose.Types.ObjectId(),
        errorMessage: 'Template not found'
      });
      await emailLog.save();

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/email-logs/${emailLog._id}`,
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.data.templateType).toBe('invalid_template');
      expect(response.body.data.errorMessage).toContain('Template not found');
    });

    test('should handle invalid recipient email', async () => {
      const emailLog = new EmailLog({
        recipientEmail: 'invalid-email',
        recipientRole: 'field_executive',
        templateType: 'kpi_notification',
        subject: 'KPI Score Notification',
        sentAt: new Date(),
        status: 'failed',
        kpiTriggerId: new mongoose.Types.ObjectId(),
        errorMessage: 'Invalid email address'
      });
      await emailLog.save();

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/email-logs/${emailLog._id}`,
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.data.recipientEmail).toBe('invalid-email');
      expect(response.body.data.errorMessage).toContain('Invalid email address');
    });
  });

  describe('Performance Tests', () => {
    test('should handle bulk email sending within performance threshold', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 25, // Poor score triggers multiple emails
        rating: 'poor',
        tat: 40,
        majorNegativity: 8,
        quality: 50,
        neighborCheck: 45,
        generalNegativity: 60,
        appUsage: 60,
        insufficiency: 5,
        automationStatus: 'pending'
      });
      await kpiScore.save();

      const startTime = Date.now();
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiScore.toObject(),
        authToken
      );
      const endTime = Date.now();

      expect(response.status).toBe(201);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle concurrent email operations', async () => {
      const emailLogs = Array.from({ length: 5 }, (_, i) => ({
        recipientEmail: `test${i}@example.com`,
        recipientRole: 'field_executive',
        templateType: 'kpi_notification',
        subject: `KPI Score Notification ${i}`,
        sentAt: new Date(),
        status: 'failed',
        kpiTriggerId: new mongoose.Types.ObjectId(),
        errorMessage: 'SMTP connection failed'
      }));
      await EmailLog.insertMany(emailLogs);

      const startTime = Date.now();
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/email-logs/retry-failed',
        null,
        authToken
      );
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(response.body.data.retriedCount).toBe(5);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });
});
