-- Add foreign key relationship between community_posts and profiles
ALTER TABLE public.community_posts
ADD CONSTRAINT fk_community_posts_user
FOREIGN KEY (user_id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Create a view that joins community posts with profiles
CREATE OR REPLACE VIEW public.community_posts_with_profiles AS
SELECT 
  cp.*,
  p.display_name,
  p.avatar_url
FROM public.community_posts cp
LEFT JOIN public.profiles p ON cp.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON public.community_posts_with_profiles TO authenticated;
GRANT SELECT ON public.community_posts_with_profiles TO anon;

-- Update RLS policy for the view
CREATE POLICY "Anyone can view approved public posts with profiles"
ON public.community_posts_with_profiles
FOR SELECT
USING (is_approved = true AND visibility = 'public');

COMMENT ON VIEW public.community_posts_with_profiles IS 'View that joins community posts with profile information for display';
