# 🚨 IMMEDIATE FIX FOR voice_sessions TABLE ERROR

## Error Message
```
Table 'voice_sessions' is not accessible
Fix: Run migrations to create the voice_sessions table
{
  "error": "relation \"public.voice_sessions\" does not exist"
}
```

## ✅ SOLUTION - 3 Simple Steps

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**
   - Click here: [Open SQL Editor](https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg/sql/new)
   - Or go to: Supabase Dashboard → SQL Editor

2. **Copy and Paste This SQL**
   ```sql
   -- Copy everything below this line
   CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       name TEXT NOT NULL DEFAULT 'Default Voice Agent',
       provider TEXT NOT NULL DEFAULT 'openai',
       model TEXT NOT NULL DEFAULT 'gpt-4o-realtime-preview-2024-10-01',
       voice TEXT NOT NULL DEFAULT 'alloy',
       temperature DECIMAL(3,2) NOT NULL DEFAULT 0.70,
       instructions TEXT DEFAULT 'You are a helpful AI assistant.',
       is_active BOOLEAN NOT NULL DEFAULT true,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

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

   INSERT INTO public.voice_agent_configs (name, provider, model, voice, temperature, instructions, is_active)
   SELECT 'Default Voice Agent', 'openai', 'gpt-4o-realtime-preview-2024-10-01', 'alloy', 0.70, 
          'You are a helpful AI assistant focused on personal growth and well-being.', true
   WHERE NOT EXISTS (SELECT 1 FROM public.voice_agent_configs LIMIT 1);

   ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Anyone can view voice configs" ON public.voice_agent_configs FOR SELECT USING (true);
   CREATE POLICY "Users can view own voice sessions" ON public.voice_sessions FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can create own voice sessions" ON public.voice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own voice sessions" ON public.voice_sessions FOR UPDATE USING (auth.uid() = user_id);

   CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
   CREATE INDEX IF NOT EXISTS idx_voice_sessions_started_at ON public.voice_sessions(started_at DESC);
   ```

3. **Click "Run" Button**
   - Look for the green "Run" button in the SQL Editor
   - You should see "Success. No rows returned" message

### Option 2: Via Admin Panel

1. **Go to Admin Dashboard**
   - Navigate to: Admin → Diagnostics
   
2. **Use Migration Helper**
   - Look for "Database Migration Status" card
   - Click "Copy Migration SQL" button
   - Click "Open SQL Editor" button
   - Paste and run the SQL

3. **Verify**
   - Click "Check Status" button
   - Both tables should show green "Exists" badges

## 🔍 Verification

After running the migration, verify it worked:

1. **In Supabase Dashboard**
   ```sql
   -- Run this query to verify
   SELECT 
       'voice_sessions' as table_name,
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_sessions') as exists
   UNION ALL
   SELECT 
       'voice_agent_configs',
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_agent_configs');
   ```
   
   Expected result:
   ```
   table_name          | exists
   --------------------|--------
   voice_sessions      | true
   voice_agent_configs | true
   ```

2. **In Your Application**
   - Refresh the page
   - The error should be gone
   - Voice features should work

## 🛠️ Still Having Issues?

### Common Problems and Solutions

**Problem 1: Permission Denied**
- Make sure you're using the service role key or logged in as admin
- Check RLS policies are correctly set

**Problem 2: Table Already Exists Error**
- This is fine! The tables are already created
- Just verify they exist using the verification query above

**Problem 3: Foreign Key Constraint Error**
- Run this first:
  ```sql
  DROP TABLE IF EXISTS public.voice_sessions CASCADE;
  DROP TABLE IF EXISTS public.voice_agent_configs CASCADE;
  ```
- Then run the creation SQL again

## 📝 What This Migration Does

1. **Creates voice_agent_configs table**
   - Stores voice agent settings
   - Default configuration included

2. **Creates voice_sessions table**
   - Tracks voice chat sessions
   - Links to user and config

3. **Sets up security**
   - Row Level Security enabled
   - Proper access policies

4. **Adds indexes**
   - Performance optimization
   - Faster queries

## ✨ After Migration Success

Once tables are created:

1. **Configure OpenAI API Key** (if not done)
   - Add to `.env` file:
   ```env
   VITE_OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
   ```

2. **Test Voice Chat**
   - Go to Chat page
   - Click microphone icon
   - Grant permission when prompted

3. **Monitor in Admin Panel**
   - Admin → Diagnostics
   - Check all systems are green

## 🆘 Emergency Contact

If you continue to have issues after following these steps:

1. Check browser console for errors (F12)
2. Review Supabase logs
3. Run diagnostic test: `node test_ai_configuration.js`
4. Check the full migration file: `EXECUTE_THIS_SQL_NOW.sql`

The migration takes less than 1 minute to complete!