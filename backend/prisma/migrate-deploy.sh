#!/bin/bash
# Neon Migration Deployment Script
# This script applies Prisma migrations to a Neon database

set -e

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Check if we're using Neon (contains neon.tech)
if [[ "$DATABASE_URL" != *"neon.tech"* ]]; then
    echo "Warning: DATABASE_URL does not appear to be a Neon connection string"
    echo "This script is optimized for Neon PostgreSQL"
fi

# For migrations, use direct connection (remove pgbouncer if present)
MIGRATE_DB_URL="$DATABASE_URL"
if [[ "$DATABASE_URL" == *"pgbouncer=true"* ]]; then
    MIGRATE_DB_URL="${DATABASE_URL//pgbouncer=true/pgbouncer=false}"
    echo "Using direct connection for migrations (pgbouncer disabled)"
fi

# Set temporary DATABASE_URL for migration command
export DATABASE_URL="$MIGRATE_DB_URL"

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Migrations applied successfully"
