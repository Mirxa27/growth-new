import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useEnhancedToast } from '@/hooks/useEnhancedToast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  Send,
  Users,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TablesInsert } from '@/integrations/supabase/types';

interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  tags?: string[];
}

export const CommunityPosts = () => {
  const { error: showError, success: showSuccess } = useEnhancedToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedType, setSelectedType] = useState('general');
  const [loading, setLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simplified approach: Query community_posts directly first
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('is_approved', true)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // If we have posts, get the user profiles separately
      let profilesData: { id: string; display_name: string | null; avatar_url?: string | null }[] = [];
      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map(post => post.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);
        
        if (!profilesError && profiles) {
          profilesData = profiles;
        }
      }

      // Transform and combine the data
      const transformedPosts: CommunityPost[] = (postsData || []).map((post) => {
        const userProfile = profilesData.find(profile => profile.id === post.user_id);
        return {
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          post_type: post.post_type,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          created_at: post.created_at,
          tags: post.tags || [],
          user_profile: {
            display_name: userProfile?.display_name || 'Anonymous User'
          }
        };
      });

      setPosts(transformedPosts);
    } catch (error: unknown) {
      console.error('Detailed error loading posts:', error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      showError(
        "Unable to load posts",
        `Connection to the community failed. Details: ${message}`
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const createPost = async () => {
    if (!newPost.trim() || !user) return;

    setLoading(true);
    try {
      const postToInsert: TablesInsert<'community_posts'> = {
        user_id: user.id,
        content: newPost.trim(),
        post_type: selectedType,
        tags: []
      };

      const { data: newPostData, error } = await supabase
        .from('community_posts')
        .insert([postToInsert])
        .select(`
          id,
          user_id,
          content,
          post_type,
          likes_count,
          comments_count,
          tags,
          created_at,
          profiles (display_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      if (!newPostData) throw new Error("Failed to retrieve new post data.");

      const transformedPost: CommunityPost = {
        id: newPostData.id,
        user_id: newPostData.user_id,
        content: newPostData.content,
        post_type: newPostData.post_type,
        likes_count: newPostData.likes_count,
        comments_count: newPostData.comments_count,
        created_at: newPostData.created_at,
        tags: newPostData.tags || [],
        user_profile: {
          display_name: (newPostData as { profiles?: { display_name?: string; avatar_url?: string } }).profiles?.display_name || user.user_metadata.display_name || 'Anonymous',
          avatar_url: (newPostData as { profiles?: { display_name?: string; avatar_url?: string } }).profiles?.avatar_url
        }
      };

      setPosts(prev => [transformedPost, ...prev]);
      setNewPost('');
      
      showSuccess(
        "Post shared! ✨",
        "Your post has been shared with the community."
      );

    } catch (error: unknown) {
      console.error('Error creating post:', error);
      showError(
        "Share failed",
        "Failed to share your post. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId: string) => {
    try {
      // Get current post data
      const { data: post, error: fetchError } = await supabase
        .from('community_posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      // Update likes count
      const { error } = await supabase
        .from('community_posts')
        .update({ 
          likes_count: (post.likes_count || 0) + 1
        })
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes_count: post.likes_count + 1 }
          : post
      ));

      showSuccess(
        "💝 Liked!",
        "Your support has been shared."
      );
    } catch (error: unknown) {
      console.error('Error liking post:', error);
      showError(
        "Like failed",
        "Failed to like the post. Please try again."
      );
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'insight': return '💡';
      case 'question': return '❓';
      case 'celebration': return '🎉';
      case 'support': return '🤗';
      default: return '💬';
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'insight': return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
      case 'question': return 'bg-orange-500/10 text-orange-700 dark:text-orange-300';
      case 'celebration': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'support': return 'bg-pink-500/10 text-pink-700 dark:text-pink-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Create Post */}
      <Card className="glass-card border-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Share with the Community
          </CardTitle>
          <CardDescription>
            Share your insights, ask questions, or celebrate your progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Post Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background glass border-glass"
            >
              <option value="general">💬 General</option>
              <option value="insight">💡 Insight</option>
              <option value="question">❓ Question</option>
              <option value="celebration">🎉 Celebration</option>
              <option value="support">🤗 Support</option>
            </select>
          </div>

          <Textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What would you like to share with the community?"
            rows={4}
            className="glass border-glass"
          />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {newPost.length}/500 characters
            </div>
            <Button 
              onClick={createPost} 
              disabled={!newPost.trim() || loading}
              className="bg-gradient-primary"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Sharing...' : 'Share Post'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Community Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">2.1k</p>
            <p className="text-xs text-muted-foreground">Active Members</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-secondary">{posts.length}</p>
            <p className="text-xs text-muted-foreground">Total Posts</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-accent">{posts.filter(p => p.likes_count > 0).length}</p>
            <p className="text-xs text-muted-foreground">Liked Posts</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="glass-card border-glass">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                  {post.user_profile?.display_name?.charAt(0) || 'U'}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {post.user_profile?.display_name || 'Unknown User'}
                      </span>
                      <Badge className={getPostTypeColor(post.post_type)}>
                        {getPostTypeIcon(post.post_type)} {post.post_type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(post.created_at)}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed">{post.content}</p>

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <button 
                      onClick={() => likePost(post.id)}
                      className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      {post.likes_count} likes
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      {post.comments_count} comments
                    </button>
                    <button className="flex items-center gap-1 hover:text-secondary transition-colors">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Community Guidelines */}
      <Card className="glass-card border-glass">
        <CardHeader>
          <CardTitle className="text-lg">💝 Community Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Be Authentic:</strong> Share your genuine experiences and feelings</p>
          <p><strong>Practice Kindness:</strong> Offer support and encouragement to others</p>
          <p><strong>Respect Privacy:</strong> Only share what you're comfortable with</p>
          <p><strong>Stay Supportive:</strong> Focus on growth and positive transformation</p>
          <p><strong>Embrace Vulnerability:</strong> This is a safe space for open sharing</p>
        </CardContent>
      </Card>
    </div>
  );
};
