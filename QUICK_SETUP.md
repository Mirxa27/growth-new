# 🚀 Quick Setup Guide

## Fix Current Errors

### 1. Database Setup (REQUIRED)
Run this SQL in your Supabase SQL Editor:

```sql
-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(category)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Anyone can read system settings"
    ON public.system_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage system settings"
    ON public.system_settings
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.profiles WHERE role = 'admin'
        )
    );

-- Insert default OpenAI settings
INSERT INTO public.system_settings (category, settings)
VALUES (
    'openai',
    '{
        "apiKey": "",
        "organizationId": "",
        "chatModel": "gpt-4o-mini",
        "realtimeModel": "gpt-realtime-2025-08-28",
        "temperature": 0.7,
        "maxTokens": 2000,
        "voice": "alloy",
        "connectionType": "websocket",
        "enableTools": true,
        "enableTranscription": true,
        "audioFormat": "pcm16",
        "language": "en",
        "instructions": "You are a helpful AI assistant focused on personal growth and well-being."
    }'::jsonb
) ON CONFLICT (category) DO NOTHING;

-- Add role column to profiles if missing
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Grant permissions
GRANT ALL ON public.system_settings TO authenticated;
GRANT SELECT ON public.system_settings TO anon;
```

### 2. Environment Variables (.env)
Create a `.env` file in your project root:

```env
# REQUIRED - Get from Supabase Dashboard
VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M

# REQUIRED for AI features - Get from OpenAI
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here

# Optional
VITE_OPENAI_ORGANIZATION_ID=
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_REALTIME_MODEL=gpt-realtime-2025-08-28
```

### 3. Make Yourself Admin
After signing up, run this SQL with your email:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

### 4. Configure OpenAI in Admin Panel
1. Go to `/admin` after logging in
2. Navigate to Settings or AI Providers
3. Enter your OpenAI API key
4. Test the configuration

## Error Explanations

### "401 on /v1/models"
- **Cause**: No OpenAI API key configured
- **Fix**: Add `VITE_OPENAI_API_KEY` to `.env`

### "404 on system_settings"
- **Cause**: Table doesn't exist
- **Fix**: Run the SQL migration above

### "CORS policy error"
- **Cause**: Supabase Edge Functions CORS
- **Fix**: Already handled in code, just needs proper deployment

### "Missing Description for DialogContent"
- **Cause**: Accessibility warning
- **Fix**: Already fixed in code with aria-describedby

## Quick Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run migrations (after setting up .env)
node run_migrations.js
```

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] OpenAI API key configured
- [ ] Admin user created
- [ ] Test basic functionality

## Still Having Issues?

1. **Clear browser cache**
2. **Check browser console** for specific errors
3. **Verify Supabase project** is active
4. **Ensure API keys** are valid

## Support

If you continue to experience issues:
1. Check that all environment variables are set correctly
2. Ensure your Supabase project is running
3. Verify your OpenAI API key has credits
4. Check the browser network tab for failed requests