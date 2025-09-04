-- Rollback migration: remove columns added for voice_agent_configs
-- Run this only if you are certain you want to revert the schema change.
BEGIN;

ALTER TABLE public.voice_agent_configs
  DROP COLUMN IF EXISTS api_base_url,
  DROP COLUMN IF EXISTS openai_api_key,
  DROP COLUMN IF EXISTS openai_organization,
  DROP COLUMN IF EXISTS openai_project,
  DROP COLUMN IF EXISTS max_tokens,
  DROP COLUMN IF EXISTS top_p,
  DROP COLUMN IF EXISTS frequency_penalty,
  DROP COLUMN IF EXISTS presence_penalty,
  DROP COLUMN IF EXISTS enable_realtime,
  DROP COLUMN IF EXISTS use_proxy,
  DROP COLUMN IF EXISTS proxy_url,
  DROP COLUMN IF EXISTS input_audio_transcription_model,
  DROP COLUMN IF EXISTS language,
  DROP COLUMN IF EXISTS arabic_support,
  DROP COLUMN IF EXISTS emotion_detection;

COMMIT;