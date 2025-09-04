#!/bin/bash

# Production Migration Script
echo "🚀 Applying all migrations to production Supabase..."

# Set production environment
export SUPABASE_URL="https://ufgqmqoykddaotdbwteg.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo"

# Apply migrations using npx supabase
echo "📦 Linking to production project..."
npx supabase link --project-ref ufgqmqoykddaotdbwteg

echo "🔄 Pushing migrations to production..."
npx supabase db push

echo "✅ Migration completed successfully!"
echo "🌐 Production database is now ready at: https://ufgqmqoykddaotdbwteg.supabase.co"
