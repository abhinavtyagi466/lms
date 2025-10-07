#!/bin/bash

echo "🚀 Starting E-Learning Platform in PRODUCTION mode..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "💡 Try: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 not found. For production, PM2 is recommended."
    echo "🔧 Starting with regular Node.js..."
    cd backend
    npm start
else
    cd backend
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Stop any existing PM2 processes
    echo "🛑 Stopping existing PM2 processes..."
    pm2 delete edutech-backend-prod 2>/dev/null || true
    
    # Start backend in production mode
    echo "🔧 Starting backend in PRODUCTION mode with PM2..."
    pm2 start ecosystem.config.js --only edutech-backend-prod --update-env
    
    echo ""
    echo "✅ Backend started successfully!"
    echo ""
    echo "📊 View logs with: pm2 logs edutech-backend-prod"
    echo "📈 View status with: pm2 status"
    echo "🛑 Stop with: pm2 stop edutech-backend-prod"
    echo ""
    
    # Show PM2 status
    pm2 status
fi
