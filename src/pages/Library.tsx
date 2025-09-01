import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';
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
  Sparkles,
  Loader2
} from 'lucide-react';
import { MobileContainer, MobileGrid, MobileCard } from '@/components/responsive/MobileOptimized';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

// Zod schemas for validation
const libraryItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content_type: z.enum(['article', 'video', 'audio', 'assessment']).nullable(),
  category: z.string().optional(),
  duration: z.number().optional(),
  difficulty: z.string().optional(),
  is_featured: z.boolean().optional(),
  created_at: z.string().datetime()
});

const userProgressSchema = z.object({
  user_id: z.string(),
  library_item_id: z.string(),
  is_bookmarked: z.boolean(),
  is_completed: z.boolean(),
  progress: z.number().min(0).max(100),
  updated_at: z.string().datetime()
});

type LibraryItem = Tables<'library_items'> & {
  isBookmarked: boolean;
  isCompleted: boolean;
  progress?: number;
  // Optional fields used in UI but may not exist in generated types
  duration?: number | null;
  difficulty?: string | null;
};
type UserLibraryProgress = Tables<'user_library_progress'>;

const Library = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(true);

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLibraryItems();
  }, []);

  const fetchLibraryItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch library items from database
      const { data: items, error: itemsError } = await supabase
        .from('library_items')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('Error fetching library items:', itemsError);
        throw new Error('Failed to fetch library items');
      }

      // Validate fetched items
      const validatedItems = items?.map(item => {
        try {
          return libraryItemSchema.parse(item);
        } catch (validationError) {
          console.error(`Validation error for item ${item.id}:`, validationError);
          return null;
        }
      }).filter(Boolean) || [];

      // Get current user for progress/bookmarks
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user:', userError);
        throw new Error('Failed to fetch user data');
      }
      
      let userProgress: UserLibraryProgress[] = [];
      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_library_progress')
          .select('*')
          .eq('user_id', user.id);
        
        if (progressError) {
          console.error('Error fetching user progress:', progressError);
        } else {
          // Validate progress data
          userProgress = (progressData || []).map(progress => {
            try {
              return userProgressSchema.parse(progress);
            } catch (validationError) {
              console.error(`Validation error for progress ${progress.library_item_id}:`, validationError);
              return null;
            }
          }).filter(Boolean);
        }
      }

      // Transform data to match interface
      const transformedItems: LibraryItem[] = validatedItems.map((item) => {
        const userItemProgress = userProgress.find(p => p.library_item_id === item.id);
        
        return {
          ...item,
          isBookmarked: userItemProgress?.is_bookmarked || false,
          isCompleted: userItemProgress?.is_completed || false,
          progress: userItemProgress?.progress || 0,
        };
      });

      setLibraryItems(transformedItems);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchLibraryItems:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setLoading(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load library items. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleToggleBookmark = async (itemId: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      toast({
        title: "Error",
        description: "Failed to verify user authentication.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark items.",
        variant: "destructive"
      });
      return;
    }

    try {
      const item = libraryItems.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      const newBookmarkStatus = !item.isBookmarked;

      const progressData = {
        user_id: user.id,
        library_item_id: itemId,
        is_bookmarked: newBookmarkStatus,
        is_completed: item.isCompleted,
        progress: item.progress || 0,
        updated_at: new Date().toISOString()
      };

      // Validate progress data before updating
      const validatedProgress = userProgressSchema.parse(progressData);

      // Update in database
      const { error: updateError } = await supabase
        .from('user_library_progress')
        .upsert(validatedProgress);

      if (updateError) {
        console.error('Error updating bookmark:', updateError);
        throw new Error('Failed to update bookmark status');
      }

      // Update local state
      setLibraryItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, isBookmarked: newBookmarkStatus } : i
      ));

      toast({
        title: newBookmarkStatus ? "Bookmarked" : "Bookmark removed",
        description: newBookmarkStatus ? "Item added to your bookmarks" : "Item removed from bookmarks"
      });
    } catch (error) {
      console.error('Error in handleToggleBookmark:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update bookmark status",
        variant: "destructive"
      });
    }
  };

  const handleStartContent = async (itemId: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      toast({
        title: "Error",
        description: "Failed to verify user authentication.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to start content.",
        variant: "destructive"
      });
      return;
    }

    try {
      const item = libraryItems.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Content not found');
      }

      const progressData = {
        user_id: user.id,
        library_item_id: itemId,
        is_bookmarked: item.isBookmarked,
        is_completed: false,
        progress: 0,
        updated_at: new Date().toISOString()
      };

      // Validate progress data before updating
      const validatedProgress = userProgressSchema.parse(progressData);

      // Update or create progress entry
      const { error: progressError } = await supabase
        .from('user_library_progress')
        .upsert(validatedProgress);

      if (progressError) {
        console.error('Error updating content progress:', progressError);
        throw new Error('Failed to initialize content progress');
      }

      // Update local state
      setLibraryItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, progress: 0 } : i
      ));

      // Navigate to content (implementation depends on your routing setup)
      // router.push(`/content/${itemId}`);

      toast({
        title: "Content started",
        description: "Your progress has been initialized."
      });
    } catch (error) {
      console.error('Error in handleStartContent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start content",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string | null) => {
    switch(type) {
      case 'article': return FileText;
      case 'video': return Video;
      case 'audio': return Headphones;
      case 'assessment': return Target;
      default: return BookOpen;
    }
  };

  const filteredItems = libraryItems.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const bookmarkedItems = filteredItems.filter(item => item.isBookmarked);
  const inProgressItems = filteredItems.filter(item => !item.isCompleted && (item.progress ?? 0) > 0);
  const completedItems = filteredItems.filter(item => item.isCompleted);

  const categories: string[] = [
    'all',
    ...Array.from(
      new Set(
        libraryItems
          .map((item) => item.category)
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
      )
    ),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <MobileContainer className="py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Learning Library</h1>
          <p className="text-muted-foreground">Explore curated content for your growth journey</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="bookmarks">
              <Bookmark className="w-4 h-4 mr-1" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <Card className="glass border-card-border text-center p-8">
                  <p className="text-destructive">{error}</p>
                  <Button onClick={fetchLibraryItems} className="mt-4">
                    Retry
                  </Button>
                </Card>
              ) : filteredItems.length > 0 ? (
                <MobileGrid cols={1}>
                  {filteredItems.map((item) => {
                    const TypeIcon = getTypeIcon(item.content_type);
                    return (
                      <MobileCard key={item.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TypeIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold truncate">{item.title}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleBookmark(item.id)}
                                className="flex-shrink-0"
                              >
                                <Bookmark 
                                  className={`w-4 h-4 ${item.isBookmarked ? 'fill-current text-primary' : ''}`} 
                                />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                              <span>{item.category}</span>
                              {item.duration && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {item.duration} min
                                  </span>
                                </>
                              )}
                              {item.difficulty && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs">
                                    {item.difficulty}
                                  </Badge>
                                </>
                              )}
                            </div>
                            {item.isCompleted ? (
                              <Badge className="bg-green-500/20 text-green-500">
                                ✓ Completed
                              </Badge>
                            ) : (item.progress ?? 0) > 0 ? (
                              <div className="space-y-1">
                                <Progress value={item.progress} className="h-2" />
                                <p className="text-xs text-muted-foreground">{item.progress}% complete</p>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => handleStartContent(item.id)}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Start
                              </Button>
                            )}
                          </div>
                        </div>
                      </MobileCard>
                    );
                  })}
                </MobileGrid>
              ) : (
                <Card className="glass border-card-border text-center p-8">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No content found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bookmarks">
            <div className="space-y-4">
              {bookmarkedItems.length > 0 ? (
                <MobileGrid cols={1}>
                  {bookmarkedItems.map((item) => {
                    const TypeIcon = getTypeIcon(item.content_type);
                    return (
                      <MobileCard key={item.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleBookmark(item.id)}
                          >
                            <Bookmark className="w-4 h-4 fill-current text-primary" />
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
                    Save content to access it quickly later
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
                    const TypeIcon = getTypeIcon(item.content_type);
                    return (
                      <MobileCard key={item.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-6 h-6 text-yellow-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                            <Progress value={item.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{item.progress}% complete</p>
                          </div>
                          <Button size="sm" onClick={() => handleStartContent(item.id)}>
                            Continue
                          </Button>
                        </div>
                      </MobileCard>
                    );
                  })}
                </MobileGrid>
              ) : (
                <Card className="glass border-card-border text-center p-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No content in progress</h3>
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
                    const TypeIcon = getTypeIcon(item.content_type);
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
