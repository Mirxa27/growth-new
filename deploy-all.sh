#!/bin/bash

# Complete Deployment Script for NewMe App
# Run this to deploy everything

echo "🚀 Starting Complete Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Creating .env from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your actual keys${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Step 1: Install Dependencies
echo -e "\n${GREEN}📦 Installing dependencies...${NC}"
npm install

# Step 2: Build the application
echo -e "\n${GREEN}🔨 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Step 3: Deploy Edge Functions (if Supabase CLI is installed)
if command -v supabase &> /dev/null; then
    echo -e "\n${GREEN}☁️  Deploying Edge Functions...${NC}"
    
    # Deploy test-ai-provider function
    supabase functions deploy test-ai-provider
    
    # Deploy get-realtime-token function
    supabase functions deploy get-realtime-token
    
    # Set secrets
    if [ ! -z "$VITE_OPENAI_API_KEY" ]; then
        echo "Setting OpenAI API key..."
        supabase secrets set OPENAI_API_KEY=$VITE_OPENAI_API_KEY
    fi
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Skipping Edge Functions deployment.${NC}"
    echo "Install with: npm install -g supabase"
fi

# Step 4: Deploy to Vercel
if command -v vercel &> /dev/null; then
    echo -e "\n${GREEN}🚀 Deploying to Vercel...${NC}"
    vercel --prod
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found.${NC}"
    echo "Install with: npm install -g vercel"
    echo "Or push to GitHub for automatic deployment"
fi

# Step 5: Run database migrations
echo -e "\n${GREEN}🗄️  Database Migrations${NC}"
echo "Run these SQL commands in Supabase SQL Editor:"
echo "----------------------------------------"
cat << 'EOF'
-- System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings"
    ON public.system_settings FOR SELECT USING (true);

-- Profile Updates
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;

-- Default OpenAI Settings
INSERT INTO public.system_settings (category, settings)
VALUES ('openai', '{
    "apiKey": "",
    "chatModel": "gpt-4o-mini",
    "realtimeModel": "gpt-realtime-2025-08-28",
    "temperature": 0.7,
    "maxTokens": 2000
}'::jsonb)
ON CONFLICT (category) DO NOTHING;
EOF
echo "----------------------------------------"

# Step 6: Final checks
echo -e "\n${GREEN}✅ Deployment Process Complete!${NC}"
echo ""
echo "Next Steps:"
echo "1. ✏️  Set environment variables in Vercel Dashboard"
echo "2. 🗄️  Run database migrations in Supabase"
echo "3. 🔑 Configure OpenAI API key in admin panel"
echo "4. 👤 Make yourself admin by updating profiles table"
echo "5. 🧪 Test the application"
echo ""
echo "Application URLs:"
echo "- Production: https://your-app.vercel.app"
echo "- Admin Panel: https://your-app.vercel.app/admin"
echo "- Dashboard: https://your-app.vercel.app/dashboard"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"