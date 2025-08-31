# Admin Credentials - Newomen.me

## 🔐 Admin User Credentials

### Primary Admin Account
- **Email:** `admin@newomen.me`
- **Password:** `Admin@Newomen2025!`
- **Role:** Administrator

### ⚠️ IMPORTANT SECURITY NOTES
1. **Change the password immediately after first login**
2. **Do not commit this file to version control**
3. **Store these credentials securely**
4. **Enable 2FA if available**

## 📝 Manual Setup Instructions

Since we need the Supabase service key to create the user programmatically, please follow these steps:

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg)
2. Navigate to **Authentication** → **Users**
3. Click **Invite User** or **Create New User**
4. Enter the following:
   - Email: `admin@newomen.me`
   - Password: `Admin@Newomen2025!`
   - Check "Auto Confirm Email"
5. Click **Create User**

### Option 2: Update Profile to Admin Role
After creating the user, you must set the admin role:

1. Go to **Table Editor** → **profiles**
2. Find the row with the new user's `user_id`
3. Edit the row and set:
   - `role`: `admin`
   - `full_name`: `Admin User`
   - `bio`: `Platform Administrator`
4. Save changes

### Option 3: Using SQL Editor
Run this SQL after creating the user:
```sql
UPDATE profiles 
SET 
  role = 'admin',
  full_name = 'Admin User',
  bio = 'Platform Administrator'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@newomen.me'
);
```

## 🚀 Accessing Admin Panel

1. Go to `https://newomen.me/auth` (after deployment)
2. Sign in with the admin credentials
3. Navigate to `https://newomen.me/admin`
4. You should see the full admin dashboard

## 🔒 Security Checklist
- [ ] Admin user created
- [ ] Profile role set to 'admin'
- [ ] Password changed after first login
- [ ] 2FA enabled (if available)
- [ ] This file deleted or secured

---
**Created:** 2025-08-31
**Platform:** Newomen.me