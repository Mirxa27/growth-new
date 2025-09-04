#!/bin/bash

# Environment variable management script for NewoMen Life Navigation System
# Handles secrets, environment variables, and configuration management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SECRETS_FILE=".secrets"
ENVIRONMENTS=("development" "staging" "production")

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to encrypt secrets
encrypt_secrets() {
    print_section "Encrypting Secrets"
    
    if [ -f "$SECRETS_FILE" ]; then
        if command_exists gpg; then
            gpg --symmetric --cipher-algo AES256 --output "$SECRETS_FILE.gpg" "$SECRETS_FILE"
            echo -e "${GREEN}✅ Secrets encrypted${NC}"
        else
            echo -e "${YELLOW}⚠️  GPG not available, skipping encryption${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No secrets file to encrypt${NC}"
    fi
}

# Function to decrypt secrets
decrypt_secrets() {
    print_section "Decrypting Secrets"
    
    if [ -f "$SECRETS_FILE.gpg" ]; then
        gpg --decrypt "$SECRETS_FILE.gpg" > "$SECRETS_FILE"
        echo -e "${GREEN}✅ Secrets decrypted${NC}"
    else
        echo -e "${YELLOW}⚠️  No encrypted secrets file found${NC}"
    fi
}

# Function to generate environment files
generate_env_files() {
    print_section "Generating Environment Files"
    
    for env in "${ENVIRONMENTS[@]}"; do
        local env_file=".env.$env"
        
        if [ ! -f "$env_file" ]; then
            echo -e "${YELLOW}📋 Creating $env_file${NC}"
            
            cat > "$env_file" << EOF
# Environment: $env
# Generated on: $(date -u +"%Y-%m-%d %H:%M:%SZ")

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_ACCESS_TOKEN=your-access-token

# AI Provider Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Optional: Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Redis
REDIS_URL=redis://localhost:6379

# Application Settings
NODE_ENV=$env
PORT=3000
HOST=0.0.0.0

# Health Check
HEALTH_CHECK_INTERVAL=30
HEALTH_CHECK_TIMEOUT=5
EOF
            
            echo -e "${GREEN}✅ Created $env_file${NC}"
        else
            echo -e "${GREEN}✅ $env_file already exists${NC}"
        fi
    done
}

# Function to validate environment
validate_environment() {
    local env=$1
    local env_file=".env.$env"
    
    print_section "Validating Environment: $env"
    
    if [ ! -f "$env_file" ]; then
        echo -e "${RED}❌ Environment file not found: $env_file${NC}"
        return 1
    fi
    
    # Source environment variables
    source "$env_file"
    
    # Check required variables
    local required_vars=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=($var)
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required variables: ${missing_vars[*]}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Environment validation passed${NC}"
}

# Function to sync secrets
sync_secrets() {
    print_section "Syncing Secrets"
    
    # Create secrets directory
    mkdir -p secrets
    
    for env in "${ENVIRONMENTS[@]}"; do
        local env_file=".env.$env"
        local secret_file="secrets/$env.env"
        
        if [ -f "$env_file" ]; then
            # Copy sensitive variables to secrets file
            grep -E 'KEY|SECRET|TOKEN|PRIVATE' "$env_file" > "$secret_file" 2>/dev/null || true
            echo -e "${GREEN}✅ Synced secrets for $env${NC}"
        fi
    done
}

# Function to cleanup old backups
cleanup_backups() {
    print_section "Cleaning Up Old Backups"
    
    if [ -d "backups" ]; then
        find backups -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
        echo -e "${GREEN}✅ Old backups cleaned up${NC}"
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  init        Initialize environment files"
    echo "  encrypt     Encrypt secrets using GPG"
    echo "  decrypt     Decrypt secrets using GPG"
    echo "  validate    Validate environment configuration"
    echo "  sync        Sync secrets to separate files"
    echo "  clean       Cleanup old backups"
    echo ""
    echo "Options:"
    echo "  --env ENV   Target environment"
    echo "  -h, --help  Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 init"
    echo "  $0 validate --env production"
    echo "  $0 encrypt"
    echo "  $0 decrypt"
}

# Main function
main() {
    local command=${1:-help}
    local target_env=${2:-development}
    
    case $command in
        init)
            generate_env_files
            ;;
        encrypt)
            encrypt_secrets
            ;;
        decrypt)
            decrypt_secrets
            ;;
        validate)
            validate_environment $target_env
            ;;
        sync)
            sync_secrets
            ;;
        clean)
            cleanup_backups
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Execute if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi