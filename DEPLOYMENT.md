# Deployment Guide

This document provides comprehensive instructions for deploying the Newomen Platform to production.

## Overview

The platform consists of:
- **Frontend**: Vite + React application deployed to Vercel
- **Backend**: Supabase with PostgreSQL database and Edge Functions
- **CI/CD**: GitHub Actions workflows for automated deployment

## Prerequisites

### Required Accounts
1. **Vercel Account** - For frontend hosting
2. **Supabase Account** - For backend services
3. **GitHub Account** - For repository and CI/CD

### Required API Keys
1. **OpenAI API Key** - For AI features
2. **Anthropic API Key** - For AI features (optional)
3. **Google AI API Key** - For AI features (optional)

## Deployment Steps

### 1. Supabase Setup

1. Create a new Supabase project
2. Set up the database schema using migrations:
   ```bash
   supabase db push
   ```
3. Get your project credentials:
   - Project URL: `https://your-project.supabase.co`
   - Anon Key: `eyJ...` (public key)
   - Service Role Key: `eyJ...` (private key)

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Vercel Secrets
- `VERCEL_TOKEN` - Your Vercel deployment token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

#### Supabase Secrets
- `SUPABASE_ACCESS_TOKEN` - Supabase CLI access token
- `SUPABASE_PROJECT_ID` - Your Supabase project reference ID
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

#### Application Environment Variables
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_APP_URL` - Your production domain (e.g., https://yourapp.vercel.app)
- `VITE_OPENAI_API_KEY` - Your OpenAI API key
- `VITE_OPENAI_ORGANIZATION_ID` - Your OpenAI organization ID (optional)
- `VITE_ANTHROPIC_API_KEY` - Your Anthropic API key (optional)
- `VITE_GOOGLE_AI_API_KEY` - Your Google AI API key (optional)

#### AI Provider Secrets (for Supabase Functions)
- `OPENAI_API_KEY` - OpenAI API key for server-side functions
- `ANTHROPIC_API_KEY` - Anthropic API key for server-side functions
- `GOOGLE_AI_API_KEY` - Google AI API key for server-side functions

### 3. Vercel Project Setup

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - **Framework**: Vite
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install --legacy-peer-deps`

3. Add environment variables in Vercel dashboard (Settings → Environment Variables)

### 4. Deploy

#### Automatic Deployment
Push to the `main` branch to trigger automatic deployment:
```bash
git push origin main
```

#### Manual Deployment
Use GitHub Actions workflow dispatch:
1. Go to Actions tab in GitHub
2. Select "Deploy to Vercel" workflow
3. Click "Run workflow"
4. Choose environment (preview/production)

#### Supabase Functions Deployment
Functions are automatically deployed when changes are made to `supabase/functions/` directory.

Manual deployment:
1. Go to Actions tab in GitHub
2. Select "Deploy Supabase Functions" workflow
3. Click "Run workflow"

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file (not committed to git):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_URL=https://your-domain.vercel.app
VITE_ENVIRONMENT=production
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_OPENAI_ORGANIZATION_ID=your_org_id_here
```

### Local Development

For local development, use `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_URL=http://localhost:5173
VITE_ENVIRONMENT=development
```

## Verification

After deployment, verify:

1. **Frontend**: Visit your Vercel URL
2. **API**: Test Supabase connection
3. **Functions**: Test edge functions endpoints
4. **Features**: 
   - User authentication
   - Assessment system
   - Voice features (if enabled)
   - Admin panel

## Monitoring

### Vercel Dashboard
- Monitor deployment logs
- View analytics
- Check performance metrics

### Supabase Dashboard
- Monitor database performance
- View function logs
- Check authentication metrics

### GitHub Actions
- Monitor workflow runs
- Check deployment status
- View build logs

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (should be 18+)
   - Verify environment variables
   - Check for TypeScript errors

2. **Deployment Failures**
   - Verify Vercel tokens
   - Check build command configuration
   - Ensure all dependencies are installed

3. **Function Deployment Issues**
   - Verify Supabase access token
   - Check function code for errors
   - Ensure secrets are properly set

4. **Runtime Errors**
   - Check browser console for errors
   - Verify API keys are working
   - Check Supabase connection

### Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Check Supabase function logs
4. Consult documentation for specific services

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to git
2. **API Keys**: Use different keys for development and production
3. **CORS**: Configure proper CORS settings in Supabase
4. **RLS**: Ensure Row Level Security is enabled on all tables
5. **HTTPS**: Always use HTTPS in production (Vercel provides this automatically)

## Performance Optimization

1. **Bundle Size**: Monitor and optimize bundle size
2. **Caching**: Leverage Vercel's caching capabilities
3. **Images**: Optimize images and use WebP format
4. **Code Splitting**: Ensure proper code splitting is configured
5. **CDN**: Vercel automatically provides global CDN distribution

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor security vulnerabilities
- Review and rotate API keys
- Monitor performance metrics
- Update documentation

### Scaling Considerations
- Monitor Vercel usage limits
- Watch Supabase database usage
- Consider upgrading plans as needed
- Implement caching strategies for high traffic