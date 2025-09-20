# Newomen.me Platform

A comprehensive personal growth and assessment platform with mobile app, AI-powered content generation, and voice conversations. Built with React, TypeScript, Supabase, and Capacitor.

## 🎯 Project Status: Production Ready ✅

**All core requirements implemented and tested:**
- ✅ iOS mobile app with offline sync and TestFlight deployment
- ✅ 6 types of anonymous assessments (no signup required)
- ✅ AI-powered admin panel with content generation
- ✅ Secure admin verification and audit logging
- ✅ 20 seeded assessments with varied difficulty levels
- ✅ Voice-to-voice AI conversations using OpenAI Realtime API
- ✅ Comprehensive deployment and QA documentation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase CLI
- Xcode (for iOS builds)

### Installation
```bash
git clone <repository-url>
cd newomen-platform
npm install --legacy-peer-deps
```

### Environment Setup
```bash
cp .env.example .env.local
# Configure your environment variables
```

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### iOS Mobile App
```bash
chmod +x ./scripts/build-ios.sh
./scripts/build-ios.sh --dev        # Development build
./scripts/build-ios.sh --testflight # TestFlight build
```

## 📱 Features

### Anonymous Assessments (No Signup Required)
- **Multiple Choice**: Traditional quiz format with immediate feedback
- **True/False**: Quick binary choice assessments
- **Short Answer**: Open-ended reflection questions
- **Timed Quiz**: Time-pressured knowledge testing
- **Image Identification**: Visual pattern recognition tasks
- **Audio Response**: Voice-based question answering

### Mobile App (iOS)
- **Offline Functionality**: Complete assessments without internet
- **Push Notifications**: Assessment reminders and insights
- **Deep Linking**: Direct links to assessments and courses
- **Native Permissions**: Camera, microphone, location access
- **Background Sync**: Automatic data synchronization

### Admin Panel
- **AI Content Builder**: Generate assessments with OpenAI/Anthropic/Google AI
- **Assessment Management**: Create, edit, and publish assessments
- **User Management**: Monitor user activity and permissions
- **Analytics Dashboard**: Track engagement and performance metrics
- **Voice Agent Configuration**: Manage AI voice conversations

### Voice AI Integration
- **Real-time Conversations**: Voice-to-voice AI using OpenAI Realtime API
- **Multiple Voices**: Choose from 6 different AI voice personalities
- **Admin Access**: Secure voice features for admin users only
- **Audio Processing**: High-quality audio streaming and processing

## 🏗️ Architecture

```
Web App (React/Vite) ←→ iOS Mobile App (Capacitor) ←→ Admin Panel
                    ↓
            Supabase Backend
            ├── PostgreSQL Database
            ├── Edge Functions (Deno)
            ├── Authentication
            └── Real-time Subscriptions
                    ↓
            External APIs
            ├── OpenAI (GPT-4, Realtime API)
            ├── Anthropic (Claude)
            └── Google AI (Gemini)
```

## 🗄️ Database Schema

### Core Tables
- **assessments**: Assessment definitions and metadata
- **assessment_questions**: Individual questions with types and content
- **assessment_options**: Answer choices for multiple choice questions
- **assessment_attempts**: User attempt records (anonymous and authenticated)
- **assessment_responses**: Individual question responses
- **assessment_analytics**: Performance metrics and insights

### AI & Admin Tables
- **ai_build_jobs**: AI content generation job tracking
- **admin_ai_providers**: AI provider configurations
- **admin_logs**: Audit trail for admin actions
- **voice_sessions**: Voice conversation session logs

### User & Course Tables
- **profiles**: User profiles with role-based permissions
- **courses**: Structured learning paths
- **course_progress**: User progress tracking
- **explorations**: Guided self-discovery experiences

## 🔐 Security

### Multi-Layer Admin Protection
1. **Database Level**: Row Level Security (RLS) policies
2. **Server Functions**: Edge functions validate admin status server-side
3. **Client Protection**: UI components verify admin permissions
4. **Audit Trail**: All admin actions logged with details

### Anonymous User Privacy
- No personal data collection for anonymous assessments
- Rate limiting prevents abuse
- Session-based tracking without identification
- GDPR-compliant data handling

## 🧪 Testing

### Automated Testing
```bash
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:ios          # Mobile tests
```

### Manual Testing
- Complete QA testing guide in `QA_TESTING_GUIDE.md`
- All 6 assessment types tested across web and mobile
- Admin panel functionality verified
- Security endpoints tested for proper access control

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)**: Complete deployment instructions
- **[QA Testing Guide](QA_TESTING_GUIDE.md)**: Comprehensive testing procedures
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)**: Detailed feature overview
- **[API Documentation](docs/api/)**: API endpoint documentation

## 🚀 Deployment

### Web Application (Vercel/Netlify)
```bash
npm run build:production
npm run deploy:vercel     # Deploy to Vercel
npm run deploy:netlify    # Deploy to Netlify
```

### Database (Supabase)
```bash
supabase db push          # Apply migrations
supabase functions deploy # Deploy edge functions
```

### Mobile App (iOS)
```bash
./scripts/build-ios.sh --testflight
# Upload IPA to App Store Connect
# Submit for TestFlight review
```

## 🔧 Configuration

### Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_AI_API_KEY=your_google_ai_key

# App Configuration
VITE_APP_URL=https://your-domain.com
VITE_ENVIRONMENT=production
```

### AI Provider Setup
1. Configure API keys in environment or admin panel
2. Select preferred AI provider for content generation
3. Configure voice settings for realtime conversations
4. Set up rate limits and usage monitoring

## 📊 Analytics

### Built-in Metrics
- Assessment completion rates and scores
- User engagement and retention
- Popular assessment types and topics
- Mobile vs web usage patterns
- AI content generation usage

### Performance Monitoring
- Real-time error tracking
- Performance metrics and alerts
- User experience monitoring
- Security event logging

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Run QA testing procedures
5. Submit pull request with documentation

### Code Standards
- TypeScript with strict mode
- ESLint and Prettier configuration
- Component-based architecture
- Comprehensive error handling
- Accessibility (WCAG AA) compliance

## 📞 Support

- **Technical Issues**: Create GitHub issue
- **Security Concerns**: security@newomen.me
- **General Support**: support@newomen.me

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🎉 Project Highlights

This implementation represents a complete, production-ready personal growth platform featuring:

- **Comprehensive Mobile Experience**: Full-featured iOS app with offline capabilities
- **Advanced Assessment System**: 6 different assessment types with anonymous access
- **AI-Powered Content Creation**: Automated generation of assessments and courses
- **Real-time Voice Conversations**: OpenAI Realtime API integration
- **Enterprise-Grade Security**: Multi-layer admin verification and audit logging
- **Scalable Architecture**: Built for growth with modern technologies

**Ready for immediate deployment and user engagement!**