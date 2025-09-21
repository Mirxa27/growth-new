CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.platform_secret_settings (
  setting_key text PRIMARY KEY,
  secret_ciphertext bytea NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE public.platform_secret_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no direct access to platform_secret_settings"
  ON public.platform_secret_settings
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.set_platform_secret(key_name text, secret_value text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_secret text;
BEGIN
  encryption_secret := current_setting('app.encryption_secret', true);

  IF encryption_secret IS NULL OR length(encryption_secret) = 0 THEN
    RAISE EXCEPTION 'Encryption secret not configured. Set app.encryption_secret.';
  END IF;

  IF auth.uid() IS NULL OR NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  INSERT INTO public.platform_secret_settings (setting_key, secret_ciphertext)
  VALUES (key_name, pgp_sym_encrypt(secret_value, encryption_secret))
  ON CONFLICT (setting_key)
  DO UPDATE SET
    secret_ciphertext = EXCLUDED.secret_ciphertext,
    updated_at = timezone('utc', now());

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_platform_secret(key_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  DELETE FROM public.platform_secret_settings
  WHERE setting_key = key_name;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_secret_metadata(key_name text)
RETURNS TABLE(has_secret boolean, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_record public.platform_secret_settings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  SELECT * INTO secret_record
  FROM public.platform_secret_settings
  WHERE setting_key = key_name;

  IF FOUND THEN
    has_secret := true;
    updated_at := secret_record.updated_at;
  ELSE
    has_secret := false;
    updated_at := NULL;
  END IF;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_secret_value(key_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_secret text;
  requester_role text;
  decrypted_value text;
BEGIN
  requester_role := current_setting('request.jwt.claim.role', true);

  IF requester_role IS NULL OR requester_role <> 'service_role' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  encryption_secret := current_setting('app.encryption_secret', true);

  IF encryption_secret IS NULL OR length(encryption_secret) = 0 THEN
    RAISE EXCEPTION 'Encryption secret not configured. Set app.encryption_secret.';
  END IF;

  SELECT pgp_sym_decrypt(secret_ciphertext, encryption_secret)
    INTO decrypted_value
  FROM public.platform_secret_settings
  WHERE setting_key = key_name;

  RETURN decrypted_value;
END;
$$;

CREATE TRIGGER handle_updated_at_platform_secret_settings
  BEFORE UPDATE ON public.platform_secret_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

GRANT EXECUTE ON FUNCTION public.set_platform_secret(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_platform_secret(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_secret_metadata(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_secret_value(text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_assessment_admin_summary(limit_count integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  type text,
  visibility text,
  ai_provider text,
  ai_model text,
  ai_prompt text,
  created_at timestamptz,
  updated_at timestamptz,
  question_count bigint,
  attempt_count bigint,
  completion_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.description,
    a.type,
    a.visibility,
    a.ai_provider,
    a.ai_model,
    a.ai_prompt,
    a.created_at,
    a.updated_at,
    COALESCE(q.question_count, 0)::bigint AS question_count,
    COALESCE(attempts.attempt_count, 0)::bigint AS attempt_count,
    COALESCE(attempts.completion_count, 0)::bigint AS completion_count
  FROM public.assessments a
  LEFT JOIN (
    SELECT assessment_id, COUNT(*) AS question_count
    FROM public.assessment_questions
    GROUP BY assessment_id
  ) q ON q.assessment_id = a.id
  LEFT JOIN (
    SELECT assessment_id,
           COUNT(*) AS attempt_count,
           COUNT(*) FILTER (WHERE status = 'completed') AS completion_count
    FROM public.user_assessment_attempts
    GROUP BY assessment_id
  ) attempts ON attempts.assessment_id = a.id
  ORDER BY a.created_at DESC NULLS LAST
  LIMIT COALESCE(limit_count, 100);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_assessment_admin_summary(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_assessment_admin_summary(integer) TO service_role;
