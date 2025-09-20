#!/bin/bash

# Vercel Deployment Script for Newomen Platform
# Handles environment setup, building, and deployment

set -e

echo "🚀 Starting Vercel deployment for Newomen Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Function to check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}⚠️ Vercel CLI not found. Installing...${NC}"
        npm install -g vercel
    fi
    echo -e "${GREEN}✅ Vercel CLI ready${NC}"
}

# Function to validate environment variables
validate_environment() {
    echo -e "${BLUE}🔍 Validating environment variables...${NC}"
    
    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}⚠️ .env.local not found. Creating from .env.example...${NC}"
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            echo -e "${YELLOW}📝 Please edit .env.local with your actual values before continuing${NC}"
            exit 1
        else
            echo -e "${RED}❌ No environment template found${NC}"
            exit 1
        fi
    fi

    # Check required environment variables
    source .env.local
    
    local missing_vars=()
    
    if [ -z "$VITE_SUPABASE_URL" ]; then
        missing_vars+=("VITE_SUPABASE_URL")
    fi
    
    if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        missing_vars+=("VITE_SUPABASE_ANON_KEY")
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        for var in "${missing_vars[@]}"; do
            echo -e "${RED}   - $var${NC}"
        done
        echo -e "${YELLOW}💡 Please set these variables in your .env.local file${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment validation passed${NC}"
}

# Function to set up Vercel environment variables
setup_vercel_env() {
    echo -e "${BLUE}🔧 Setting up Vercel environment variables...${NC}"
    
    # Set environment variables in Vercel
    vercel env add VITE_SUPABASE_URL production < <(echo "$VITE_SUPABASE_URL") 2>/dev/null || true
    vercel env add VITE_SUPABASE_ANON_KEY production < <(echo "$VITE_SUPABASE_ANON_KEY") 2>/dev/null || true
    vercel env add SUPABASE_SERVICE_ROLE_KEY production < <(echo "$SUPABASE_SERVICE_ROLE_KEY") 2>/dev/null || true
    vercel env add OPENAI_API_KEY production < <(echo "$OPENAI_API_KEY") 2>/dev/null || true
    vercel env add ANTHROPIC_API_KEY production < <(echo "$ANTHROPIC_API_KEY") 2>/dev/null || true
    vercel env add GOOGLE_AI_API_KEY production < <(echo "$GOOGLE_AI_API_KEY") 2>/dev/null || true
    vercel env add VITE_APP_URL production < <(echo "$VITE_APP_URL") 2>/dev/null || true
    vercel env add VITE_ENVIRONMENT production < <(echo "production") 2>/dev/null || true
    
    echo -e "${GREEN}✅ Vercel environment variables configured${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install --legacy-peer-deps
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Function to run pre-deployment checks
run_checks() {
    echo -e "${BLUE}🔍 Running pre-deployment checks...${NC}"
    
    # Type checking
    echo -e "${BLUE}🔍 Running type check...${NC}"
    npm run type-check
    
    # Linting
    echo -e "${BLUE}🔍 Running linter...${NC}"
    npm run lint
    
    echo -e "${GREEN}✅ All checks passed${NC}"
}

# Function to build the application
build_application() {
    echo -e "${BLUE}🔨 Building application...${NC}"
    
    # Clean previous builds
    npm run clean
    
    # Build for production
    npm run build:production
    
    if [ ! -d "dist" ]; then
        echo -e "${RED}❌ Build failed - dist directory not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Application built successfully${NC}"
}

# Function to deploy to Vercel
deploy_to_vercel() {
    echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
    
    # Deploy to production
    vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment successful!${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    echo -e "${BLUE}🔍 Verifying deployment...${NC}"
    
    # Get deployment URL
    local deployment_url=$(vercel ls --scope $(vercel whoami) | grep newomen | head -1 | awk '{print $2}')
    
    if [ -n "$deployment_url" ]; then
        echo -e "${GREEN}✅ Deployment URL: https://$deployment_url${NC}"
        
        # Basic health check
        if curl -f -s "https://$deployment_url" > /dev/null; then
            echo -e "${GREEN}✅ Health check passed${NC}"
        else
            echo -e "${YELLOW}⚠️ Health check failed - please verify manually${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ Could not determine deployment URL${NC}"
    fi
}

# Function to show post-deployment instructions
show_instructions() {
    echo -e "${BLUE}📋 Post-Deployment Instructions:${NC}"
    echo ""
    echo -e "${YELLOW}1. Verify the deployment:${NC}"
    echo "   - Check that the homepage loads correctly"
    echo "   - Test anonymous assessment functionality"
    echo "   - Verify admin panel access (if applicable)"
    echo ""
    echo -e "${YELLOW}2. Test key features:${NC}"
    echo "   - Anonymous assessment completion"
    echo "   - User registration and login"
    echo "   - Admin panel functionality"
    echo "   - Mobile responsiveness"
    echo ""
    echo -e "${YELLOW}3. Monitor for issues:${NC}"
    echo "   - Check Vercel dashboard for errors"
    echo "   - Monitor Supabase for database issues"
    echo "   - Review application logs"
    echo ""
    echo -e "${YELLOW}4. Mobile app deployment:${NC}"
    echo "   - Update mobile app configuration with new URL"
    echo "   - Test deep linking functionality"
    echo "   - Rebuild and deploy iOS app if needed"
    echo ""
}

# Main deployment process
main() {
    echo -e "${GREEN}🎯 Newomen Platform - Vercel Deployment${NC}"
    echo "================================================"
    
    # Parse command line arguments
    local skip_checks=false
    local skip_build=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-checks)
                skip_checks=true
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --skip-checks    Skip pre-deployment checks"
                echo "  --skip-build     Skip build process (use existing dist/)"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                exit 1
                ;;
        esac
    done
    
    # Run deployment steps
    check_vercel_cli
    validate_environment
    setup_vercel_env
    install_dependencies
    
    if [ "$skip_checks" = false ]; then
        run_checks
    fi
    
    if [ "$skip_build" = false ]; then
        build_application
    fi
    
    deploy_to_vercel
    verify_deployment
    show_instructions
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}📊 Your Newomen Platform is now live and ready for users${NC}"
}

# Run the main function with all arguments
main "$@"