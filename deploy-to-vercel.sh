#!/bin/bash

echo "🚀 Deploying Newomen.me to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📝 Post-deployment steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Add your custom domain if needed"
echo "3. Test the deployment URL"