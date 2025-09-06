-- Database Functions and Triggers

-- 1. Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS handle_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER handle_updated_at 
                    BEFORE UPDATE ON %I 
                    FOR EACH ROW 
                    EXECUTE FUNCTION public.handle_updated_at()', t);
  END LOOP;
END $$;

-- 2. Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, provider, metadata)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider',
    jsonb_build_object(
      'email_verified', NEW.email_confirmed_at IS NOT NULL,
      'phone_verified', NEW.phone_confirmed_at IS NOT NULL,
      'created_via', COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    )
  );
  
  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Calculate user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics(p_user_id UUID)
RETURNS TABLE (
  total_assessments INTEGER,
  completed_goals INTEGER,
  total_goals INTEGER,
  journal_entries INTEGER,
  chat_sessions INTEGER,
  voice_sessions INTEGER,
  member_since TIMESTAMPTZ,
  last_active TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM public.assessments WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.goals WHERE user_id = p_user_id AND status = 'completed'),
    (SELECT COUNT(*)::INTEGER FROM public.goals WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.journal_entries WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.chat_sessions WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.voice_sessions WHERE user_id = p_user_id),
    (SELECT created_at FROM public.user_profiles WHERE id = p_user_id),
    GREATEST(
      (SELECT MAX(created_at) FROM public.assessments WHERE user_id = p_user_id),
      (SELECT MAX(updated_at) FROM public.goals WHERE user_id = p_user_id),
      (SELECT MAX(created_at) FROM public.journal_entries WHERE user_id = p_user_id),
      (SELECT MAX(created_at) FROM public.chat_sessions WHERE user_id = p_user_id),
      (SELECT MAX(created_at) FROM public.voice_sessions WHERE user_id = p_user_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get user's recent activity
CREATE OR REPLACE FUNCTION public.get_recent_activity(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH activities AS (
    -- Assessments
    SELECT 
      a.id,
      'assessment'::TEXT as type,
      a.type::TEXT as title,
      'Completed assessment' as description,
      a.created_at,
      jsonb_build_object('score', a.score, 'type', a.type) as metadata
    FROM public.assessments a
    WHERE a.user_id = p_user_id
    
    UNION ALL
    
    -- Goals
    SELECT 
      g.id,
      'goal'::TEXT as type,
      g.title,
      g.description,
      g.created_at,
      jsonb_build_object('status', g.status, 'category', g.category) as metadata
    FROM public.goals g
    WHERE g.user_id = p_user_id
    
    UNION ALL
    
    -- Journal entries
    SELECT 
      j.id,
      'journal'::TEXT as type,
      CASE 
        WHEN j.title IS NOT NULL THEN j.title
        ELSE 'Journal Entry'
      END as title,
      LEFT(j.content, 100) || '...' as description,
      j.created_at,
      jsonb_build_object('mood', j.mood, 'tags', j.tags) as metadata
    FROM public.journal_entries j
    WHERE j.user_id = p_user_id
  )
  SELECT * FROM activities
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Search across user content
CREATE OR REPLACE FUNCTION public.search_user_content(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  content TEXT,
  relevance REAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    -- Search goals
    SELECT 
      g.id,
      'goal'::TEXT as type,
      g.title,
      g.description as content,
      ts_rank(
        to_tsvector('english', COALESCE(g.title, '') || ' ' || COALESCE(g.description, '')),
        plainto_tsquery('english', p_query)
      ) as relevance,
      g.created_at
    FROM public.goals g
    WHERE g.user_id = p_user_id
    AND to_tsvector('english', COALESCE(g.title, '') || ' ' || COALESCE(g.description, '')) @@ plainto_tsquery('english', p_query)
    
    UNION ALL
    
    -- Search journal entries
    SELECT 
      j.id,
      'journal'::TEXT as type,
      COALESCE(j.title, 'Journal Entry') as title,
      j.content,
      ts_rank(
        to_tsvector('english', COALESCE(j.title, '') || ' ' || COALESCE(j.content, '')),
        plainto_tsquery('english', p_query)
      ) as relevance,
      j.created_at
    FROM public.journal_entries j
    WHERE j.user_id = p_user_id
    AND to_tsvector('english', COALESCE(j.title, '') || ' ' || COALESCE(j.content, '')) @@ plainto_tsquery('english', p_query)
    
    UNION ALL
    
    -- Search chat messages
    SELECT 
      m.id,
      'message'::TEXT as type,
      'Chat Message' as title,
      m.content,
      ts_rank(
        to_tsvector('english', m.content),
        plainto_tsquery('english', p_query)
      ) as relevance,
      m.created_at
    FROM public.chat_messages m
    JOIN public.chat_sessions s ON s.id = m.session_id
    WHERE s.user_id = p_user_id
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', p_query)
  )
  SELECT * FROM search_results
  WHERE relevance > 0
  ORDER BY relevance DESC, created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Archive old data
CREATE OR REPLACE FUNCTION public.archive_old_data()
RETURNS void AS $$
BEGIN
  -- Archive chat messages older than 6 months
  UPDATE public.chat_messages
  SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{archived}', 'true')
  WHERE created_at < NOW() - INTERVAL '6 months'
  AND (metadata->>'archived' IS NULL OR metadata->>'archived' = 'false');
  
  -- Archive voice sessions older than 3 months
  UPDATE public.voice_sessions
  SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{archived}', 'true')
  WHERE created_at < NOW() - INTERVAL '3 months'
  AND (metadata->>'archived' IS NULL OR metadata->>'archived' = 'false');
  
  -- Delete old error logs
  DELETE FROM public.error_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete old performance metrics
  DELETE FROM public.performance_metrics
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Calculate subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id UUID)
RETURNS TABLE (
  has_subscription BOOLEAN,
  plan_id TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_sub AS (
    SELECT * FROM public.subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    ORDER BY created_at DESC
    LIMIT 1
  )
  SELECT
    EXISTS(SELECT 1 FROM user_sub) as has_subscription,
    COALESCE(us.plan_id, 'free') as plan_id,
    COALESCE(us.status, 'free') as status,
    us.current_period_end as expires_at,
    CASE 
      WHEN us.plan_id = 'premium' THEN jsonb_build_object(
        'unlimited_chats', true,
        'voice_enabled', true,
        'advanced_ai', true,
        'priority_support', true,
        'custom_prompts', true
      )
      WHEN us.plan_id = 'basic' THEN jsonb_build_object(
        'unlimited_chats', false,
        'voice_enabled', true,
        'advanced_ai', false,
        'priority_support', false,
        'custom_prompts', false
      )
      ELSE jsonb_build_object(
        'unlimited_chats', false,
        'voice_enabled', false,
        'advanced_ai', false,
        'priority_support', false,
        'custom_prompts', false
      )
    END as features
  FROM user_sub us
  RIGHT JOIN (SELECT 1) dummy ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessments_user_created ON public.assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON public.journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_created ON public.chat_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON public.chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read_at);

-- Create text search indexes
CREATE INDEX IF NOT EXISTS idx_goals_search ON public.goals USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_journal_search ON public.journal_entries USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_chat_messages_search ON public.chat_messages USING gin(to_tsvector('english', content));