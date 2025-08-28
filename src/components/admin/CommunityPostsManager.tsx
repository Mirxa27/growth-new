import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  Eye, 
  EyeOff,
  Flag,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  TrendingUp,
  Users,
  AlertTriangle,
  Plus
} from 'lucide-react';

interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  visibility: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  tags?: string[];
  images?: string[];
}

interface PostStats {
  totalPosts: number;
  pendingApproval: number;
  reportedPosts: number;
  activePosts: number;
}

export const CommunityPostsManager = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<PostStats>({
    totalPosts: 0,
    pendingApproval: 0,
    reportedPosts: 0,
    activePosts: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  useEffect(() => {
    loadPosts();
    loadStats();
  }, [filter]);

  const loadPosts = async () => {
    try {
      // For now, load mock data since table is newly created
      const mockPosts: CommunityPost[] = [
        {
          id: '1',
          user_id: 'mock-user',
          content: 'Welcome to the Newomen community! Share your journey of self-discovery.',
          post_type: 'announcement',
          visibility: 'public',
          likes_count: 15,
          comments_count: 8,
          is_pinned: true,
          is_approved: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_profile: {
            display_name: 'Newomen Team',
            avatar_url: undefined
          },
          tags: ['welcome', 'community']
        }
      ];
      
      setPosts(mockPosts);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error loading posts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats for now
      setStats({
        totalPosts: 1,
        pendingApproval: 0,
        reportedPosts: 0,
        activePosts: 1
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const updatePostStatus = async (postId: string, updates: Partial<CommunityPost>) => {
    try {
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      ));

      toast({
        title: "Post updated",
        description: "Post status has been updated successfully.",
      });

      loadStats();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const bulkUpdatePosts = async (action: string) => {
    if (selectedPosts.length === 0) return;

    try {
      let updates: Partial<CommunityPost> = {};
      
      switch (action) {
        case 'approve':
          updates = { is_approved: true };
          break;
        case 'reject':
          updates = { is_approved: false, visibility: 'hidden' };
          break;
        case 'pin':
          updates = { is_pinned: true };
          break;
        case 'unpin':
          updates = { is_pinned: false };
          break;
        case 'hide':
          updates = { visibility: 'hidden' };
          break;
      }

      // Mock bulk update for now
      setPosts(prev => prev.map(post => 
        selectedPosts.includes(post.id) ? { ...post, ...updates } : post
      ));

      toast({
        title: `${selectedPosts.length} posts updated`,
        description: `Bulk ${action} completed successfully.`,
      });

      setSelectedPosts([]);
      loadPosts();
      loadStats();
    } catch (error: any) {
      toast({
        title: "Bulk update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createAnnouncementPost = async (content: string, pinned: boolean = false) => {
    try {
      const newPost: CommunityPost = {
        id: Date.now().toString(),
        user_id: 'admin',
        content,
        post_type: 'announcement',
        visibility: 'public',
        likes_count: 0,
        comments_count: 0,
        is_pinned: pinned,
        is_approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_profile: {
          display_name: 'Admin',
          avatar_url: undefined
        },
        tags: ['announcement']
      };

      setPosts(prev => [newPost, ...prev]);

      toast({
        title: "Announcement posted",
        description: "Community announcement has been published.",
      });

      loadPosts();
    } catch (error: any) {
      toast({
        title: "Post failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'insight': return '💡';
      case 'question': return '❓';
      case 'celebration': return '🎉';
      case 'support': return '🤗';
      default: return '💬';
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'insight': return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
      case 'question': return 'bg-orange-500/10 text-orange-700 dark:text-orange-300';
      case 'celebration': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'support': return 'bg-pink-500/10 text-pink-700 dark:text-pink-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Community Posts</h2>
          <p className="text-muted-foreground">Manage and moderate community content</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            const content = prompt('Enter announcement content:');
            if (content) createAnnouncementPost(content, true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalPosts}</p>
            <p className="text-xs text-muted-foreground">Total Posts</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Eye className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-500">{stats.pendingApproval}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Flag className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">{stats.reportedPosts}</p>
            <p className="text-xs text-muted-foreground">Reported</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.activePosts}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card border-glass">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts..."
                    className="pl-10 glass border-glass"
                  />
                </div>
                <Button onClick={loadPosts} variant="outline" className="glass">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background glass border-glass"
              >
                <option value="all">All Posts</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="reported">Reported</option>
                <option value="pinned">Pinned</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedPosts.length > 0 && (
            <div className="mt-4 p-3 glass-surface rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedPosts.length} posts selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => bulkUpdatePosts('approve')} variant="outline" className="glass">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" onClick={() => bulkUpdatePosts('reject')} variant="outline" className="glass">
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => bulkUpdatePosts('pin')} variant="outline" className="glass">
                    Pin
                  </Button>
                  <Button size="sm" onClick={() => bulkUpdatePosts('hide')} variant="outline" className="glass text-destructive">
                    <EyeOff className="w-4 h-4 mr-1" />
                    Hide
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id} className="glass-card border-glass">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPosts(prev => [...prev, post.id]);
                      } else {
                        setSelectedPosts(prev => prev.filter(id => id !== post.id));
                      }
                    }}
                    className="mt-1"
                  />
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.user_profile?.avatar_url} />
                    <AvatarFallback className="bg-primary text-white">
                      {post.user_profile?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {post.user_profile?.display_name || 'Unknown User'}
                        </span>
                        <Badge className={getPostTypeColor(post.post_type)}>
                          {getPostTypeIcon(post.post_type)} {post.post_type}
                        </Badge>
                        {post.is_pinned && (
                          <Badge variant="outline" className="text-yellow-600">
                            📌 Pinned
                          </Badge>
                        )}
                        {!post.is_approved && (
                          <Badge variant="destructive">Pending</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
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

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {post.likes_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {post.comments_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.visibility}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!post.is_approved && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updatePostStatus(post.id, { is_approved: true })}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updatePostStatus(post.id, { is_approved: false, visibility: 'hidden' })}
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          onClick={() => updatePostStatus(post.id, { is_pinned: !post.is_pinned })}
                          variant="outline"
                          className="glass"
                        >
                          {post.is_pinned ? 'Unpin' : 'Pin'}
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => updatePostStatus(post.id, { visibility: post.visibility === 'hidden' ? 'public' : 'hidden' })}
                          variant="outline"
                          className="glass"
                        >
                          {post.visibility === 'hidden' ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="glass-card border-glass">
            <CardContent className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' ? 'No community posts yet' : `No ${filter} posts found`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};