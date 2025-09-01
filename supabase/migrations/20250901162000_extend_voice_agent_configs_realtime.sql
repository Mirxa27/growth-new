-- Extend voice_agent_configs with realtime fields and provider link
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN provider_id UUID REFERENCES public.admin_ai_providers(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'enable_realtime'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN enable_realtime BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'use_proxy'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN use_proxy BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'proxy_url'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN proxy_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'input_audio_transcription_model'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN input_audio_transcription_model TEXT NOT NULL DEFAULT 'whisper-1';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'input_audio_format'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN input_audio_format TEXT NOT NULL DEFAULT 'pcm16';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'output_audio_format'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN output_audio_format TEXT NOT NULL DEFAULT 'pcm16';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'turn_detection_type'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_type TEXT NOT NULL DEFAULT 'server_vad' CHECK (turn_detection_type IN ('server_vad', 'none'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'turn_detection_threshold'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.50;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'turn_detection_prefix_padding_ms'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_prefix_padding_ms INTEGER NOT NULL DEFAULT 300;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'turn_detection_silence_duration_ms'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_silence_duration_ms INTEGER NOT NULL DEFAULT 1000;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'modalities'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN modalities JSONB NOT NULL DEFAULT '["text","audio"]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'language'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN language TEXT NOT NULL DEFAULT 'en';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'arabic_support'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN arabic_support BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'emotion_detection'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN emotion_detection BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

