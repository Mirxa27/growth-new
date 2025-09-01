# ✅ Production Deployment Checklist

## 🚀 Pre-Deployment

### Environment Setup
- [ ] Create `.env` file from `.env.example`
- [ ] Set `VITE_SUPABASE_URL`
- [ ] Set `VITE_SUPABASE_ANON_KEY`
- [ ] Set `VITE_OPENAI_API_KEY`
- [ ] Set `VITE_OPENAI_ORGANIZATION_ID` (optional)

### Supabase Setup
- [ ] Create Supabase project
- [ ] Enable Authentication
- [ ] Set up database schema
- [ ] Configure RLS policies
- [ ] Set up Edge Functions

### Vercel Setup
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)
- [ ] Enable analytics (optional)

## 📦 Deployment Steps

### 1. Database Migrations
```sql
-- Run in Supabase SQL Editor
-- Full migration script in /workspace/supabase/migrations/
```

### 2. Edge Functions
```bash
# Deploy CORS-enabled functions
supabase functions deploy test-ai-provider
supabase functions deploy get-realtime-token
supabase secrets set OPENAI_API_KEY=sk-...
```

### 3. Application Deployment
```bash
# Option 1: Vercel CLI
vercel --prod

# Option 2: Git push (auto-deploy)
git push origin main
```

## 🧪 Post-Deployment Testing

### Critical Paths
- [ ] **Authentication Flow**
  - [ ] Sign up new user
  - [ ] Sign in existing user
  - [ ] Password reset
  - [ ] Sign out

- [ ] **Assessment System**
  - [ ] Take assessment
  - [ ] View results
  - [ ] Save to database
  - [ ] Load previous results

- [ ] **AI Features**
  - [ ] Chat interface works
  - [ ] Voice interface connects
  - [ ] API calls succeed
  - [ ] Error handling works

- [ ] **Admin Panel**
  - [ ] Access with admin role
  - [ ] Configure settings
  - [ ] Test AI providers
  - [ ] Manage users

### Performance Checks
- [ ] Page load time < 3s on 4G
- [ ] Time to Interactive < 5s
- [ ] Lighthouse score > 80
- [ ] No console errors
- [ ] All images load
- [ ] Fonts load correctly

### Security Checks
- [ ] Environment variables not exposed
- [ ] API keys secure
- [ ] RLS policies working
- [ ] CORS configured correctly
- [ ] HTTPS enforced
- [ ] CSP headers set

## 🔧 Configuration

### Vercel Environment Variables
```env
VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_REALTIME_MODEL=gpt-realtime-2025-08-28
VITE_APP_URL=https://your-domain.com
```

### Supabase Functions Secrets
```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set APP_URL=https://your-domain.com
```

## 🐛 Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 404 on routes | Check vercel.json rewrites |
| CORS errors | Deploy Edge Functions with CORS headers |
| API key errors | Set environment variables in Vercel |
| Database errors | Run migrations in Supabase |
| Build failures | Check Node version (18+) |
| Blank page | Check browser console for errors |

### Debug Commands
```bash
# Check Vercel logs
vercel logs

# Check Supabase function logs
supabase functions logs test-ai-provider

# Test Edge Function
curl -X OPTIONS https://your-project.supabase.co/functions/v1/test-ai-provider -v

# Check build output
npm run build
```

## 📊 Monitoring

### Setup Monitoring
- [ ] Vercel Analytics
- [ ] Supabase Dashboard
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Performance monitoring

### Key Metrics to Track
- Page views
- User signups
- Assessment completions
- API usage
- Error rates
- Performance metrics

## 🔐 Security Hardening

### Production Security
1. **Update CORS origins** in Edge Functions:
```typescript
const ALLOWED_ORIGIN = "https://your-domain.com"
// Not "*"
```

2. **Enable rate limiting**:
```typescript
// Add to Edge Functions
const rateLimit = new RateLimiter({
  requests: 100,
  window: '1m'
})
```

3. **Add CSP headers** in vercel.json:
```json
{
  "headers": [{
    "key": "Content-Security-Policy",
    "value": "default-src 'self'; script-src 'self' 'unsafe-inline';"
  }]
}
```

4. **Rotate API keys** regularly
5. **Enable 2FA** for admin accounts
6. **Audit dependencies** with `npm audit`

## 📝 Final Checklist

### Before Going Live
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Documentation complete
- [ ] Support contact added
- [ ] Privacy policy added
- [ ] Terms of service added

### Launch Day
- [ ] Announce on social media
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Respond to user feedback
- [ ] Celebrate! 🎉

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ All routes load without 404
- ✅ Authentication works
- ✅ Assessments save to database
- ✅ AI features respond correctly
- ✅ No CORS errors
- ✅ Admin panel accessible
- ✅ Mobile responsive
- ✅ Performance acceptable
- ✅ Security measures in place
- ✅ Users can complete core flows

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **Project Repository**: Your GitHub repo
- **Issue Tracker**: GitHub Issues

---
*Last updated: January 2025*