# 🚀 Vercel Environment Setup Guide

## 📋 Overview

This guide explains how to set up environment variables for the Newomen platform when deploying to Vercel. The application automatically fetches OpenAI API keys and other configuration from Vercel's environment variables.

## ✅ Implementation Complete

The application now automatically:
- ✅ Fetches OpenAI API key from `VITE_OPENAI_API_KEY` environment variable
- ✅ Uses centralized environment configuration service
- ✅ Shows helpful error messages when API key is missing
- ✅ Provides configuration status in the UI
- ✅ Includes setup instructions and links

## 🔧 Required Environment Variables

### Essential Variables (Required)

```bash
# OpenAI API Configuration
VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Supabase Configuration  
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Optional Variables (Recommended)

```bash
# OpenAI Advanced Settings
VITE_OPENAI_ORGANIZATION_ID=org-your-organization-id
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_MAX_TOKENS=2000
VITE_OPENAI_TEMPERATURE=0.7

# Feature Toggles
VITE_ENABLE_VOICE_CHAT=true
VITE_ENABLE_AI_ASSESSMENT=true
VITE_ENABLE_COMMUNITY=true

# Application Settings
VITE_APP_NAME=Newomen Platform
VITE_APP_VERSION=1.0.0
```

## 🎯 How to Set Up in Vercel

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on **Settings** tab
4. Navigate to **Environment Variables** section

### Step 2: Add Environment Variables
1. Click **Add New** button
2. Enter variable name (e.g., `VITE_OPENAI_API_KEY`)
3. Enter variable value (your actual API key)
4. Select environments:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. Click **Save**

### Step 3: Get Your API Keys

#### OpenAI API Key
1. Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Copy the key (starts with `sk-`)
4. Add to Vercel as `VITE_OPENAI_API_KEY`

#### Supabase Keys
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy **Project URL** → Add as `VITE_SUPABASE_URL`
5. Copy **anon public** key → Add as `VITE_SUPABASE_ANON_KEY`

### Step 4: Redeploy Application
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on latest deployment
3. Wait for deployment to complete

## 🔍 Verification

The application includes built-in tools to verify your configuration:

### 1. Configuration Tab
- Visit `/transcription` page
- Click **Configuration** tab
- View current environment status
- See which variables are configured

### 2. Environment Checker Component
- Shows API key status (configured/missing/invalid)
- Displays feature flags and settings
- Provides setup instructions and links
- Masks sensitive values for security

### 3. User-Friendly Alerts
- Automatic warnings when API key is missing
- Helpful error messages with setup links
- Disabled functionality until properly configured

## 🛠️ Technical Implementation

### Environment Service
The application uses a centralized `EnvironmentService` that:
- Loads all configuration from environment variables
- Validates required settings
- Provides type-safe access to configuration
- Handles fallbacks and defaults

### Automatic API Key Fetching
```typescript
// Services automatically use environment configuration
const apiKey = env.openai.apiKey;
if (!apiKey || apiKey === 'your-openai-api-key-here') {
  throw new Error('OpenAI API key not configured');
}
```

### Configuration Status UI
```typescript
// Real-time configuration checking
const isApiKeyConfigured = env.openai.apiKey && 
  env.openai.apiKey !== 'your-openai-api-key-here';
```

## 🔒 Security Best Practices

### Client-Side Variables
- All `VITE_` prefixed variables are exposed to the browser
- Only use `VITE_` prefix for non-sensitive configuration
- API keys are acceptable as they're used for client-side API calls

### Server-Side Variables (if needed)
- Use without `VITE_` prefix for server-only secrets
- Example: `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- These are NOT exposed to the browser

### API Key Security
- OpenAI API keys can be safely used client-side
- Configure usage limits and monitoring in OpenAI dashboard
- Regularly rotate API keys for security

## 📊 Configuration Status

After setup, users will see:

### ✅ Properly Configured
- Green checkmarks for all services
- "Start Transcription" button enabled
- Full functionality available
- Real-time transcription works

### ❌ Missing Configuration  
- Warning alerts displayed
- "API Key Required" button state
- Links to setup instructions
- Graceful feature degradation

## 🎉 Features Enabled

With proper configuration, users get:
- 🎙️ **Real-time Transcription**: Live speech-to-text
- 🤖 **Multiple AI Models**: GPT-4o, GPT-4o Mini, Whisper
- 🌍 **Multi-language Support**: 6+ languages
- 📊 **Confidence Scoring**: Accuracy assessment
- 💾 **Session Management**: Save and export transcripts
- 🎨 **Interactive Demo**: Try different scenarios

## 🚀 Deployment Checklist

- [ ] OpenAI API key added to Vercel
- [ ] Supabase URL and keys configured
- [ ] Environment variables saved for all environments
- [ ] Application redeployed after adding variables
- [ ] Configuration tab shows green status
- [ ] Real-time transcription button enabled
- [ ] Test transcription functionality

## 📞 Support

If you encounter issues:
1. Check the **Configuration** tab for status
2. Verify all environment variables in Vercel
3. Ensure you've redeployed after adding variables
4. Check the browser console for specific error messages

---

**Status**: ✅ AUTOMATIC ENVIRONMENT CONFIGURATION IMPLEMENTED  
**Vercel Integration**: Complete with UI verification tools  
**User Experience**: Seamless setup with helpful guidance