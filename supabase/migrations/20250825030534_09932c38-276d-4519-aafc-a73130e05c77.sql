-- Create platform settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  category text NOT NULL DEFAULT 'general'::text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for platform_settings
CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create policy for public settings (non-sensitive)
CREATE POLICY "Public settings are viewable by authenticated users"
ON public.platform_settings
FOR SELECT
USING (is_public = true AND auth.role() = 'authenticated');

-- Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, description, category, is_public) VALUES
('platform_name', '"Newomen"', 'Platform display name', 'general', true),
('platform_description', '"AI-Powered Personal Growth Platform for Women"', 'Platform description', 'general', true),
('support_email', '"support@newomen.me"', 'Platform support email', 'general', false),
('maintenance_mode', 'false', 'Enable maintenance mode', 'general', false),
('registration_enabled', 'true', 'Allow new user registration', 'general', false),
('max_daily_messages', '100', 'Maximum daily messages per user', 'limits', false),
('default_crystal_reward', '10', 'Default crystal reward amount', 'gamification', false),
('content_moderation_enabled', 'true', 'Enable content moderation', 'moderation', false),
('auto_flag_threshold', '0.7', 'Automatic flagging threshold', 'moderation', false),
('primary_ai_provider', '"openai"', 'Primary AI provider', 'ai', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to get setting value
CREATE OR REPLACE FUNCTION public.get_platform_setting(key_name text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT setting_value
  FROM public.platform_settings
  WHERE setting_key = key_name
  LIMIT 1;
$$;

-- Create function to update setting value (admin only)
CREATE OR REPLACE FUNCTION public.update_platform_setting(key_name text, new_value jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Update or insert setting
  INSERT INTO public.platform_settings (setting_key, setting_value, updated_at)
  VALUES (key_name, new_value, now())
  ON CONFLICT (setting_key)
  DO UPDATE SET 
    setting_value = new_value,
    updated_at = now();
    
  RETURN true;
END;
$$;

-- Create updated_at trigger for platform_settings
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();