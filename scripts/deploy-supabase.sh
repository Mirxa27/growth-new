#!/bin/bash

# Supabase Deployment Script
# Deploys all database migrations and edge functions

set -e

echo "🗄️ Supabase Deployment for Newomen Platform"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ".env.local" ]; then
    source .env.local
    echo -e "${GREEN}✅ Loaded environment variables${NC}"
else
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi

# Validate Supabase configuration
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Missing Supabase configuration${NC}"
    echo "Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    exit 1
fi

echo -e "${GREEN}✅ Supabase configuration validated${NC}"

# Function to deploy database schema
deploy_database() {
    echo -e "${BLUE}🗄️ Deploying database schema...${NC}"
    
    echo -e "${YELLOW}📝 Please run the following SQL in your Supabase SQL Editor:${NC}"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg/sql"
    echo "2. Copy and paste the contents of: APPLY_MIGRATIONS_DIRECT.sql"
    echo "3. Click 'Run' to execute the migration"
    echo ""
    echo -e "${BLUE}This will create:${NC}"
    echo "   • All assessment tables with proper RLS policies"
    echo "   • Database functions for assessment operations"
    echo "   • Sample assessments and questions"
    echo "   • Admin verification functions"
    echo ""
    
    read -p "Press Enter after running the SQL migration..."
    
    echo -e "${GREEN}✅ Database schema deployment completed${NC}"
}

# Function to deploy edge functions
deploy_edge_functions() {
    echo -e "${BLUE}🔧 Deploying edge functions...${NC}"
    
    # Check if Supabase CLI is available
    if command -v supabase &> /dev/null; then
        echo -e "${BLUE}📦 Using Supabase CLI...${NC}"
        
        # Deploy all functions
        supabase functions deploy get-realtime-token
        supabase functions deploy ai-content-generator  
        supabase functions deploy create-admin-token
        
        # Set environment variables for functions
        echo -e "${BLUE}🔑 Setting function environment variables...${NC}"
        supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY" 2>/dev/null || echo "⚠️ OpenAI key not set"
        supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
        supabase secrets set JWT_SECRET="$JWT_SECRET" 2>/dev/null || echo "⚠️ JWT secret not set"
        
        echo -e "${GREEN}✅ Edge functions deployed via CLI${NC}"
    else
        echo -e "${YELLOW}⚠️ Supabase CLI not available${NC}"
        echo -e "${BLUE}📝 Manual edge function deployment:${NC}"
        echo ""
        echo "1. Go to: https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg/functions"
        echo "2. Create these functions manually:"
        echo "   • get-realtime-token (copy from supabase/functions/get-realtime-token/index.ts)"
        echo "   • ai-content-generator (copy from supabase/functions/ai-content-generator/index.ts)"
        echo "   • create-admin-token (copy from supabase/functions/create-admin-token/index.ts)"
        echo ""
        echo "3. Set environment variables in function settings:"
        echo "   • OPENAI_API_KEY=your_openai_key"
        echo "   • SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
        echo ""
        
        read -p "Press Enter after deploying edge functions manually..."
        echo -e "${GREEN}✅ Edge functions deployment completed${NC}"
    fi
}

# Function to verify deployment
verify_deployment() {
    echo -e "${BLUE}🔍 Verifying Supabase deployment...${NC}"
    
    # Test database connection
    echo -e "${BLUE}   📊 Testing database connection...${NC}"
    
    # Test API endpoint
    local api_test=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $VITE_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
        "$VITE_SUPABASE_URL/rest/v1/assessments?select=id&limit=1")
    
    if [ "$api_test" = "200" ]; then
        echo -e "${GREEN}   ✅ Database API responding correctly${NC}"
    else
        echo -e "${YELLOW}   ⚠️ Database API returned status: $api_test${NC}"
    fi
    
    # Test edge functions
    echo -e "${BLUE}   🔧 Testing edge functions...${NC}"
    
    local function_test=$(curl -s -o /dev/null -w "%{http_code}" \
        "$VITE_SUPABASE_URL/functions/v1/get-realtime-token")
    
    if [ "$function_test" = "401" ]; then
        echo -e "${GREEN}   ✅ Edge functions responding (401 expected without auth)${NC}"
    else
        echo -e "${YELLOW}   ⚠️ Edge function returned status: $function_test${NC}"
    fi
    
    echo -e "${GREEN}✅ Supabase deployment verification completed${NC}"
}

# Function to show next steps
show_next_steps() {
    echo -e "${BLUE}\n📋 Next Steps After Supabase Deployment${NC}"
    echo "========================================"
    echo ""
    echo -e "${YELLOW}1. Verify Database Setup:${NC}"
    echo "   • Check that all tables exist in Supabase dashboard"
    echo "   • Verify RLS policies are enabled"
    echo "   • Test public assessment queries"
    echo ""
    echo -e "${YELLOW}2. Configure Admin User:${NC}"
    echo "   • Create admin user account"
    echo "   • Set role = 'admin' or is_admin = true in user_profiles"
    echo "   • Test admin panel access"
    echo ""
    echo -e "${YELLOW}3. Test Edge Functions:${NC}"
    echo "   • Verify get-realtime-token function works"
    echo "   • Test AI content generation (with valid OpenAI key)"
    echo "   • Check admin token creation"
    echo ""
    echo -e "${YELLOW}4. Deploy Web Application:${NC}"
    echo "   npm run build:production"
    echo "   npm run deploy:vercel"
    echo ""
    echo -e "${YELLOW}5. Deploy Mobile App:${NC}"
    echo "   ./scripts/build-ios.sh --testflight"
    echo ""
}

# Main deployment process
main() {
    echo -e "${GREEN}🎯 Starting Supabase deployment...${NC}\n"
    
    # Deploy database
    deploy_database
    
    # Deploy edge functions
    deploy_edge_functions
    
    # Verify deployment
    verify_deployment
    
    # Show next steps
    show_next_steps
    
    echo -e "${GREEN}\n🎉 Supabase deployment completed!${NC}"
    echo -e "${BLUE}🚀 Backend is ready for the Newomen Platform${NC}"
}

# Run the main function
main "$@"