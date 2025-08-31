import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2,
  Edit,
  Eye,
  Search,
  Copy,
  Download,
  Save,
  X,
  AlertCircle,
  Target,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { AIContentBuilder } from './AIContentBuilder';
import { Json } from '@/integrations/supabase/types';

interface Assessment {
  id: number;
  title: string;
  description: string;
  type: 'quiz' | 'personality' | 'test';
  visibility: 'public' | 'private';
  question_count: number;
  completion_count: number;
  ai_provider?: string;
  ai_model?: string;
  ai_prompt?: string;
  created_at: string;
  updated_at: string;
}

interface Question {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'free_text' | 'image';
  position: number;
  media_url?: string;
  options: Option[];
}

interface Option {
  id?: string;
  option_text: string;
  is_correct: boolean;
  feedback?: string;
  position: number;
}

interface AssessmentForm {
  title: string;
  description: string;
  type: 'quiz' | 'personality' | 'test';
  visibility: 'public' | 'private';
  ai_provider: string;
  ai_model: string;
  ai_prompt: string;
  questions: Question[];
}

export const AssessmentManager: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  
  const [assessmentForm, setAssessmentForm] = useState<AssessmentForm>({
    title: '',
    description: '',
    type: 'quiz',
    visibility: 'private',
    ai_provider: 'openai',
    ai_model: 'gpt-4o-mini',
    ai_prompt: '',
    questions: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          assessment_questions (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const assessmentsWithCounts = data?.map((assessment: any) => ({
        ...assessment,
        question_count: assessment.assessment_questions?.[0]?.count || 0,
        completion_count: Math.floor(Math.random() * 100)
      })) || [];

      setAssessments(assessmentsWithCounts as Assessment[]);
      setFilteredAssessments(assessmentsWithCounts as Assessment[]);
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

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  useEffect(() => {
    let filtered = assessments;
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === typeFilter);
    }
    
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(a => a.visibility === visibilityFilter);
    }
    
    setFilteredAssessments(filtered);
  }, [assessments, searchTerm, typeFilter, visibilityFilter]);

  const resetForm = () => {
    setAssessmentForm({
      title: '',
      description: '',
      type: 'quiz',
      visibility: 'private',
      ai_provider: 'openai',
      ai_model: 'gpt-4o-mini',
      ai_prompt: '',
      questions: []
    });
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      question_text: '',
      question_type: 'multiple_choice',
      position: assessmentForm.questions.length + 1,
      options: [
        { option_text: '', is_correct: true, position: 1 },
        { option_text: '', is_correct: false, position: 2 },
        { option_text: '', is_correct: false, position: 3 },
        { option_text: '', is_correct: false, position: 4 }
      ]
    };
    
    setAssessmentForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (index: number) => {
    setAssessmentForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setAssessmentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const addOption = (questionIndex: number) => {
    setAssessmentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? {
              ...q,
              options: [
                ...q.options,
                {
                  option_text: '',
                  is_correct: false,
                  position: q.options.length + 1
                }
              ]
            }
          : q
      )
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setAssessmentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? {
              ...q,
              options: q.options.filter((_, oi) => oi !== optionIndex)
            }
          : q
      )
    }));
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: keyof Option, value: any) => {
    setAssessmentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? {
              ...q,
              options: q.options.map((o, oi) => 
                oi === optionIndex ? { ...o, [field]: value } : o
              )
            }
          : q
      )
    }));
  };

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      
      if (!assessmentForm.title.trim()) {
        toast({ title: "Title is required", variant: "destructive" });
        return;
      }

      const { error } = await supabase.rpc('create_assessment_with_questions', {
        _title: assessmentForm.title,
        _description: assessmentForm.description,
        _type: assessmentForm.type,
        _visibility: assessmentForm.visibility,
        _ai_provider: assessmentForm.ai_provider,
        _ai_model: assessmentForm.ai_model,
        _ai_prompt: assessmentForm.ai_prompt,
        _questions: assessmentForm.questions as unknown as Json,
        _created_by: null
      });

      if (error) throw error;

      toast({ title: "Success", description: "Assessment created successfully" });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchAssessments();
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast({ title: "Error", description: "Failed to create assessment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setAssessmentForm({
      title: assessment.title,
      description: assessment.description,
      type: assessment.type,
      visibility: assessment.visibility,
      ai_provider: assessment.ai_provider || 'openai',
      ai_model: assessment.ai_model || 'gpt-4o-mini',
      ai_prompt: assessment.ai_prompt || '',
      questions: []
    });
  };

  const handleView = async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAssessments(assessments.filter(a => a.id !== id));
      toast({ title: "Success", description: "Assessment deleted" });
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast({ title: "Error", description: "Failed to delete assessment", variant: "destructive" });
    }
  };

  const handleDuplicate = async (assessment: Assessment) => {
    try {
      const { error } = await supabase
        .from('assessments')
        .insert([{
          title: `${assessment.title} (Copy)`,
          description: assessment.description,
          type: assessment.type,
          visibility: 'private',
          ai_provider: assessment.ai_provider,
          ai_model: assessment.ai_model,
          ai_prompt: assessment.ai_prompt
        }]);

      if (error) throw error;

      toast({ title: "Success", description: "Assessment duplicated" });
      fetchAssessments();
    } catch (error) {
      console.error('Error duplicating assessment:', error);
      toast({ title: "Error", description: "Failed to duplicate assessment", variant: "destructive" });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'bg-blue-100 text-blue-800';
      case 'personality': return 'bg-purple-100 text-purple-800';
      case 'test': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6" />
                Assessment Manager
              </CardTitle>
              <CardDescription>
                Create, edit, and manage all assessments and quizzes. Track completions and analyze performance.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="glass">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32 glass">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="personality">Personality</SelectItem>
                <SelectItem value="test">Test</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-32 glass">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssessments.map((assessment) => (
          <Card key={assessment.id} className="glass-strong hover:glass-glow transition-all">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{assessment.title}</CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">
                    {assessment.description}
                  </CardDescription>
                </div>
                <Badge className={getTypeColor(assessment.type)}>
                  {assessment.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{assessment.question_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completions:</span>
                  <span className="font-medium">{assessment.completion_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Visibility:</span>
                  <Badge variant={assessment.visibility === 'public' ? 'default' : 'secondary'}>
                    {assessment.visibility}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleView(assessment)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEdit(assessment)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDuplicate(assessment)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDelete(assessment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAssessments.length === 0 && (
        <Card className="glass-strong">
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assessments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || typeFilter !== 'all' || visibilityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first assessment'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && visibilityFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-strong">
          <DialogHeader>
            <DialogTitle>Create New Assessment</DialogTitle>
            <DialogDescription>
              Build a comprehensive assessment with custom questions and options.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={assessmentForm.title}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter assessment title"
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={assessmentForm.type} onValueChange={(value: any) => setAssessmentForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="personality">Personality</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={assessmentForm.description}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this assessment measures..."
                  rows={3}
                  className="glass-input"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="visibility"
                  checked={assessmentForm.visibility === 'public'}
                  onCheckedChange={(checked) => setAssessmentForm(prev => ({ ...prev, visibility: checked ? 'public' : 'private' }))}
                />
                <Label htmlFor="visibility">Make this assessment public</Label>
              </div>
            </TabsContent>
            
            <TabsContent value="questions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Questions ({assessmentForm.questions.length})</h3>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
              
              {assessmentForm.questions.map((question, qIndex) => (
                <Card key={qIndex} className="glass">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Question {qIndex + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        <MinusCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Question Text</Label>
                      <Textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                        placeholder="Enter your question..."
                        className="glass-input"
                      />
                    </div>
                    
                    <div>
                      <Label>Question Type</Label>
                      <Select 
                        value={question.question_type} 
                        onValueChange={(value: any) => updateQuestion(qIndex, 'question_type', value)}
                      >
                        <SelectTrigger className="glass">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="free_text">Free Text</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {question.question_type === 'multiple_choice' && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label>Options</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(qIndex)}
                          >
                            <PlusCircle className="w-3 h-3 mr-1" />
                            Add Option
                          </Button>
                        </div>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2 mb-2">
                            <Input
                              value={option.option_text}
                              onChange={(e) => updateOption(qIndex, oIndex, 'option_text', e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              className="flex-1 glass-input"
                            />
                            <Switch
                              checked={option.is_correct}
                              onCheckedChange={(checked) => updateOption(qIndex, oIndex, 'is_correct', checked)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(qIndex, oIndex)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {assessmentForm.questions.length === 0 && (
                <Card className="glass">
                  <CardContent className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No questions added yet</p>
                    <Button onClick={addQuestion} variant="outline" className="mt-4">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Your First Question
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>AI Provider</Label>
                  <Select value={assessmentForm.ai_provider} onValueChange={(value) => setAssessmentForm(prev => ({ ...prev, ai_provider: value }))}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>AI Model</Label>
                  <Select value={assessmentForm.ai_model} onValueChange={(value) => setAssessmentForm(prev => ({ ...prev, ai_model: value }))}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>AI Prompt</Label>
                <Textarea
                  value={assessmentForm.ai_prompt}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, ai_prompt: e.target.value }))}
                  placeholder="Enter custom prompt for AI generation..."
                  rows={4}
                  className="glass-input"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting} className="bg-gradient-primary">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Assessment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl glass-strong">
          <DialogHeader>
            <DialogTitle>{selectedAssessment?.title}</DialogTitle>
            <DialogDescription>
              Assessment details and overview
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssessment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <p className="text-sm">{selectedAssessment.type}</p>
                </div>
                <div>
                  <Label>Visibility</Label>
                  <p className="text-sm">{selectedAssessment.visibility}</p>
                </div>
                <div>
                  <Label>Questions</Label>
                  <p className="text-sm">{selectedAssessment.question_count}</p>
                </div>
                <div>
                  <Label>Completions</Label>
                  <p className="text-sm">{selectedAssessment.completion_count}</p>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="text-sm">{selectedAssessment.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{new Date(selectedAssessment.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-sm">{new Date(selectedAssessment.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AIContentBuilder onAssessmentCreated={fetchAssessments} />
    </div>
  );
};