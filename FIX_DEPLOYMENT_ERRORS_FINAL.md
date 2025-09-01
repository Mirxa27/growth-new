# 🔧 Fix Deployment Errors - Complete Guide

## Current Errors

1. **OpenAI 401 Error**: `api.openai.com/v1/models:1 Failed to load resource: 401`
2. **CORS Error**: `x-application-version is not allowed by Access-Control-Allow-Headers`
3. **Chrome Extension Error**: Can be ignored (not your app)

## ✅ Complete Fix Instructions

### Step 1: Deploy Edge Functions with Correct CORS

```bash
# 1. Install Supabase CLI if not installed
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link your project (get project ref from Supabase dashboard URL)
supabase link --project-ref ufgqmqoykddaotdbwteg

# 4. Deploy all Edge Functions
supabase functions deploy test-ai-provider
supabase functions deploy openai-proxy
supabase functions deploy get-realtime-token

# 5. Set the OpenAI API key secret
supabase secrets set OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Step 2: Configure Environment Variables

#### For Local Development (.env file)
```env
# Supabase
VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (optional for local dev)
VITE_OPENAI_API_KEY=sk-your-api-key
VITE_USE_OPENAI_PROXY=false
```

#### For Vercel Production
In Vercel Dashboard → Settings → Environment Variables:

```env
# Required
VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Force proxy mode in production (secure)
VITE_USE_OPENAI_PROXY=true

# Don't set VITE_OPENAI_API_KEY in production
```

### Step 3: Apply Database Migrations

In Supabase Dashboard → SQL Editor, run:

```sql
-- Fix missing columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NOW();

-- Set default avatars
UPDATE public.profiles 
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || user_id::text
WHERE avatar_url IS NULL;
```

### Step 4: Verify Edge Functions Are Running

```bash
# Test the functions
curl -X OPTIONS https://ufgqmqoykddaotdbwteg.supabase.co/functions/v1/test-ai-provider \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Headers: x-application-version" \
  -v

# Should return 204 with CORS headers
```

### Step 5: Test OpenAI Connection

```javascript
// In browser console on your deployed app
const response = await fetch('https://ufgqmqoykddaotdbwteg.supabase.co/functions/v1/test-ai-provider', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (await supabase.auth.getSession()).data.session?.access_token,
    'x-application-version': '1.0.0'
  },
  body: JSON.stringify({
    provider: 'openai',
    apiKey: 'test', // Edge function will use server-side key
    model: 'gpt-4o-mini'
  })
});
const data = await response.json();
console.log('Test result:', data);
```

## 🎯 Quick Fixes

### If CORS Error Persists

1. **Check Function Deployment**:
```bash
supabase functions list
# Should show: test-ai-provider, openai-proxy, get-realtime-token
```

2. **Redeploy with Force**:
```bash
supabase functions deploy test-ai-provider --no-verify-jwt
```

3. **Check Logs**:
```bash
supabase functions logs test-ai-provider
```

### If OpenAI 401 Persists

1. **Verify Secret is Set**:
```bash
supabase secrets list
# Should show OPENAI_API_KEY (value hidden)
```

2. **Update Secret**:
```bash
supabase secrets set OPENAI_API_KEY=sk-your-new-key --force
```

3. **Test API Key Directly**:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-api-key" \
  -H "Content-Type: application/json"
```

## 📊 Deployment Checklist

- [ ] Supabase CLI installed
- [ ] Project linked with correct ref
- [ ] Edge Functions deployed
- [ ] OPENAI_API_KEY secret set in Supabase
- [ ] Database migrations applied
- [ ] Vercel environment variables configured
- [ ] VITE_USE_OPENAI_PROXY=true in production

## 🔍 Debugging Commands

```bash
# View function logs
supabase functions logs test-ai-provider --tail

# Check function status
supabase functions list

# Test function locally
supabase functions serve test-ai-provider --env-file .env.local

# Check secrets
supabase secrets list
```

## ✨ Expected Result

After following these steps:
1. ✅ No more 401 errors (API key configured server-side)
2. ✅ No more CORS errors (headers properly configured)
3. ✅ Edge Functions handle all OpenAI calls securely
4. ✅ Production app uses proxy mode automatically

## 🚀 One-Line Deploy Script

Save this as `deploy-fix.sh`:

```bash
#!/bin/bash
echo "🚀 Deploying fixes..."
supabase functions deploy test-ai-provider && \
supabase functions deploy openai-proxy && \
supabase functions deploy get-realtime-token && \
echo "✅ Functions deployed! Don't forget to set OPENAI_API_KEY secret"
```

## 📝 Notes

- The Chrome extension error is NOT from your app - ignore it
- Edge Functions must be deployed for proxy mode to work
- API keys should NEVER be in client-side code in production
- Use proxy mode for security in production