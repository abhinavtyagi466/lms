// Integration tests for audit scheduling automation

const request = require('supertest');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, createTestToken, makeAuthenticatedRequest, assertAuditSchedule, generateAuditSchedule, cleanupTestData } = require('../utils/testHelpers');

// Import models
const User = require('../../models/User');
const KPIScore = require('../../models/KPIScore');
const AuditSchedule = require('../../models/AuditSchedule');

describe('Audit Scheduling Automation Integration Tests', () => {
  let app;
  let testUser;
  let authToken;
  let models;

  beforeAll(async () => {
    await setupTestDB();
    app = require('../../server');
    models = { User, KPIScore, AuditSchedule };
    
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
      AuditSchedule.deleteMany({})
    ]);
  });

  describe('Automatic Audit Scheduling', () => {
    test('should schedule audit call for low KPI score', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 45, // Below 70 triggers audit call
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

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/audit-scheduling/schedule-kpi-audits',
        { kpiScoreId: kpiScore._id },
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.auditSchedules).toHaveLength(2);

      // Verify audit schedules were created
      const audits = await AuditSchedule.find({ userId: testUser._id });
      expect(audits).toHaveLength(2);

      const auditTypes = audits.map(a => a.auditType);
      expect(auditTypes).toContain('audit_call');
      expect(auditTypes).toContain('cross_check');

      // Verify audit call details
      const auditCall = audits.find(a => a.auditType === 'audit_call');
      assertAuditSchedule(auditCall, 'audit_call', 'scheduled');
      expect(auditCall.kpiTriggerId.toString()).toBe(kpiScore._id.toString());
    });

    test('should schedule dummy audit for very low KPI score', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 25, // Below 50 triggers dummy audit
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

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/audit-scheduling/schedule-kpi-audits',
        { kpiScoreId: kpiScore._id },
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.data.auditSchedules).toHaveLength(3);

      const audits = await AuditSchedule.find({ userId: testUser._id });
      const auditTypes = audits.map(a => a.auditType);
      expect(auditTypes).toContain('audit_call');
      expect(auditTypes).toContain('cross_check');
      expect(auditTypes).toContain('dummy_audit');
    });

    test('should schedule cross-verification for high insufficiency', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 70,
        rating: 'good',
        tat: 85,
        majorNegativity: 1,
        quality: 90,
        neighborCheck: 80,
        generalNegativity: 15,
        appUsage: 95,
        insufficiency: 4, // > 2 triggers cross-verification
        automationStatus: 'pending'
      });
      await kpiScore.save();

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/audit-scheduling/schedule-kpi-audits',
        { kpiScoreId: kpiScore._id },
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.data.auditSchedules).toHaveLength(1);

      const audit = await AuditSchedule.findOne({ userId: testUser._id });
      expect(audit.auditType).toBe('cross_check');
      expect(audit.kpiTriggerId.toString()).toBe(kpiScore._id.toString());
    });

    test('should not schedule audits for good KPI scores', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 85, // Good score, no audits needed
        rating: 'good',
        tat: 90,
        majorNegativity: 0,
        quality: 95,
        neighborCheck: 85,
        generalNegativity: 10,
        appUsage: 98,
        insufficiency: 0,
        automationStatus: 'pending'
      });
      await kpiScore.save();

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/audit-scheduling/schedule-kpi-audits',
        { kpiScoreId: kpiScore._id },
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.data.auditSchedules).toHaveLength(0);

      const audits = await AuditSchedule.find({ userId: testUser._id });
      expect(audits).toHaveLength(0);
    });
  });

  describe('Audit Schedule Management', () => {
    test('should get scheduled audits', async () => {
      const audits = [
        generateAuditSchedule({ status: 'scheduled' }),
        generateAuditSchedule({ status: 'in_progress' }),
        generateAuditSchedule({ status: 'completed' })
      ];
      await AuditSchedule.insertMany(audits);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/audit-scheduling/scheduled',
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // Only scheduled and in_progress
    });

    test('should get overdue audits', async () => {
      const overdueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const audits = [
        generateAuditSchedule({ 
          scheduledDate: overdueDate, 
          status: 'scheduled' 
        }),
        generateAuditSchedule({ 
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
          status: 'scheduled' 
        })
      ];
      await AuditSchedule.insertMany(audits);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/audit-scheduling/overdue',
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(new Date(response.body.data[0].scheduledDate)).toEqual(overdueDate);
    });

    test('should complete audit with findings', async () => {
      const audit = new AuditSchedule(generateAuditSchedule({
        status: 'in_progress'
      }));
      await audit.save();

      const completionData = {
        findings: 'Good performance overall, minor improvements needed in customer interaction',
        completionDate: new Date()
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/audit-scheduling/${audit._id}/complete`,
        completionData,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.findings).toBe(completionData.findings);
      expect(response.body.data.completedDate).toBeDefined();
    });

    test('should get user audit history', async () => {
      const audits = [
        generateAuditSchedule({ auditType: 'audit_call' }),
        generateAuditSchedule({ auditType: 'cross_check' })
      ];
      await AuditSchedule.insertMany(audits);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/audit-scheduling/user/${testUser._id}`,
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test('should get upcoming audits', async () => {
      const upcomingDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      const audits = [
        generateAuditSchedule({ 
          scheduledDate: upcomingDate, 
          status: 'scheduled' 
        }),
        generateAuditSchedule({ 
          scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          status: 'scheduled' 
        })
      ];
      await AuditSchedule.insertMany(audits);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/audit-scheduling/upcoming',
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('Manual Audit Scheduling', () => {
    test('should manually schedule audit', async () => {
      const auditData = {
        userId: testUser._id,
        auditType: 'audit_call',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        notes: 'Manual audit for performance review'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/audit-scheduling/manual',
        auditData,
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.auditType).toBe('audit_call');
      expect(response.body.data.status).toBe('scheduled');
    });

    test('should cancel audit schedule', async () => {
      const audit = new AuditSchedule(generateAuditSchedule({
        status: 'scheduled'
      }));
      await audit.save();

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/audit-scheduling/${audit._id}`,
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify audit was deleted
      const deletedAudit = await AuditSchedule.findById(audit._id);
      expect(deletedAudit).toBeNull();
    });
  });

  describe('Audit Statistics', () => {
    test('should get audit scheduling statistics', async () => {
      const audits = [
        generateAuditSchedule({ status: 'scheduled' }),
        generateAuditSchedule({ status: 'in_progress' }),
        generateAuditSchedule({ status: 'completed' }),
        generateAuditSchedule({ status: 'scheduled' })
      ];
      await AuditSchedule.insertMany(audits);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/audit-scheduling/stats',
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(4);
      expect(response.body.data.scheduled).toBe(2);
      expect(response.body.data.inProgress).toBe(1);
      expect(response.body.data.completed).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid KPI score ID', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/audit-scheduling/schedule-kpi-audits',
        { kpiScoreId: '507f1f77bcf86cd799439999' },
        authToken
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('KPI score not found');
    });

    test('should handle invalid audit schedule ID', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        '/api/audit-scheduling/507f1f77bcf86cd799439999/complete',
        { findings: 'Test findings' },
        authToken
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Audit schedule not found');
    });

    test('should handle invalid audit schedule data', async () => {
      const invalidData = {
        userId: testUser._id,
        auditType: 'invalid_type',
        scheduledDate: 'invalid_date'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/audit-scheduling/manual',
        invalidData,
        authToken
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should handle bulk audit scheduling', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 20, // Very poor score triggers all audits
        rating: 'poor',
        tat: 30,
        majorNegativity: 10,
        quality: 40,
        neighborCheck: 35,
        generalNegativity: 70,
        appUsage: 50,
        insufficiency: 6,
        automationStatus: 'pending'
      });
      await kpiScore.save();

      const startTime = Date.now();
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/audit-scheduling/schedule-kpi-audits',
        { kpiScoreId: kpiScore._id },
        authToken
      );
      const endTime = Date.now();

      expect(response.status).toBe(201);
      expect(response.body.data.auditSchedules).toHaveLength(3);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    test('should handle concurrent audit scheduling', async () => {
      const kpiScore1 = new KPIScore({
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
      await kpiScore1.save();

      const kpiScore2 = new KPIScore({
        userId: testUser._id,
        period: '2024-04',
        overallScore: 50,
        rating: 'below average',
        tat: 65,
        majorNegativity: 4,
        quality: 75,
        neighborCheck: 70,
        generalNegativity: 30,
        appUsage: 85,
        insufficiency: 2,
        automationStatus: 'pending'
      });
      await kpiScore2.save();

      // Schedule audits for both KPI scores concurrently
      const [response1, response2] = await Promise.all([
        makeAuthenticatedRequest(
          app,
          'POST',
          '/api/audit-scheduling/schedule-kpi-audits',
          { kpiScoreId: kpiScore1._id },
          authToken
        ),
        makeAuthenticatedRequest(
          app,
          'POST',
          '/api/audit-scheduling/schedule-kpi-audits',
          { kpiScoreId: kpiScore2._id },
          authToken
        )
      ]);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.data.auditSchedules).toHaveLength(2);
      expect(response2.body.data.auditSchedules).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle boundary KPI scores for audit triggers', async () => {
      const boundaryScores = [
        { overallScore: 70, expectedAudits: 0 }, // Exactly at threshold
        { overallScore: 69, expectedAudits: 2 }, // Just below threshold
        { overallScore: 50, expectedAudits: 2 }, // Exactly at dummy audit threshold
        { overallScore: 49, expectedAudits: 3 }  // Just below dummy audit threshold
      ];

      for (let i = 0; i < boundaryScores.length; i++) {
        const { overallScore, expectedAudits } = boundaryScores[i];
        
        const kpiScore = new KPIScore({
          userId: testUser._id,
          period: `2024-0${i + 1}`,
          overallScore,
          rating: overallScore >= 70 ? 'good' : 'below average',
          tat: 70,
          majorNegativity: 2,
          quality: 80,
          neighborCheck: 70,
          generalNegativity: 20,
          appUsage: 85,
          insufficiency: 1,
          automationStatus: 'pending'
        });
        await kpiScore.save();

        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          '/api/audit-scheduling/schedule-kpi-audits',
          { kpiScoreId: kpiScore._id },
          authToken
        );

        expect(response.status).toBe(201);
        expect(response.body.data.auditSchedules).toHaveLength(expectedAudits);
      }
    });

    test('should handle high insufficiency scores', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 80, // Good overall score
        rating: 'good',
        tat: 90,
        majorNegativity: 0,
        quality: 95,
        neighborCheck: 85,
        generalNegativity: 5,
        appUsage: 98,
        insufficiency: 5, // High insufficiency should trigger cross-check
        automationStatus: 'pending'
      });
      await kpiScore.save();

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/audit-scheduling/schedule-kpi-audits',
        { kpiScoreId: kpiScore._id },
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.data.auditSchedules).toHaveLength(1);
      
      const audit = await AuditSchedule.findOne({ userId: testUser._id });
      expect(audit.auditType).toBe('cross_check');
    });
  });
});
