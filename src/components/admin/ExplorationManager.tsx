import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus,
  Trash2,
  Save,
  FileText,
  Search,
  Edit2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import { Tables, Json } from '@/integrations/supabase/types';

interface ExplorationForm {
  id?: string;
  title: string;
  description: string;
  promptsText: string;
  visibility: 'public' | 'private';
  difficulty_level: 'easy' | 'medium' | 'hard';
  category: string;
  crystal_reward: number;
  estimated_duration: number;
  facilitator_prompt: string;
  higher_self_prompt: string;
  is_active: boolean;
}

type ExplorationRow = Tables<'explorations'>;

const explorationSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  prompts: z.array(z.string().min(1, 'Prompts cannot be empty')).min(1, 'Add at least one exploration prompt'),
  visibility: z.enum(['public', 'private']),
  difficulty_level: z.enum(['easy', 'medium', 'hard']),
  category: z.string().min(1, 'Category is required'),
  crystal_reward: z.number().int().min(0, 'Crystal reward must be a positive number'),
  estimated_duration: z.number().int().min(1, 'Estimated duration must be at least one minute'),
  facilitator_prompt: z.string().min(5, 'Facilitator prompt is required'),
  higher_self_prompt: z.string().min(5, 'Higher self prompt is required'),
  is_active: z.boolean(),
});

type ExplorationPayload = z.infer<typeof explorationSchema>;

const defaultForm: ExplorationForm = {
  title: '',
  description: '',
  promptsText: '',
  visibility: 'private',
  difficulty_level: 'medium',
  category: 'self-discovery',
  crystal_reward: 150,
  estimated_duration: 20,
  facilitator_prompt: 'Guide the participant through each prompt with empathy and curiosity.',
  higher_self_prompt: "Encourage responses that reflect the participant's highest wisdom.",
  is_active: true,
};

const parsePrompts = (questions: ExplorationRow['questions']): string[] => {
  if (Array.isArray(questions)) {
    return questions
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }
        if (item && typeof item === 'object') {
          const candidate =
            (item as Record<string, unknown>).prompt ??
            (item as Record<string, unknown>).text ??
            (item as Record<string, unknown>).question;
          return typeof candidate === 'string' ? candidate.trim() : '';
        }
        return '';
      })
      .filter((value) => Boolean(value));
  }

  if (typeof questions === 'string') {
    try {
      const parsed = JSON.parse(questions);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean);
      }
    } catch (error) {
      return [];
    }
  }

  if (questions && typeof questions === 'object' && 'prompts' in (questions as Record<string, unknown>)) {
    const prompts = (questions as Record<string, unknown>).prompts;
    if (Array.isArray(prompts)) {
      return prompts
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  return [];
};

export const ExplorationManager: React.FC = () => {
  const { toast } = useToast();
  const [explorations, setExplorations] = useState<ExplorationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ExplorationForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [explorationToDelete, setExplorationToDelete] = useState<ExplorationRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchExplorations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('explorations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setExplorations((data || []) as ExplorationRow[]);
    } catch (error) {
      logger.error('Failed to load explorations', 'ExplorationManager', error);
      toast({
        title: 'Unable to load explorations',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchExplorations();
  }, [fetchExplorations]);

  const filteredExplorations = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return explorations;
    }

    return explorations.filter((exploration) =>
      exploration.title.toLowerCase().includes(normalized)
      || (exploration.description ?? '').toLowerCase().includes(normalized)
      || (exploration.category ?? '').toLowerCase().includes(normalized)
    );
  }, [explorations, searchTerm]);

  const openCreateDialog = () => {
    setForm(defaultForm);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (exploration: ExplorationRow) => {
    const prompts = parsePrompts(exploration.questions);
    setForm({
      id: exploration.id,
      title: exploration.title,
      description: exploration.description ?? '',
      promptsText: prompts.join('\n'),
      visibility: exploration.visibility === 'public' ? 'public' : 'private',
      difficulty_level: ['easy', 'medium', 'hard'].includes(exploration.difficulty_level ?? '')
        ? (exploration.difficulty_level as ExplorationForm['difficulty_level'])
        : 'medium',
      category: exploration.category ?? defaultForm.category,
      crystal_reward: Number.isFinite(exploration.crystal_reward)
        ? Number(exploration.crystal_reward)
        : defaultForm.crystal_reward,
      estimated_duration: Number.isFinite(exploration.estimated_duration)
        ? Number(exploration.estimated_duration)
        : defaultForm.estimated_duration,
      facilitator_prompt: exploration.facilitator_prompt ?? defaultForm.facilitator_prompt,
      higher_self_prompt: exploration.higher_self_prompt ?? defaultForm.higher_self_prompt,
      is_active: Boolean(exploration.is_active),
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setFormErrors({});

      const prompts = form.promptsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const payload: ExplorationPayload = explorationSchema.parse({
        id: form.id,
        title: form.title,
        description: form.description,
        prompts,
        visibility: form.visibility,
        difficulty_level: form.difficulty_level,
        category: form.category,
        crystal_reward: form.crystal_reward,
        estimated_duration: form.estimated_duration,
        facilitator_prompt: form.facilitator_prompt,
        higher_self_prompt: form.higher_self_prompt,
        is_active: form.is_active,
      });

      const { id, prompts: promptArray, ...rest } = payload;
      const supabasePayload = {
        ...rest,
        questions: promptArray as unknown as Json,
      };

      if (id) {
        const { error } = await supabase
          .from('explorations')
          .update(supabasePayload)
          .eq('id', id);

        if (error) {
          throw error;
        }

        toast({ title: 'Exploration updated', description: 'Changes saved successfully.' });
        logger.info('Exploration updated', { id });
      } else {
        const { error } = await supabase
          .from('explorations')
          .insert([supabasePayload]);

        if (error) {
          throw error;
        }

        toast({ title: 'Exploration created', description: 'New exploration added successfully.' });
        logger.info('Exploration created', { title: payload.title });
      }

      setIsDialogOpen(false);
      setForm(defaultForm);
      fetchExplorations();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0 && typeof err.path[0] === 'string') {
            const key = err.path[0] as string;
            if (key === 'prompts') {
              fieldErrors.promptsText = err.message;
            } else {
              fieldErrors[key] = err.message;
            }
          }
        });
        setFormErrors(fieldErrors);
        toast({
          title: 'Validation error',
          description: 'Please review the highlighted fields.',
          variant: 'destructive',
        });
      } else {
        logger.error('Failed to save exploration', 'ExplorationManager', error);
        toast({
          title: 'Unable to save exploration',
          description: error instanceof Error ? error.message : String(error),
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (exploration: ExplorationRow) => {
    setExplorationToDelete(exploration);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!explorationToDelete) {
      toast({ title: 'Delete failed', description: 'No exploration selected', variant: 'destructive' });
      return;
    }

    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('explorations')
        .delete()
        .eq('id', explorationToDelete.id);

      if (error) {
        throw error;
      }

      setExplorations((previous) => previous.filter((exploration) => exploration.id !== explorationToDelete.id));
      toast({ title: 'Exploration deleted', description: 'The exploration has been removed.' });
    } catch (error) {
      logger.error('Delete exploration failed', 'ExplorationManager', error);
      toast({
        title: 'Unable to delete exploration',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setExplorationToDelete(null);
    }
  };

  const handleToggleActive = async (exploration: ExplorationRow) => {
    try {
      const { error } = await supabase
        .from('explorations')
        .update({ is_active: !exploration.is_active })
        .eq('id', exploration.id);

      if (error) {
        throw error;
      }

      setExplorations((previous) =>
        previous.map((item) =>
          item.id === exploration.id ? { ...item, is_active: !exploration.is_active } : item,
        ),
      );

      toast({
        title: 'Status updated',
        description: `Exploration ${!exploration.is_active ? 'activated' : 'paused'}.`,
      });
    } catch (error) {
      logger.error('Failed to toggle exploration', 'ExplorationManager', error);
      toast({
        title: 'Unable to update status',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Explorations</CardTitle>
            <CardDescription>Curate interactive journeys and personal growth adventures for the community.</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title, category, or description"
                className="pl-10 glass-input"
              />
            </div>
            <Button onClick={openCreateDialog} className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" /> New Exploration
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <Card className="glass">
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading explorations...
            </CardContent>
          </Card>
        ) : filteredExplorations.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-12 text-center text-muted-foreground">
              No explorations found. Create a new journey to get started.
            </CardContent>
          </Card>
        ) : (
          filteredExplorations.map((exploration) => {
            const promptCount = parsePrompts(exploration.questions).length;
            return (
              <Card key={exploration.id} className="glass">
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{exploration.title}</span>
                        <Badge variant={exploration.is_active ? 'default' : 'secondary'}>
                          {exploration.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {exploration.description ?? 'No description provided.'}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">{exploration.visibility === 'public' ? 'Public' : 'Private'}</Badge>
                        <Badge variant="outline">{exploration.difficulty_level ?? 'medium'}</Badge>
                        <Badge variant="outline">{exploration.category ?? 'self-discovery'}</Badge>
                        <Badge variant="outline">{promptCount} prompts</Badge>
                        <Badge variant="outline">{exploration.estimated_duration ?? defaultForm.estimated_duration} min</Badge>
                        <Badge variant="outline">{exploration.crystal_reward ?? defaultForm.crystal_reward} crystals</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {exploration.created_at ? new Date(exploration.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 md:flex-row md:items-center">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Active</span>
                        <Switch
                          checked={Boolean(exploration.is_active)}
                          onCheckedChange={() => handleToggleActive(exploration)}
                          aria-label="Toggle exploration active status"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(String(exploration.id))}
                          title="Copy exploration ID"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(exploration)}>
                          <Edit2 className="mr-1 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(exploration)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto glass-strong">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Exploration' : 'Create Exploration'}</DialogTitle>
            <DialogDescription>
              {form.id
                ? 'Update prompts and metadata for this exploration experience.'
                : 'Design a new exploration journey with clear prompts and facilitator guidance.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exploration-title">Title</Label>
                <Input
                  id="exploration-title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="glass-input"
                />
                {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="exploration-category">Category</Label>
                <Input
                  id="exploration-category"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="glass-input"
                />
                {formErrors.category && <p className="text-xs text-destructive">{formErrors.category}</p>}
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(value: ExplorationForm['visibility']) =>
                    setForm((prev) => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger className="glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={form.difficulty_level}
                  onValueChange={(value: ExplorationForm['difficulty_level']) =>
                    setForm((prev) => ({ ...prev, difficulty_level: value }))
                  }
                >
                  <SelectTrigger className="glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Crystal Reward</Label>
                <Input
                  type="number"
                  value={form.crystal_reward}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, crystal_reward: Number(event.target.value) }))
                  }
                  className="glass-input"
                />
                {formErrors.crystal_reward && <p className="text-xs text-destructive">{formErrors.crystal_reward}</p>}
              </div>
              <div className="space-y-2">
                <Label>Estimated Duration (minutes)</Label>
                <Input
                  type="number"
                  value={form.estimated_duration}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, estimated_duration: Number(event.target.value) }))
                  }
                  className="glass-input"
                />
                {formErrors.estimated_duration && <p className="text-xs text-destructive">{formErrors.estimated_duration}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                className="glass-input"
              />
              {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label>Prompts (one per line)</Label>
              <Textarea
                value={form.promptsText}
                onChange={(event) => setForm((prev) => ({ ...prev, promptsText: event.target.value }))}
                rows={6}
                className="glass-input font-mono"
              />
              {formErrors.promptsText && <p className="text-xs text-destructive">{formErrors.promptsText}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Facilitator Prompt</Label>
                <Textarea
                  value={form.facilitator_prompt}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, facilitator_prompt: event.target.value }))
                  }
                  rows={3}
                  className="glass-input"
                />
                {formErrors.facilitator_prompt && <p className="text-xs text-destructive">{formErrors.facilitator_prompt}</p>}
              </div>
              <div className="space-y-2">
                <Label>Higher Self Prompt</Label>
                <Textarea
                  value={form.higher_self_prompt}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, higher_self_prompt: event.target.value }))
                  }
                  rows={3}
                  className="glass-input"
                />
                {formErrors.higher_self_prompt && <p className="text-xs text-destructive">{formErrors.higher_self_prompt}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
                />
                <div className="text-sm">
                  <p className="font-medium">Active exploration</p>
                  <p className="text-xs text-muted-foreground">
                    Deactivate to temporarily hide this exploration from learners.
                  </p>
                </div>
              </div>
              <Badge variant="outline">{form.promptsText.split('\n').filter(Boolean).length} prompts</Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary">
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {form.id ? 'Save Changes' : 'Create Exploration'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exploration</AlertDialogTitle>
            <AlertDialogDescription>
              {explorationToDelete
                ? `Deleting "${explorationToDelete.title}" will remove the prompts and history associated with it.`
                : 'Are you sure you want to delete this exploration?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExplorationManager;
