import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2,
  Edit,
  Star,
  EyeOff,
  Eye
} from 'lucide-react';

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  content_type: 'article' | 'audio' | 'video';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  is_premium: boolean;
  is_featured: boolean;
  is_published: boolean;
  author: string;
}

export const LibraryManager: React.FC = () => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('library_items' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data as any) || []);
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

  const handleCreate = async () => {
    // This would open a form/modal to create a new item
    toast({ title: "Create new item clicked" });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('library_items' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      toast({ title: "Success", description: "Library item deleted" });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  const handleToggleFeature = async (id: string, is_featured: boolean) => {
    try {
      const { error } = await supabase
        .from('library_items' as any)
        .update({ is_featured: !is_featured })
        .eq('id', id);

      if (error) throw error;

      setItems(items.map(item => item.id === id ? { ...item, is_featured: !is_featured } : item));
      toast({ title: "Success", description: `Item ${!is_featured ? 'featured' : 'unfeatured'}` });
    } catch (error) {
      console.error('Error updating feature status:', error);
      toast({ title: "Error", description: "Failed to update feature status", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading library items...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Library Manager</CardTitle>
            <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />Add New Item</Button>
          </div>
          <CardDescription>Manage all content in the resource library.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search library items..." />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{item.content_type}</Badge>
                  <Badge variant="secondary">{item.category}</Badge>
                  <Badge variant="secondary">{item.difficulty_level}</Badge>
                  {item.is_premium && <Badge variant="destructive">Premium</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleToggleFeature(item.id, item.is_featured)}>
                  {item.is_featured ? <Star className="w-4 h-4 text-yellow-500 fill-current" /> : <Star className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm">
                  {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};