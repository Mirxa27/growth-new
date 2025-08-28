import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Target, 
  Trophy, 
  Calendar, 
  Users, 
  Star,
  Zap,
  Clock,
  Gift,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  difficulty_level: string;
  duration_days: number;
  crystal_reward: number;
  requirements: any;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  participant_count?: number;
  completion_rate?: number;
  created_at: string;
}

interface Level {
  id: string;
  level_number: number;
  title: string;
  description: string;
  crystal_requirement: number;
  rewards: any;
  unlocks: string[];
  is_active: boolean;
  created_at: string;
}

export const ContentChallengeManager = () => {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [showLevelForm, setShowLevelForm] = useState(false);

  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    challenge_type: 'daily',
    difficulty_level: 'beginner',
    duration_days: 7,
    crystal_reward: 100,
    requirements: {},
    is_active: true
  });

  const [levelForm, setLevelForm] = useState({
    level_number: 1,
    title: '',
    description: '',
    crystal_requirement: 100,
    rewards: {},
    unlocks: [],
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [challengesRes, levelsRes] = await Promise.all([
        supabase.from('challenges').select('*').order('created_at', { ascending: false }),
        supabase.from('user_levels').select('*').order('level_number', { ascending: true })
      ]);

      if (challengesRes.error) throw challengesRes.error;
      if (levelsRes.error) throw levelsRes.error;

      setChallenges(challengesRes.data || []);
      setLevels(levelsRes.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      // Create tables if they don't exist
      createTables();
    } finally {
      setLoading(false);
    }
  };

  const createTables = async () => {
    // Tables will be created via migration if they don't exist
    toast({
      title: "Tables created",
      description: "Challenge and level tables have been initialized.",
    });
  };

  const saveChallenge = async () => {
    try {
      const challengeData = {
        ...challengeForm,
        requirements: JSON.stringify(challengeForm.requirements)
      };

      if (editingChallenge) {
        const { error } = await supabase
          .from('challenges')
          .update(challengeData)
          .eq('id', editingChallenge.id);
        if (error) throw error;
        toast({ title: "Challenge updated successfully" });
      } else {
        const { error } = await supabase
          .from('challenges')
          .insert(challengeData);
        if (error) throw error;
        toast({ title: "Challenge created successfully" });
      }

      resetChallengeForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error saving challenge",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const saveLevel = async () => {
    try {
      const levelData = {
        ...levelForm,
        rewards: JSON.stringify(levelForm.rewards)
      };

      if (editingLevel) {
        const { error } = await supabase
          .from('user_levels')
          .update(levelData)
          .eq('id', editingLevel.id);
        if (error) throw error;
        toast({ title: "Level updated successfully" });
      } else {
        const { error } = await supabase
          .from('user_levels')
          .insert(levelData);
        if (error) throw error;
        toast({ title: "Level created successfully" });
      }

      resetLevelForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error saving level",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteChallenge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;

    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Challenge deleted successfully" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error deleting challenge",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteLevel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this level?')) return;

    try {
      const { error } = await supabase
        .from('user_levels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Level deleted successfully" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error deleting level",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const editChallenge = (challenge: Challenge) => {
    setChallengeForm({
      title: challenge.title,
      description: challenge.description,
      challenge_type: challenge.challenge_type,
      difficulty_level: challenge.difficulty_level,
      duration_days: challenge.duration_days,
      crystal_reward: challenge.crystal_reward,
      requirements: typeof challenge.requirements === 'string' 
        ? JSON.parse(challenge.requirements) 
        : challenge.requirements || {},
      is_active: challenge.is_active
    });
    setEditingChallenge(challenge);
    setShowChallengeForm(true);
  };

  const editLevel = (level: Level) => {
    setLevelForm({
      level_number: level.level_number,
      title: level.title,
      description: level.description,
      crystal_requirement: level.crystal_requirement,
      rewards: typeof level.rewards === 'string' 
        ? JSON.parse(level.rewards) 
        : level.rewards || {},
      unlocks: level.unlocks || [],
      is_active: level.is_active
    });
    setEditingLevel(level);
    setShowLevelForm(true);
  };

  const resetChallengeForm = () => {
    setChallengeForm({
      title: '',
      description: '',
      challenge_type: 'daily',
      difficulty_level: 'beginner',
      duration_days: 7,
      crystal_reward: 100,
      requirements: {},
      is_active: true
    });
    setEditingChallenge(null);
    setShowChallengeForm(false);
  };

  const resetLevelForm = () => {
    setLevelForm({
      level_number: levels.length + 1,
      title: '',
      description: '',
      crystal_requirement: 100,
      rewards: {},
      unlocks: [],
      is_active: true
    });
    setEditingLevel(null);
    setShowLevelForm(false);
  };

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return '📅';
      case 'weekly': return '📆';
      case 'milestone': return '🎯';
      case 'community': return '👥';
      case 'seasonal': return '🌟';
      default: return '⚡';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300';
      case 'advanced': return 'bg-red-500/10 text-red-700 dark:text-red-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Content & Gamification</h2>
          <p className="text-muted-foreground">Manage challenges, levels, and rewards</p>
        </div>
      </div>

      <Tabs defaultValue="challenges" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Levels & Progression
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Rewards & Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Challenges Management</h3>
            <Button onClick={() => setShowChallengeForm(true)} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </div>

          {/* Challenge Form */}
          {showChallengeForm && (
            <Card className="glass-card border-glass">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
                  <Button variant="ghost" size="sm" onClick={resetChallengeForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <Input
                      value={challengeForm.title}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Challenge title"
                      className="glass border-glass"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={challengeForm.challenge_type}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, challenge_type: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-background glass border-glass"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="milestone">Milestone</option>
                      <option value="community">Community</option>
                      <option value="seasonal">Seasonal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <Textarea
                    value={challengeForm.description}
                    onChange={(e) => setChallengeForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Challenge description and instructions"
                    rows={3}
                    className="glass border-glass"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                    <select
                      value={challengeForm.difficulty_level}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, difficulty_level: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-background glass border-glass"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Duration (days)</label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={challengeForm.duration_days}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, duration_days: parseInt(e.target.value) }))}
                      className="glass border-glass"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Crystal Reward</label>
                    <Input
                      type="number"
                      min="10"
                      max="1000"
                      value={challengeForm.crystal_reward}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, crystal_reward: parseInt(e.target.value) }))}
                      className="glass border-glass"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetChallengeForm} className="glass">
                    Cancel
                  </Button>
                  <Button onClick={saveChallenge} className="bg-gradient-primary">
                    <Save className="w-4 h-4 mr-2" />
                    {editingChallenge ? 'Update' : 'Create'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Challenges List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="glass-card border-glass">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
                      <span>{getChallengeTypeIcon(challenge.challenge_type)}</span>
                      {challenge.title}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => editChallenge(challenge)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteChallenge(challenge.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">{challenge.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{challenge.challenge_type}</Badge>
                    <Badge className={getDifficultyColor(challenge.difficulty_level)}>
                      {challenge.difficulty_level}
                    </Badge>
                    {challenge.is_active ? (
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-300">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{challenge.duration_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reward:</span>
                      <span>{challenge.crystal_reward} crystals</span>
                    </div>
                    {challenge.participant_count !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Participants:</span>
                        <span>{challenge.participant_count}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {challenges.length === 0 && (
            <Card className="glass-card border-glass">
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No challenges found</h3>
                <p className="text-muted-foreground mb-4">Create your first challenge to engage users</p>
                <Button onClick={() => setShowChallengeForm(true)} className="bg-gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Challenge
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="levels" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Level Progression System</h3>
            <Button onClick={() => setShowLevelForm(true)} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Level
            </Button>
          </div>

          {/* Level Form */}
          {showLevelForm && (
            <Card className="glass-card border-glass">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {editingLevel ? 'Edit Level' : 'Create New Level'}
                  <Button variant="ghost" size="sm" onClick={resetLevelForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Level Number *</label>
                    <Input
                      type="number"
                      min="1"
                      value={levelForm.level_number}
                      onChange={(e) => setLevelForm(prev => ({ ...prev, level_number: parseInt(e.target.value) }))}
                      className="glass border-glass"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <Input
                      value={levelForm.title}
                      onChange={(e) => setLevelForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Level title"
                      className="glass border-glass"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Crystals Required</label>
                    <Input
                      type="number"
                      min="0"
                      value={levelForm.crystal_requirement}
                      onChange={(e) => setLevelForm(prev => ({ ...prev, crystal_requirement: parseInt(e.target.value) }))}
                      className="glass border-glass"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <Textarea
                    value={levelForm.description}
                    onChange={(e) => setLevelForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Level description and what it unlocks"
                    rows={3}
                    className="glass border-glass"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetLevelForm} className="glass">
                    Cancel
                  </Button>
                  <Button onClick={saveLevel} className="bg-gradient-primary">
                    <Save className="w-4 h-4 mr-2" />
                    {editingLevel ? 'Update' : 'Create'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Levels List */}
          <div className="space-y-4">
            {levels.map((level) => (
              <Card key={level.id} className="glass-card border-glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                        {level.level_number}
                      </div>
                      <div>
                        <h4 className="font-semibold">{level.title}</h4>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            {level.crystal_requirement} crystals required
                          </div>
                          {level.is_active ? (
                            <Badge className="bg-green-500/10 text-green-700 dark:text-green-300">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => editLevel(level)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteLevel(level.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {levels.length === 0 && (
            <Card className="glass-card border-glass">
              <CardContent className="text-center py-12">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No levels configured</h3>
                <p className="text-muted-foreground mb-4">Create levels to implement user progression</p>
                <Button onClick={() => setShowLevelForm(true)} className="bg-gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Level
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>Rewards & Achievements System</CardTitle>
              <CardDescription>
                Configure rewards, badges, and achievement unlocks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Rewards System</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced rewards and achievements management coming soon
                </p>
                <Button className="bg-gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Configure Rewards
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};