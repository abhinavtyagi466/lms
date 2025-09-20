# EduTech Pro - Complete E-Learning Platform

A performance-driven e-learning platform for Field Executives with comprehensive training management, KPI tracking, and lifecycle monitoring.

## 🚀 Complete Setup Guide

### System Requirements
- **Node.js**: 18.0.0 or higher
- **MongoDB**: Atlas account or local installation
- **npm/yarn**: Latest version

## 📦 Installation & Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd edutech-pro
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your MongoDB URI and configurations
nano .env

# Seed database with initial data
npm run seed

# Start backend server
npm run dev
```

### 3. Frontend Setup
```bash
# Navigate to root directory
cd ..

# Install frontend dependencies
npm install

# Start frontend development server
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health

## 🔐 Default Login Credentials

After seeding the database:

### Admin Portal
- **Email**: `admin@edutech.com`
- **Password**: `admin123`

### User Portal
- **Email**: `john.doe@company.com` | **Password**: `password123`
- **Email**: `jane.smith@company.com` | **Password**: `password123`
- **Email**: `mike.johnson@company.com` | **Password**: `password123`
- **Email**: `sarah.wilson@company.com` | **Password**: `password123`
- **Email**: `david.brown@company.com` | **Password**: `password123`

## 🏗️ Architecture Overview

```
EduTech Pro/
├── frontend/               # React + TypeScript + Tailwind
│   ├── components/         # Reusable UI components
│   ├── pages/             # Application pages
│   ├── contexts/          # React contexts
│   ├── services/          # API service layer
│   └── styles/           # Global styles
│
├── backend/               # Node.js + Express + MongoDB
│   ├── models/           # Database schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth & validation
│   ├── scripts/          # Database utilities
│   └── server.js        # Main server file
```

## ✨ Features

### 🎓 Training Management
- Interactive training modules with video content
- Quiz system with automatic scoring
- Progress tracking and completion certificates
- Category-based module organization

### 📊 KPI Tracking
- Comprehensive performance metrics (TAT, Quality, App Usage, Negativity)
- Automatic score calculation and rating assignment
- Historical trend analysis
- Triggered actions based on performance thresholds

### 🏆 Recognition System
- Awards and recognition management
- Achievement tracking
- Public recognition board
- Certificate generation

### ⚠️ Audit & Compliance
- Warning and audit record management
- Disciplinary action tracking
- Compliance monitoring
- Document management

### 📈 Analytics & Reporting
- User performance analytics
- Training completion reports
- Department-wise comparisons
- Export capabilities

### 👤 User Lifecycle
- Complete employee journey tracking
- Milestone recording
- Event timeline visualization
- Automated lifecycle events

## 🛠️ Technical Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **Vite** for build tooling
- **Axios** for API communication
- **Lucide React** for icons
- **Sonner** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers

## 🔧 Environment Configuration

### Backend (.env)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret

# Security
BCRYPT_ROUNDS=12
CLIENT_ORIGIN=http://localhost:3000
```

### Frontend (Environment Variables)
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=EduTech Pro
```

## 🚀 Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Backend
cd backend
pm2 start server.js --name "edutech-api"

# Frontend (build first)
cd ..
npm run build
pm2 serve dist 3000 --name "edutech-frontend"

# Save PM2 configuration
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 3001
CMD ["npm", "start"]

# Frontend Dockerfile  
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User/Admin login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile

### Core Functionality
- **Users**: `/api/users/*` - User management
- **Modules**: `/api/modules/*` - Training module operations
- **KPI**: `/api/kpi/*` - Performance tracking
- **Reports**: `/api/reports/*` - Analytics and reporting
- **Awards**: `/api/awards/*` - Recognition management
- **Audits**: `/api/audits/*` - Compliance tracking
- **Lifecycle**: `/api/lifecycle/*` - User journey tracking

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd ..
npm test
```

### Database Operations
```bash
# Seed database
cd backend
npm run seed

# Reset database (clears all data)
npm run seed -- --reset
```

## 📊 Monitoring & Logging

### Health Checks
- **Backend**: `GET /api/health`
- **Database**: Connection status in server logs
- **Frontend**: Console for client-side errors

### Logging
- **Backend**: Morgan for request logging
- **Frontend**: Console logging with error boundaries
- **Database**: Mongoose debugging (development)

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization
- SQL injection prevention (NoSQL)
- XSS protection headers

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Check the API documentation
- Review the deployment logs

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🎉 You're all set!** The EduTech Pro platform is now ready for development and deployment.