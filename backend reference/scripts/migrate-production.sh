#!/bin/bash

# Production database migration script
set -e

echo "Starting production database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Check if we can connect to the database
echo "Testing database connection..."
npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Error: Cannot connect to database"
    exit 1
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Verify migration status
echo "Verifying migration status..."
npx prisma migrate status

echo "Production database migration completed successfully!"