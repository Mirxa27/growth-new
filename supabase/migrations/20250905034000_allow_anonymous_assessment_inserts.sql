-- Enable anonymous inserts for visitor sessions into assessment_results
-- Allows inserts when visitor_session_id is provided; keeps existing authenticated checks.

BEGIN;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE IF EXISTS public.assessment_results ENABLE ROW LEVEL SECURITY;

-- Remove any conflicting policy (safe to DROP IF EXISTS)
DROP POLICY IF EXISTS "Allow anonymous inserts for visitor session" ON public.assessment_results;

CREATE POLICY "Allow anonymous inserts for visitor session" 
  ON public.assessment_results
  FOR INSERT
  WITH CHECK (
    (auth.role() = 'authenticated' AND user_id = auth.uid())
    OR (visitor_session_id IS NOT NULL)
  );

COMMIT;
