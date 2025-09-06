import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  MessageCircle, 
  Compass, 
  BookOpen, 
  Users, 
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer, MobileGrid, MobileCard } from '@/components/responsive/MobileOptimized';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch user data
        const { error: profilesError } = await supabase
          .from('profiles')
          .select('created_at, last_login_at')
          .eq('user_id', user.id);
        if (profilesError) throw profilesError;

        // Simulate loading user data
        setTimeout(() => setIsLoading(false), 1000);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Background */}
        <div 
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: 'url(/hero-meditation.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Deep Purple Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-violet-900/90 to-indigo-900/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-purple-900/30 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        <div className="min-h-screen flex items-center justify-center relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Start Chat Session',
      description: 'Start a guided conversation',
      icon: MessageCircle,
      color: 'text-primary',
      action: () => navigate('/chat')
    },
    {
      title: 'Explore Growth',
      description: 'Discover new explorations',
      icon: Compass,
      color: 'text-secondary',
      action: () => navigate('/explorations')
    },
    {
      title: 'Join Community',
      description: 'Connect with other women',
      icon: Users,
      color: 'text-accent',
      action: () => navigate('/community')
    },
    {
      title: 'Browse Library',
      description: 'Access resources and content',
      icon: BookOpen,
      color: 'text-primary',
      action: () => navigate('/library')
    }
  ];

  const achievements = [
    { name: 'First Assessment', completed: true, points: 50 },
    { name: 'Week Streak', completed: true, points: 100 },
    { name: 'Community Member', completed: false, points: 75 },
    { name: 'Growth Explorer', completed: false, points: 150 }
  ];

  const completedAchievements = achievements.filter(a => a.completed).length;
  const totalPoints = achievements.filter(a => a.completed).reduce((sum, a) => sum + a.points, 0);

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Background */}
        <div 
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: 'url(/hero-meditation.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Deep Purple Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-violet-900/90 to-indigo-900/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-purple-900/30 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        {/* Subtle Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-white/20 animate-pulse opacity-40" />
          <div className="absolute top-[25%] right-[15%] w-1 h-1 rounded-full bg-purple-300/30 animate-pulse delay-1000 opacity-30" />
          <div className="absolute bottom-[35%] left-[20%] w-1.5 h-1.5 rounded-full bg-white/15 animate-pulse delay-2000 opacity-25" />
          <div className="absolute top-[60%] right-[10%] w-1 h-1 rounded-full bg-purple-300/25 animate-pulse delay-500 opacity-20" />
          <div className="absolute bottom-[20%] left-[30%] w-2 h-2 rounded-full bg-white/10 animate-pulse delay-3000 opacity-15" />
        </div>

        <MobileContainer className="py-8 relative z-10">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate('/')}
                className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/20"
              >
                <img src="/symbol.svg" alt="Newomen Logo" className="w-10 h-10" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Welcome back!</h1>
                <p className="text-white/70">
                  {user?.email || 'Ready to continue your growth journey?'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <MobileGrid cols={3} className="mb-8">
            <MobileCard className="text-center bg-white/10 backdrop-blur-md border border-white/20">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                <Trophy className="w-5 h-5 text-purple-300" />
              </div>
              <div className="text-2xl font-bold text-white">{totalPoints}</div>
              <div className="text-xs text-white/70">Crystals Earned</div>
            </MobileCard>

            <MobileCard className="text-center bg-white/10 backdrop-blur-md border border-white/20">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                <Target className="w-5 h-5 text-blue-300" />
              </div>
              <div className="text-2xl font-bold text-white">{completedAchievements}</div>
              <div className="text-xs text-white/70">Achievements</div>
            </MobileCard>

            <MobileCard className="text-center bg-white/10 backdrop-blur-md border border-white/20">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                <TrendingUp className="w-5 h-5 text-pink-300" />
              </div>
              <div className="text-2xl font-bold text-white">7</div>
              <div className="text-xs text-white/70">Day Streak</div>
            </MobileCard>
          </MobileGrid>

          {/* Quick Actions */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-purple-300" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-white/70">
                Continue your growth journey with these activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MobileGrid cols={2} gap="sm">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="bg-white/5 backdrop-blur-sm border border-white/20 text-white hover:bg-white/10 h-auto p-4 flex flex-col items-center gap-2"
                    onClick={action.action}
                  >
                    <action.icon className="w-6 h-6 text-purple-300" />
                    <div className="text-center">
                      <div className="font-medium text-sm text-white">{action.title}</div>
                      <div className="text-xs text-white/70">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </MobileGrid>
            </CardContent>
          </Card>

          {/* Progress Section */}
          <MobileGrid cols={1} className="mb-8">
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Brain className="w-5 h-5 text-purple-300" />
                  Your Progress
                </CardTitle>
                <CardDescription className="text-white/70">
                  Track your personal development journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2 text-white">
                    <span>Overall Progress</span>
                    <span>65%</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500 ease-out" style={{ width: '65%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2 text-white">
                    <span>Weekly Goal</span>
                    <span>4/7 days</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500 ease-out" style={{ width: '57%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </MobileGrid>

          {/* Achievements */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5 text-purple-300" />
                Achievements
              </CardTitle>
              <CardDescription className="text-white/70">
                Your milestones and accomplishments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      achievement.completed ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white/10 border border-white/20'
                    }`}>
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-white">{achievement.name}</div>
                      <div className="text-xs text-white/70">
                        {achievement.points} crystals
                      </div>
                    </div>
                    <Badge className={achievement.completed ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-white/20 text-white/70"}>
                      {achievement.completed ? 'Completed' : 'Locked'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-purple-300" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                  <MessageCircle className="w-5 h-5 text-purple-300" />
                  <div>
                    <div className="font-medium text-sm text-white">Completed chat session</div>
                    <div className="text-xs text-white/70">2 hours ago</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                  <Brain className="w-5 h-5 text-blue-300" />
                  <div>
                    <div className="font-medium text-sm text-white">Finished personality assessment</div>
                    <div className="text-xs text-white/70">1 day ago</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                  <Users className="w-5 h-5 text-pink-300" />
                  <div>
                    <div className="font-medium text-sm text-white">Joined community discussion</div>
                    <div className="text-xs text-white/70">3 days ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </MobileContainer>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;