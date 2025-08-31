import { useState } from 'react';
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
