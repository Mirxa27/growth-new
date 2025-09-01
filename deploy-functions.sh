#!/bin/bash

echo "🚀 Deploying Supabase Edge Functions with fixes..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "📦 Deploying Edge Functions..."

# Deploy each function
echo "1. Deploying get-realtime-token..."
supabase functions deploy get-realtime-token --no-verify-jwt

echo "2. Deploying openai-proxy..."
supabase functions deploy openai-proxy --no-verify-jwt

echo "3. Deploying test-ai-provider..."
supabase functions deploy test-ai-provider --no-verify-jwt

echo ""
echo "✅ Edge Functions deployed!"
echo ""
echo "⚠️  Don't forget to set secrets if not already done:"
echo "   supabase secrets set OPENAI_API_KEY=sk-your-key"
echo ""
echo "📝 To verify deployment:"
echo "   supabase functions list"