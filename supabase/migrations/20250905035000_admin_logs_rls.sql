-- Enforce admin-only access for admin_logs
BEGIN;

ALTER TABLE IF EXISTS public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_only_access" ON public.admin_logs;
CREATE POLICY "admin_only_access"
  ON public.admin_logs
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMIT;
