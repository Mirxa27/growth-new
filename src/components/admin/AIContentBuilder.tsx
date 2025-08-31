import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

// AIExplorationBuilder is now part of this component
// ... (logic for exploration builder can be integrated here)

export const AIContentBuilder = () => {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'quiz' | 'personality'>('personality');
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');

  const generateAssessment = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setGeneratedContent(null);
    
    try {
      const { data, error } = await (supabase.functions as any).invoke('create-assessment', {
        body: {
          topic,
          type: 'test', // Use 'test' type for generation
          provider: 'openai',
          model: 'gpt-4o-mini',
          questionCount,
          customPrompt: type === 'personality' 
            ? 'Generate questions for a personality assessment. Options should not have a correct answer but reflect different traits.'
            : 'Generate questions for a quiz with one correct answer per question.'
        }
      });

      if (error) throw error;
      
      setGeneratedContent(data.generated_content);
      toast({ title: "Content generated successfully!" });
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAssessment = async () => {
    if (!generatedContent) return;
    setIsSaving(true);

    try {
      const { error } = await (supabase.rpc as any)('create_assessment_with_questions', {
        _title: generatedContent.title,
        _description: generatedContent.description,
        _type: type,
        _visibility: visibility,
        _ai_provider: 'openai',
        _ai_model: 'gpt-4o-mini',
        _ai_prompt: `Generated assessment on the topic: ${topic}`,
        _questions: generatedContent.questions
      });

      if (error) throw error;

      toast({ title: "Assessment saved successfully!" });
      setGeneratedContent(null);
      setTopic('');
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
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
          <h2 className="text-2xl font-bold gradient-text">AI Content Builder</h2>
          <p className="text-muted-foreground">Generate assessments, explorations, and courses with AI</p>
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
              <CardDescription>Set the parameters for the AI to generate content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Topic</Label>
                <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Emotional Intelligence" />
              </div>
              <div>
                <Label>Type</Label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border rounded-md bg-background glass border-glass">
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
                    {generatedContent.questions?.map((q: any, i: number) => (
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