-- Add columns to profiles table for ban status and bio
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create secure function to update user ban status
CREATE OR REPLACE FUNCTION public.update_user_ban_status_secure(target_user_id uuid, new_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can update ban status
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update the ban status
  UPDATE public.profiles 
  SET is_banned = new_status, updated_at = now()
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
END;
$$;

-- Add columns to community_posts table for status, title, and views
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'removed', 'archived')),
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create secure function to update post status
CREATE OR REPLACE FUNCTION public.update_post_status_secure(p_post_id uuid, p_new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins or moderators can update post status
  IF NOT (is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'moderator')) THEN
    RAISE EXCEPTION 'Access denied: Admin or moderator privileges required';
  END IF;

  -- Validate status
  IF p_new_status NOT IN ('active', 'pending', 'removed', 'archived') THEN
      RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  -- Update the post status
  UPDATE public.community_posts 
  SET status = p_new_status, updated_at = now()
  WHERE id = p_post_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found: %', p_post_id;
  END IF;
END;
$$;

-- Create library_items table for the content library
CREATE TABLE IF NOT EXISTS public.library_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'audio', 'video', 'exercise', 'meditation', 'course')),
    difficulty_level TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT,
    tags TEXT[],
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    is_published BOOLEAN DEFAULT FALSE NOT NULL,
    author TEXT,
    content_url TEXT,
    thumbnail_url TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on library_items if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'library_items' AND rowsecurity = 't') THEN
    ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policies for library_items
DROP POLICY IF EXISTS "Public can view published library items" ON public.library_items;
CREATE POLICY "Public can view published library items" ON public.library_items
FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage library items" ON public.library_items;
CREATE POLICY "Admins can manage library items" ON public.library_items
FOR ALL USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix create_assessment_with_questions function to correctly handle question IDs
CREATE OR REPLACE FUNCTION public.create_assessment_with_questions(
  _title text,
  _description text,
  _type text,
  _visibility text,
  _ai_provider text,
  _ai_model text,
  _ai_prompt text,
  _questions jsonb
) RETURNS void AS $$
DECLARE
    _assessment_id bigint;
    q jsonb;
    question_id   bigint;
    opt jsonb;
BEGIN
    INSERT INTO public.assessments (
        title, description, type, visibility,
        ai_provider, ai_model, ai_prompt
    )
    VALUES (_title, _description, _type, _visibility,
            _ai_provider, _ai_model, _ai_prompt)
    RETURNING id INTO _assessment_id;

    FOR q IN SELECT * FROM jsonb_array_elements(_questions) LOOP
        INSERT INTO public.assessment_questions (
            assessment_id, question_text, question_type, position
        )
        VALUES (
            _assessment_id,
            q->>'question_text',
            q->>'question_type',
            (q->>'position')::int
        )
        RETURNING id INTO question_id;

        IF q->>'question_type' = 'multiple_choice' THEN
            FOR opt IN SELECT * FROM jsonb_array_elements(q->'options') LOOP
                INSERT INTO public.assessment_options (
                    question_id, option_text, is_correct, position
                ) VALUES (
                    question_id,
                    opt->>'option_text',
                    (opt->>'is_correct')::boolean,
                    (opt->>'position')::int
                );
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;