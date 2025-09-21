import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  Loader2, 
  Target,
  Compass,
  Trophy,
  Brain,
  Wand2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  Lightbulb,
  Users
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { z } from 'zod';

interface AIGenerationRequest {
  type: 'assessment' | 'exploration' | 'challenge';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetAudience: string;
  tone: 'professional' | 'friendly' | 'empowering' | 'casual';
  questionCount?: number;
  duration?: number;
  customPrompt?: string;
}

interface GeneratedContent {
  title: string;
  description: string;
  content: any;
  metadata: {
    difficulty: string;
    estimatedTime: number;
    category: string;
    tags: string[];
  };
}

interface ContentTemplate {
  id: string;
  name: string;
  type: 'assessment' | 'exploration' | 'challenge';
  description: string;
  template: any;
  isActive: boolean;
}

const contentTypeSchema = z.object({
  type: z.enum(['assessment', 'exploration', 'challenge']),
  topic: z.string().min(5, 'Topic must be at least 5 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  targetAudience: z.string().min(3, 'Target audience is required'),
  tone: z.enum(['professional', 'friendly', 'empowering', 'casual']),
  questionCount: z.number().min(1).max(50).optional(),
  duration: z.number().min(1).max(180).optional(),
  customPrompt: z.string().optional(),
});

const templates: ContentTemplate[] = [
  {
    id: 'personality-assessment',
    name: 'Personality Assessment',
    type: 'assessment',
    description: 'Comprehensive personality evaluation with scoring',
    template: {
      questionTypes: ['single', 'scale', 'multiple'],
      categories: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'],
      scoring: 'personality'
    },
    isActive: true
  },
  {
    id: 'career-exploration',
    name: 'Career Journey',
    type: 'exploration',
    description: 'Guided career discovery and planning session',
    template: {
      phases: ['reflection', 'exploration', 'planning', 'action'],
      duration: 30,
      prompts: []
    },
    isActive: true
  },
  {
    id: 'wellness-challenge',
    name: 'Wellness Challenge',
    type: 'challenge',
    description: 'Health and wellness focused challenge with rewards',
    template: {
      challengeType: 'streak',
      difficulty: 'medium',
      reward: 200
    },
    isActive: true
  }
];

export const AIContentBuilder: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('generator');
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  
  // Generation form state
  const [generationForm, setGenerationForm] = useState<AIGenerationRequest>({
    type: 'assessment',
    topic: '',
    difficulty: 'medium',
    targetAudience: 'general adults',
    tone: 'empowering',
    questionCount: 10,
    duration: 15,
    customPrompt: ''
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [customTemplate, setCustomTemplate] = useState('');
  const [generationHistory, setGenerationHistory] = useState<GeneratedContent[]>([]);

  // Load generation history
  useEffect(() => {
    loadGenerationHistory();
  }, []);

  const loadGenerationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_generation_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      if (data) {
        const history = data.map(item => ({
          title: item.title || 'Untitled',
          description: item.description || '',
          content: item.generated_content,
          metadata: {
            difficulty: item.difficulty || 'medium',
            estimatedTime: item.estimated_time || 15,
            category: item.category || 'general',
            tags: item.tags || []
          }
        }));
        setGenerationHistory(history);
      }
    } catch (error) {
      logger.error('Failed to load generation history', 'AIContentBuilder', error);
    }
  };

  const handleGenerateContent = async () => {
    try {
      setLoading(true);
      setFormErrors({});
      
      // Validate form
      const validated = contentTypeSchema.parse(generationForm);
      
      let endpoint = '';
      let requestBody: any = {
        topic: validated.topic,
        difficulty: validated.difficulty,
        target_audience: validated.targetAudience,
        tone: validated.tone,
        custom_prompt: validated.customPrompt
      };

      switch (validated.type) {
        case 'assessment':
          endpoint = 'create-assessment';
          requestBody = {
            ...requestBody,
            type: 'personality',
            question_count: validated.questionCount || 10
          };
          break;
        case 'exploration':
          endpoint = 'create-exploration';
          requestBody = {
            ...requestBody,
            estimated_duration: validated.duration || 20,
            prompt_count: validated.questionCount || 8
          };
          break;
        case 'challenge':
          endpoint = 'create-challenge';
          requestBody = {
            ...requestBody,
            challenge_type: 'completion',
            reward: 150
          };
          break;
      }

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: requestBody
      });

      if (error) throw error;

      if (data) {
        const content: GeneratedContent = {
          title: data.title || `AI Generated ${validated.type}`,
          description: data.description || '',
          content: data,
          metadata: {
            difficulty: validated.difficulty,
            estimatedTime: validated.duration || 15,
            category: validated.targetAudience,
            tags: [validated.type, validated.difficulty, validated.tone]
          }
        };

        setGeneratedContent(content);
        
        // Save to history
        await saveToHistory(content, validated);
        
        toast({
          title: "Content Generated Successfully",
          description: `Your ${validated.type} has been created with AI assistance.`,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(fieldErrors);
      } else {
        logger.error('AI content generation failed', 'AIContentBuilder', error);
        toast({
          title: "Generation Failed",
          description: error instanceof Error ? error.message : "Failed to generate content",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async (content: GeneratedContent, request: AIGenerationRequest) => {
    try {
      const { error } = await supabase
        .from('ai_generation_history')
        .insert([{
          title: content.title,
          description: content.description,
          content_type: request.type,
          generated_content: content.content,
          difficulty: request.difficulty,
          estimated_time: request.duration || 15,
          category: request.targetAudience,
          tags: content.metadata.tags,
          generation_prompt: request.customPrompt || `${request.topic} - ${request.tone} tone for ${request.targetAudience}`
        }]);

      if (error) throw error;
      await loadGenerationHistory();
    } catch (error) {
      logger.error('Failed to save to history', 'AIContentBuilder', error);
    }
  };

  const handleSaveContent = async () => {
    if (!generatedContent) return;

    try {
      setLoading(true);
      
      const contentType = generationForm.type;
      let tableName = '';
      let payload: any = {};

      switch (contentType) {
        case 'assessment':
          tableName = 'assessments';
          payload = {
            title: generatedContent.title,
            description: generatedContent.description,
            type: 'personality',
            visibility: 'public',
            ai_provider: 'openai',
            ai_model: 'gpt-4o-mini',
            ai_prompt: generationForm.customPrompt || generationForm.topic,
            questions: generatedContent.content.questions || [],
            scoring: generatedContent.content.scoring || {},
            results: generatedContent.content.results || {}
          };
          break;
        case 'exploration':
          tableName = 'explorations';
          payload = {
            title: generatedContent.title,
            description: generatedContent.description,
            questions: generatedContent.content.prompts || [],
            difficulty_level: generatedContent.metadata.difficulty,
            category: generatedContent.metadata.category,
            crystal_reward: 150,
            estimated_duration: generatedContent.metadata.estimatedTime,
            facilitator_prompt: generatedContent.content.facilitator_prompt || 'Guide with empathy',
            higher_self_prompt: generatedContent.content.higher_self_prompt || 'Encourage wisdom',
            visibility: 'public',
            is_active: true
          };
          break;
        case 'challenge':
          tableName = 'content_challenges';
          payload = {
            title: generatedContent.title,
            description: generatedContent.description,
            challenge_type: 'completion',
            difficulty: generatedContent.metadata.difficulty,
            reward: 200,
            is_active: true
          };
          break;
      }

      const { error } = await supabase
        .from(tableName)
        .insert([payload]);

      if (error) throw error;

      toast({
        title: "Content Saved",
        description: `Your ${contentType} has been saved and is now available.`,
      });

      setGeneratedContent(null);
    } catch (error) {
      logger.error('Failed to save content', 'AIContentBuilder', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setGenerationForm(prev => ({
      ...prev,
      type: template.type,
      topic: `${template.name} focused on ${prev.topic || 'personal growth'}`,
      questionCount: template.type === 'assessment' ? 15 : 8,
      duration: template.type === 'exploration' ? 25 : 15
    }));
    setActiveTab('generator');
  };

  const renderGeneratedContent = () => {
    if (!generatedContent) return null;

    return (
      <Card className="glass-strong">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Generated Content
              </CardTitle>
              <CardDescription>Review and customize before saving</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setGeneratedContent(null)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New
              </Button>
              <Button onClick={handleSaveContent} disabled={loading} className="bg-gradient-primary">
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Save Content</>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input 
                value={generatedContent.title} 
                onChange={(e) => setGeneratedContent(prev => prev ? {...prev, title: e.target.value} : null)}
                className="glass-input"
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{generatedContent.metadata.difficulty}</Badge>
              <Badge variant="outline">{generatedContent.metadata.estimatedTime} min</Badge>
              <Badge variant="outline">{generatedContent.metadata.category}</Badge>
            </div>
          </div>
          
          <div>
            <Label>Description</Label>
            <Textarea 
              value={generatedContent.description}
              onChange={(e) => setGeneratedContent(prev => prev ? {...prev, description: e.target.value} : null)}
              className="glass-input"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Generated Content Preview</Label>
            <div className="p-4 rounded-lg glass bg-muted/20">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {JSON.stringify(generatedContent.content, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI Content Builder
          </CardTitle>
          <CardDescription>
            Create assessments, explorations, and challenges with AI assistance
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass">
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            AI Generator
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Content Generation Settings</CardTitle>
              <CardDescription>
                Configure the AI to generate content that matches your needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select 
                    value={generationForm.type} 
                    onValueChange={(value: 'assessment' | 'exploration' | 'challenge') => 
                      setGenerationForm(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assessment">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Assessment
                        </div>
                      </SelectItem>
                      <SelectItem value="exploration">
                        <div className="flex items-center gap-2">
                          <Compass className="h-4 w-4" />
                          Exploration
                        </div>
                      </SelectItem>
                      <SelectItem value="challenge">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          Challenge
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.type && <p className="text-sm text-destructive">{formErrors.type}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select 
                    value={generationForm.difficulty} 
                    onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                      setGenerationForm(prev => ({ ...prev, difficulty: value }))
                    }
                  >
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input 
                    value={generationForm.targetAudience}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="e.g., young professionals, students, parents"
                    className="glass-input"
                  />
                  {formErrors.targetAudience && <p className="text-sm text-destructive">{formErrors.targetAudience}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select 
                    value={generationForm.tone} 
                    onValueChange={(value: 'professional' | 'friendly' | 'empowering' | 'casual') => 
                      setGenerationForm(prev => ({ ...prev, tone: value }))
                    }
                  >
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="empowering">Empowering</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {generationForm.type === 'assessment' && (
                  <div className="space-y-2">
                    <Label>Number of Questions</Label>
                    <Input 
                      type="number"
                      min="5"
                      max="50"
                      value={generationForm.questionCount || 10}
                      onChange={(e) => setGenerationForm(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                      className="glass-input"
                    />
                  </div>
                )}

                {generationForm.type === 'exploration' && (
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input 
                      type="number"
                      min="5"
                      max="180"
                      value={generationForm.duration || 15}
                      onChange={(e) => setGenerationForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="glass-input"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Topic/Theme</Label>
                <Input 
                  value={generationForm.topic}
                  onChange={(e) => setGenerationForm(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., emotional intelligence, career transition, mindfulness"
                  className="glass-input"
                />
                {formErrors.topic && <p className="text-sm text-destructive">{formErrors.topic}</p>}
              </div>

              <div className="space-y-2">
                <Label>Custom Instructions (Optional)</Label>
                <Textarea 
                  value={generationForm.customPrompt || ''}
                  onChange={(e) => setGenerationForm(prev => ({ ...prev, customPrompt: e.target.value }))}
                  placeholder="Add specific requirements, focus areas, or style preferences..."
                  className="glass-input"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleGenerateContent} 
                  disabled={loading || !generationForm.topic.trim()}
                  className="bg-gradient-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {renderGeneratedContent()}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Content Templates</CardTitle>
              <CardDescription>
                Pre-built templates to speed up content creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="glass cursor-pointer hover:glass-glow transition-all">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant="outline">{template.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUseTemplate(template)}
                          className="w-full glass"
                        >
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Generation History</CardTitle>
              <CardDescription>
                Recent AI-generated content and templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generationHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No generation history yet</p>
                  <p className="text-sm">Generated content will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generationHistory.map((item, index) => (
                    <Card key={index} className="glass">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                            <div className="flex gap-2 mt-2">
                              {item.metadata.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIContentBuilder;