#!/bin/bash

echo "🚀 Starting E-Learning Platform with NODEMON..."
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

# Navigate to backend directory
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start backend with nodemon
echo "🔧 Starting backend with NODEMON..."
echo "🎯 Server will auto-reload on file changes!"
echo ""

npm run dev

