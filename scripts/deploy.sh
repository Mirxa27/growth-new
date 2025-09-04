#!/bin/bash

# Enhanced deployment script for NewoMen Life Navigation System
# Supports staging and production deployments with rollback capabilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_TIMEOUT=600  # 10 minutes
BACKUP_RETENTION_DAYS=30

# Default values
ENVIRONMENT=${1:-staging}
FORCE_DEPLOY=${2:-false}
SKIP_TESTS=${3:-false}
SKIP_MIGRATIONS=${4:-false}

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to log deployment
log_deployment() {
    local status=$1
    local message=$2
    
    echo -e "${GREEN}[DEPLOYMENT] $(date -u +"%Y-%m-%d %H:%M:%SZ") [$ENVIRONMENT] $status: $message${NC}"
    
    # Log to file
    mkdir -p logs
    echo "[$(date -u +"%Y-%m-%d %H:%M:%SZ")] [$ENVIRONMENT] $status: $message" >> logs/deployments.log
}

# Function to create backup
create_backup() {
    print_section "Creating Backup"
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)_$ENVIRONMENT"
    mkdir -p "$backup_dir"
    
    # Backup database (if configured)
    if [ -n "$DATABASE_URL" ]; then
        echo -e "${YELLOW}📦 Backing up database...${NC}"
        pg_dump "$DATABASE_URL" > "$backup_dir/database.sql"
    fi
    
    # Backup current build
    if [ -d "dist" ]; then
        echo -e "${YELLOW}📦 Backing up current build...${NC}"
        cp -r dist "$backup_dir/"
    fi
    
    # Backup environment files
    cp .env* "$backup_dir/" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Backup created: $backup_dir${NC}"
    echo "$backup_dir" > .last_backup
}

# Function to rollback
rollback() {
    print_section "Rolling Back Deployment"
    
    if [ -f .last_backup ]; then
        local backup_dir=$(cat .last_backup)
        
        echo -e "${YELLOW}🔄 Rolling back to: $backup_dir${NC}"
        
        # Restore database if exists
        if [ -f "$backup_dir/database.sql" ] && [ -n "$DATABASE_URL" ]; then
            echo -e "${YELLOW}🔄 Restoring database...${NC}"
            psql "$DATABASE_URL" < "$backup_dir/database.sql"
        fi
        
        # Restore build
        if [ -d "$backup_dir/dist" ]; then
            echo -e "${YELLOW}🔄 Restoring build...${NC}"
            rm -rf dist
            cp -r "$backup_dir/dist" .
        fi
        
        # Restore environment
        cp "$backup_dir"/.env* ./ 2>/dev/null || true
        
        echo -e "${GREEN}✅ Rollback completed${NC}"
        log_deployment "ROLLED_BACK" "Deployment rolled back to previous version"
    else
        echo -e "${RED}❌ No backup found for rollback${NC}"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        echo -e "${YELLOW}⚠️  Skipping tests (emergency deployment)${NC}"
        return 0
    fi
    
    print_section "Running Tests"
    
    # Run test pipeline
    chmod +x scripts/test-pipeline.sh
    ./scripts/test-pipeline.sh all
    
    echo -e "${GREEN}✅ All tests passed${NC}"
}

# Function to apply migrations
apply_migrations() {
    if [ "$SKIP_MIGRATIONS" = "true" ]; then
        echo -e "${YELLOW}⚠️  Skipping migrations${NC}"
        return 0
    fi
    
    print_section "Applying Database Migrations"
    
    # Load environment variables
    if [ -f .env.$ENVIRONMENT ]; then
        export $(cat .env.$ENVIRONMENT | xargs)
    fi
    
    # Check if Supabase CLI is available
    if command_exists supabase; then
        echo -e "${YELLOW}🔄 Applying Supabase migrations...${NC}"
        supabase db push
    else
        echo -e "${YELLOW}⚠️  Supabase CLI not found, skipping migrations${NC}"
    fi
    
    echo -e "${GREEN}✅ Migrations applied${NC}"
}

# Function to deploy to Vercel
deploy_vercel() {
    print_section "Deploying to Vercel ($ENVIRONMENT)"
    
    # Check if Vercel CLI is installed
    if ! command_exists vercel; then
        echo -e "${RED}❌ Vercel CLI not found. Install with: npm i -g vercel${NC}"
        exit 1
    fi
    
    # Build for production
    echo -e "${YELLOW}🏗️  Building application...${NC}"
    npm run build
    
    # Deploy based on environment
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${YELLOW}🚀 Deploying to production...${NC}"
        vercel --prod --env=production
    else
        echo -e "${YELLOW}🚀 Deploying to staging...${NC}"
        vercel --env=staging
    fi
}

# Function to deploy to Docker
deploy_docker() {
    print_section "Deploying with Docker ($ENVIRONMENT)"
    
    # Build and run containers
    echo -e "${YELLOW}🐳 Building Docker images...${NC}"
    docker-compose build
    
    echo -e "${YELLOW}🚀 Starting containers...${NC}"
    docker-compose up -d
    
    # Health check
    echo -e "${YELLOW}🔍 Running health check...${NC}"
    docker-compose exec app curl -f http://localhost:80/health || {
        echo -e "${RED}❌ Health check failed${NC}"
        docker-compose logs
        return 1
    }
    
    echo -e "${GREEN}✅ Docker deployment completed${NC}"
}

# Function to deploy to custom server
deploy_custom() {
    print_section "Deploying to Custom Server ($ENVIRONMENT)"
    
    # Load deployment configuration
    if [ -f "deploy/config.$ENVIRONMENT.json" ]; then
        echo -e "${YELLOW}📋 Loading deployment configuration...${NC}"
        # Custom deployment logic here
    fi
    
    # Build application
    echo -e "${YELLOW}🏗️  Building application...${NC}"
    npm run build
    
    # Copy files to server
    if [ -n "$DEPLOY_HOST" ] && [ -n "$DEPLOY_PATH" ]; then
        echo -e "${YELLOW}📤 Copying files to server...${NC}"
        rsync -avz --delete dist/ $DEPLOY_HOST:$DEPLOY_PATH/
    else
        echo -e "${YELLOW}📦 Build ready in dist/ directory${NC}"
    fi
}

# Main deployment function
deploy() {
    print_section "Starting Deployment to $ENVIRONMENT"
    
    # Validate environment
    if [ ! -f ".env.$ENVIRONMENT" ] && [ ! -f ".env" ]; then
        echo -e "${RED}❌ No environment file found for $ENVIRONMENT${NC}"
        exit 1
    fi
    
    # Load environment variables
    if [ -f ".env.$ENVIRONMENT" ]; then
        export $(cat .env.$ENVIRONMENT | xargs)
    fi
    
    # Log deployment start
    log_deployment "STARTED" "Starting deployment to $ENVIRONMENT"
    
    # Create backup
    create_backup
    
    # Run tests
    run_tests
    
    # Apply migrations
    apply_migrations
    
    # Deploy based on target
    case "${DEPLOY_TARGET:-vercel}" in
        vercel)
            deploy_vercel
            ;;
        docker)
            deploy_docker
            ;;
        custom)
            deploy_custom
            ;;
        *)
            echo -e "${RED}❌ Unknown deployment target: ${DEPLOY_TARGET}${NC}"
            exit 1
            ;;
    esac
    
    # Log deployment success
    log_deployment "COMPLETED" "Successfully deployed to $ENVIRONMENT"
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
}

# Show help
show_help() {
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "Environments:"
    echo "  staging     Deploy to staging environment (default)"
    echo "  production  Deploy to production environment"
    echo ""
    echo "Options:"
    echo "  --force     Force deployment without confirmation"
    echo "  --skip-tests Skip running tests"
    echo "  --skip-migrations Skip database migrations"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production --force --skip-tests"
    echo ""
    echo "Environment variables:"
    echo "  DEPLOY_TARGET   Deployment target (vercel, docker, custom)"
    echo "  DATABASE_URL    Database connection URL"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        --rollback)
            rollback
            exit 0
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            if [[ "$1" =~ ^-- ]]; then
                echo -e "${RED}❌ Unknown option: $1${NC}"
                show_help
                exit 1
            else
                ENVIRONMENT=$1
                shift
            fi
            ;;
    esac
done

# Confirm deployment
if [ "$FORCE_DEPLOY" != "true" ]; then
    echo -e "${YELLOW}⚠️  About to deploy to: $ENVIRONMENT${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Deployment cancelled${NC}"
        exit 0
    fi
fi

# Execute deployment
deploy