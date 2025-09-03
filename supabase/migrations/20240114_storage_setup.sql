-- Storage Setup and Policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('documents', 'documents', false, false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('voice-recordings', 'voice-recordings', false, false, 52428800, ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg']),
  ('exports', 'exports', false, false, 104857600, ARRAY['application/zip', 'application/json', 'text/csv'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Storage policies for documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for voice-recordings bucket
CREATE POLICY "Users can upload their own recordings" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'voice-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own recordings" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'voice-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own recordings" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'voice-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for exports bucket
CREATE POLICY "Users can create their own exports" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can download their own exports" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own exports" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Helper function to get storage URL
CREATE OR REPLACE FUNCTION public.get_storage_url(p_bucket TEXT, p_path TEXT)
RETURNS TEXT AS $$
DECLARE
  v_project_url TEXT;
BEGIN
  -- Get the project URL from the current configuration
  SELECT current_setting('app.settings.project_url', true) INTO v_project_url;
  
  IF v_project_url IS NULL THEN
    v_project_url := 'https://ufgqmqoykddaotdbwteg.supabase.co';
  END IF;
  
  RETURN v_project_url || '/storage/v1/object/public/' || p_bucket || '/' || p_path;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to clean up old exports
CREATE OR REPLACE FUNCTION public.cleanup_old_exports()
RETURNS void AS $$
BEGIN
  -- Delete exports older than 7 days
  DELETE FROM storage.objects
  WHERE bucket_id = 'exports'
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;