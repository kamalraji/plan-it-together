# Deployment script for Thittam1Hub (PowerShell)
param(
    [Parameter(Position=0)]
    [ValidateSet("development", "staging", "production", "health", "cleanup")]
    [string]$Environment = "development"
)

$ErrorActionPreference = "Stop"
$BuildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

Write-Host "🚀 Starting deployment for environment: $Environment" -ForegroundColor Green

# Function to check if required environment variables are set
function Test-EnvironmentVariables {
    param([string[]]$RequiredVars)
    
    $missingVars = @()
    foreach ($var in $RequiredVars) {
        if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "❌ Missing required environment variables: $($missingVars -join ', ')"
        exit 1
    }
}

# Development deployment
function Deploy-Development {
    Write-Host "📦 Starting development deployment..." -ForegroundColor Yellow
    
    # Start services with docker-compose
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) { throw "Failed to start development services" }
    
    # Wait for database to be ready
    Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Run database migrations
    Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
    Push-Location backend
    try {
        npm run prisma:migrate
        if ($LASTEXITCODE -ne 0) { throw "Failed to run migrations" }
    }
    finally {
        Pop-Location
    }
    
    Write-Host "✅ Development deployment completed!" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "🔧 Backend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "📊 Database: localhost:5432" -ForegroundColor Cyan
}

# Production deployment
function Deploy-Production {
    Write-Host "📦 Starting production deployment..." -ForegroundColor Yellow
    
    # Check required environment variables
    Test-EnvironmentVariables @("DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET")
    
    # Set build date environment variable
    $env:BUILD_DATE = $BuildDate
    
    # Build and start production services
    docker-compose -f docker-compose.prod.yml up -d --build
    if ($LASTEXITCODE -ne 0) { throw "Failed to start production services" }
    
    # Wait for services to be ready
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Run database migrations
    Write-Host "🗄️ Running production database migrations..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
    if ($LASTEXITCODE -ne 0) { throw "Failed to run production migrations" }
    
    Write-Host "✅ Production deployment completed!" -ForegroundColor Green
    Write-Host "🌐 Application: http://localhost" -ForegroundColor Cyan
    Write-Host "🔧 API: http://localhost:3000" -ForegroundColor Cyan
}

# Staging deployment
function Deploy-Staging {
    Write-Host "📦 Starting staging deployment..." -ForegroundColor Yellow
    
    # Similar to production but with staging-specific configurations
    Test-EnvironmentVariables @("DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET")
    
    $env:BUILD_DATE = $BuildDate
    
    # Use production compose file but with staging environment
    docker-compose -f docker-compose.prod.yml up -d --build
    if ($LASTEXITCODE -ne 0) { throw "Failed to start staging services" }
    
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
    if ($LASTEXITCODE -ne 0) { throw "Failed to run staging migrations" }
    
    Write-Host "✅ Staging deployment completed!" -ForegroundColor Green
}

# Health check function
function Test-Health {
    Write-Host "🏥 Running health checks..." -ForegroundColor Yellow
    
    $healthCheckFailed = $false
    
    # Check frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend is healthy" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend health check failed" -ForegroundColor Red
            $healthCheckFailed = $true
        }
    }
    catch {
        Write-Host "❌ Frontend health check failed: $_" -ForegroundColor Red
        $healthCheckFailed = $true
    }
    
    # Check backend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is healthy" -ForegroundColor Green
        } else {
            Write-Host "❌ Backend health check failed" -ForegroundColor Red
            $healthCheckFailed = $true
        }
    }
    catch {
        Write-Host "❌ Backend health check failed: $_" -ForegroundColor Red
        $healthCheckFailed = $true
    }
    
    if (-not $healthCheckFailed) {
        Write-Host "✅ All health checks passed!" -ForegroundColor Green
    } else {
        throw "Health checks failed"
    }
}

# Cleanup function
function Invoke-Cleanup {
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    
    if ($Environment -eq "development") {
        docker-compose down
    } else {
        docker-compose -f docker-compose.prod.yml down
    }
    
    # Remove unused images
    docker image prune -f
    
    Write-Host "✅ Cleanup completed!" -ForegroundColor Green
}

# Main deployment logic
try {
    switch ($Environment) {
        "development" { Deploy-Development }
        "staging" { Deploy-Staging }
        "production" { Deploy-Production }
        "health" { Test-Health }
        "cleanup" { Invoke-Cleanup }
    }
}
catch {
    Write-Error "Deployment failed: $_"
    exit 1
}