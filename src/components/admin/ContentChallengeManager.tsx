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
  Trophy,
  Eye,
  EyeOff
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type Challenge = Tables<'content_challenges'>;
type ChallengeInsert = TablesInsert<'content_challenges'>;

export const ContentChallengeManager: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState<Partial<ChallengeInsert>>({});
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

  const handleOpenDialog = (challenge: Challenge | null = null) => {
    setEditingChallenge(challenge);
    setFormData(challenge ? { ...challenge } : { 
      title: '', 
      description: '', 
      challenge_type: 'completion', 
      difficulty: 'medium', 
      reward: 100, 
      is_active: false 
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('content_challenges')
        .upsert([formData as ChallengeInsert]);
      if (error) throw error;
      toast({ title: "Success", description: `Challenge ${editingChallenge ? 'updated' : 'created'}` });
      setIsDialogOpen(false);
      fetchChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save challenge: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;
    try {
      const { error } = await supabase
        .from('content_challenges')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Challenge deleted" });
      fetchChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete challenge: ${error.message}`,
        variant: "destructive"
      });
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
          <Input placeholder="Search challenges..." className="glass-input" />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {challenges.map(challenge => (
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
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(challenge.id, challenge.is_active)}>
                  {challenge.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(challenge)}><Edit className="w-4 h-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(challenge.id)}><Trash2 className="w-4 h-4" /></Button>
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
              <Input value={formData.title || ''} onChange={e => setFormData(p => ({...p, title: e.target.value}))} className="glass-input" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description || ''} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className="glass-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Challenge Type</Label>
                <Select value={formData.challenge_type} onValueChange={(v: any) => setFormData(p => ({...p, challenge_type: v}))}>
                  <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completion">Completion</SelectItem>
                    <SelectItem value="streak">Streak</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={formData.difficulty} onValueChange={(v: any) => setFormData(p => ({...p, difficulty: v}))}>
                  <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Crystal Reward</Label>
              <Input type="number" value={formData.reward || 0} onChange={e => setFormData(p => ({...p, reward: Number(e.target.value)}))} className="glass-input" />
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