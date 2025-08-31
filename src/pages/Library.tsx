import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Search, 
  Play,
  Clock,
  Star,
  Bookmark,
  Download,
  Target,
  Headphones,
  FileText,
  Video,
  Sparkles
} from 'lucide-react';
import { MobileContainer, MobileGrid, MobileCard } from '@/components/responsive/MobileOptimized';
import { useToast } from '@/hooks/use-toast';

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'audio' | 'video' | 'exercise';
  category: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  isBookmarked: boolean;
  isCompleted: boolean;
  progress?: number;
  tags: string[];
}

const Library = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(true);

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);

  useEffect(() => {
    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      const items: LibraryItem[] = [
        {
          id: '1',
          title: 'Mindfulness for Beginners',
          description: 'Learn the fundamentals of mindfulness meditation with guided sessions designed for newcomers.',
          type: 'article',
          category: 'Mindfulness',
          duration: '15 min',
          difficulty: 'beginner',
          rating: 4.8,
          isBookmarked: false,
          isCompleted: true,
          progress: 100,
          tags: ['meditation', 'mindfulness', 'beginner']
        },
        {
          id: '2',
          title: 'Advanced Breathing Techniques',
          description: 'Master advanced breathing techniques used by athletes and performers to enhance focus and performance.',
          type: 'video',
          category: 'Breathwork',
          duration: '25 min',
          difficulty: 'advanced',
          rating: 4.9,
          isBookmarked: true,
          isCompleted: false,
          progress: 60,
          tags: ['breathwork', 'performance', 'advanced']
        },
        {
          id: '3',
          title: 'Daily Gratitude Practice',
          description: 'Cultivate gratitude through simple daily exercises that transform your mindset and relationships.',
          type: 'audio',
          category: 'Gratitude',
          duration: '10 min',
          difficulty: 'beginner',
          rating: 4.7,
          isBookmarked: false,
          isCompleted: false,
          progress: 0,
          tags: ['gratitude', 'daily', 'relationships']
        },
        {
          id: '4',
          title: 'Stress Management Strategies',
          description: 'Evidence-based strategies to manage stress and build resilience in challenging situations.',
          type: 'article',
          category: 'Stress Management',
          duration: '20 min',
          difficulty: 'intermediate',
          rating: 4.6,
          isBookmarked: true,
          isCompleted: true,
          progress: 100,
          tags: ['stress', 'resilience', 'evidence-based']
        },
        {
          id: '5',
          title: 'Sleep Meditation Series',
          description: 'Guided meditations specifically designed to improve sleep quality and establish healthy bedtime routines.',
          type: 'audio',
          category: 'Sleep',
          duration: '30 min',
          difficulty: 'beginner',
          rating: 4.9,
          isBookmarked: false,
          isCompleted: false,
          progress: 25,
          tags: ['sleep', 'meditation', 'bedtime']
        },
        {
          id: '6',
          title: 'Emotional Intelligence Workshop',
          description: 'Develop emotional intelligence through practical exercises and real-world applications.',
          type: 'video',
          category: 'Emotional Intelligence',
          duration: '45 min',
          difficulty: 'intermediate',
          rating: 4.8,
          isBookmarked: false,
          isCompleted: false,
          progress: 0,
          tags: ['emotional-intelligence', 'practical', 'workshop']
        }
      ];
      setLibraryItems(items);
      setLoading(false);
    }, 1000);
  }, [toast]);

  const categories = [
    'all',
    'Self-Awareness',
    'Mindfulness',
    'Relationships',
    'Wellness',
    'Career Growth',
    'Creativity'
  ];

  const filteredItems = libraryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const bookmarkedItems = libraryItems.filter(item => item.isBookmarked);
  const completedItems = libraryItems.filter(item => item.isCompleted);
  const inProgressItems = libraryItems.filter(item => item.progress && item.progress > 0 && item.progress < 100);

  const handleBookmark = (itemId: string) => {
    // Update bookmark status (in real app, this would update the database)
    setLibraryItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, isBookmarked: !item.isBookmarked }
          : item
      )
    );
    
    toast({
      title: "Bookmark updated!",
      description: "Item bookmark status has been updated.",
    });
  };

  const handleStartItem = (item: LibraryItem) => {
    toast({
      title: `Starting ${item.title}`,
      description: `Opening ${item.type} content...`,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return FileText;
      case 'audio': return Headphones;
      case 'video': return Video;
      case 'exercise': return Target;
      default: return BookOpen;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500';
      case 'intermediate': return 'text-yellow-500';
      case 'advanced': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <MobileContainer className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Library</h1>
              <p className="text-muted-foreground">Discover resources for your growth journey</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles, meditations, exercises..."
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
                  {category === 'all' ? 'All' : category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            <TabsTrigger value="progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <MobileGrid cols={1} className="space-y-6">
              {filteredItems.map((item) => {
                const TypeIcon = getTypeIcon(item.type);
                return (
                  <MobileCard key={item.id} className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                          <TypeIcon className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-lg font-semibold leading-tight">{item.title}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBookmark(item.id)}
                              className={item.isBookmarked ? 'text-primary' : ''}
                            >
                              <Bookmark className={`w-4 h-4 ${item.isBookmarked ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="glass">
                            {item.category}
                          </Badge>
                          <Badge variant="outline" className={getDifficultyColor(item.difficulty)}>
                            {item.difficulty}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {item.duration}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="w-3 h-3 fill-current text-yellow-500" />
                            {item.rating}
                          </div>
                        </div>

                        {item.progress && item.progress > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{item.progress}%</span>
                            </div>
                            <Progress value={item.progress} className="h-2" />
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleStartItem(item)}
                            className="bg-gradient-primary"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {item.progress && item.progress > 0 ? 'Continue' : 'Start'}
                          </Button>
                          <Button variant="outline" className="glass">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </MobileCard>
                );
              })}
            </MobileGrid>
          </TabsContent>

          <TabsContent value="bookmarks">
            <div className="space-y-4">
              {bookmarkedItems.length > 0 ? (
                <MobileGrid cols={1}>
                  {bookmarkedItems.map((item) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <MobileCard key={item.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.category} • {item.duration}</p>
                          </div>
                          <Button size="sm" className="bg-gradient-primary">
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </MobileCard>
                    );
                  })}
                </MobileGrid>
              ) : (
                <Card className="glass border-card-border text-center p-8">
                  <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
                  <p className="text-muted-foreground">
                    Bookmark items you want to save for later
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <div className="space-y-4">
              {inProgressItems.length > 0 ? (
                <MobileGrid cols={1}>
                  {inProgressItems.map((item) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <MobileCard key={item.id} className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          </div>
                          <Button size="sm" className="bg-gradient-primary">
                            Continue
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                      </MobileCard>
                    );
                  })}
                </MobileGrid>
              ) : (
                <Card className="glass border-card-border text-center p-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No items in progress</h3>
                  <p className="text-muted-foreground">
                    Start exploring content to see your progress here
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-4">
              {completedItems.length > 0 ? (
                <MobileGrid cols={1}>
                  {completedItems.map((item) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <MobileCard key={item.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-6 h-6 text-green-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.category} • Completed</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-500">
                            ✓ Done
                          </Badge>
                        </div>
                      </MobileCard>
                    );
                  })}
                </MobileGrid>
              ) : (
                <Card className="glass border-card-border text-center p-8">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No completed items yet</h3>
                  <p className="text-muted-foreground">
                    Complete content to build your achievement collection
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </MobileContainer>
    </div>
  );
};

export default Library;