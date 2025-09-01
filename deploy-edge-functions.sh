#!/bin/bash

# Deploy Supabase Edge Functions Script
# Requires Supabase CLI to be installed

echo "🚀 Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "supabase/functions" ]; then
    echo "❌ supabase/functions directory not found."
    echo "Please run this script from the project root."
    exit 1
fi

echo "📦 Deploying openai-proxy function..."
supabase functions deploy openai-proxy

echo "📦 Deploying get-realtime-token function..."
supabase functions deploy get-realtime-token

echo "📦 Deploying test-ai-provider function..."
supabase functions deploy test-ai-provider

echo ""
echo "✅ Edge Functions deployed successfully!"
echo ""
echo "⚠️  Important: Make sure to set the following secrets in Supabase:"
echo ""
echo "1. Set OpenAI API Key:"
echo "   supabase secrets set OPENAI_API_KEY=sk-your-key-here"
echo ""
echo "2. (Optional) Set OpenAI Organization ID:"
echo "   supabase secrets set OPENAI_ORG_ID=org-your-org-id"
echo ""
echo "3. Verify secrets are set:"
echo "   supabase secrets list"
echo ""
echo "📝 Note: After setting secrets, the functions will automatically use them."