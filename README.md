# EduTech Pro - E-Learning Platform for Field Executives

A comprehensive e-learning platform designed specifically for field executives with performance tracking, KPI management, and automated training assignments.

## 🚀 Features

### User Features
- **User Authentication & Registration**
- **Interactive Training Modules** with video content and quizzes
- **Progress Tracking** and completion certificates
- **Performance Reports** and analytics
- **Personal Dashboard** with learning progress

### Admin Features
- **User Management** - Add, edit, and manage field executives
- **Module Management** - Create and manage training content
- **KPI Score Entry** - Track performance metrics
- **Automated Training Triggers** - Assign training based on performance
- **Audit & Warning System** - Monitor compliance and performance
- **Awards & Recognition** - Reward high performers
- **Lifecycle Dashboard** - Track employee journey
- **Email Notifications** - Automated communication system

## 🏗️ Project Structure

```
├── backend/                 # Node.js/Express API server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic
│   ├── uploads/            # File uploads
│   └── server.js           # Main server file
├── frontend/               # React/TypeScript frontend
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   ├── styles/            # CSS and styling
│   └── utils/             # Utility functions
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

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Hook Form** for form management
- **Axios** for API communication
- **Lucide React** for icons

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
   MONGO_URI=mongodb://localhost:27017/edutech_pro
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key
   SESSION_SECRET=your-super-secret-session-key
   CLIENT_ORIGIN=http://localhost:3000
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

### KPI & Reports
- `GET /api/kpi` - Get KPI data
- `POST /api/kpi` - Add KPI score (admin)
- `GET /api/reports` - Get performance reports

### Additional Features
- Awards & Recognition system
- Audit & Warning management
- Lifecycle tracking
- Email notifications
- File uploads

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
- **Users** - Field executives and admin users
- **Modules** - Training content and materials
- **KPIs** - Performance metrics and scores
- **Reports** - Performance reports and analytics
- **Awards** - Recognition and awards data
- **Audits** - Compliance and warning records

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to your preferred hosting (Heroku, Vercel, etc.)

### Frontend Deployment
1. Build the application: `npm run build:frontend`
2. Deploy the `dist` folder to your hosting service
3. Update API base URL in production

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
  