#!/bin/bash

echo "🚀 Setting up Thittam1Hub development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

echo "✅ Docker is running"

# Start Docker services
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Setup backend
echo "🔧 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
fi

echo "📦 Installing backend dependencies..."
npm install

echo "🗄️  Generating Prisma client..."
npm run prisma:generate

echo "🔄 Running database migrations..."
npm run prisma:migrate

cd ..

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend

if [ ! -f ".env" ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
fi

echo "📦 Installing frontend dependencies..."
npm install

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Services:"
echo "  Backend API: http://localhost:3000"
echo "  Frontend:    http://localhost:5173"
echo "  PostgreSQL:  localhost:5432"
echo "  Redis:       localhost:6379"
echo ""
