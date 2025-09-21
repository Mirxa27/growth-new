# 🚀 Newomen Platform - Vercel Deployment Guide

## Prerequisites

1. **Node.js** 18+ installed
2. **npm** 8+ installed
3. **Vercel CLI** installed globally (`npm install -g vercel`)
4. **Supabase** project configured
5. **Environment variables** set up

## Environment Variables Required

### Required Variables
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional Variables (for enhanced functionality)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GOOGLE_AI_API_KEY` - Google AI API key
- `VITE_APP_URL` - Your deployed app URL
- `VITE_ENVIRONMENT` - Environment setting

## Quick Deployment (Recommended)

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Build the Application
```bash
npm run build:production
```

### 3. Deploy to Vercel
```bash
npm run deploy:vercel
```

### 4. Alternative: Use the deployment script
```bash
./scripts/deploy-vercel.sh
```

## Manual Deployment Steps

### Step 1: Environment Setup
```bash
# Check and setup environment variables
node scripts/setup-vercel-env.js

# Or manually set environment variables in Vercel dashboard
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

### Step 2: Build Configuration
The application is configured with:
- **Framework**: Vite
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --legacy-peer-deps`

### Step 3: Deploy
```bash
# Deploy to production
vercel --prod

# Or deploy with confirmation prompts
vercel --prod --yes
```

## Configuration Files

### vercel.json
```json
{
  "version": 2,
  "name": "newomen-platform",
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "vite",
  "functions": {
    "src/api/**/*.ts": {
      "runtime": "@vercel/node@2"
    }
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### package.json Scripts
```json
{
  "scripts": {
    "build": "npm run clean && vite build",
    "build:production": "npm run clean && npm run type-check && vite build",
    "build:vercel": "npm run clean && vite build",
    "deploy:vercel": "vercel --prod",
    "vercel-build": "npm run build:vercel"
  }
}
```

## Troubleshooting

### Build Issues

1. **Dependency Conflicts**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **TypeScript Errors**
   ```bash
   npm run type-check
   ```

3. **Missing Environment Variables**
   ```bash
   node scripts/setup-vercel-env.js
   ```

### Runtime Issues

1. **Supabase Connection Issues**
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Check Supabase project status

2. **API Key Issues**
   - Ensure API keys are set in Vercel environment variables
   - Test API connections

3. **CORS Issues**
   - The app includes CORS configuration in `vercel.json`

### Performance Issues

1. **Large Bundle Size**
   - Manual chunks are configured in `vite.config.ts`
   - Tree shaking is enabled by default

2. **Slow Cold Starts**
   - Functions are optimized for performance
   - Edge runtime is used where appropriate

## Post-Deployment Checklist

### ✅ Basic Functionality
- [ ] Homepage loads correctly
- [ ] Anonymous assessment completion works
- [ ] User registration/login functions
- [ ] Admin panel is accessible

### ✅ Core Features
- [ ] AI content generation works
- [ ] Voice agent functionality
- [ ] Assessment creation and management
- [ ] Payment integration (if configured)

### ✅ Mobile Responsiveness
- [ ] App works on mobile devices
- [ ] Touch interactions function properly
- [ ] Responsive design adapts to screen sizes

### ✅ Performance
- [ ] Fast loading times
- [ ] No console errors
- [ ] Proper caching headers

## Environment Configuration

### Development
- Set `VITE_ENVIRONMENT=development`
- Use local Supabase instance if available

### Production
- Set `VITE_ENVIRONMENT=production`
- Configure production Supabase project
- Set up monitoring and analytics

## Monitoring and Analytics

1. **Vercel Analytics**
   - Enabled by default
   - Monitor traffic and performance

2. **Custom Monitoring**
   - Error tracking with Sentry (recommended)
   - Performance monitoring with Vercel

3. **Database Monitoring**
   - Supabase dashboard
   - Query performance insights

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive keys to version control
   - Use Vercel secrets for sensitive data

2. **CORS Configuration**
   - Properly configured in `vercel.json`
   - Restrict origins if necessary

3. **Authentication**
   - Supabase handles auth securely
   - Row Level Security (RLS) policies in place

## Backup and Recovery

1. **Database Backups**
   - Supabase automatic backups
   - Manual export before major changes

2. **Code Backups**
   - Git version control
   - Vercel deployment history

3. **Configuration Backups**
   - Environment variables documented
   - Deployment configurations saved

## Support

If you encounter issues:

1. Check the Vercel dashboard for error logs
2. Review the deployment guide above
3. Check Supabase status and logs
4. Test locally before deploying

## Next Steps

After successful deployment:

1. Set up domain (if not using Vercel domain)
2. Configure custom domains and SSL
3. Set up monitoring and alerting
4. Configure CDN and caching
5. Set up CI/CD pipeline for automated deployments

---

🎉 **Congratulations!** Your Newomen Platform is now deployed on Vercel and ready for users!