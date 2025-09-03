#!/bin/bash

echo "Deploying Edge Functions to Supabase..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Deploy get-realtime-token function
echo "Deploying get-realtime-token function..."
cd /workspace
supabase functions deploy get-realtime-token \
  --project-ref ufgqmqoykddaotdbwteg \
  --no-verify-jwt

# Deploy realtime-voice-proxy function
echo "Deploying realtime-voice-proxy function..."
supabase functions deploy realtime-voice-proxy \
  --project-ref ufgqmqoykddaotdbwteg \
  --no-verify-jwt

# Deploy stripe-webhook function
echo "Deploying stripe-webhook function..."
supabase functions deploy stripe-webhook \
  --project-ref ufgqmqoykddaotdbwteg \
  --no-verify-jwt

echo "Edge functions deployed successfully!"
echo ""
echo "Make sure to set the following secrets in your Supabase project:"
echo "  - OPENAI_API_KEY: Your OpenAI API key"
echo "  - STRIPE_SECRET_KEY: Your Stripe secret key (if using payments)"
echo "  - STRIPE_WEBHOOK_SECRET: Your Stripe webhook secret (if using payments)"