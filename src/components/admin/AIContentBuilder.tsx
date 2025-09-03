import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { 
  Sparkles, 
  Brain, 
  Wand2,
  Save,
  Loader2,
  FileText,
  Compass,
  BookOpen
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Json } from '@/integrations/supabase/types';
import { Textarea } from '@/components/ui/textarea';

// Zod schemas for validation
const generatedOptionSchema = z.object({
  option_text: z.string().min(1, 'Option text is required'),
  is_correct: z.boolean(),
  position: z.number().int().min(0),
  feedback: z.string().optional()
});

const generatedQuestionSchema = z.object({
  question_text: z.string().min(1, 'Question text is required'),
  question_type: z.enum(['multiple_choice', 'free_text', 'image']),
  position: z.number().int().min(0),
  options: z.array(generatedOptionSchema)
});

const generatedContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  questions: z.array(generatedQuestionSchema)
});

  const assessmentParamsSchema = z.object({
    topic: z.string().min(1, 'Topic is required'),
    type: z.enum(['quiz', 'test', 'exploration', 'course']),
    provider: z.string().min(1, 'Provider is required'),
    model: z.string().min(1, 'Model is required'),
    questionCount: z.number().int().min(1).max(50),
    customPrompt: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    category: z.string().optional()
  });

const saveAssessmentParamsSchema = z.object({
  _title: z.string().min(1, 'Title is required'),
  _description: z.string().min(1, 'Description is required'),
  _type: z.enum(['quiz', 'test', 'exploration', 'course']),
  _visibility: z.enum(['public', 'private']),
  _ai_provider: z.string().min(1, 'AI provider is required'),
  _ai_model: z.string().min(1, 'AI model is required'),
  _ai_prompt: z.string().optional(),
  _questions: z.any(),
  _created_by: z.string().uuid('Invalid user ID')
});

interface GeneratedQuestion {
  question_text: string;
  question_type: 'multiple_choice' | 'free_text' | 'image';
  position: number;
  options: GeneratedOption[];
}

interface GeneratedOption {
  option_text: string;
  is_correct: boolean;
  position: number;
  feedback?: string;
}

interface GeneratedContent {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

interface AIAssessmentBuilderProps {
  onAssessmentCreated?: () => void;
}

export const AIContentBuilder: React.FC<AIAssessmentBuilderProps> = ({ onAssessmentCreated }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'quiz' | 'test' | 'exploration' | 'course'>('quiz');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [category, setCategory] = useState('general');
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  // Shared provider/model (admin can adjust)
  const [provider, setProvider] = useState<'openai'>('openai');
  const [model, setModel] = useState('gpt-4o-mini');

  // Exploration state
  const [explorationTopic, setExplorationTopic] = useState('');
  const [explorationCategory, setExplorationCategory] = useState('self-discovery');
  const [explorationDifficulty, setExplorationDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [explorationQuestionCount, setExplorationQuestionCount] = useState(8);
  const [explorationVisibility, setExplorationVisibility] = useState<'public' | 'private'>('private');
  const [isGeneratingExploration, setIsGeneratingExploration] = useState(false);
  const [explorationContent, setExplorationContent] = useState<any | null>(null);
  const [isSavingExploration, setIsSavingExploration] = useState(false);

  // Course state
  const [courseTopic, setCourseTopic] = useState('');
  const [courseCategory, setCourseCategory] = useState('general');
  const [courseDifficulty, setCourseDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [courseContentJson, setCourseContentJson] = useState<string>('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  const getDefaultPrompt = (contentType: string) => {
    switch (contentType) {
      case 'quiz':
        return 'Generate quiz questions with one correct answer per question. Include explanations.';
      case 'test':
        return 'Generate test questions to assess knowledge and understanding. Mix question types.';
      case 'exploration':
        return 'Generate open-ended, reflective questions for deep personal exploration.';
      case 'course':
        return 'Generate a structured learning module with lessons, exercises, and assessments.';
      default:
        return '';
    }
  };

  const assessmentForm = {
    ai_provider: selectedProvider,
    ai_model: selectedModel,
    ai_prompt: customPrompt,
  };

  const generateAssessment = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setGeneratedContent(null);
    
    try {
      const params = {
        topic,

        type: 'test',
        provider,
        model,

        type,
        provider: selectedProvider,
        model: selectedModel,

        questionCount,
        difficulty,
        category,
        customPrompt: customPrompt || getDefaultPrompt(type)
      };

      // Validate parameters
      const validatedParams = assessmentParamsSchema.parse(params);

      const { data, error } = await supabase.functions.invoke('create-assessment', {
        body: validatedParams
      });

      if (error) throw error;
      
      // Validate generated content
      const validatedContent = generatedContentSchema.parse(data.generated_content);
      setGeneratedContent(validatedContent);
      
      toast({ title: "Content generated successfully!" });
    } catch (error) {
      console.error('Error in generateAssessment:', error);
      const errorMessage = error instanceof z.ZodError 
        ? 'Invalid assessment parameters or generated content' 
        : error instanceof Error ? error.message : 'Unknown error occurred';
      toast({ title: "Generation failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAssessment = async () => {
    if (!generatedContent || !user) return;
    setIsSaving(true);

    try {
      const params = {
        _title: generatedContent.title,
        _description: generatedContent.description,
        _type: type,
        _visibility: visibility,
        _ai_provider: provider,
        _ai_model: model,
        _ai_prompt: assessmentForm.ai_prompt || '',
        _questions: generatedContent.questions as unknown as Json,
        _created_by: user.id
      };

      // Validate save parameters
      const validatedParams = saveAssessmentParamsSchema.parse(params);

      const { error } = await supabase.rpc('create_assessment_with_questions', validatedParams);

      if (error) throw error;

      const logEntry = {
        admin_id: user.id,
        action: 'AI_CONTENT_GENERATED',
        details: {
          assessment_id: null,
          topic: topic,
          type: type,
          provider: assessmentForm.ai_provider,
          model: assessmentForm.ai_model,
          question_count: generatedContent.questions?.length || 0
        }
      };

      const { error: logError } = await supabase
        .from('admin_logs')
        .insert([logEntry]);

      if (logError) {
        console.error('Error logging assessment creation:', logError);
      }

      toast({ title: "Assessment saved successfully!" });
      setGeneratedContent(null);
      setTopic('');
      onAssessmentCreated?.();
    } catch (error) {
      console.error('Error in saveAssessment:', error);
      const errorMessage = error instanceof z.ZodError 
        ? 'Invalid assessment data' 
        : error instanceof Error ? error.message : 'Unknown error occurred';
      toast({ title: "Save failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const generateExploration = async () => {
    if (!explorationTopic.trim()) {
      toast({ title: 'Topic required', variant: 'destructive' });
      return;
    }
    setIsGeneratingExploration(true);
    setExplorationContent(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-exploration', {
        body: {
          topic: explorationTopic,
          provider,
          model,
          category: explorationCategory,
          difficulty: explorationDifficulty,
          questionCount: explorationQuestionCount,
          visibility: explorationVisibility,
        },
      });
      if (error) throw error;
      setExplorationContent(data.generated_content);
      toast({ title: 'Exploration generated' });
    } catch (err) {
      toast({ title: 'Generation failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setIsGeneratingExploration(false);
    }
  };

  const addExplorationQuestion = () => {
    if (!explorationContent) return;
    const nextPos = (explorationContent.questions?.length || 0) + 1;
    const updated = {
      ...explorationContent,
      questions: [
        ...(explorationContent.questions || []),
        { question_text: '', question_type: 'free_text', position: nextPos, explanation: '' },
      ],
    };
    setExplorationContent(updated);
  };

  const updateExplorationQuestion = (index: number, updates: Partial<{ question_text: string; explanation: string }>) => {
    if (!explorationContent) return;
    const questions = [...(explorationContent.questions || [])];
    questions[index] = { ...questions[index], ...updates };
    setExplorationContent({ ...explorationContent, questions });
  };

  const saveExploration = async () => {
    if (!explorationContent) return;
    setIsSavingExploration(true);
    try {
      const payload = {
        title: String(explorationContent.title || ''),
        description: String(explorationContent.description || ''),
        visibility: explorationVisibility,
        category: String(explorationContent.category || explorationCategory),
        difficulty_level: String(explorationContent.difficulty_level || explorationDifficulty),
        estimated_duration: Number(explorationContent.estimated_duration || 15),
        crystal_reward: Number(explorationContent.crystal_reward || 20),
        questions: (explorationContent.questions || []) as unknown as Json,
        analysis_structure: (explorationContent.analysis_structure || null) as unknown as Json,
        facilitator_prompt: String(explorationContent.facilitator_prompt || ''),
        higher_self_prompt: String(explorationContent.higher_self_prompt || ''),
        is_active: true,
      } as const;

      if (!payload.title || !payload.description || !payload.facilitator_prompt || !payload.higher_self_prompt) {
        throw new Error('Title, description, facilitator_prompt, and higher_self_prompt are required');
      }

      const { error } = await supabase.from('explorations').insert([payload]);
      if (error) throw error;
      toast({ title: 'Exploration saved' });
      setExplorationContent(null);
      setExplorationTopic('');
    } catch (err) {
      toast({ title: 'Save failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setIsSavingExploration(false);
    }
  };

  const generateCourse = async () => {
    if (!courseTopic.trim()) {
      toast({ title: 'Topic required', variant: 'destructive' });
      return;
    }
    setIsGeneratingCourse(true);
    setCourseContentJson('');
    try {
      const { data, error } = await supabase.functions.invoke('create-course', {
        body: {
          topic: courseTopic,
          provider,
          model,
          category: courseCategory,
          difficulty: courseDifficulty,
        },
      });
      if (error) throw error;
      setCourseContentJson(JSON.stringify(data.generated_content, null, 2));
      toast({ title: 'Course generated' });
    } catch (err) {
      toast({ title: 'Generation failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setIsGeneratingCourse(false);
    }
  };

  const saveCourse = async () => {
    if (!courseContentJson.trim()) return;
    setIsSavingCourse(true);
    try {
      const parsed = JSON.parse(courseContentJson);
      const title = String(parsed.title || 'Untitled Course');
      const description = String(parsed.description || '');
      const { error } = await supabase.from('library_items').insert([
        {
          title,
          description,
          content_type: 'course',
          difficulty_level: courseDifficulty,
          category: courseCategory,
          is_published: false,
          is_featured: false,
          is_premium: false,
          content_url: `data:application/json,${encodeURIComponent(courseContentJson)}`,
        },
      ]);
      if (error) throw error;
      toast({ title: 'Course saved' });
      setCourseContentJson('');
      setCourseTopic('');
    } catch (err) {
      toast({ title: 'Save failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setIsSavingCourse(false);
    }
  };

  return (
    <Tabs defaultValue="assessment" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
          <Wand2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold gradient-text">Content Builder</h2>
          <p className="text-muted-foreground">Generate assessments, explorations, and courses</p>
        </div>
      </div>
      
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="assessment">
          <FileText className="w-4 h-4 mr-2" />
          Assessments/Quizzes
        </TabsTrigger>
        <TabsTrigger value="exploration">
          <Compass className="w-4 h-4 mr-2" />
          Explorations
        </TabsTrigger>
        <TabsTrigger value="course">
          <BookOpen className="w-4 h-4 mr-2" />
          Courses
        </TabsTrigger>
      </TabsList>

      <TabsContent value="assessment">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>1. Define Assessment</CardTitle>
              <CardDescription>Set the parameters to generate content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Topic</Label>
                <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Emotional Intelligence" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>AI Provider</Label>
                  <select value={provider} onChange={(e) => setProvider(e.target.value as 'openai')} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass" aria-label="AI provider">
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o-mini" />
                </div>
              </div>
              <div>
                <Label>Type</Label>
                <select value={type} onChange={e => setType(e.target.value as 'quiz' | 'test' | 'exploration' | 'course')} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass" aria-label="Content type">
                  <option value="quiz">Quiz (with correct answers)</option>
                  <option value="test">Test/Assessment</option>
                  <option value="exploration">Exploration (open-ended)</option>
                  <option value="course">Course Module</option>
                </select>
              </div>
              <div>
                <Label>Difficulty Level</Label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <Label>Category</Label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., wellness, relationships, career" />
              </div>
              <div>
                <Label>AI Provider</Label>
                <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass">
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                </select>
              </div>
              <div>
                <Label>AI Model</Label>
                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass">
                  {selectedProvider === 'openai' && (
                    <>
                      <option value="gpt-4o-mini">GPT-4 Mini</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                  {selectedProvider === 'anthropic' && (
                    <>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="claude-3-haiku">Claude 3 Haiku</option>
                    </>
                  )}
                  {selectedProvider === 'google' && (
                    <>
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-ultra">Gemini Ultra</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <Label>Number of Questions/Items</Label>
                <Input type="number" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} min="1" max="50" />
              </div>
              <div>
                <Label>Custom Prompt (Optional)</Label>
                <textarea 
                  value={customPrompt} 
                  onChange={e => setCustomPrompt(e.target.value)} 
                  placeholder="Add specific instructions for content generation..."
                  className="w-full px-3 py-2 border rounded-md bg-background glass border-glass min-h-[80px]"
                />
              </div>
              <Button onClick={generateAssessment} disabled={isGenerating} className="w-full bg-gradient-primary">
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Content
              </Button>
            </CardContent>
          </Card>
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>2. Review & Save</CardTitle>
              <CardDescription>Review the generated content and save it to the library.</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-4">
                  <h3 className="font-bold">{generatedContent.title}</h3>
                  <p className="text-sm text-muted-foreground">{generatedContent.description}</p>
                  <div className="max-h-60 overflow-y-auto space-y-2 p-2 glass rounded">
                    {generatedContent.questions?.map((q: GeneratedQuestion, i: number) => (
                      <div key={i} className="text-xs"><strong>Q{i+1}:</strong> {q.question_text}</div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="visibility-switch" checked={visibility === 'public'} onCheckedChange={checked => setVisibility(checked ? 'public' : 'private')} />
                    <Label htmlFor="visibility-switch">Make Public (Visible to Visitors)</Label>
                  </div>
                  <Button onClick={saveAssessment} disabled={isSaving} className="w-full">
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Assessment
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4" />
                  <p>Generated content will appear here for review.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>


      <TabsContent value="exploration">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>1. Define Exploration</CardTitle>
              <CardDescription>Provide a topic and preferences, then generate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Topic</Label>
                <Input value={explorationTopic} onChange={(e) => setExplorationTopic(e.target.value)} placeholder="e.g., Shadow Work" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>AI Provider</Label>
                  <select value={provider} onChange={(e) => setProvider(e.target.value as 'openai')} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass" aria-label="AI provider">
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o-mini" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Category</Label>
                  <select value={explorationCategory} onChange={(e) => setExplorationCategory(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass">
                    <option value="self-discovery">Self-discovery</option>
                    <option value="relationships">Relationships</option>
                    <option value="career">Career</option>
                    <option value="healing">Healing</option>
                    <option value="spirituality">Spirituality</option>
                  </select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <select value={explorationDifficulty} onChange={(e) => setExplorationDifficulty(e.target.value as any)} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <Label>Questions</Label>
                  <Input type="number" value={explorationQuestionCount} onChange={(e) => setExplorationQuestionCount(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="exploration-visibility" checked={explorationVisibility === 'public'} onCheckedChange={(c) => setExplorationVisibility(c ? 'public' : 'private')} />
                <Label htmlFor="exploration-visibility">Make Public</Label>
              </div>
              <Button onClick={generateExploration} disabled={isGeneratingExploration} className="w-full bg-gradient-primary">
                {isGeneratingExploration ? <Loader2 className="animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Exploration
              </Button>
            </CardContent>
          </Card>
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>2. Review, Edit & Save</CardTitle>
              <CardDescription>Edit content before saving.</CardDescription>
            </CardHeader>
            <CardContent>
              {explorationContent ? (
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={explorationContent.title || ''} onChange={(e) => setExplorationContent({ ...explorationContent, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={explorationContent.description || ''} onChange={(e) => setExplorationContent({ ...explorationContent, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Facilitator Prompt</Label>
                      <Textarea value={explorationContent.facilitator_prompt || ''} onChange={(e) => setExplorationContent({ ...explorationContent, facilitator_prompt: e.target.value })} />
                    </div>
                    <div>
                      <Label>Higher Self Prompt</Label>
                      <Textarea value={explorationContent.higher_self_prompt || ''} onChange={(e) => setExplorationContent({ ...explorationContent, higher_self_prompt: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Questions ({explorationContent.questions?.length || 0})</Label>
                      <Button variant="outline" size="sm" onClick={addExplorationQuestion}>Add Question</Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-3 p-2 glass rounded">
                      {(explorationContent.questions || []).map((q: any, idx: number) => (
                        <div key={idx} className="space-y-2 border-b pb-2">
                          <Input value={q.question_text || ''} onChange={(e) => updateExplorationQuestion(idx, { question_text: e.target.value })} placeholder={`Q${idx + 1} text`} />
                          <Textarea value={q.explanation || ''} onChange={(e) => updateExplorationQuestion(idx, { explanation: e.target.value })} placeholder="Guidance / explanation" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={saveExploration} disabled={isSavingExploration} className="w-full">
                    {isSavingExploration ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Exploration
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Compass className="w-12 h-12 mx-auto mb-4" />
                  <p>Generated exploration will appear here for review.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="course">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>1. Define Course</CardTitle>
              <CardDescription>Generate a structured multi-module course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Topic</Label>
                <Input value={courseTopic} onChange={(e) => setCourseTopic(e.target.value)} placeholder="e.g., Emotional Resilience" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>AI Provider</Label>
                  <select value={provider} onChange={(e) => setProvider(e.target.value as 'openai')} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass" aria-label="AI provider">
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o-mini" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Input value={courseCategory} onChange={(e) => setCourseCategory(e.target.value)} placeholder="general" />
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <select value={courseDifficulty} onChange={(e) => setCourseDifficulty(e.target.value as any)} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <Button onClick={generateCourse} disabled={isGeneratingCourse} className="w-full bg-gradient-primary">
                {isGeneratingCourse ? <Loader2 className="animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Course
              </Button>
            </CardContent>
          </Card>
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>2. Review, Edit & Save</CardTitle>
              <CardDescription>Edit JSON structure directly if needed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea rows={20} value={courseContentJson} onChange={(e) => setCourseContentJson(e.target.value)} placeholder="Course JSON will appear here..." />
              <Button onClick={saveCourse} disabled={isSavingCourse || !courseContentJson.trim()} className="w-full">
                {isSavingCourse ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Course
              </Button>
            </CardContent>
          </Card>
        </div>

      
      <TabsContent value="exploration">
        <Card className="glass-card border-glass">
          <CardHeader>
            <CardTitle>AI-Powered Exploration Builder</CardTitle>
            <CardDescription>Create deep, reflective explorations for personal growth and self-discovery.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Compass className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Exploration builder uses the same interface as assessments.</p>
              <p className="text-sm mt-2">Select "Exploration" as the type in the Assessment tab.</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="course">
        <Card className="glass-card border-glass">
          <CardHeader>
            <CardTitle>AI-Powered Course Builder</CardTitle>
            <CardDescription>Design comprehensive learning experiences with modules, lessons, and assessments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Course builder uses the same interface as assessments.</p>
              <p className="text-sm mt-2">Select "Course" as the type in the Assessment tab.</p>
            </div>
          </CardContent>
        </Card>

      </TabsContent>
    </Tabs>
  );
};

export default AIContentBuilder;