#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  source .env
fi

# Check for required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file"
  exit 1
fi

# Read the SQL content
SQL_CONTENT=$(cat supabase/migrations/20250904080000_create_exec_sql_function.sql)

# Make the API request
curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$SQL_CONTENT\"}"

echo "Migration applied successfully via REST API."