#!/bin/bash

echo "🔧 Applying fixes to Supabase..."

# Database URL with escaped password
DB_URL="postgresql://postgres:Mirxa420%24@db.ufgqmqoykddaotdbwteg.supabase.co:5432/postgres"

echo "📝 Applying database fixes..."

# Apply the main fixes
PGPASSWORD='Mirxa420$' psql -h db.ufgqmqoykddaotdbwteg.supabase.co -U postgres -d postgres -f /workspace/FIX_ALL_ERRORS.sql

# Apply PayPal support
PGPASSWORD='Mirxa420$' psql -h db.ufgqmqoykddaotdbwteg.supabase.co -U postgres -d postgres -f /workspace/supabase/migrations/20240114_add_paypal_support.sql

echo "✅ Database fixes applied!"

echo ""
echo "📋 Manual steps required:"
echo ""
echo "1. Deploy Edge Functions:"
echo "   - test-ai-provider"
echo "   - paypal-oauth"
echo "   - create-paypal-subscription"
echo ""
echo "2. Set Edge Function Secrets in Supabase Dashboard:"
echo "   - PAYPAL_CLIENT_ID: Your PayPal client ID"
echo "   - PAYPAL_CLIENT_SECRET: Your PayPal client secret"
echo "   - PAYPAL_MODE: 'sandbox' or 'live'"
echo "   - PAYPAL_WEBHOOK_ID: Your PayPal webhook ID"
echo ""
echo "3. Configure PayPal in your account:"
echo "   - Create a PayPal business account at https://www.paypal.com/sa/business"
echo "   - Get API credentials from https://developer.paypal.com/"
echo "   - Create products and plans in PayPal dashboard"
echo "   - Set up webhooks for subscription events"
echo ""
echo "4. Update your frontend to use PayPal instead of Stripe"