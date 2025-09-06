import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Save, Plus, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Assessment } from '@/types/assessment';
// Removed react-hook-form and zod imports (unused in current implementation)

interface AIAssessmentBuilderProps {
  assessment?: Assessment;
  onSave?: (assessment: Assessment) => void;
  onCancel?: () => void;
}

interface Question {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  options?: string[];
  scale?: { min: number; max: number; labels: string[] };
  category?: string;
  required: boolean;
}

interface ScoringConfig {
  type: 'cumulative' | 'categorical' | 'personality';
  categories?: string[];
  interpretation?: Record<string, unknown>;
}

interface AssessmentResults {
  summary: string;
  insights: unknown[];
  recommendations: unknown[];
}

interface GeneratedAssessment {
  title?: string;
  description?: string;
  questions?: Question[];
  scoring?: ScoringConfig;
  results?: AssessmentResults;
}

export const AIAssessmentBuilder: React.FC<AIAssessmentBuilderProps> = ({
  assessment,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState(assessment?.title || '');
  const [description, setDescription] = useState(assessment?.description || '');
  const [type, setType] = useState(assessment?.type || 'personality');
  const [category, setCategory] = useState(assessment?.category || 'self-discovery');
  const [visibility, setVisibility] = useState<'public' | 'users' | 'premium'>(assessment?.visibility || 'public');
  const [estimatedTime, setEstimatedTime] = useState(assessment?.estimatedTime || 10);
  const [questions, setQuestions] = useState<Question[]>(
    (assessment?.questions?.map((q: any) => ({
      id: q.id || '',
      text: q.text || '',
      type: q.type || 'text',
      options: q.options || [],
      scale: q.scale || undefined,
      category: q.category || '',
      required: q.required ?? true,
    })) as Question[]) || []
  );
  const [scoring, setScoring] = useState<ScoringConfig>(assessment?.scoring || { type: 'categorical' });
  const [results, setResults] = useState<AssessmentResults>((assessment?.results as unknown as AssessmentResults) || { summary: '', insights: [], recommendations: [] });
  
  // AI generation state
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiGeneratedContent, setAIGeneratedContent] = useState<GeneratedAssessment | null>(null);

  const assessmentTypes = [
    'personality', 'career', 'mental-health', 'relationships', 'skills', 'wellness',
    'productivity', 'learning', 'leadership', 'creativity', 'emotional-intelligence'
  ];

  const categories = [
    'self-discovery', 'professional-development', 'mental-health', 'relationships',
    'education', 'personal-development', 'social-skills', 'lifestyle', 'health'
  ];

  const generateAIAssessment = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "AI Prompt Required",
        description: "Please describe the assessment you want to create.",
        variant: "destructive"
      });
      return;
    }

    setAILoading(true);
    try {
      const response = await supabase.functions.invoke('create-assessment', {
        body: {
          type: type,
          topic: aiPrompt,
          difficulty: 'medium',
          target_audience: 'general',
          question_count: 5
        }
      });

      if (response.data) {
        const gen = response.data as Partial<GeneratedAssessment>;
        setAIGeneratedContent(gen as GeneratedAssessment);
        setTitle((gen.title ?? title) as string);
        setDescription((gen.description ?? description) as string);
        setQuestions((gen.questions ?? questions) as Question[]);
        setScoring((gen.scoring ?? scoring) as ScoringConfig);
        setResults((gen.results ?? results) as AssessmentResults);
        
        toast({
          title: "AI Assessment Generated",
          description: "Review and customize the generated content as needed.",
        });
      }
    } catch (error) {
      toast({
        title: "AI Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate assessment",
        variant: "destructive"
      });
    } finally {
      setAILoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      text: '',
      type: 'single',
      options: ['Option 1', 'Option 2', 'Option 3'],
      required: true
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const duplicateQuestion = (id: string) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      const newQuestion = { ...question, id: `q${Date.now()}` };
      setQuestions([...questions, newQuestion]);
    }
  };

  const saveAssessment = async () => {
    if (!title.trim() || !description.trim() || questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and add at least one question.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare questions in the correct format for the stored procedure
      const formattedQuestions = questions.map((q, index) => ({
        question_text: q.text,
        question_type: q.type === 'single' || q.type === 'multiple' ? 'multiple_choice' : 
                       q.type === 'scale' ? 'scale' : 'free_text',
        position: index + 1,
        options: (q.type === 'single' || q.type === 'multiple') && q.options ? 
          q.options.map((opt, optIndex) => ({
            option_text: opt,
            is_correct: false, // Default to false, can be updated later
            position: optIndex + 1
          })) : []
      }));

      const { data, error } = await supabase.rpc('create_assessment_with_questions' as any, {
        _title: title,
        _description: description,
        _type: type,
        _visibility: visibility,
        _ai_provider: 'openai',
        _ai_model: 'gpt-4o-mini',
        _ai_prompt: aiPrompt || `Manual assessment: ${title}`,
        _questions: formattedQuestions
      } as any);

      if (error) throw error;

      toast({
        title: "Assessment Created",
        description: "Your assessment has been successfully created and is now available.",
      });

      onSave?.(data);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save assessment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionEditor = (question: Question, index: number) => (
    <Card key={question.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Question {index + 1}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => duplicateQuestion(question.id)}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeQuestion(question.id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Question Text</Label>
          <Textarea
            value={question.text}
            onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
            placeholder="Enter your question here"
            className="mt-1"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Question Type</Label>
            <Select
              value={question.type}
              onValueChange={(value) => updateQuestion(question.id, { type: value as Question['type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Choice</SelectItem>
                <SelectItem value="multiple">Multiple Choice</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
                <SelectItem value="text">Text Input</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center">
            <Switch
              checked={question.required}
              onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
            />
            <Label className="ml-2">Required</Label>
          </div>
        </div>

        {(question.type === 'single' || question.type === 'multiple') && (
          <div>
            <Label>Options</Label>
            {question.options?.map((option, optIndex) => (
              <Input
                key={optIndex}
                value={option}
                onChange={(e) => {
                  const newOptions = [...(question.options || [])];
                  newOptions[optIndex] = e.target.value;
                  updateQuestion(question.id, { options: newOptions });
                }}
                placeholder={`Option ${optIndex + 1}`}
                className="mt-2"
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
                updateQuestion(question.id, { options: newOptions });
              }}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Option
            </Button>
          </div>
        )}

        {question.type === 'scale' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Min Value</Label>
              <Input
                type="number"
                value={question.scale?.min || 1}
                onChange={(e) => updateQuestion(question.id, { 
                  scale: { ...question.scale!, min: parseInt(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label>Max Value</Label>
              <Input
                type="number"
                value={question.scale?.max || 5}
                onChange={(e) => updateQuestion(question.id, { 
                  scale: { ...question.scale!, max: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">AI Assessment Builder</CardTitle>
          <CardDescription>
            Create custom assessments using AI or build them manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Builder</TabsTrigger>
              <TabsTrigger value="ai">AI Generator</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual">
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Assessment title"
                      />
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of the assessment"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select value={type} onValueChange={setType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {assessmentTypes.map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Visibility</Label>
                        <Select value={visibility} onValueChange={(value: 'public' | 'users' | 'premium') => setVisibility(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public (No signup)</SelectItem>
                            <SelectItem value="users">Registered Users</SelectItem>
                            <SelectItem value="premium">Premium Users</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Estimated Time (minutes)</Label>
                        <Input
                          type="number"
                          value={estimatedTime}
                          onChange={(e) => setEstimatedTime(parseInt(e.target.value))}
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Questions */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Questions ({questions.length})</CardTitle>
                      <Button onClick={addQuestion}>
                        <Plus className="w-4 h-4 mr-1" /> Add Question
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {questions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No questions added yet. Click "Add Question" to get started.
                      </div>
                    ) : (
                      questions.map((q, i) => renderQuestionEditor(q, i))
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={onCancel}>Cancel</Button>
                  <Button onClick={saveAssessment} disabled={loading}>
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> Save Assessment</>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ai">
              <div className="space-y-6">
                <Alert>
                  <Sparkles className="w-4 h-4" />
                  <AlertDescription>
                    Describe the assessment you want to create, and AI will generate questions, scoring, and results for you.
                  </AlertDescription>
                </Alert>
                
                <div>
                  <Label>Describe your assessment</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAIPrompt(e.target.value)}
                    placeholder="e.g., Create a comprehensive assessment for identifying leadership potential in emerging managers, focusing on emotional intelligence, decision-making under pressure, and team motivation skills."
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assessmentTypes.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Visibility</Label>
                    <Select value={visibility} onValueChange={(value: 'public' | 'users' | 'premium') => setVisibility(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={generateAIAssessment} 
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="w-full"
                >
                  {aiLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate with AI</>
                  )}
                </Button>
                
                {aiGeneratedContent && (
                  <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">Generated Content Preview</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Review the generated content in the Manual Builder tab and customize as needed.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
