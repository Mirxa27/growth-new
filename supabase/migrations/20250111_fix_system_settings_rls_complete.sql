-- Complete fix for system_settings RLS policies
-- This ensures authenticated users can properly manage settings

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can delete system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can manage system settings" ON public.system_settings;

-- Option 1: Most permissive for testing/development
-- Allow all authenticated users to do everything
CREATE POLICY "Authenticated users can manage all system settings" 
ON public.system_settings 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Option 2: More restrictive (commented out, use if needed)
-- -- Allow reading for all authenticated users
-- CREATE POLICY "Authenticated users can read system settings" 
-- ON public.system_settings 
-- FOR SELECT 
-- USING (auth.role() = 'authenticated');

-- -- Allow insert/update/delete only for admin users
-- CREATE POLICY "Admin users can modify system settings" 
-- ON public.system_settings 
-- FOR INSERT 
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE user_id = auth.uid()
--     AND (role = 'admin' OR user_id IN (
--       SELECT user_id FROM auth.users WHERE email LIKE '%@admin.%'
--     ))
--   )
-- );

-- Ensure the table exists with proper structure
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(category)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_created_by ON public.system_settings(created_by);

-- Create or replace function to handle upserts
CREATE OR REPLACE FUNCTION public.upsert_system_settings(
    p_category VARCHAR,
    p_settings JSONB
)
RETURNS public.system_settings AS $$
DECLARE
    v_result public.system_settings;
BEGIN
    INSERT INTO public.system_settings (category, settings, created_by, updated_by)
    VALUES (p_category, p_settings, auth.uid(), auth.uid())
    ON CONFLICT (category) 
    DO UPDATE SET 
        settings = EXCLUDED.settings,
        updated_at = NOW(),
        updated_by = auth.uid()
    RETURNING * INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_system_settings TO authenticated;

-- Insert default OpenAI settings if not exists
INSERT INTO public.system_settings (category, settings, created_by, updated_by)
VALUES (
    'openai', 
    '{
        "apiKey": "",
        "chatModel": "gpt-4o-mini",
        "realtimeModel": "gpt-4o-realtime-preview-2024-10-01",
        "temperature": 0.7,
        "maxTokens": 2000
    }'::jsonb,
    NULL,
    NULL
)
ON CONFLICT (category) DO NOTHING;