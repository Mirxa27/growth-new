#!/bin/bash

# Deployment Script for NewoMen Life Navigation System

set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"

# Environment setup
echo "🔧 Setting up environment..."

if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        cp .env.production .env
        echo -e "${GREEN}✅ Production environment loaded${NC}"
    else
        echo -e "${YELLOW}⚠️  No .env file found. Please create one from .env.example${NC}"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type checking
echo "🔍 Running type checks..."
npx tsc --noEmit || {
    echo -e "${YELLOW}⚠️  Type errors found but continuing...${NC}"
}

# Build the application
echo "🏗️  Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Run post-build optimizations
echo "🎯 Running optimizations..."

# Copy necessary files
cp -r public/* dist/ 2>/dev/null || true

# Create deployment info
echo "📝 Creating deployment info..."
cat > dist/deployment-info.json << EOF
{
  "version": "$(node -p "require('./package.json').version")",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "commitHash": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "environment": "production"
}
EOF

# Deployment options
echo ""
echo "🎉 Build completed! Choose deployment option:"
echo ""
echo "1) Deploy to Vercel"
echo "2) Deploy to Netlify"
echo "3) Deploy to custom server"
echo "4) Skip deployment"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "📤 Deploying to Vercel..."
        if command_exists vercel; then
            vercel --prod
        else
            echo -e "${YELLOW}Vercel CLI not installed. Install with: npm i -g vercel${NC}"
        fi
        ;;
    2)
        echo "📤 Deploying to Netlify..."
        if command_exists netlify; then
            netlify deploy --prod --dir=dist
        else
            echo -e "${YELLOW}Netlify CLI not installed. Install with: npm i -g netlify-cli${NC}"
        fi
        ;;
    3)
        echo "📤 Custom deployment..."
        echo "Your build is ready in the 'dist' directory"
        echo ""
        echo "To serve locally, run:"
        echo "  npx serve dist"
        echo ""
        echo "To deploy to a custom server:"
        echo "  1. Upload the contents of 'dist' to your server"
        echo "  2. Configure your web server to serve index.html for all routes"
        echo "  3. Set up SSL certificates"
        echo "  4. Configure environment variables on your server"
        ;;
    4)
        echo "✅ Build completed. Files are in the 'dist' directory"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "📌 Post-deployment checklist:"
echo "  □ Verify environment variables are set correctly"
echo "  □ Test authentication flow"
echo "  □ Check API connections"
echo "  □ Verify WebRTC functionality"
echo "  □ Test payment integration"
echo "  □ Monitor error logs"
echo ""
echo -e "${GREEN}🎉 Deployment process completed!${NC}"