-- ==========================================
-- Voice Agent Model Standardization Script
-- ==========================================
-- This script updates all voice agent configurations to use the standardized
-- gpt-realtime-2025-08-28 model across the entire platform

-- Update voice_agent_configs table default model
ALTER TABLE voice_agent_configs 
ALTER COLUMN model SET DEFAULT 'gpt-realtime-2025-08-28';

-- Update existing voice agent configurations to use standardized model
UPDATE voice_agent_configs 
SET model = 'gpt-realtime-2025-08-28'
WHERE model LIKE 'gpt-4o-realtime%' OR model LIKE 'gpt-realtime%';

-- Update admin_ai_providers for realtime voice configurations
UPDATE admin_ai_providers 
SET configuration = jsonb_set(
    configuration, 
    '{model}', 
    '"gpt-realtime-2025-08-28"'::jsonb
)
WHERE provider_type = 'openai_realtime' OR provider_name ILIKE '%realtime%';

-- Update any platform settings that reference the old model
UPDATE platform_settings 
SET setting_value = replace(
    setting_value, 
    'gpt-4o-realtime-preview-2024-10-01', 
    'gpt-realtime-2025-08-28'
)
WHERE setting_key = 'realtime_settings' OR setting_value LIKE '%gpt-4o-realtime%';

UPDATE platform_settings 
SET setting_value = replace(
    setting_value, 
    'gpt-4o-realtime-preview-2024-12-17', 
    'gpt-realtime-2025-08-28'
)
WHERE setting_key = 'realtime_settings' OR setting_value LIKE '%gpt-4o-realtime%';

-- Insert or update standardized realtime configuration
INSERT INTO platform_settings (setting_key, setting_value, description, category)
VALUES (
    'voice_realtime_model', 
    '"gpt-realtime-2025-08-28"'::jsonb, 
    'Standardized OpenAI Realtime model for voice agents', 
    'ai_providers'
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = '"gpt-realtime-2025-08-28"'::jsonb,
    description = 'Standardized OpenAI Realtime model for voice agents',
    updated_at = NOW();

-- Update any existing voice sessions that might reference old models
UPDATE voice_sessions 
SET model = 'gpt-realtime-2025-08-28'
WHERE model LIKE 'gpt-4o-realtime%';

-- Create or update a default voice agent configuration with standardized settings
INSERT INTO voice_agent_configs (
    name, 
    provider, 
    model, 
    voice, 
    temperature, 
    is_active,
    instructions,
    max_tokens,
    enable_realtime,
    input_audio_transcription_model,
    language,
    arabic_support,
    emotion_detection
) VALUES (
    'NewMe Voice Assistant (Standardized)', 
    'openai', 
    'gpt-realtime-2025-08-28', 
    'alloy', 
    0.7, 
    true,
    'You are NewMe, an empowering AI companion designed specifically for women''s personal growth. Be warm, encouraging, and insightful in your responses. Help users explore their potential, overcome challenges, and celebrate their achievements.',
    4096,
    true,
    'whisper-1',
    'en',
    true,
    true
)
ON CONFLICT (name) 
DO UPDATE SET 
    model = 'gpt-realtime-2025-08-28',
    is_active = true,
    updated_at = NOW();

-- Log the standardization update
INSERT INTO platform_settings (setting_key, setting_value, description, category)
VALUES (
    'voice_model_standardization_date', 
    to_jsonb(NOW()),
    'Date when voice agent models were standardized to gpt-realtime-2025-08-28',
    'system'
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = to_jsonb(NOW()),
    updated_at = NOW();

-- Verify the changes
SELECT 'Voice Agent Configs Updated' as status, COUNT(*) as count 
FROM voice_agent_configs 
WHERE model = 'gpt-realtime-2025-08-28';

SELECT 'Admin AI Providers Updated' as status, COUNT(*) as count 
FROM admin_ai_providers 
WHERE configuration->>'model' = 'gpt-realtime-2025-08-28';

SELECT 'Platform Settings Updated' as status, COUNT(*) as count 
FROM platform_settings 
WHERE setting_value LIKE '%gpt-realtime-2025-08-28%';
