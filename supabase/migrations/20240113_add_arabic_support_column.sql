-- Add missing arabic_support column to voice_agent_configs
ALTER TABLE public.voice_agent_configs 
ADD COLUMN IF NOT EXISTS arabic_support BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.voice_agent_configs.arabic_support IS 'Enable Arabic language support for voice interactions';

-- Update any existing configs to have arabic_support based on language
UPDATE public.voice_agent_configs 
SET arabic_support = true 
WHERE language = 'ar';

-- Also add any other potentially missing columns
ALTER TABLE public.voice_agent_configs
ADD COLUMN IF NOT EXISTS proxy_url TEXT,
ADD COLUMN IF NOT EXISTS emotion_detection BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN public.voice_agent_configs.proxy_url IS 'Custom proxy URL for voice service if needed';
COMMENT ON COLUMN public.voice_agent_configs.emotion_detection IS 'Enable emotion detection in voice responses';