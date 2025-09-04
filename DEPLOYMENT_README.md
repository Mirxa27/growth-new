# NewoMen Life Navigation System - CI/CD Pipeline

## Overview
This comprehensive CI/CD pipeline provides automated builds, testing, and deployments for the React/TypeScript/Vite application with Supabase backend.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Docker (optional)
- GitHub CLI (for GitHub Actions)

### 1. Environment Setup
```bash
# Make scripts executable
./scripts/make-executable.sh

# Generate environment files
./scripts/env-manager.sh init

# Validate environment
./scripts/env-manager.sh validate --env production
```

### 2. Local Development
```bash
# Start development server
npm run dev

# Run tests
./scripts/test-pipeline.sh all

# Build for production
npm run build
```

### 3. Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d

# Development environment
docker-compose up dev

# Testing environment
docker-compose up test
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)
- **Triggers**: Push to main, develop, staging branches
- **Stages**:
  1. Lint and Type Check
  2. Test Suite (unit, integration, e2e)
  3. Build Application
  4. Deploy to Staging/Production
  5. Health Check
  6. Rollback on failure

#### 2. Rollback Workflow (`.github/workflows/rollback-deployment.yml`)
- **Manual trigger** for emergency rollbacks
- **Features**:
  - Target specific commit
  - Environment-specific
  - Automated health check
  - Slack notifications

### Environment Variables

#### Required Variables
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

#### Environment Files
- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## 🧪 Testing Pipeline

### Test Types
1. **Unit Tests** - Individual component testing
2. **Integration Tests** - API and service integration
3. **E2E Tests** - Full application flow testing

### Running Tests
```bash
# All tests
./scripts/test-pipeline.sh all

# Specific test types
./scripts/test-pipeline.sh unit
./scripts/test-pipeline.sh integration
./scripts/test-pipeline.sh e2e

# With Docker
docker-compose run test
```

## 🐳 Docker Configuration

### Images
- **Production**: Nginx + static build
- **Development**: Hot reload development server
- **Testing**: Full test environment

### Commands
```bash
# Production
docker-compose up app

# Development
docker-compose up dev

# Testing
docker-compose run test
```

## 🔄 Deployment Scripts

### Deploy Script (`scripts/deploy.sh`)
```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production

# Emergency deployment
./scripts/deploy.sh production --force --skip-tests

# Rollback
./scripts/deploy.sh --rollback
```

### Environment Manager (`scripts/env-manager.sh`)
```bash
# Initialize environments
./scripts/env-manager.sh init

# Encrypt secrets
./scripts/env-manager.sh encrypt

# Validate environment
./scripts/env-manager.sh validate --env production
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- `/health` - Basic health check
- `/api/health` - API health check
- `/metrics` - Performance metrics

### Monitoring Integration
- GitHub Actions notifications
- Slack alerts
- Vercel analytics
- Custom monitoring hooks

## 🔧 GitHub Secrets

Required GitHub secrets:
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `VITE_SUPABASE_URL` - Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `SLACK_WEBHOOK_URL` - Slack notifications (optional)

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check environment variables
./scripts/env-manager.sh validate --env production

# Check dependencies
npm ci

# Check build
npm run build
```

#### 2. Test Failures
```bash
# Check test environment
echo $TEST_FUNCTIONS_URL

# Run specific tests
npm run test:unit
```

#### 3. Deployment Issues
```bash
# Check logs
cat logs/deployments.log

# Manual rollback
./scripts/deploy.sh --rollback
```

## 📈 Performance Optimization

### Build Optimization
- Code splitting with manual chunks
- Tree shaking enabled
- Gzip compression
- CDN integration

### Runtime Optimization
- Redis caching
- Lazy loading
- Service worker
- PWA features

## 🎯 Next Steps

1. **Setup GitHub Secrets** - Add required tokens
2. **Configure Environments** - Set up staging/production
3. **Test Pipeline** - Run full test suite
4. **Deploy** - First automated deployment
5. **Monitor** - Set up alerts and monitoring

## 🔗 Useful Links
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Supabase Documentation](https://supabase.com/docs)