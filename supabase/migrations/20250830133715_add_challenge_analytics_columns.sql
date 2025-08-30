-- Add analytics columns to challenges table for tracking engagement
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS participant_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_completions INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_completion_time_hours DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0.00;

-- Add analytics columns to user_levels table
ALTER TABLE public.user_levels 
ADD COLUMN IF NOT EXISTS users_at_level INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_users_achieved INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_time_to_reach_hours DECIMAL(8,2);

-- Create function to update challenge analytics
CREATE OR REPLACE FUNCTION public.update_challenge_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update participant count
    UPDATE public.challenges 
    SET participant_count = (
        SELECT COUNT(DISTINCT user_id) 
        FROM public.user_challenge_progress 
        WHERE challenge_id = NEW.challenge_id
    )
    WHERE id = NEW.challenge_id;

    -- Update completion rate and total completions
    UPDATE public.challenges 
    SET 
        total_completions = (
            SELECT COUNT(*) 
            FROM public.user_challenge_progress 
            WHERE challenge_id = NEW.challenge_id 
            AND status = 'completed'
        ),
        completion_rate = (
            SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 0
                    ELSE (COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*))
                END
            FROM public.user_challenge_progress 
            WHERE challenge_id = NEW.challenge_id
        )
    WHERE id = NEW.challenge_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update analytics when challenge progress changes
CREATE TRIGGER update_challenge_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_challenge_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_challenge_analytics();

-- Create function to update level analytics
CREATE OR REPLACE FUNCTION public.update_level_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update users at current level
    UPDATE public.user_levels 
    SET users_at_level = (
        SELECT COUNT(*) 
        FROM public.user_stats 
        WHERE level = NEW.level_number
    )
    WHERE level_number = NEW.level_number;

    -- Update total users achieved
    UPDATE public.user_levels 
    SET total_users_achieved = (
        SELECT COUNT(*) 
        FROM public.user_stats 
        WHERE level >= NEW.level_number
    )
    WHERE level_number = NEW.level_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update level analytics when user stats change
CREATE TRIGGER update_level_analytics_trigger
    AFTER INSERT OR UPDATE ON public.user_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_level_analytics();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_challenge_id ON public.user_challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_status ON public.user_challenge_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON public.user_stats(level);
