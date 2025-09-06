-- Drop the existing view if it exists to avoid conflicts
DROP VIEW IF EXISTS public.community_posts_with_profiles;

-- Create a new, corrected view for community posts with profiles
CREATE OR REPLACE VIEW public.community_posts_with_profiles AS
SELECT
    p.id,
    p.user_id,
    p.content,
    p.post_type,
    p.likes_count,
    p.comments_count,
    p.created_at,
    p.tags,
    p.is_approved,
    p.visibility,
    u.display_name,
    u.avatar_url
FROM
    public.community_posts p
LEFT JOIN
    public.profiles u ON p.user_id = u.id;

-- Grant permissions to the necessary roles
GRANT SELECT ON public.community_posts_with_profiles TO authenticated, service_role;

-- Re-create the foreign key relationship with a clear name
-- This ensures Supabase can correctly identify the relationship
ALTER TABLE public.community_posts
ADD CONSTRAINT fk_community_posts_profiles
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;
