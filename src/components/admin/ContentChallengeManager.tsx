import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Users,
  Target
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { adminService } from '@/services/admin/comprehensive-admin.service';
import { CreateContentChallengeSchema, CreateContentChallenge } from '@/schemas/admin.schemas';
import { AdminError } from '@/services/admin/admin-error-handler.service';
import { format } from 'date-fns';

type Challenge = Tables<'content_challenges'> & {
  participants_count?: number;
  completions_count?: number;
};

interface ChallengeFormData extends Omit<CreateContentChallenge, 'start_date' | 'end_date'> {
  start_date?: string;
  end_date?: string;
}

export const ContentChallengeManager: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    challenge_type: 'completion',
    difficulty: 'beginner',
    duration_days: 7,
    points_reward: 100,
    badge_reward: '',
    requirements: {},
    content: {},
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('list');
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
    setFormErrors({});
    
    if (challenge) {
      setFormData({
        ...challenge,
        start_date: challenge.start_date ? format(new Date(challenge.start_date), 'yyyy-MM-dd') : undefined,
        end_date: challenge.end_date ? format(new Date(challenge.end_date), 'yyyy-MM-dd') : undefined,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        challenge_type: 'completion',
        difficulty: 'beginner',
        duration_days: 7,
        points_reward: 100,
        badge_reward: '',
        requirements: {},
        content: {},
        is_active: true,
      });
    }
    
    setIsDialogOpen(true);
    setActiveTab('basic');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFormErrors({});
      
      // Transform form data to match schema
      const challengeData: CreateContentChallenge = {
        title: formData.title || '',
        description: formData.description || '',
        challenge_type: formData.challenge_type || 'completion',
        difficulty: formData.difficulty || 'beginner',
        duration_days: Number(formData.duration_days) || 7,
        points_reward: Number(formData.points_reward) || 0,
        badge_reward: formData.badge_reward || undefined,
        requirements: formData.requirements || {},
        content: formData.content || {},
        is_active: formData.is_active !== false,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
      };
      
      const result = await adminService.createContentChallenge(challengeData);
      
      toast({ 
        title: "Challenge Created", 
        description: result.message,
        duration: 3000
      });
      
      setIsDialogOpen(false);
      await fetchChallenges(); // Refresh the list
      
    } catch (error) {
      if (error instanceof AdminError) {
        if (error.code === 'VALIDATION_ERROR' && error.details?.validationErrors) {
          const fieldErrors: Record<string, string> = {};
          error.details.validationErrors.forEach((validationError: any) => {
            fieldErrors[validationError.field] = validationError.message;
          });
          setFormErrors(fieldErrors);
          
          toast({
            title: "Validation Error",
            description: "Please check the form for errors",
            variant: "destructive",
            duration: 5000
          });
        } else {
          toast({ 
            title: "Save Failed", 
            description: error.userMessage || 'Failed to save content challenge',
            variant: "destructive",
            duration: 5000
          });
        }
      } else {
        console.error('Unexpected error saving challenge:', error);
        toast({ 
          title: "Unexpected Error", 
          description: 'An unexpected error occurred. Please try again.', 
          variant: "destructive",
          duration: 5000
        });
      }
    } finally {
      setSaving(false);
    }
  };
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
