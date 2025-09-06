-- arabic_support and emotion_detection columns already exist in the base schema (000000_initial_schema.sql)
-- This migration is redundant and can cause conflicts
-- Only update existing configs if needed

-- Update any existing configs to have arabic_support based on language
UPDATE public.voice_agent_configs 
SET arabic_support = true 
WHERE language = 'ar' AND arabic_support = false;

-- Add comments for existing columns (in case they were missing)
COMMENT ON COLUMN public.voice_agent_configs.arabic_support IS 'Enable Arabic language support for voice interactions';
COMMENT ON COLUMN public.voice_agent_configs.emotion_detection IS 'Enable emotion detection in voice responses';
