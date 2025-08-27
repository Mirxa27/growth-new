import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash, Save, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Exploration = Database['public']['Tables']['explorations']['Row'];
type ExplorationInsert = Database['public']['Tables']['explorations']['Insert'];

export const ExplorationManager = () => {
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<ExplorationInsert>>({
    title: '',
    description: '',
    category: 'self-discovery',
    difficulty_level: 'beginner',
    facilitator_prompt: '',
    higher_self_prompt: '',
    questions: [],
    analysis_structure: {},
    estimated_duration: 30,
    crystal_reward: 100,
    is_active: true
  });

  useEffect(() => {
    fetchExplorations();
  }, []);

  const fetchExplorations = async () => {
    try {
      const { data, error } = await supabase
        .from('explorations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExplorations(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching explorations",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.facilitator_prompt || !formData.higher_self_prompt) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const saveData: ExplorationInsert = {
        title: formData.title!,
        description: formData.description!,
        category: formData.category || 'self-discovery',
        difficulty_level: formData.difficulty_level || 'beginner',
        facilitator_prompt: formData.facilitator_prompt!,
        higher_self_prompt: formData.higher_self_prompt!,
        questions: Array.isArray(formData.questions) ? formData.questions : [],
        analysis_structure: formData.analysis_structure || {},
        estimated_duration: formData.estimated_duration || 30,
        crystal_reward: formData.crystal_reward || 100,
        is_active: formData.is_active !== undefined ? formData.is_active : true
      };

      if (editingId) {
        const { error } = await supabase
          .from('explorations')
          .update(saveData)
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: "Exploration updated successfully" });
      } else {
        const { error } = await supabase
          .from('explorations')
          .insert(saveData);

        if (error) throw error;
        toast({ title: "Exploration created successfully" });
      }

      resetForm();
      fetchExplorations();
    } catch (error: any) {
      toast({
        title: "Error saving exploration",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (exploration: Exploration) => {
    setFormData({
      title: exploration.title,
      description: exploration.description,
      category: exploration.category,
      difficulty_level: exploration.difficulty_level,
      facilitator_prompt: exploration.facilitator_prompt,
      higher_self_prompt: exploration.higher_self_prompt,
      questions: Array.isArray(exploration.questions) ? exploration.questions as string[] : [],
      analysis_structure: exploration.analysis_structure || {},
      estimated_duration: exploration.estimated_duration,
      crystal_reward: exploration.crystal_reward,
      is_active: exploration.is_active
    });
    setEditingId(exploration.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exploration?')) return;

    try {
      const { error } = await supabase
        .from('explorations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Exploration deleted successfully" });
      fetchExplorations();
    } catch (error: any) {
      toast({
        title: "Error deleting exploration",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'self-discovery',
      difficulty_level: 'beginner',
      facilitator_prompt: '',
      higher_self_prompt: '',
      questions: [],
      analysis_structure: {},
      estimated_duration: 30,
      crystal_reward: 100,
      is_active: true
    });
    setEditingId(null);
    setShowCreateForm(false);
  };

  const updateQuestions = (questions: string[]) => {
    setFormData(prev => ({ ...prev, questions }));
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading explorations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exploration Management</h2>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Exploration
        </Button>
      </div>

      {showCreateForm && (
        <Card className="glass-card border-glass">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingId ? 'Edit Exploration' : 'Create New Exploration'}
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Exploration title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category || 'self-discovery'}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="self-discovery">Self Discovery</option>
                  <option value="relationships">Relationships</option>
                  <option value="career">Career</option>
                  <option value="healing">Healing</option>
                  <option value="spirituality">Spirituality</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Exploration description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <select
                  value={formData.difficulty_level || 'beginner'}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duration (min)</label>
                <Input
                  type="number"
                  value={formData.estimated_duration || 30}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Crystal Reward</label>
                <Input
                  type="number"
                  value={formData.crystal_reward || 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, crystal_reward: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Facilitator Prompt *</label>
              <Textarea
                value={formData.facilitator_prompt || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, facilitator_prompt: e.target.value }))}
                placeholder="System prompt for the facilitator phase"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Higher Self Prompt *</label>
              <Textarea
                value={formData.higher_self_prompt || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, higher_self_prompt: e.target.value }))}
                placeholder="System prompt for the analysis phase"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Questions</label>
              <div className="space-y-2">
                {(formData.questions as string[] || []).map((question, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={question}
                      onChange={(e) => {
                        const newQuestions = [...(formData.questions as string[] || [])];
                        newQuestions[index] = e.target.value;
                        updateQuestions(newQuestions);
                      }}
                      placeholder={`Question ${index + 1}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newQuestions = (formData.questions as string[] || []).filter((_, i) => i !== index);
                        updateQuestions(newQuestions);
                      }}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => updateQuestions([...(formData.questions as string[] || []), ''])}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {explorations.map((exploration) => (
          <Card key={exploration.id} className="glass-card border-glass">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-2">{exploration.title}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(exploration)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(exploration.id)}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-3">{exploration.description}</p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{exploration.category}</Badge>
                <Badge variant="outline">{exploration.difficulty_level}</Badge>
                {exploration.is_active ? (
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-300">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{exploration.estimated_duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reward:</span>
                  <span>{exploration.crystal_reward} crystals</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span>{Array.isArray(exploration.questions) ? exploration.questions.length : 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {explorations.length === 0 && (
        <Card className="glass-card border-glass">
          <CardContent className="text-center py-12">
            <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No explorations found</h3>
            <p className="text-muted-foreground mb-4">Create your first exploration to get started</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Exploration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};