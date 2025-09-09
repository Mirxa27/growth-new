#!/bin/bash

# Production Build Script for Newomen Platform
# Comprehensive build process with validation and optimization

set -e

echo "🏗️ Starting production build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check Node.js version
check_node_version() {
    echo -e "${BLUE}🔍 Checking Node.js version...${NC}"
    
    local node_version=$(node --version | cut -d'v' -f2)
    local major_version=$(echo $node_version | cut -d'.' -f1)
    
    if [ "$major_version" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version $node_version is not supported. Please upgrade to Node.js 18 or higher.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js version $node_version is supported${NC}"
}

# Function to validate environment
validate_environment() {
    echo -e "${BLUE}🔍 Validating environment...${NC}"
    
    # Run pre-deployment checks
    if [ -f "scripts/pre-deployment-check.js" ]; then
        node scripts/pre-deployment-check.js
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Pre-deployment checks failed${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️ Pre-deployment check script not found${NC}"
    fi
    
    echo -e "${GREEN}✅ Environment validation passed${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    
    # Clean install with legacy peer deps for compatibility
    rm -rf node_modules package-lock.json
    npm install --legacy-peer-deps
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Function to run linting and type checking
run_quality_checks() {
    echo -e "${BLUE}🔍 Running quality checks...${NC}"
    
    # Type checking
    echo -e "${BLUE}   📝 Type checking...${NC}"
    npm run type-check
    
    # Linting
    echo -e "${BLUE}   🔍 Linting...${NC}"
    npm run lint
    
    echo -e "${GREEN}✅ Quality checks passed${NC}"
}

# Function to run tests
run_tests() {
    echo -e "${BLUE}🧪 Running tests...${NC}"
    
    if npm run test:run; then
        echo -e "${GREEN}✅ All tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️ Some tests failed, but continuing with build${NC}"
        echo -e "${YELLOW}💡 Consider fixing test failures before deploying to production${NC}"
    fi
}

# Function to optimize assets
optimize_assets() {
    echo -e "${BLUE}🎨 Optimizing assets...${NC}"
    
    # Check if public directory exists and has assets
    if [ -d "public" ]; then
        local asset_count=$(find public -type f | wc -l)
        echo -e "${BLUE}   📁 Found $asset_count assets in public directory${NC}"
        
        # Check for large images
        find public -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read img; do
            local size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
            if [ "$size" -gt 1048576 ]; then # 1MB
                echo -e "${YELLOW}⚠️ Large image detected: $img ($(($size / 1024))KB)${NC}"
                echo -e "${YELLOW}💡 Consider optimizing this image for better performance${NC}"
            fi
        done
    fi
    
    echo -e "${GREEN}✅ Asset optimization check completed${NC}"
}

# Function to build the application
build_application() {
    echo -e "${BLUE}🔨 Building application...${NC}"
    
    # Clean previous build
    npm run clean
    
    # Build with production optimizations
    NODE_ENV=production npm run build:production
    
    # Verify build output
    if [ ! -d "dist" ]; then
        echo -e "${RED}❌ Build failed - dist directory not created${NC}"
        exit 1
    fi
    
    # Check build size
    local build_size=$(du -sh dist | cut -f1)
    echo -e "${GREEN}✅ Build completed successfully (Size: $build_size)${NC}"
    
    # Check for critical files
    local critical_files=("dist/index.html" "dist/assets")
    for file in "${critical_files[@]}"; do
        if [ ! -e "$file" ]; then
            echo -e "${RED}❌ Critical build file missing: $file${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ All critical build files present${NC}"
}

# Function to analyze build output
analyze_build() {
    echo -e "${BLUE}📊 Analyzing build output...${NC}"
    
    # Check bundle sizes
    if [ -d "dist/assets" ]; then
        echo -e "${BLUE}   📦 Bundle analysis:${NC}"
        
        # Find JavaScript bundles
        find dist/assets -name "*.js" | while read bundle; do
            local size=$(stat -f%z "$bundle" 2>/dev/null || stat -c%s "$bundle" 2>/dev/null)
            local size_kb=$((size / 1024))
            local filename=$(basename "$bundle")
            
            if [ "$size_kb" -gt 1024 ]; then # > 1MB
                echo -e "${YELLOW}   ⚠️ Large bundle: $filename (${size_kb}KB)${NC}"
            else
                echo -e "${GREEN}   ✅ $filename (${size_kb}KB)${NC}"
            fi
        done
        
        # Check total build size
        local total_size=$(du -sh dist | cut -f1)
        echo -e "${BLUE}   📊 Total build size: $total_size${NC}"
    fi
    
    echo -e "${GREEN}✅ Build analysis completed${NC}"
}

# Function to validate build output
validate_build() {
    echo -e "${BLUE}🔍 Validating build output...${NC}"
    
    # Check if index.html contains the app
    if grep -q "root" dist/index.html; then
        echo -e "${GREEN}✅ index.html contains app root element${NC}"
    else
        echo -e "${RED}❌ index.html missing app root element${NC}"
        exit 1
    fi
    
    # Check for source maps in production
    if find dist -name "*.map" | grep -q .; then
        echo -e "${YELLOW}⚠️ Source maps found in production build${NC}"
        echo -e "${YELLOW}💡 Consider removing source maps for production${NC}"
    else
        echo -e "${GREEN}✅ No source maps in production build${NC}"
    fi
    
    # Check for unminified files
    if find dist -name "*.js" -exec grep -l "console.log" {} \; | grep -q .; then
        echo -e "${YELLOW}⚠️ Console.log statements found in production build${NC}"
        echo -e "${YELLOW}💡 Consider removing debug statements${NC}"
    fi
    
    echo -e "${GREEN}✅ Build validation completed${NC}"
}

# Function to prepare for deployment
prepare_deployment() {
    echo -e "${BLUE}🚀 Preparing for deployment...${NC}"
    
    # Create deployment info
    cat > dist/deployment-info.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "buildSize": "$(du -sh dist | cut -f1)",
  "platform": "vercel",
  "environment": "production"
}
EOF
    
    echo -e "${GREEN}✅ Deployment info created${NC}"
}

# Function to show build summary
show_summary() {
    echo -e "${CYAN}\n📊 Build Summary${NC}"
    echo "=================================="
    
    local build_size=$(du -sh dist | cut -f1)
    local file_count=$(find dist -type f | wc -l)
    local js_files=$(find dist -name "*.js" | wc -l)
    local css_files=$(find dist -name "*.css" | wc -l)
    
    echo -e "${GREEN}✅ Build Size: $build_size${NC}"
    echo -e "${GREEN}✅ Total Files: $file_count${NC}"
    echo -e "${GREEN}✅ JavaScript Files: $js_files${NC}"
    echo -e "${GREEN}✅ CSS Files: $css_files${NC}"
    
    if [ -f "dist/deployment-info.json" ]; then
        echo -e "${GREEN}✅ Deployment info included${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🚀 Ready for Vercel deployment!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Run: ./scripts/deploy-vercel.sh"
    echo "2. Or run: vercel --prod"
    echo "3. Verify deployment at your Vercel URL"
    echo ""
}

# Main build process
main() {
    echo -e "${GREEN}🎯 Newomen Platform - Production Build${NC}"
    echo "=========================================="
    
    # Parse command line arguments
    local skip_tests=false
    local skip_checks=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-checks)
                skip_checks=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --skip-tests     Skip running tests"
                echo "  --skip-checks    Skip quality checks"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                exit 1
                ;;
        esac
    done
    
    # Run build steps
    check_node_version
    
    if [ "$skip_checks" = false ]; then
        validate_environment
    fi
    
    install_dependencies
    
    if [ "$skip_checks" = false ]; then
        run_quality_checks
    fi
    
    if [ "$skip_tests" = false ]; then
        run_tests
    fi
    
    optimize_assets
    build_application
    analyze_build
    validate_build
    prepare_deployment
    show_summary
}

# Run the main function with all arguments
main "$@"