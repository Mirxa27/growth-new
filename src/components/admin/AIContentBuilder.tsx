import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wand2, 
  Save, 
  Loader2,
  Brain,
  BookOpen,
  Target,
  Sparkles,
  Settings,
  Eye,
  Download,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIBuilderConfig {
  topic: string;
  additionalContext: string;
  targetAudience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  contentType: 'assessment' | 'quiz' | 'exploration' | 'course';
  questionCount: number;
  estimatedDuration: number;
  isPublic: boolean;
  requiresSignup: boolean;
  customInstructions: string;
}

interface GeneratedContent {
  id?: string;
  title: string;
  description: string;
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
