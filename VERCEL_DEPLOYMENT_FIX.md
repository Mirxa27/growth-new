# 🔧 Vercel Deployment Fix

## Issue Fixed
The deployment was failing because `vercel.json` was referencing secrets that don't exist:
- `@supabase_url` 
- `@supabase_anon_key`

## Solution Applied
1. Removed the `env` section from `vercel.json` 
2. Environment variables should be set directly in Vercel Dashboard

## Steps to Complete Deployment

### 1. Set Environment Variables in Vercel

Go to your Vercel project dashboard:
1. Navigate to **Settings** → **Environment Variables**
2. Add these variables:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key

### 2. Redeploy

Option A: From Vercel Dashboard
- Go to your project → **Deployments**
- Click **Redeploy** on the latest deployment

Option B: From CLI
```bash
vercel --prod
```

### 3. Alternative: Using .env.production

If you prefer, create a `.env.production` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then update the build command in Vercel to:
```bash
npm install --legacy-peer-deps && npm run build
```

## Updated vercel.json

The `vercel.json` file now contains only the necessary configuration without environment variable references:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, immutable, max-age=31536000"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Next Steps

1. Push this change to trigger a new deployment
2. Set the environment variables in Vercel Dashboard
3. The deployment should succeed

## Additional Notes

- Make sure you're using the correct Supabase project URL and anon key
- These values can be found in your Supabase project settings
- The build command in Vercel should handle legacy peer dependencies if needed