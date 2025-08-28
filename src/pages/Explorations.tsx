import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Clock, Star, Users, Sparkles, Play, Heart, Target } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer, MobileGrid, MobileCard, MobileTypography } from '@/components/responsive/MobileOptimized';

interface Exploration {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration: number;
  crystal_reward: number;
  is_active: boolean;
}

export default function Explorations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({ completed: 0, totalMinutes: 0 });

  useEffect(() => {
    fetchExplorations();
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchExplorations = async () => {
    try {
      const { data, error } = await supabase
        .from('explorations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExplorations(data || []);
    } catch (error) {
      console.error('Error fetching explorations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load explorations.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from('exploration_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      if (error) throw error;
      
      const stats = {
        completed: data?.length || 0,
        totalMinutes: data?.reduce((sum, session) => {
          // Assuming average 30 minutes per session
          return sum + 30;
        }, 0) || 0
      };
      
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleStartExploration = (exploration: Exploration) => {
    navigate(`/explorations/${exploration.id}`);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'hsl(142, 71%, 45%)';
      case 'intermediate': return 'hsl(45, 93%, 47%)';
      case 'advanced': return 'hsl(346, 87%, 58%)';
      default: return 'hsl(220, 85%, 57%)';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'self-discovery': return Star;
      case 'relationships': return Users;
      case 'personal-growth': return Sparkles;
      default: return Star;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'self-discovery': return 'hsl(320, 85%, 65%)';
      case 'relationships': return 'hsl(346, 87%, 58%)';
      case 'personal-growth': return 'hsl(280, 70%, 60%)';
      default: return 'hsl(320, 85%, 65%)';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <LoadingSpinner size="lg" text="Loading explorations..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-ambient pb-20">
        <MobileContainer className="pt-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <MobileTypography.H1 className="gradient-text mb-4">
              Themed Explorations
            </MobileTypography.H1>
            <MobileTypography.Body className="text-muted-foreground max-w-2xl mx-auto">
              Guided journeys of self-discovery with your AI companion NewMe. Each exploration is designed to help you uncover deeper insights about yourself.
            </MobileTypography.Body>
          </div>

          {/* User Stats */}
          {user && (
            <MobileGrid cols={{ default: 2, md: 4 }} className="mb-8">
              <MobileCard>
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{userStats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </MobileCard>
              
              <MobileCard>
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-4 h-4 text-secondary" />
                  </div>
                  <p className="text-2xl font-bold text-secondary">{userStats.totalMinutes}</p>
                  <p className="text-xs text-muted-foreground">Minutes</p>
                </CardContent>
              </MobileCard>
              
              <MobileCard>
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-2xl font-bold text-accent">{userStats.completed * 150}</p>
                  <p className="text-xs text-muted-foreground">Crystals Earned</p>
                </CardContent>
              </MobileCard>
              
              <MobileCard>
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                  </div>
                  <p className="text-2xl font-bold text-pink-500">{explorations.length}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </CardContent>
              </MobileCard>
            </MobileGrid>
          )}

          {/* Explorations Grid */}
          {explorations.length === 0 ? (
            <MobileCard className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No explorations available at the moment.</p>
              </CardContent>
            </MobileCard>
          ) : (
            <MobileGrid cols={{ default: 1, md: 2, lg: 3 }}>
              {explorations.map((exploration) => {
                const IconComponent = getCategoryIcon(exploration.category);
                const categoryColor = getCategoryColor(exploration.category);
                return (
                  <MobileCard key={exploration.id} className="hover:scale-105 transition-all duration-300 cursor-pointer group interactive">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className="p-2 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${categoryColor}20` }}
                        >
                          <IconComponent className="h-5 w-5" style={{ color: categoryColor }} />
                        </div>
                        <Badge 
                          variant="outline" 
                          className="glass text-xs"
                          style={{ 
                            borderColor: getDifficultyColor(exploration.difficulty_level),
                            color: getDifficultyColor(exploration.difficulty_level)
                          }}
                        >
                          {exploration.difficulty_level}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {exploration.title}
                      </CardTitle>
                      <CardDescription className="text-base line-clamp-3">
                        {exploration.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {exploration.estimated_duration} min
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-primary" />
                          {exploration.crystal_reward} crystals
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleStartExploration(exploration)}
                        className="w-full bg-gradient-primary hover:opacity-90 group-hover:shadow-lg transition-all micro-bounce"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Begin Exploration
                      </Button>
                    </CardContent>
                  </MobileCard>
                );
              })}
            </MobileGrid>
          )}

          {/* How It Works */}
          <div className="mt-12">
            <MobileCard className="max-w-4xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">How Explorations Work</CardTitle>
                <CardDescription>
                  Your journey through deep self-discovery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <MobileGrid cols={{ default: 1, md: 2 }}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold">1</span>
                      </div>
                      <h4 className="font-semibold">Phase 1: Reflection</h4>
                    </div>
                    <p className="text-sm text-muted-foreground ml-11">
                      Answer 10 carefully crafted questions with honest self-reflection. NewMe acts as a gentle facilitator, creating a safe space for you to explore your thoughts and feelings.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                        <span className="text-secondary font-bold">2</span>
                      </div>
                      <h4 className="font-semibold">Phase 2: Higher Self Analysis</h4>
                    </div>
                    <p className="text-sm text-muted-foreground ml-11">
                      Receive a deep, structured analysis from your Higher Self with insights, patterns, actionable guidance, and personalized affirmations for your growth journey.
                    </p>
                  </div>
                </MobileGrid>
                
                <div className="pt-4 border-t border-white/10 text-center">
                  <p className="text-sm text-muted-foreground">
                    🌟 Each exploration is a journey of discovery. Allow yourself to be vulnerable and open to growth. Your insights are automatically saved to your private journal for future reflection.
                  </p>
                </div>
              </CardContent>
            </MobileCard>
          </div>
        </MobileContainer>
      </div>
    </ErrorBoundary>
  );
}