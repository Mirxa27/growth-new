import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Play, Pause, Download, Clock, Star, Heart, Brain, Leaf } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BreathingPractice {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  difficulty_level: number;
  category: string;
  audio_url: string | null;
  instructions: any;
  is_active: boolean;
}

const Library = () => {
  const [breathingPractices, setBreathingPractices] = useState<BreathingPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchBreathingPractices();
  }, []);

  const fetchBreathingPractices = async () => {
    try {
      const { data, error } = await supabase
        .from('breathing_practices')
        .select('*')
        .eq('is_active', true)
        .order('difficulty_level', { ascending: true });

      if (error) throw error;
      setBreathingPractices(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading practices",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = (practiceId: string) => {
    if (playingAudio === practiceId) {
      setPlayingAudio(null);
      toast({
        title: "Audio paused",
        description: "Practice session paused"
      });
    } else {
      setPlayingAudio(practiceId);
      toast({
        title: "Audio playing",
        description: "Breathing practice started"
      });
    }
  };

  const downloadPractice = (practice: BreathingPractice) => {
    toast({
      title: "Download started",
      description: `${practice.title} is being prepared for offline use`
    });
  };

  const getDifficultyStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < level ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'relaxation': return <Heart className="w-4 h-4" />;
      case 'focus': return <Brain className="w-4 h-4" />;
      case 'energy': return <Leaf className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const categories = ['all', 'relaxation', 'focus', 'energy', 'sleep'];
  const filteredPractices = selectedCategory === 'all' 
    ? breathingPractices 
    : breathingPractices.filter(p => p.category === selectedCategory);

  const affirmations = [
    "I am capable of incredible growth and transformation.",
    "My journey is unique and valuable, unfolding perfectly in its own time.",
    "I embrace my authentic self with love and compassion.",
    "Every challenge I face strengthens my resilience and wisdom.",
    "I trust in my ability to create positive change in my life.",
    "My voice matters, and my experiences have value.",
    "I am worthy of love, success, and happiness.",
    "I choose to see opportunities in every situation."
  ];

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
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Wellness Library
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover breathing practices, daily affirmations, and mindfulness resources to support your journey of growth and self-discovery.
          </p>
        </div>

        <Tabs defaultValue="breathing" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="breathing">Breathing</TabsTrigger>
            <TabsTrigger value="affirmations">Affirmations</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="breathing" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-gradient-primary" : "glass"}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>

            {/* Breathing Practices Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPractices.map((practice) => (
                <Card key={practice.id} className="glass-card border-glass hover:scale-105 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(practice.category)}
                        <Badge variant="outline" className="text-xs">
                          {practice.category}
                        </Badge>
                      </div>
                      <div className="flex">
                        {getDifficultyStars(practice.difficulty_level)}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{practice.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {practice.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{practice.duration_minutes} min</span>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Level {practice.difficulty_level}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => toggleAudio(practice.id)}
                        className="flex-1 glass-button"
                        variant="outline"
                      >
                        {playingAudio === practice.id ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => downloadPractice(practice)}
                        variant="outline"
                        size="icon"
                        className="glass-button"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="affirmations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {affirmations.map((affirmation, index) => (
                <Card key={index} className="glass-card border-glass">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary/20 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-medium leading-relaxed">
                          "{affirmation}"
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Daily Affirmation #{index + 1}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card border-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Growth Guides
                  </CardTitle>
                  <CardDescription>
                    Comprehensive guides for personal development
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <h4 className="font-medium">Understanding Your Emotions</h4>
                      <p className="text-sm text-muted-foreground">Learn to identify and work with your emotional patterns</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                      <h4 className="font-medium">Building Resilience</h4>
                      <p className="text-sm text-muted-foreground">Develop tools for navigating life's challenges</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                      <h4 className="font-medium">Creating Healthy Boundaries</h4>
                      <p className="text-sm text-muted-foreground">Learn to protect your energy and well-being</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-primary" />
                    Wellness Tools
                  </CardTitle>
                  <CardDescription>
                    Practical tools for daily well-being
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                      <h4 className="font-medium">Mood Tracker</h4>
                      <p className="text-sm text-muted-foreground">Monitor your emotional patterns over time</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <h4 className="font-medium">Gratitude Journal</h4>
                      <p className="text-sm text-muted-foreground">Cultivate appreciation and positive mindset</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                      <h4 className="font-medium">Goal Setting Framework</h4>
                      <p className="text-sm text-muted-foreground">Create meaningful, achievable personal goals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Library;