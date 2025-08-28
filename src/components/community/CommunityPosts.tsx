import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Plus, 
  Heart, 
  Share2, 
  Edit,
  Trash2,
  Users,
  TrendingUp,
  Eye,
  Send
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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
  const { toast } = useToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedType, setSelectedType] = useState('general');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      // Mock community posts for now
      const mockPosts: CommunityPost[] = [
        {
          id: '1',
          user_id: 'user1',
          content: 'Just completed my first exploration on self-compassion. The insights I gained were profound - especially about how I speak to myself in difficult moments. Anyone else working on this?',
          post_type: 'insight',
          likes_count: 12,
          comments_count: 5,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user_profile: {
            display_name: 'Sarah M.',
            avatar_url: undefined
          },
          tags: ['self-compassion', 'insight', 'growth']
        },
        {
          id: '2',
          user_id: 'user2',
          content: 'Has anyone tried the "Confronting the Shadow Self" exploration? I\'m feeling nervous about diving that deep but also curious about what I might discover.',
          post_type: 'question',
          likes_count: 8,
          comments_count: 12,
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          user_profile: {
            display_name: 'Maya L.',
            avatar_url: undefined
          },
          tags: ['shadow-work', 'question', 'support']
        },
        {
          id: '3',
          user_id: 'user3',
          content: '🎉 Celebrating a small but meaningful victory today! I spoke up in a meeting and shared an idea I would have normally kept to myself. The work I\'ve been doing here is really showing up in my daily life.',
          post_type: 'celebration',
          likes_count: 25,
          comments_count: 8,
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          user_profile: {
            display_name: 'Aisha K.',
            avatar_url: undefined
          },
          tags: ['celebration', 'confidence', 'breakthrough']
        }
      ];

      setPosts(mockPosts);
    } catch (error: any) {
      console.error('Error loading posts:', error);
    }
  };

  const createPost = async () => {
    if (!newPost.trim() || !user) return;

    setLoading(true);
    try {
      const post: CommunityPost = {
        id: Date.now().toString(),
        user_id: user.id,
        content: newPost,
        post_type: selectedType,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        user_profile: {
          display_name: 'You',
          avatar_url: undefined
        },
        tags: []
      };

      setPosts(prev => [post, ...prev]);
      setNewPost('');
      
      toast({
        title: "Post shared! ✨",
        description: "Your post has been shared with the community.",
      });

    } catch (error: any) {
      toast({
        title: "Share failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes_count: post.likes_count + 1 }
        : post
    ));

    toast({
      title: "💝 Liked!",
      description: "Your support has been shared.",
    });
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
            <p className="text-2xl font-bold text-secondary">45</p>
            <p className="text-xs text-muted-foreground">Posts Today</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-accent">92%</p>
            <p className="text-xs text-muted-foreground">Positive Mood</p>
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