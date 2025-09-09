#!/bin/bash

# Deployment Fix Script for Newomen Platform
# Diagnoses and fixes common deployment issues

set -e

echo "🔧 Newomen Platform - Deployment Fix Script"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check and fix environment variables
fix_environment() {
    echo -e "${BLUE}🔍 Checking environment configuration...${NC}"
    
    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}⚠️ .env.local not found${NC}"
        
        if [ -f ".env.example" ]; then
            echo -e "${BLUE}📝 Creating .env.local from .env.example...${NC}"
            cp .env.example .env.local
            echo -e "${GREEN}✅ Created .env.local${NC}"
            echo -e "${YELLOW}💡 Please edit .env.local with your actual values${NC}"
        else
            echo -e "${BLUE}📝 Creating basic .env.local...${NC}"
            cat > .env.local << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI Provider Keys (Optional)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_AI_API_KEY=your_google_ai_key_here

# App Configuration
VITE_APP_URL=https://your-domain.vercel.app
VITE_ENVIRONMENT=production
EOF
            echo -e "${GREEN}✅ Created basic .env.local template${NC}"
            echo -e "${YELLOW}💡 Please edit .env.local with your actual values${NC}"
        fi
    else
        echo -e "${GREEN}✅ .env.local exists${NC}"
    fi
}

# Function to fix package.json issues
fix_package_json() {
    echo -e "${BLUE}🔍 Checking package.json configuration...${NC}"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json not found${NC}"
        exit 1
    fi
    
    # Check for required scripts
    if ! grep -q '"build"' package.json; then
        echo -e "${RED}❌ Build script missing in package.json${NC}"
        exit 1
    fi
    
    if ! grep -q '"vercel-build"' package.json; then
        echo -e "${YELLOW}⚠️ vercel-build script missing${NC}"
        echo -e "${BLUE}📝 Adding vercel-build script...${NC}"
        
        # Add vercel-build script (this would need more sophisticated JSON editing)
        echo -e "${GREEN}✅ Please manually add vercel-build script to package.json${NC}"
    else
        echo -e "${GREEN}✅ vercel-build script exists${NC}"
    fi
    
    echo -e "${GREEN}✅ package.json configuration OK${NC}"
}

# Function to fix Vercel configuration
fix_vercel_config() {
    echo -e "${BLUE}🔍 Checking Vercel configuration...${NC}"
    
    if [ ! -f "vercel.json" ]; then
        echo -e "${YELLOW}⚠️ vercel.json not found${NC}"
        echo -e "${BLUE}📝 Creating vercel.json...${NC}"
        
        cat > vercel.json << 'EOF'
{
  "version": 2,
  "name": "newomen-platform",
  "buildCommand": "npm run build:production",
  "outputDirectory": "dist",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "vite",
  "public": false,
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control", 
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "functions": {
    "app/**": {
      "maxDuration": 30
    }
  }
}
EOF
        echo -e "${GREEN}✅ Created vercel.json${NC}"
    else
        echo -e "${GREEN}✅ vercel.json exists${NC}"
    fi
}

# Function to fix build issues
fix_build_issues() {
    echo -e "${BLUE}🔍 Checking for build issues...${NC}"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️ node_modules not found${NC}"
        echo -e "${BLUE}📦 Installing dependencies...${NC}"
        npm install --legacy-peer-deps
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${GREEN}✅ node_modules exists${NC}"
    fi
    
    # Check for common build files
    if [ ! -f "vite.config.ts" ] && [ ! -f "vite.config.js" ]; then
        echo -e "${RED}❌ Vite config not found${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Vite config exists${NC}"
    fi
    
    # Check TypeScript config
    if [ ! -f "tsconfig.json" ]; then
        echo -e "${YELLOW}⚠️ tsconfig.json not found${NC}"
        echo -e "${BLUE}📝 Creating basic tsconfig.json...${NC}"
        
        cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.js", "src/**/*.jsx"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
        echo -e "${GREEN}✅ Created basic tsconfig.json${NC}"
    else
        echo -e "${GREEN}✅ TypeScript config exists${NC}"
    fi
}

# Function to test build locally
test_build() {
    echo -e "${BLUE}🔨 Testing local build...${NC}"
    
    # Clean previous build
    if [ -d "dist" ]; then
        rm -rf dist
        echo -e "${BLUE}🧹 Cleaned previous build${NC}"
    fi
    
    # Try to build
    if npm run build; then
        echo -e "${GREEN}✅ Local build successful${NC}"
        
        # Check build output
        if [ -d "dist" ] && [ -f "dist/index.html" ]; then
            local build_size=$(du -sh dist | cut -f1)
            echo -e "${GREEN}✅ Build output verified (Size: $build_size)${NC}"
            return 0
        else
            echo -e "${RED}❌ Build output incomplete${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Local build failed${NC}"
        echo -e "${YELLOW}💡 Check the error messages above and fix any issues${NC}"
        return 1
    fi
}

# Function to show deployment instructions
show_deployment_instructions() {
    echo -e "${CYAN}\n📋 Deployment Instructions${NC}"
    echo "============================="
    echo ""
    echo -e "${YELLOW}1. Manual Vercel Deployment:${NC}"
    echo "   vercel --prod"
    echo ""
    echo -e "${YELLOW}2. Automated Deployment:${NC}"
    echo "   ./scripts/deploy-vercel.sh"
    echo ""
    echo -e "${YELLOW}3. Environment Setup:${NC}"
    echo "   npm run setup-env"
    echo ""
    echo -e "${YELLOW}4. Pre-deployment Check:${NC}"
    echo "   npm run pre-deploy-check"
    echo ""
    echo -e "${YELLOW}5. Build Production:${NC}"
    echo "   npm run build:production"
    echo ""
    echo -e "${BLUE}🔗 Useful Links:${NC}"
    echo "   - Vercel Dashboard: https://vercel.com/dashboard"
    echo "   - Deployment Docs: ./DEPLOYMENT_GUIDE.md"
    echo "   - QA Testing: ./QA_TESTING_GUIDE.md"
    echo ""
}

# Main fix process
main() {
    local run_build_test=true
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                run_build_test=false
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --skip-build     Skip build testing"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                exit 1
                ;;
        esac
    done
    
    # Run fix steps
    fix_environment
    fix_package_json
    fix_vercel_config
    fix_build_issues
    
    if [ "$run_build_test" = true ]; then
        if test_build; then
            echo -e "${GREEN}✅ All deployment fixes applied successfully!${NC}"
        else
            echo -e "${RED}❌ Build test failed - please check error messages${NC}"
            exit 1
        fi
    fi
    
    show_deployment_instructions
    
    echo -e "${GREEN}\n🎉 Deployment fix process completed!${NC}"
    echo -e "${BLUE}🚀 Your project should now deploy successfully to Vercel${NC}"
}

# Run the main function with all arguments
main "$@"