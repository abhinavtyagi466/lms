# EduTech Pro Backend API

A comprehensive Node.js + Express.js + MongoDB backend for the EduTech Pro e-learning platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and other configs
```

4. **Seed the database**
```bash
npm run seed
```

5. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📋 Default Login Credentials

After running the seed script:

**Admin Portal:**
- Email: `admin@edutech.com`
- Password: `admin123`

**User Portal:**
- Email: `john.doe@company.com` / Password: `password123`
- Email: `jane.smith@company.com` / Password: `password123`
- Email: `mike.johnson@company.com` / Password: `password123`
- Email: `sarah.wilson@company.com` / Password: `password123`
- Email: `david.brown@company.com` / Password: `password123`

## 🗃️ Database Collections

- **users**: User accounts (admin/field executives)
- **modules**: Training modules with questions
- **usermodules**: User progress tracking
- **kpiscores**: Performance metrics
- **awards**: Recognition and awards
- **auditrecords**: Warnings and audit records
- **lifecycleevents**: User journey tracking

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - User/Admin login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id/profile` - Get user profile
- `GET /api/users` - Get all users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user (admin)

### Training Modules
- `GET /api/modules` - Get all modules
- `GET /api/modules/:id` - Get specific module
- `POST /api/modules` - Create module (admin)
- `POST /api/modules/:id/submit-quiz` - Submit quiz answers
- `POST /api/modules/:id/watch-video` - Mark video as watched

### KPI Management
- `GET /api/kpi/:userId` - Get user KPI scores
- `POST /api/kpi` - Submit KPI scores (admin)
- `GET /api/kpi/overview/stats` - Get KPI statistics (admin)

### Reports & Analytics
- `GET /api/reports/user/:userId` - User reports
- `GET /api/reports/admin` - Admin dashboard data
- `GET /api/reports/analytics/performance` - Performance analytics

### Awards & Recognition
- `GET /api/awards` - Get all awards
- `POST /api/awards` - Create award (admin)

### Audit & Warnings
- `GET /api/audits` - Get audit records (admin)
- `POST /api/audits` - Create audit record (admin)

### Lifecycle Tracking
- `GET /api/lifecycle/:userId` - Get user lifecycle events

## 🔧 Environment Variables

```env
# Server Config
PORT=3001
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret

# Client
CLIENT_ORIGIN=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Features

- ✅ JWT Authentication & Authorization  
- ✅ Role-based access control (Admin/User)
- ✅ Comprehensive KPI tracking system
- ✅ Training module management
- ✅ Quiz system with scoring
- ✅ Awards & recognition system
- ✅ Audit trail & warning system
- ✅ User lifecycle tracking
- ✅ Performance analytics
- ✅ Real-time activity monitoring
- ✅ Data export capabilities
- ✅ Automatic event triggers
- ✅ Security middleware (Rate limiting, CORS, Helmet)

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Check API health
curl http://localhost:3001/api/health
```

## 📁 Project Structure

```
backend/
├── models/          # MongoDB schemas
├── routes/          # API route handlers  
├── middleware/      # Auth & validation middleware
├── scripts/         # Database seeding scripts
├── server.js        # Main server file
├── package.json     # Dependencies
└── .env            # Environment variables
```

## 🚀 Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start server.js --name "edutech-api"
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔍 Monitoring

The API includes built-in monitoring endpoints:
- `GET /api/health` - Health check
- Request logging with Morgan
- Error tracking and reporting

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.