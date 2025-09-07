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
  Gift,
  Flame,
  Star
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer, MobileGrid, MobileCard } from '@/components/responsive/MobileOptimized';
import { supabase } from '@/integrations/supabase/client';
import { gamification } from '@/services/gamification/gamification-service';
import { newMeAI } from '@/services/ai/newme-ai-service';

interface UserStats {
  currentLevel: number;
  crystalBalance: number;
  levelProgress: number;
  dailyStreak: number;
  totalAchievements: number;
  recentAchievements: any[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dailyAffirmation, setDailyAffirmation] = useState<string>('');
  const [streakBonus, setStreakBonus] = useState<number>(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Update daily streak first
        const streakResult = await gamification.updateDailyStreak(user.id);
        setStreakBonus(streakResult.bonusCrystals);

        // Get user progress
        const progress = await gamification.getUserProgress(user.id);
        if (progress) {
          setUserStats({
            currentLevel: progress.currentLevel,
            crystalBalance: progress.crystalBalance,
            levelProgress: progress.levelProgress,
            dailyStreak: progress.dailyStreak,
            totalAchievements: progress.achievements.length,
            recentAchievements: await gamification.getUserAchievements(user.id)
          });
        }

        // Get daily affirmation
        const { data: existingAffirmation } = await supabase
          .from('daily_affirmations')
          .select('affirmation_text')
          .eq('user_id', user.id)
          .eq('generated_date', new Date().toISOString().split('T')[0])
          .single();

        if (existingAffirmation) {
          setDailyAffirmation(existingAffirmation.affirmation_text);
        } else {
          // Generate new affirmation
          const userProfile = await newMeAI.getUserMemoryProfile(user.id);
          if (userProfile) {
            const affirmation = await newMeAI.generateDailyAffirmation(userProfile);
            setDailyAffirmation(affirmation);
            
            // Save to database
            await supabase
              .from('daily_affirmations')
              .upsert({
                user_id: user.id,
                affirmation_text: affirmation,
                generated_date: new Date().toISOString().split('T')[0],
              });
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
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
      title: 'Chat with NewMe',
      description: 'Your AI growth companion',
      icon: MessageCircle,
      color: 'text-primary',
      action: () => navigate('/chat')
    },
    {
      title: 'Narrative Exploration',
      description: 'Discover your story patterns',
      icon: BookOpen,
      color: 'text-secondary',
      action: () => navigate('/narrative-identity')
    },
    {
      title: 'Join Community',
      description: 'Connect with other women',
      icon: Users,
      color: 'text-accent',
      action: () => navigate('/community')
    },
    {
      title: 'Growth Library',
      description: 'Audio practices & resources',
      icon: Brain,
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
        <MobileContainer className="py-4 sm:py-8">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate('/')}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/20 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity touch-target-large"
              >
                <img src="/symbol.svg" alt="Newomen Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold">Welcome back!</h1>
                <p className="text-sm sm:text-base text-muted-foreground truncate">
                  {user?.email || 'Ready to continue your growth journey?'}
                </p>
              </div>
            </div>
          </div>

          {/* Streak Bonus Notification */}
          {streakBonus > 0 && (
            <Card className="glass-strong border-primary/30 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Daily Streak Bonus!</p>
                    <p className="text-sm text-muted-foreground">
                      You earned {streakBonus} crystals for your {userStats?.dailyStreak}-day streak! ✨
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Overview */}
          <MobileGrid cols={3} className="mb-8">
            <MobileCard className="text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{userStats?.crystalBalance || 0}</div>
              <div className="text-xs text-muted-foreground">Crystals</div>
            </MobileCard>

            <MobileCard className="text-center">
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-2xl font-bold text-secondary">{userStats?.totalAchievements || 0}</div>
              <div className="text-xs text-muted-foreground">Achievements</div>
            </MobileCard>

            <MobileCard className="text-center">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-accent" />
              </div>
              <div className="text-2xl font-bold text-accent">{userStats?.dailyStreak || 0}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </MobileCard>
          </MobileGrid>

          {/* Level Progress */}
          <Card className="glass-strong mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Level {userStats?.currentLevel || 1}</CardTitle>
                    <CardDescription>Your growth journey</CardDescription>
                  </div>
                </div>
                <Badge className="bg-primary/20 text-primary">
                  {userStats?.levelProgress || 0}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={userStats?.levelProgress || 0} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                Keep growing to reach the next level!
              </p>
            </CardContent>
          </Card>

          {/* Daily Affirmation */}
          {dailyAffirmation && (
            <Card className="glass-strong mb-8 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-5 h-5" />
                  Today's Affirmation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium italic leading-relaxed">
                  "{dailyAffirmation}"
                </p>
              </CardContent>
            </Card>
          )}

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