import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Archive,
  Search,
  ThumbsUp,
  Eye
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Database } from '@/integrations/supabase/types';

type CommunityPost = Database['public']['Tables']['community_posts']['Row'] & {
  profiles: { display_name: string | null } | null;
};

export const CommunityPostsManager: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_posts')
        .select(`*, profiles (display_name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data as any) || []);
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to fetch posts: ${error.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleUpdateStatus = async (postId: string, status: 'active' | 'pending' | 'removed' | 'archived') => {
    try {
      const { error } = await supabase.rpc('update_post_status_secure', {
        p_post_id: postId,
        p_new_status: status,
      });

      if (error) throw error;
      toast({ title: "Success", description: `Post status updated to ${status}` });
      fetchPosts();
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to update post status: ${error.message}`, variant: "destructive" });
    }
  };

  const filteredPosts = useMemo(() => posts.filter(post => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = post.title?.toLowerCase().includes(searchLower) ||
                         post.content.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [posts, searchTerm, statusFilter]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'removed': return <Badge variant="destructive">Removed</Badge>;
      case 'archived': return <Badge variant="secondary">Archived</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader><CardTitle>Community Posts</CardTitle><CardDescription>Moderate and manage all community-generated posts.</CardDescription></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" /><Input placeholder="Search by title or content..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 glass-input" /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-md px-2 bg-background glass border-glass"><option value="all">All Status</option><option value="active">Active</option><option value="pending">Pending</option><option value="removed">Removed</option><option value="archived">Archived</option></select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredPosts.map(post => (
          <Card key={post.id} className="glass-strong">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{post.title || 'Untitled Post'}</h3>
                  <p className="text-sm text-muted-foreground">by {post.profiles?.display_name || 'Anonymous'} on {new Date(post.created_at).toLocaleDateString()}</p>
                  <p className="text-sm mt-2 line-clamp-2">{post.content}</p>
                </div>
                <div className="flex items-center gap-4 mt-2 md:mt-0">
                  <div className="text-sm flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> {post.likes_count}</div>
                  <div className="text-sm flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {post.comments_count}</div>
                  <div className="text-sm flex items-center gap-1"><Eye className="w-4 h-4" /> {post.views_count}</div>
                  {getStatusBadge(post.status)}
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => handleUpdateStatus(post.id, 'active')}><CheckCircle className="w-4 h-4 mr-2" />Approve</DropdownMenuItem><DropdownMenuItem onClick={() => handleUpdateStatus(post.id, 'removed')}><XCircle className="w-4 h-4 mr-2" />Remove</DropdownMenuItem><DropdownMenuItem onClick={() => handleUpdateStatus(post.id, 'archived')}><Archive className="w-4 h-4 mr-2" />Archive</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};