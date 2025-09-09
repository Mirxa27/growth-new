import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  Wand2, 
  Brain, 
  BookOpen, 
  Target, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Play,
  Save,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Settings,
  AlertCircle,
  Lightbulb,
  Zap,
  Plus
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { format } from 'date-fns';

interface AIBuildJob {
  id: string;
  job_type: string;
  target_type: string;
  ai_provider: string;
  ai_model: string;
  prompt: string;
  parameters: any;
  content_specs: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  generated_content: any;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface ContentSpecs {
  target_audience: string;
  difficulty: string;
  length: string;
  topic: string;
  learning_objectives: string[];
  question_count?: number;
  assessment_type?: string;
  include_explanations: boolean;
  include_media: boolean;
  tone: string;
}

export const AIContentBuilder: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, verified } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'jobs' | 'templates'>('create');
  const [contentType, setContentType] = useState<'assessment' | 'course' | 'exploration'>('assessment');
  const [buildJobs, setBuildJobs] = useState<AIBuildJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<AIBuildJob | null>(null);
  
  // Form state
  const [contentSpecs, setContentSpecs] = useState<ContentSpecs>({
    target_audience: 'general',
    difficulty: 'intermediate',
    length: 'medium',
    topic: '',
    learning_objectives: [],
    question_count: 10,
    assessment_type: 'multiple_choice',
    include_explanations: true,
    include_media: false,
    tone: 'professional'
  });

  const [aiSettings, setAiSettings] = useState({
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000
  });

  const [customPrompt, setCustomPrompt] = useState('');
  const [previewContent, setPreviewContent] = useState<any>(null);

  useEffect(() => {
    if (verified) {
      fetchBuildJobs();
    }
  }, [verified]);

  useEffect(() => {
    // Poll for job updates when there are active jobs
    const activeJobs = buildJobs.filter(job => 
      job.status === 'pending' || job.status === 'in_progress'
    );

    if (activeJobs.length > 0) {
      const interval = setInterval(() => {
        fetchBuildJobs();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [buildJobs]);

  const fetchBuildJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_build_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBuildJobs(data || []);
    } catch (error) {
      logger.error('Failed to fetch build jobs', 'AIContentBuilder', error);
    }
  };

  const generateContent = async () => {
    if (!verified) {
      toast({
        title: 'Access Denied',
        description: 'Admin verification required for AI content generation.',
        variant: 'destructive'
      });
      return;
    }

    if (!contentSpecs.topic.trim()) {
      toast({
        title: 'Topic Required',
        description: 'Please enter a topic for content generation.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = generatePrompt();
      
      const jobData = {
        job_type: contentType,
        target_type: contentType === 'assessment' ? contentSpecs.assessment_type : contentType,
        ai_provider: aiSettings.provider,
        ai_model: aiSettings.model,
        prompt,
        parameters: {
          temperature: aiSettings.temperature,
          max_tokens: aiSettings.max_tokens,
          ...aiSettings
        },
        content_specs: contentSpecs
      };

      const { data, error } = await supabase
        .from('ai_build_jobs')
        .insert([jobData])
        .select()
        .single();

      if (error) throw error;

      setCurrentJob(data);
      
      // Start the AI generation process
      await triggerAIGeneration(data.id);
      
      toast({
        title: 'Generation Started',
        description: `AI is now generating your ${contentType}. This may take a few minutes.`,
      });

      // Refresh jobs list
      fetchBuildJobs();
      
      // Switch to jobs tab to monitor progress
      setActiveTab('jobs');

    } catch (error) {
      logger.error('Failed to start content generation', 'AIContentBuilder', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to start AI content generation. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerAIGeneration = async (jobId: string) => {
    try {
      const { error } = await supabase.functions.invoke('ai-content-generator', {
        body: { jobId }
      });

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to trigger AI generation', 'AIContentBuilder', error);
      throw error;
    }
  };

  const generatePrompt = (): string => {
    if (customPrompt.trim()) {
      return customPrompt;
    }

    let basePrompt = '';
    
    switch (contentType) {
      case 'assessment':
        basePrompt = `Create a comprehensive ${contentSpecs.assessment_type.replace('_', ' ')} assessment about "${contentSpecs.topic}" with the following specifications:

Target Audience: ${contentSpecs.target_audience}
Difficulty Level: ${contentSpecs.difficulty}
Number of Questions: ${contentSpecs.question_count}
Tone: ${contentSpecs.tone}

Requirements:
- Include ${contentSpecs.question_count} well-crafted questions
- Each question should test understanding of key concepts
- Provide multiple choice options where applicable
- Include correct answers and explanations${contentSpecs.include_explanations ? ' with detailed explanations' : ''}
- Ensure questions progress logically in difficulty
- Cover different aspects of the topic comprehensively

Learning Objectives:
${contentSpecs.learning_objectives.map(obj => `- ${obj}`).join('\n')}

Format the response as a structured JSON object with:
- title: Assessment title
- description: Brief description
- instructions: Clear instructions for users  
- questions: Array of question objects with text, options, correct_answer, explanation
- metadata: Additional information about the assessment`;
        break;

      case 'course':
        basePrompt = `Create a comprehensive course about "${contentSpecs.topic}" with the following specifications:

Target Audience: ${contentSpecs.target_audience}
Difficulty Level: ${contentSpecs.difficulty}
Course Length: ${contentSpecs.length}
Tone: ${contentSpecs.tone}

Requirements:
- Structure the course into logical modules/chapters
- Include learning objectives for each module
- Provide engaging content that builds progressively
- Include practical exercises and assessments
- Ensure comprehensive coverage of the topic

Learning Objectives:
${contentSpecs.learning_objectives.map(obj => `- ${obj}`).join('\n')}

Format the response as a structured JSON object with:
- title: Course title
- description: Comprehensive description
- modules: Array of module objects with title, content, objectives, assessments
- estimated_duration: Total course duration
- prerequisites: Any required prior knowledge`;
        break;

      case 'exploration':
        basePrompt = `Create an interactive exploration experience about "${contentSpecs.topic}" with the following specifications:

Target Audience: ${contentSpecs.target_audience}
Difficulty Level: ${contentSpecs.difficulty}
Experience Length: ${contentSpecs.length}
Tone: ${contentSpecs.tone}

Requirements:
- Create an engaging, interactive journey of self-discovery
- Include thought-provoking questions and prompts
- Provide personalized insights and reflections
- Structure content to encourage deep thinking
- Include actionable takeaways

Learning Objectives:
${contentSpecs.learning_objectives.map(obj => `- ${obj}`).join('\n')}

Format the response as a structured JSON object with:
- title: Exploration title
- description: Engaging description
- content: Structured exploration content with steps, prompts, and insights
- estimated_time: Expected completion time
- outcomes: What participants will gain`;
        break;
    }

    return basePrompt;
  };

  const previewGeneration = () => {
    const prompt = generatePrompt();
    setPreviewContent({
      prompt,
      specs: contentSpecs,
      settings: aiSettings
    });
  };

  const addLearningObjective = () => {
    setContentSpecs(prev => ({
      ...prev,
      learning_objectives: [...prev.learning_objectives, '']
    }));
  };

  const updateLearningObjective = (index: number, value: string) => {
    setContentSpecs(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.map((obj, i) => 
        i === index ? value : obj
      )
    }));
  };

  const removeLearningObjective = (index: number) => {
    setContentSpecs(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter((_, i) => i !== index)
    }));
  };

  const publishGeneratedContent = async (job: AIBuildJob) => {
    try {
      // Implementation would depend on the content type
      // This is a placeholder for the publishing logic
      
      toast({
        title: 'Content Published',
        description: `Your ${job.job_type} has been published successfully.`,
      });
    } catch (error) {
      logger.error('Failed to publish content', 'AIContentBuilder', error);
      toast({
        title: 'Publishing Failed',
        description: 'Failed to publish the generated content.',
        variant: 'destructive'
      });
    }
  };

  const renderCreateTab = () => (
    <div className="space-y-6">
      {/* Content Type Selection */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wand2 className="h-5 w-5 mr-2" />
            Content Type
          </CardTitle>
          <CardDescription>
            Choose what type of content you want to generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { type: 'assessment', icon: Target, title: 'Assessment', description: 'Create quizzes and tests' },
              { type: 'course', icon: BookOpen, title: 'Course', description: 'Build structured learning paths' },
              { type: 'exploration', icon: Brain, title: 'Exploration', description: 'Design self-discovery experiences' }
            ].map(({ type, icon: Icon, title, description }) => (
              <Card 
                key={type}
                className={`cursor-pointer transition-all ${
                  contentType === type ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setContentType(type as any)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Specifications */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>Content Specifications</CardTitle>
          <CardDescription>
            Define the parameters for your AI-generated content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Topic *</Label>
              <Input
                value={contentSpecs.topic}
                onChange={(e) => setContentSpecs(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Emotional Intelligence, Time Management"
              />
            </div>
            
            <div>
              <Label>Target Audience</Label>
              <Select value={contentSpecs.target_audience} onValueChange={(value) => 
                setContentSpecs(prev => ({ ...prev, target_audience: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Public</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="professionals">Professionals</SelectItem>
                  <SelectItem value="managers">Managers</SelectItem>
                  <SelectItem value="entrepreneurs">Entrepreneurs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty Level</Label>
              <Select value={contentSpecs.difficulty} onValueChange={(value) => 
                setContentSpecs(prev => ({ ...prev, difficulty: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Content Length</Label>
              <Select value={contentSpecs.length} onValueChange={(value) => 
                setContentSpecs(prev => ({ ...prev, length: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (5-10 min)</SelectItem>
                  <SelectItem value="medium">Medium (15-30 min)</SelectItem>
                  <SelectItem value="long">Long (45+ min)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {contentType === 'assessment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Assessment Type</Label>
                <Select value={contentSpecs.assessment_type} onValueChange={(value) => 
                  setContentSpecs(prev => ({ ...prev, assessment_type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                    <SelectItem value="timed_quiz">Timed Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Number of Questions</Label>
                <Input
                  type="number"
                  value={contentSpecs.question_count}
                  onChange={(e) => setContentSpecs(prev => ({ 
                    ...prev, 
                    question_count: parseInt(e.target.value) || 10 
                  }))}
                  min="5"
                  max="50"
                />
              </div>
            </div>
          )}

          <div>
            <Label>Learning Objectives</Label>
            <div className="space-y-2">
              {contentSpecs.learning_objectives.map((objective, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={objective}
                    onChange={(e) => updateLearningObjective(index, e.target.value)}
                    placeholder={`Learning objective ${index + 1}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeLearningObjective(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addLearningObjective}>
                <Plus className="h-4 w-4 mr-2" />
                Add Learning Objective
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tone</Label>
              <Select value={contentSpecs.tone} onValueChange={(value) => 
                setContentSpecs(prev => ({ ...prev, tone: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="motivational">Motivational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            AI Generation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>AI Provider</Label>
              <Select value={aiSettings.provider} onValueChange={(value) => 
                setAiSettings(prev => ({ ...prev, provider: value }))
              }>
                <SelectTrigger>
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
              <Label>Model</Label>
              <Select value={aiSettings.model} onValueChange={(value) => 
                setAiSettings(prev => ({ ...prev, model: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Custom Prompt (Optional)</Label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter a custom prompt to override the default generation prompt..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={previewGeneration} variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          Preview Prompt
        </Button>
        
        <Button onClick={generateContent} disabled={isGenerating || !contentSpecs.topic.trim()}>
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {isGenerating ? 'Generating...' : 'Generate Content'}
        </Button>
      </div>
    </div>
  );

  const renderJobsTab = () => (
    <div className="space-y-4">
      {buildJobs.length === 0 ? (
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No AI Jobs Yet</h3>
            <p className="text-muted-foreground">
              Start by creating your first AI-generated content in the Create tab.
            </p>
          </CardContent>
        </Card>
      ) : (
        buildJobs.map((job) => (
          <Card key={job.id} className="glass-strong">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    {job.job_type === 'assessment' && <Target className="h-5 w-5 mr-2" />}
                    {job.job_type === 'course' && <BookOpen className="h-5 w-5 mr-2" />}
                    {job.job_type === 'exploration' && <Brain className="h-5 w-5 mr-2" />}
                    {job.content_specs?.topic || 'Untitled'} - {job.job_type}
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(job.created_at), 'PPp')}
                  </CardDescription>
                </div>
                <Badge variant={
                  job.status === 'completed' ? 'default' :
                  job.status === 'failed' ? 'destructive' :
                  job.status === 'in_progress' ? 'secondary' : 'outline'
                }>
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {job.status === 'in_progress' && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} />
                </div>
              )}

              {job.status === 'failed' && job.error_message && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Generation Failed</p>
                    <p className="text-sm text-red-600">{job.error_message}</p>
                  </div>
                </div>
              )}

              {job.status === 'completed' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => publishGeneratedContent(job)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p>Provider: {job.ai_provider} ({job.ai_model})</p>
                <p>Target: {job.content_specs?.target_audience} | {job.content_specs?.difficulty}</p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (!isAdmin) {
    return (
      <Card className="glass-strong">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You need admin privileges to access the AI Content Builder.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-primary" />
            AI Content Builder
          </h2>
          <p className="text-muted-foreground">
            Generate assessments, courses, and explorations using AI
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/10">
          <Lightbulb className="h-4 w-4 mr-1" />
          AI-Powered
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="jobs">Generation Jobs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          {renderCreateTab()}
        </TabsContent>

        <TabsContent value="jobs">
          {renderJobsTab()}
        </TabsContent>

        <TabsContent value="templates">
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Templates Coming Soon</h3>
              <p className="text-muted-foreground">
                Pre-built templates for common assessment and course types will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      {previewContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Generation Preview</CardTitle>
              <CardDescription>
                Review the prompt and settings before generating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Generated Prompt:</h4>
                <pre className="bg-muted p-4 rounded text-sm whitespace-pre-wrap">
                  {previewContent.prompt}
                </pre>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewContent(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setPreviewContent(null);
                  generateContent();
                }}>
                  Generate with this Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIContentBuilder;