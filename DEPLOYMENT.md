# Thittam1Hub Deployment Guide

This guide covers deployment configurations and procedures for the Thittam1Hub event management platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Database Migrations](#database-migrations)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

## Environment Configuration

### Required Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Configuration
JWT_SECRET="your-secure-jwt-secret"
JWT_REFRESH_SECRET="your-secure-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV="production"

# Email Service
EMAIL_PROVIDER="sendgrid"
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM="noreply@yourdomain.com"

# AWS S3 Storage
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="your-s3-bucket"

# Redis
REDIS_URL="redis://localhost:6379"

# CORS
CORS_ORIGIN="https://yourdomain.com"
```

#### Frontend (.env)
```bash
# API Configuration
VITE_API_URL=https://api.yourdomain.com/api
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3
VITE_API_RETRY_DELAY=1000

# Feature Flags
VITE_ENABLE_API_RETRY=true
VITE_ENABLE_API_LOGGING=false
VITE_ENABLE_HEALTH_CHECK=true

# App Metadata
VITE_APP_VERSION=1.0.0
```

## Local Development

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd thittam1hub
   ```

2. **Set up environment variables**
   ```bash
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```

3. **Start development services**
   ```bash
   # Using the deployment script
   ./deploy.sh development
   
   # Or manually with docker-compose
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   cd backend
   npm run prisma:migrate
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Database: localhost:5432

### Manual Setup

1. **Start PostgreSQL and Redis**
   ```bash
   docker-compose up -d postgres redis
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```

3. **Run migrations and start services**
   ```bash
   # Backend
   cd backend
   npm run prisma:migrate
   npm run dev
   
   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

## Production Deployment

### Using Docker Compose

1. **Set up production environment variables**
   ```bash
   # Create production environment file
   cp backend/.env.example backend/.env.production
   cp frontend/.env.example frontend/.env.production
   
   # Edit the files with production values
   ```

2. **Deploy using the deployment script**
   ```bash
   # Make sure all required environment variables are set
   export DATABASE_URL="your-production-database-url"
   export JWT_SECRET="your-production-jwt-secret"
   # ... other variables
   
   # Deploy
   ./deploy.sh production
   ```

3. **Verify deployment**
   ```bash
   ./deploy.sh health
   ```

### Manual Production Deployment

1. **Build Docker images**
   ```bash
   # Frontend
   docker build -t thittam1hub-frontend ./frontend
   
   # Backend
   docker build -t thittam1hub-backend ./backend
   ```

2. **Run production containers**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Run database migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate:prod
   ```

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that:

1. **Runs tests** for both frontend and backend
2. **Performs security scans** using Trivy
3. **Builds and pushes Docker images** to GitHub Container Registry
4. **Deploys to staging/production** environments

### Setting up CI/CD

1. **Configure GitHub Secrets**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `SENDGRID_API_KEY`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - Other environment-specific secrets

2. **Configure deployment environments**
   - Create `staging` and `production` environments in GitHub
   - Set up environment-specific secrets and variables

3. **Trigger deployments**
   - Push to `develop` branch → deploys to staging
   - Push to `main` branch → deploys to production

## Database Migrations

### Development
```bash
cd backend
npm run prisma:migrate
```

### Production
```bash
# Using the migration script
./backend/scripts/migrate-production.sh

# Or manually
cd backend
npm run prisma:migrate:prod
```

### Migration Best Practices

1. **Always backup** the database before running migrations in production
2. **Test migrations** in a staging environment first
3. **Use transactions** for complex migrations
4. **Monitor** migration performance and rollback if necessary

## Monitoring and Health Checks

### Health Check Endpoints

- **Frontend**: `GET /health`
- **Backend**: `GET /api/health`

### Docker Health Checks

Both frontend and backend Docker containers include health checks:

```bash
# Check container health
docker ps

# View health check logs
docker inspect <container-name>
```

### Application Monitoring

The application includes:

- **API request/response logging** (development mode)
- **Error boundary** for React components
- **Automatic retry logic** for failed API requests
- **Real-time API health monitoring**

## Troubleshooting

### Common Issues

1. **Database connection errors**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check database logs
   docker-compose logs postgres
   ```

2. **Migration failures**
   ```bash
   # Check migration status
   npx prisma migrate status
   
   # Reset database (development only)
   npm run prisma:reset
   ```

3. **Container startup issues**
   ```bash
   # Check container logs
   docker-compose logs <service-name>
   
   # Restart services
   docker-compose restart
   ```

4. **API connectivity issues**
   ```bash
   # Test API health
   curl http://localhost:3000/api/health
   
   # Check network connectivity
   docker network ls
   docker network inspect <network-name>
   ```

### Performance Optimization

1. **Database optimization**
   - Add appropriate indexes
   - Use connection pooling
   - Monitor query performance

2. **Frontend optimization**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement code splitting

3. **Backend optimization**
   - Use Redis for caching
   - Implement rate limiting
   - Monitor memory usage

### Security Considerations

1. **Environment variables**
   - Never commit secrets to version control
   - Use strong, unique secrets for production
   - Rotate secrets regularly

2. **Network security**
   - Use HTTPS in production
   - Configure proper CORS settings
   - Implement rate limiting

3. **Container security**
   - Use non-root users in containers
   - Keep base images updated
   - Scan for vulnerabilities

## Support

For deployment issues or questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review container logs
3. Verify environment configuration
4. Check network connectivity

## Version History

- **v1.0.0**: Initial deployment configuration
- **v1.1.0**: Added CI/CD pipeline and health checks
- **v1.2.0**: Enhanced security and monitoring features