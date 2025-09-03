#!/bin/bash

echo "🌊 Deploying to Surge.sh (Free Static Hosting)"
echo ""

# Check if surge is installed
if ! command -v surge &> /dev/null; then
    echo "📦 Installing Surge CLI..."
    npm install -g surge
fi

# Build the project
echo "🔨 Building project..."
npm run build || ./emergency-deploy.sh

# Check if build exists
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed. Cannot deploy."
    exit 1
fi

# Generate a unique subdomain
TIMESTAMP=$(date +%s)
DOMAIN="newomen-${TIMESTAMP}.surge.sh"

echo ""
echo "🚀 Deploying to Surge..."
echo "   Domain: $DOMAIN"
echo ""

# Deploy to surge
cd dist
surge . $DOMAIN

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is live at: https://$DOMAIN"
echo ""
echo "📝 To use a custom domain:"
echo "   surge dist yourdomain.surge.sh"