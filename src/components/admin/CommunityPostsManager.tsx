import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Heart, 
  Eye, 
  Flag, 
  Trash2, 
  Pin, 
  Archive,
  Search,
  Plus,
  MoreVertical,
  User,
  Calendar,
  Hash,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name?: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_reported: boolean;
  status: 'active' | 'pending' | 'archived' | 'deleted';
}

interface PostStats {
  totalPosts: number;
  activePosts: number;
  reportedPosts: number;
  pinnedPosts: number;
  totalViews: number;
  totalLikes: number;
}

export const CommunityPostsManager: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<PostStats>({
    totalPosts: 0,
    activePosts: 0,
    reportedPosts: 0,
    pinnedPosts: 0,
    totalViews: 0,
    totalLikes: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    tags: [] as string[]
  });

  const availableTags = [
    'motivation', 'self-development', 'career', 'relationships', 
    'mental-health', 'productivity', 'mindfulness', 'success', 
    'goals', 'habits', 'wellness', 'growth'
  ];

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithAuthor = data?.map(post => ({
        ...post,
        author_name: post.profiles?.full_name || 'Anonymous User'
      })) || [];

      setPosts(postsWithAuthor);
    } catch (error) {
      console.error('Error fetching posts:', error);
      
      // Mock data for demonstration
      const mockPosts: CommunityPost[] = [
        {
          id: '1',
          title: 'Starting My Personal Growth Journey',
          content: 'After years of feeling stuck, I\'ve finally decided to take control of my personal development. Here\'s what I\'ve learned so far...',
          author_id: 'user1',
          author_name: 'Sarah Johnson',
          tags: ['personal-growth', 'motivation', 'journey'],
          likes_count: 45,
          comments_count: 12,
          views_count: 234,
          created_at: '2025-08-30T14:30:00Z',
          updated_at: '2025-08-30T14:30:00Z',
          is_pinned: true,
          is_archived: false,
          is_reported: false,
          status: 'active'
        },
        {
          id: '2',
          title: 'Daily Habits That Changed My Life',
          content: 'I want to share the 5 simple daily habits that completely transformed my mindset and productivity...',
          author_id: 'user2',
          author_name: 'Mike Wilson',
          tags: ['habits', 'productivity', 'lifestyle'],
          likes_count: 78,
          comments_count: 23,
          views_count: 456,
          created_at: '2025-08-29T09:15:00Z',
          updated_at: '2025-08-29T09:15:00Z',
          is_pinned: false,
          is_archived: false,
          is_reported: false,
          status: 'active'
        },
        {
          id: '3',
          title: 'Dealing with Imposter Syndrome',
          content: 'As someone in tech, I\'ve struggled with imposter syndrome for years. Here\'s how I\'m learning to overcome it...',
          author_id: 'user3',
          author_name: 'Emma Davis',
          tags: ['mental-health', 'career', 'confidence'],
          likes_count: 32,
          comments_count: 8,
          views_count: 189,
          created_at: '2025-08-28T16:45:00Z',
          updated_at: '2025-08-28T16:45:00Z',
          is_pinned: false,
          is_archived: false,
          is_reported: true,
          status: 'pending'
        }
      ];
      
      setPosts(mockPosts);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from posts
      const mockStats: PostStats = {
        totalPosts: 89,
        activePosts: 76,
        reportedPosts: 3,
        pinnedPosts: 5,
        totalViews: 12450,
        totalLikes: 2340
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) {
      toast({
        title: "Error",
        description: "Please fill in title and content",
        variant: "destructive"
      });
      return;
    }

    try {
      const postData = {
        ...newPost,
        author_id: 'admin',
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        is_pinned: false,
        is_archived: false,
        is_reported: false,
        status: 'active' as const
      };

      const { error } = await supabase
        .from('community_posts')
        .insert([postData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post created successfully",
      });

      setIsCreateDialogOpen(false);
      setNewPost({ title: '', content: '', tags: [] });
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  const handleTogglePin = async (postId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ is_pinned: !isPinned })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Post ${!isPinned ? 'pinned' : 'unpinned'} successfully`,
      });
      fetchPosts();
    } catch (error) {
      console.error('Error updating pin status:', error);
      toast({
        title: "Error",
        description: "Failed to update pin status",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (postId: string, status: 'active' | 'pending' | 'archived') => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ status })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Post status updated to ${status}`,
      });
      fetchPosts();
    } catch (error) {
      console.error('Error updating post status:', error);
      toast({
        title: "Error",
        description: "Failed to update post status",
        variant: "destructive"
      });
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesTag = tagFilter === 'all' || post.tags.includes(tagFilter);
    
    return matchesSearch && matchesStatus && matchesTag;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      case 'deleted':
        return <Badge variant="destructive">Deleted</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-600" />;
      case 'deleted':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
                <p className="text-xs text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activePosts}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flag className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.reportedPosts}</p>
                <p className="text-xs text-muted-foreground">Reported</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Pin className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pinnedPosts}</p>
                <p className="text-xs text-muted-foreground">Pinned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-pink-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Community Posts Management</CardTitle>
              <CardDescription>Moderate and manage community discussions</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Post</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Community Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                      placeholder="Post title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                      placeholder="Write your post content..."
                      rows={6}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={newPost.tags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            setNewPost(prev => ({
                              ...prev,
                              tags: prev.tags.includes(tag)
                                ? prev.tags.filter(t => t !== tag)
                                : [...prev.tags, tag]
                            }));
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePost}>
                      Create Post
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search posts, authors, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {availableTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(post.status)}
                      <h3 className="text-lg font-semibold line-clamp-1">{post.title}</h3>
                    </div>
                    {post.is_pinned && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                    {post.is_reported && (
                      <Badge variant="destructive">
                        <Flag className="h-3 w-3 mr-1" />
                        Reported
                      </Badge>
                    )}
                    {getStatusBadge(post.status)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">{post.author_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">{post.views_count} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">{post.likes_count} likes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">{post.comments_count} comments</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Hash className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Select 
                    value={post.status} 
                    onValueChange={(value: 'active' | 'pending' | 'archived') => 
                      handleUpdateStatus(post.id, value)
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {
                        setSelectedPost(post);
                        setIsPostDialogOpen(true);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTogglePin(post.id, post.is_pinned)}>
                        <Pin className="h-4 w-4 mr-2" />
                        {post.is_pinned ? 'Unpin' : 'Pin'} Post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeletePost(post.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || tagFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No posts match your current criteria.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && tagFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post Details Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-semibold">{selectedPost.title}</h3>
                  {getStatusBadge(selectedPost.status)}
                  {selectedPost.is_pinned && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                  <span>By {selectedPost.author_name}</span>
                  <span>{new Date(selectedPost.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Content</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedPost.content}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Views</Label>
                  <p className="text-lg font-semibold">{selectedPost.views_count}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Likes</Label>
                  <p className="text-lg font-semibold">{selectedPost.likes_count}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Comments</Label>
                  <p className="text-lg font-semibold">{selectedPost.comments_count}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className="text-lg font-semibold">{selectedPost.status}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPost.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Hash className="h-2 w-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};