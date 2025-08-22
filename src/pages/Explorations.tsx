import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Compass, Clock, Gem, Star, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

const Explorations = () => {
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
    } catch (error: any) {
      toast({
        title: "Error loading explorations",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startExploration = async (explorationId: string) => {
    try {
      const { data, error } = await supabase
        .from('exploration_sessions')
        .insert({
          user_id: user?.id,
          exploration_id: explorationId,
          status: 'in-progress'
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/exploration/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error starting exploration",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const categories = ['all', 'self-discovery', 'relationships', 'career', 'wellness', 'spirituality'];
  
  const filteredExplorations = selectedCategory === 'all' 
    ? explorations 
    : explorations.filter(e => e.category === selectedCategory);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/20 text-green-300';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300';
      case 'advanced': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Themed Explorations
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Embark on guided journeys of self-discovery. Each exploration is designed to help you explore different aspects of your inner world with NewMe as your companion.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-gradient-primary" : "glass"}
            >
              {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
            </Button>
          ))}
        </div>

        {/* Explorations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExplorations.map((exploration) => (
            <Card key={exploration.id} className="glass-card border-glass hover:scale-105 transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                      {exploration.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getDifficultyColor(exploration.difficulty_level)}>
                        {exploration.difficulty_level}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {exploration.category.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-primary opacity-60" />
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {exploration.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{exploration.estimated_duration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gem className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">
                      {exploration.crystal_reward} crystals
                    </span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => startExploration(exploration.id)}
                  className="w-full glass-button group/btn"
                >
                  <span>Begin Journey</span>
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExplorations.length === 0 && (
          <div className="text-center py-12">
            <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No explorations found</h3>
            <p className="text-muted-foreground">
              {selectedCategory === 'all' 
                ? "There are no active explorations at the moment."
                : `No explorations found in the ${selectedCategory.replace('-', ' ')} category.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorations;