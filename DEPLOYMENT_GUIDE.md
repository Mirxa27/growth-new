# Newomen.me Deployment Guide

Complete deployment guide for the Newomen personal growth platform with mobile app, assessments, and AI features.

## 📋 Overview

This guide covers:
- Web application deployment (Vercel/Netlify)
- iOS mobile app build and TestFlight deployment
- Database setup and migrations (Supabase)
- Edge functions deployment
- Environment configuration
- Testing and QA procedures

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   Mobile App    │    │   Admin Panel   │
│   (React/Vite)  │    │   (Capacitor)   │    │   (React)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────▼───────────────────────┐
         │              Supabase Backend                 │
         │  ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
         │  │ PostgreSQL  │ │Edge Functions│ │   Auth   │ │
         │  │  Database   │ │   (Deno)     │ │ Service  │ │
         │  └─────────────┘ └─────────────┘ └──────────┘ │
         └───────────────────────────────────────────────┘
                                 │
         ┌───────────────────────▼───────────────────────┐
         │              External APIs                    │
         │  ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
         │  │   OpenAI    │ │  Anthropic  │ │  Others  │ │
         │  │ Realtime API│ │     API     │ │   APIs   │ │
         │  └─────────────┘ └─────────────┘ └──────────┘ │
         └───────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase CLI
- Xcode (for iOS builds)
- macOS (for iOS development)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd newomen-platform
npm install --legacy-peer-deps
```

### 2. Environment Setup

Copy and configure environment variables:

```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for AI features)
OPENAI_API_KEY=your_openai_api_key

# Optional: Other AI providers
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_AI_API_KEY=your_google_ai_key

# App Configuration
VITE_APP_URL=https://your-domain.com
VITE_ENVIRONMENT=production
```

### 3. Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Deploy edge functions
supabase functions deploy
```

### 4. Build and Deploy

```bash
# Build web app
npm run build:production

# Deploy to Vercel (recommended)
npm run deploy:vercel

# Or deploy to Netlify
npm run deploy:netlify
```

## 📱 Mobile App Deployment

### iOS Build Process

1. **Setup Xcode Environment**
   ```bash
   # Install Xcode from Mac App Store
   # Install Xcode command line tools
   xcode-select --install
   
   # Install CocoaPods
   sudo gem install cocoapods
   ```

2. **Build iOS App**
   ```bash
   # Make build script executable
   chmod +x ./scripts/build-ios.sh
   
   # Development build (opens Xcode)
   ./scripts/build-ios.sh --dev
   
   # TestFlight build (creates IPA)
   ./scripts/build-ios.sh --testflight
   ```

3. **Configure App Store Connect**
   - Create app in App Store Connect
   - Configure app information, screenshots, description
   - Set up TestFlight for beta testing

4. **Upload to TestFlight**
   ```bash
   # Upload IPA using Xcode or Application Loader
   # Or use command line:
   xcrun altool --upload-app -f ios/App/build/App.ipa \
     -u your-apple-id@email.com -p your-app-specific-password
   ```

### Mobile App Features

The iOS app includes:
- ✅ Full offline functionality with sync
- ✅ Push notifications
- ✅ Camera/microphone access for assessments
- ✅ Deep linking support
- ✅ Native iOS UI components
- ✅ Biometric authentication support
- ✅ Background sync capabilities

### Required iOS Permissions

The app requests these permissions (already configured in Info.plist):
- Camera: For image-based assessments and profile photos
- Microphone: For voice assessments and AI conversations
- Location: For personalized content recommendations
- Notifications: For assessment reminders and insights
- File Access: For saving and syncing assessment results

## 🗄️ Database Schema

### Core Tables

```sql
-- Users and Authentication
profiles (id, email, display_name, role, is_admin, created_at)
admin_logs (id, admin_id, action, details, timestamp)

-- Assessment System
assessments (id, slug, title, description, type, difficulty, is_public, requires_auth)
assessment_questions (id, assessment_id, question_text, question_type, order_index)
assessment_options (id, question_id, option_text, is_correct, score_points)
assessment_attempts (id, assessment_id, user_id, visitor_session_id, score, status)
assessment_responses (id, attempt_id, question_id, response_text, selected_option_ids)
assessment_analytics (id, assessment_id, total_attempts, average_score)

-- Course System
courses (id, slug, title, description, is_published, created_by)
course_modules (id, course_id, title, content_type, order_index)
course_progress (id, course_id, user_id, progress_percentage, completed_at)

-- AI Content Generation
ai_build_jobs (id, admin_id, job_type, ai_provider, status, generated_content)
admin_ai_providers (id, provider_type, configuration, is_active)

-- Voice Features
voice_agent_configs (id, model, voice, instructions, is_active)
voice_sessions (id, user_id, session_token, transcript, metadata)
```

### Migrations

All database migrations are located in `/supabase/migrations/` and are automatically applied during deployment.

Key migrations:
- `20250907100000_secure_admin_verification.sql` - Admin security system
- `20250907110000_comprehensive_assessment_system_v2.sql` - Complete assessment schema
- `20250907111000_assessment_functions.sql` - Assessment management functions
- `20250907112000_seed_assessments.sql` - 20 ready-to-use assessments

## 🔧 Edge Functions

### Deployed Functions

1. **get-realtime-token** - OpenAI Realtime API authentication
2. **ai-content-generator** - AI-powered content creation
3. **create-admin-token** - Secure admin token generation
4. **test-ai-provider** - AI provider connection testing

### Function Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy get-realtime-token

# Set environment variables for functions
supabase secrets set OPENAI_API_KEY=your_key
supabase secrets set ANTHROPIC_API_KEY=your_key
```

## 🔐 Security Configuration

### Admin Access Control

The platform implements multi-layered admin security:

1. **Database-level checks** - RLS policies verify admin status
2. **Server-side verification** - Edge functions validate admin tokens
3. **Client-side protection** - UI components check admin permissions
4. **Audit logging** - All admin actions are logged

### API Security

- All sensitive endpoints require authentication
- Admin-only functions verify server-side admin status
- Rate limiting prevents abuse of anonymous endpoints
- CORS properly configured for cross-origin requests

### Data Protection

- User data encrypted in transit and at rest
- Anonymous assessments don't store personal information
- GDPR-compliant data handling procedures
- Regular security audits and updates

## 🧪 Testing

### Test Suite

Run the complete test suite:

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Mobile tests (requires iOS simulator)
npm run test:ios
```

### Manual Testing Checklist

#### Web Application
- [ ] User registration and login
- [ ] Anonymous assessment completion
- [ ] Admin panel access and functionality
- [ ] AI content generation
- [ ] Voice conversation features
- [ ] Mobile responsive design

#### Mobile Application
- [ ] App installation and launch
- [ ] Offline assessment completion
- [ ] Data synchronization
- [ ] Push notifications
- [ ] Camera/microphone functionality
- [ ] Deep linking from web

#### Admin Features
- [ ] User management
- [ ] Assessment creation and editing
- [ ] AI content generation
- [ ] Analytics and reporting
- [ ] Voice agent configuration

## 📊 Analytics and Monitoring

### Built-in Analytics

The platform tracks:
- Assessment completion rates
- User engagement metrics
- Popular assessment types
- Performance analytics
- Error rates and issues

### Monitoring Setup

1. **Supabase Dashboard** - Database and API metrics
2. **Vercel Analytics** - Web performance and usage
3. **Custom Logging** - Application-specific events
4. **Error Tracking** - Automated error reporting

### Performance Optimization

- Lazy loading of components and routes
- Image optimization and caching
- Database query optimization
- CDN usage for static assets
- Mobile app offline caching

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] Admin accounts created
- [ ] Backup procedures tested

### Deployment Steps

1. **Build and Test**
   ```bash
   npm run build:production
   npm run test
   ```

2. **Deploy Database**
   ```bash
   supabase db push
   supabase functions deploy
   ```

3. **Deploy Web App**
   ```bash
   # Vercel deployment
   vercel --prod
   
   # Or manual deployment
   npm run deploy:production
   ```

4. **Deploy Mobile App**
   ```bash
   ./scripts/build-ios.sh --testflight
   # Upload to App Store Connect
   # Submit for TestFlight review
   ```

### Post-deployment Verification

1. **Smoke Tests**
   - Homepage loads correctly
   - User registration works
   - Anonymous assessments function
   - Admin panel accessible

2. **Performance Tests**
   - Page load times < 3 seconds
   - Assessment completion < 30 seconds
   - Mobile app responsiveness

3. **Security Tests**
   - Admin endpoints protected
   - Anonymous access working
   - No sensitive data exposed

## 🔄 Maintenance and Updates

### Regular Maintenance

- Weekly dependency updates
- Monthly security patches
- Quarterly feature releases
- Database performance optimization
- Log rotation and cleanup

### Backup Procedures

- Daily database backups (automated by Supabase)
- Weekly full system backup
- Monthly disaster recovery testing
- Configuration backup in version control

### Update Process

1. **Development** - Feature development and testing
2. **Staging** - Full integration testing
3. **Production** - Gradual rollout with monitoring
4. **Rollback** - Quick rollback procedures if needed

## 📞 Support and Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Clear node_modules and reinstall
   - Verify environment variables

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Review RLS policies

3. **Mobile App Issues**
   - Ensure Xcode is up to date
   - Check iOS deployment target
   - Verify signing certificates

4. **AI Feature Issues**
   - Verify API keys are set
   - Check rate limits
   - Review model availability

### Support Contacts

- **Technical Issues**: Create GitHub issue
- **Security Concerns**: security@newomen.me
- **General Support**: support@newomen.me

### Documentation

- **API Documentation**: `/docs/api`
- **Component Library**: `/docs/components`
- **Database Schema**: `/docs/database`
- **Mobile Development**: `/docs/mobile`

## 📈 Scaling Considerations

### Performance Scaling

- **Database**: Supabase automatically scales
- **Edge Functions**: Serverless auto-scaling
- **CDN**: Global content distribution
- **Caching**: Redis for session management

### Feature Scaling

- **Multi-language Support**: i18n implementation ready
- **Multi-tenant**: Architecture supports multiple organizations
- **API Versioning**: Structured for backward compatibility
- **Mobile Platforms**: Android support can be added

### Cost Optimization

- **Supabase**: Monitor database usage and optimize queries
- **Vercel**: Use appropriate plan based on traffic
- **AI APIs**: Implement caching and rate limiting
- **Storage**: Optimize media storage and delivery

---

## 🎯 Success Metrics

### Key Performance Indicators

- **User Engagement**: Daily/Monthly active users
- **Assessment Completion**: Completion rate > 80%
- **Mobile Adoption**: iOS app installs and usage
- **AI Usage**: Content generation requests
- **Performance**: Page load times < 3 seconds

### Business Metrics

- **User Growth**: Month-over-month growth rate
- **Retention**: 7-day and 30-day retention rates
- **Conversion**: Anonymous to registered user conversion
- **Satisfaction**: User feedback and ratings

---

This deployment guide ensures a successful launch of the Newomen platform with all features working correctly across web and mobile platforms. Regular updates to this guide will be made as the platform evolves.