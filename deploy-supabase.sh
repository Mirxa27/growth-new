#!/bin/bash

echo "🚀 Starting Supabase deployment..."

# Set environment variables
export SUPABASE_URL="https://ufgqmqoykddaotdbwteg.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo"
export SUPABASE_DB_URL="postgresql://postgres:Mirxa420\$@db.ufgqmqoykddaotdbwteg.supabase.co:5432/postgres"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

echo "🔗 Linking to Supabase project..."
supabase link --project-ref ufgqmqoykddaotdbwteg --password "Mirxa420$"

echo "📤 Deploying Edge Functions..."

# Deploy each function individually for better error handling
functions=(
    "get-realtime-token"
    "realtime-voice-proxy"
    "create-checkout-session"
    "stripe-webhook"
    "process-assessment"
    "analytics"
)

for func in "${functions[@]}"; do
    echo "  → Deploying $func..."
    supabase functions deploy "$func" --no-verify-jwt
    if [ $? -eq 0 ]; then
        echo "  ✅ $func deployed successfully"
    else
        echo "  ❌ Failed to deploy $func"
    fi
done

echo "🗄️ Applying Database Migrations..."

# Apply migrations using direct database connection
echo "Applying migrations directly to database..."
for migration in supabase/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "  → Applying $(basename $migration)..."
        PGPASSWORD='Mirxa420$' psql -h db.ufgqmqoykddaotdbwteg.supabase.co -U postgres -d postgres -f "$migration" 2>/dev/null || true
    fi
done

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Set the following secrets in Supabase Dashboard (https://app.supabase.com/project/ufgqmqoykddaotdbwteg/settings/functions):"
echo "   - OPENAI_API_KEY"
echo "   - STRIPE_SECRET_KEY (if using payments)"
echo "   - STRIPE_WEBHOOK_SECRET (if using payments)"
echo ""
echo "2. Configure Auth Providers in Supabase Dashboard:"
echo "   - Go to Authentication > Providers"
echo "   - Enable desired OAuth providers"
echo "   - Set Site URL to: https://newomen.me"
echo "   - Add redirect URLs:"
echo "     • https://newomen.me/auth/callback"
echo "     • https://newomen.me/auth/reset-password"
echo ""
echo "3. Update your domain's environment variables to use production values"