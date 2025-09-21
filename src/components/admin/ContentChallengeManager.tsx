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
  EyeOff,
  Sparkles,
  Brain,
  Wand2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { CreateLibraryItemSchema, validateData } from '@/lib/validation-dtos';
import { errorHandler } from '@/lib/error-handler';
import { logger } from '@/utils/logger';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type Challenge = Tables<'content_challenges'>;
type ChallengeInsert = TablesInsert<'content_challenges'>;

export const ContentChallengeManager: React.FC = () => {
  const { isAdmin, verified } = useAdminAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState<Partial<ChallengeInsert>>({});
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGeneratedContent, setAiGeneratedContent] = useState<any>(null);
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

  const generateAIContent = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "AI Prompt Required",
        description: "Please describe the content challenge you want to create.",
        variant: "destructive"
      });
      return;
    }

    setAiGenerating(true);
    try {
      const response = await supabase.functions.invoke('ai-content-challenge-generator', {
        body: {
          prompt: aiPrompt,
          challenge_type: formData.challenge_type || 'completion',
          difficulty: formData.difficulty || 'medium',
          target_audience: 'general'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data) {
        setAiGeneratedContent(response.data);
        
        // Auto-populate form with generated content
        setFormData(prev => ({
          ...prev,
          title: response.data.title || prev.title,
          description: response.data.description || prev.description,
          challenge_type: response.data.challenge_type || prev.challenge_type,
          difficulty: response.data.difficulty || prev.difficulty,
          reward: response.data.reward || prev.reward
        }));

        logger.info('AI content challenge generated successfully', 'ContentChallengeManager', {
          type: response.data.challenge_type,
          difficulty: response.data.difficulty
        });

        toast({
          title: "AI Content Generated",
          description: "Review and customize the generated challenge content.",
        });
      }
    } catch (error) {
      const appError = errorHandler.handleError(error, 'ContentChallengeManager');
      logger.error('AI content generation failed', 'ContentChallengeManager', appError);
      
      toast({
        title: "AI Generation Failed",
        description: errorHandler.getUserFriendlyMessage(appError),
        variant: "destructive"
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate the challenge data
      const challengeData = {
        title: formData.title || '',
        description: formData.description || '',
        challenge_type: formData.challenge_type || 'completion',
        difficulty: formData.difficulty || 'medium',
        reward: formData.reward || 100,
        is_active: formData.is_active || false
      };

      const validatedData = validateData(CreateLibraryItemSchema, {
        title: challengeData.title,
        description: challengeData.description,
        type: 'document',
        category: 'challenge',
        content: JSON.stringify({
          challenge_type: challengeData.challenge_type,
          difficulty: challengeData.difficulty,
          reward: challengeData.reward,
          ai_generated: !!aiGeneratedContent
        }),
        visibility: 'public',
        metadata: {
          ai_prompt: aiPrompt,
          ai_generated_content: aiGeneratedContent
        }
      });

      const { error } = await supabase
        .from('content_challenges')
        .upsert([{
          ...challengeData,
          ai_generated: !!aiGeneratedContent,
          ai_prompt: aiPrompt || null,
          metadata: validatedData.metadata
        } as ChallengeInsert]);

      if (error) throw error;

      logger.info('Content challenge saved successfully', 'ContentChallengeManager', {
        title: challengeData.title,
        type: challengeData.challenge_type
      });

      toast({ 
        title: "Success", 
        description: `Challenge ${editingChallenge ? 'updated' : 'created'} successfully` 
      });
      setIsDialogOpen(false);
      fetchChallenges();
    } catch (error) {
      const appError = errorHandler.handleError(error, 'ContentChallengeManager');
      logger.error('Challenge save failed', 'ContentChallengeManager', appError);
      
      toast({
        title: "Save Failed",
        description: errorHandler.getUserFriendlyMessage(appError),
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

  if (!isAdmin) {
    return (
      <Card className="glass-strong">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You need admin privileges to access the Content Challenge Manager.
          </p>
        </CardContent>
      </Card>
    );
  }

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
        <DialogContent className="glass-strong max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingChallenge ? 'Edit' : 'Create'} Challenge
              <Badge variant="outline" className="bg-primary/10">
                <Brain className="h-4 w-4 mr-1" />
                AI-Powered
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Create engaging content challenges with AI assistance or build them manually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* AI Generation Section */}
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Content Generation
                </CardTitle>
                <CardDescription>
                  Describe the challenge you want to create and let AI generate the content for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>AI Prompt</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Create a 7-day mindfulness challenge that helps users develop a daily meditation practice with progressive difficulty levels..."
                    className="glass-input min-h-20"
                  />
                </div>
                <Button
                  onClick={generateAIContent}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="w-full bg-gradient-primary"
                >
                  {aiGenerating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Wand2 className="h-4 w-4 mr-2" /> Generate with AI</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Manual Form Section */}
            <div className="space-y-4">
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
