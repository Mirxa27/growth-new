#!/bin/bash

echo "🚀 Deploying Edge Functions to Supabase..."

# Check if required environment variables are set
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "❌ Error: SUPABASE_PROJECT_ID is not set"
    echo "Please set it in your .env file or export it:"
    echo "export SUPABASE_PROJECT_ID=your-project-id"
    exit 1
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ Error: SUPABASE_ACCESS_TOKEN is not set"
    echo "Get your access token from: https://app.supabase.com/account/tokens"
    echo "Then set it: export SUPABASE_ACCESS_TOKEN=your-token"
    exit 1
fi

# Deploy the create-assessment function
echo "📦 Deploying create-assessment function..."
npx supabase functions deploy create-assessment \
  --project-ref $SUPABASE_PROJECT_ID \
  --access-token $SUPABASE_ACCESS_TOKEN

if [ $? -eq 0 ]; then
    echo "✅ create-assessment function deployed successfully!"
else
    echo "❌ Failed to deploy create-assessment function"
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo "1. Go to your Supabase Dashboard > Edge Functions"
echo "2. Click on 'create-assessment' function"
echo "3. Add the following environment variables:"
echo "   - OPENAI_API_KEY"
echo "   - ANTHROPIC_API_KEY"
echo "   - GOOGLE_API_KEY"
echo ""
echo "✨ Edge functions deployment completed!"