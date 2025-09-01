# 🎤 Voice Agent Troubleshooting Guide

## 🚨 **Current Issues & Solutions**

### **Issue 1: voice_sessions Table Missing**
**Error:** `relation "public.voice_sessions" does not exist`

**✅ SOLUTION:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg)
2. Navigate to **SQL Editor**
3. Copy the SQL from `create_voice_table_direct.sql`
4. Paste and execute the SQL
5. Verify table creation

### **Issue 2: OpenAI API Key Not Configured**
**Current:** `sk-proj-REPLACE_WITH_YOUR_KEY` (placeholder)

**✅ SOLUTION:**
1. Get OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Edit `.env` file:
   ```bash
   # Replace line 7 in .env:
   VITE_OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_API_KEY_HERE
   ```
3. Restart development server: `npm run dev`

## 🔧 **Voice Agent Configuration Status**

### **Available Admin Tools:**
- ✅ **Voice Agent Config Manager** - `/admin` → Voice Agent
- ✅ **AI Provider Settings** - `/admin` → Providers  
- ✅ **AI Diagnostics Panel** - `/admin` → Diagnostics
- ✅ **Voice Testing Interface** - Built-in testing tools
- ✅ **Voice Agent Trainer** - Configuration and training

### **Configuration Features:**
- ✅ Multiple voice models (alloy, echo, fable, onyx, nova, shimmer)
- ✅ Customizable system prompts
- ✅ Temperature and token limit controls
- ✅ Real-time configuration testing
- ✅ Session management and transcript saving

## 📊 **Current Configuration Analysis**

### **Environment Configuration:**
```
Supabase URL: ✅ Configured (https://ufgqmqoykddaotdbwteg.supabase.co)
Supabase Anon Key: ✅ Configured
OpenAI API Key: ❌ Placeholder value
Voice Chat Enabled: ✅ true
AI Assessment Enabled: ✅ true
```

### **Database Tables:**
```
voice_agent_configs: ✅ Available
voice_sessions: ❌ Missing (manual creation required)
profiles: ✅ Available
admin_ai_providers: ✅ Available
```

### **Voice Service Status:**
```
Voice Features Enabled: ❌ No (missing API key)
Default Configuration: ✅ Available in code
WebSocket Support: ✅ Available
Microphone API: ✅ Available
```

## 🎯 **Step-by-Step Fix Process**

### **Step 1: Fix Database Issue**
```sql
-- Run this in Supabase Dashboard → SQL Editor
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID REFERENCES public.voice_agent_configs(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    transcript JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice sessions" ON public.voice_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voice sessions" ON public.voice_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice sessions" ON public.voice_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_started_at ON public.voice_sessions(started_at DESC);
```

### **Step 2: Configure OpenAI API Key**
1. Get API key from OpenAI Platform
2. Edit `.env` file line 7:
   ```
   VITE_OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
   ```
3. Restart server: `npm run dev`

### **Step 3: Verify Configuration**
1. Navigate to `/admin`
2. Click **Diagnostics** in sidebar
3. Click **Run Diagnostics**
4. Verify all checks pass

### **Step 4: Test Voice Agent**
1. Go to `/admin` → **Voice Agent**
2. Test voice configuration
3. Try voice chat functionality

## 🔍 **Admin Panel Diagnostic Tools**

### **Available Diagnostics:**
- ✅ Environment variable validation
- ✅ OpenAI API connectivity testing
- ✅ Supabase database connection testing
- ✅ Voice agent configuration validation
- ✅ Browser compatibility checks
- ✅ Microphone permission testing

### **Testing Features:**
- ✅ Real-time AI provider connection testing
- ✅ Voice configuration validation
- ✅ Model availability checking
- ✅ WebSocket connectivity testing

## 📈 **Expected Results After Fixes**

### **Diagnostic Panel Should Show:**
```
✅ Environment: OpenAI API key configured
✅ OpenAI: API connection successful  
✅ Supabase: Database connection successful
✅ Voice Agent: Configuration loaded and tested
✅ Database: All required tables accessible
✅ Network: OpenAI API endpoint reachable
✅ Browser: All voice features supported
```

### **Voice Agent Should Work:**
- ✅ Real-time voice chat
- ✅ Session recording and transcripts
- ✅ AI voice responses
- ✅ Microphone input processing

## 🚀 **Voice Agent Features Available**

### **Configuration Options:**
- **Voice Models:** alloy, echo, fable, onyx, nova, shimmer
- **AI Models:** gpt-4o-realtime-preview-2024-10-01, gpt-4o-mini
- **Temperature:** 0.0 - 2.0 (configurable)
- **Max Tokens:** 1-4096 (configurable)
- **Custom Instructions:** Fully customizable system prompts

### **Admin Tools:**
- **Voice Playground:** Test voice interactions
- **Configuration Manager:** Manage voice settings
- **Training Interface:** Train voice responses
- **Testing Interface:** Comprehensive voice testing

## 🔗 **Quick Access Links**

- **Supabase Dashboard:** https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg
- **OpenAI Platform:** https://platform.openai.com
- **Admin Panel:** `/admin` (after server restart)
- **Voice Configuration:** `/admin` → Voice Agent tab
- **Diagnostics:** `/admin` → Diagnostics tab

## ⚡ **Quick Fix Commands**

```bash
# 1. Update API key in .env
sed -i 's/sk-proj-REPLACE_WITH_YOUR_KEY/sk-proj-YOUR_ACTUAL_KEY/' .env

# 2. Restart development server
npm run dev

# 3. Test configuration (run in browser console)
fetch('/api/voice/test').then(r => r.json()).then(console.log)
```

---

**Status:** 🔴 **Requires Manual Configuration**  
**Priority:** 🔴 **Critical** (Voice features completely disabled)  
**Time to Fix:** 5-10 minutes with proper API key