
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Play, 
  Pause, 
  Clock, 
  Star, 
  Trophy,
  Wind,
  Heart,
  Sparkles,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BreathingPractice {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  difficulty_level: number;
  category: string;
  instructions: any;
  audio_url?: string;
  slug?: string;
}

interface UserProgress {
  practice_id: string;
  completed_sessions: number;
  total_duration: number;
  personal_best_duration: number;
  last_completed?: string;
}

const Library = () => {
  const [practices, setPractices] = useState<BreathingPractice[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activePractice, setActivePractice] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPractices();
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchPractices = async () => {
    try {
      const { data, error } = await supabase
        .from('breathing_practices')
        .select('*')
        .eq('is_active', true)
        .order('difficulty_level', { ascending: true });

      if (error) throw error;
      setPractices(data || []);
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

  const fetchUserProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('user_breathing_progress')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setUserProgress(data || []);
    } catch (error: any) {
      console.error('Error loading user progress:', error);
    }
  };

  const getUserProgressForPractice = (practiceId: string): UserProgress | null => {
    return userProgress.find(p => p.practice_id === practiceId) || null;
  };

  const startPractice = async (practice: BreathingPractice) => {
    setActivePractice(practice.id);
    setTotalTime(practice.duration_minutes * 60);
    setCurrentTime(0);
    setIsPlaying(true);

    // Start the practice timer
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= practice.duration_minutes * 60) {
          clearInterval(interval);
          completePractice(practice);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    toast({
      title: "Practice Started! 🧘‍♀️",
      description: `Beginning ${practice.title}`,
    });
  };

  const pausePractice = () => {
    setIsPlaying(false);
  };

  const resumePractice = () => {
    setIsPlaying(true);
  };

  const stopPractice = () => {
    setActivePractice(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setTotalTime(0);
  };

  const completePractice = async (practice: BreathingPractice) => {
    if (!user) return;

    try {
      const existingProgress = getUserProgressForPractice(practice.id);
      const newCompletedSessions = (existingProgress?.completed_sessions || 0) + 1;
      const newTotalDuration = (existingProgress?.total_duration || 0) + practice.duration_minutes;
      const newPersonalBest = Math.max(
        existingProgress?.personal_best_duration || 0,
        practice.duration_minutes
      );

      const { error } = await supabase
        .from('user_breathing_progress')
        .upsert({
          user_id: user.id,
          practice_id: practice.id,
          completed_sessions: newCompletedSessions,
          total_duration: newTotalDuration,
          personal_best_duration: newPersonalBest,
          last_completed: new Date().toISOString()
        });

      if (error) throw error;

      // Award crystals
      const crystalReward = practice.difficulty_level * 10;
      await supabase.rpc('award_crystals', {
        user_id_input: user.id,
        crystal_amount: crystalReward
      });

      await fetchUserProgress();

      toast({
        title: "Practice Complete! 🌟",
        description: `You earned ${crystalReward} crystals!`,
      });

      setActivePractice(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setTotalTime(0);
    } catch (error: any) {
      toast({
        title: "Error saving progress",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-500/10 text-green-600';
      case 2: return 'bg-yellow-500/10 text-yellow-600';
      case 3: return 'bg-orange-500/10 text-orange-600';
      case 4: return 'bg-red-500/10 text-red-600';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Intermediate';
      case 3: return 'Advanced';
      case 4: return 'Expert';
      default: return 'Unknown';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'relaxation': return <Heart className="w-4 h-4" />;
      case 'energy': return <Sparkles className="w-4 h-4" />;
      case 'focus': return <Wind className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const categories = ['all', 'relaxation', 'energy', 'focus'];
  const filteredPractices = selectedCategory === 'all' 
    ? practices 
    : practices.filter(p => p.category === selectedCategory);

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
              <Wind className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Wellness Library
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover guided breathing practices designed to bring peace, energy, and focus to your day.
          </p>
        </div>

        {/* Active Practice Player */}
        {activePractice && (
          <Card className="glass-card border-glass mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {practices.find(p => p.id === activePractice)?.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={isPlaying ? pausePractice : resumePractice}
                    size="sm"
                    className="bg-gradient-primary"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button onClick={stopPractice} variant="outline" size="sm" className="glass">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <Progress value={(currentTime / totalTime) * 100} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(totalTime)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">{practices.length}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-4 h-4 text-secondary" />
              </div>
              <p className="text-2xl font-bold text-secondary">
                {userProgress.reduce((sum, p) => sum + p.completed_sessions, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 text-accent" />
              </div>
              <p className="text-2xl font-bold text-accent">
                {userProgress.reduce((sum, p) => sum + p.total_duration, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-glass">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-500">
                {Math.max(...userProgress.map(p => p.personal_best_duration), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Best</p>
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
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>

        {/* Practices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPractices.map((practice) => {
            const progress = getUserProgressForPractice(practice.id);
            return (
              <Card key={practice.id} className="glass-card border-glass hover:scale-105 transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(practice.category)}
                      <Badge variant="outline" className="text-xs">
                        {practice.category}
                      </Badge>
                    </div>
                    <Badge className={`text-xs ${getDifficultyColor(practice.difficulty_level)}`}>
                      {getDifficultyLabel(practice.difficulty_level)}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {practice.title}
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-3">
                    {practice.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{practice.duration_minutes} min</span>
                    </div>
                    {practice.audio_url && (
                      <div className="flex items-center gap-1">
                        <Volume2 className="w-4 h-4" />
                        <span>Audio</span>
                      </div>
                    )}
                  </div>
                  
                  {progress && (
                    <div className="mb-4 p-3 glass rounded-lg">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Sessions: {progress.completed_sessions}</span>
                        <span>Best: {progress.personal_best_duration}min</span>
                      </div>
                      <Progress value={Math.min((progress.completed_sessions / 10) * 100, 100)} className="h-1" />
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => startPractice(practice)}
                    disabled={activePractice === practice.id}
                    className="w-full bg-gradient-primary hover:opacity-90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {activePractice === practice.id ? 'Active' : 'Start Practice'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredPractices.length === 0 && (
          <Card className="glass-card border-glass text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wind className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No practices found</h3>
              <p className="text-muted-foreground">
                Try selecting a different category or check back later for new practices.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Library;
