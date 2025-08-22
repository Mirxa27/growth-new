
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Compass, 
  Clock, 
  Star, 
  Trophy,
  Play,
  Lock,
  Heart,
  Brain,
  Sparkles,
  Users,
  Target,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Exploration {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration: number;
  crystal_reward: number;
  is_active: boolean;
  questions: any[];
}

const Explorations = () => {
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
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
        .order('difficulty_level', { ascending: true });

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

  const startExploration = async (exploration: Exploration) => {
    try {
      const { data, error } = await supabase
        .from('exploration_sessions')
        .insert({
          user_id: user?.id,
          exploration_id: exploration.id,
          status: 'in-progress'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Exploration started!",
        description: `Beginning your journey: ${exploration.title}`,
      });

      // Navigate to chat with session context
      navigate(`/chat?session=${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error starting exploration",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/10 text-green-600';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-600';
      case 'advanced': return 'bg-red-500/10 text-red-600';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'self-discovery': return <Heart className="w-4 h-4" />;
      case 'relationships': return <Users className="w-4 h-4" />;
      case 'personal-growth': return <Target className="w-4 h-4" />;
      case 'healing': return <Sparkles className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const categories = ['all', 'self-discovery', 'relationships', 'personal-growth', 'healing'];
  const filteredExplorations = selectedCategory === 'all' 
    ? explorations 
    : explorations.filter(e => e.category === selectedCategory);

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
            Embark on guided journeys of self-discovery. Each exploration is a structured conversation 
            with your AI companion, designed to help you understand yourself more deeply.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">{explorations.length}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-4 h-4 text-secondary" />
              </div>
              <p className="text-2xl font-bold text-secondary">0</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-4 h-4 text-accent" />
              </div>
              <p className="text-2xl font-bold text-accent">0</p>
              <p className="text-xs text-muted-foreground">Crystals</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-500">0%</p>
              <p className="text-xs text-muted-foreground">Progress</p>
            </CardContent>
          </Card>
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
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(exploration.category)}
                    <Badge variant="outline" className="text-xs">
                      {exploration.category.replace('-', ' ')}
                    </Badge>
                  </div>
                  <Badge className={`text-xs ${getDifficultyColor(exploration.difficulty_level)}`}>
                    {exploration.difficulty_level}
                  </Badge>
                </div>
                
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {exploration.title}
                </CardTitle>
                <CardDescription className="text-sm line-clamp-3">
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
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{exploration.crystal_reward} crystals</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Questions</span>
                    <span>{exploration.questions?.length || 10}/10</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                
                <Button 
                  onClick={() => startExploration(exploration)}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Begin Journey
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExplorations.length === 0 && (
          <Card className="glass-card border-glass text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No explorations found</h3>
              <p className="text-muted-foreground">
                Try selecting a different category or check back later for new journeys.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Explorations;
