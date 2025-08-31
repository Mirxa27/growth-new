import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2,
  Edit,
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type LibraryItem = Tables<'library_items'>;
type LibraryItemInsert = TablesInsert<'library_items'>;

export const LibraryManager: React.FC = () => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [formData, setFormData] = useState<Partial<LibraryItemInsert>>({});
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('library_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch library items: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenDialog = (item: LibraryItem | null = null) => {
    setEditingItem(item);
    setFormData(item ? { ...item } : { 
      title: '', 
      content_type: 'article', 
      is_published: false 
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('library_items').upsert([formData as LibraryItemInsert]);
      if (error) throw error;
      toast({ title: "Success", description: `Item ${editingItem ? 'updated' : 'created'}` });
      setIsDialogOpen(false);
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save item: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const { error } = await supabase
        .from('library_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Item deleted" });
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete item: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleToggle = async (id: string, field: 'is_published' | 'is_featured' | 'is_premium', value: boolean) => {
    try {
      const { error } = await supabase.from('library_items').update({ [field]: !value }).eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Item status updated" });
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Library Manager</CardTitle>
            <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" />Add New Item</Button>
          </div>
          <CardDescription>Manage all content in the resource library.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search library items..." className="glass-input" />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {items.map(item => (
          <Card key={item.id} className="glass-strong">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.content_type}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleToggle(item.id, 'is_published', item.is_published)}>
                  {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(item)}><Edit className="w-4 h-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Create'} Library Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formData.title || ''} onChange={e => setFormData(p => ({...p, title: e.target.value}))} className="glass-input" />
            </div>
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={formData.content_type} onValueChange={(v: any) => setFormData(p => ({...p, content_type: v}))}>
                <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description || ''} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className="glass-input" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_published" checked={formData.is_published} onCheckedChange={c => setFormData(p => ({...p, is_published: c}))} />
              <Label htmlFor="is_published">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}><X className="w-4 h-4 mr-2" />Cancel</Button>
            <Button onClick={handleSave} className="bg-gradient-primary"><Save className="w-4 h-4 mr-2" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};