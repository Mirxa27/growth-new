#!/bin/bash

echo "🚀 Setting up All-App..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories if they don't exist
echo "📁 Creating directories..."
mkdir -p public/images
mkdir -p public/icons

# Initialize Capacitor for iOS
echo "📱 Setting up Capacitor for iOS..."
npx cap init "All-App" "com.allapp.app" --web-dir=out

# Add iOS platform
echo "🍎 Adding iOS platform..."
npx cap add ios

# Build the project
echo "🔨 Building the project..."
npm run build

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your OpenAI API key to .env.local"
echo "2. Run the database schema in Supabase"
echo "3. Start the development server: npm run dev"
echo "4. For iOS development: npx cap open ios"