# Production database migration script for PowerShell
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "Starting production database migration..." -ForegroundColor Green

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Error "DATABASE_URL environment variable is not set"
    exit 1
}

try {
    # Check if we can connect to the database
    Write-Host "Testing database connection..." -ForegroundColor Yellow
    $testQuery = "SELECT 1;"
    $testQuery | npx prisma db execute --stdin
    
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot connect to database"
    }

    # Generate Prisma client
    Write-Host "Generating Prisma client..." -ForegroundColor Yellow
    npx prisma generate
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to generate Prisma client"
    }

    # Run database migrations
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to run database migrations"
    }

    # Verify migration status
    Write-Host "Verifying migration status..." -ForegroundColor Yellow
    npx prisma migrate status
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to verify migration status"
    }

    Write-Host "Production database migration completed successfully!" -ForegroundColor Green
}
catch {
    Write-Error "Migration failed: $_"
    exit 1
}