// Test data fixtures for KPI automation system

const sampleUsers = [
  {
    _id: '507f1f77bcf86cd799439011',
    username: 'john_doe',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'field_executive',
    department: 'Sales',
    phone: '+1234567890',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '507f1f77bcf86cd799439012',
    username: 'jane_smith',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    role: 'coordinator',
    department: 'Operations',
    phone: '+1234567891',
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    _id: '507f1f77bcf86cd799439013',
    username: 'mike_wilson',
    email: 'mike.wilson@example.com',
    name: 'Mike Wilson',
    role: 'manager',
    department: 'Management',
    phone: '+1234567892',
    isActive: true,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  }
];

const sampleKPIScores = [
  {
    _id: '507f1f77bcf86cd799439021',
    userId: '507f1f77bcf86cd799439011',
    period: '2024-01',
    overallScore: 75,
    rating: 'good',
    tat: 85,
    majorNegativity: 2,
    quality: 90,
    neighborCheck: 80,
    generalNegativity: 15,
    appUsage: 95,
    insufficiency: 1,
    automationStatus: 'pending',
    processedAt: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    _id: '507f1f77bcf86cd799439022',
    userId: '507f1f77bcf86cd799439011',
    period: '2024-02',
    overallScore: 45,
    rating: 'below average',
    tat: 60,
    majorNegativity: 5,
    quality: 70,
    neighborCheck: 65,
    generalNegativity: 35,
    appUsage: 80,
    insufficiency: 3,
    automationStatus: 'completed',
    processedAt: new Date('2024-02-15'),
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  },
  {
    _id: '507f1f77bcf86cd799439023',
    userId: '507f1f77bcf86cd799439012',
    period: '2024-01',
    overallScore: 90,
    rating: 'excellent',
    tat: 95,
    majorNegativity: 0,
    quality: 95,
    neighborCheck: 90,
    generalNegativity: 5,
    appUsage: 98,
    insufficiency: 0,
    automationStatus: 'completed',
    processedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
];

const sampleTrainingAssignments = [
  {
    _id: '507f1f77bcf86cd799439031',
    userId: '507f1f77bcf86cd799439011',
    trainingType: 'basic',
    assignedBy: 'kpi_trigger',
    dueDate: new Date('2024-03-01'),
    status: 'assigned',
    kpiTriggerId: '507f1f77bcf86cd799439022',
    completionDate: null,
    score: null,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  },
  {
    _id: '507f1f77bcf86cd799439032',
    userId: '507f1f77bcf86cd799439011',
    trainingType: 'negativity_handling',
    assignedBy: 'kpi_trigger',
    dueDate: new Date('2024-03-05'),
    status: 'in_progress',
    kpiTriggerId: '507f1f77bcf86cd799439022',
    completionDate: null,
    score: null,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-20')
  },
  {
    _id: '507f1f77bcf86cd799439033',
    userId: '507f1f77bcf86cd799439011',
    trainingType: 'app_usage',
    assignedBy: 'manual',
    dueDate: new Date('2024-02-28'),
    status: 'completed',
    kpiTriggerId: null,
    completionDate: new Date('2024-02-25'),
    score: 85,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-25')
  }
];

const sampleAuditSchedules = [
  {
    _id: '507f1f77bcf86cd799439041',
    userId: '507f1f77bcf86cd799439011',
    auditType: 'audit_call',
    scheduledDate: new Date('2024-03-10'),
    status: 'scheduled',
    kpiTriggerId: '507f1f77bcf86cd799439022',
    completedDate: null,
    findings: null,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  },
  {
    _id: '507f1f77bcf86cd799439042',
    userId: '507f1f77bcf86cd799439011',
    auditType: 'cross_check',
    scheduledDate: new Date('2024-03-15'),
    status: 'in_progress',
    kpiTriggerId: '507f1f77bcf86cd799439022',
    completedDate: null,
    findings: null,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-10')
  },
  {
    _id: '507f1f77bcf86cd799439043',
    userId: '507f1f77bcf86cd799439011',
    auditType: 'dummy_audit',
    scheduledDate: new Date('2024-02-20'),
    status: 'completed',
    kpiTriggerId: '507f1f77bcf86cd799439022',
    completedDate: new Date('2024-02-22'),
    findings: 'Good performance, minor improvements needed',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-22')
  }
];

const sampleEmailLogs = [
  {
    _id: '507f1f77bcf86cd799439051',
    recipientEmail: 'john.doe@example.com',
    recipientRole: 'field_executive',
    templateType: 'kpi_notification',
    subject: 'KPI Score Notification - February 2024',
    sentAt: new Date('2024-02-15T10:00:00Z'),
    status: 'sent',
    kpiTriggerId: '507f1f77bcf86cd799439022',
    errorMessage: null,
    createdAt: new Date('2024-02-15T10:00:00Z'),
    updatedAt: new Date('2024-02-15T10:00:00Z')
  },
  {
    _id: '507f1f77bcf86cd799439052',
    recipientEmail: 'jane.smith@example.com',
    recipientRole: 'coordinator',
    templateType: 'training_assignment',
    subject: 'Training Assignment - John Doe',
    sentAt: new Date('2024-02-15T10:05:00Z'),
    status: 'sent',
    kpiTriggerId: '507f1f77bcf86cd799439022',
    errorMessage: null,
    createdAt: new Date('2024-02-15T10:05:00Z'),
    updatedAt: new Date('2024-02-15T10:05:00Z')
  },
  {
    _id: '507f1f77bcf86cd799439053',
    recipientEmail: 'mike.wilson@example.com',
    recipientRole: 'manager',
    templateType: 'audit_notification',
    subject: 'Audit Scheduled - John Doe',
    sentAt: new Date('2024-02-15T10:10:00Z'),
    status: 'failed',
    kpiTriggerId: '507f1f77bcf86cd799439022',
    errorMessage: 'SMTP connection timeout',
    createdAt: new Date('2024-02-15T10:10:00Z'),
    updatedAt: new Date('2024-02-15T10:10:00Z')
  }
];

const sampleLifecycleEvents = [
  {
    _id: '507f1f77bcf86cd799439061',
    userId: '507f1f77bcf86cd799439011',
    type: 'kpi_score',
    title: 'KPI Score Recorded',
    description: 'KPI score of 45 recorded for February 2024',
    metadata: {
      kpiScoreId: '507f1f77bcf86cd799439022',
      period: '2024-02',
      overallScore: 45,
      rating: 'below average'
    },
    createdAt: new Date('2024-02-15T09:00:00Z'),
    updatedAt: new Date('2024-02-15T09:00:00Z')
  },
  {
    _id: '507f1f77bcf86cd799439062',
    userId: '507f1f77bcf86cd799439011',
    type: 'training_assigned',
    title: 'Training Assigned',
    description: 'Basic training assigned due to KPI trigger',
    metadata: {
      trainingAssignmentId: '507f1f77bcf86cd799439031',
      trainingType: 'basic',
      dueDate: '2024-03-01'
    },
    createdAt: new Date('2024-02-15T09:05:00Z'),
    updatedAt: new Date('2024-02-15T09:05:00Z')
  },
  {
    _id: '507f1f77bcf86cd799439063',
    userId: '507f1f77bcf86cd799439011',
    type: 'audit_scheduled',
    title: 'Audit Scheduled',
    description: 'Audit call scheduled due to KPI trigger',
    metadata: {
      auditScheduleId: '507f1f77bcf86cd799439041',
      auditType: 'audit_call',
      scheduledDate: '2024-03-10'
    },
    createdAt: new Date('2024-02-15T09:10:00Z'),
    updatedAt: new Date('2024-02-15T09:10:00Z')
  }
];

const sampleNotifications = [
  {
    _id: '507f1f77bcf86cd799439071',
    userId: '507f1f77bcf86cd799439011',
    type: 'kpi_notification',
    title: 'KPI Score Available',
    message: 'Your KPI score for February 2024 is now available. Score: 45 (Below Average)',
    isRead: false,
    createdAt: new Date('2024-02-15T10:00:00Z'),
    updatedAt: new Date('2024-02-15T10:00:00Z')
  },
  {
    _id: '507f1f77bcf86cd799439072',
    userId: '507f1f77bcf86cd799439011',
    type: 'training_assignment',
    title: 'Training Assignment',
    message: 'You have been assigned Basic Training. Due date: March 1, 2024',
    isRead: false,
    createdAt: new Date('2024-02-15T10:05:00Z'),
    updatedAt: new Date('2024-02-15T10:05:00Z')
  },
  {
    _id: '507f1f77bcf86cd799439073',
    userId: '507f1f77bcf86cd799439011',
    type: 'audit_notification',
    title: 'Audit Scheduled',
    message: 'An audit call has been scheduled for March 10, 2024',
    isRead: true,
    createdAt: new Date('2024-02-15T10:10:00Z'),
    updatedAt: new Date('2024-02-15T10:10:00Z')
  }
];

// Test scenarios for different KPI scores
const testKPIScenarios = {
  excellent: {
    overallScore: 90,
    rating: 'excellent',
    tat: 95,
    majorNegativity: 0,
    quality: 95,
    neighborCheck: 90,
    generalNegativity: 5,
    appUsage: 98,
    insufficiency: 0,
    expectedTriggers: {
      trainingAssignments: [],
      audits: [],
      emails: ['kpi_notification']
    }
  },
  good: {
    overallScore: 75,
    rating: 'good',
    tat: 85,
    majorNegativity: 1,
    quality: 90,
    neighborCheck: 80,
    generalNegativity: 15,
    appUsage: 95,
    insufficiency: 1,
    expectedTriggers: {
      trainingAssignments: [],
      audits: [],
      emails: ['kpi_notification']
    }
  },
  average: {
    overallScore: 60,
    rating: 'average',
    tat: 70,
    majorNegativity: 2,
    quality: 80,
    neighborCheck: 70,
    generalNegativity: 25,
    appUsage: 85,
    insufficiency: 2,
    expectedTriggers: {
      trainingAssignments: ['app_usage'],
      audits: [],
      emails: ['kpi_notification', 'training_assignment']
    }
  },
  belowAverage: {
    overallScore: 45,
    rating: 'below average',
    tat: 60,
    majorNegativity: 5,
    quality: 70,
    neighborCheck: 65,
    generalNegativity: 35,
    appUsage: 80,
    insufficiency: 3,
    expectedTriggers: {
      trainingAssignments: ['basic', 'negativity_handling', 'app_usage'],
      audits: ['audit_call', 'cross_check'],
      emails: ['kpi_notification', 'training_assignment', 'audit_notification']
    }
  },
  poor: {
    overallScore: 25,
    rating: 'poor',
    tat: 40,
    majorNegativity: 8,
    quality: 50,
    neighborCheck: 45,
    generalNegativity: 60,
    appUsage: 60,
    insufficiency: 5,
    expectedTriggers: {
      trainingAssignments: ['basic', 'negativity_handling', 'dos_donts', 'app_usage'],
      audits: ['audit_call', 'cross_check', 'dummy_audit'],
      emails: ['kpi_notification', 'training_assignment', 'audit_notification', 'warning_letter']
    }
  }
};

module.exports = {
  sampleUsers,
  sampleKPIScores,
  sampleTrainingAssignments,
  sampleAuditSchedules,
  sampleEmailLogs,
  sampleLifecycleEvents,
  sampleNotifications,
  testKPIScenarios
};
