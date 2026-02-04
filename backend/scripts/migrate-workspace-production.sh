#!/bin/bash

# Workspace Production Migration Script
# Safely migrates workspace-related database changes in production

set -e

# Configuration
BACKUP_DIR="/tmp/workspace-migration-backup-$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/var/log/workspace-migration.log"
MIGRATION_TIMEOUT=300 # 5 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL environment variable is not set"
        exit 1
    fi
    
    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump is not available. Please install PostgreSQL client tools."
        exit 1
    fi
    
    # Check if npx is available
    if ! command -v npx &> /dev/null; then
        error "npx is not available. Please install Node.js."
        exit 1
    fi
    
    # Check if we're in the backend directory
    if [ ! -f "package.json" ] || [ ! -d "prisma" ]; then
        error "This script must be run from the backend directory"
        exit 1
    fi
    
    log "Prerequisites check passed"
}

# Create database backup
create_backup() {
    log "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Extract database connection details from DATABASE_URL
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    
    # Create backup
    BACKUP_FILE="$BACKUP_DIR/workspace_migration_backup.sql"
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
        log "Database backup created: $BACKUP_FILE"
        
        # Compress backup
        gzip "$BACKUP_FILE"
        log "Backup compressed: ${BACKUP_FILE}.gz"
    else
        error "Failed to create database backup"
        exit 1
    fi
}

# Check migration status
check_migration_status() {
    log "Checking current migration status..."
    
    if npx prisma migrate status; then
        log "Migration status check completed"
    else
        error "Failed to check migration status"
        exit 1
    fi
}

# Run workspace-specific pre-migration checks
pre_migration_checks() {
    log "Running pre-migration checks..."
    
    # Check if workspace tables already exist
    WORKSPACE_TABLES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('Workspace', 'TeamMember', 'WorkspaceTask', 'WorkspaceChannel');")
    
    if [ "$WORKSPACE_TABLES" -gt 0 ]; then
        warning "Some workspace tables already exist. This might be a re-run or partial migration."
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Migration cancelled by user"
            exit 0
        fi
    fi
    
    # Check database connection
    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        error "Cannot connect to database"
        exit 1
    fi
    
    # Check available disk space (require at least 1GB)
    AVAILABLE_SPACE=$(df /tmp | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then # 1GB in KB
        error "Insufficient disk space for backup. At least 1GB required."
        exit 1
    fi
    
    log "Pre-migration checks passed"
}

# Run the actual migration
run_migration() {
    log "Starting workspace database migration..."
    
    # Set migration timeout
    timeout "$MIGRATION_TIMEOUT" npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        log "Migration completed successfully"
    elif [ $? -eq 124 ]; then
        error "Migration timed out after $MIGRATION_TIMEOUT seconds"
        exit 1
    else
        error "Migration failed"
        exit 1
    fi
}

# Post-migration verification
post_migration_verification() {
    log "Running post-migration verification..."
    
    # Check if all workspace tables were created
    EXPECTED_TABLES=("Workspace" "TeamMember" "WorkspaceTask" "WorkspaceChannel" "WorkspaceTemplate" "WorkspaceAuditLog")
    
    for table in "${EXPECTED_TABLES[@]}"; do
        TABLE_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table';")
        if [ "$TABLE_EXISTS" -eq 0 ]; then
            error "Table $table was not created"
            exit 1
        else
            log "Table $table verified"
        fi
    done
    
    # Check if workspace indexes were created
    INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename LIKE '%workspace%' OR tablename LIKE '%team%' OR tablename LIKE '%task%';")
    if [ "$INDEX_COUNT" -lt 5 ]; then
        warning "Expected more workspace-related indexes. Current count: $INDEX_COUNT"
    else
        log "Workspace indexes verified"
    fi
    
    # Test basic workspace operations
    log "Testing basic workspace operations..."
    
    # This would typically involve running a test script
    # For now, we'll just check if we can query the tables
    if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Workspace\";" > /dev/null 2>&1; then
        log "Workspace table query test passed"
    else
        error "Failed to query Workspace table"
        exit 1
    fi
    
    log "Post-migration verification completed"
}

# Generate migration report
generate_report() {
    log "Generating migration report..."
    
    REPORT_FILE="$BACKUP_DIR/migration_report.txt"
    
    cat > "$REPORT_FILE" << EOF
Workspace Migration Report
=========================
Date: $(date)
Database: $DB_NAME
Host: $DB_HOST:$DB_PORT
Backup Location: ${BACKUP_FILE}.gz

Migration Status: SUCCESS

Tables Created:
$(psql "$DATABASE_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%workspace%' OR table_name LIKE '%team%' OR table_name LIKE '%task%' ORDER BY table_name;")

Indexes Created:
$(psql "$DATABASE_URL" -t -c "SELECT indexname FROM pg_indexes WHERE tablename LIKE '%workspace%' OR tablename LIKE '%team%' OR tablename LIKE '%task%' ORDER BY indexname;")

Migration Duration: $((SECONDS / 60)) minutes $((SECONDS % 60)) seconds
EOF
    
    log "Migration report generated: $REPORT_FILE"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    
    # Keep backup but remove other temporary files
    find /tmp -name "prisma-*" -type f -mtime +1 -delete 2>/dev/null || true
    
    log "Cleanup completed"
}

# Rollback function (in case of failure)
rollback() {
    error "Migration failed. Initiating rollback..."
    
    if [ -f "${BACKUP_FILE}.gz" ]; then
        log "Restoring from backup..."
        
        # Decompress backup
        gunzip "${BACKUP_FILE}.gz"
        
        # Restore database
        if psql "$DATABASE_URL" < "$BACKUP_FILE"; then
            log "Database restored from backup"
        else
            error "Failed to restore database from backup"
            error "Manual intervention required!"
            exit 1
        fi
    else
        error "No backup file found for rollback"
        error "Manual intervention required!"
        exit 1
    fi
}

# Main execution
main() {
    log "Starting workspace production migration"
    
    # Set up error handling
    trap rollback ERR
    
    # Run migration steps
    check_prerequisites
    pre_migration_checks
    create_backup
    check_migration_status
    run_migration
    post_migration_verification
    generate_report
    cleanup
    
    log "Workspace migration completed successfully!"
    log "Backup location: ${BACKUP_FILE}.gz"
    log "Report location: $BACKUP_DIR/migration_report.txt"
}

# Run main function
main "$@"