-- Create comprehensive chat persistence tables

-- 1. Enhanced chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    messages JSONB DEFAULT '[]',
    summary TEXT,
    topics TEXT[],
    emotion_analysis JSONB,
    is_archived BOOLEAN DEFAULT false,
    is_favorite BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_chat_sessions_user_id (user_id),
    INDEX idx_chat_sessions_updated_at (updated_at DESC),
    INDEX idx_chat_sessions_archived (is_archived),
    INDEX idx_chat_sessions_favorite (is_favorite)
);

-- 2. Chat templates table
CREATE TABLE IF NOT EXISTS public.chat_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    initial_messages JSONB DEFAULT '[]',
    system_prompt TEXT,
    suggested_prompts TEXT[],
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name)
);

-- 3. Chat analytics table
CREATE TABLE IF NOT EXISTS public.chat_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
    topics TEXT[],
    emotions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_chat_analytics_user_id (user_id),
    INDEX idx_chat_analytics_session_id (session_id)
);

-- 4. Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for chat_sessions
CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions
    FOR ALL USING (auth.uid() = user_id);

-- 6. RLS Policies for chat_templates
CREATE POLICY "Anyone can view public templates" ON public.chat_templates
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON public.chat_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" ON public.chat_templates
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own templates" ON public.chat_templates
    FOR DELETE USING (created_by = auth.uid());

-- 7. RLS Policies for chat_analytics
CREATE POLICY "Users can view own analytics" ON public.chat_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analytics" ON public.chat_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Function to clean up old sessions
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_sessions()
RETURNS void AS $$
BEGIN
    -- Archive sessions older than 30 days that aren't favorites
    UPDATE public.chat_sessions
    SET is_archived = true
    WHERE updated_at < NOW() - INTERVAL '30 days'
    AND is_favorite = false
    AND is_archived = false;
    
    -- Delete archived sessions older than 90 days
    DELETE FROM public.chat_sessions
    WHERE is_archived = true
    AND updated_at < NOW() - INTERVAL '90 days'
    AND is_favorite = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_chat_session_updated_at();

-- 10. Insert default chat templates
INSERT INTO public.chat_templates (name, description, category, initial_messages, system_prompt, suggested_prompts, is_public)
VALUES 
    ('Personal Growth Coach', 'Get guidance on personal development and growth', 'coaching', 
     '[{"role": "assistant", "content": "Hello! I''m here to support your personal growth journey. What area of your life would you like to work on today?"}]'::jsonb,
     'You are a supportive personal growth coach. Help users identify goals, overcome obstacles, and develop actionable plans for self-improvement.',
     ARRAY['What are my strengths?', 'How can I build better habits?', 'Help me set achievable goals'],
     true),
     
    ('Mindfulness Guide', 'Practice mindfulness and meditation', 'wellness',
     '[{"role": "assistant", "content": "Welcome to your mindfulness session. Let''s take a moment to center ourselves. How are you feeling right now?"}]'::jsonb,
     'You are a calming mindfulness guide. Help users practice meditation, breathing exercises, and present-moment awareness.',
     ARRAY['Guide me through a breathing exercise', 'Help me deal with stress', 'Teach me about mindfulness'],
     true),
     
    ('Career Advisor', 'Get career guidance and professional development tips', 'career',
     '[{"role": "assistant", "content": "I''m here to help with your career development. What professional challenges or goals would you like to discuss?"}]'::jsonb,
     'You are a knowledgeable career advisor. Help users with career planning, job search strategies, and professional development.',
     ARRAY['How do I ask for a raise?', 'Help me improve my resume', 'Career change advice'],
     true)
ON CONFLICT (name) DO NOTHING;