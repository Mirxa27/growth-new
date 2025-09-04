#!/bin/bash
# Infrastructure Setup Script for Newomen.me
# This script sets up the complete AWS + Supabase infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Newomen.me Infrastructure Setup${NC}"
echo -e "${BLUE}=================================${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed${NC}"
        echo "Install from: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}❌ Terraform is not installed${NC}"
        echo "Install from: https://www.terraform.io/downloads.html"
        exit 1
    fi
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}❌ Supabase CLI is not installed${NC}"
        echo "Install with: npm install -g supabase"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Setup AWS infrastructure
setup_aws_infrastructure() {
    echo -e "${YELLOW}🏗️  Setting up AWS infrastructure...${NC}"
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan the infrastructure
    terraform plan -out=tfplan
    
    # Apply the infrastructure
    terraform apply tfplan
    
    # Get outputs
    terraform output -json > outputs.json
    
    cd ../..
    
    echo -e "${GREEN}✅ AWS infrastructure setup complete${NC}"
}

# Setup Supabase project
setup_supabase_project() {
    echo -e "${YELLOW}🔗 Setting up Supabase project...${NC}"
    
    # Create new Supabase project if needed
    echo "Enter your Supabase project ID (or press Enter to use existing): "
    read SUPABASE_PROJECT_ID
    
    if [ -z "$SUPABASE_PROJECT_ID" ]; then
        echo "Enter project name for new Supabase project: "
        read PROJECT_NAME
        
        if [ -z "$PROJECT_NAME" ]; then
            echo -e "${RED}❌ Project name is required${NC}"
            exit 1
        fi
        
        # Create new Supabase project
        supabase projects create $PROJECT_NAME --region us-east-1
        SUPABASE_PROJECT_ID=$PROJECT_NAME
    fi
    
    # Link the project
    supabase link --project-ref $SUPABASE_PROJECT_ID
    
    echo -e "${GREEN}✅ Supabase project setup complete${NC}"
}

# Setup database optimization
setup_database() {
    echo -e "${YELLOW}🗄️  Setting up database optimization...${NC}"
    
    # Apply database optimizations
    supabase db reset --linked
    supabase db push infrastructure/database/optimization.sql
    
    echo -e "${GREEN}✅ Database optimization complete${NC}"
}

# Setup environment configurations
setup_environments() {
    echo -e "${YELLOW}⚙️  Setting up environment configurations...${NC}"
    
    # Create environment files
    mkdir -p environments
    
    # Production environment
    cat > environments/production.env << EOF
# Production Environment Configuration
NODE_ENV=production
VITE_SUPABASE_URL=https://$SUPABASE_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here

# AI Provider Keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key

# Monitoring
DATADOG_API_KEY=your-datadog-key
SENTRY_DSN=your-sentry-dsn
EOF
    
    # Staging environment
    cat > environments/staging.env << EOF
# Staging Environment Configuration
NODE_ENV=staging
VITE_SUPABASE_URL=https://$SUPABASE_PROJECT_ID-staging.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here

# AI Provider Keys (use test keys)
OPENAI_API_KEY=sk-test-key
ANTHROPIC_API_KEY=sk-test-key
GOOGLE_API_KEY=test-key
EOF
    
    # Development environment
    cat > environments/development.env << EOF
# Development Environment Configuration
NODE_ENV=development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key
SUPABASE_JWT_SECRET=your-local-jwt-secret

# AI Provider Keys (use test keys)
OPENAI_API_KEY=sk-test-key
ANTHROPIC_API_KEY=sk-test-key
GOOGLE_API_KEY=test-key
EOF
    
    echo -e "${GREEN}✅ Environment configurations complete${NC}"
}

# Setup backup configuration
setup_backup() {
    echo -e "${YELLOW}💾 Setting up backup configuration...${NC}"
    
    # Create backup script
    cat > infrastructure/scripts/backup-database.sh << 'EOF'
#!/bin/bash
# Database Backup Script
set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_ID="newomen-production"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
pg_dump \
  --host=$SUPABASE_HOST \
  --port=5432 \
  --username=postgres \
  --password \
  --format=custom \
  --file=$BACKUP_DIR/backup_$DATE.dump \
  postgres

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.dump \
  s3://newomen-production-backups/database/$DATE/

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "*.dump" -type f -mtime +30 -delete

echo "Backup completed: backup_$DATE.dump"
EOF
    
    chmod +x infrastructure/scripts/backup-database.sh
    
    # Setup cron job for daily backups
    echo "0 2 * * * /path/to/backup-database.sh" | crontab -
    
    echo -e "${GREEN}✅ Backup configuration complete${NC}"
}

# Setup monitoring
setup_monitoring() {
    echo -e "${YELLOW}📊 Setting up monitoring...${NC}"
    
    # Create monitoring script
    cat > infrastructure/scripts/monitor-health.sh << 'EOF'
#!/bin/bash
# Health Monitoring Script

# Check database connectivity
psql "postgresql://postgres:password@host:5432/postgres" -c "SELECT 1;" || echo "Database down"

# Check Supabase API
curl -f https://$SUPABASE_PROJECT_ID.supabase.co/rest/v1/health || echo "Supabase API down"

# Check edge functions
curl -f https://$SUPABASE_PROJECT_ID.supabase.co/functions/v1/health || echo "Edge functions down"

# Check application endpoints
curl -f https://app.newomen.me/health || echo "Application down"

# Send alerts via SNS
aws sns publish --topic-arn arn:aws:sns:us-east-1:account:alerts --message "Health check completed"
EOF
    
    chmod +x infrastructure/scripts/monitor-health.sh
    
    echo -e "${GREEN}✅ Monitoring setup complete${NC}"
}

# Main execution
main() {
    check_prerequisites
    
    echo ""
    echo "Choose setup option:"
    echo "1) Complete setup (AWS + Supabase)"
    echo "2) AWS infrastructure only"
    echo "3) Supabase configuration only"
    echo "4) Database optimization only"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            setup_aws_infrastructure
            setup_supabase_project
            setup_database
            setup_environments
            setup_backup
            setup_monitoring
            ;;
        2)
            setup_aws_infrastructure
            ;;
        3)
            setup_supabase_project
            setup_environments
            ;;
        4)
            setup_database
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Infrastructure setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update environment variables in environments/*.env"
    echo "2. Deploy edge functions: ./deploy-edge-functions.sh"
    echo "3. Configure DNS settings"
    echo "4. Test the deployment"
}

# Run main function
main "$@"