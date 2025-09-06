-- Create voice_sessions table for tracking voice conversations
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id UUID REFERENCES voice_agent_configs(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  voice TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  transcript JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  audio_quality_metrics JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create voice_agent_configs table for voice agent configurations
CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  model TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  input_audio_format TEXT DEFAULT 'pcm16',
  output_audio_format TEXT DEFAULT 'pcm16',
  sample_rate INTEGER DEFAULT 24000,
  channels INTEGER DEFAULT 1,
  enable_vad BOOLEAN DEFAULT true,
  vad_threshold NUMERIC DEFAULT -45,
  enable_noise_suppression BOOLEAN DEFAULT true,
  enable_echo_cancellation BOOLEAN DEFAULT true,
  max_session_duration INTEGER DEFAULT 1800,
  language TEXT DEFAULT 'en',
  enable_auto_punctuation BOOLEAN DEFAULT true,
  enable_timestamps BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON public.voice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_started_at ON public.voice_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_config_id ON public.voice_sessions(config_id);

-- Create RLS policies for voice_sessions
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice sessions" ON public.voice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice sessions" ON public.voice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice sessions" ON public.voice_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice sessions" ON public.voice_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for voice_agent_configs
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all voice configs" ON public.voice_agent_configs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can create voice configs" ON public.voice_agent_configs
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update voice configs" ON public.voice_agent_configs
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete voice configs" ON public.voice_agent_configs
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_voice_sessions_updated_at BEFORE UPDATE ON public.voice_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_agent_configs_updated_at BEFORE UPDATE ON public.voice_agent_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default voice configuration
INSERT INTO public.voice_agent_configs (
  name,
  voice_id,
  model,
  system_prompt,
  temperature,
  max_tokens,
  is_active
) VALUES (
  'NewMe Default Voice',
  'alloy',
  'gpt-4o-realtime-preview-2024-10-01',
  'You are NewMe, a supportive growth guide for women''s personal growth. Be warm, encouraging, and insightful. Focus on personal development, mindfulness, and building confidence. Provide actionable advice and emotional support.',
  0.7,
  1000,
  true
) ON CONFLICT DO NOTHING;
