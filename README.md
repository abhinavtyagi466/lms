# EduTech Pro - E-Learning Platform for Field Executives

A comprehensive e-learning platform designed specifically for field executives with advanced KPI automation, performance tracking, automated training assignments, and intelligent audit scheduling.

## 🚀 Features

### User Features
- **User Authentication & Registration**
- **Interactive Training Modules** with video content and quizzes
- **Progress Tracking** and completion certificates
- **Performance Reports** and analytics
- **Personal Dashboard** with comprehensive KPI insights
- **Training Assignment Management** - View and complete assigned trainings
- **Audit Information** - Track scheduled audits and compliance status
- **Real-time Notifications** - KPI updates, training reminders, audit notifications
- **Performance Insights** - Trends, improvement areas, and achievement highlights

### Admin Features
- **User Management** - Add, edit, and manage field executives
- **Module Management** - Create and manage training content
- **Advanced KPI Management** - Complete KPI automation system
- **Automated Training Assignment** - Intelligent training triggers based on performance
- **Audit Scheduling System** - Automated audit scheduling and management
- **Email Notification Center** - Comprehensive email management and automation
- **Awards & Recognition** - Reward high performers
- **Lifecycle Dashboard** - Track employee journey with automation events
- **Performance Analytics** - Advanced reporting and insights

## 🏗️ Project Structure

```
├── backend/                 # Node.js/Express API server
│   ├── models/             # MongoDB schemas
│   │   ├── KPIScore.js     # Enhanced KPI model with automation
│   │   ├── TrainingAssignment.js  # Training assignment model
│   │   ├── AuditSchedule.js       # Audit scheduling model
│   │   ├── EmailLog.js            # Email logging model
│   │   └── LifecycleEvent.js      # Lifecycle tracking model
│   ├── routes/             # API endpoints
│   │   ├── kpi.js          # Enhanced KPI routes with automation
│   │   ├── trainingAssignments.js  # Training assignment routes
│   │   ├── auditScheduling.js     # Audit scheduling routes
│   │   └── emailLogs.js           # Email management routes
│   ├── services/           # Business logic
│   │   ├── kpiTriggerService.js   # KPI automation service
│   │   ├── emailService.js        # Enhanced email service
│   │   └── lifecycleService.js    # Lifecycle management
│   ├── middleware/         # Custom middleware
│   ├── uploads/            # File uploads
│   ├── tests/              # Comprehensive test suite
│   │   ├── integration/    # Integration tests
│   │   ├── fixtures/       # Test data
│   │   └── utils/          # Test utilities
│   └── server.js           # Main server file
├── frontend/               # React/TypeScript frontend
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Base UI components
│   │   └── KPIEntryForm.tsx # KPI entry form component
│   ├── pages/             # Page components
│   │   ├── admin/         # Admin pages
│   │   │   ├── KPITriggers.tsx        # KPI management
│   │   │   ├── EmailNotificationCenter.tsx  # Email center
│   │   │   └── AuditManager.tsx       # Audit management
│   │   └── user/          # User pages
│   │       └── UserDashboard.tsx      # Enhanced user dashboard
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   │   └── apiService.ts  # Enhanced API service
│   ├── styles/            # CSS and styling
│   ├── tests/             # Frontend test suite
│   │   ├── integration/   # Integration tests
│   │   ├── fixtures/      # Test data
│   │   └── utils/         # Test utilities
│   └── utils/             # Utility functions
├── docs/                  # Documentation
│   ├── api/               # API documentation
│   ├── user-guides/       # User guides
│   └── deployment/        # Deployment guides
├── scripts/               # Deployment and utility scripts
└── start-app.bat          # Windows startup script
```

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for email notifications
- **Cloudinary** for cloud storage
- **Express Validator** for input validation
- **Jest** for testing
- **MongoDB Memory Server** for test database

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Hook Form** for form management
- **Axios** for API communication
- **Lucide React** for icons
- **Vitest** for testing
- **Testing Library** for component testing

### KPI Automation Features
- **Automated Trigger System** - Intelligent KPI-based automation
- **Email Automation** - Template-based email notifications
- **Training Assignment Engine** - Performance-based training triggers
- **Audit Scheduling System** - Automated compliance monitoring
- **Lifecycle Tracking** - Complete employee journey tracking
- **Real-time Notifications** - Instant performance updates

## 📦 Installation & Setup

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "E-Learning Platform for Field Executives"
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Environment Setup**
   
   Create `.env` file in the `backend` directory:
   ```env
   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/edutech_pro
   PORT=3001
   NODE_ENV=development
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key
   SESSION_SECRET=your-super-secret-session-key
   CLIENT_ORIGIN=http://localhost:3000
   
   # Email Configuration (for KPI automation)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@edutechpro.com
   
   # KPI Automation Settings
   KPI_AUTOMATION_ENABLED=true
   EMAIL_AUTOMATION_ENABLED=true
   TRAINING_AUTOMATION_ENABLED=true
   AUDIT_AUTOMATION_ENABLED=true
   
   # Performance Settings
   KPI_PROCESSING_TIMEOUT=30000
   EMAIL_RETRY_ATTEMPTS=3
   EMAIL_RETRY_DELAY=5000
   
   # File Upload (if using Cloudinary)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Start the application**
   
   **Option 1: Using the batch file (Windows)**
   ```bash
   start-app.bat
   ```
   
   **Option 2: Using npm scripts**
   ```bash
   # Start both servers
   npm run dev
   
   # Or start individually
   npm run dev:backend  # Backend on port 3001
   npm run dev:frontend # Frontend on port 3000
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User/Admin login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin)

### Modules
- `GET /api/modules` - Get all modules
- `POST /api/modules` - Create module (admin)
- `PUT /api/modules/:id` - Update module (admin)
- `DELETE /api/modules/:id` - Delete module (admin)

### KPI Management (Enhanced with Automation)
- `GET /api/kpi/:userId` - Get user KPI data with automation status
- `POST /api/kpi` - Submit KPI score with automatic triggers
- `PUT /api/kpi/:id` - Update KPI score
- `GET /api/kpi/:id/triggers` - Get calculated triggers for KPI score
- `POST /api/kpi/:id/reprocess` - Reprocess triggers for KPI score
- `GET /api/kpi/:id/automation-status` - Get automation status and statistics
- `GET /api/kpi/pending-automation` - Get KPI scores with pending automation
- `GET /api/kpi/stats` - Get KPI statistics and analytics
- `GET /api/kpi/low-performers` - Get low-performing users
- `DELETE /api/kpi/:id` - Delete KPI score

### Training Assignment Management
- `POST /api/training-assignments/auto-assign` - Auto-assign trainings based on KPI triggers
- `GET /api/training-assignments/pending` - Get all pending training assignments
- `GET /api/training-assignments/overdue` - Get all overdue training assignments
- `PUT /api/training-assignments/:id/complete` - Mark training as completed
- `GET /api/training-assignments/user/:userId` - Get user's training assignments
- `POST /api/training-assignments/manual` - Manually assign training
- `DELETE /api/training-assignments/:id` - Cancel training assignment
- `GET /api/training-assignments/stats` - Get training assignment statistics

### Audit Scheduling Management
- `POST /api/audit-scheduling/schedule-kpi-audits` - Schedule audits based on KPI triggers
- `GET /api/audit-scheduling/scheduled` - Get all scheduled audits
- `GET /api/audit-scheduling/overdue` - Get all overdue audits
- `PUT /api/audit-scheduling/:id/complete` - Mark audit as completed
- `GET /api/audit-scheduling/user/:userId` - Get user's audit history
- `POST /api/audit-scheduling/manual` - Manually schedule audit
- `DELETE /api/audit-scheduling/:id` - Cancel scheduled audit
- `GET /api/audit-scheduling/stats` - Get audit scheduling statistics
- `GET /api/audit-scheduling/upcoming` - Get upcoming audits

### Email Management
- `GET /api/email-logs` - Get all email logs
- `GET /api/email-logs/:id` - Get email log by ID
- `POST /api/email-logs/:id/resend` - Resend failed email
- `POST /api/email-logs/retry-failed` - Retry all failed emails
- `DELETE /api/email-logs/:id/cancel` - Cancel scheduled email
- `POST /api/email-logs/schedule` - Schedule email for future delivery
- `GET /api/email-stats` - Get email statistics
- `GET /api/email-stats/delivery` - Get email delivery statistics

### Reports & Analytics
- `GET /api/reports` - Get performance reports
- `GET /api/reports/kpi-trends` - Get KPI trend analysis
- `GET /api/reports/training-effectiveness` - Get training effectiveness reports
- `GET /api/reports/audit-compliance` - Get audit compliance reports

### Additional Features
- Awards & Recognition system
- Lifecycle tracking with automation events
- File uploads
- Comprehensive error handling and logging

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon
```

### Frontend Development
```bash
cd frontend
npm run dev  # Start Vite dev server
```

### Building for Production
```bash
# Build frontend
cd frontend && npm run build

# Start production backend
cd backend && npm start
```

## 📊 Database Schema

The application uses MongoDB with the following main collections:

### Core Collections
- **Users** - Field executives and admin users
- **Modules** - Training content and materials
- **Reports** - Performance reports and analytics
- **Awards** - Recognition and awards data

### KPI Automation Collections
- **KPIScores** - Enhanced performance metrics with automation status
  - 7 KPI metrics (TAT, Major Negativity, Quality, Neighbor Check, General Negativity, App Usage, Insufficiency)
  - Automation status tracking
  - Trigger processing timestamps
  - Related training assignments, audits, and email logs

- **TrainingAssignments** - Automated training assignments
  - Training types (basic, negativity_handling, dos_donts, app_usage)
  - Assignment triggers (KPI-based, manual, scheduled)
  - Completion tracking and scoring
  - Due date management

- **AuditSchedules** - Automated audit scheduling
  - Audit types (audit_call, cross_check, dummy_audit)
  - Scheduling triggers and status tracking
  - Findings and completion data
  - Compliance monitoring

- **EmailLogs** - Email automation tracking
  - Template types and delivery status
  - Recipient management and error tracking
  - Scheduling and retry mechanisms
  - Performance analytics

- **LifecycleEvents** - Employee journey tracking
  - Event types (KPI scores, training, audits, warnings)
  - Metadata and timestamps
  - Performance improvement tracking
  - Career progression monitoring

### Indexes and Performance
- Comprehensive indexing for optimal query performance
- Compound indexes for complex queries
- Text indexes for search functionality
- TTL indexes for data cleanup

## 🤖 KPI Automation System

### Overview
The KPI automation system provides intelligent, performance-based automation for training assignments, audit scheduling, and email notifications.

### Key Features
- **Intelligent Triggers**: Automatic actions based on KPI performance levels
- **Training Automation**: Performance-based training assignment
- **Audit Scheduling**: Automated compliance monitoring
- **Email Notifications**: Template-based automated communications
- **Lifecycle Tracking**: Complete employee journey monitoring

### KPI Metrics
1. **TAT (Turn Around Time)** - Response time performance
2. **Major Negativity** - Critical performance issues
3. **Quality** - Service quality metrics
4. **Neighbor Check** - Cross-verification performance
5. **General Negativity** - Overall negative feedback
6. **App Usage** - Application utilization
7. **Insufficiency** - Resource adequacy

### Automation Triggers
- **Excellent (90-100)**: No triggers, performance recognition
- **Good (70-89)**: Minimal monitoring, optional improvements
- **Average (55-69)**: App usage training, performance coaching
- **Below Average (40-54)**: Multiple training assignments, audit scheduling
- **Poor (0-39)**: Comprehensive training, intensive audits, warning letters

## 🧪 Testing

### Test Suite
The application includes a comprehensive test suite covering:

- **Backend Integration Tests**: KPI processing, training automation, audit scheduling, email automation
- **Frontend Integration Tests**: Component testing, user interactions, form validation
- **End-to-End Tests**: Complete workflow testing
- **Performance Tests**: Load testing and optimization
- **Error Handling Tests**: Comprehensive error scenario coverage

### Running Tests
```bash
# Run all tests
./run-tests.sh

# Backend tests only
cd backend && npm test

# Frontend tests only
cd frontend && npm test

# Test coverage
npm run test:coverage
```

### Test Coverage
- **Backend**: Models, routes, services, middleware
- **Frontend**: Components, pages, services, utilities
- **Minimum Coverage**: 80% required

## 🚀 Deployment

### Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas or local MongoDB
- Email service configuration (SMTP)
- Environment variables setup

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables (see Environment Setup section)
3. Run database migrations
4. Deploy to your preferred hosting (Heroku, Vercel, AWS, etc.)
5. Set up monitoring and logging

### Frontend Deployment
1. Build the application: `npm run build:frontend`
2. Deploy the `dist` folder to your hosting service
3. Update API base URL in production
4. Configure CDN for static assets

### Production Checklist
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Email service tested
- [ ] SSL certificates installed
- [ ] Monitoring setup
- [ ] Backup procedures configured
- [ ] Performance optimization applied

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team.

---

**Note**: This platform is specifically designed for field executives and includes features for performance tracking, automated training assignments, and comprehensive reporting systems.
  