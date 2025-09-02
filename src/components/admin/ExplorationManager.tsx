import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2,
  Save,
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// Select not used in this minimal manager
import { Switch } from '@/components/ui/switch';

// Minimal, robust exploration manager for admin panel.
// Keeps implementation compact and typed conservatively to avoid broad TS issues.

type ExplorationRow = {
  id: string;
  title: string;
  description?: string | null;
  visibility?: 'public' | 'private';
  created_at?: string | null;
};

export const ExplorationManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [explorations, setExplorations] = useState<ExplorationRow[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [saving, setSaving] = useState(false);

  const fetchExplorations = useCallback(async () => {
    setLoading(true);
    try {
      // cast to any to avoid rigid DB typing issues during cleanup pass
      const { data, error } = await supabase.from('explorations').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      setExplorations((data || []) as ExplorationRow[]);
    } catch (err: unknown) {
      console.error('Failed to load explorations', err);
      toast({ title: 'Load failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchExplorations();
  }, [fetchExplorations]);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a title', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        visibility,
      };
      const { error } = await supabase.from('explorations').insert([payload]);
      if (error) throw error;
      toast({ title: 'Created', description: 'Exploration created' });
      setOpenCreate(false);
      setTitle('');
      setDescription('');
      setVisibility('private');
      // refresh list
      fetchExplorations();
    } catch (err: unknown) {
      console.error('Create failed', err);
      toast({ title: 'Create failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exploration?')) return;
    try {
      const { error } = await supabase.from('explorations').delete().match({ id });
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Exploration removed' });
      setExplorations(prev => prev.filter(e => e.id !== id));
    } catch (err: unknown) {
      console.error('Delete failed', err);
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Explorations</CardTitle>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setOpenCreate(true)} variant="default">
            <Plus className="mr-2 h-4 w-4" /> New Exploration
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : explorations.length === 0 ? (
            <div className="text-sm text-muted-foreground">No explorations yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {explorations.map(ex => (
                <div key={ex.id} className="p-3 border rounded flex items-start justify-between">
                  <div>
                    <div className="font-medium">{ex.title}</div>
                    <div className="text-sm text-muted-foreground">{ex.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">Created: {ex.created_at ? new Date(ex.created_at).toLocaleString() : '—'}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={ex.visibility === 'public' ? 'default' : undefined}>{ex.visibility}</Badge>
                    <Button variant="ghost" onClick={() => navigator.clipboard.writeText(String(ex.id))} title="Copy ID">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" onClick={() => handleDelete(ex.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Exploration</DialogTitle>
            <DialogDescription>
              Create a new guided exploration journey for personal growth.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="flex items-center space-x-3">
              <Label>Public</Label>
              <Switch checked={visibility === 'public'} onCheckedChange={(v) => setVisibility(v ? 'public' : 'private')} />
            </div>
          </div>

          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Save className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ExplorationManager;
