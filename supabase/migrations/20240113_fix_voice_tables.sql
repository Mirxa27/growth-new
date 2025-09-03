-- Create voice_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT DEFAULT gen_random_uuid()::text,
  session_token TEXT,
  model TEXT DEFAULT 'gpt-4o-realtime-preview',
  voice TEXT DEFAULT 'nova',
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON public.voice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_created_at ON public.voice_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own voice sessions" ON public.voice_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice sessions" ON public.voice_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice sessions" ON public.voice_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add missing columns to voice_agent_configs if they don't exist
DO $$ 
BEGIN
  -- Add enable_realtime column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'enable_realtime') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN enable_realtime BOOLEAN DEFAULT true;
  END IF;

  -- Add use_proxy column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'use_proxy') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN use_proxy BOOLEAN DEFAULT true;
  END IF;

  -- Add proxy_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'proxy_url') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN proxy_url TEXT;
  END IF;

  -- Add input_audio_transcription_model column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'input_audio_transcription_model') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN input_audio_transcription_model TEXT DEFAULT 'whisper-1';
  END IF;

  -- Add input_audio_format column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'input_audio_format') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN input_audio_format TEXT DEFAULT 'pcm16';
  END IF;

  -- Add output_audio_format column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'output_audio_format') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN output_audio_format TEXT DEFAULT 'pcm16';
  END IF;

  -- Add turn_detection_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'turn_detection_type') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_type TEXT DEFAULT 'server_vad';
  END IF;

  -- Add turn_detection_threshold column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'turn_detection_threshold') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_threshold DECIMAL(3,2) DEFAULT 0.5;
  END IF;

  -- Add turn_detection_prefix_padding_ms column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'turn_detection_prefix_padding_ms') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_prefix_padding_ms INTEGER DEFAULT 300;
  END IF;

  -- Add turn_detection_silence_duration_ms column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'turn_detection_silence_duration_ms') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_silence_duration_ms INTEGER DEFAULT 1000;
  END IF;

  -- Add language column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'language') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN language TEXT DEFAULT 'en';
  END IF;

  -- Add arabic_support column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'arabic_support') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN arabic_support BOOLEAN DEFAULT false;
  END IF;

  -- Add emotion_detection column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'emotion_detection') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN emotion_detection BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.voice_agent_configs.enable_realtime IS 'Enable realtime voice interaction';
COMMENT ON COLUMN public.voice_agent_configs.use_proxy IS 'Use proxy for voice API calls';
COMMENT ON COLUMN public.voice_agent_configs.proxy_url IS 'Custom proxy URL for voice service';
COMMENT ON COLUMN public.voice_agent_configs.input_audio_transcription_model IS 'Model used for audio transcription';
COMMENT ON COLUMN public.voice_agent_configs.input_audio_format IS 'Format for input audio';
COMMENT ON COLUMN public.voice_agent_configs.output_audio_format IS 'Format for output audio';
COMMENT ON COLUMN public.voice_agent_configs.turn_detection_type IS 'Type of turn detection (server_vad or none)';
COMMENT ON COLUMN public.voice_agent_configs.turn_detection_threshold IS 'Threshold for voice activity detection';
COMMENT ON COLUMN public.voice_agent_configs.turn_detection_prefix_padding_ms IS 'Padding before voice detection';
COMMENT ON COLUMN public.voice_agent_configs.turn_detection_silence_duration_ms IS 'Duration of silence before turn ends';
COMMENT ON COLUMN public.voice_agent_configs.language IS 'Language code for voice interaction';
COMMENT ON COLUMN public.voice_agent_configs.arabic_support IS 'Enable Arabic language support';
COMMENT ON COLUMN public.voice_agent_configs.emotion_detection IS 'Enable emotion detection in voice';

-- Create a default voice agent config if none exists
INSERT INTO public.voice_agent_configs (
  name,
  provider,
  model,
  voice,
  temperature,
  instructions,
  is_active,
  enable_realtime,
  use_proxy,
  language,
  arabic_support,
  emotion_detection
) 
SELECT 
  'Default Voice Agent',
  'openai',
  'gpt-4o-realtime-preview-2024-12-06',
  'nova',
  0.7,
  'You are NewMe, a supportive and empathetic AI companion focused on personal growth and mental wellness. Be warm, encouraging, and insightful in your interactions.',
  true,
  true,
  false,
  'en',
  false,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.voice_agent_configs WHERE is_active = true
);