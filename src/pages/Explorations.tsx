import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Compass, 
  Play, 
  Clock, 
  Star,
  Users,
  Brain,
  Heart,
  Target,
  Sparkles,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer, MobileGrid, MobileCard, MobileTypography } from '@/components/responsive/MobileOptimized';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Exploration {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  participants: number;
  rating: number;
  crystalReward: number;
  isCompleted: boolean;
  progress?: number;
  tags: string[];
  facilitatorType: 'ai' | 'human' | 'self-guided';
}

const Explorations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('available');

  const [explorations] = useState<Exploration[]>([
    {
      id: '1',
      title: 'Discovering Your Core Values',
      description: 'A deep dive into understanding what truly matters to you and how to align your life with your values.',
      category: 'Self-Discovery',
      difficulty: 'beginner',
      duration: '45 min',
      participants: 1247,
      rating: 4.8,
      crystalReward: 150,
      isCompleted: false,
      tags: ['values', 'purpose', 'alignment'],
      facilitatorType: 'ai'
    },
    {
      id: '2',
      title: 'Overcoming Fear of Failure',
      description: 'Transform your relationship with failure and learn to see it as a stepping stone to growth.',
      category: 'Confidence Building',
      difficulty: 'intermediate',
      duration: '60 min',
      participants: 892,
      rating: 4.9,
      crystalReward: 200,
      isCompleted: true,
      progress: 100,
      tags: ['fear', 'resilience', 'growth-mindset'],
      facilitatorType: 'ai'
    },
    {
      id: '3',
      title: 'Building Authentic Relationships',
      description: 'Learn to create deeper, more meaningful connections by showing up as your authentic self.',
      category: 'Relationships',
      difficulty: 'intermediate',
      duration: '90 min',
      participants: 634,
      rating: 4.7,
      crystalReward: 250,
      isCompleted: false,
      progress: 30,
      tags: ['authenticity', 'connection', 'communication'],
      facilitatorType: 'human'
    },
    {
      id: '4',
      title: 'Mindful Leadership Journey',
      description: 'Develop your leadership skills through mindfulness and emotional intelligence practices.',
      category: 'Leadership',
      difficulty: 'advanced',
      duration: '120 min',
      participants: 423,
      rating: 4.6,
      crystalReward: 300,
      isCompleted: false,
      tags: ['leadership', 'mindfulness', 'emotional-intelligence'],
      facilitatorType: 'human'
    },
    {
      id: '5',
      title: 'Creative Expression Therapy',
      description: 'Explore your inner world through various creative mediums and unlock new insights about yourself.',
      category: 'Creativity',
      difficulty: 'beginner',
      duration: '75 min',
      participants: 756,
      rating: 4.5,
      crystalReward: 175,
      isCompleted: false,
      tags: ['creativity', 'self-expression', 'therapy'],
      facilitatorType: 'self-guided'
    },
    {
      id: '6',
      title: 'Healing from Past Trauma',
      description: 'A gentle, supportive journey to process and heal from past experiences with professional guidance.',
      category: 'Healing',
      difficulty: 'advanced',
      duration: '150 min',
      participants: 289,
      rating: 4.9,
      crystalReward: 400,
      isCompleted: false,
      tags: ['trauma', 'healing', 'recovery'],
      facilitatorType: 'human'
    }
  ]);

  const categories = [
    'all',
    'Self-Discovery',
    'Confidence Building',
    'Relationships',
    'Leadership',
    'Creativity',
    'Healing'
  ];

  const filteredExplorations = explorations.filter(exploration => {
    const matchesSearch = exploration.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exploration.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exploration.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || exploration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableExplorations = filteredExplorations.filter(e => !e.isCompleted);
  const inProgressExplorations = filteredExplorations.filter(e => e.progress && e.progress > 0 && e.progress < 100);
  const completedExplorations = filteredExplorations.filter(e => e.isCompleted);

  const handleStartExploration = (exploration: Exploration) => {
    toast({
      title: `Starting ${exploration.title}`,
      description: "Preparing your exploration session...",
    });
    // Navigate to exploration session
    navigate(`/explorations/${exploration.id}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500 bg-green-500/10';
      case 'intermediate': return 'text-yellow-500 bg-yellow-500/10';
      case 'advanced': return 'text-red-500 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const getFacilitatorIcon = (type: string) => {
    switch (type) {
      case 'ai': return Brain;
      case 'human': return Users;
      case 'self-guided': return Target;
      default: return Compass;
    }
  };

  const ExplorationCard = ({ exploration }: { exploration: Exploration }) => {
    const FacilitatorIcon = getFacilitatorIcon(exploration.facilitatorType);
    
    return (
      <MobileCard className="p-6 hover:shadow-lg transition-all">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-tight mb-2">
                {exploration.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {exploration.description}
              </p>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <FacilitatorIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="glass">
              {exploration.category}
            </Badge>
            <Badge className={getDifficultyColor(exploration.difficulty)}>
              {exploration.difficulty}
            </Badge>
            <Badge variant="outline" className="text-primary">
              {exploration.crystalReward} crystals
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {exploration.duration}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {exploration.participants.toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-current text-yellow-500" />
              {exploration.rating}
            </div>
          </div>

          {/* Progress */}
          {exploration.progress && exploration.progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{exploration.progress}%</span>
              </div>
              <Progress value={exploration.progress} className="h-2" />
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {exploration.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Action */}
          <div className="pt-2">
            <Button
              onClick={() => handleStartExploration(exploration)}
              className="w-full bg-gradient-primary"
            >
              {exploration.isCompleted ? (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Completed
                </>
              ) : exploration.progress && exploration.progress > 0 ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Continue
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Exploration
                </>
              )}
            </Button>
          </div>
        </div>
      </MobileCard>
    );
  };

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
                <p className="text-muted-foreground">Guided journeys for personal growth</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search explorations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-gradient-primary" : "glass whitespace-nowrap"}
                  >
                    {category === 'all' ? 'All' : category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <MobileGrid cols={3} className="mb-8">
            <MobileCard className="text-center p-4">
              <div className="text-2xl font-bold text-primary">
                {availableExplorations.length}
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </MobileCard>
            
            <MobileCard className="text-center p-4">
              <div className="text-2xl font-bold text-secondary">
                {inProgressExplorations.length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </MobileCard>
            
            <MobileCard className="text-center p-4">
              <div className="text-2xl font-bold text-accent">
                {completedExplorations.length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </MobileCard>
          </MobileGrid>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              <MobileGrid cols={1} className="space-y-6">
                {availableExplorations.map((exploration) => (
                  <ExplorationCard key={exploration.id} exploration={exploration} />
                ))}
              </MobileGrid>
            </TabsContent>

            <TabsContent value="progress">
              {inProgressExplorations.length > 0 ? (
                <MobileGrid cols={1} className="space-y-6">
                  {inProgressExplorations.map((exploration) => (
                    <ExplorationCard key={exploration.id} exploration={exploration} />
                  ))}
                </MobileGrid>
              ) : (
                <Card className="glass border-card-border text-center p-8">
                  <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No explorations in progress</h3>
                  <p className="text-muted-foreground">
                    Start an exploration to begin your growth journey
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedExplorations.length > 0 ? (
                <MobileGrid cols={1} className="space-y-6">
                  {completedExplorations.map((exploration) => (
                    <ExplorationCard key={exploration.id} exploration={exploration} />
                  ))}
                </MobileGrid>
              ) : (
                <Card className="glass border-card-border text-center p-8">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No completed explorations yet</h3>
                  <p className="text-muted-foreground">
                    Complete explorations to build your achievement collection
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </MobileContainer>
      </div>
    </ErrorBoundary>
  );
};

export default Explorations;