
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageCircle, 
  Compass, 
  BookOpen, 
  Trophy, 
  Sparkles, 
  TrendingUp,
  Heart,
  Zap,
  Star
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recentExplorations, setRecentExplorations] = useState<any[]>([]);
  const [crystalBalance, setCrystalBalance] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setUserProfile(profile);
      setCrystalBalance(profile?.crystal_balance || 0);

      // Fetch recent exploration sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('exploration_sessions')
        .select(`
          *,
          explorations (
            title,
            category,
            crystal_reward
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (sessionsError) throw sessionsError;
      setRecentExplorations(sessions || []);

      // Calculate weekly progress (mock for now)
      const completedThisWeek = sessions?.filter(session => 
        session.status === 'completed' && 
        new Date(session.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;
      
      setWeeklyProgress(Math.min(completedThisWeek * 25, 100));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'chat':
        navigate('/chat');
        break;
      case 'explore':
        navigate('/explorations');
        break;
      case 'library':
        navigate('/library');
        break;
      case 'assessment':
        navigate('/assessment');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-ambient flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-ambient pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {getGreeting()}, {userProfile?.full_name || 'Beautiful Soul'}! ✨
          </h1>
          <p className="text-muted-foreground">
            Ready to continue your journey of self-discovery?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Crystal Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{crystalBalance}</div>
              <p className="text-xs text-muted-foreground">Keep exploring to earn more!</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Weekly Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">{weeklyProgress}%</div>
              <Progress value={weeklyProgress} className="h-2" />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Explorations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{recentExplorations.length}</div>
              <p className="text-xs text-muted-foreground">Recent sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Jump into your favorite activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="glass"
                className="h-20 flex-col space-y-2 hover:scale-105 transition-transform"
                onClick={() => handleQuickAction('chat')}
              >
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm">Chat with NewMe</span>
              </Button>
              
              <Button
                variant="glass"
                className="h-20 flex-col space-y-2 hover:scale-105 transition-transform"
                onClick={() => handleQuickAction('explore')}
              >
                <Compass className="w-6 h-6" />
                <span className="text-sm">Start Exploration</span>
              </Button>
              
              <Button
                variant="glass"
                className="h-20 flex-col space-y-2 hover:scale-105 transition-transform"
                onClick={() => handleQuickAction('library')}
              >
                <BookOpen className="w-6 h-6" />
                <span className="text-sm">Wellness Library</span>
              </Button>
              
              <Button
                variant="glass"
                className="h-20 flex-col space-y-2 hover:scale-105 transition-transform"
                onClick={() => handleQuickAction('assessment')}
              >
                <Heart className="w-6 h-6" />
                <span className="text-sm">Take Assessment</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Explorations */}
        {recentExplorations.length > 0 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Recent Explorations
              </CardTitle>
              <CardDescription>Your journey continues...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentExplorations.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg glass border border-glass-border/30 hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      {session.explorations?.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {session.explorations?.category} • {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                      {session.status}
                    </Badge>
                    {session.status === 'completed' && (
                      <Badge variant="outline" className="text-primary border-primary">
                        +{session.explorations?.crystal_reward} ✨
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                className="w-full mt-4 glass"
                onClick={() => navigate('/explorations')}
              >
                View All Explorations
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
