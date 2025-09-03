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
        _ai_provider: assessmentForm.ai_provider,
        _ai_model: assessmentForm.ai_model,
        _ai_prompt: assessmentForm.ai_prompt,
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