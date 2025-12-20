# Event Community Workspace Deployment Guide

This guide covers the deployment and configuration of the Event Community Workspace feature within Thittam1Hub.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Deployment Steps](#deployment-steps)
- [Configuration Validation](#configuration-validation)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Security Configuration](#security-configuration)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## Overview

The Event Community Workspace is a comprehensive team collaboration system that integrates with existing Thittam1Hub features. It provides:

- **Automatic workspace provisioning** when events are created
- **Role-based team management** with granular permissions
- **Task management** with dependencies and progress tracking
- **Integrated communication** tools for team collaboration
- **Template system** for reusable workspace structures
- **Mobile support** with offline capabilities
- **Marketplace integration** for hiring team members
- **Analytics and reporting** for workspace performance

## Prerequisites

### System Requirements

- **Docker** 20.10+ and Docker Compose 2.0+
- **Node.js** 18+ (for local development)
- **PostgreSQL** 15+ with required extensions
- **Redis** 7+ for caching and session management
- **Minimum 4GB RAM** and 20GB disk space

### Required Services

- **Email service** (SendGrid or AWS SES) for notifications
- **File storage** (AWS S3 or compatible) for attachments
- **SSL certificate** for HTTPS in production
- **Monitoring tools** (optional but recommended)

## Environment Configuration

### Backend Environment Variables

Add the following workspace-specific variables to your `.env` file:

```bash
# Workspace Core Configuration
WORKSPACE_ENABLED=true
WORKSPACE_AUTO_PROVISION=true
WORKSPACE_DISSOLUTION_DELAY_DAYS=30
WORKSPACE_MAX_TEAM_SIZE=50
WORKSPACE_MAX_TASKS_PER_WORKSPACE=500
WORKSPACE_TEMPLATE_SHARING_ENABLED=true

# Workspace Security
WORKSPACE_SESSION_TIMEOUT_MINUTES=60
WORKSPACE_MFA_REQUIRED_ROLES=workspace_owner,team_lead
WORKSPACE_AUDIT_LOG_RETENTION_DAYS=365
WORKSPACE_ENCRYPTION_KEY=your-32-character-encryption-key

# Workspace Notifications
WORKSPACE_NOTIFICATION_ENABLED=true
WORKSPACE_EMAIL_NOTIFICATIONS=true
WORKSPACE_PUSH_NOTIFICATIONS=true
WORKSPACE_SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook
WORKSPACE_TEAMS_WEBHOOK_URL=https://your-teams-webhook

# Workspace Analytics
WORKSPACE_ANALYTICS_ENABLED=true
WORKSPACE_METRICS_RETENTION_DAYS=90
WORKSPACE_PERFORMANCE_MONITORING=true
```

### Frontend Environment Variables

Add these variables to your frontend `.env` file:

```bash
# Workspace Feature Flags
VITE_WORKSPACE_ENABLED=true
VITE_WORKSPACE_TEMPLATES_ENABLED=true
VITE_WORKSPACE_MOBILE_ENABLED=true
VITE_WORKSPACE_ANALYTICS_ENABLED=true
VITE_WORKSPACE_MARKETPLACE_INTEGRATION=true

# Workspace Configuration
VITE_WORKSPACE_MAX_TEAM_SIZE=50
VITE_WORKSPACE_MAX_TASKS=500
VITE_WORKSPACE_AUTO_SAVE_INTERVAL=30000
VITE_WORKSPACE_NOTIFICATION_INTERVAL=60000

# Workspace UI Settings
VITE_WORKSPACE_THEME=default
VITE_WORKSPACE_COMPACT_MODE=false
VITE_WORKSPACE_REAL_TIME_UPDATES=true
```

### Required Environment Variables

The following variables are **required** for workspace functionality:

- `WORKSPACE_ENCRYPTION_KEY`: 32-character key for encrypting sensitive data
- `DATABASE_URL`: PostgreSQL connection string with workspace schema access
- `JWT_SECRET`: For workspace session management
- `EMAIL_PROVIDER` and related keys: For workspace notifications

## Database Setup

### 1. Run Workspace Migrations

For **development**:
```bash
cd backend
npm run prisma:migrate
```

For **production** (with backup):
```bash
# Linux/macOS
./backend/scripts/migrate-workspace-production.sh

# Windows
./backend/scripts/migrate-workspace-production.ps1
```

### 2. Verify Database Schema

The migration should create these tables:
- `Workspace` - Core workspace data
- `TeamMember` - Team member assignments and roles
- `WorkspaceTask` - Task management
- `WorkspaceChannel` - Communication channels
- `WorkspaceTemplate` - Reusable templates
- `WorkspaceAuditLog` - Security and compliance logs

### 3. Initialize Default Data

```bash
# Create default workspace templates
docker-compose exec backend node -e "
  const { workspaceTemplateService } = require('./dist/services/workspace-template.service.js');
  workspaceTemplateService.initializeDefaultTemplates();
"
```

## Deployment Steps

### 1. Development Deployment

```bash
# Clone and setup
git clone <repository-url>
cd thittam1hub

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your configuration

# Deploy
./deploy.sh development
```

### 2. Production Deployment

```bash
# Set production environment variables
export DATABASE_URL="your-production-database-url"
export JWT_SECRET="your-production-jwt-secret"
export WORKSPACE_ENCRYPTION_KEY="your-32-character-key"
# ... other required variables

# Deploy
./deploy.sh production

# Verify deployment
./deploy.sh health
```

### 3. Staging Deployment

```bash
# Similar to production but with staging configuration
./deploy.sh staging
```

## Configuration Validation

### 1. Validate Workspace Configuration

```bash
# Check configuration health
curl http://localhost:3000/api/workspace-config/health

# Expected response:
{
  "success": true,
  "data": {
    "enabled": true,
    "valid": true,
    "errors": [],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Test Workspace Features

```bash
# Test workspace provisioning
curl -X POST http://localhost:3000/api/workspace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"eventId": "test-event-id"}'

# Test team member invitation
curl -X POST http://localhost:3000/api/team/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"workspaceId": "workspace-id", "email": "test@example.com", "role": "general_volunteer"}'
```

### 3. Verify Integration Points

- **Event Integration**: Create an event and verify workspace auto-provisioning
- **Marketplace Integration**: Test vendor hiring workflow
- **Notification System**: Send test notifications
- **Mobile Access**: Test responsive interfaces

## Monitoring and Health Checks

### 1. Health Check Endpoints

- **General Health**: `GET /api/health`
- **Workspace Health**: `GET /api/workspace-config/health`
- **Feature Status**: `GET /api/workspace-config/features`
- **Configuration Limits**: `GET /api/workspace-config/limits`

### 2. Monitoring Metrics

Key metrics to monitor:

```bash
# Workspace metrics
workspace_total{status="active"}
workspace_created_total
workspace_dissolved_total

# Team metrics
team_members_total{role="workspace_owner"}
team_invitations_sent_total
team_invitations_accepted_total

# Task metrics
tasks_total{status="completed"}
tasks_overdue_total
task_completion_duration_seconds

# Performance metrics
workspace_api_request_duration_seconds
workspace_database_query_duration_seconds
```

### 3. Alerting Rules

Configure alerts for:
- High workspace provisioning failure rate (>10%)
- Security violations detected
- API response time >5 seconds
- High task overdue rate (>20%)
- Notification delivery failures (>10%)

## Security Configuration

### 1. Encryption Setup

```bash
# Generate encryption key
openssl rand -hex 32

# Set in environment
export WORKSPACE_ENCRYPTION_KEY="your-generated-key"
```

### 2. Role-Based Access Control

Configure MFA requirements:
```bash
# Require MFA for sensitive roles
WORKSPACE_MFA_REQUIRED_ROLES=workspace_owner,team_lead,event_coordinator
```

### 3. Audit Logging

Enable comprehensive audit logging:
```bash
WORKSPACE_AUDIT_LOG_RETENTION_DAYS=365
```

### 4. Session Management

Configure secure sessions:
```bash
WORKSPACE_SESSION_TIMEOUT_MINUTES=60
```

## Troubleshooting

### Common Issues

#### 1. Workspace Provisioning Failures

**Symptoms**: Events created but no workspace provisioned

**Solutions**:
```bash
# Check workspace configuration
curl http://localhost:3000/api/workspace-config/health

# Verify auto-provisioning is enabled
echo $WORKSPACE_AUTO_PROVISION

# Check event service integration
docker-compose logs backend | grep "workspace"
```

#### 2. Team Invitation Failures

**Symptoms**: Invitations not sent or accepted

**Solutions**:
```bash
# Check email configuration
echo $EMAIL_PROVIDER
echo $SENDGRID_API_KEY

# Verify invitation service
curl http://localhost:3000/api/team/health

# Check notification logs
docker-compose logs backend | grep "invitation"
```

#### 3. Task Management Issues

**Symptoms**: Tasks not created or updated

**Solutions**:
```bash
# Check task service health
curl http://localhost:3000/api/task/health

# Verify database connectivity
docker-compose exec backend npx prisma db pull

# Check task limits
curl http://localhost:3000/api/workspace-config/limits
```

#### 4. Performance Issues

**Symptoms**: Slow API responses, timeouts

**Solutions**:
```bash
# Check resource usage
docker stats

# Monitor database performance
docker-compose exec postgres pg_stat_activity

# Check Redis connectivity
docker-compose exec redis redis-cli ping
```

### Log Analysis

#### Backend Logs
```bash
# View workspace-specific logs
docker-compose logs backend | grep -E "(workspace|team|task)"

# Monitor real-time logs
docker-compose logs -f backend
```

#### Database Logs
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Monitor slow queries
docker-compose exec postgres psql -U postgres -d thittam1hub -c "
  SELECT query, mean_time, calls 
  FROM pg_stat_statements 
  WHERE query LIKE '%workspace%' 
  ORDER BY mean_time DESC 
  LIMIT 10;
"
```

## Rollback Procedures

### 1. Configuration Rollback

```bash
# Disable workspace features
export WORKSPACE_ENABLED=false

# Restart services
docker-compose restart backend
```

### 2. Database Rollback

```bash
# Restore from backup (production)
./backend/scripts/migrate-workspace-production.sh --rollback

# Reset database (development only)
cd backend
npm run prisma:reset
```

### 3. Application Rollback

```bash
# Rollback to previous version
git checkout previous-stable-tag
./deploy.sh production
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for workspace queries
CREATE INDEX CONCURRENTLY idx_workspace_event_id ON "Workspace"(event_id);
CREATE INDEX CONCURRENTLY idx_team_member_workspace_id ON "TeamMember"(workspace_id);
CREATE INDEX CONCURRENTLY idx_workspace_task_assignee ON "WorkspaceTask"(assignee_id);
CREATE INDEX CONCURRENTLY idx_workspace_task_due_date ON "WorkspaceTask"(due_date);
```

### 2. Caching Configuration

```bash
# Redis caching for workspace data
REDIS_WORKSPACE_TTL=3600
REDIS_TEAM_CACHE_TTL=1800
REDIS_TASK_CACHE_TTL=900
```

### 3. API Rate Limiting

```bash
# Configure rate limits
WORKSPACE_API_RATE_LIMIT=100
WORKSPACE_API_RATE_WINDOW=60
```

## Maintenance Tasks

### Daily Tasks
- Monitor workspace creation/dissolution rates
- Check notification delivery success rates
- Review security audit logs

### Weekly Tasks
- Analyze workspace performance metrics
- Clean up expired audit logs
- Update workspace templates based on usage

### Monthly Tasks
- Review and optimize database performance
- Update security configurations
- Analyze workspace usage patterns for improvements

## Support and Documentation

### API Documentation
- Workspace API: `/api/workspace-config`
- Team Management: `/api/team`
- Task Management: `/api/task`
- Communication: `/api/workspace-communication`

### User Guides
- [Workspace User Guide](./docs/workspace-user-guide.md)
- [Team Member Onboarding](./docs/team-onboarding.md)
- [Workspace Administration](./docs/workspace-admin.md)

### Best Practices
- [Workspace Security Best Practices](./docs/workspace-security.md)
- [Performance Optimization Guide](./docs/workspace-performance.md)
- [Template Creation Guidelines](./docs/workspace-templates.md)

For additional support, check the troubleshooting section or contact the development team.