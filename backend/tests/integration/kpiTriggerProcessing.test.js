// Integration tests for KPI trigger processing

const request = require('supertest');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, seedTestData, createTestToken, makeAuthenticatedRequest, assertKPIProcessing, generateKPIScore, cleanupTestData } = require('../utils/testHelpers');
const { testKPIScenarios } = require('../fixtures/sampleData');

// Import models and services
const User = require('../../models/User');
const KPIScore = require('../../models/KPIScore');
const TrainingAssignment = require('../../models/TrainingAssignment');
const AuditSchedule = require('../../models/AuditSchedule');
const EmailLog = require('../../models/EmailLog');
const KPITriggerService = require('../../services/kpiTriggerService');

describe('KPI Trigger Processing Integration Tests', () => {
  let app;
  let testUser;
  let authToken;
  let models;

  beforeAll(async () => {
    // Setup test database
    await setupTestDB();
    
    // Import app after database setup
    app = require('../../server');
    
    // Setup models
    models = { User, KPIScore, TrainingAssignment, AuditSchedule, EmailLog };
    
    // Create test user
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
    
    // Create auth token
    authToken = createTestToken(testUser);
  });

  afterAll(async () => {
    await cleanupTestData(models);
    await teardownTestDB();
  });

  beforeEach(async () => {
    // Clean up data before each test
    await Promise.all([
      KPIScore.deleteMany({}),
      TrainingAssignment.deleteMany({}),
      AuditSchedule.deleteMany({}),
      EmailLog.deleteMany({})
    ]);
  });

  describe('KPI Score Processing', () => {
    test('should process excellent KPI score without triggers', async () => {
      const kpiData = {
        ...testKPIScenarios.excellent,
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

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.automationStatus).toBe('completed');

      // Verify no training assignments were created
      const trainingAssignments = await TrainingAssignment.find({ userId: testUser._id });
      expect(trainingAssignments).toHaveLength(0);

      // Verify no audits were scheduled
      const audits = await AuditSchedule.find({ userId: testUser._id });
      expect(audits).toHaveLength(0);

      // Verify KPI notification email was sent
      const emails = await EmailLog.find({ recipientEmail: testUser.email });
      expect(emails).toHaveLength(1);
      expect(emails[0].templateType).toBe('kpi_notification');
    });

    test('should process below average KPI score with all triggers', async () => {
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

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.automationStatus).toBe('completed');

      // Verify training assignments were created
      const trainingAssignments = await TrainingAssignment.find({ userId: testUser._id });
      expect(trainingAssignments).toHaveLength(3);
      
      const trainingTypes = trainingAssignments.map(ta => ta.trainingType);
      expect(trainingTypes).toContain('basic');
      expect(trainingTypes).toContain('negativity_handling');
      expect(trainingTypes).toContain('app_usage');

      // Verify audits were scheduled
      const audits = await AuditSchedule.find({ userId: testUser._id });
      expect(audits).toHaveLength(2);
      
      const auditTypes = audits.map(a => a.auditType);
      expect(auditTypes).toContain('audit_call');
      expect(auditTypes).toContain('cross_check');

      // Verify emails were sent
      const emails = await EmailLog.find({ recipientEmail: testUser.email });
      expect(emails.length).toBeGreaterThan(0);
    });

    test('should process poor KPI score with maximum triggers', async () => {
      const kpiData = {
        ...testKPIScenarios.poor,
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

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify all training assignments were created
      const trainingAssignments = await TrainingAssignment.find({ userId: testUser._id });
      expect(trainingAssignments).toHaveLength(4);
      
      const trainingTypes = trainingAssignments.map(ta => ta.trainingType);
      expect(trainingTypes).toContain('basic');
      expect(trainingTypes).toContain('negativity_handling');
      expect(trainingTypes).toContain('dos_donts');
      expect(trainingTypes).toContain('app_usage');

      // Verify all audits were scheduled
      const audits = await AuditSchedule.find({ userId: testUser._id });
      expect(audits).toHaveLength(3);
      
      const auditTypes = audits.map(a => a.auditType);
      expect(auditTypes).toContain('audit_call');
      expect(auditTypes).toContain('cross_check');
      expect(auditTypes).toContain('dummy_audit');
    });
  });

  describe('KPI Trigger Service Integration', () => {
    test('should handle KPI trigger processing errors gracefully', async () => {
      // Mock KPITriggerService to throw an error
      const originalProcessKPITriggers = KPITriggerService.processKPITriggers;
      KPITriggerService.processKPITriggers = jest.fn().mockRejectedValue(new Error('Processing failed'));

      const kpiData = generateKPIScore({
        userId: testUser._id,
        period: '2024-03'
      });

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
      KPITriggerService.processKPITriggers = originalProcessKPITriggers;
    });

    test('should retry failed KPI processing', async () => {
      // Create a KPI score with failed automation status
      const kpiScore = new KPIScore(generateKPIScore({
        userId: testUser._id,
        period: '2024-03',
        automationStatus: 'failed'
      }));
      await kpiScore.save();

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/kpi/${kpiScore._id}/reprocess`,
        {},
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.automationStatus).toBe('completed');
    });
  });

  describe('KPI Data Validation', () => {
    test('should reject invalid KPI data', async () => {
      const invalidKpiData = {
        userId: testUser._id,
        period: '2024-03',
        overallScore: 150, // Invalid score > 100
        tat: -10, // Invalid negative score
        majorNegativity: 'invalid', // Invalid type
        quality: 200 // Invalid score > 100
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

    test('should reject duplicate KPI score for same period', async () => {
      const kpiData = generateKPIScore({
        userId: testUser._id,
        period: '2024-03'
      });

      // Create first KPI score
      await makeAuthenticatedRequest(app, 'POST', '/api/kpi', kpiData, authToken);

      // Try to create duplicate
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiData,
        authToken
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('duplicate');
    });
  });

  describe('Performance Tests', () => {
    test('should process KPI score within performance threshold', async () => {
      const kpiData = generateKPIScore({
        userId: testUser._id,
        period: '2024-03'
      });

      const startTime = Date.now();
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiData,
        authToken
      );
      const endTime = Date.now();

      expect(response.status).toBe(201);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle concurrent KPI processing', async () => {
      const kpiData1 = generateKPIScore({
        userId: testUser._id,
        period: '2024-03'
      });

      const kpiData2 = generateKPIScore({
        userId: testUser._id,
        period: '2024-04'
      });

      // Process both KPI scores concurrently
      const [response1, response2] = await Promise.all([
        makeAuthenticatedRequest(app, 'POST', '/api/kpi', kpiData1, authToken),
        makeAuthenticatedRequest(app, 'POST', '/api/kpi', kpiData2, authToken)
      ]);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.data.period).toBe('2024-03');
      expect(response2.body.data.period).toBe('2024-04');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing user gracefully', async () => {
      const kpiData = generateKPIScore({
        userId: '507f1f77bcf86cd799439999', // Non-existent user
        period: '2024-03'
      });

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiData,
        authToken
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('user');
    });

    test('should handle invalid period format', async () => {
      const kpiData = generateKPIScore({
        userId: testUser._id,
        period: 'invalid-period'
      });

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/kpi',
        kpiData,
        authToken
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('period');
    });

    test('should handle boundary KPI scores', async () => {
      const boundaryScores = [
        { overallScore: 0, rating: 'poor' },
        { overallScore: 100, rating: 'excellent' },
        { overallScore: 55, rating: 'average' },
        { overallScore: 70, rating: 'good' }
      ];

      for (const score of boundaryScores) {
        const kpiData = generateKPIScore({
          userId: testUser._id,
          period: `2024-0${boundaryScores.indexOf(score) + 1}`,
          ...score
        });

        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          '/api/kpi',
          kpiData,
          authToken
        );

        expect(response.status).toBe(201);
        expect(response.body.data.overallScore).toBe(score.overallScore);
        expect(response.body.data.rating).toBe(score.rating);
      }
    });
  });
});
