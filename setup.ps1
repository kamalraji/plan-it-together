# PowerShell setup script for Windows

Write-Host "🚀 Setting up Thittam1Hub development environment..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Start Docker services
Write-Host "📦 Starting PostgreSQL and Redis..." -ForegroundColor Cyan
docker-compose up -d

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Setup backend
Write-Host "🔧 Setting up backend..." -ForegroundColor Cyan
Set-Location backend

if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
npm install

Write-Host "🗄️  Generating Prisma client..." -ForegroundColor Cyan
npm run prisma:generate

Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan
npm run prisma:migrate

Set-Location ..

# Setup frontend
Write-Host "🎨 Setting up frontend..." -ForegroundColor Cyan
Set-Location frontend

if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
npm install

Set-Location ..

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start development:" -ForegroundColor Cyan
Write-Host "  Backend:  cd backend; npm run dev"
Write-Host "  Frontend: cd frontend; npm run dev"
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "  Backend API: http://localhost:3000"
Write-Host "  Frontend:    http://localhost:5173"
Write-Host "  PostgreSQL:  localhost:5432"
Write-Host "  Redis:       localhost:6379"
Write-Host ""
