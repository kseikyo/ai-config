---
name: dokploy-db-create
description: Set up reusable Dokploy PostgreSQL infrastructure and provision isolated application databases and users. Use when creating a new PostgreSQL database/user in Dokploy or standardizing shared Dokploy Postgres setup.
---

# Dokploy PostgreSQL Setup & DB Provisioning Skill

## TL;DR

> **Summary**: Create reusable Dokploy PostgreSQL infrastructure with a bash-based skill for provisioning new databases with proper user isolation.
>
> **Deliverables**:
> - Shared PostgreSQL service in Dokploy (`shared-postgres` project)
> - Reusable `dokploy-db-create` skill (bash script + SKILL.md)
> - `promo_history` database with `ph_app` user provisioned
> - Data migrated from Railway (when available)
> - promo-history app deployed to Dokploy
>
> **Estimated Effort**: Medium (8 atomic tasks)
> **Parallel Execution**: Partial (Wave 1 parallel)

---

## Execution Waves

```
Wave 0: Infrastructure Setup
├── [0] Deploy PostgreSQL 17 in Dokploy shared-postgres project
└── [1] Create dokploy-db-create skill (bash script + SKILL.md)
              │
Wave 1: Provisioning (parallel after Wave 0)
├── [2] Provision promo_history DB using skill
├── [3] Export Railway data (when available) ◀── BLOCKER
└── [4] Update docker-compose.yml for Dokploy
              │
Wave 2: Deployment
├── [5] Import Railway data to Dokploy PostgreSQL
├── [6] Deploy promo-history app to Dokploy
└── [7] Verify deployment + update webhooks
```

---

## Atomic Tasks

### Wave 0: Infrastructure Setup

---

#### [0] Deploy PostgreSQL 17 in Dokploy

**What to do**:
1. In Dokploy UI (http://77.42.65.235:3000/), create project `shared-postgres`
2. Add PostgreSQL 17 database service
3. Configure persistent volume for data
4. Note internal hostname (e.g., `shared-postgres-db.internal`)
5. Set strong superuser password, store in password manager

**Manual Steps** (Dokploy UI):
```
Project -> Create "shared-postgres"
Service -> Add Database -> PostgreSQL 17
Environment:
  POSTGRES_PASSWORD=<generate-strong-password>
  PGDATA=/var/lib/postgresql/data
Volume: /var/lib/postgresql/data -> persistent
Network: dokploy-network (internal)
```

**Must NOT do**:
- Expose PostgreSQL port publicly
- Use weak passwords
- Skip persistent volume

**Acceptance**:
```bash
# From Dokploy VPS (ssh)
docker exec shared-postgres-db psql -U postgres -c "SELECT version();"
# Assert: PostgreSQL 17.x
```

---

#### [1] Create dokploy-db-create Skill

**What to do**:
1. Create skill directory: `~/.claude/skills/dokploy-db-create/`
2. Create `SKILL.md` with instructions
3. Create `scripts/create-db.sh` bash script
4. Script must: create database, create user, grant permissions, verify isolation

**Files to Create**:

**`~/.claude/skills/dokploy-db-create/SKILL.md`**:
```markdown
---
name: dokploy-db-create
description: Create PostgreSQL database with isolated user in Dokploy shared-postgres. Use when provisioning new database for a project. Triggers on "create database", "provision db", "new dokploy db", "add database to dokploy".
allowed-tools:
  - Bash
---

# Dokploy Database Provisioning

Create isolated PostgreSQL databases in Dokploy's shared-postgres service.

## Prerequisites

- SSH access to Dokploy VPS
- `shared-postgres` project with PostgreSQL 17 running
- Superuser password (stored securely)

## Usage

Run the provisioning script:

```bash
# From Dokploy VPS
~/.claude/skills/dokploy-db-create/scripts/create-db.sh <db_name> <username> <password>

# Example
./create-db.sh promo_history ph_app "$(openssl rand -base64 24)"
```

## What the Script Does

1. Creates database `<db_name>`
2. Creates user `<username>` with password
3. Grants ALL on database to user
4. Grants ALL on schema public to user
5. Revokes public access (isolation)
6. Verifies user can connect
7. Verifies user CANNOT access other databases

## Output

```
✅ Database 'promo_history' created
✅ User 'ph_app' created
✅ Permissions granted
✅ Isolation verified
📋 CONNECTION_STRING: postgresql://ph_app:xxx@shared-postgres-db.internal:5432/promo_history
```

## Security Model

- Each project gets its own database + user
- User has NO access to other databases
- User has NO superuser privileges
- Password must be strong (min 24 chars recommended)

## Verification Commands

```bash
# Test user can access their database
PGPASSWORD=xxx psql -h shared-postgres-db.internal -U ph_app -d promo_history -c "SELECT 1"

# Test user CANNOT access postgres database (should fail)
PGPASSWORD=xxx psql -h shared-postgres-db.internal -U ph_app -d postgres -c "SELECT 1"
```
```

**`~/.claude/skills/dokploy-db-create/scripts/create-db.sh`**:
```bash
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
```

**Acceptance**:
```bash
# Skill file exists
test -f ~/.claude/skills/dokploy-db-create/SKILL.md && echo "SKILL.md exists"

# Script exists and is executable
test -x ~/.claude/skills/dokploy-db-create/scripts/create-db.sh && echo "Script executable"

# Skill discoverable (check via mcp_skill)
# Assert: "dokploy-db-create" appears in available skills
```

**Commit**: `feat: add dokploy-db-create skill for database provisioning`

---

### Wave 1: Provisioning

---

#### [2] Provision promo_history Database Using Skill

**What to do**:
1. SSH to Dokploy VPS
2. Run the skill script to create `promo_history` database
3. Generate strong password, store securely
4. Record DATABASE_URL for app deployment

**Commands**:
```bash
# SSH to Dokploy VPS
ssh root@77.42.65.235

# Generate password
PH_PASSWORD=$(openssl rand -base64 24)
echo "Generated password: $PH_PASSWORD"  # Store this securely!

# Run provisioning script
~/.claude/skills/dokploy-db-create/scripts/create-db.sh promo_history ph_app "$PH_PASSWORD"

# Save connection URL
echo "postgresql://ph_app:$PH_PASSWORD@shared-postgres-db.internal:5432/promo_history"
```

**Acceptance**:
```bash
# User can connect
docker exec shared-postgres-db psql -U ph_app -d promo_history -c "SELECT current_database();"
# Assert: "promo_history"

# User isolated
docker exec shared-postgres-db psql -U ph_app -d postgres -c "SELECT 1" 2>&1 | grep -q "denied\|failed"
# Assert: connection fails
```

---

#### [3] Export Railway PostgreSQL Data

**Status**: BLOCKED (Railway connection issues)

**What to do** (when unblocked):
```bash
# Get Railway DATABASE_URL from Railway dashboard
export RAILWAY_DB_URL="postgresql://..."

# Export with pg_dump
pg_dump --no-owner --no-acl "$RAILWAY_DB_URL" > .sisyphus/data/railway-dump.sql

# Verify dump
head -20 .sisyphus/data/railway-dump.sql | grep -q "PostgreSQL database dump"

# Record baseline counts
psql "$RAILWAY_DB_URL" -c "SELECT 'partners', COUNT(*) FROM partners UNION ALL SELECT 'transfer_bonuses', COUNT(*) FROM transfer_bonuses" > .sisyphus/evidence/baseline-counts.txt
```

**Acceptance**:
```bash
test -f .sisyphus/data/railway-dump.sql && echo "Dump exists"
grep -c "CREATE TABLE" .sisyphus/data/railway-dump.sql  # Assert: >= 9 tables
```

---

#### [4] Update docker-compose.yml for Dokploy

**What to do**:
- Verify docker-compose.yml is app-only (already done per existing file)
- Update VITE_BETTER_AUTH_URL build arg for Dokploy domain
- Ensure DATABASE_URL uses shared-postgres internal hostname

**Files**: `docker-compose.yml`, `Dockerfile`

**Target docker-compose.yml**:
```yaml
services:
  app:
    build:
      context: .
      args:
        VITE_BETTER_AUTH_URL: https://promo-history.yourdomain.com
    container_name: promo-history-app
    environment:
      DATABASE_URL: ${DATABASE_URL}
      ENABLE_CRON: "true"
      SKIP_ENV_VALIDATION: "true"
    ports:
      - "3000:3000"
    networks:
      - dokploy-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      start_period: 10s
      retries: 3

networks:
  dokploy-network:
    external: true
```

**Acceptance**:
```bash
# Valid YAML
docker compose config --quiet && echo "VALID"

# No postgres/electric services
grep -q "postgres:" docker-compose.yml && echo "FAIL" || echo "PASS"
grep -q "electric" docker-compose.yml && echo "FAIL" || echo "PASS"

# Network configured
grep -q "dokploy-network" docker-compose.yml && echo "PASS"
```

**Commit**: `chore(docker): configure for Dokploy shared postgres`

---

### Wave 2: Deployment

---

#### [5] Import Railway Data to Dokploy

**Depends on**: [3] (Railway export)

**What to do**:
```bash
# Copy dump to Dokploy VPS
scp .sisyphus/data/railway-dump.sql root@77.42.65.235:/tmp/

# Import to promo_history database
ssh root@77.42.65.235 "docker exec -i shared-postgres-db psql -U ph_app -d promo_history < /tmp/railway-dump.sql"

# Verify counts match baseline
ssh root@77.42.65.235 "docker exec shared-postgres-db psql -U ph_app -d promo_history -c \"SELECT 'partners', COUNT(*) FROM partners UNION ALL SELECT 'transfer_bonuses', COUNT(*) FROM transfer_bonuses\""
```

**Acceptance**:
```bash
# Row counts match .sisyphus/evidence/baseline-counts.txt
# Compare output of count query with baseline
```

---

#### [6] Deploy promo-history App to Dokploy

**What to do**:
1. Create `promo-history` project in Dokploy
2. Configure as Docker Compose deployment
3. Set environment variables:
   - `DATABASE_URL=postgresql://ph_app:XXX@shared-postgres-db.internal:5432/promo_history`
   - `ENABLE_CRON=true`
   - Auth env vars (BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, etc.)
4. Connect to `dokploy-network`
5. Deploy and verify health check

**Manual Steps** (Dokploy UI):
```
Project -> Create "promo-history"
Source -> Git (or Docker Compose)
Build -> Dockerfile
Environment Variables -> Set all required
Network -> dokploy-network
Domain -> Configure reverse proxy
Deploy
```

**Acceptance**:
```bash
# Health check passes
curl -s https://promo-history.yourdomain.com/api/health | jq -r '.status'
# Assert: "ok"

# Cron initializes (check logs)
# Assert: "cron" or "scheduled" in recent logs
```

---

#### [7] Verify Deployment + Update Webhooks

**What to do**:
1. Verify app health endpoint
2. Update Google OAuth callback URL
3. Update Telegram webhook
4. Verify auth flow works

**Acceptance**:
```bash
# Health check
curl -s https://promo-history.yourdomain.com/api/health | jq -r '.status'  # == "ok"

# Google OAuth redirect
curl -sI https://promo-history.yourdomain.com/api/auth/signin/google | grep "302"

# Telegram webhook (if applicable)
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" | jq -r '.result.url'
# Assert: Contains new domain
```

---

## Guardrails (Must NOT Have)

| Guardrail | Why |
|-----------|-----|
| **NO superuser access for app users** | Security: least privilege |
| **NO public PostgreSQL port** | Security: internal only |
| **NO hardcoded passwords in scripts** | Security: pass as arguments |
| **NO schema changes** | Out of scope |
| **NO business logic changes** | Out of scope |

---

## Success Criteria

```bash
# 1. Skill is functional and discoverable
test -f ~/.claude/skills/dokploy-db-create/SKILL.md

# 2. promo_history database exists with isolated user
docker exec shared-postgres-db psql -U ph_app -d promo_history -c "SELECT 1"  # Works
docker exec shared-postgres-db psql -U ph_app -d postgres -c "SELECT 1"  # Fails

# 3. App is healthy
curl -s https://promo-history.yourdomain.com/api/health | jq -r '.status'  # "ok"

# 4. Data migrated (when Railway available)
# Row counts match baseline
```

---

## File Locations Summary

| Artifact | Path |
|----------|------|
| Skill SKILL.md | `~/.claude/skills/dokploy-db-create/SKILL.md` |
| Skill script | `~/.claude/skills/dokploy-db-create/scripts/create-db.sh` |
| Railway dump | `.sisyphus/data/railway-dump.sql` |
| Baseline counts | `.sisyphus/evidence/baseline-counts.txt` |
| Docker config | `docker-compose.yml` |

---

## Directives

### Core Directives
- **MUST**: Create skill in `~/.claude/skills/dokploy-db-create/` with proper SKILL.md frontmatter
- **MUST**: Script must be idempotent (safe to run multiple times)
- **MUST**: Verify user isolation after provisioning
- **MUST NOT**: Store passwords in scripts or commits
- **MUST NOT**: Give app users superuser privileges
- **PATTERN**: Follow existing docker-compose.yml structure (app-only)

### QA/Acceptance Criteria Directives
- **MUST**: All acceptance uses executable `docker exec`, `curl`, `psql` commands
- **MUST**: Include exact expected outputs in assertions
- **MUST NOT**: Create criteria requiring "user manually tests..."
- **MUST NOT**: Leave verification to UI inspection
