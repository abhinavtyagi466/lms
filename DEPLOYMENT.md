# 🚀 E-Learning Platform Deployment Guide

## Prerequisites
- Node.js 18+ installed
- npm installed
- MongoDB running (for backend)

## Quick Deployment

### 1. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Build Frontend
```bash
cd frontend
npm run build
```

### 3. Start Backend
```bash
cd backend
npm start
```

## Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### Environment Variables
Create `backend/.env` file:
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/edutech-pro
JWT_SECRET=your-super-secret-jwt-key-here
BCRYPT_ROUNDS=12
```

## File Structure After Build
```
├── backend/
│   ├── server.js
│   ├── .env
│   └── node_modules/
├── frontend/
│   ├── dist/          # Built frontend files
│   └── node_modules/
└── ecosystem.config.js
```

## Access Points
- **Backend API**: `http://your-domain.com:3001`
- **Frontend**: Upload `frontend/dist/` to your web server
- **API Endpoints**: `http://your-domain.com:3001/api/`

## Troubleshooting

### Build Issues
```bash
# Clean and rebuild
rm -rf frontend/dist/
rm -rf frontend/node_modules/.vite/
cd frontend
npm install
npm run build
```

### TypeScript Issues
```bash
# Skip TypeScript check
npm run build -- --skip-type-check
```

### Port Issues
- Backend runs on port 3001
- Frontend dev server runs on port 3000
- Make sure ports are not blocked by firewall
