# Complete Deployment Guide for Newomen.me All-App

## 🚀 Deployment Overview

This guide covers the complete deployment process for the Newomen.me application with assessments, AI content generation, and iOS mobile app.

## 📋 Prerequisites

- Supabase account with a project created
- Vercel/Netlify account for web hosting
- API keys for AI providers (OpenAI, Anthropic, Google)
- macOS with Xcode for iOS development
- Node.js 18+ installed

## 🔧 Step 1: Environment Configuration

1. Create a `.env` file with your credentials:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_ACCESS_TOKEN=your-access-token

# AI Providers (for edge functions)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

## 📊 Step 2: Database Setup

### Option A: Manual Migration (Recommended)

1. Open `combined-assessments-migration.sql` that was generated
2. Go to your Supabase Dashboard > SQL Editor
3. Copy and paste the entire content
4. Click "Run" to execute all migrations

### Option B: Using Supabase CLI

```bash
# Link your project
npx supabase link --project-ref your-project-id

# Apply migrations
npx supabase db push
```

## 🔌 Step 3: Deploy Edge Functions

1. Set environment variables:
```bash
export SUPABASE_PROJECT_ID=your-project-id
export SUPABASE_ACCESS_TOKEN=your-access-token
```

2. Deploy the function:
```bash
./deploy-edge-functions.sh
```

3. Add API keys in Supabase Dashboard:
   - Go to Edge Functions > create-assessment
   - Add environment variables:
     - `OPENAI_API_KEY`
     - `ANTHROPIC_API_KEY`
     - `GOOGLE_API_KEY`

## 🌐 Step 4: Deploy Web Application

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Set environment variables in Vercel Dashboard

### Netlify Deployment

1. Build the app:
```bash
npm run build
```

2. Deploy using Netlify CLI:
```bash
netlify deploy --prod --dir=dist
```

3. Set environment variables in Netlify Dashboard

## 📱 Step 5: iOS App Deployment

1. Open the iOS project:
```bash
npx cap open ios
```

2. In Xcode:
   - Select your development team
   - Update bundle identifier if needed
   - Configure signing certificates

3. Build and test on simulator:
   - Select a simulator device
   - Click "Run" (⌘R)

4. Deploy to App Store:
   - Archive the app (Product > Archive)
   - Upload to App Store Connect
   - Submit for review

## ✅ Step 6: Post-Deployment Checklist

- [ ] Test all 6 free assessments (no login required)
- [ ] Test user registration and login
- [ ] Test accessing private assessments
- [ ] Test AI content generation in admin panel
- [ ] Test assessment taking and results
- [ ] Test mobile responsiveness
- [ ] Test iOS app functionality

## 🔒 Security Configuration

1. Configure RLS policies (already in migrations)
2. Set up secure API key storage
3. Configure CORS in edge functions
4. Enable rate limiting in Supabase

## 🎯 API Endpoints

### Assessments
- GET `/rest/v1/assessments?visibility=eq.public` - Get public assessments
- GET `/rest/v1/assessments?visibility=eq.private` - Get private assessments (auth required)

### Edge Functions
- POST `/functions/v1/create-assessment` - Generate AI content

## 🐛 Troubleshooting

### Common Issues

1. **Migration Errors**
   - Ensure you're using the service role key for migrations
   - Check if tables already exist and drop them first if needed

2. **Edge Function Errors**
   - Verify API keys are set correctly
   - Check function logs in Supabase Dashboard

3. **Build Errors**
   - Run `npm install --legacy-peer-deps` to fix dependency issues
   - Clear cache: `rm -rf node_modules && npm install`

4. **iOS Build Errors**
   - Ensure CocoaPods is installed: `sudo gem install cocoapods`
   - Run `cd ios && pod install`

## 📈 Monitoring

1. Set up Supabase alerts for:
   - Database usage
   - Edge function invocations
   - Authentication events

2. Monitor performance:
   - Use Vercel/Netlify analytics
   - Set up Google Analytics
   - Monitor Core Web Vitals

## 🎉 Launch Checklist

- [ ] All migrations applied successfully
- [ ] Edge functions deployed and tested
- [ ] Environment variables configured
- [ ] SSL certificates active
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] iOS app approved (if applicable)

## 📞 Support

For deployment support:
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
- Capacitor: https://capacitorjs.com/docs

---

🚀 Your Newomen.me app is now ready for production!