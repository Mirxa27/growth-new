#!/bin/bash

# Stop any existing containers
docker stop supabase_db_ufgqmqoykddaotdbwteg 2>/dev/null || true
docker rm supabase_db_ufgqmqoykddaotdbwteg 2>/dev/null || true

# Clean up any existing volumes
docker volume rm supabase_db_ufgqmqoykddaotdbwteg 2>/dev/null || true

# Clear the migrations directory temporarily
mkdir -p migrations_backup
mv supabase/migrations/* migrations_backup/ 2>/dev/null || true

# Start supabase with clean slate
npx supabase start

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Apply our comprehensive schema
DB_URL=$(npx supabase status --output env | grep LOCAL_DB_URL | cut -d= -f2-)
psql "$DB_URL" -f complete_database_reset.sql

# Restore migrations
mv migrations_backup/* supabase/migrations/ 2>/dev/null || true
rmdir migrations_backup 2>/dev/null || true

echo "Database reset complete!"
