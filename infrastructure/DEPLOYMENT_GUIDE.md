# 🚀 Complete Infrastructure Deployment Guide
# Newomen.me Production Infrastructure

## Overview

This guide provides step-by-step instructions for deploying the complete Newomen.me infrastructure on AWS with Supabase managed services.

## 📋 Prerequisites

### Required Tools
- AWS CLI (configured with appropriate permissions)
- Terraform ≥ 1.0
- Supabase CLI
- Node.js ≥ 18
- Docker (for monitoring stack)

### Environment Variables
```bash
# AWS Configuration
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1

# Supabase Configuration
export SUPABASE_ACCESS_TOKEN=your_supabase_token
export SUPABASE_PROJECT_ID=your_project_id
```

## 🏗️ Infrastructure Components

### 1. AWS Infrastructure
- **VPC**: Multi-AZ VPC with private subnets
- **S3**: Backup storage and static assets
- **CloudWatch**: Monitoring and logging
- **SNS**: Alerting notifications
- **Secrets Manager**: Secure credential storage

### 2. Supabase Services
- **PostgreSQL**: Managed database with optimization
- **Authentication**: User management and security
- **Storage**: File storage for user uploads
- **Edge Functions**: Serverless functions for AI processing

### 3. Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **CloudWatch**: AWS resource monitoring
- **Alert Manager**: Notification system

## 🚀 Quick Deployment

### Step 1: Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd newomen-infrastructure

# Install dependencies
npm install -g supabase
npm install -g terraform
```

### Step 2: Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit the environment file
nano .env
```

### Step 3: Deploy Infrastructure
```bash
# Run the automated setup
chmod +x infrastructure/scripts/setup-infrastructure.sh
./infrastructure/scripts/setup-infrastructure.sh

# Or run step-by-step
cd infrastructure/terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### Step 4: Database Setup
```bash
# Apply database optimizations
supabase db push infrastructure/database/optimization.sql

# Run migrations
supabase db push
```

### Step 5: Deploy Edge Functions
```bash
# Deploy all edge functions
./deploy-edge-functions.sh

# Deploy specific functions
supabase functions deploy create-assessment
supabase functions deploy process-assessment
```

## 🔐 Security Configuration

### 1. Authentication Setup
```bash
# Configure Supabase Auth
supabase auth settings update --site-url https://newomen.me
supabase auth settings update --additional-redirect-urls https://app.newomen.me
```

### 2. API Keys Configuration
```bash
# Set environment variables
supabase secrets set OPENAI_API_KEY=your_openai_key
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_key
supabase secrets set GOOGLE_API_KEY=your_google_key
```

### 3. Security Policies
- **Row Level Security**: Enabled on all tables
- **Rate Limiting**: 100 requests per minute
- **CORS**: Configured for production domains
- **HTTPS**: SSL/TLS certificates

## 📊 Monitoring Setup

### 1. Prometheus + Grafana
```bash
# Start monitoring stack
cd infrastructure/monitoring
docker-compose up -d

# Access dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

### 2. CloudWatch Alarms
```bash
# Create CloudWatch alarms
aws cloudwatch put-metric-alarm --alarm-name HighCPU --alarm-description "High CPU alarm"
```

### 3. Health Checks
```bash
# Application health endpoint
curl https://api.newomen.me/health

# Database health check
curl https://$PROJECT_ID.supabase.co/rest/v1/health
```

## 💰 Cost Optimization

### 1. Budget Monitoring
- **Monthly Budget**: $500 USD
- **Alerts**: 80% threshold
- **Cost Tracking**: Enabled for all services

### 2. Auto-scaling
- **Database**: Auto-scale based on CPU/memory
- **Functions**: Concurrency limits
- **Storage**: Lifecycle policies

### 3. Reserved Instances
- **Database**: 1-year reserved instances
- **Compute**: Savings plans for predictable workloads

## 🔄 Backup and Recovery

### 1. Automated Backups
- **Database**: Daily automated backups
- **Storage**: S3 versioning enabled
- **Retention**: 30 days for backups, 365 days for archives

### 2. Disaster Recovery
- **RTO**: 1 hour
- **RPO**: 15 minutes
- **Multi-region**: S3 cross-region replication

### 3. Backup Testing
```bash
# Test restore
supabase db restore backup_file.dump
```

## 🌐 DNS Configuration

### 1. Domain Setup
```bash
# Add DNS records
A     newomen.me          → 76.76.19.61
CNAME www.newomen.me    → cname.vercel-dns.com
CNAME api.newomen.me    → $PROJECT_ID.supabase.co
```

### 2. SSL Certificates
- **Let's Encrypt**: Automatic certificate renewal
- **Wildcard SSL**: *.newomen.me
- **HTTPS Only**: Redirect HTTP to HTTPS

## 🧪 Testing

### 1. Load Testing
```bash
# Install load testing tool
npm install -g artillery

# Run load test
artillery run tests/load-test.yml
```

### 2. Security Testing
```bash
# Security scan
npm audit
supabase security scan
```

### 3. Monitoring Test
```bash
# Check all endpoints
./scripts/health-check.sh
```

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] AWS CLI configured
- [ ] Terraform state configured
- [ ] Environment variables set
- [ ] SSL certificates ready
- [ ] DNS records configured

### Deployment
- [ ] Infrastructure deployed
- [ ] Database optimized
- [ ] Edge functions deployed
- [ ] Monitoring enabled
- [ ] Security policies applied

### Post-deployment
- [ ] Health checks passed
- [ ] SSL certificates verified
- [ ] Monitoring dashboards accessible
- [ ] Alerts configured
- [ ] Documentation updated

## 📝 Maintenance

### 1. Regular Tasks
- **Weekly**: Review monitoring dashboards
- **Monthly**: Check cost reports
- **Quarterly**: Security audit

### 2. Updates
- **Security Patches**: Automatic for managed services
- **Updates**: Scheduled maintenance windows
- **Backups**: Daily automated

### 3. Monitoring
- **24/7 Monitoring**: CloudWatch + Grafana
- **Alert Channels**: Email + Slack
- **Response Time**: 15 minutes

## 🆘 Troubleshooting

### Common Issues

#### 1. Database Connection
```bash
# Check database status
supabase status
supabase db ping
```

#### 2. Function Deployment
```bash
# Check function logs
supabase functions logs create-assessment --tail
```

#### 3. Monitoring Issues
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets
```

### Support Contacts
- **DevOps Team**: devops@newomen.me
- **Emergency**: +1-XXX-XXX-XXXX
- **Status Page**: https://status.newomen.me

## 🎉 Success

Your Newomen.me infrastructure is now deployed and ready for production!