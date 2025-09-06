#!/bin/bash

echo "🚀 Deploying Newomen - AI-Powered Personal Growth Platform"
echo "======================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Build the project
echo "📦 Building the project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "🔧 Applying database migrations..."
    
    # Apply all migrations
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo "✅ Database migrations applied successfully!"
    else
        echo "⚠️  Database migrations failed. You may need to apply them manually."
        echo "   Please run the SQL in apply-critical-migrations.sql in your Supabase dashboard."
    fi
else
    echo "⚠️  Supabase CLI not found. Please apply database migrations manually:"
    echo "   1. Go to your Supabase project dashboard"
    echo "   2. Navigate to SQL Editor"
    echo "   3. Copy and paste the contents of apply-critical-migrations.sql"
    echo "   4. Execute the SQL script"
fi

# Check environment variables
echo "🔍 Checking environment configuration..."

if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key

# OpenAI Configuration (required for AI features)
VITE_OPENAI_API_KEY=your-openai-api-key-here

# Optional: PayPal Configuration (for subscriptions)
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
VITE_PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Environment
NODE_ENV=production
EOF
    echo "📝 Created .env template. Please update with your actual keys."
fi

# Deployment options
echo ""
echo "🚀 Deployment Options:"
echo "======================"
echo ""
echo "1. 🌐 Deploy to Vercel:"
echo "   npx vercel --prod"
echo ""
echo "2. 🌊 Deploy to Netlify:"
echo "   npx netlify deploy --prod --dir=dist"
echo ""
echo "3. 📁 Deploy to any static host:"
echo "   Upload the contents of the 'dist' folder"
echo ""

# Check for deployment files
if [ -f "vercel.json" ]; then
    echo "✅ Vercel configuration found"
    echo "   Run: npx vercel --prod"
fi

if [ -f "netlify.toml" ]; then
    echo "✅ Netlify configuration found"
    echo "   Run: npx netlify deploy --prod --dir=dist"
fi

echo ""
echo "🎯 Pre-deployment Checklist:"
echo "============================"
echo "✅ Build successful"
echo "⚠️  Database migrations (apply apply-critical-migrations.sql manually if needed)"
echo "⚠️  Environment variables (.env file with real API keys)"
echo "⚠️  Domain configuration (if using custom domain)"
echo ""

echo "📋 Post-deployment Steps:"
echo "========================="
echo "1. Test the application in production"
echo "2. Verify AI chat functionality (requires OpenAI API key)"
echo "3. Test voice features (requires HTTPS in production)"
echo "4. Configure custom domain and SSL (if applicable)"
echo "5. Set up monitoring and analytics"
echo ""

echo "🎉 Newomen is ready for deployment!"
echo "   A groundbreaking AI-powered platform for women's personal growth"
echo ""
echo "💡 Need help? Check these files:"
echo "   - NEWOMEN_IMPLEMENTATION_COMPLETE.md"
echo "   - COMPREHENSIVE_FIX_COMPLETE.md"
echo "   - apply-critical-migrations.sql"
echo ""

# Final success message
echo "✨ Transform women's lives through AI-powered personal growth! ✨"