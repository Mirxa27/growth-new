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
  type: z.enum(['test', 'personality']),
  provider: z.string().min(1, 'Provider is required'),
  model: z.string().min(1, 'Model is required'),
  questionCount: z.number().int().min(1).max(50),
  customPrompt: z.string().optional()
});

const saveAssessmentParamsSchema = z.object({
  _title: z.string().min(1, 'Title is required'),
  _description: z.string().min(1, 'Description is required'),
  _type: z.enum(['quiz', 'personality']),
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
  const [type, setType] = useState<'quiz' | 'personality'>('personality');
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');

  const assessmentForm = {
    ai_provider: 'openai',
    ai_model: 'gpt-4o-mini',
    ai_prompt: '',
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
        provider: 'openai',
        model: 'gpt-4o-mini',
        questionCount,
        customPrompt: type === 'personality' 
          ? 'Generate questions for a personality assessment. Options should not have a correct answer but reflect different traits.'
          : 'Generate questions for a quiz with one correct answer per question.'
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
        <TabsTrigger value="exploration" disabled>
          <Compass className="w-4 h-4 mr-2" />
          Explorations (Coming Soon)
        </TabsTrigger>
        <TabsTrigger value="course" disabled>
          <BookOpen className="w-4 h-4 mr-2" />
          Courses (Coming Soon)
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
                <select value={type} onChange={e => setType(e.target.value as 'quiz' | 'personality')} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass" aria-label="Assessment type">
                  <option value="personality">Personality Assessment</option>
                  <option value="quiz">Quiz (with correct answers)</option>
                </select>
              </div>
              <div>
                <Label>Number of Questions</Label>
                <Input type="number" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} />
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
    </Tabs>
  );
};

export default AIContentBuilder;