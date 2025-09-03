# Manual Deployment Guide for NewoMen.me

## ✅ Completed Steps

1. **Database Migrations** - All SQL migrations have been successfully applied
2. **Environment Configuration** - Production environment files created

## 🔧 Required Manual Steps

### 1. Edge Functions Deployment

Since the Supabase CLI installation failed, you have two options:

#### Option A: Use Supabase Dashboard UI

1. Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/functions
2. Click "New Function" for each:
   - `get-realtime-token`
   - `realtime-voice-proxy`
   - `create-checkout-session`
   - `stripe-webhook`
   - `process-assessment`
   - `analytics`
3. Copy the code from `/workspace/supabase/functions/[function-name]/index.ts`
4. Deploy each function

#### Option B: Use Supabase CLI from another environment

```bash
# Install Supabase CLI on a different machine or use Docker
brew install supabase/tap/supabase

# Login with access token
supabase login

# Link project
supabase link --project-ref ufgqmqoykddaotdbwteg

# Deploy functions
supabase functions deploy get-realtime-token --no-verify-jwt
supabase functions deploy realtime-voice-proxy --no-verify-jwt
supabase functions deploy create-checkout-session --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy process-assessment --no-verify-jwt
supabase functions deploy analytics --no-verify-jwt
```

### 2. Set Edge Function Secrets

Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/settings/vault

Add these secrets:
- `OPENAI_API_KEY`: Your OpenAI API key (required for voice chat)
- `STRIPE_SECRET_KEY`: Your Stripe secret key (optional)
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret (optional)

### 3. Configure Authentication

Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/auth/url-configuration

Set:
- **Site URL**: `https://newomen.me`
- **Redirect URLs**:
  ```
  https://newomen.me/auth/callback
  https://newomen.me/auth/reset-password
  https://newomen.me/auth/verify
  https://newomen.me/auth/update-password
  ```

### 4. Enable OAuth Providers (Optional)

Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/auth/providers

Enable and configure:
- **Google OAuth**:
  - Client ID: Get from Google Cloud Console
  - Client Secret: Get from Google Cloud Console
  - Authorized redirect URI: `https://ufgqmqoykddaotdbwteg.supabase.co/auth/v1/callback`

- **GitHub OAuth**:
  - Client ID: Get from GitHub Developer Settings
  - Client Secret: Get from GitHub Developer Settings
  - Authorization callback URL: `https://ufgqmqoykddaotdbwteg.supabase.co/auth/v1/callback`

### 5. Configure Email Templates

Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/auth/templates

Customize email templates for:
- Confirmation Email
- Password Reset
- Magic Link
- Email Change

### 6. Update Your Application

In your deployment environment, set these environment variables:

```env
VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M
VITE_APP_URL=https://newomen.me
```

### 7. Deploy to Your Domain

```bash
# Build the application
npm run build

# Deploy to your hosting provider
# For example, if using Vercel:
vercel --prod

# Or if using Netlify:
netlify deploy --prod
```

### 8. Configure CORS for Your Domain

Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/settings/api

Add your domain to allowed origins:
- `https://newomen.me`
- `https://www.newomen.me`

### 9. Set up Monitoring

1. **Enable Logging**: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/logs/explorer
2. **Set up Alerts**: Configure alerts for errors and performance issues
3. **Monitor Usage**: Check database, storage, and function usage regularly

## 🔍 Verification Steps

1. **Test Authentication**:
   - Sign up with email
   - Sign in
   - Password reset
   - OAuth login (if configured)

2. **Test Voice Chat**:
   - Ensure OPENAI_API_KEY is set in secrets
   - Test voice-to-voice functionality

3. **Test Database Operations**:
   - Create a goal
   - Complete an assessment
   - Write a journal entry

4. **Test Storage**:
   - Upload an avatar
   - Export user data

## 🚨 Troubleshooting

### CORS Errors
- Ensure your domain is added to allowed origins
- Check edge function CORS headers

### Authentication Issues
- Verify redirect URLs are correctly set
- Check Site URL matches your domain

### Voice Chat Not Working
- Confirm OPENAI_API_KEY is set in edge function secrets
- Check browser console for specific errors
- Try the WebSocket fallback option

### Database Errors
- Check RLS policies are properly configured
- Verify user has necessary permissions
- Check Supabase logs for detailed errors

## 📞 Support

If you encounter issues:
1. Check Supabase logs: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/logs/explorer
2. Review edge function logs
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly