# AI Provider Setup & Troubleshooting Guide

## 🚨 Current Issue: voice_sessions Table Missing

The error `relation "public.voice_sessions" does not exist` indicates that the required database tables for voice functionality haven't been created yet.

## ✅ Quick Fix Instructions

### Step 1: Run Database Migration

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy the entire contents of `fix_voice_sessions_migration.sql`
4. Paste and run the SQL in the editor
5. You should see "Migration completed successfully!" message

### Step 2: Configure Environment Variables

Create a `.env` file in your project root with the following:

```env
# OpenAI Configuration (REQUIRED for AI features)
VITE_OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_API_KEY_HERE
VITE_OPENAI_ORGANIZATION_ID=org-YOUR_ORG_ID (optional)
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_MAX_TOKENS=2000
VITE_OPENAI_TEMPERATURE=0.7

# Supabase Configuration (Already configured)
VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M

# Feature Flags
VITE_ENABLE_VOICE_CHAT=true
VITE_ENABLE_AI_ASSESSMENT=true
VITE_ENABLE_COMMUNITY=true

# Application Settings
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME="Life Navigation System"
VITE_APP_VERSION=1.0.0

# Security (Generate secure keys for production)
VITE_JWT_SECRET=your-secure-jwt-secret-minimum-32-chars-here
VITE_ENCRYPTION_KEY=your-secure-encryption-key-minimum-32-chars
```

### Step 3: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-proj-`)
6. Replace `sk-proj-YOUR_ACTUAL_API_KEY_HERE` in your `.env` file

### Step 4: Restart Your Application

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## 🔍 Diagnostic Results

Based on the analysis, here are the current issues and their status:

### ❌ Critical Issues

1. **Voice Sessions Table Missing**
   - **Error**: `relation "public.voice_sessions" does not exist`
   - **Fix**: Run the migration SQL provided above
   - **Status**: Migration script created and ready to run

2. **OpenAI API Key Not Configured**
   - **Current**: Using placeholder or no key
   - **Required**: Valid OpenAI API key for AI features
   - **Fix**: Add your OpenAI API key to `.env` file

### ⚠️ Warnings

1. **Voice Agent Configuration**
   - May need to be created after migration
   - Default configuration will be added automatically

2. **Microphone Permissions**
   - Browser will request permission when voice chat is first used
   - Users must grant permission for voice features to work

### ✅ Working Components

1. **Supabase Connection**
   - URL: `https://ufgqmqoykddaotdbwteg.supabase.co`
   - Status: Connected and configured

2. **Application Framework**
   - React + Vite setup is working
   - TypeScript configuration is correct

## 📊 Admin Panel Features

Once properly configured, the admin panel provides:

### AI Provider Settings
- **OpenAI Integration**: Configure API keys, models, and parameters
- **Voice Configuration**: Set up voice agents with custom instructions
- **Model Selection**: Choose between GPT-4, GPT-3.5, and other models
- **Temperature Control**: Adjust response creativity (0.0 - 2.0)

### Voice Agent Features
- **Real-time Voice Chat**: Using OpenAI's Realtime API
- **Multiple Voices**: alloy, echo, fable, onyx, nova, shimmer
- **Custom Instructions**: Personalize the AI assistant's behavior
- **Session Management**: Track and review voice conversations

### Monitoring & Diagnostics
- **Connection Status**: Real-time API connectivity checks
- **Usage Metrics**: Track API calls and token usage
- **Error Logs**: Detailed error reporting and debugging
- **Performance Metrics**: Response times and latency monitoring

## 🛠️ Troubleshooting Steps

### If Migration Fails

1. **Check Supabase Connection**
   ```sql
   -- Run this in SQL Editor to test connection
   SELECT current_database(), current_user;
   ```

2. **Verify Tables Manually**
   ```sql
   -- Check if tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('voice_sessions', 'voice_agent_configs');
   ```

3. **Create Tables Individually**
   - Run each CREATE TABLE statement separately
   - Check for errors after each statement

### If Voice Chat Doesn't Work

1. **Verify OpenAI API Key**
   - Ensure key starts with `sk-proj-`
   - Check key has proper permissions
   - Verify billing is active on OpenAI account

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for error messages in Console tab
   - Check Network tab for failed API calls

3. **Test Microphone**
   ```javascript
   // Run this in browser console
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(stream => {
       console.log('Microphone working!');
       stream.getTracks().forEach(track => track.stop());
     })
     .catch(err => console.error('Microphone error:', err));
   ```

## 📝 Configuration Checklist

- [ ] Created `.env` file with all required variables
- [ ] Added valid OpenAI API key
- [ ] Run database migration SQL
- [ ] Verified tables created successfully
- [ ] Restarted application
- [ ] Tested voice chat functionality
- [ ] Granted microphone permissions

## 🔗 Useful Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI Realtime API Guide](https://platform.openai.com/docs/guides/realtime)
- [Project Repository](https://github.com/yourusername/life-navigation-system)

## 💡 Next Steps

After fixing the database issue:

1. **Test Voice Chat**: Navigate to the Chat page and try voice interaction
2. **Configure AI Settings**: Go to Admin Panel > AI Setup to customize
3. **Monitor Performance**: Use the Diagnostics Panel to track system health
4. **Customize Instructions**: Tailor the AI assistant's personality and responses

## 🆘 Need Help?

If you continue to experience issues:

1. Run the diagnostic tool in the admin panel
2. Export the diagnostic report
3. Check the browser console for errors
4. Review the error logs in Supabase

The system will be fully operational once:
- ✅ Database tables are created
- ✅ OpenAI API key is configured
- ✅ Environment variables are set
- ✅ Application is restarted