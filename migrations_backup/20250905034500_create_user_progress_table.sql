-- Create user_progress table for tracking per-user assessment progress
BEGIN;

CREATE TABLE IF NOT EXISTS public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id text,
  progress jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_progress;
CREATE POLICY "Users can manage their own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
