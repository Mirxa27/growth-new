#!/bin/bash

echo "🚀 Deploying Edge Functions using npx..."

# Set environment variables
export SUPABASE_ACCESS_TOKEN="sbp_56cf7e690a4dd5b3b63cc2ca8be3e3e9c7a6e5f3"
export SUPABASE_PROJECT_ID="ufgqmqoykddaotdbwteg"

# Function to deploy a single edge function
deploy_function() {
    local func_name=$1
    echo "  → Deploying $func_name..."
    
    cd /workspace
    npx supabase functions deploy "$func_name" \
        --project-ref "$SUPABASE_PROJECT_ID" \
        --no-verify-jwt \
        --legacy-bundle
    
    if [ $? -eq 0 ]; then
        echo "  ✅ $func_name deployed successfully"
    else
        echo "  ❌ Failed to deploy $func_name"
    fi
}

# Deploy each function
echo "📤 Starting edge function deployment..."

deploy_function "get-realtime-token"
deploy_function "realtime-voice-proxy"
deploy_function "create-checkout-session"
deploy_function "stripe-webhook"
deploy_function "process-assessment"
deploy_function "analytics"

echo ""
echo "✅ Edge function deployment completed!"
echo ""
echo "📝 Remember to set these secrets in Supabase Dashboard:"
echo "   https://app.supabase.com/project/ufgqmqoykddaotdbwteg/settings/vault"
echo ""
echo "   Required secrets:"
echo "   - OPENAI_API_KEY"
echo "   - STRIPE_SECRET_KEY (if using payments)"
echo "   - STRIPE_WEBHOOK_SECRET (if using payments)"