#!/bin/bash

# Apply all migrations to Supabase database
echo "Applying database migrations..."

# Set your Supabase project details
SUPABASE_URL="https://ufgqmqoykddaotdbwteg.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Ukcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.o3R_wVHtJN2J2bv9rVTJXj5kH_pLPtqKJmHDkCNhLmY"

# Function to execute SQL via Supabase
execute_sql() {
    local sql_file=$1
    echo "Applying migration: $sql_file"
    
    # Read the SQL file
    sql_content=$(cat "$sql_file")
    
    # Execute via Supabase edge function or direct SQL
    curl -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"sql_query\": $(echo "$sql_content" | jq -Rs .)}"
}

# Apply migrations in order
echo "1. Creating error_logs table..."
execute_sql "/workspace/supabase/migrations/20240113_create_error_logs.sql"

echo "2. Creating performance_metrics table..."
execute_sql "/workspace/supabase/migrations/20240113_performance_metrics.sql"

echo "3. Creating notifications tables..."
execute_sql "/workspace/supabase/migrations/20240113_notifications.sql"

echo "4. Fixing voice tables..."
execute_sql "/workspace/supabase/migrations/20240113_fix_voice_tables.sql"

echo "5. Adding Arabic support column..."
execute_sql "/workspace/supabase/migrations/20240113_add_arabic_support_column.sql"

echo "All migrations applied!"