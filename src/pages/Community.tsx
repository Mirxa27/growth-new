import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Share2, 
  Search,
  Plus,
  Sparkles,
  Globe,
  Lock,
  TrendingUp
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  tags: string[];
  isLiked: boolean;
}

const Community = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [newPost, setNewPost] = useState('');
  const [activeTab, setActiveTab] = useState('feed');

  const [posts] = useState<Post[]>([
    {
      id: '1',
      author: { name: 'Sarah M.', verified: true },
      content: 'Just completed my first month of daily meditation practice! The changes in my stress levels have been incredible. Anyone else on a mindfulness journey?',
      timestamp: '2 hours ago',
      likes: 24,
      comments: 8,
      tags: ['mindfulness', 'meditation', 'wellness'],
      isLiked: false
    },
    {
      id: '2',
      author: { name: 'Maya K.', verified: false },
      content: 'Sharing a breakthrough moment: I finally had the courage to set boundaries with a toxic relationship. It feels scary but liberating. 💪',
      timestamp: '4 hours ago',
      likes: 45,
      comments: 12,
      tags: ['boundaries', 'relationships', 'growth'],
      isLiked: true
    },
    {
      id: '3',
      author: { name: 'Amira H.', verified: true },
      content: 'Starting a new creative project today - a vision board for my 2024 goals. What tools do you use for manifestation and goal setting?',
      timestamp: '1 day ago',
      likes: 18,
      comments: 6,
      tags: ['creativity', 'goals', 'manifestation'],
      isLiked: false
    }
  ]);

  const handleCreatePost = () => {
    if (!newPost.trim()) return;
    
    toast({
      title: "Post created!",
      description: "Your post has been shared with the community.",
    });
    setNewPost('');
  };

  const handleLike = (postId: string) => {
    toast({
      title: "Post liked!",
      description: "Your support has been shared with the author.",
    });
  };

  const trendingTopics = [
    { name: 'Self-Care Sunday', posts: 234 },
    { name: 'Career Growth', posts: 189 },
    { name: 'Mindfulness', posts: 156 },
    { name: 'Relationships', posts: 143 },
    { name: 'Creative Expression', posts: 98 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Community</h1>
              <p className="text-muted-foreground">Connect, share, and grow together</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, topics, or people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="feed">Feed</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-6">
                {/* Create Post */}
                <Card className="glass border-card-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Share Your Journey
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="What's on your mind? Share your thoughts, experiences, or questions..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="glass min-h-[100px]"
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="glass">
                          <Globe className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      </div>
                      <Button 
                        onClick={handleCreatePost}
                        disabled={!newPost.trim()}
                        className="bg-gradient-primary"
                      >
                        Share Post
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Posts Feed */}
                {posts.map((post) => (
                  <Card key={post.id} className="glass border-card-border">
                    <CardContent className="p-6">
                      {/* Post Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-white">
                            {post.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{post.author.name}</span>
                            {post.author.verified && (
                              <Sparkles className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">{post.timestamp}</span>
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="mb-4 leading-relaxed">{post.content}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="glass">
                            #{tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center gap-6 pt-4 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={post.isLiked ? 'text-red-500' : ''}
                        >
                          <Heart className={`w-4 h-4 mr-2 ${post.isLiked ? 'fill-current' : ''}`} />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          {post.comments}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="trending" className="space-y-6">
                <Card className="glass border-card-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Trending Topics
                    </CardTitle>
                    <CardDescription>
                      Popular discussions in the community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trendingTopics.map((topic, index) => (
                        <div key={topic.name} className="flex items-center justify-between p-3 glass rounded-lg hover:bg-primary/5 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-semibold">#{topic.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {topic.posts} posts
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Join Discussion
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="groups" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="glass border-card-border">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                          <Heart className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Self-Care Circle</h3>
                          <p className="text-sm text-muted-foreground">1,234 members</p>
                        </div>
                      </div>
                      <p className="text-sm mb-4">
                        A supportive space for sharing self-care practices and wellness tips.
                      </p>
                      <Button className="w-full bg-gradient-primary">Join Group</Button>
                    </CardContent>
                  </Card>

                  <Card className="glass border-card-border">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Career Growth Hub</h3>
                          <p className="text-sm text-muted-foreground">856 members</p>
                        </div>
                      </div>
                      <p className="text-sm mb-4">
                        Professional development, networking, and career advancement discussions.
                      </p>
                      <Button className="w-full bg-gradient-primary">Join Group</Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Stats */}
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="text-lg">Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">12.5K</div>
                  <div className="text-sm text-muted-foreground">Active Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">3.2K</div>
                  <div className="text-sm text-muted-foreground">Posts This Week</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">89%</div>
                  <div className="text-sm text-muted-foreground">Positive Interactions</div>
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="text-lg">Community Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-primary mt-0.5" />
                  <span>Be kind and supportive to all members</span>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-secondary mt-0.5" />
                  <span>Respect privacy and confidentiality</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-accent mt-0.5" />
                  <span>Share authentic experiences and insights</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;