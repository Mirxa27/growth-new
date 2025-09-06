-- Add avatar_url to profiles table
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT;

-- Add foreign key to community_posts table
ALTER TABLE public.community_posts
ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
