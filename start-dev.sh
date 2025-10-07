#!/bin/bash

echo "🚀 Starting E-Learning Platform in DEVELOPMENT mode..."
echo "📝 Auto-reload enabled - changes will restart server automatically"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 not found globally. Installing PM2..."
    npm install -g pm2
fi

# Navigate to backend directory
cd backend

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop any existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 delete edutech-backend-dev 2>/dev/null || true

# Start backend in development mode with PM2
echo "🔧 Starting backend in WATCH mode with PM2..."
pm2 start ecosystem.config.js --only edutech-backend-dev --update-env

# Show logs
echo ""
echo "✅ Backend started successfully!"
echo ""
echo "📊 View logs with: pm2 logs edutech-backend-dev"
echo "📈 View status with: pm2 status"
echo "🛑 Stop with: pm2 stop edutech-backend-dev"
echo "🔄 Manual restart: pm2 restart edutech-backend-dev"
echo ""
echo "🎯 Server will auto-reload on file changes!"
echo ""

# Show PM2 status
pm2 status

# Follow logs
echo ""
echo "📋 Showing live logs (Ctrl+C to exit)..."
pm2 logs edutech-backend-dev

