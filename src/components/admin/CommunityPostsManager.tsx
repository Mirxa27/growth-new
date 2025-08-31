import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ThumbsUp, 
  MessageSquare, 
  Eye, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Archive,
  Flag
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  is_reported: boolean;
  status: 'active' | 'pending' | 'removed';
  tags: string[];
}

export const CommunityPostsManager: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_posts' as any)
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithAuthor = data?.map((post: any) => ({
        ...post,
        author_name: (post.profiles as any)?.full_name || 'Anonymous User'
      })) || [];

      setPosts(postsWithAuthor as any);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch community posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (postId: string, status: 'active' | 'pending' | 'removed') => {
    try {
      const { error } = await supabase
        .from('community_posts' as any)
        .update({ status })
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.map(p => p.id === postId ? { ...p, status } : p));
      toast({
        title: "Success",
        description: `Post status updated to ${status}`,
      });
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
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'removed':
        return <Badge variant="destructive">Removed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading posts...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Community Posts</CardTitle>
          <CardDescription>Moderate and manage all community-generated posts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-2"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="removed">Removed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredPosts.map(post => (
          <Card key={post.id}>
            <CardContent className="p-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    by {post.author_name} on {new Date(post.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm mt-2 line-clamp-2">{post.content}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> {post.likes_count}</div>
                  <div className="text-sm flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {post.comments_count}</div>
                  <div className="text-sm flex items-center gap-1"><Eye className="w-4 h-4" /> {post.views_count}</div>
                  {getStatusBadge(post.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(post.id, 'active')}><CheckCircle className="w-4 h-4 mr-2" />Approve</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(post.id, 'removed')}><XCircle className="w-4 h-4 mr-2" />Remove</DropdownMenuItem>
                      <DropdownMenuItem><Archive className="w-4 h-4 mr-2" />Archive</DropdownMenuItem>
                      <DropdownMenuItem><Flag className="w-4 h-4 mr-2" />View Reports</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};