import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Sparkles, 
  Activity, 
  TrendingUp, 
  Star, 
  Brain,
  Timer,
  Award
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  completedExplorations: number;
  totalCrystalsEarned: number;
  popularExplorations: Array<{
    id: string;
    title: string;
    completions: number;
    avgRating: number;
  }>;
  userGrowthData: Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
  }>;
  explorationStats: Array<{
    category: string;
    count: number;
    avgCompletion: number;
  }>;
}

export const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch user statistics
      const { data: userStats, error: userError } = await supabase
        .from('profiles')
        .select('created_at, last_login_at');

      if (userError) throw userError;

      // Fetch exploration statistics
      const { data: explorationStats, error: explorationError } = await supabase
        .from('exploration_sessions')
        .select(`
          status,
          created_at,
          explorations (
            id,
            title,
            category
          )
        `);

      if (explorationError) throw explorationError;

      // Process the data
      const totalUsers = userStats?.length || 0;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const activeUsers = userStats?.filter(user => 
        user.last_login_at && new Date(user.last_login_at) > thirtyDaysAgo
      ).length || 0;

      const completedExplorations = explorationStats?.filter(session => 
        session.status === 'completed'
      ).length || 0;

      // Calculate popular explorations
      const explorationCounts = explorationStats?.reduce((acc, session) => {
        if (session.status === 'completed' && session.explorations) {
          const exploration = session.explorations as any;
          const key = exploration.id;
          if (!acc[key]) {
            acc[key] = {
              id: exploration.id,
              title: exploration.title,
              completions: 0,
              avgRating: 4.5 // Mock rating for now
            };
          }
          acc[key].completions++;
        }
        return acc;
      }, {} as Record<string, any>) || {};

      const popularExplorations = Object.values(explorationCounts)
        .sort((a: any, b: any) => b.completions - a.completions)
        .slice(0, 5);

      // Calculate category statistics
      const categoryStats = explorationStats?.reduce((acc, session) => {
        if (session.explorations) {
          const exploration = session.explorations as any;
          const category = exploration.category || 'other';
          if (!acc[category]) {
            acc[category] = {
              category,
              count: 0,
              completed: 0
            };
          }
          acc[category].count++;
          if (session.status === 'completed') {
            acc[category].completed++;
          }
        }
        return acc;
      }, {} as Record<string, any>) || {};

      const explorationStatsByCategory = Object.values(categoryStats).map((stat: any) => ({
        category: stat.category,
        count: stat.count,
        avgCompletion: stat.count > 0 ? (stat.completed / stat.count) * 100 : 0
      }));

      // Generate user growth data (mock for now)
      const userGrowthData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        return {
          date: date.toISOString().split('T')[0],
          newUsers: Math.floor(Math.random() * 10) + 5,
          activeUsers: Math.floor(Math.random() * 50) + 20
        };
      });

      setAnalytics({
        totalUsers,
        activeUsers,
        completedExplorations,
        totalCrystalsEarned: completedExplorations * 150, // Mock calculation
        popularExplorations: popularExplorations as any,
        userGrowthData,
        explorationStats: explorationStatsByCategory
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Platform Analytics</h2>
        <p className="text-muted-foreground">
          Monitor user engagement and platform performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Journeys</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedExplorations}</div>
            <p className="text-xs text-muted-foreground">
              +18% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crystals Earned</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCrystalsEarned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total rewards distributed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Explorations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Popular Explorations
            </CardTitle>
            <CardDescription>
              Most completed journeys this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.popularExplorations.map((exploration, index) => (
                <div key={exploration.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{exploration.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {exploration.completions} completions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    <span className="text-xs">{exploration.avgRating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card className="glass-card border-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Category Performance
            </CardTitle>
            <CardDescription>
              Completion rates by exploration category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.explorationStats.map((stat) => (
                <div key={stat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {stat.category.replace('-', ' ')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(stat.avgCompletion)}%
                    </span>
                  </div>
                  <Progress value={stat.avgCompletion} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stat.count} total sessions
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card className="glass-card border-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            User Growth Trend
          </CardTitle>
          <CardDescription>
            New user registrations over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.userGrowthData.map((day) => (
              <div key={day.date} className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                <div>
                  <p className="font-medium text-sm">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-primary" />
                    <span>{day.newUsers} new</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-secondary" />
                    <span>{day.activeUsers} active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};