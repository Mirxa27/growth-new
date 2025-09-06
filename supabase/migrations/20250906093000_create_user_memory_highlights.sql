-- Create a compact, user-scoped memory highlights table
-- Stores only key interaction highlights to personalize responses across chat and voice

CREATE TABLE IF NOT EXISTS public.user_memory_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  highlights JSONB NOT NULL DEFAULT jsonb_build_object(
    'preferences', '[]'::jsonb,
    'themes', '[]'::jsonb,
    'context', '[]'::jsonb
  ),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_memory_highlights_user_unique UNIQUE (user_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_memory_highlights_user_id ON public.user_memory_highlights(user_id);

-- RLS
ALTER TABLE public.user_memory_highlights ENABLE ROW LEVEL SECURITY;

-- Users can read their own memory highlights
CREATE POLICY "Users read own memory highlights"
  ON public.user_memory_highlights FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own memory highlights
CREATE POLICY "Users upsert own memory highlights"
  ON public.user_memory_highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own memory highlights"
  ON public.user_memory_highlights FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_memory_highlights_updated_at ON public.user_memory_highlights;
CREATE TRIGGER trg_user_memory_highlights_updated_at
BEFORE UPDATE ON public.user_memory_highlights
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

