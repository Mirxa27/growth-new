# Deployment Troubleshooting Guide

## Common Deployment Errors and Solutions

### 1. TypeScript Errors During Build

If you're getting TypeScript errors during deployment:

```bash
# Option 1: Build with relaxed TypeScript checking
npm run build

# Option 2: Skip TypeScript checking entirely
SKIP_PREFLIGHT_CHECK=true npm run build
```

### 2. Vercel Deployment Issues

#### Environment Variables Not Found
- Go to Vercel Dashboard > Settings > Environment Variables
- Add these required variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

#### Build Command Failed
Update your build command in Vercel:
```
npm install --legacy-peer-deps && npm run build
```

### 3. Supabase Connection Issues

#### Database Not Found
1. Copy content from `combined-assessments-migration.sql`
2. Go to Supabase Dashboard > SQL Editor
3. Paste and run the entire SQL

#### Edge Function Not Working
```bash
# Make sure you have the required tokens
export SUPABASE_PROJECT_ID=your-project-id
export SUPABASE_ACCESS_TOKEN=your-access-token

# Deploy the function
./deploy-edge-functions.sh
```

### 4. Quick Fix Script

Run this to fix most common issues:

```bash
# Fix dependencies
npm install --legacy-peer-deps

# Fix TypeScript errors
./fix-critical-errors.sh

# Rebuild
npm run build

# Check deployment readiness
node deployment-check.js
```

### 5. Manual Vercel Deployment

If the CLI isn't working, try manual deployment:

1. Build locally:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder to Vercel:
   - Go to vercel.com
   - Drag and drop the `dist` folder
   - Set framework preset to "Vite"
   - Add environment variables

### 6. Netlify Alternative

If Vercel continues to fail:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### 7. Environment Variables Template

Create `.env.production`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 8. Database Migration Issues

If migrations fail in Supabase:

1. Drop existing tables (if any):
   ```sql
   DROP TABLE IF EXISTS assessment_results CASCADE;
   DROP TABLE IF EXISTS assessment_options CASCADE;
   DROP TABLE IF EXISTS assessment_questions CASCADE;
   DROP TABLE IF EXISTS assessments CASCADE;
   ```

2. Run migrations one by one from the SQL editor

### 9. Build Size Issues

If the build is too large:

```bash
# Analyze bundle size
npm run build -- --report

# Remove unused dependencies
npm prune --production
```

### 10. Emergency Deployment

For immediate deployment without fixing all issues:

1. Create a new file `emergency-build.sh`:
   ```bash
   #!/bin/bash
   export SKIP_PREFLIGHT_CHECK=true
   export CI=false
   npm run build || true
   ```

2. Run it:
   ```bash
   chmod +x emergency-build.sh
   ./emergency-build.sh
   ```

3. Deploy the `dist` folder manually to any static hosting service

## Still Having Issues?

1. Check the browser console for runtime errors
2. Verify Supabase project is active and not paused
3. Ensure all API keys are correctly set
4. Try deploying to a different service (Netlify, Surge, etc.)

## Contact Support

If deployment continues to fail:
- Check Vercel status: status.vercel.com
- Check Supabase status: status.supabase.com
- Review logs in deployment platform dashboard