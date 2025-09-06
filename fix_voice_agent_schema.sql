-- Fix voice_agent_configs schema to support OpenAI Voice Agents
-- This adds back the necessary columns for proper OpenAI configuration

BEGIN;

-- Add missing columns to voice_agent_configs table
ALTER TABLE public.voice_agent_configs 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'openai',
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS openai_organization TEXT,
ADD COLUMN IF NOT EXISTS openai_project TEXT,
ADD COLUMN IF NOT EXISTS api_base_url TEXT,
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS top_p NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS frequency_penalty NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS presence_penalty NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS enable_realtime BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS use_proxy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS proxy_url TEXT,
ADD COLUMN IF NOT EXISTS input_audio_transcription_model TEXT DEFAULT 'whisper-1',
ADD COLUMN IF NOT EXISTS arabic_support BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS emotion_detection BOOLEAN DEFAULT false;

-- Update existing columns to match OpenAI Voice Agents API
-- Rename voice_id to voice for OpenAI compatibility
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'voice_agent_configs' 
               AND column_name = 'voice_id') THEN
        ALTER TABLE public.voice_agent_configs RENAME COLUMN voice_id TO voice;
    END IF;
END $$;

-- Rename system_prompt to instructions for OpenAI compatibility
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'voice_agent_configs' 
               AND column_name = 'system_prompt') THEN
        ALTER TABLE public.voice_agent_configs RENAME COLUMN system_prompt TO instructions;
    END IF;
END $$;

-- Update existing data to have proper OpenAI voice names
UPDATE public.voice_agent_configs 
SET voice = 'nova' 
WHERE voice NOT IN ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer')
   OR voice IS NULL;

-- Update existing data to have proper model names
UPDATE public.voice_agent_configs 
SET model = 'gpt-4o-realtime-preview-2024-10-01'
WHERE model NOT LIKE 'gpt-%' 
   OR model IS NULL;

-- Set default instructions if empty
UPDATE public.voice_agent_configs 
SET instructions = 'You are NewMe, an AI companion designed to support women in their personal growth journey. Be empathetic, encouraging, and insightful. Help users explore their emotions, set goals, and build confidence. Keep responses warm and conversational.'
WHERE instructions IS NULL OR instructions = '';

-- Ensure we have at least one active configuration
INSERT INTO public.voice_agent_configs (
    name, 
    provider, 
    voice, 
    model, 
    instructions, 
    temperature, 
    is_active,
    enable_realtime,
    max_tokens
) 
SELECT 
    'Default OpenAI Voice Agent',
    'openai',
    'nova',
    'gpt-4o-realtime-preview-2024-10-01',
    'You are NewMe, an AI companion designed to support women in their personal growth journey. Be empathetic, encouraging, and insightful. Help users explore their emotions, set goals, and build confidence. Keep responses warm and conversational.',
    0.7,
    true,
    true,
    1000
WHERE NOT EXISTS (SELECT 1 FROM public.voice_agent_configs WHERE is_active = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_agent_configs_active ON public.voice_agent_configs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_voice_agent_configs_provider ON public.voice_agent_configs(provider);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Anyone can view voice configs" ON public.voice_agent_configs;
DROP POLICY IF EXISTS "Admins can view all voice configs" ON public.voice_agent_configs;
DROP POLICY IF EXISTS "Admins can create voice configs" ON public.voice_agent_configs;
DROP POLICY IF EXISTS "Admins can update voice configs" ON public.voice_agent_configs;
DROP POLICY IF EXISTS "Admins can delete voice configs" ON public.voice_agent_configs;

-- Create comprehensive RLS policies
CREATE POLICY "Authenticated users can view active voice configs" ON public.voice_agent_configs
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can view all voice configs" ON public.voice_agent_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR is_admin_backup = true)
    )
  );

CREATE POLICY "Admins can create voice configs" ON public.voice_agent_configs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR is_admin_backup = true)
    )
  );

CREATE POLICY "Admins can update voice configs" ON public.voice_agent_configs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR is_admin_backup = true)
    )
  );

CREATE POLICY "Admins can delete voice configs" ON public.voice_agent_configs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR is_admin_backup = true)
    )
  );

COMMIT;
