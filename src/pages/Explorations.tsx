
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Clock, Star, Users, Sparkles, Play } from 'lucide-react';

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

  useEffect(() => {
    fetchExplorations();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-4 pb-20">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="text-center mb-8">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-2">Themed Explorations</h1>
          <p className="text-lg text-muted-foreground">
            Guided journeys of self-discovery with your AI companion
          </p>
        </div>

        {explorations.length === 0 ? (
          <Card className="max-w-md mx-auto glass-card">
            <CardContent className="pt-6 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No explorations available at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {explorations.map((exploration) => {
              const IconComponent = getCategoryIcon(exploration.category);
              return (
                <Card key={exploration.id} className="glass-card hover:glass-card-hover transition-all duration-300 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 rounded-lg bg-primary/20 text-primary">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <Badge 
                        variant="outline" 
                        className="glass-surface"
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
                    <CardDescription className="text-base">
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
                      className="w-full bg-primary hover:bg-primary/90 group-hover:shadow-lg transition-all"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Begin Exploration
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto glass-card">
            <CardHeader>
              <CardTitle>How Explorations Work</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold">Phase 1: Reflection</h4>
                  <p className="text-sm text-muted-foreground">
                    Answer 10 carefully crafted questions with honest self-reflection. Take your time.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Phase 2: Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive a deep analysis from your Higher Self with actionable guidance and affirmations.
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center pt-4 border-t border-white/10">
                Each exploration is a journey of discovery. Allow yourself to be vulnerable and open to growth.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
