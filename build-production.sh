#!/bin/bash

echo "🏗️  Production Build Script"
echo "=========================="
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf node_modules/.vite

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

# Set production environment
export NODE_ENV=production
export VITE_APP_VERSION=$(date +%s)

# Create optimized build
echo "🔨 Creating optimized production build..."
npx vite build --mode production

# Check build output
if [ -f "dist/index.html" ]; then
    echo "✅ Build successful!"
    
    # Show build size
    echo ""
    echo "📊 Build Statistics:"
    du -sh dist/
    echo ""
    find dist -name "*.js" -o -name "*.css" | while read file; do
        size=$(du -h "$file" | cut -f1)
        echo "  $file: $size"
    done
    
    # Create _redirects for Netlify
    echo "/* /index.html 200" > dist/_redirects
    
    # Create .nojekyll for GitHub Pages
    touch dist/.nojekyll
    
    echo ""
    echo "✅ Production build ready!"
else
    echo "❌ Build failed!"
    exit 1
fi