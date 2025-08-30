-- Function to increment likes count for community posts
CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if user has already liked this post (you might want to add a likes table later)
  -- For now, just increment the count
  UPDATE public.community_posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$function$;