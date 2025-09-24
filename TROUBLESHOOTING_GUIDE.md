# 🔧 Post-Deployment Troubleshooting Guide

## Common Issues & Solutions

### 1. **Voice Chat Not Working**

**Symptoms**: Voice button unresponsive, "Not supported" errors
**Solutions**:
```bash
# Check if user is admin
# Voice features are admin-only for security

# Check OpenAI API key
echo $OPENAI_API_KEY

# Check browser permissions
# Ensure microphone access allowed

# Check network connectivity
# WebSocket connections required
```

### 2. **Build/Deployment Errors**

**Symptoms**: Vercel build fails, type errors
**Solutions**:
```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps

# Force Vercel build with correct settings
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod

# Check build locally first
npm run build:vercel
```

### 3. **Database Connection Issues**

**Symptoms**: Supabase errors, auth failures
**Solutions**:
```sql
-- Check RLS policies are enabled
SELECT * FROM auth.users LIMIT 1;

-- Verify admin users exist
SELECT * FROM profiles WHERE role = 'admin';

-- Check table permissions
\dp profiles
```

### 4. **Assessment Issues**

**Symptoms**: Scoring errors, results not saving
**Solutions**:
```javascript
// Check assessment data structure
console.log('Assessment questions:', assessmentQuestions);

// Verify scoring logic
console.log('Score calculation:', personalityScores);

// Check database writes
console.log('Save result:', saveResult);
```

### 5. **Mobile Display Issues**

**Symptoms**: Layout broken on mobile, touch not working
**Solutions**:
```css
/* Check viewport meta tag exists */
<meta name="viewport" content="width=device-width, initial-scale=1">

/* Verify touch-action CSS */
.interactive { touch-action: manipulation; }

/* Check safe area support */
padding-bottom: env(safe-area-inset-bottom);
```

---

## Quick Fixes

### Reset Admin Access
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### Clear Cache Issues
```bash
# Clear browser cache
# Or add cache busting
vercel --prod --force
```

### Environment Variables
```bash
# Verify all required vars are set
vercel env ls

# Add missing variables
vercel env add VARIABLE_NAME production
```

---

## Performance Monitoring

### Key Metrics to Watch
- Page load time < 2 seconds
- Assessment completion rate > 80%
- Voice chat connection success > 95%
- Mobile usage > 60%

### Monitoring Tools
```javascript
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

## Support Contacts

- **Technical Issues**: Create GitHub issue
- **Security Concerns**: security@newomen.me  
- **General Questions**: support@newomen.me

---

## Success Verification Checklist

- [ ] Homepage loads properly
- [ ] Mobile assessment works with swipe
- [ ] Anonymous assessment completion works
- [ ] Admin login functions
- [ ] Voice chat connects (admin only)
- [ ] Database operations work
- [ ] All pages accessible
- [ ] Mobile responsive design works
- [ ] Error handling graceful
- [ ] Performance metrics acceptable