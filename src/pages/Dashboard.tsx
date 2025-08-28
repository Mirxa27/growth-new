
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  Heart
} from 'lucide-react';
import { useDailyInsight } from '@/hooks/useDailyInsight';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer, MobileGrid, MobileCard } from '@/components/responsive/MobileOptimized';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentExplorations, setRecentExplorations] = useState([]);
  const { insight, loading: insightLoading } = useDailyInsight();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRecentExplorations();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentExplorations = async () => {
    try {
      const { data, error } = await supabase
        .from('exploration_sessions')
        .select(`
          *,
          explorations(title, description)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentExplorations(data || []);
    } catch (error) {
      console.error('Error fetching recent explorations:', error);
    }
  };

  const crystalCount = profile?.crystals_count || 0;
  const level = Math.floor(crystalCount / 100) + 1;
  const progressToNext = (crystalCount % 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-ambient pb-20">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Welcome back, {profile?.display_name || 'Beautiful Soul'}
          </h1>
          <p className="text-lg text-muted-foreground">
            Continue your journey of self-discovery
          </p>
        </div>

        {/* Stats Cards */}
        <MobileContainer>
          <MobileGrid cols={{ default: 1, sm: 2, lg: 3 }} className="mb-8">
            <MobileCard>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Crystal Balance</CardTitle>
                <Sparkles className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{crystalCount}</div>
                <p className="text-xs text-muted-foreground">
                  +23 from last session
                </p>
              </CardContent>
            </MobileCard>

            <MobileCard>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                <Award className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">{level}</div>
                <Progress value={progressToNext} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {100 - progressToNext} crystals to next level
                </p>
              </CardContent>
            </MobileCard>

            <MobileCard>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Explorations</CardTitle>
                <Target className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{recentExplorations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Completed this month
                </p>
              </CardContent>
            </MobileCard>
          </MobileGrid>
        </MobileContainer>

        {/* Quick Actions */}
        <MobileContainer>
          <MobileGrid cols={{ default: 1, sm: 2, lg: 4 }} className="mb-8">
            <MobileCard className="hover:scale-105 transition-all cursor-pointer group interactive" onClick={() => navigate('/chat')}>
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-primary/20 text-primary mx-auto mb-4 w-fit group-hover:scale-110 transition-transform">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Chat with NewMe</h3>
              <p className="text-sm text-muted-foreground">
                Start a conversation with your AI companion
              </p>
              </CardContent>
            </MobileCard>

            <MobileCard className="hover:scale-105 transition-all cursor-pointer group interactive" onClick={() => navigate('/explorations')}>
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-secondary/20 text-secondary mx-auto mb-4 w-fit group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Explore Themes</h3>
              <p className="text-sm text-muted-foreground">
                Dive deep into guided explorations
              </p>
              </CardContent>
            </MobileCard>

            <MobileCard className="hover:scale-105 transition-all cursor-pointer group interactive" onClick={() => navigate('/library')}>
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-accent/20 text-accent mx-auto mb-4 w-fit group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Wellness Library</h3>
              <p className="text-sm text-muted-foreground">
                Access breathing practices and resources
              </p>
              </CardContent>
            </MobileCard>

            <MobileCard className="hover:scale-105 transition-all cursor-pointer group interactive" onClick={() => navigate('/profile')}>
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-pink-500/20 text-pink-500 mx-auto mb-4 w-fit group-hover:scale-110 transition-transform">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Your Journal</h3>
              <p className="text-sm text-muted-foreground">
                Review insights and progress
              </p>
              </CardContent>
            </MobileCard>
          </MobileGrid>
        </MobileContainer>

        {/* Recent Activity */}
        <MobileContainer>
          <MobileGrid cols={{ default: 1, lg: 2 }}>
            <MobileCard>
              <CardHeader>
                <CardTitle>Recent Explorations</CardTitle>
                <CardDescription>Your latest journey insights</CardDescription>
              </CardHeader>
            <CardContent>
              {recentExplorations.length > 0 ? (
                <div className="space-y-4">
                  {recentExplorations.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-3 glass-surface rounded-lg">
                      <div>
                        <p className="font-medium">{session.explorations?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No explorations yet. Start your first journey!
                </p>
              )}
              </CardContent>
            </MobileCard>

            <MobileCard>
              <CardHeader>
                <CardTitle>Growth Areas</CardTitle>
                <CardDescription>Your focus areas for development</CardDescription>
              </CardHeader>
            <CardContent>
              {profile?.growth_areas?.length > 0 ? (
                <div className="space-y-3">
                  {profile.growth_areas.map((area: string, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{area}</span>
                      <Progress value={Math.random() * 100} className="w-20 h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Complete the Balance Wheel to set your growth areas
                  </p>
                  <Button 
                    variant="outline" 
                    className="glass-button"
                    onClick={() => navigate('/onboarding')}
                  >
                    Take Assessment
                  </Button>
                </div>
              )}
              </CardContent>
            </MobileCard>
          </MobileGrid>
        </MobileContainer>

        {/* Daily Inspiration */}
        <MobileContainer>
          <MobileCard className="mt-8">
            <CardContent className="p-6 sm:p-8 text-center">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Today's Inspiration</h3>
              {insightLoading ? (
                <LoadingSpinner size="sm" className="mb-6" />
              ) : (
                <p className="text-lg italic text-muted-foreground mb-6">
                  "{insight}"
                </p>
              )}
              <Button 
                className="bg-gradient-primary hover:opacity-90 micro-bounce"
                onClick={() => navigate('/chat')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Reflect on This
              </Button>
            </CardContent>
          </MobileCard>
        </MobileContainer>
        </div>
      </div>
    </ErrorBoundary>
  );
}
