# Environment Setup Guide

## 🔑 API Key Configuration

### OpenAI API Key Setup

The deployment errors show an invalid OpenAI API key. Here's how to fix it:

#### 1. Get a Valid OpenAI API Key
- Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
- Sign in or create an account
- Click "Create new secret key"
- Copy the key (format: `sk-proj-...` or `sk-...`)

#### 2. Configure Environment Variables

Create or update `.env.local`:
```env
# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=sk-proj-your_actual_api_key_here

# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key

# Service Role Key (Required for admin functions)
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# App Configuration
VITE_APP_URL=https://growth-g7cv9ldrr-mirxa27s-projects.vercel.app
VITE_ENVIRONMENT=production
```

#### 3. Validate API Keys
```bash
# Test your API keys
node scripts/validate-api-keys.js
```

### Supabase Database Setup

The errors also show missing database tables. Fix this by:

#### 1. Apply Database Migrations
```bash
# If you have Supabase CLI
supabase db push

# Or apply migrations manually in Supabase dashboard
# Run all SQL files from supabase/migrations/ in order
```

#### 2. Create Missing Tables
Run this SQL in your Supabase SQL editor:

```sql
-- Create user_profiles table if missing
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_admin BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;
```

#### 3. Seed Assessment Data
```bash
# Populate with 20 ready-to-use assessments
npm run seed-assessments
```

## 🚀 Fixed Deployment Process

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your actual values
# Validate configuration
npm run check-config
```

### 2. Database Setup
```bash
# Apply all migrations (creates all required tables)
# Run in Supabase SQL editor or via CLI

# Seed assessments
npm run seed-assessments
```

### 3. Build and Deploy
```bash
# Build with all fixes applied
npm run build:production

# Deploy to Vercel
npm run deploy:vercel

# Verify deployment
node scripts/verify-deployment.js https://your-domain.vercel.app
```

### 4. Post-Deployment Verification
```bash
# Check that these work:
# 1. Homepage loads without errors
# 2. Assessment hub accessible: /mobile-assessment-hub
# 3. Admin panel accessible: /admin (with admin account)
# 4. API endpoints respond correctly
```

## 🔧 Troubleshooting Common Issues

### API Key Errors
**Error**: `Incorrect API key provided`
**Solution**: 
1. Get fresh API key from OpenAI Platform
2. Ensure key format is correct (`sk-proj-...` or `sk-...`)
3. Set in environment variables
4. Redeploy application

### Database Table Missing
**Error**: `relation "public.user_profiles" does not exist`
**Solution**:
1. Apply database migrations
2. Create missing tables manually
3. Verify RLS policies are set
4. Grant proper permissions

### Chrome Extension Conflicts
**Error**: `Cannot use import statement outside a module`
**Solution**:
- Extension protection is now automatically included
- Errors are caught and ignored
- App functionality not affected

### Build Failures
**Error**: Capacitor import errors
**Solution**:
- All Capacitor modules now use dynamic imports
- Web builds exclude mobile modules
- Mobile features work when available

## 📱 Mobile App Configuration

After web deployment, update mobile app:

### 1. Update Capacitor Config
Edit `capacitor.config.ts`:
```typescript
server: {
  url: 'https://your-actual-vercel-domain.vercel.app'
}
```

### 2. Rebuild iOS App
```bash
# Development build
./scripts/build-ios.sh --dev

# TestFlight build
./scripts/build-ios.sh --testflight
```

### 3. Test Deep Linking
Verify these URLs work:
- `newomen://assessment/personality-type-indicator`
- `newomen://course/sample-course`
- `newomen://admin?token=admin_token`

## ✅ Verification Checklist

After setup, verify:
- [ ] OpenAI API key is valid and working
- [ ] Database tables exist and are accessible
- [ ] Web app builds and deploys successfully
- [ ] Anonymous assessments work without signup
- [ ] Admin panel accessible with proper permissions
- [ ] Mobile app builds without errors
- [ ] All acceptance criteria are met

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ No 401 errors on API calls
- ✅ No 404 errors on database queries
- ✅ No Chrome extension conflicts
- ✅ Page load times under 3 seconds
- ✅ All assessment types work correctly
- ✅ Admin features accessible to admin users only

---

## 🎉 Ready for Production!

Once these environment issues are resolved, your Newomen platform will be fully operational with all features working correctly!

**All code is complete and deployment-ready - just need proper API keys and database setup!** 🚀