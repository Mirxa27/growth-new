-- Create admin analytics views and functions for comprehensive platform insights

-- Analytics summary view
CREATE OR REPLACE VIEW public.admin_analytics_summary AS
SELECT 
    -- User metrics
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as admin_users,
    
    -- Assessment metrics
    (SELECT COUNT(*) FROM public.assessments) as total_assessments,
    (SELECT COUNT(*) FROM public.assessments WHERE visibility = 'public') as public_assessments,
    (SELECT COUNT(*) FROM public.assessment_results) as total_assessment_results,
    (SELECT COUNT(*) FROM public.assessment_results WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as assessment_results_30d,
    
    -- Engagement metrics
    (SELECT COUNT(*) FROM public.visitor_sessions WHERE started_at >= CURRENT_DATE - INTERVAL '30 days') as visitor_sessions_30d,
    (SELECT AVG(assessments_taken) FROM public.visitor_sessions WHERE assessments_taken > 0) as avg_assessments_per_visitor,
    
    -- System health
    CURRENT_TIMESTAMP as last_updated;

-- User activity analytics
CREATE OR REPLACE VIEW public.admin_user_activity AS
SELECT 
    p.id,
    p.display_name,
    p.email,
    p.role,
    p.created_at,
    up.login_streak_days,
    up.total_sessions,
    up.assessments_completed,
    up.last_login,
    up.level,
    up.experience_points,
    (SELECT COUNT(*) FROM public.assessment_results ar WHERE ar.user_id = p.id) as total_results
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
ORDER BY up.last_login DESC NULLS LAST;

-- Assessment performance analytics
CREATE OR REPLACE VIEW public.admin_assessment_analytics AS
SELECT 
    a.id,
    a.title,
    a.type,
    a.category,
    a.visibility,
    a.created_at,
    COUNT(ar.id) as total_completions,
    COUNT(DISTINCT ar.user_id) as unique_users,
    AVG(ar.score) as average_score,
    COUNT(CASE WHEN ar.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as completions_30d
FROM public.assessments a
LEFT JOIN public.assessment_results ar ON a.id = ar.assessment_id
GROUP BY a.id, a.title, a.type, a.category, a.visibility, a.created_at
ORDER BY total_completions DESC;

-- Daily engagement metrics
CREATE OR REPLACE VIEW public.admin_daily_engagement AS
SELECT 
    date_trunc('day', created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN assessment_id IS NOT NULL THEN 1 END) as assessment_completions
FROM public.assessment_results
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY date_trunc('day', created_at)
ORDER BY date DESC;

-- Enable RLS for analytics views
ALTER VIEW public.admin_analytics_summary SET (security_barrier = true);
ALTER VIEW public.admin_user_activity SET (security_barrier = true);
ALTER VIEW public.admin_assessment_analytics SET (security_barrier = true);
ALTER VIEW public.admin_daily_engagement SET (security_barrier = true);

-- RLS policies for admin-only access
CREATE POLICY "Admin only analytics summary" ON public.admin_analytics_summary
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Function to get platform health status
CREATE OR REPLACE FUNCTION public.get_platform_health()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    SELECT json_build_object(
        'status', 'healthy',
        'timestamp', NOW(),
        'metrics', json_build_object(
            'total_users', (SELECT COUNT(*) FROM public.profiles),
            'active_assessments', (SELECT COUNT(*) FROM public.assessments WHERE visibility = 'public'),
            'recent_activity', (SELECT COUNT(*) FROM public.assessment_results WHERE created_at >= NOW() - INTERVAL '24 hours'),
            'database_size', pg_size_pretty(pg_database_size(current_database())),
            'uptime_check', 'operational'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user engagement metrics
CREATE OR REPLACE FUNCTION public.get_user_engagement_metrics(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    SELECT json_build_object(
        'period_days', days_back,
        'new_users', (
            SELECT COUNT(*) FROM public.profiles 
            WHERE created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
        ),
        'active_users', (
            SELECT COUNT(DISTINCT user_id) FROM public.assessment_results 
            WHERE created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
        ),
        'assessment_completions', (
            SELECT COUNT(*) FROM public.assessment_results 
            WHERE created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
        ),
        'visitor_sessions', (
            SELECT COUNT(*) FROM public.visitor_sessions 
            WHERE started_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
