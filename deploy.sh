#!/bin/bash

echo "🚀 Starting E-Learning Platform Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Backend dependencies installation failed"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Frontend dependencies installation failed"
    exit 1
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend build completed successfully!"

# Go back to root
cd ..

echo "🎯 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start backend: cd backend && npm start"
echo "2. Or use PM2: pm2 start ecosystem.config.js"
echo "3. Upload frontend/dist folder to your web server"
echo "4. Configure your domain to point to the server"
echo ""
echo "🌐 Your application will be available at:"
echo "   Backend API: http://your-domain.com:3001"
echo "   Frontend: http://your-domain.com"
