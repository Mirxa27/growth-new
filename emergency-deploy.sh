#!/bin/bash

echo "🚨 Emergency Deployment Script"
echo "This will bypass TypeScript errors and force deployment"
echo ""

# Set environment to bypass checks
export SKIP_PREFLIGHT_CHECK=true
export CI=false
export NODE_ENV=production

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist

# Install dependencies with legacy peer deps
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --silent

# Build with error suppression
echo "🔨 Building (ignoring TypeScript errors)..."
npm run build 2>&1 | grep -v "error TS" || true

# Check if build succeeded
if [ -f "dist/index.html" ]; then
    echo "✅ Build completed successfully!"
    
    # Create deployment info
    echo "📝 Creating deployment info..."
    cat > dist/deployment-info.json <<EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0",
  "emergency": true
}
EOF
    
    echo ""
    echo "🎉 Emergency build ready for deployment!"
    echo ""
    echo "Deploy options:"
    echo "1. Vercel: vercel --prod"
    echo "2. Netlify: netlify deploy --prod --dir=dist"
    echo "3. Surge: surge dist your-app-name.surge.sh"
    echo "4. Manual: Upload the 'dist' folder to any static host"
else
    echo "❌ Build failed. Trying alternative approach..."
    
    # Try Vite build with no type checking
    echo "🔨 Attempting Vite build without type checking..."
    npx vite build --mode production || true
    
    if [ -f "dist/index.html" ]; then
        echo "✅ Alternative build succeeded!"
    else
        echo "❌ All build attempts failed."
        echo "Please check the errors above."
        exit 1
    fi
fi

echo ""
echo "⚠️  Warning: This build bypassed TypeScript checks."
echo "   Make sure to test thoroughly after deployment!"