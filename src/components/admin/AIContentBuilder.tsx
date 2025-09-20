import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { openaiService } from '@/services/ai/openai.service';
import { 
  Wand2, 
  Save, 
  Download, 
  Upload, 
  RefreshCw, 
  Settings, 
  Eye,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  FileText,
  HelpCircle,
  Target
} from 'lucide-react';

interface ContentTemplate {
  id: string;
  type: 'assessment' | 'quiz' | 'exploration' | 'course';
  title: string;
  description: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  questions: GeneratedQuestion[];
  metadata: {
    category: string;
    tags: string[];
    learningObjectives: string[];
    prerequisites?: string[];
  };
  status: 'draft' | 'review' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

interface GeneratedQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'true_false' | 'open_ended' | 'scenario';
  options?: { id: string; text: string; value: number; explanation?: string }[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  category?: string;
  explanation?: string;
  difficulty: number;
}

interface GenerationRequest {
  topic: string;
  contentType: 'assessment' | 'quiz' | 'exploration' | 'course';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionCount: number;
  category: string;
  audience: 'visitors' | 'users' | 'premium';
  additionalInstructions?: string;
}

export const AIContentBuilder: React.FC = () => {
  const { toast } = useToast();
  const [generationRequest, setGenerationRequest] = useState<GenerationRequest>({
    topic: '',
    contentType: 'assessment',
    difficulty: 'intermediate',
    questionCount: 10,
    category: 'personality',
    audience: 'users',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<ContentTemplate | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<ContentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const categories = [
    'personality', 'wellness', 'career', 'relationships', 'mindfulness', 
    'growth', 'leadership', 'creativity', 'emotional-intelligence', 'communication'
  ];

  const contentTypes = [
    { value: 'assessment', label: 'Assessment', icon: '📊', description: 'Comprehensive personality or skill evaluation' },
    { value: 'quiz', label: 'Quiz', icon: '❓', description: 'Quick knowledge or preference check' },
    { value: 'exploration', label: 'Exploration', icon: '🔍', description: 'Self-discovery and reflection exercise' },
    { value: 'course', label: 'Course', icon: '📚', description: 'Multi-part learning experience' }
  ];

  /**
   * Load saved templates
   */
  useEffect(() => {
    loadSavedTemplates();
  }, []);

  const loadSavedTemplates = async () => {
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll use localStorage as a demo
      const saved = localStorage.getItem('ai_generated_templates');
      if (saved) {
        setSavedTemplates(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  /**
   * Generate content using AI
   */
  const generateContent = async () => {
    if (!generationRequest.topic.trim()) {
      toast({
        title: 'Topic Required',
        description: 'Please enter a topic for content generation.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Create prompt for AI content generation
      const prompt = createGenerationPrompt(generationRequest);
      
      // Call OpenAI API
      const response = await openaiService.generateCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are an expert in creating psychological assessments, quizzes, and educational content. You create engaging, scientifically-informed, and well-structured content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        maxTokens: 3000,
      });

      // Parse the AI response
      const generatedData = parseAIResponse(response.choices[0].message.content);
      
      // Create content template
      const template: ContentTemplate = {
        id: `ai_${Date.now()}`,
        type: generationRequest.contentType,
        title: generatedData.title,
        description: generatedData.description,
        topic: generationRequest.topic,
        difficulty: generationRequest.difficulty,
        estimatedTime: calculateEstimatedTime(generatedData.questions.length, generationRequest.contentType),
        questions: generatedData.questions,
        metadata: {
          category: generationRequest.category,
          tags: generatedData.tags || [],
          learningObjectives: generatedData.learningObjectives || [],
          prerequisites: generatedData.prerequisites,
        },
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setGeneratedContent(template);

      toast({
        title: 'Content Generated!',
        description: `Successfully generated ${generationRequest.contentType} with ${template.questions.length} questions.`,
      });

    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Create AI generation prompt
   */
  const createGenerationPrompt = (request: GenerationRequest): string => {
    return `Create a comprehensive ${request.contentType} about "${request.topic}" with the following specifications:

Content Type: ${request.contentType}
Difficulty Level: ${request.difficulty}
Number of Questions: ${request.questionCount}
Category: ${request.category}
Target Audience: ${request.audience}
${request.additionalInstructions ? `Additional Instructions: ${request.additionalInstructions}` : ''}

Please provide a JSON response with the following structure:
{
  "title": "Engaging title for the ${request.contentType}",
  "description": "Compelling description that explains what users will learn or discover",
  "questions": [
    {
      "id": "q1",
      "question": "Well-crafted question text",
      "type": "multiple_choice|scale|true_false|open_ended",
      "options": [{"id": "a", "text": "Option text", "value": 1-5, "explanation": "Why this option represents this score"}],
      "scaleMin": 1,
      "scaleMax": 10,
      "scaleLabels": {"min": "Low end label", "max": "High end label"},
      "category": "Aspect being measured",
      "explanation": "What this question measures and why it's important",
      "difficulty": 1-5
    }
  ],
  "tags": ["relevant", "tags", "for", "content"],
  "learningObjectives": ["What users will learn or discover"],
  "prerequisites": ["Optional prerequisites if any"]
}

Guidelines:
- Make questions psychologically sound and engaging
- Ensure questions are appropriate for ${request.difficulty} level
- Include diverse question types for engagement
- Provide clear, non-biased language
- Create meaningful result categories if applicable
- Focus on actionable insights and personal growth`;
  };

  /**
   * Parse AI response
   */
  const parseAIResponse = (response: string): any => {
    try {
      // Extract JSON from response (handle cases where AI adds explanation text)
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}') + 1;
      const jsonStr = response.substring(jsonStart, jsonEnd);
      
      const parsed = JSON.parse(jsonStr);
      
      // Add IDs to questions if missing
      parsed.questions = parsed.questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q${index + 1}`,
        options: q.options?.map((opt: any, optIndex: number) => ({
          ...opt,
          id: opt.id || `q${index + 1}_${String.fromCharCode(97 + optIndex)}`,
        })) || undefined,
      }));

      return parsed;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  };

  /**
   * Calculate estimated time
   */
  const calculateEstimatedTime = (questionCount: number, contentType: string): number => {
    const baseTime = {
      assessment: 1.5, // minutes per question
      quiz: 0.8,
      exploration: 2,
      course: 3,
    };

    return Math.round(questionCount * (baseTime[contentType as keyof typeof baseTime] || 1.5));
  };

  /**
   * Save template
   */
  const saveTemplate = async (template: ContentTemplate) => {
    try {
      // Update template
      const updatedTemplate = {
        ...template,
        updatedAt: new Date(),
      };

      // Save to storage (in real implementation, this would be database)
      const existingIndex = savedTemplates.findIndex(t => t.id === template.id);
      let updatedTemplates;

      if (existingIndex >= 0) {
        updatedTemplates = [...savedTemplates];
        updatedTemplates[existingIndex] = updatedTemplate;
      } else {
        updatedTemplates = [...savedTemplates, updatedTemplate];
      }

      setSavedTemplates(updatedTemplates);
      localStorage.setItem('ai_generated_templates', JSON.stringify(updatedTemplates));

      toast({
        title: 'Template Saved',
        description: 'Content template has been saved successfully.',
      });

      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save template. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  /**
   * Publish template
   */
  const publishTemplate = async (template: ContentTemplate) => {
    try {
      // Update status to published
      const publishedTemplate = {
        ...template,
        status: 'published' as const,
        updatedAt: new Date(),
      };

      // Save the published template
      await saveTemplate(publishedTemplate);

      // Here you would also save to the main assessments/content database
      // For demo purposes, we'll just update local state

      toast({
        title: 'Content Published!',
        description: 'Your content is now available to users.',
      });

    } catch (error) {
      console.error('Error publishing template:', error);
      toast({
        title: 'Publishing Failed',
        description: 'Failed to publish content. Please try again.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Delete template
   */
  const deleteTemplate = async (templateId: string) => {
    try {
      const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
      setSavedTemplates(updatedTemplates);
      localStorage.setItem('ai_generated_templates', JSON.stringify(updatedTemplates));

      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
      if (generatedContent?.id === templateId) {
        setGeneratedContent(null);
      }

      toast({
        title: 'Template Deleted',
        description: 'Content template has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Export template
   */
  const exportTemplate = (template: ContentTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Exported',
      description: 'Template has been downloaded as JSON file.',
    });
  };

  /**
   * Render question preview
   */
  const renderQuestionPreview = (question: GeneratedQuestion, index: number) => {
    return (
      <Card key={question.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">Question {index + 1}</CardTitle>
            <Badge variant="outline" className="capitalize">
              {question.type.replace('_', ' ')}
            </Badge>
          </div>
          <CardDescription>{question.question}</CardDescription>
        </CardHeader>
        <CardContent>
          {question.type === 'multiple_choice' && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 p-2 border rounded">
                  <div className="w-4 h-4 border rounded-full"></div>
                  <span className="flex-1">{option.text}</span>
                  <Badge variant="secondary">{option.value}</Badge>
                </div>
              ))}
            </div>
          )}
          
          {question.type === 'scale' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{question.scaleLabels?.min}</span>
                <span>{question.scaleLabels?.max}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="w-1/2 h-full bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex justify-between text-xs">
                <span>{question.scaleMin}</span>
                <span>{question.scaleMax}</span>
              </div>
            </div>
          )}

          {question.explanation && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">{question.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-6 h-6" />
            AI Content Builder
          </CardTitle>
          <CardDescription>
            Generate assessments, quizzes, explorations, and courses using AI. Simply provide a topic and let AI create comprehensive content for you.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="preview">Preview & Edit</TabsTrigger>
          <TabsTrigger value="manage">Manage Templates</TabsTrigger>
        </TabsList>

        {/* Generate Content Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Generation Settings</CardTitle>
              <CardDescription>
                Configure the parameters for AI content generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Emotional Intelligence, Leadership Skills, Stress Management"
                    value={generationRequest.topic}
                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select
                    value={generationRequest.contentType}
                    onValueChange={(value: any) => setGenerationRequest(prev => ({ ...prev, contentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={generationRequest.difficulty}
                    onValueChange={(value: any) => setGenerationRequest(prev => ({ ...prev, difficulty: value }))}
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

                <div className="space-y-2">
                  <Label htmlFor="questionCount">Number of Questions</Label>
                  <Input
                    id="questionCount"
                    type="number"
                    min={5}
                    max={50}
                    value={generationRequest.questionCount}
                    onChange={(e) => setGenerationRequest(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={generationRequest.category}
                    onValueChange={(value) => setGenerationRequest(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          <span className="capitalize">{category.replace('-', ' ')}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select
                    value={generationRequest.audience}
                    onValueChange={(value: any) => setGenerationRequest(prev => ({ ...prev, audience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visitors">Visitors (Free)</SelectItem>
                      <SelectItem value="users">Registered Users</SelectItem>
                      <SelectItem value="premium">Premium Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInstructions">Additional Instructions (Optional)</Label>
                <Textarea
                  id="additionalInstructions"
                  placeholder="Any specific requirements, focus areas, or constraints for the content generation..."
                  value={generationRequest.additionalInstructions || ''}
                  onChange={(e) => setGenerationRequest(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button
                onClick={generateContent}
                disabled={isGenerating || !generationRequest.topic.trim()}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Content...
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
        </TabsContent>

        {/* Preview & Edit Tab */}
        <TabsContent value="preview" className="space-y-6">
          {generatedContent ? (
            <div className="space-y-6">
              {/* Content Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{generatedContent.title}</CardTitle>
                      <CardDescription className="text-lg mt-2">
                        {generatedContent.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => saveTemplate(generatedContent)}
                        variant="outline"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                      </Button>
                      <Button
                        onClick={() => publishTemplate(generatedContent)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Publish
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span className="capitalize">{generatedContent.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="capitalize">{generatedContent.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HelpCircle className="w-4 h-4" />
                      <span>{generatedContent.questions.length} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>~{generatedContent.estimatedTime} minutes</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {generatedContent.metadata.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Questions Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Questions Preview</CardTitle>
                  <CardDescription>
                    Review and edit the generated questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generatedContent.questions.map((question, index) => 
                      renderQuestionPreview(question, index)
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Objectives */}
              {generatedContent.metadata.learningObjectives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Objectives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {generatedContent.metadata.learningObjectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Content Generated</h3>
                <p className="text-muted-foreground">
                  Generate content first to see the preview here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manage Templates Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Templates</CardTitle>
              <CardDescription>
                Manage your AI-generated content templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2">{template.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {template.description}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant={template.status === 'published' ? 'default' : 'secondary'}
                            className="ml-2"
                          >
                            {template.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="capitalize">{template.type}</span>
                          <span>{template.questions.length} questions</span>
                          <span>{template.estimatedTime}min</span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setGeneratedContent(template);
                              // Switch to preview tab
                              const tabTrigger = document.querySelector('[value="preview"]') as HTMLElement;
                              tabTrigger?.click();
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportTemplate(template)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Export
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Templates Saved</h3>
                  <p className="text-muted-foreground">
                    Generate and save content templates to see them here.
                  </p>
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