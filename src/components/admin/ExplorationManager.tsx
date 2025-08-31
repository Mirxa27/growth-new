import React, { useState, useEffect, useCallback } from 'react';
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
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Database } from '@/integrations/supabase/types';

type Exploration = Database['public']['Tables']['explorations']['Row'];
type ExplorationInsert = Database['public']['Tables']['explorations']['Insert'];

export const ExplorationManager: React.FC = () => {
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExploration, setEditingExploration] = useState<Exploration | null>(null);
  const [formData, setFormData] = useState<Partial<ExplorationInsert>>({});
  const { toast } = useToast();

  const fetchExplorations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('explorations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setExplorations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch explorations: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchExplorations();
  }, [fetchExplorations]);

  const handleOpenDialog = (exploration: Exploration | null = null) => {
    setEditingExploration(exploration);
    setFormData(exploration ? { ...exploration } : { 
      title: '', 
      description: '', 
      category: 'self-discovery', 
      difficulty_level: 'beginner', 
      is_active: false,
      visibility: 'private'
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('explorations')
        .upsert(formData as ExplorationInsert);
      if (error) throw error;
      toast({ title: "Success", description: `Exploration ${editingExploration ? 'updated' : 'created'}` });
      setIsDialogOpen(false);
      fetchExplorations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save exploration: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exploration?')) return;
    try {
      const { error } = await supabase
        .from('explorations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Exploration deleted" });
      fetchExplorations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete exploration: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('explorations')
        .update({ is_active: !isActive })
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Exploration status updated" });
      fetchExplorations();
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
            <CardTitle>Exploration Manager</CardTitle>
            <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" />Add New Exploration</Button>
          </div>
          <CardDescription>Manage all guided explorations and their content.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search explorations..." className="glass-input" />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {explorations.map(exploration => (
          <Card key={exploration.id} className="glass-strong">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{exploration.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{exploration.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{exploration.category}</Badge>
                  <Badge variant="secondary">{exploration.difficulty_level}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(exploration.id, exploration.is_active)}>
                  {exploration.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(exploration)}><Edit className="w-4 h-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(exploration.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{editingExploration ? 'Edit' : 'Create'} Exploration</DialogTitle>
            <DialogDescription>Fill in the details for the guided exploration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formData.title || ''} onChange={e => setFormData(p => ({...p, title: e.target.value}))} className="glass-input" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description || ''} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className="glass-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={formData.category || ''} onChange={e => setFormData(p => ({...p, category: e.target.value}))} className="glass-input" />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={formData.difficulty_level} onValueChange={(v: any) => setFormData(p => ({...p, difficulty_level: v}))}>
                  <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Questions (JSON)</Label>
              <Textarea value={JSON.stringify(formData.questions, null, 2) || ''} onChange={e => setFormData(p => ({...p, questions: JSON.parse(e.target.value)}))} className="glass-input font-mono" rows={5} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_active" checked={formData.is_active} onCheckedChange={c => setFormData(p => ({...p, is_active: c}))} />
              <Label htmlFor="is_active">Active</Label>
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