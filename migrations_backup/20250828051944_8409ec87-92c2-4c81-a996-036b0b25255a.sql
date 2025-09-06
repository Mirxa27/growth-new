-- Create community posts table for social features
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'general',
    visibility TEXT NOT NULL DEFAULT 'public',
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    is_reported BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenges table for gamification
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    challenge_type TEXT NOT NULL DEFAULT 'daily',
    difficulty_level TEXT NOT NULL DEFAULT 'beginner',
    duration_days INTEGER NOT NULL DEFAULT 7,
    crystal_reward INTEGER NOT NULL DEFAULT 100,
    requirements JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user levels table for progression system
CREATE TABLE IF NOT EXISTS public.user_levels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    level_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    crystal_requirement INTEGER NOT NULL DEFAULT 100,
    rewards JSONB DEFAULT '{}',
    unlocks TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(level_number)
);

-- Create user challenge progress table
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, challenge_id)
);

-- Enable RLS on all tables
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Community posts policies
CREATE POLICY "Users can view public posts" ON public.community_posts
FOR SELECT USING (visibility = 'public' AND is_approved = true);

CREATE POLICY "Users can create their own posts" ON public.community_posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.community_posts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.community_posts
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all posts" ON public.community_posts
FOR ALL USING (is_admin(auth.uid()));

-- Challenges policies
CREATE POLICY "Anyone can view active challenges" ON public.challenges
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage challenges" ON public.challenges
FOR ALL USING (is_admin(auth.uid()));

-- User levels policies
CREATE POLICY "Anyone can view active levels" ON public.user_levels
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage levels" ON public.user_levels
FOR ALL USING (is_admin(auth.uid()));

-- User challenge progress policies
CREATE POLICY "Users can view their own progress" ON public.user_challenge_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" ON public.user_challenge_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_challenge_progress
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.user_challenge_progress
FOR SELECT USING (is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_community_posts_updated_at
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_challenges_updated_at
    BEFORE UPDATE ON public.challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_levels_updated_at
    BEFORE UPDATE ON public.user_levels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_challenge_progress_updated_at
    BEFORE UPDATE ON public.user_challenge_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();