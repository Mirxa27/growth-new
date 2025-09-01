# 🔧 Deployment Error Fixes

## Error Analysis

### ✅ **Ignore These (Browser Extension Errors):**
```
chrome-extension://...content.js:2 Uncaught SyntaxError
content script loaded
contentSelector-csui.js
floatingSphere-csui.js
utils-csui.js
```
**These are from browser extensions** (possibly an AI assistant or password manager). They don't affect your app.

### 🔴 **Real Issue to Fix:**
```
admin:1 Failed to load resource: the server responded with a status of 404
```
This is likely the `/admin` route not being found.

## Solutions

### 1. **Fix 404 Error on /admin Route**

The issue is that Vercel needs to know to serve `index.html` for all routes (SPA routing).

#### Verify vercel.json has rewrites:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. **Environment Variables Check**

Make sure you've set these in Vercel Dashboard:

1. Go to: https://vercel.com/your-username/your-project/settings/environment-variables
2. Add these variables:

```env
VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_OPENAI_API_KEY=sk-...
```

3. **Redeploy after adding variables!**

### 3. **Database Setup Required**

The 404 might also be from missing database tables. Run this in Supabase SQL Editor:

```sql
-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Anyone can read system settings"
    ON public.system_settings FOR SELECT USING (true);

-- Add default OpenAI settings
INSERT INTO public.system_settings (category, settings)
VALUES ('openai', '{"apiKey": "", "chatModel": "gpt-4o-mini"}'::jsonb)
ON CONFLICT (category) DO NOTHING;

-- Add role to profiles if missing
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
```

### 4. **Quick Debugging Steps**

1. **Check Console Network Tab:**
   - Look for the exact 404 URL
   - Is it `/admin` or an API call?

2. **Test These URLs:**
   - `https://your-app.vercel.app/` (should work)
   - `https://your-app.vercel.app/admin` (should load the admin page)
   - `https://your-app.vercel.app/dashboard` (should load dashboard)

3. **If Routes Don't Work:**
   - The app needs a redeploy after vercel.json changes
   - Run: `vercel --prod` to force a new deployment

### 5. **Browser Extension Conflicts**

To test without extension interference:
1. Open Chrome Incognito Mode (Ctrl+Shift+N)
2. Or disable extensions temporarily
3. Test your app again

## Verification Checklist

- [ ] vercel.json has rewrite rules
- [ ] Environment variables set in Vercel
- [ ] Database migrations run in Supabase
- [ ] Redeployed after configuration changes
- [ ] Tested in incognito mode

## Common Vercel Deployment Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Routes return 404 | Missing rewrites | Add rewrite rules to vercel.json |
| API calls fail | Missing env vars | Set in Vercel dashboard |
| Database errors | Tables don't exist | Run SQL migrations |
| Blank page | Build error | Check build logs |

## Need More Help?

1. **Share the exact 404 URL** from Network tab
2. **Check Vercel Function Logs**: Dashboard → Functions → Logs
3. **Share your deployment URL** for testing

The browser extension errors are harmless and can be ignored. Focus on fixing the 404 error which is likely a routing or database issue.