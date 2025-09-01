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
  Sparkles,
  Heart,
  Star
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer, MobileGrid, MobileCard } from '@/components/responsive/MobileOptimized';
import { supabase } from '@/integrations/supabase/client';
import { assessmentService } from '@/services/assessment.service';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch user profile
        const { data: profileData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profilesError && profilesError.code !== 'PGRST116') throw profilesError;
        setProfile(profileData);

        // Fetch latest assessment result
        const { data: latestResult } = await assessmentService.getLatestAssessmentResult();
        setAssessmentResult(latestResult);

        // Fetch user statistics
        const { data: stats } = await assessmentService.getUserAssessmentStats();
        setUserStats(stats);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <MobileContainer className="py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate('/')}
                className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <img src="/symbol.svg" alt="Newomen Logo" className="w-10 h-10" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Welcome back!</h1>
                <p className="text-muted-foreground">
                  {user?.email || 'Ready to continue your growth journey?'}
                </p>
              </div>
            </div>
          </div>

          {/* Personalized Insights Based on Assessment */}
          {assessmentResult && (
            <Card className="glass-strong mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Your Personality Profile
                </CardTitle>
                <CardDescription>
                  Based on your latest assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {assessmentResult.personality_type || 'The Explorer'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Confidence: {assessmentResult.score || 85}%
                  </span>
                </div>
                {assessmentResult.insights && assessmentResult.insights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Key Insights:</h4>
                    <ul className="space-y-1">
                      {assessmentResult.insights.slice(0, 3).map((insight: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Heart className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => navigate('/profile')}
                >
                  View Full Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Overview */}
          <MobileGrid cols={3} className="mb-8">
            <MobileCard className="text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{totalPoints}</div>
              <div className="text-xs text-muted-foreground">Crystals Earned</div>
            </MobileCard>

            <MobileCard className="text-center">
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-2xl font-bold text-secondary">
                {userStats?.totalAssessments || completedAchievements}
              </div>
              <div className="text-xs text-muted-foreground">
                {userStats?.totalAssessments ? 'Assessments' : 'Achievements'}
              </div>
            </MobileCard>

            <MobileCard className="text-center">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div className="text-2xl font-bold text-accent">
                {profile?.streak_days || 7}
              </div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </MobileCard>
          </MobileGrid>

          {/* Quick Actions */}
          <Card className="glass-strong mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Continue your growth journey with these activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MobileGrid cols={2} gap="sm">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="glass-button h-auto p-4 flex flex-col items-center gap-2"
                    onClick={action.action}
                  >
                    <action.icon className={`w-6 h-6 ${action.color}`} />
                    <div className="text-center">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </MobileGrid>
            </CardContent>
          </Card>

          {/* Progress Section */}
          <MobileGrid cols={1} className="mb-8">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Your Progress
                </CardTitle>
                <CardDescription>
                  Track your personal development journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Weekly Goal</span>
                    <span>4/7 days</span>
                  </div>
                  <Progress value={57} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </MobileGrid>

          {/* Achievements */}
          <Card className="glass-strong mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Achievements
              </CardTitle>
              <CardDescription>
                Your milestones and accomplishments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 glass-subtle rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      achievement.completed ? 'bg-primary text-white' : 'bg-muted'
                    }`}>
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{achievement.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {achievement.points} crystals
                      </div>
                    </div>
                    <Badge variant={achievement.completed ? "default" : "secondary"}>
                      {achievement.completed ? 'Completed' : 'Locked'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 glass-subtle rounded-lg">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-sm">Completed chat session</div>
                    <div className="text-xs text-muted-foreground">2 hours ago</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 glass-subtle rounded-lg">
                  <Brain className="w-5 h-5 text-secondary" />
                  <div>
                    <div className="font-medium text-sm">Finished personality assessment</div>
                    <div className="text-xs text-muted-foreground">1 day ago</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 glass-subtle rounded-lg">
                  <Users className="w-5 h-5 text-accent" />
                  <div>
                    <div className="font-medium text-sm">Joined community discussion</div>
                    <div className="text-xs text-muted-foreground">3 days ago</div>
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