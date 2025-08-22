
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Sparkles, MessageCircle, Compass, BookOpen, User, Target, TrendingUp } from 'lucide-react';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

interface Profile {
  display_name: string;
  personality_type: string;
  crystals_count: number;
  level_progress: number;
  growth_areas: string[];
  subscription_tier: string;
}

interface RecentExploration {
  id: string;
  title: string;
  completed_at: string;
  status: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentExplorations, setRecentExplorations] = useState<RecentExploration[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [dailyHeadline, setDailyHeadline] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserData();
      generateDailyHeadline();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      
      // Check if user needs onboarding (no personality type)
      if (!profileData.personality_type) {
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }

      // Fetch recent exploration sessions
      const { data: explorationsData } = await supabase
        .from('exploration_sessions')
        .select(`
          id,
          status,
          completed_at,
          explorations!inner(title)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (explorationsData) {
        const formattedExplorations = explorationsData.map(session => ({
          id: session.id,
          title: session.explorations.title,
          completed_at: session.completed_at || '',
          status: session.status
        }));
        setRecentExplorations(formattedExplorations);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your profile data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDailyHeadline = () => {
    const headlines = [
      "Today is perfect for deep self-reflection 🌟",
      "Your inner wisdom is calling - are you ready to listen? ✨",
      "What story will you write about yourself today? 📖",
      "Your growth journey continues with every breath 🌱",
      "Today's challenges are tomorrow's strengths 💪",
      "You carry the light that can illuminate any darkness ☀️",
      "Every moment is a chance to choose growth over comfort 🦋"
    ];
    const randomHeadline = headlines[Math.floor(Math.random() * headlines.length)];
    setDailyHeadline(randomHeadline);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingFlow />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto glass-card">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Unable to load your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const levelProgress = (profile.level_progress % 100);
  const currentLevel = Math.floor(profile.level_progress / 100) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-4 pb-20">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Welcome back, {profile.display_name}
          </h1>
          <p className="text-lg text-muted-foreground mb-4">{dailyHeadline}</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="glass-surface">
              <Sparkles className="h-4 w-4 mr-1" />
              {profile.crystals_count} Crystals
            </Badge>
            <Badge variant="outline" className="glass-surface">
              Level {currentLevel}
            </Badge>
            <Badge variant="outline" className="glass-surface">
              {profile.personality_type}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Progress & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Level Progress */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Level {currentLevel}</span>
                      <span>{levelProgress}%</span>
                    </div>
                    <Progress value={levelProgress} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete explorations and daily check-ins to level up!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>Jump into your growth journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full glass-button justify-start">
                  <Link to="/chat">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat with NewMe
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full glass-button justify-start">
                  <Link to="/explorations">
                    <Compass className="h-4 w-4 mr-2" />
                    Start Exploration
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full glass-button justify-start">
                  <Link to="/library">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Wellness Library  
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Columns - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Growth Areas Focus */}
            {profile.growth_areas && profile.growth_areas.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-secondary" />
                    Your Focus Areas
                  </CardTitle>
                  <CardDescription>
                    Based on your balance wheel assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.growth_areas.map((area, index) => (
                      <Badge key={index} variant="outline" className="glass-surface">
                        {area}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Consider exploring these areas through our themed explorations or conversations with NewMe.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Explorations</CardTitle>
                <CardDescription>Your latest self-discovery sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentExplorations.length > 0 ? (
                  <div className="space-y-3">
                    {recentExplorations.map((exploration) => (
                      <div key={exploration.id} className="flex items-center justify-between p-3 rounded-lg glass-surface">
                        <div>
                          <p className="font-medium">{exploration.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {exploration.status === 'completed' && exploration.completed_at
                              ? `Completed ${new Date(exploration.completed_at).toLocaleDateString()}`
                              : 'In Progress'}
                          </p>
                        </div>
                        <Badge variant={exploration.status === 'completed' ? 'default' : 'secondary'}>
                          {exploration.status === 'completed' ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Compass className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No explorations yet</p>
                    <Button asChild>
                      <Link to="/explorations">Start Your First Exploration</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-accent" />
                  Subscription Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{profile.subscription_tier} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.subscription_tier === 'discovery' 
                        ? 'Explore basic features and conversations'
                        : 'Full access to all features and explorations'
                      }
                    </p>
                  </div>
                  {profile.subscription_tier === 'discovery' && (
                    <Button variant="outline" size="sm" className="glass-button">
                      Upgrade
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
