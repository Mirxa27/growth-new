#!/bin/bash

echo "📱 Building for iOS with Capacitor..."

# Update next.config.js for export
echo "Updating Next.js config for static export..."
sed -i 's|// output: '"'"'export'"'"',|output: '"'"'export'"'"',|g' next.config.js
sed -i 's|// distDir: '"'"'out'"'"',|distDir: '"'"'out'"'"',|g' next.config.js  
sed -i 's|// trailingSlash: true,|trailingSlash: true,|g' next.config.js

# Build the project
echo "Building Next.js app..."
npm run build

# Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync

# Restore next.config.js
echo "Restoring Next.js config..."
sed -i 's|output: '"'"'export'"'"',|// output: '"'"'export'"'"',|g' next.config.js
sed -i 's|distDir: '"'"'out'"'"',|// distDir: '"'"'out'"'"',|g' next.config.js
sed -i 's|trailingSlash: true,|// trailingSlash: true,|g' next.config.js

echo "✅ iOS build complete! Use 'npx cap open ios' to open in Xcode"