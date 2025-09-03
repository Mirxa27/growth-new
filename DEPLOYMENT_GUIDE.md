# Deployment Guide for NewoMen Life Navigation System

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Run deployment**:
   ```bash
   ./deploy.sh
   ```

## 📋 Pre-Deployment Checklist

Run the pre-deployment check:
```bash
node pre-deploy-check.js
```

This will verify:
- ✅ Environment variables
- ✅ Required dependencies
- ✅ TypeScript errors
- ✅ Required files
- ✅ Security issues

## 🔧 Manual Deployment Steps

### 1. Environment Setup

Create `.env` file with:
```env
VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Build Application

```bash
npm run build
```

### 3. Deploy to Platform

#### Vercel
```bash
npx vercel --prod
```

#### Netlify
```bash
npx netlify deploy --prod --dir=dist
```

#### Custom Server
1. Upload `dist` folder contents
2. Configure server to serve `index.html` for all routes
3. Set up SSL certificates
4. Configure environment variables

## 🌐 Platform-Specific Configuration

### Vercel
- Configuration file: `vercel.json`
- Automatic HTTPS
- Edge functions support
- Environment variables in dashboard

### Netlify
- Configuration file: `netlify.toml`
- Automatic HTTPS
- Redirect rules included
- Headers for security

### Custom Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name newomen.me;
    
    root /var/www/newomen/dist;
    index index.html;
    
    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔐 Security Considerations

1. **Environment Variables**:
   - Never commit `.env` files
   - Use platform secrets management
   - Rotate keys regularly

2. **API Keys**:
   - Store in Supabase Edge Function secrets
   - Use environment variables for build-time keys
   - Implement rate limiting

3. **CORS**:
   - Configure allowed origins
   - Restrict to your domain

4. **Headers**:
   - CSP (Content Security Policy)
   - HSTS (HTTP Strict Transport Security)
   - X-Frame-Options

## 📊 Post-Deployment Verification

1. **Check Application**:
   - [ ] Homepage loads
   - [ ] Authentication works
   - [ ] API calls succeed
   - [ ] WebRTC voice chat functions
   - [ ] PayPal integration works

2. **Monitor Performance**:
   - [ ] Page load time < 3s
   - [ ] Core Web Vitals pass
   - [ ] No console errors
   - [ ] SSL certificate valid

3. **Test Features**:
   - [ ] User registration/login
   - [ ] Voice sessions
   - [ ] Chat functionality
   - [ ] Payment processing
   - [ ] Admin panel

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Environment Issues
```bash
# Verify environment variables
node -e "console.log(process.env.VITE_SUPABASE_URL)"
```

### TypeScript Errors
```bash
# Check for type errors
npx tsc --noEmit
```

### Deployment Failures
1. Check build logs
2. Verify environment variables
3. Check file permissions
4. Review platform limits

## 📈 Performance Optimization

1. **Enable Compression**:
   - Gzip/Brotli for text assets
   - Image optimization

2. **CDN Configuration**:
   - CloudFlare or platform CDN
   - Cache headers

3. **Code Splitting**:
   - Already configured in Vite
   - Lazy load routes

4. **Resource Hints**:
   ```html
   <link rel="preconnect" href="https://ufgqmqoykddaotdbwteg.supabase.co">
   <link rel="dns-prefetch" href="https://api.openai.com">
   ```

## 🔄 Continuous Deployment

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 📝 Maintenance

1. **Regular Updates**:
   ```bash
   npm update
   npm audit fix
   ```

2. **Backup**:
   - Database backups via Supabase
   - Code repository backups

3. **Monitoring**:
   - Error tracking (Sentry)
   - Analytics (Google Analytics)
   - Uptime monitoring

## 🆘 Support

If deployment fails:
1. Check pre-deployment script output
2. Review build logs
3. Verify all environment variables
4. Check Supabase service status
5. Review browser console for errors

## ✅ Success Indicators

Your deployment is successful when:
- 🟢 Site loads at your domain
- 🟢 SSL certificate shows as valid
- 🟢 Users can register and login
- 🟢 Voice chat connects successfully
- 🟢 No errors in browser console
- 🟢 All features function as expected