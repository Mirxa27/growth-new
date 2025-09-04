#!/bin/bash

# Comprehensive testing pipeline for NewoMen Life Navigation System
# Runs unit, integration, and e2e tests with proper environment setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_TIMEOUT=300000  # 5 minutes
PARALLEL_JOBS=4

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for services
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    
    echo -e "${YELLOW}⏳ Waiting for $name to be ready...${NC}"
    
    for i in $(seq 1 $max_attempts); do
        if curl -f "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    echo -e "${RED}❌ $name is not responding after $max_attempts attempts${NC}"
    return 1
}

# Setup environment
setup_environment() {
    print_section "Setting up test environment"
    
    # Check if .env.test exists
    if [ ! -f .env.test ]; then
        echo -e "${YELLOW}⚠️  .env.test not found, using .env.example${NC}"
        cp .env.example .env.test
    fi
    
    # Load environment variables
    export $(cat .env.test | xargs)
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        npm ci
    fi
    
    # Install Playwright browsers for e2e tests
    if [ "$1" = "e2e" ] || [ "$1" = "all" ]; then
        echo -e "${YELLOW}📦 Installing Playwright browsers...${NC}"
        npx playwright install --with-deps chromium
    fi
}

# Run unit tests
run_unit_tests() {
    print_section "Running Unit Tests"
    
    # Run with coverage
    npm run test:unit --run --reporter=verbose --coverage
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Unit tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Unit tests failed${NC}"
        return 1
    fi
}

# Run integration tests
run_integration_tests() {
    print_section "Running Integration Tests"
    
    # Check if test functions URL is set
    if [ -z "$TEST_FUNCTIONS_URL" ]; then
        echo -e "${YELLOW}⚠️  TEST_FUNCTIONS_URL not set, skipping integration tests${NC}"
        return 0
    fi
    
    # Run integration tests
    TEST_FUNCTIONS_URL=$TEST_FUNCTIONS_URL npm run test:integration --run
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Integration tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Integration tests failed${NC}"
        return 1
    fi
}

# Run e2e tests
run_e2e_tests() {
    print_section "Running E2E Tests"
    
    # Start development server for e2e tests
    echo -e "${YELLOW}🚀 Starting development server...${NC}"
    npm run dev -- --host 0.0.0.0 --port 5173 &
    DEV_SERVER_PID=$!
    
    # Wait for server to be ready
    wait_for_service "http://localhost:5173" "development server"
    
    # Run e2e tests
    npm run test:e2e
    
    TEST_RESULT=$?
    
    # Kill development server
    kill $DEV_SERVER_PID 2>/dev/null || true
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ E2E tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ E2E tests failed${NC}"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    print_section "Running Complete Test Suite"
    
    # Run tests sequentially
    run_unit_tests
    run_integration_tests
    run_e2e_tests
    
    echo -e "${GREEN}🎉 All tests passed!${NC}"
}

# Generate test report
generate_report() {
    print_section "Generating Test Report"
    
    # Create reports directory
    mkdir -p reports
    
    # Combine coverage reports
    if [ -d "coverage" ]; then
        echo -e "${GREEN}📊 Coverage report available at: coverage/index.html${NC}"
    fi
    
    # Generate summary
    cat > reports/test-summary.json << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
    "status": "completed"
}
EOF
    
    echo -e "${GREEN}📋 Test report generated in: reports/${NC}"
}

# Main execution
main() {
    local test_type=${1:-all}
    
    echo -e "${BLUE}🧪 NewoMen Test Pipeline${NC}"
    echo -e "${BLUE}Starting at: $(date)${NC}"
    
    # Setup environment
    setup_environment $test_type
    
    # Run tests based on type
    case $test_type in
        unit)
            run_unit_tests
            ;;
        integration)
            run_integration_tests
            ;;
        e2e)
            run_e2e_tests
            ;;
        all)
            run_all_tests
            ;;
        *)
            echo -e "${RED}❌ Invalid test type: $test_type${NC}"
            echo -e "${YELLOW}Usage: $0 [unit|integration|e2e|all]${NC}"
            exit 1
            ;;
    esac
    
    # Generate report
    generate_report
    
    echo -e "${BLUE}Completed at: $(date)${NC}"
}

# Execute if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi