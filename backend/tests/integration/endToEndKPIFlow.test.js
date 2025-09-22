// End-to-end integration tests for complete KPI automation flow

const request = require('supertest');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, createTestToken, makeAuthenticatedRequest, cleanupTestData, seedTestData } = require('../utils/testHelpers');
const { testKPIScenarios } = require('../fixtures/sampleData');

// Import models
const User = require('../../models/User');
const KPIScore = require('../../models/KPIScore');
const TrainingAssignment = require('../../models/TrainingAssignment');
const AuditSchedule = require('../../models/AuditSchedule');
const EmailLog = require('../../models/EmailLog');
const LifecycleEvent = require('../../models/LifecycleEvent');

describe('End-to-End KPI Automation Flow Tests', () => {
  let app;
  let testUser;
  let authToken;
  let models;
  let fixtures;

  beforeAll(async () => {
    await setupTestDB();
    app = require('../../server');
    models = { User, KPIScore, TrainingAssignment, AuditSchedule, EmailLog, LifecycleEvent };
    fixtures = require('../fixtures/sampleData');
    
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
  });

  afterAll(async () => {
    await cleanupTestData(models);
    await teardownTestDB();
  });

  beforeEach(async () => {
    await Promise.all([
      KPIScore.deleteMany({}),
      TrainingAssignment.deleteMany({}),
      AuditSchedule.deleteMany({}),
      EmailLog.deleteMany({}),
      LifecycleEvent.deleteMany({})
    ]);
  });

  describe('Complete KPI Entry to Training Assignment Flow', () => {
    test('should complete full flow from KPI entry to training assignment', async () => {
      // Step 1: Submit KPI score that triggers training assignments
      const kpiData = {
        ...testKPIScenarios.belowAverage,
        userId: testUser._id,
        period: '2024-03'
      };

      const kpiResponse = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiData,
        authToken
      );

      expect(kpiResponse.status).toBe(201);
      expect(kpiResponse.body.success).toBe(true);
      expect(kpiResponse.body.data.automationStatus).toBe('completed');

      const kpiScoreId = kpiResponse.body.data._id;

      // Step 2: Verify training assignments were created
      const trainingResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/training-assignments/user/${testUser._id}`,
        null,
        authToken
      );

      expect(trainingResponse.status).toBe(200);
      expect(trainingResponse.body.data).toHaveLength(3);

      const trainingTypes = trainingResponse.body.data.map(ta => ta.trainingType);
      expect(trainingTypes).toContain('basic');
      expect(trainingTypes).toContain('negativity_handling');
      expect(trainingTypes).toContain('app_usage');

      // Step 3: Complete a training assignment
      const basicTraining = trainingResponse.body.data.find(ta => ta.trainingType === 'basic');
      const completionData = {
        score: 85,
        completionDate: new Date()
      };

      const completionResponse = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/training-assignments/${basicTraining._id}/complete`,
        completionData,
        authToken
      );

      expect(completionResponse.status).toBe(200);
      expect(completionResponse.body.data.status).toBe('completed');
      expect(completionResponse.body.data.score).toBe(85);

      // Step 4: Verify lifecycle event was created
      const lifecycleEvents = await LifecycleEvent.find({ userId: testUser._id });
      expect(lifecycleEvents.length).toBeGreaterThan(0);

      const trainingEvent = lifecycleEvents.find(e => e.type === 'training_completed');
      expect(trainingEvent).toBeDefined();
      expect(trainingEvent.metadata.trainingAssignmentId).toBe(basicTraining._id);
    });

    test('should handle training assignment completion with score tracking', async () => {
      // Create KPI score and training assignment
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        ...testKPIScenarios.belowAverage,
        automationStatus: 'completed'
      });
      await kpiScore.save();

      const trainingAssignment = new TrainingAssignment({
        userId: testUser._id,
        trainingType: 'basic',
        assignedBy: 'kpi_trigger',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'assigned',
        kpiTriggerId: kpiScore._id
      });
      await trainingAssignment.save();

      // Complete training with high score
      const completionData = {
        score: 95,
        completionDate: new Date()
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/training-assignments/${trainingAssignment._id}/complete`,
        completionData,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.score).toBe(95);

      // Verify lifecycle event with score
      const lifecycleEvent = await LifecycleEvent.findOne({
        userId: testUser._id,
        type: 'training_completed'
      });
      expect(lifecycleEvent).toBeDefined();
      expect(lifecycleEvent.metadata.score).toBe(95);
    });
  });

  describe('Complete KPI Entry to Audit Scheduling Flow', () => {
    test('should complete full flow from KPI entry to audit scheduling', async () => {
      // Step 1: Submit KPI score that triggers audit scheduling
      const kpiData = {
        ...testKPIScenarios.belowAverage,
        userId: testUser._id,
        period: '2024-03'
      };

      const kpiResponse = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiData,
        authToken
      );

      expect(kpiResponse.status).toBe(201);
      expect(kpiResponse.body.data.automationStatus).toBe('completed');

      // Step 2: Verify audit schedules were created
      const auditResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/audit-scheduling/user/${testUser._id}`,
        null,
        authToken
      );

      expect(auditResponse.status).toBe(200);
      expect(auditResponse.body.data).toHaveLength(2);

      const auditTypes = auditResponse.body.data.map(a => a.auditType);
      expect(auditTypes).toContain('audit_call');
      expect(auditTypes).toContain('cross_check');

      // Step 3: Complete an audit
      const auditCall = auditResponse.body.data.find(a => a.auditType === 'audit_call');
      const completionData = {
        findings: 'Good performance overall, minor improvements needed in customer interaction',
        completionDate: new Date()
      };

      const completionResponse = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/audit-scheduling/${auditCall._id}/complete`,
        completionData,
        authToken
      );

      expect(completionResponse.status).toBe(200);
      expect(completionResponse.body.data.status).toBe('completed');
      expect(completionResponse.body.data.findings).toBe(completionData.findings);

      // Step 4: Verify lifecycle event was created
      const lifecycleEvents = await LifecycleEvent.find({ userId: testUser._id });
      const auditEvent = lifecycleEvents.find(e => e.type === 'audit_completed');
      expect(auditEvent).toBeDefined();
      expect(auditEvent.metadata.auditScheduleId).toBe(auditCall._id);
    });

    test('should handle audit completion with findings tracking', async () => {
      // Create KPI score and audit schedule
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        ...testKPIScenarios.belowAverage,
        automationStatus: 'completed'
      });
      await kpiScore.save();

      const auditSchedule = new AuditSchedule({
        userId: testUser._id,
        auditType: 'audit_call',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'scheduled',
        kpiTriggerId: kpiScore._id
      });
      await auditSchedule.save();

      // Complete audit with detailed findings
      const completionData = {
        findings: 'Excellent performance in customer service, needs improvement in documentation',
        completionDate: new Date()
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/audit-scheduling/${auditSchedule._id}/complete`,
        completionData,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.findings).toBe(completionData.findings);

      // Verify lifecycle event with findings
      const lifecycleEvent = await LifecycleEvent.findOne({
        userId: testUser._id,
        type: 'audit_completed'
      });
      expect(lifecycleEvent).toBeDefined();
      expect(lifecycleEvent.metadata.findings).toBe(completionData.findings);
    });
  });

  describe('Complete Email Notification Flow', () => {
    test('should complete full email notification flow', async () => {
      // Step 1: Submit KPI score that triggers multiple emails
      const kpiData = {
        ...testKPIScenarios.poor,
        userId: testUser._id,
        period: '2024-03'
      };

      const kpiResponse = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiData,
        authToken
      );

      expect(kpiResponse.status).toBe(201);
      expect(kpiResponse.body.data.automationStatus).toBe('completed');

      // Step 2: Verify emails were sent
      const emailResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/email-logs',
        null,
        authToken
      );

      expect(emailResponse.status).toBe(200);
      expect(emailResponse.body.data.length).toBeGreaterThan(0);

      const emailTypes = emailResponse.body.data.map(e => e.templateType);
      expect(emailTypes).toContain('kpi_notification');
      expect(emailTypes).toContain('training_assignment');
      expect(emailTypes).toContain('audit_notification');
      expect(emailTypes).toContain('warning_letter');

      // Step 3: Verify email statistics
      const statsResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/email-stats',
        null,
        authToken
      );

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.data.total).toBeGreaterThan(0);
      expect(statsResponse.body.data.successRate).toBeGreaterThan(0);
    });

    test('should handle email retry flow for failed emails', async () => {
      // Create failed email log
      const failedEmail = new EmailLog({
        recipientEmail: testUser.email,
        recipientRole: 'field_executive',
        templateType: 'kpi_notification',
        subject: 'KPI Score Notification',
        sentAt: new Date(),
        status: 'failed',
        kpiTriggerId: new mongoose.Types.ObjectId(),
        errorMessage: 'SMTP connection failed'
      });
      await failedEmail.save();

      // Retry failed email
      const retryResponse = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/email-logs/${failedEmail._id}/resend`,
        null,
        authToken
      );

      expect(retryResponse.status).toBe(200);
      expect(retryResponse.body.success).toBe(true);

      // Verify email status was updated
      const updatedEmail = await EmailLog.findById(failedEmail._id);
      expect(updatedEmail.status).toBe('sent');
    });
  });

  describe('Complete Performance Improvement Flow', () => {
    test('should track performance improvement over time', async () => {
      // Step 1: Submit poor KPI score
      const poorKpiData = {
        ...testKPIScenarios.poor,
        userId: testUser._id,
        period: '2024-01'
      };

      const poorKpiResponse = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        poorKpiData,
        authToken
      );

      expect(poorKpiResponse.status).toBe(201);
      expect(poorKpiResponse.body.data.overallScore).toBe(25);

      // Step 2: Complete training assignments
      const trainingAssignments = await TrainingAssignment.find({ userId: testUser._id });
      expect(trainingAssignments).toHaveLength(4);

      for (const training of trainingAssignments) {
        const completionData = {
          score: 90,
          completionDate: new Date()
        };

        await makeAuthenticatedRequest(
          app,
          'PUT',
          `/api/training-assignments/${training._id}/complete`,
          completionData,
          authToken
        );
      }

      // Step 3: Submit improved KPI score
      const improvedKpiData = {
        ...testKPIScenarios.good,
        userId: testUser._id,
        period: '2024-02'
      };

      const improvedKpiResponse = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        improvedKpiData,
        authToken
      );

      expect(improvedKpiResponse.status).toBe(201);
      expect(improvedKpiResponse.body.data.overallScore).toBe(75);

      // Step 4: Verify performance improvement tracking
      const kpiHistoryResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/kpi/${testUser._id}/history`,
        null,
        authToken
      );

      expect(kpiHistoryResponse.status).toBe(200);
      expect(kpiHistoryResponse.body.data).toHaveLength(2);
      expect(kpiHistoryResponse.body.data[0].overallScore).toBe(75); // Latest first
      expect(kpiHistoryResponse.body.data[1].overallScore).toBe(25);
    });

    test('should handle multiple KPI periods with different triggers', async () => {
      const periods = [
        { period: '2024-01', scenario: testKPIScenarios.excellent },
        { period: '2024-02', scenario: testKPIScenarios.good },
        { period: '2024-03', scenario: testKPIScenarios.average },
        { period: '2024-04', scenario: testKPIScenarios.belowAverage },
        { period: '2024-05', scenario: testKPIScenarios.poor }
      ];

      for (const { period, scenario } of periods) {
        const kpiData = {
          ...scenario,
          userId: testUser._id,
          period
        };

        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          '/api/kpi',
          kpiData,
          authToken
        );

        expect(response.status).toBe(201);
        expect(response.body.data.period).toBe(period);
        expect(response.body.data.overallScore).toBe(scenario.overallScore);
      }

      // Verify all KPI scores were created
      const kpiHistoryResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/kpi/${testUser._id}/history`,
        null,
        authToken
      );

      expect(kpiHistoryResponse.status).toBe(200);
      expect(kpiHistoryResponse.body.data).toHaveLength(5);

      // Verify different triggers were applied based on scores
      const trainingAssignments = await TrainingAssignment.find({ userId: testUser._id });
      const auditSchedules = await AuditSchedule.find({ userId: testUser._id });
      const emailLogs = await EmailLog.find({ recipientEmail: testUser.email });

      expect(trainingAssignments.length).toBeGreaterThan(0);
      expect(auditSchedules.length).toBeGreaterThan(0);
      expect(emailLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should handle partial automation failures gracefully', async () => {
      // Mock partial failure scenario
      const originalProcessKPITriggers = require('../../services/kpiTriggerService').processKPITriggers;
      require('../../services/kpiTriggerService').processKPITriggers = jest.fn()
        .mockResolvedValueOnce({
          success: false,
          error: 'Partial automation failure',
          trainingAssignments: [],
          audits: [],
          emails: []
        });

      const kpiData = {
        ...testKPIScenarios.belowAverage,
        userId: testUser._id,
        period: '2024-03'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiData,
        authToken
      );

      // Should still create KPI score but with failed automation status
      expect(response.status).toBe(201);
      expect(response.body.data.automationStatus).toBe('failed');

      // Restore original function
      require('../../services/kpiTriggerService').processKPITriggers = originalProcessKPITriggers;
    });

    test('should handle database connection failures', async () => {
      // This test would require mocking database connection failures
      // For now, we'll test the error handling in the API responses
      const invalidKpiData = {
        userId: 'invalid-user-id',
        period: '2024-03',
        overallScore: 75
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        invalidKpiData,
        authToken
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle high volume KPI processing', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create multiple KPI scores concurrently
      for (let i = 0; i < 10; i++) {
        const kpiData = {
          ...testKPIScenarios.good,
          userId: testUser._id,
          period: `2024-0${i + 1}`
        };

        promises.push(
          makeAuthenticatedRequest(app, 'POST', '/api/kpi', kpiData, authToken)
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify performance
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify all KPI scores were created
      const kpiHistoryResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/kpi/${testUser._id}/history`,
        null,
        authToken
      );

      expect(kpiHistoryResponse.body.data).toHaveLength(10);
    });
  });
});
