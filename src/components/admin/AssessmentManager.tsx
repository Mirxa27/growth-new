import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  BarChart3,
  Target,
  Globe,
  Lock,
  Brain,
  HelpCircle
} from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'personality' | 'quiz' | 'survey';
  visibility: 'public' | 'private';
  ai_provider?: string;
  ai_model?: string;
  ai_prompt?: string;
  created_at: string;
  question_count?: number;
  completion_count?: number;
}

interface NewAssessment {
  title: string;
  description: string;
  type: 'personality' | 'quiz' | 'survey';
  visibility: 'public' | 'private';
  ai_provider: string;
  ai_model: string;
  ai_prompt: string;
}

export const AssessmentManager: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const { toast } = useToast();

  const [newAssessment, setNewAssessment] = useState<NewAssessment>({
    title: '',
    description: '',
    type: 'personality',
    visibility: 'public',
    ai_provider: 'openai',
    ai_model: 'gpt-4o-mini',
    ai_prompt: ''
  });

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const fetchAssessments = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          assessment_questions(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const assessmentsWithCounts = data?.map(assessment => ({
        ...assessment,
        question_count: assessment.assessment_questions?.[0]?.count || 0,
        completion_count: Math.floor(Math.random() * 100) // Mock completion count
      })) || [];

      setAssessments(assessmentsWithCounts);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assessments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleCreateAssessment = async () => {
    if (!newAssessment.title || !newAssessment.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('assessments')
        .insert([newAssessment]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assessment created successfully",
      });

      setIsCreateDialogOpen(false);
      setNewAssessment({
        title: '',
        description: '',
        type: 'personality',
        visibility: 'public',
        ai_provider: 'openai',
        ai_model: 'gpt-4o-mini',
        ai_prompt: ''
      });
      fetchAssessments();
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast({
        title: "Error",
        description: "Failed to create assessment",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assessment deleted successfully",
      });
      fetchAssessments();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to delete assessment",
        variant: "destructive"
      });
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || assessment.type === filterType;
    const matchesVisibility = filterVisibility === 'all' || assessment.visibility === filterVisibility;
    
    return matchesSearch && matchesType && matchesVisibility;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personality':
        return <Brain className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
      case 'survey':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'public' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{assessments.length}</p>
                <p className="text-xs text-muted-foreground">Total Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {assessments.filter(a => a.visibility === 'public').length}
                </p>
                <p className="text-xs text-muted-foreground">Public</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {assessments.filter(a => a.visibility === 'private').length}
                </p>
                <p className="text-xs text-muted-foreground">Private</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {assessments.reduce((sum, a) => sum + (a.completion_count || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Completions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assessment Management</CardTitle>
              <CardDescription>Create and manage assessments for your platform</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Assessment</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Assessment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={newAssessment.title}
                        onChange={(e) => setNewAssessment({...newAssessment, title: e.target.value})}
                        placeholder="Assessment title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select 
                        value={newAssessment.type} 
                        onValueChange={(value: 'personality' | 'quiz' | 'survey') => 
                          setNewAssessment({...newAssessment, type: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personality">Personality</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="survey">Survey</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={newAssessment.description}
                      onChange={(e) => setNewAssessment({...newAssessment, description: e.target.value})}
                      placeholder="Describe what this assessment measures"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select 
                        value={newAssessment.visibility} 
                        onValueChange={(value: 'public' | 'private') => 
                          setNewAssessment({...newAssessment, visibility: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public (No signup required)</SelectItem>
                          <SelectItem value="private">Private (Login required)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ai_model">AI Model</Label>
                      <Select 
                        value={newAssessment.ai_model} 
                        onValueChange={(value) => setNewAssessment({...newAssessment, ai_model: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="ai_prompt">AI Generation Prompt</Label>
                    <Textarea
                      id="ai_prompt"
                      value={newAssessment.ai_prompt}
                      onChange={(e) => setNewAssessment({...newAssessment, ai_prompt: e.target.value})}
                      placeholder="Prompt for AI to generate assessment questions"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAssessment}>
                      Create Assessment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="personality">Personality</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="survey">Survey</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterVisibility} onValueChange={setFilterVisibility}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssessments.map((assessment) => (
          <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getTypeIcon(assessment.type)}
                    <Badge variant="outline" className="text-xs">
                      {assessment.type}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getVisibilityIcon(assessment.visibility)}
                      <Badge variant={assessment.visibility === 'public' ? 'secondary' : 'default'} className="text-xs">
                        {assessment.visibility}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{assessment.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-3 mb-4">
                {assessment.description}
              </CardDescription>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{assessment.question_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{assessment.completion_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Completions</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  {new Date(assessment.created_at).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteAssessment(assessment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAssessments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assessments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== 'all' || filterVisibility !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Create your first assessment to get started.'
              }
            </p>
            {!searchTerm && filterType === 'all' && filterVisibility === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assessment
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};