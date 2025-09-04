#!/bin/bash

# Apply all migrations to Supabase database
echo "Applying database migrations..."

# --- Configuration ---
# Source .env file if it exists for SUPABASE_DB_URL
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Check for database connection URL
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "Error: SUPABASE_DB_URL is not set. Please add it to your .env or .env.local file."
    echo "It should look like: postgresql://postgres:[YOUR-PASSWORD]@[AWS-REGION].pooler.supabase.com:5432/postgres"
    exit 1
fi

# --- Migration Logic ---
MIGRATIONS_DIR="supabase/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "Migrations directory not found at $MIGRATIONS_DIR"
    exit 1
fi

# Loop through all .sql files in the migrations directory and apply them
for migration_file in $(find "$MIGRATIONS_DIR" -name "*.sql" | sort); do
    echo "Applying migration: $migration_file"
    
    # Execute migration using psql
    psql "$SUPABASE_DB_URL" -f "$migration_file"
    
    # Check for psql command success
    if [ $? -ne 0 ]; then
        echo "Error applying migration $migration_file. Aborting."
        exit 1
    fi
done

echo "All migrations applied successfully!"