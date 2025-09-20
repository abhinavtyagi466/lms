@echo off
echo Starting Backend Server...
cd backend
set NODE_ENV=development
set PORT=3001
set MONGODB_URI=mongodb://localhost:27017/edutech-pro
set SESSION_SECRET=devsecretdevsecretdevsecretdevsecret
set CLIENT_ORIGIN=http://localhost:3000
set RATE_LIMIT_WINDOW_MS=900000
set RATE_LIMIT_MAX_REQUESTS=100
set MAX_FILE_SIZE=10485760
set LOCAL_UPLOAD_DIR=./uploads
npm start
pause
