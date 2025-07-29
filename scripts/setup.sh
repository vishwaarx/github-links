#!/bin/bash

# --- START scripts/setup.sh --- #
echo "🚀 Setting up Repo Auto-Setup Verifier..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/uploads
mkdir -p backend/temp
mkdir -p backend/logs
mkdir -p frontend/build

# Copy environment file
echo "⚙️  Setting up environment..."
if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env from template"
else
    echo "ℹ️  backend/.env already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the application: docker-compose up -d"
echo "2. Access the frontend: http://localhost:3000"
echo "3. Access the backend API: http://localhost:3001"
echo "4. Check health: http://localhost:3001/health"
echo ""
echo "📚 For more information, see README.md"
# --- END scripts/setup.sh --- # 