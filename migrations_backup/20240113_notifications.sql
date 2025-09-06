-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'achievement', 'message', 'reminder', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  action_url TEXT,
  action_label TEXT
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "email": {
      "enabled": true,
      "frequency": "immediate",
      "categories": ["achievement", "message", "system"]
    },
    "push": {
      "enabled": true,
      "categories": ["info", "success", "warning", "error", "achievement", "message", "reminder", "system"]
    },
    "inApp": {
      "enabled": true,
      "sound": true,
      "vibration": true
    }
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for preferences
CREATE POLICY "Users can view their own preferences" ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subscription->>'endpoint')
);

-- Enable RLS on push subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for push subscriptions
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to send notification to user
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_channels TEXT[] DEFAULT ARRAY['in_app'],
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    channels,
    action_url,
    action_label
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_data,
    p_channels,
    p_action_url,
    p_action_label
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send achievement notification
CREATE OR REPLACE FUNCTION send_achievement_notification(
  p_user_id UUID,
  p_achievement_name TEXT,
  p_achievement_description TEXT,
  p_crystals_earned INTEGER DEFAULT 0
) RETURNS UUID AS $$
BEGIN
  RETURN send_notification(
    p_user_id,
    'achievement',
    'Achievement Unlocked: ' || p_achievement_name,
    p_achievement_description,
    jsonb_build_object(
      'achievement_name', p_achievement_name,
      'crystals_earned', p_crystals_earned
    ),
    ARRAY['in_app', 'push'],
    '/profile#achievements',
    'View Achievement'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-notifications', '0 0 * * *', 'SELECT cleanup_expired_notifications();');