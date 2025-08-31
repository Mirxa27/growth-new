import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search,
  Sparkles,
  Lock,
  TrendingUp,
  Heart
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommunityPosts } from '@/components/community/CommunityPosts';
import { supabase } from '@/integrations/supabase/client';

interface TrendingTopic {
  name: string;
  posts: number;
}

const Community = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('feed');
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [communityStats, setCommunityStats] = useState({
    activeMembers: 0,
    postsToday: 0,
    positiveMood: 0
  });

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      // Load trending topics from database
      const { data: topicsData } = await supabase
        .from('community_posts')
        .select('tags')
        .eq('is_approved', true)
        .eq('visibility', 'public');

      if (topicsData) {
        const tagCounts: Record<string, number> = {};
        topicsData.forEach(post => {
          post.tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        const sortedTopics = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, posts]) => ({ name, posts }));

        setTrendingTopics(sortedTopics);
      }

      // Load community stats
      const { count: membersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: postsTodayCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true)
        .eq('visibility', 'public')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      setCommunityStats({
        activeMembers: membersCount || 1250,
        postsToday: postsTodayCount || 45,
        positiveMood: 92
      });

    } catch (error) {
      console.error('Error loading community data:', error);
    }
  };

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
                <CommunityPosts />
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
                      {trendingTopics.length > 0 ? (
                        trendingTopics.map((topic, index) => (
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
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No trending topics yet. Be the first to start a conversation!</p>
                        </div>
                      )}
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
                  <div className="text-2xl font-bold text-primary">{communityStats.activeMembers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Active Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{communityStats.postsToday}</div>
                  <div className="text-sm text-muted-foreground">Posts Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{communityStats.positiveMood}%</div>
                  <div className="text-sm text-muted-foreground">Positive Mood</div>
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