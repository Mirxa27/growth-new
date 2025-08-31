import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen, 
  Video, 
  FileText, 
  Headphones,
  Star,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  content_type: 'article' | 'video' | 'audio' | 'course';
  content_url?: string;
  content_text?: string;
  duration_minutes?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  is_featured: boolean;
  is_premium: boolean;
  rating: number;
  view_count: number;
  created_at: string;
}

interface NewLibraryItem {
  title: string;
  description: string;
  content_type: 'article' | 'video' | 'audio' | 'course';
  content_url?: string;
  content_text?: string;
  duration_minutes?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  is_featured: boolean;
  is_premium: boolean;
}

export const LibraryManager: React.FC = () => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const { toast } = useToast();

  const [newItem, setNewItem] = useState<NewLibraryItem>({
    title: '',
    description: '',
    content_type: 'article',
    content_url: '',
    content_text: '',
    duration_minutes: 0,
    difficulty_level: 'beginner',
    category: '',
    tags: [],
    is_featured: false,
    is_premium: false
  });

  const categories = [
    'Self Development', 'Career Growth', 'Mental Health', 'Relationships',
    'Productivity', 'Leadership', 'Communication', 'Mindfulness', 'Wellness'
  ];

  useEffect(() => {
    fetchLibraryItems();
  }, []);

  const fetchLibraryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('library_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching library items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch library items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.title || !newItem.description || !newItem.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('library_items')
        .insert([{
          ...newItem,
          rating: 0,
          view_count: 0
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Library item created successfully",
      });

      setIsCreateDialogOpen(false);
      setNewItem({
        title: '',
        description: '',
        content_type: 'article',
        content_url: '',
        content_text: '',
        duration_minutes: 0,
        difficulty_level: 'beginner',
        category: '',
        tags: [],
        is_featured: false,
        is_premium: false
      });
      fetchLibraryItems();
    } catch (error) {
      console.error('Error creating library item:', error);
      toast({
        title: "Error",
        description: "Failed to create library item",
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this library item?')) return;

    try {
      const { error } = await supabase
        .from('library_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Library item deleted successfully",
      });
      fetchLibraryItems();
    } catch (error) {
      console.error('Error deleting library item:', error);
      toast({
        title: "Error",
        description: "Failed to delete library item",
        variant: "destructive"
      });
    }
  };

  const toggleFeatured = async (id: string, is_featured: boolean) => {
    try {
      const { error } = await supabase
        .from('library_items')
        .update({ is_featured: !is_featured })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Item ${!is_featured ? 'featured' : 'unfeatured'} successfully`,
      });
      fetchLibraryItems();
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive"
      });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesType = filterType === 'all' || item.content_type === filterType;
    const matchesDifficulty = filterDifficulty === 'all' || item.difficulty_level === filterDifficulty;
    
    return matchesSearch && matchesCategory && matchesType && matchesDifficulty;
  });

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Headphones className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{items.length}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {items.filter(item => item.is_featured).length}
                </p>
                <p className="text-xs text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {items.filter(item => item.is_premium).length}
                </p>
                <p className="text-xs text-muted-foreground">Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.floor(items.reduce((sum, item) => sum + item.view_count, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Library Content Management</CardTitle>
              <CardDescription>Manage your content library resources</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Content</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Library Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={newItem.title}
                        onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                        placeholder="Content title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="content_type">Content Type</Label>
                      <Select 
                        value={newItem.content_type} 
                        onValueChange={(value: 'article' | 'video' | 'audio' | 'course') => 
                          setNewItem({...newItem, content_type: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                          <SelectItem value="course">Course</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      placeholder="Describe the content"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={newItem.category} 
                        onValueChange={(value) => setNewItem({...newItem, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select 
                        value={newItem.difficulty_level} 
                        onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                          setNewItem({...newItem, difficulty_level: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="content_url">Content URL</Label>
                      <Input
                        id="content_url"
                        value={newItem.content_url || ''}
                        onChange={(e) => setNewItem({...newItem, content_url: e.target.value})}
                        placeholder="External content URL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={newItem.duration_minutes || ''}
                        onChange={(e) => setNewItem({...newItem, duration_minutes: parseInt(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newItem.tags.join(', ')}
                      onChange={(e) => setNewItem({...newItem, tags: e.target.value.split(',').map(t => t.trim())})}
                      placeholder="motivation, growth, success"
                    />
                  </div>
                  
                  {newItem.content_type === 'article' && (
                    <div>
                      <Label htmlFor="content_text">Article Content</Label>
                      <Textarea
                        id="content_text"
                        value={newItem.content_text || ''}
                        onChange={(e) => setNewItem({...newItem, content_text: e.target.value})}
                        placeholder="Article text content"
                        rows={6}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={newItem.is_featured}
                        onCheckedChange={(checked) => setNewItem({...newItem, is_featured: checked})}
                      />
                      <Label htmlFor="featured">Featured Content</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="premium"
                        checked={newItem.is_premium}
                        onCheckedChange={(checked) => setNewItem({...newItem, is_premium: checked})}
                      />
                      <Label htmlFor="premium">Premium Content</Label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateItem}>
                      Create Item
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search library items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="course">Course</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getContentTypeIcon(item.content_type)}
                    <Badge variant="outline" className="text-xs">
                      {item.content_type}
                    </Badge>
                    <Badge className={`text-xs ${getDifficultyColor(item.difficulty_level)}`}>
                      {item.difficulty_level}
                    </Badge>
                    {item.is_featured && (
                      <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-3 mb-4">
                {item.description}
              </CardDescription>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category:</span>
                  <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                </div>
                {item.duration_minutes && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.duration_minutes} min</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Views:</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{item.view_count}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rating:</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleFeatured(item.id, item.is_featured)}
                  >
                    <Star className={`h-4 w-4 ${item.is_featured ? 'fill-current text-yellow-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No library items found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterCategory !== 'all' || filterType !== 'all' || filterDifficulty !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Add your first library item to get started.'
              }
            </p>
            {!searchTerm && filterCategory === 'all' && filterType === 'all' && filterDifficulty === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};