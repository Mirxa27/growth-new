-- Create notifications system tables

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'achievement', 'reminder')),
    category VARCHAR(20) DEFAULT 'system' CHECK (category IN ('system', 'social', 'progress', 'achievement', 'reminder')),
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    action_label VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_read (user_id, read),
    INDEX idx_notifications_created_at (created_at DESC)
);

-- 2. Create push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    category VARCHAR(20) DEFAULT 'system',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS policies for push subscriptions
CREATE POLICY "Users can manage own push subscription" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- 7. Create RLS policies for notification templates
CREATE POLICY "Anyone can view notification templates" ON public.notification_templates
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage templates" ON public.notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- 8. Create function to send notification
CREATE OR REPLACE FUNCTION public.send_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info',
    p_category TEXT DEFAULT 'system',
    p_action_url TEXT DEFAULT NULL,
    p_action_label TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        category,
        action_url,
        action_label,
        metadata
    ) VALUES (
        p_user_id,
        p_title,
        p_message,
        p_type,
        p_category,
        p_action_url,
        p_action_label,
        p_metadata
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to send notification from template
CREATE OR REPLACE FUNCTION public.send_notification_from_template(
    p_user_id UUID,
    p_template_name TEXT,
    p_variables JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_template RECORD;
    v_title TEXT;
    v_message TEXT;
    v_key TEXT;
    v_value TEXT;
BEGIN
    -- Get template
    SELECT * INTO v_template
    FROM public.notification_templates
    WHERE name = p_template_name;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template % not found', p_template_name;
    END IF;
    
    -- Replace variables in title and message
    v_title := v_template.title_template;
    v_message := v_template.message_template;
    
    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
    LOOP
        v_title := REPLACE(v_title, '{{' || v_key || '}}', v_value);
        v_message := REPLACE(v_message, '{{' || v_key || '}}', v_value);
    END LOOP;
    
    -- Send notification
    RETURN public.send_notification(
        p_user_id,
        v_title,
        v_message,
        v_template.type,
        v_template.category,
        v_template.metadata->>'action_url',
        v_template.metadata->>'action_label',
        p_variables
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create triggers for automatic notifications

-- Trigger for achievement notifications
CREATE OR REPLACE FUNCTION public.notify_achievement()
RETURNS TRIGGER AS $$
BEGIN
    -- Send notification when user completes an achievement
    PERFORM public.send_notification(
        NEW.user_id,
        'Achievement Unlocked!',
        'Congratulations! You''ve earned the "' || NEW.achievement_name || '" achievement!',
        'achievement',
        'achievement',
        '/achievements',
        'View Achievements',
        jsonb_build_object('achievement_id', NEW.id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for progress milestones
CREATE OR REPLACE FUNCTION public.notify_progress_milestone()
RETURNS TRIGGER AS $$
BEGIN
    -- Send notification for progress milestones (25%, 50%, 75%, 100%)
    IF NEW.progress_percentage IN (25, 50, 75, 100) AND 
       (OLD.progress_percentage IS NULL OR OLD.progress_percentage < NEW.progress_percentage) THEN
        PERFORM public.send_notification(
            NEW.user_id,
            'Progress Milestone!',
            'You''ve reached ' || NEW.progress_percentage || '% completion!',
            'success',
            'progress',
            '/library',
            'Continue Learning',
            jsonb_build_object('progress_id', NEW.id, 'percentage', NEW.progress_percentage)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_progress_milestone_trigger ON public.user_library_progress;
CREATE TRIGGER notify_progress_milestone_trigger
    AFTER INSERT OR UPDATE ON public.user_library_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_progress_milestone();

-- 11. Insert default notification templates
INSERT INTO public.notification_templates (name, title_template, message_template, type, category, metadata) VALUES
    ('welcome', 'Welcome to NewMe!', 'Hi {{username}}! We''re excited to have you on your growth journey.', 'success', 'system', '{"action_url": "/onboarding", "action_label": "Get Started"}'),
    ('assessment_complete', 'Assessment Complete!', 'Great job completing your {{assessment_type}} assessment! View your results now.', 'success', 'progress', '{"action_url": "/dashboard", "action_label": "View Results"}'),
    ('daily_reminder', 'Daily Check-in', 'Hi {{username}}, don''t forget your daily reflection and growth activities!', 'reminder', 'reminder', '{"action_url": "/dashboard", "action_label": "Check In"}'),
    ('new_content', 'New Content Available!', 'Check out the new {{content_type}}: "{{content_title}}"', 'info', 'system', '{"action_url": "/library", "action_label": "Explore"}'),
    ('community_interaction', 'New Activity', '{{actor_name}} {{action}} your post', 'info', 'social', '{"action_url": "/community", "action_label": "View"}')
ON CONFLICT (name) DO NOTHING;

-- 12. Add notification preferences to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
    "email": true,
    "push": false,
    "in_app": true,
    "sound": true,
    "categories": {
        "system": true,
        "social": true,
        "progress": true,
        "achievement": true,
        "reminder": true
    }
}';