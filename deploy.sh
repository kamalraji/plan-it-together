#!/bin/bash

# Deployment script for Thittam1Hub
set -e

# Configuration
ENVIRONMENT=${1:-development}
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Function to check if required environment variables are set
check_env_vars() {
    local required_vars=("$@")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "❌ Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
}

# Development deployment
deploy_development() {
    echo "📦 Starting development deployment..."
    
    # Start services with docker-compose
    docker-compose up -d
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    echo "🗄️ Running database migrations..."
    cd backend && npm run prisma:migrate && cd ..
    
    echo "✅ Development deployment completed!"
    echo "🌐 Frontend: http://localhost:5173"
    echo "🔧 Backend: http://localhost:3000"
    echo "📊 Database: localhost:5432"
}

# Production deployment
deploy_production() {
    echo "📦 Starting production deployment..."
    
    # Check required environment variables
    check_env_vars "DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET"
    
    # Export build date
    export BUILD_DATE
    
    # Build and start production services
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    echo "🗄️ Running production database migrations..."
    docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
    
    echo "✅ Production deployment completed!"
    echo "🌐 Application: http://localhost"
    echo "🔧 API: http://localhost:3000"
}

# Staging deployment
deploy_staging() {
    echo "📦 Starting staging deployment..."
    
    # Similar to production but with staging-specific configurations
    check_env_vars "DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET"
    
    export BUILD_DATE
    
    # Use production compose file but with staging environment
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "⏳ Waiting for services to be ready..."
    sleep 30
    
    echo "🗄️ Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
    
    echo "✅ Staging deployment completed!"
}

# Health check function
health_check() {
    echo "🏥 Running health checks..."
    
    # Check frontend
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Frontend is healthy"
    else
        echo "❌ Frontend health check failed"
        return 1
    fi
    
    # Check backend
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
    else
        echo "❌ Backend health check failed"
        return 1
    fi
    
    echo "✅ All health checks passed!"
}

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up..."
    
    if [ "$ENVIRONMENT" = "development" ]; then
        docker-compose down
    else
        docker-compose -f docker-compose.prod.yml down
    fi
    
    # Remove unused images
    docker image prune -f
    
    echo "✅ Cleanup completed!"
}

# Main deployment logic
case $ENVIRONMENT in
    "development")
        deploy_development
        ;;
    "staging")
        deploy_staging
        ;;
    "production")
        deploy_production
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {development|staging|production|health|cleanup}"
        echo ""
        echo "Examples:"
        echo "  $0 development    # Deploy for local development"
        echo "  $0 production     # Deploy for production"
        echo "  $0 health         # Run health checks"
        echo "  $0 cleanup        # Clean up containers and images"
        exit 1
        ;;
esac