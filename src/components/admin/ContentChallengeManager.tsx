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
  Edit,
  Save,
  X,
  Trophy,
  Eye,
  EyeOff
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';
import { z } from 'zod';

type Challenge = Tables<'content_challenges'>;
type ChallengeInsert = TablesInsert<'content_challenges'>;

const challengeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  challenge_type: z.enum(['completion', 'streak', 'community']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  reward: z.number().int().min(0, 'Reward must be a non-negative number'),
  is_active: z.boolean(),
});

type ChallengeForm = z.infer<typeof challengeSchema>;

const defaultForm: ChallengeForm = {
  title: '',
  description: '',
  challenge_type: 'completion',
  difficulty: 'medium',
  reward: 100,
  is_active: false,
};

export const ContentChallengeManager: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState<ChallengeForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_challenges')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setChallenges(data || []);
    } catch (error: any) {
      logger.error('Failed to fetch challenges', 'ContentChallengeManager', error);
      toast({
        title: "Error",
        description: `Failed to fetch challenges: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const filteredChallenges = useMemo(() => {
    if (!searchTerm.trim()) {
      return challenges;
    }

    const normalized = searchTerm.toLowerCase();
    return challenges.filter((challenge) =>
      challenge.title.toLowerCase().includes(normalized)
      || challenge.description.toLowerCase().includes(normalized)
      || challenge.challenge_type.toLowerCase().includes(normalized)
    );
  }, [challenges, searchTerm]);

  const handleOpenDialog = (challenge: Challenge | null = null) => {
    setFormErrors({});
    if (challenge) {
      setEditingChallenge(challenge);
      setFormData({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        challenge_type: ['completion', 'streak', 'community'].includes(challenge.challenge_type)
          ? (challenge.challenge_type as ChallengeForm['challenge_type'])
          : 'completion',
        difficulty: ['easy', 'medium', 'hard'].includes(challenge.difficulty)
          ? (challenge.difficulty as ChallengeForm['difficulty'])
          : 'medium',
        reward: Number.isFinite(challenge.reward) ? challenge.reward : 0,
        is_active: Boolean(challenge.is_active),
      });
    } else {
      setEditingChallenge(null);
      setFormData(defaultForm);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setFormErrors({});

      const parsed = challengeSchema.parse(formData);
      const { id, ...challengePayload } = parsed;

      if (id) {
        const { error } = await supabase
          .from('content_challenges')
          .update(challengePayload)
          .eq('id', id);

        if (error) {
          throw error;
        }
      } else {
        const insertPayload: ChallengeInsert = {
          ...challengePayload,
        };

        const { error } = await supabase
          .from('content_challenges')
          .insert([insertPayload]);

        if (error) {
          throw error;
        }
      }

      toast({
        title: 'Success',
        description: `Challenge ${id ? 'updated' : 'created'} successfully`,
      });
      setIsDialogOpen(false);
      setFormData(defaultForm);
      fetchChallenges();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0 && typeof err.path[0] === 'string') {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(fieldErrors);
        toast({
          title: 'Validation error',
          description: 'Please review the highlighted fields.',
          variant: 'destructive',
        });
      } else {
        logger.error('Failed to save challenge', 'ContentChallengeManager', error);
        toast({
          title: 'Error',
          description: `Failed to save challenge: ${error.message ?? 'Unknown error'}`,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (challenge: Challenge) => {
    setChallengeToDelete(challenge);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!challengeToDelete) {
      toast({
        title: "Error",
        description: "No challenge selected for deletion",
        variant: "destructive",
      });
      return;
    }

    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('content_challenges')
        .delete()
        .eq('id', challengeToDelete.id);
      if (error) throw error;
      toast({ title: "Success", description: "Challenge deleted" });
      fetchChallenges();
    } catch (error: any) {
      logger.error('Failed to delete challenge', 'ContentChallengeManager', error);
      toast({
        title: "Error",
        description: `Failed to delete challenge: ${error.message}` ,
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setChallengeToDelete(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('content_challenges')
        .update({ is_active: !isActive })
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Challenge status updated" });
      fetchChallenges();
    } catch (error: any) {
      logger.error('Failed to toggle challenge status', 'ContentChallengeManager', error);
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
            <CardTitle>Content & Challenges</CardTitle>
            <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" />Add New Challenge</Button>
          </div>
          <CardDescription>Manage all content challenges and explorations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search challenges..."
            className="glass-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredChallenges.length === 0 && !loading && (
          <Card className="glass-strong">
            <CardContent className="py-10 text-center text-muted-foreground">
              No challenges match your search.
            </CardContent>
          </Card>
        )}

        {filteredChallenges.map(challenge => (
          <Card key={challenge.id} className="glass-strong">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{challenge.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{challenge.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{challenge.challenge_type}</Badge>
                  <Badge variant="secondary">{challenge.difficulty}</Badge>
                  <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> {challenge.reward}
                  </Badge>
                  <Badge variant={challenge.is_active ? 'default' : 'secondary'}>
                    {challenge.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(challenge.id, challenge.is_active)}>
                  {challenge.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(challenge)}><Edit className="w-4 h-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(challenge)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{editingChallenge ? 'Edit' : 'Create'} Challenge</DialogTitle>
            <DialogDescription>Fill in the details for the content challenge.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
              <Input value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} className="glass-input" />
              {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className="glass-input" />
              {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Challenge Type</Label>
                <Select value={formData.challenge_type} onValueChange={(value: ChallengeForm['challenge_type']) => setFormData(p => ({...p, challenge_type: value}))}>
                  <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completion">Completion</SelectItem>
                    <SelectItem value="streak">Streak</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.challenge_type && <p className="text-xs text-destructive">{formErrors.challenge_type}</p>}
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={formData.difficulty} onValueChange={(value: ChallengeForm['difficulty']) => setFormData(p => ({...p, difficulty: value}))}>
                  <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.difficulty && <p className="text-xs text-destructive">{formErrors.difficulty}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Crystal Reward</Label>
              <Input type="number" value={formData.reward} onChange={e => setFormData(p => ({...p, reward: Number(e.target.value)}))} className="glass-input" />
              {formErrors.reward && <p className="text-xs text-destructive">{formErrors.reward}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_active" checked={formData.is_active} onCheckedChange={c => setFormData(p => ({...p, is_active: c}))} />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}><X className="w-4 h-4 mr-2" />Cancel</Button>
            <Button onClick={handleSave} className="bg-gradient-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingChallenge ? 'Update' : 'Create'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete challenge</AlertDialogTitle>
            <AlertDialogDescription>
              {challengeToDelete
                ? `This will permanently remove "${challengeToDelete.title}" and its progress data.`
                : 'This will permanently remove the selected challenge.'}
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
