# Deployment Guide - Newomen.me

## 🚀 Deployment Complete!

Your application has been successfully deployed to Vercel!

### 📍 Current Deployment URLs
- **Production URL:** https://growth-echo-nexus-jntl891yw-mirxa27s-projects.vercel.app
- **Vercel Dashboard:** https://vercel.com/mirxa27s-projects/growth-echo-nexus

## 🔐 Admin Credentials

### Admin Account
- **Email:** `admin@newomen.me`
- **Password:** `Admin@Newomen2025!`
- **⚠️ IMPORTANT:** Change this password after first login!

## 📋 Next Steps

### 1. Create Admin User in Supabase
Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg) and:

1. Navigate to **Authentication** → **Users**
2. Click **Create New User**
3. Enter:
   - Email: `admin@newomen.me`
   - Password: `Admin@Newomen2025!`
   - Check "Auto Confirm Email"
4. Click **Create User**

### 2. Set Admin Role
After creating the user:

1. Go to **Table Editor** → **profiles**
2. Find the row with the new user's `user_id`
3. Edit and set:
   - `role`: `admin`
   - `full_name`: `Admin User`
4. Save changes

### 3. Configure Environment Variables in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/mirxa27s-projects/growth-echo-nexus)
2. Click **Settings** → **Environment Variables**
3. Add these variables:
   ```
   VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M
   ```
4. Click **Save**
5. Redeploy from the **Deployments** tab

### 4. Configure Custom Domain (newomen.me)
1. In Vercel Dashboard, go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter `newomen.me`
4. Follow the DNS configuration instructions:
   - Add an A record pointing to `76.76.21.21`
   - Or add a CNAME record pointing to `cname.vercel-dns.com`
5. Wait for DNS propagation (usually 5-30 minutes)

### 5. Alternative Domain Configuration
If you're using a different DNS provider:
- **A Record:** Point `@` to `76.76.21.21`
- **CNAME Record:** Point `www` to `cname.vercel-dns.com`

## 🔍 Verify Deployment

### Test the Application
1. Visit your production URL
2. Click "Sign In" or "Get Started"
3. Login with admin credentials
4. Navigate to `/admin` to access the admin panel

### Admin Panel Features
- User Management
- Assessment Creation
- Library Content Management
- Community Post Moderation
- Analytics Dashboard
- And more!

## 🛠️ Troubleshooting

### If the site shows errors:
1. Check that environment variables are set in Vercel
2. Verify the admin user exists in Supabase
3. Check browser console for specific errors

### If login fails:
1. Ensure the user is created in Supabase
2. Verify email is confirmed
3. Check that the profile has admin role

### If admin panel is not accessible:
1. Ensure you're logged in
2. Check that the profile role is set to 'admin'
3. Try navigating directly to `/admin`

## 📊 Monitoring

### Vercel Analytics
- Go to your Vercel dashboard
- Click on **Analytics** tab
- Monitor performance and usage

### Supabase Dashboard
- Monitor database usage
- Check authentication logs
- Review API usage

## 🔄 Future Updates

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push
vercel --prod
```

Or enable automatic deployments:
1. Connect GitHub repository to Vercel
2. Enable automatic deployments for main branch
3. Every push will trigger a new deployment

## 📝 Important Notes

1. **Security:** Change the admin password immediately after first login
2. **Backup:** Regularly backup your Supabase database
3. **Monitoring:** Set up alerts for errors and downtime
4. **SSL:** Vercel provides automatic SSL certificates
5. **Performance:** Monitor Core Web Vitals in Vercel Analytics

---

**Deployment Date:** 2025-08-31
**Platform:** Vercel
**Domain:** newomen.me (pending configuration)
**Status:** ✅ LIVE