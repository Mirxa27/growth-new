import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Compass, 
  Clock, 
  Star, 
  Brain, 
  Target, 
  Sparkles, 
  Search,
  Users,
  TrendingUp,
  Heart
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer, MobileGrid, MobileCard } from '@/components/responsive/MobileOptimized';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Exploration = Tables<'explorations'>;

const Explorations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [filteredExplorations, setFilteredExplorations] = useState<Exploration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadExplorations();
  }, []);

  useEffect(() => {
    filterExplorations();
  }, [searchQuery, selectedCategory, explorations]);

  const loadExplorations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('explorations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setExplorations(data || []);
    } catch (error) {
      console.error('Error loading explorations:', error);
      toast({
        title: "Error",
        description: "Failed to load explorations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterExplorations = () => {
    let filtered = explorations;

    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    setFilteredExplorations(filtered);
  };

  const categories = ['all', 'self-discovery', 'relationships', 'career', 'healing', 'spirituality'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'self-discovery': return <Brain className="w-4 h-4" />;
      case 'relationships': return <Users className="w-4 h-4" />;
      case 'career': return <TrendingUp className="w-4 h-4" />;
      case 'healing': return <Heart className="w-4 h-4" />;
      case 'spirituality': return <Sparkles className="w-4 h-4" />;
      default: return <Compass className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <MobileContainer className="py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Explorations</h1>
                <p className="text-muted-foreground">Guided journeys for self-discovery</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search explorations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-gradient-primary" : "glass"}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Explorations Grid */}
          <MobileGrid cols={2}>
            {filteredExplorations.map((exploration) => (
              <MobileCard 
                key={exploration.id} 
                interactive 
                onClick={() => navigate(`/explorations/${exploration.id}`)}
                className="p-6"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getCategoryIcon(exploration.category)}
                      </div>
                      <Badge variant="secondary" className="glass">{exploration.category}</Badge>
                    </div>
                    <h3 className="font-semibold text-lg leading-tight">{exploration.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {exploration.description}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {exploration.estimated_duration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {exploration.crystal_reward}
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {exploration.difficulty_level}
                    </div>
                  </div>
                </div>
              </MobileCard>
            ))}
          </MobileGrid>

          {filteredExplorations.length === 0 && (
            <Card className="glass border-card-border text-center p-12">
              <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No explorations found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter settings.
              </p>
            </Card>
          )}
        </MobileContainer>
      </div>
    </ErrorBoundary>
  );
};

export default Explorations;