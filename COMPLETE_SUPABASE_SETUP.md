# Complete Supabase Setup Guide

## Your Credentials
```
SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo
DATABASE_URL=postgresql://postgres:Mirxa420$@db.ufgqmqoykddaotdbwteg.supabase.co:5432/postgres
```

## Step 1: Apply Database Migrations

1. Go to Supabase SQL Editor:
   https://app.supabase.com/project/ufgqmqoykddaotdbwteg/sql/new

2. Copy and paste the contents of `/workspace/apply-all-migrations.sql`

3. Click "Run" to execute all migrations

This will:
- Create all necessary tables with proper structure
- Set up RLS policies
- Create storage buckets
- Add PayPal support
- Fix the notification_preferences and performance_metrics tables
- Create helper functions and triggers

## Step 2: Deploy Edge Functions

Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/functions

For each function below:
1. Click "New Function"
2. Name it exactly as shown
3. Copy the code from the corresponding file
4. Deploy

Functions to deploy:
- **get-realtime-token** - `/workspace/supabase/functions/get-realtime-token/index.ts`
- **realtime-voice-proxy** - `/workspace/supabase/functions/realtime-voice-proxy/index.ts`
- **test-ai-provider** - `/workspace/supabase/functions/test-ai-provider/index.ts`
- **paypal-oauth** - `/workspace/supabase/functions/paypal-oauth/index.ts`
- **create-paypal-subscription** - `/workspace/supabase/functions/create-paypal-subscription/index.ts`
- **process-assessment** - `/workspace/supabase/functions/process-assessment/index.ts`
- **analytics** - `/workspace/supabase/functions/analytics/index.ts`

## Step 3: Set Edge Function Secrets

Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/settings/vault

Add these secrets:
- `OPENAI_API_KEY` - Your OpenAI API key (required for voice chat)
- `PAYPAL_CLIENT_ID` - Your PayPal client ID
- `PAYPAL_CLIENT_SECRET` - Your PayPal client secret
- `PAYPAL_MODE` - Set to "sandbox" for testing or "live" for production
- `PAYPAL_WEBHOOK_ID` - Your PayPal webhook ID

## Step 4: Configure Authentication

Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/auth/url-configuration

Set:
- **Site URL**: `https://newomen.me`
- **Redirect URLs**:
  - `https://newomen.me/auth/callback`
  - `https://newomen.me/auth/reset-password`
  - `https://newomen.me/auth/verify`
  - `https://newomen.me/auth/update-password`

## Step 5: Enable Auth Providers (Optional)

Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/auth/providers

Enable providers as needed:
- Email (already enabled by default)
- Google OAuth
- GitHub OAuth

## Step 6: Build and Deploy Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Deploy to your platform:
   - **Vercel**: `npx vercel --prod`
   - **Netlify**: `npx netlify deploy --prod`
   - **Custom**: Upload `dist` folder to your server

## Step 7: Verify Deployment

After deployment, verify:

1. **Database Tables**: Check that all tables are created
   - Go to Table Editor: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/editor
   - Verify these tables exist:
     - user_profiles
     - performance_metrics
     - notification_preferences
     - error_logs
     - paypal_products
     - paypal_plans
     - voice_sessions
     - voice_agent_configs

2. **Edge Functions**: Test each function
   - Go to Functions: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/functions
   - Check logs for each function

3. **Authentication**: Test login flow
   - Try registering a new user
   - Test password reset
   - Verify email confirmation

4. **Storage**: Check buckets
   - Go to Storage: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/storage/buckets
   - Verify these buckets exist:
     - avatars
     - documents
     - voice-recordings
     - exports

## OpenAI Models Fix

The OpenAI models are now loaded from a fixed list to ensure they're always available. The implementation includes:

1. **Fixed Models List** (`/workspace/src/services/ai/openai-models-fix.ts`):
   - All GPT models (GPT-4, GPT-4 Turbo, GPT-3.5, etc.)
   - Realtime models for voice chat
   - Audio models (Whisper, TTS)
   - Vision models
   - Embedding models

2. **Fallback Strategy**:
   - First tries to load from the fixed list (always works)
   - Then tries to fetch from OpenAI API (if API key is valid)
   - Merges both lists, removing duplicates
   - Falls back to fixed list if API fails

3. **Model Organization**:
   - Models are sorted by type (realtime first, then GPT-4, GPT-3.5, etc.)
   - Each model includes all metadata (tokens, capabilities, costs)

## Troubleshooting

### Common Issues:

1. **"user_profiles not found" error**:
   - Run the migrations SQL in Step 1
   - Check Table Editor to verify table exists

2. **"performance_metrics timestamp error"**:
   - The migration fixes timestamp handling
   - Verify the table structure after migration

3. **"OpenAI models not showing"**:
   - Models now load from fixed list, so this should be resolved
   - Check browser console for any API errors
   - Verify OPENAI_API_KEY is set in edge function secrets

4. **"CORS error on edge functions"**:
   - Ensure functions are deployed with proper CORS headers
   - Check that `x-application-version` is included in CORS headers

5. **"PayPal not working"**:
   - Set PayPal secrets in Step 3
   - Ensure PayPal tables are created (Step 1)
   - Check PayPal mode (sandbox vs live)

## Final Verification

Your setup is complete when:
- ✅ All database tables are created
- ✅ Edge functions are deployed and have secrets
- ✅ Authentication is configured with proper URLs
- ✅ OpenAI models appear in the admin panel
- ✅ Voice chat connects successfully
- ✅ No errors in browser console

## Support

If you encounter issues:
1. Check Supabase logs: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/logs/explorer
2. Review edge function logs
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly