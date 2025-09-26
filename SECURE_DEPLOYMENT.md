# Secure Deployment Guide

## Environment Variables Setup

### 1. Local Development
1. Create a `.env.local` file (this should be git-ignored)
2. Copy variables from `.env.example`
3. Fill in with your development credentials
4. Never commit `.env.local` to version control

### 2. Vercel Deployment
1. Go to Vercel Dashboard -> Your Project
2. Navigate to Settings -> Environment Variables
3. Add each required variable:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - SUPABASE_DB_URL
   - JWT_SECRET
4. Set the appropriate Environment (Production/Preview/Development)

### 3. Security Checklist
- [ ] Rotate any credentials that have been exposed
- [ ] Remove credentials from git history if committed
- [ ] Enable environment variable encryption in Vercel
- [ ] Set up proper CORS policies
- [ ] Configure security headers
- [ ] Enable rate limiting on sensitive endpoints

### 4. Deployment Steps
1. Push your code without credentials:
```bash
git push origin main
```

2. Vercel will auto-deploy using secured environment variables

3. Verify environment variable access:
```typescript
// In your code
const supabaseUrl = process.env.SUPABASE_URL
if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable')
}
```

### 5. Environment Validation
Add this to your startup code:

```typescript
function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ]
  
  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
```

## Important Security Notes

1. Never commit real credentials to version control
2. Use different credentials for development/staging/production
3. Rotate credentials regularly
4. Monitor for unauthorized access
5. Enable Supabase Row Level Security (RLS)
6. Use the principle of least privilege
