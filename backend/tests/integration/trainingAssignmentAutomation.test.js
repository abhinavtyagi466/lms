// Integration tests for training assignment automation

const request = require('supertest');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, createTestToken, makeAuthenticatedRequest, assertTrainingAssignment, generateTrainingAssignment, cleanupTestData } = require('../utils/testHelpers');

// Import models
const User = require('../../models/User');
const KPIScore = require('../../models/KPIScore');
const TrainingAssignment = require('../../models/TrainingAssignment');

describe('Training Assignment Automation Integration Tests', () => {
  let app;
  let testUser;
  let authToken;
  let models;

  beforeAll(async () => {
    await setupTestDB();
    app = require('../../server');
    models = { User, KPIScore, TrainingAssignment };
    
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
      TrainingAssignment.deleteMany({})
    ]);
  });

  describe('Automatic Training Assignment', () => {
    test('should auto-assign basic training for low KPI score', async () => {
      // Create KPI score that triggers basic training
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

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/training-assignments/auto-assign',
        { kpiScoreId: kpiScore._id },
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trainingAssignments).toHaveLength(3);

      // Verify training assignments were created
      const assignments = await TrainingAssignment.find({ userId: testUser._id });
      expect(assignments).toHaveLength(3);

      const trainingTypes = assignments.map(ta => ta.trainingType);
      expect(trainingTypes).toContain('basic');
      expect(trainingTypes).toContain('negativity_handling');
      expect(trainingTypes).toContain('app_usage');

      // Verify assignment details
      const basicTraining = assignments.find(ta => ta.trainingType === 'basic');
      assertTrainingAssignment(basicTraining, 'basic', 'assigned');
      expect(basicTraining.kpiTriggerId.toString()).toBe(kpiScore._id.toString());
    });

    test('should auto-assign app usage training for low app usage', async () => {
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
        appUsage: 60, // Low app usage triggers training
        insufficiency: 1,
        automationStatus: 'pending'
      });
      await kpiScore.save();

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/training-assignments/auto-assign',
        { kpiScoreId: kpiScore._id },
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.data.trainingAssignments).toHaveLength(1);

      const assignment = await TrainingAssignment.findOne({ 
        userId: testUser._id, 
        trainingType: 'app_usage' 
      });
      assertTrainingAssignment(assignment, 'app_usage', 'assigned');
    });

    test('should auto-assign negativity handling training for high negativity', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 65,
        rating: 'average',
        tat: 75,
        majorNegativity: 3, // High major negativity
        quality: 85,
        neighborCheck: 75,
        generalNegativity: 30, // High general negativity
        appUsage: 90,
        insufficiency: 1,
        automationStatus: 'pending'
      });
      await kpiScore.save();

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/training-assignments/auto-assign',
        { kpiScoreId: kpiScore._id },
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.data.trainingAssignments).toHaveLength(1);

      const assignment = await TrainingAssignment.findOne({ 
        userId: testUser._id, 
        trainingType: 'negativity_handling' 
      });
      assertTrainingAssignment(assignment, 'negativity_handling', 'assigned');
    });

    test('should auto-assign dos and donts training for quality issues', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 60,
        rating: 'average',
        tat: 70,
        majorNegativity: 2,
        quality: 2, // Quality > 1 triggers dos and donts training
        neighborCheck: 70,
        generalNegativity: 25,
        appUsage: 85,
        insufficiency: 2,
        automationStatus: 'pending'
      });
      await kpiScore.save();

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/training-assignments/auto-assign',
        { kpiScoreId: kpiScore._id },
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.data.trainingAssignments).toHaveLength(1);

      const assignment = await TrainingAssignment.findOne({ 
        userId: testUser._id, 
        trainingType: 'dos_donts' 
      });
      assertTrainingAssignment(assignment, 'dos_donts', 'assigned');
    });
  });

  describe('Training Assignment Management', () => {
    test('should get pending training assignments', async () => {
      // Create some training assignments
      const assignments = [
        generateTrainingAssignment({ status: 'assigned' }),
        generateTrainingAssignment({ status: 'in_progress' }),
        generateTrainingAssignment({ status: 'completed' })
      ];
      await TrainingAssignment.insertMany(assignments);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/training-assignments/pending',
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // Only assigned and in_progress
    });

    test('should get overdue training assignments', async () => {
      const overdueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const assignments = [
        generateTrainingAssignment({ 
          dueDate: overdueDate, 
          status: 'assigned' 
        }),
        generateTrainingAssignment({ 
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
          status: 'assigned' 
        })
      ];
      await TrainingAssignment.insertMany(assignments);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/training-assignments/overdue',
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(new Date(response.body.data[0].dueDate)).toEqual(overdueDate);
    });

    test('should complete training assignment', async () => {
      const assignment = new TrainingAssignment(generateTrainingAssignment({
        status: 'in_progress'
      }));
      await assignment.save();

      const completionData = {
        score: 85,
        completionDate: new Date()
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/training-assignments/${assignment._id}/complete`,
        completionData,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.score).toBe(85);
      expect(response.body.data.completionDate).toBeDefined();
    });

    test('should get user training assignments', async () => {
      const assignments = [
        generateTrainingAssignment({ trainingType: 'basic' }),
        generateTrainingAssignment({ trainingType: 'app_usage' })
      ];
      await TrainingAssignment.insertMany(assignments);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/training-assignments/user/${testUser._id}`,
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('Manual Training Assignment', () => {
    test('should manually assign training', async () => {
      const assignmentData = {
        userId: testUser._id,
        trainingType: 'basic',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        notes: 'Manual assignment for performance improvement'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/training-assignments/manual',
        assignmentData,
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trainingType).toBe('basic');
      expect(response.body.data.assignedBy).toBe('manual');
      expect(response.body.data.status).toBe('assigned');
    });

    test('should cancel training assignment', async () => {
      const assignment = new TrainingAssignment(generateTrainingAssignment({
        status: 'assigned'
      }));
      await assignment.save();

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/training-assignments/${assignment._id}`,
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify assignment was deleted
      const deletedAssignment = await TrainingAssignment.findById(assignment._id);
      expect(deletedAssignment).toBeNull();
    });
  });

  describe('Training Assignment Statistics', () => {
    test('should get training assignment statistics', async () => {
      const assignments = [
        generateTrainingAssignment({ status: 'assigned' }),
        generateTrainingAssignment({ status: 'in_progress' }),
        generateTrainingAssignment({ status: 'completed' }),
        generateTrainingAssignment({ status: 'overdue' })
      ];
      await TrainingAssignment.insertMany(assignments);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/training-assignments/stats',
        null,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(4);
      expect(response.body.data.assigned).toBe(1);
      expect(response.body.data.inProgress).toBe(1);
      expect(response.body.data.completed).toBe(1);
      expect(response.body.data.overdue).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid KPI score ID', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/training-assignments/auto-assign',
        { kpiScoreId: '507f1f77bcf86cd799439999' },
        authToken
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('KPI score not found');
    });

    test('should handle invalid training assignment ID', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        '/api/training-assignments/507f1f77bcf86cd799439999/complete',
        { score: 85 },
        authToken
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Training assignment not found');
    });

    test('should handle invalid training assignment data', async () => {
      const invalidData = {
        userId: testUser._id,
        trainingType: 'invalid_type',
        dueDate: 'invalid_date'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/training-assignments/manual',
        invalidData,
        authToken
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should handle bulk training assignment creation', async () => {
      const kpiScore = new KPIScore({
        userId: testUser._id,
        period: '2024-03',
        overallScore: 25, // Poor score triggers all trainings
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
        '/api/training-assignments/auto-assign',
        { kpiScoreId: kpiScore._id },
        authToken
      );
      const endTime = Date.now();

      expect(response.status).toBe(201);
      expect(response.body.data.trainingAssignments).toHaveLength(4);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });
});
