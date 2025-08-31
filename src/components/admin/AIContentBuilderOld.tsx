import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  BookOpen, 
  Users, 
  Target, 
  Sparkles, 
  Save, 
  Eye,
  Settings,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface AITemplate {
  id: string;
  name: string;
  type: 'assessment' | 'quiz' | 'exploration' | 'course';
  category: string;
  prompt_template: string;
  output_schema: any;
  default_config: any;
}

interface GeneratedContent {
  title: string;
  description: string;
  questions?: any[];
  modules?: any[];
  activities?: any[];
  scoring_config?: any;
  difficulty?: string;
  estimated_duration?: number;
  time_limit_minutes?: number;
  passing_score?: number;
}

interface BuilderConfig {
  topic: string;
  target_audience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question_count: number;
  focus_areas: string[];
  additional_context: string;
  is_public: boolean;
  requires_signup: boolean;
  time_limit?: number;
  category: string;
  ai_provider: string;
  ai_model: string;
  creativity_level: number;
}

const AIContentBuilder: React.FC = () => {
  const [templates] = useState<AITemplate[]>([
    {
      id: '1',
      name: 'Personality Assessment',
      type: 'assessment',
      category: 'personality',
      prompt_template: 'Create a {difficulty} personality assessment about {topic} with {question_count} questions for {target_audience}',
      output_schema: {},
      default_config: {}
    },
    {
      id: '2', 
      name: 'Wellness Quiz',
      type: 'quiz',
      category: 'wellness',
      prompt_template: 'Create a {difficulty} wellness quiz about {topic} with {question_count} questions for {target_audience}',
      output_schema: {},
      default_config: {}
    },
    {
      id: '3',
      name: 'Growth Exploration', 
      type: 'exploration',
      category: 'growth',
      prompt_template: 'Create a {difficulty} exploration about {topic} with {question_count} reflection questions for {target_audience}',
      output_schema: {},
      default_config: {}
    }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<AITemplate | null>(null);
  const [config, setConfig] = useState<BuilderConfig>({
    topic: '',
    target_audience: 'Women seeking personal growth',
    difficulty: 'intermediate',
    question_count: 10,
    focus_areas: [],
    additional_context: '',
    is_public: false,
    requires_signup: true,
    category: 'growth',
    ai_provider: 'openai',
    ai_model: 'gpt-4',
    creativity_level: 0.7
  });
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState('builder');
  const [aiProviders] = useState([{id: '1', name: 'OpenAI', provider_type: 'openai'}]);
  const [generationHistory] = useState([]);

  const { toast } = useToast();

  const generateContent = async () => {
    if (!selectedTemplate || !config.topic.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a template and provide a topic.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Build the AI prompt using the template
      const prompt = selectedTemplate.prompt_template
        .replace('{topic}', config.topic)
        .replace('{target_audience}', config.target_audience)
        .replace('{question_count}', config.question_count.toString())
        .replace('{difficulty}', config.difficulty)
        .replace('{focus_areas}', config.focus_areas.join(', '))
        .replace('{additional_context}', config.additional_context);

      console.log('Generated prompt:', prompt);

      // Call AI generation endpoint - using simple mock for now
      // In production, this would call your actual AI service
      const mockResponse = generateMockContent(selectedTemplate.type, config);
      setGeneratedContent(mockResponse);

      toast({
        title: "Content Generated Successfully!",
        description: `Created ${selectedTemplate.type} about "${config.topic}"`,
      });

    } catch (error: any) {
      console.error('Content generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Mock content generator for demonstration
  const generateMockContent = (type: string, config: BuilderConfig): GeneratedContent => {
    const baseContent = {
      title: `${config.topic} ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      description: `A comprehensive ${type} exploring ${config.topic} designed for ${config.target_audience.toLowerCase()}.`,
      difficulty: config.difficulty,
      estimated_duration: config.question_count * 2
    };

    const questions = Array.from({ length: config.question_count }, (_, i) => ({
      text: `Question ${i + 1} about ${config.topic}?`,
      type: 'multiple_choice',
      category: config.category,
      tags: config.focus_areas,
      options: [
        { text: 'Option A', value: 'a', score_weights: { dimension1: 3 }, order_index: 1 },
        { text: 'Option B', value: 'b', score_weights: { dimension2: 3 }, order_index: 2 },
        { text: 'Option C', value: 'c', score_weights: { dimension3: 3 }, order_index: 3 },
        { text: 'Option D', value: 'd', score_weights: { dimension4: 3 }, order_index: 4 }
      ]
    }));

    if (type === 'quiz') {
      return {
        ...baseContent,
        time_limit_minutes: 15,
        passing_score: 70,
        questions: questions.map(q => ({
          question_text: q.text,
          question_type: 'multiple_choice',
          correct_answer: 'Option A',
          explanation: `This is the correct answer because...`,
          points: 1,
          options: q.options.map(opt => ({
            text: opt.text,
            is_correct: opt.value === 'a',
            order_index: opt.order_index
          }))
        }))
      };
    }

    return {
      ...baseContent,
      questions,
      scoring_config: {
        algorithm: 'weighted_average',
        dimensions: {
          dimension1: { label: 'Dimension 1', weight: 0.25 },
          dimension2: { label: 'Dimension 2', weight: 0.25 },
          dimension3: { label: 'Dimension 3', weight: 0.25 },
          dimension4: { label: 'Dimension 4', weight: 0.25 }
        }
      }
    };
  };

  const saveContent = async () => {
    if (!generatedContent || !selectedTemplate) {
      toast({
        title: "No Content to Save",
        description: "Please generate content first.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // For now, just show a success message
      // Once migrations are run, this will save to the actual database
      
      toast({
        title: "Content Saved Successfully!",
        description: `${selectedTemplate.type} has been prepared for publication.`,
      });

      // Log the content that would be saved
      console.log('Content to save:', {
        type: selectedTemplate.type,
        content: generatedContent,
        config
      });

      setGeneratedContent(null);

    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addFocusArea = (area: string) => {
    if (area.trim() && !config.focus_areas.includes(area.trim())) {
      setConfig(prev => ({
        ...prev,
        focus_areas: [...prev.focus_areas, area.trim()]
      }));
    }
  };

  const removeFocusArea = (area: string) => {
    setConfig(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.filter(a => a !== area)
    }));
  };

  const contentTypeIcons = {
    assessment: Brain,
    quiz: BookOpen,
    exploration: Target,
    course: Users
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          AI Content Builder
        </h1>
        <p className="text-muted-foreground">
          Create assessments, quizzes, explorations, and courses using AI. Simply provide a topic and let AI generate comprehensive content.
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Configuration</CardTitle>
                  <CardDescription>
                    Configure your AI-generated content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Selection */}
                  <div>
                    <Label htmlFor="template">Content Type</Label>
                    <Select
                      value={selectedTemplate?.id || ''}
                      onValueChange={(value) => {
                        const template = templates.find(t => t.id === value);
                        setSelectedTemplate(template || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => {
                          const Icon = contentTypeIcons[template.type];
                          return (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {template.name}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Topic */}
                  <div>
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Self-confidence, Stress management, Career transitions..."
                      value={config.topic}
                      onChange={(e) => setConfig(prev => ({ ...prev, topic: e.target.value }))}
                    />
                  </div>

                  {/* Target Audience */}
                  <div>
                    <Label htmlFor="audience">Target Audience</Label>
                    <Input
                      id="audience"
                      value={config.target_audience}
                      onChange={(e) => setConfig(prev => ({ ...prev, target_audience: e.target.value }))}
                    />
                  </div>

                  {/* Difficulty */}
                  <div>
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select
                      value={config.difficulty}
                      onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                        setConfig(prev => ({ ...prev, difficulty: value }))
                      }
                    >
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

                  {/* Question Count */}
                  <div>
                    <Label htmlFor="questionCount">Number of Questions</Label>
                    <Input
                      id="questionCount"
                      type="number"
                      min="5"
                      max="50"
                      value={config.question_count}
                      onChange={(e) => setConfig(prev => ({ ...prev, question_count: parseInt(e.target.value) || 10 }))}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={config.category}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personality">Personality</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                        <SelectItem value="career">Career</SelectItem>
                        <SelectItem value="relationships">Relationships</SelectItem>
                        <SelectItem value="growth">Personal Growth</SelectItem>
                        <SelectItem value="spirituality">Spirituality</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="skills">Skills</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Focus Areas */}
                  <div>
                    <Label>Focus Areas</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {config.focus_areas.map((area) => (
                        <Badge key={area} variant="secondary" className="flex items-center gap-1">
                          {area}
                          <button
                            onClick={() => removeFocusArea(area)}
                            className="ml-1 hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add focus area and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addFocusArea(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>

                  {/* Additional Context */}
                  <div>
                    <Label htmlFor="context">Additional Context</Label>
                    <Textarea
                      id="context"
                      placeholder="Any specific requirements, themes, or details you'd like to include..."
                      value={config.additional_context}
                      onChange={(e) => setConfig(prev => ({ ...prev, additional_context: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Visibility Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isPublic">Public Access</Label>
                      <Switch
                        id="isPublic"
                        checked={config.is_public}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_public: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requiresSignup">Requires Signup</Label>
                      <Switch
                        id="requiresSignup"
                        checked={config.requires_signup}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, requires_signup: checked }))}
                      />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={generateContent}
                    disabled={isGenerating || !selectedTemplate || !config.topic.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2 space-y-6">
              {generatedContent ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          Generated Content Preview
                        </CardTitle>
                        <CardDescription>
                          Review and save your AI-generated content
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setGeneratedContent(null)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear
                        </Button>
                        <Button
                          onClick={saveContent}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save & Publish
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">{generatedContent.title}</h3>
                        <p className="text-muted-foreground">{generatedContent.description}</p>
                      </div>

                      <Separator />

                      {generatedContent.questions && (
                        <div>
                          <h4 className="font-medium mb-3">
                            Questions ({generatedContent.questions.length})
                          </h4>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {generatedContent.questions.map((question: any, index: number) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <p className="font-medium">
                                  {index + 1}. {question.text || question.question_text}
                                </p>
                                {question.options && (
                                  <div className="mt-2 space-y-1">
                                    {question.options.map((option: any, optIndex: number) => (
                                      <div key={optIndex} className="text-sm text-muted-foreground ml-4">
                                        • {option.text}
                                        {option.is_correct && (
                                          <Badge variant="default" className="ml-2 text-xs">
                                            Correct
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {question.explanation && (
                                  <p className="text-sm text-muted-foreground mt-2 italic">
                                    {question.explanation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ready to Generate Content</h3>
                    <p className="text-muted-foreground max-w-md">
                      Configure your content settings and click "Generate Content" to create
                      AI-powered assessments, quizzes, explorations, or courses.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>AI Content Templates</CardTitle>
              <CardDescription>
                Manage templates for different types of content generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => {
                  const Icon = contentTypeIcons[template.type];
                  return (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-primary" />
                          <h3 className="font-medium">{template.name}</h3>
                        </div>
                        <Badge variant="outline" className="mb-2">
                          {template.type}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Category: {template.category}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Generation History</CardTitle>
              <CardDescription>
                View and manage your previously generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generationHistory.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{item.topic}</h3>
                      <p className="text-sm text-muted-foreground">
                        Generated {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {generationHistory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No generation history yet. Start creating content to see your history here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>AI Settings</CardTitle>
              <CardDescription>
                Configure AI providers and generation parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="aiProvider">AI Provider</Label>
                <Select
                  value={config.ai_provider}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, ai_provider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiProviders.map((provider: any) => (
                      <SelectItem key={provider.id} value={provider.provider_type}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="aiModel">AI Model</Label>
                <Select
                  value={config.ai_model}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, ai_model: value }))}
                >
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

              <div>
                <Label htmlFor="creativity">Creativity Level: {config.creativity_level}</Label>
                <input
                  type="range"
                  id="creativity"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.creativity_level}
                  onChange={(e) => setConfig(prev => ({ ...prev, creativity_level: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>More Focused</span>
                  <span>More Creative</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIContentBuilder;

interface AITemplate {
  id: string;
  name: string;
  type: 'assessment' | 'quiz' | 'exploration' | 'course';
  category: string;
  prompt_template: string;
  output_schema: any;
  default_config: any;
}

interface GeneratedContent {
  title: string;
  description: string;
  questions?: any[];
  modules?: any[];
  activities?: any[];
  scoring_config?: any;
  difficulty?: string;
  estimated_duration?: number;
  time_limit_minutes?: number;
  passing_score?: number;
}

interface BuilderConfig {
  topic: string;
  target_audience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question_count: number;
  focus_areas: string[];
  additional_context: string;
  is_public: boolean;
  requires_signup: boolean;
  time_limit?: number;
  category: string;
  ai_provider: string;
  ai_model: string;
  creativity_level: number;
  questions?: any[];
  modules?: any[];
  scoring_config?: any;
  result_templates?: any;
  status: 'draft' | 'review' | 'published';
}

export const AIContentBuilder: React.FC = () => {
  const [config, setConfig] = useState<AIBuilderConfig>({
    topic: '',
    additionalContext: '',
    targetAudience: 'women seeking personal growth',
    difficulty: 'beginner',
    category: 'personality',
    contentType: 'assessment',
    questionCount: 10,
    estimatedDuration: 15,
    isPublic: false,
    requiresSignup: true,
    customInstructions: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const categories = [
    { value: 'personality', label: 'Personality & Identity' },
    { value: 'wellness', label: 'Wellness & Mental Health' },
    { value: 'relationships', label: 'Relationships & Communication' },
    { value: 'career', label: 'Career & Professional' },
    { value: 'growth', label: 'Personal Growth' },
    { value: 'spirituality', label: 'Spirituality & Mindfulness' },
    { value: 'skills', label: 'Skills & Learning' },
    { value: 'lifestyle', label: 'Lifestyle & Habits' }
  ];

  const contentTypes = [
    { 
      value: 'assessment', 
      label: 'Assessment', 
      icon: Brain,
      description: 'Personality tests, self-discovery tools, and evaluations'
    },
    { 
      value: 'quiz', 
      label: 'Quiz', 
      icon: Target,
      description: 'Knowledge tests with right/wrong answers and scoring'
    },
    { 
      value: 'exploration', 
      label: 'Exploration', 
      icon: Sparkles,
      description: 'Guided self-reflection journeys and deep conversations'
    },
    { 
      value: 'course', 
      label: 'Course', 
      icon: BookOpen,
      description: 'Multi-module learning experiences with lessons and activities'
    }
  ];

  const generateContent = async () => {
    if (!config.topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for your content.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Call Supabase function to generate content using AI
      const { data, error } = await supabase.functions.invoke('enhanced-chat-completion', {
        body: {
          prompt: buildPrompt(),
          max_tokens: 4000,
          temperature: 0.7
        }
      });

      if (error) throw error;

      // Parse the AI response
      let parsedContent;
      try {
        parsedContent = JSON.parse(data.choices[0].message.content);
      } catch (parseError) {
        throw new Error('Invalid response format from AI');
      }

      // Add metadata
      const contentWithMetadata = {
        ...parsedContent,
        status: 'draft' as const,
        metadata: {
          generated_at: new Date().toISOString(),
          config: config,
          ai_model: 'gpt-4'
        }
      };

      setGeneratedContent(contentWithMetadata);
      
      toast({
        title: "Content Generated!",
        description: `Your ${config.contentType} has been created successfully.`
      });

    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const buildPrompt = () => {
    const basePrompt = `Create a comprehensive ${config.contentType} about "${config.topic}" for ${config.targetAudience}.

Content Requirements:
- Target Audience: ${config.targetAudience}
- Difficulty Level: ${config.difficulty}
- Category: ${config.category}
- ${config.contentType === 'assessment' || config.contentType === 'quiz' ? `Question Count: ${config.questionCount}` : ''}
- Estimated Duration: ${config.estimatedDuration} minutes
- Public Access: ${config.isPublic ? 'Yes' : 'No'}
- Requires Signup: ${config.requiresSignup ? 'Yes' : 'No'}

${config.additionalContext ? `Additional Context: ${config.additionalContext}` : ''}
${config.customInstructions ? `Custom Instructions: ${config.customInstructions}` : ''}

Please generate content that is:
- Culturally sensitive and inclusive
- Empowering and growth-oriented
- Scientifically informed when relevant
- Engaging and interactive
- Suitable for women's personal development`;

    switch (config.contentType) {
      case 'assessment':
        return `${basePrompt}

Return ONLY valid JSON in this exact format:
{
  "title": "Assessment title (max 80 characters)",
  "description": "Compelling description (2-3 sentences)",
  "instructions": "Clear instructions for taking the assessment",
  "questions": [
    {
      "text": "Question text",
      "type": "multiple_choice|scale|text|boolean",
      "category": "question category",
      "is_required": true,
      "options": [
        {
          "text": "Option text",
          "value": "option_value",
          "score_weights": {"trait1": 2, "trait2": 1}
        }
      ]
    }
  ],
  "scoring_config": {
    "algorithm": "personality_weights",
    "traits": ["trait1", "trait2"],
    "score_ranges": {"low": [0, 33], "medium": [34, 66], "high": [67, 100]}
  },
  "result_templates": {
    "trait1": {
      "title": "Result title",
      "description": "Result description",
      "strengths": ["strength1", "strength2"],
      "growth_areas": ["area1", "area2"],
      "recommendations": ["rec1", "rec2"]
    }
  }
}`;

      case 'quiz':
        return `${basePrompt}

Return ONLY valid JSON in this exact format:
{
  "title": "Quiz title (max 80 characters)",
  "description": "Engaging description (2-3 sentences)",
  "time_limit_minutes": ${config.estimatedDuration},
  "passing_score": 70,
  "questions": [
    {
      "question_text": "Question text",
      "question_type": "multiple_choice|true_false|fill_blank",
      "correct_answer": "Correct answer text",
      "explanation": "Why this answer is correct",
      "points": 1,
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
    }
  ]
}`;

      case 'exploration':
        return `${basePrompt}

Return ONLY valid JSON in this exact format:
{
  "title": "Exploration title (max 80 characters)",
  "description": "Transformative description (2-3 sentences)",
  "facilitator_prompt": "Prompt for the AI facilitator",
  "higher_self_prompt": "Prompt for the higher self analysis",
  "questions": [
    "Deep reflective question 1",
    "Deep reflective question 2"
  ],
  "analysis_structure": {
    "corePattern": "Description of core pattern analysis",
    "hiddenPotential": "Description of potential identification",
    "actionableSteps": "Description of action steps",
    "affirmations": "Description of affirmations",
    "encouragement": "Description of encouragement"
  }
}`;

      case 'course':
        return `${basePrompt}

Return ONLY valid JSON in this exact format:
{
  "title": "Course title (max 80 characters)",
  "description": "Compelling course description (2-3 sentences)",
  "learning_objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "modules": [
    {
      "title": "Module title",
      "description": "Module description",
      "content": "Detailed module content",
      "activities": ["Activity 1", "Activity 2"],
      "duration_minutes": 30,
      "order_index": 1
    }
  ],
  "completion_criteria": {
    "required_modules": "all",
    "assessments_required": true,
    "certificate_awarded": true
  }
}`;

      default:
        return basePrompt;
    }
  };

  const saveContent = async () => {
    if (!generatedContent) return;

    setIsSaving(true);
    try {
      let savedData;
      
      switch (config.contentType) {
        case 'assessment':
          savedData = await saveAssessment();
          break;
        case 'quiz':
          savedData = await saveQuiz();
          break;
        case 'exploration':
          savedData = await saveExploration();
          break;
        case 'course':
          savedData = await saveCourse();
          break;
      }

      // Save to AI generation history
      await supabase
        .from('ai_generation_history')
        .insert({
          topic: config.topic,
          additional_context: config.additionalContext,
          generated_content: generatedContent,
          status: 'published'
        });

      toast({
        title: "Content Saved!",
        description: `Your ${config.contentType} has been published successfully.`
      });

      // Reset form
      setGeneratedContent(null);
      setConfig(prev => ({ ...prev, topic: '', additionalContext: '', customInstructions: '' }));

    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveAssessment = async () => {
    // Create assessment type if needed
    const { data: assessmentType, error: typeError } = await supabase
      .from('assessment_types')
      .upsert({
        name: generatedContent!.title,
        description: generatedContent!.description,
        category: config.category,
        is_public: config.isPublic,
        requires_signup: config.requiresSignup,
        estimated_duration: config.estimatedDuration
      })
      .select()
      .single();

    if (typeError) throw typeError;

    // Create assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        title: generatedContent!.title,
        description: generatedContent!.description,
        assessment_type_id: assessmentType.id,
        instructions: generatedContent!.instructions,
        is_published: true,
        is_public: config.isPublic,
        scoring_algorithm: generatedContent!.scoring_config?.algorithm || 'personality_weights',
        scoring_config: generatedContent!.scoring_config,
        result_templates: generatedContent!.result_templates
      })
      .select()
      .single();

    if (assessmentError) throw assessmentError;

    // Create questions and link to assessment
    if (generatedContent!.questions) {
      for (let i = 0; i < generatedContent!.questions.length; i++) {
        const questionData = generatedContent!.questions[i];
        
        // Create question
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .insert({
            text: questionData.text,
            type: questionData.type,
            category: questionData.category,
            is_required: questionData.is_required,
            order_index: i
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create question options
        if (questionData.options) {
          const optionsData = questionData.options.map((option: any, optIndex: number) => ({
            question_id: question.id,
            text: option.text,
            value: option.value,
            score_weights: option.score_weights,
            order_index: optIndex
          }));

          const { error: optionsError } = await supabase
            .from('question_options')
            .insert(optionsData);

          if (optionsError) throw optionsError;
        }

        // Link question to assessment
        const { error: linkError } = await supabase
          .from('assessment_questions')
          .insert({
            assessment_id: assessment.id,
            question_id: question.id,
            order_index: i,
            is_required: questionData.is_required,
            weight: 1.0
          });

        if (linkError) throw linkError;
      }
    }

    return assessment;
  };

  const saveQuiz = async () => {
    // Create quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        title: generatedContent!.title,
        description: generatedContent!.description,
        category: config.category,
        difficulty: config.difficulty,
        is_public: config.isPublic,
        time_limit_minutes: generatedContent!.time_limit_minutes,
        passing_score: generatedContent!.passing_score || 70,
        show_correct_answers: true,
        randomize_questions: false
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // Create quiz questions
    if (generatedContent!.questions) {
      for (let i = 0; i < generatedContent!.questions.length; i++) {
        const questionData = generatedContent!.questions[i];
        
        const { data: question, error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question_text: questionData.question_text,
            question_type: questionData.question_type,
            correct_answer: questionData.correct_answer,
            explanation: questionData.explanation,
            points: questionData.points || 1,
            order_index: i
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create question options for multiple choice
        if (questionData.question_type === 'multiple_choice' && questionData.options) {
          const optionsData = questionData.options.map((option: string, optIndex: number) => ({
            quiz_question_id: question.id,
            option_text: option,
            is_correct: option === questionData.correct_answer,
            order_index: optIndex
          }));

          const { error: optionsError } = await supabase
            .from('quiz_question_options')
            .insert(optionsData);

          if (optionsError) throw optionsError;
        }
      }
    }

    return quiz;
  };

  const saveExploration = async () => {
    const { data: exploration, error } = await supabase
      .from('explorations')
      .insert({
        title: generatedContent!.title,
        description: generatedContent!.description,
        category: config.category,
        difficulty_level: config.difficulty,
        estimated_duration: config.estimatedDuration,
        crystal_reward: Math.floor(config.estimatedDuration * 3), // 3 crystals per minute
        facilitator_prompt: generatedContent!.facilitator_prompt,
        higher_self_prompt: generatedContent!.higher_self_prompt,
        questions: generatedContent!.questions,
        analysis_structure: generatedContent!.analysis_structure
      })
      .select()
      .single();

    if (error) throw error;
    return exploration;
  };

  const saveCourse = async () => {
    // Note: You'll need to create a courses table for this
    // For now, we'll save as a structured exploration
    const { data: course, error } = await supabase
      .from('explorations')
      .insert({
        title: generatedContent!.title,
        description: generatedContent!.description,
        category: config.category,
        difficulty_level: config.difficulty,
        estimated_duration: config.estimatedDuration,
        crystal_reward: Math.floor(config.estimatedDuration * 5), // Higher reward for courses
        facilitator_prompt: 'Course facilitator prompt',
        higher_self_prompt: 'Course completion analysis prompt',
        questions: ['Course completion reflection'],
        analysis_structure: {
          modules: generatedContent!.modules,
          learning_objectives: generatedContent!.learning_objectives,
          completion_criteria: generatedContent!.completion_criteria
        }
      })
      .select()
      .single();

    if (error) throw error;
    return course;
  };

  const updateConfig = (field: keyof AIBuilderConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Wand2 className="w-8 h-8 text-primary" />
          AI Content Builder
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create personalized assessments, quizzes, explorations, and courses using AI. 
          Simply provide a topic and let our AI generate comprehensive content for your users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Content Configuration
            </CardTitle>
            <CardDescription>
              Configure your content parameters and let AI generate the rest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Type Selection */}
            <div className="space-y-3">
              <Label>Content Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.value}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        config.contentType === type.value ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => updateConfig('contentType', type.value)}
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <Icon className="w-6 h-6 mx-auto text-primary" />
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {type.description}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., 'Understanding Your Communication Style'"
                value={config.topic}
                onChange={(e) => updateConfig('topic', e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={config.category} onValueChange={(value) => updateConfig('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={config.difficulty} onValueChange={(value: any) => updateConfig('difficulty', value)}>
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
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[config.estimatedDuration]}
                    onValueChange={(value) => updateConfig('estimatedDuration', value[0])}
                    max={60}
                    min={5}
                    step={5}
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    {config.estimatedDuration} minutes
                  </div>
                </div>
              </div>
            </div>

            {/* Question Count (for assessments/quizzes) */}
            {(config.contentType === 'assessment' || config.contentType === 'quiz') && (
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <div className="space-y-2">
                  <Slider
                    value={[config.questionCount]}
                    onValueChange={(value) => updateConfig('questionCount', value[0])}
                    max={30}
                    min={5}
                    step={1}
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    {config.questionCount} questions
                  </div>
                </div>
              </div>
            )}

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                placeholder="e.g., 'working mothers in their 30s'"
                value={config.targetAudience}
                onChange={(e) => updateConfig('targetAudience', e.target.value)}
              />
            </div>

            {/* Additional Context */}
            <div className="space-y-2">
              <Label htmlFor="context">Additional Context</Label>
              <Textarea
                id="context"
                placeholder="Any specific requirements, themes, or focus areas..."
                value={config.additionalContext}
                onChange={(e) => updateConfig('additionalContext', e.target.value)}
                rows={3}
              />
            </div>

            {/* Access Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Public Access</Label>
                  <p className="text-sm text-muted-foreground">Allow visitors to access without signup</p>
                </div>
                <Switch
                  checked={config.isPublic}
                  onCheckedChange={(checked) => updateConfig('isPublic', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Requires Signup</Label>
                  <p className="text-sm text-muted-foreground">Users must create an account</p>
                </div>
                <Switch
                  checked={config.requiresSignup}
                  onCheckedChange={(checked) => updateConfig('requiresSignup', checked)}
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateContent}
              disabled={isGenerating || !config.topic.trim()}
              className="w-full bg-gradient-to-r from-primary to-secondary"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Generated Content
              </CardTitle>
              {generatedContent && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    {previewMode ? 'Edit' : 'Preview'}
                  </Button>
                  <Button
                    onClick={saveContent}
                    disabled={isSaving}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Publish
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!generatedContent ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Configure your content and click "Generate Content" to see the AI-generated result here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Content Header */}
                <div>
                  <h3 className="text-xl font-bold">{generatedContent.title}</h3>
                  <p className="text-muted-foreground mt-1">{generatedContent.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{config.category}</Badge>
                    <Badge variant="outline">{config.difficulty}</Badge>
                    <Badge variant="outline">{config.contentType}</Badge>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="border rounded-lg p-4 bg-muted/20 max-h-96 overflow-y-auto">
                  {config.contentType === 'assessment' && generatedContent.questions && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Questions ({generatedContent.questions.length})</h4>
                      {generatedContent.questions.slice(0, 3).map((q: any, i: number) => (
                        <div key={i} className="text-sm p-2 bg-background rounded border">
                          <p className="font-medium">{i + 1}. {q.text}</p>
                          {q.options && (
                            <ul className="mt-1 ml-4 text-muted-foreground">
                              {q.options.slice(0, 2).map((opt: any, j: number) => (
                                <li key={j}>• {opt.text}</li>
                              ))}
                              {q.options.length > 2 && <li>... and {q.options.length - 2} more options</li>}
                            </ul>
                          )}
                        </div>
                      ))}
                      {generatedContent.questions.length > 3 && (
                        <p className="text-sm text-muted-foreground">... and {generatedContent.questions.length - 3} more questions</p>
                      )}
                    </div>
                  )}

                  {config.contentType === 'quiz' && generatedContent.questions && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Quiz Questions ({generatedContent.questions.length})</h4>
                      {generatedContent.questions.slice(0, 3).map((q: any, i: number) => (
                        <div key={i} className="text-sm p-2 bg-background rounded border">
                          <p className="font-medium">{i + 1}. {q.question_text}</p>
                          <p className="text-green-600 text-xs mt-1">✓ {q.correct_answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {config.contentType === 'exploration' && generatedContent.questions && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Exploration Questions</h4>
                      {generatedContent.questions.slice(0, 3).map((q: string, i: number) => (
                        <div key={i} className="text-sm p-2 bg-background rounded border">
                          {i + 1}. {q}
                        </div>
                      ))}
                    </div>
                  )}

                  {config.contentType === 'course' && generatedContent.modules && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Course Modules ({generatedContent.modules.length})</h4>
                      {generatedContent.modules.slice(0, 2).map((module: any, i: number) => (
                        <div key={i} className="text-sm p-2 bg-background rounded border">
                          <p className="font-medium">{module.title}</p>
                          <p className="text-muted-foreground text-xs">{module.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Content generated successfully. Review and publish when ready.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIContentBuilder;
