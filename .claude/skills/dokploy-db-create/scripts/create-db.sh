#!/bin/bash
set -euo pipefail

# Dokploy PostgreSQL Database Provisioning Script
# Usage: ./create-db.sh <db_name> <username> <password>

DB_NAME="${1:?Usage: $0 <db_name> <username> <password>}"
DB_USER="${2:?Usage: $0 <db_name> <username> <password>}"
DB_PASS="${3:?Usage: $0 <db_name> <username> <password>}"

# Configuration - adjust for your Dokploy setup
PG_CONTAINER="${PG_CONTAINER:-shared-postgres-db}"
PG_SUPERUSER="${PG_SUPERUSER:-postgres}"
PG_HOST="${PG_HOST:-shared-postgres-db.internal}"
PG_PORT="${PG_PORT:-5432}"

echo "🔧 Provisioning database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Container: $PG_CONTAINER"

# Function to run psql in container
run_psql() {
    docker exec -i "$PG_CONTAINER" psql -U "$PG_SUPERUSER" "$@"
}

# 1. Create database (if not exists)
echo "📦 Creating database..."
run_psql -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    run_psql -c "CREATE DATABASE $DB_NAME;"
echo "✅ Database '$DB_NAME' ready"

# 2. Create user (if not exists)
echo "👤 Creating user..."
run_psql -c "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
    run_psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
# Update password in case user exists
run_psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
echo "✅ User '$DB_USER' ready"

# 3. Grant permissions
echo "🔑 Granting permissions..."
run_psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
run_psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
run_psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
run_psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"
echo "✅ Permissions granted"

# 4. Revoke public access for isolation
echo "🔒 Enforcing isolation..."
run_psql -c "REVOKE ALL ON DATABASE $DB_NAME FROM PUBLIC;"
echo "✅ Public access revoked"

# 5. Verify user can connect to their database
echo "🧪 Testing user connection..."
if docker exec "$PG_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" >/dev/null 2>&1; then
    echo "✅ User can connect to $DB_NAME"
else
    echo "❌ FAILED: User cannot connect to $DB_NAME"
    exit 1
fi

# 6. Verify user CANNOT connect to postgres database
echo "🧪 Testing isolation..."
if docker exec "$PG_CONTAINER" psql -U "$DB_USER" -d postgres -c "SELECT 1" >/dev/null 2>&1; then
    echo "⚠️  WARNING: User can access postgres database (isolation may be weak)"
else
    echo "✅ User correctly isolated from postgres database"
fi

# Output connection string
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 DATABASE_URL for $DB_NAME:"
echo "postgresql://$DB_USER:$DB_PASS@$PG_HOST:$PG_PORT/$DB_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Database provisioning complete!"
