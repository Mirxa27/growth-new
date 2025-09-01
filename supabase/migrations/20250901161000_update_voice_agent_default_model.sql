-- Ensure default model is chat-capable in voice_agent_configs
ALTER TABLE IF EXISTS public.voice_agent_configs
  ALTER COLUMN model SET DEFAULT 'gpt-4o-mini';

-- Backfill any old realtime model names to a chat-capable default
UPDATE public.voice_agent_configs
SET model = 'gpt-4o-mini'
WHERE model IS NULL OR model = '' OR model ILIKE 'gpt-4o-realtime%';

