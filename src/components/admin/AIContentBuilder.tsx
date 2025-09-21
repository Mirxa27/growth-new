import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

import {
  Sparkles,
  Wand2,
  Brain,
  BookOpen,
  Target,
  CheckCircle,
  RefreshCw,

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

  Settings,
  AlertCircle,
  Lightbulb,
  Zap,
  Plus,
  Filter
=======
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  FileText,
  HelpCircle,
  Target

} from 'lucide-react';


type ContentType = 'assessment' | 'course' | 'exploration';
type TemplateFilter = 'all' | ContentType;

interface AIContentBuilderProps {
  onContentPublished?: (result: { type: ContentType; id: string; title?: string }) => void;
}

interface AIBuildJob {
  id: string;
  job_type: ContentType;
  target_type: string;
  ai_provider: string;
  ai_model: string;
  prompt: string;
  parameters: Record<string, unknown> | null;
  content_specs: ContentSpecs | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  generated_content: unknown;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
  admin_id?: string | null;
  created_assessment_id?: string | null;
  created_course_id?: string | null;
  created_exploration_id?: string | null;
}

interface AIBuildJobInsert {
  job_type: ContentType;
  target_type: string;
  ai_provider: string;
  ai_model: string;
  prompt: string;
  parameters: Record<string, unknown>;
  content_specs: ContentSpecs;

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

  learning_objectives: string[];
  question_count?: number;
  assessment_type?: string;
  include_explanations: boolean;
  include_media: boolean;
  tone: string;
  tags?: string[];
  visibility?: 'public' | 'private';
  estimated_time?: number;
  auto_publish?: boolean;
  description?: string;
  category?: string;
  crystal_reward?: number;
}

type TemplateDefinition = {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  specs: Partial<ContentSpecs> & { topic: string; learning_objectives?: string[] };
  prompt?: string;
};

type AIProvider = 'openai' | 'anthropic' | 'google';

interface AISettings {
  provider: AIProvider;
  model: string;
  temperature: number;
  max_tokens: number;
}

type UnknownRecord = Record<string, unknown>;

interface PromptPreviewState {
  mode: 'prompt';
  prompt: string;
  specs: ContentSpecs;
  settings: AISettings;

  contentType: 'assessment' | 'quiz' | 'exploration' | 'course';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionCount: number;
  category: string;
  audience: 'visitors' | 'users' | 'premium';
  additionalInstructions?: string;

}

interface JobPreviewState {
  mode: 'job';
  job: AIBuildJob;
  parsedContent: UnknownRecord;
}

type PreviewState = PromptPreviewState | JobPreviewState;

type BuilderTab = 'create' | 'jobs' | 'templates';

const AI_PROVIDER_OPTIONS: readonly AIProvider[] = ['openai', 'anthropic', 'google'];

const isKnownProvider = (value: string): value is AIProvider =>
  (AI_PROVIDER_OPTIONS as readonly string[]).includes(value);

const DEFAULT_CONTENT_SPECS: ContentSpecs = {
  target_audience: 'general',
  difficulty: 'intermediate',
  length: 'medium',
  topic: '',
  learning_objectives: [],
  question_count: 10,
  assessment_type: 'multiple_choice',
  include_explanations: true,
  include_media: false,
  tone: 'professional',
  visibility: 'private',
  auto_publish: false,
  description: '',
  category: 'self-discovery',
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseJsonRecord = (value: unknown): UnknownRecord => {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return isRecord(parsed) ? parsed : {};
    } catch (error) {
      logger.warn('Failed to parse JSON payload', 'AIContentBuilder', error);
      return {};
    }
  }

  return isRecord(value) ? value : {};
};

const toStringSafe = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
};

const toOptionalString = (value: unknown): string | null => {
  const result = toStringSafe(value);
  return result ? result : null;
};

const toNumberSafe = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const toBooleanSafe = (value: unknown): boolean => value === true || value === 'true';

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toOptionalString(item))
    .filter((item): item is string => Boolean(item));
};

const toUnknownArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickFirstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const normalized = toOptionalString(value);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const extractText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value.trim() ? value : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (isRecord(value)) {
    return (
      pickFirstString(
        value.text,
        value.label,
        value.option,
        value.title,
        value.value,
        value.prompt,
        value.answer,
        value.description,
        value.name,
      ) ?? null
    );
  }

  return null;
};

const clampProgress = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
};

const normalizeId = (value: unknown): string => {
  const normalized = toOptionalString(value);
  return normalized ?? '';
};

const resolveRecordId = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (Array.isArray(value) && value.length > 0) {
    return resolveRecordId(value[0]);
  }

  if (isRecord(value)) {
    return (
      toOptionalString(value.id)
      ?? toOptionalString(value.assessment_id)
      ?? toOptionalString(value.record_id)
      ?? null
    );
  }

  return null;
};

const normalizeJobStatus = (
  value: unknown,
): AIBuildJob['status'] => {
  const normalized = toStringSafe(value).toLowerCase();
  switch (normalized) {
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'in_progress':
      return 'in_progress';
    case 'cancelled':
      return 'cancelled';
    case 'pending':
    default:
      return 'pending';
  }
};

const normalizeJobType = (value: unknown): ContentType => {
  const normalized = toStringSafe(value).toLowerCase();
  if (normalized === 'course') return 'course';
  if (normalized === 'exploration') return 'exploration';
  return 'assessment';
};

const mergeContentSpecs = (
  base: ContentSpecs,
  partial?: Partial<ContentSpecs> | null,
): ContentSpecs => {
  if (!partial) {
    return { ...base };
  }

  return {
    ...base,
    ...partial,
    learning_objectives: partial.learning_objectives
      ? partial.learning_objectives.filter((item) => Boolean(item?.trim?.()))
      : base.learning_objectives,
    tags: partial.tags ?? base.tags,
    visibility: partial.visibility ?? base.visibility,
    question_count: partial.question_count ?? base.question_count,
    include_explanations: partial.include_explanations ?? base.include_explanations,
    include_media: partial.include_media ?? base.include_media,
    estimated_time: partial.estimated_time ?? base.estimated_time,
    auto_publish: partial.auto_publish ?? base.auto_publish,
    description: partial.description ?? base.description,
    category: partial.category ?? base.category,
    crystal_reward: partial.crystal_reward ?? base.crystal_reward,
  };
};

const sanitizeContentSpecs = (specs: ContentSpecs): ContentSpecs => {
  const merged = mergeContentSpecs(DEFAULT_CONTENT_SPECS, specs);
  return {
    ...merged,
    topic: merged.topic.trim(),
    target_audience: merged.target_audience.trim() || DEFAULT_CONTENT_SPECS.target_audience,
    learning_objectives: merged.learning_objectives
      .map((objective) => objective.trim())
      .filter((objective) => objective.length > 0),
    tags: merged.tags
      ? merged.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : merged.tags,
  };
};

const normalizeContentSpecsFromPayload = (payload: unknown): ContentSpecs => {
  const record = parseJsonRecord(payload);
  const partial: Partial<ContentSpecs> = {};

  const targetAudience = toOptionalString(record.target_audience);
  if (targetAudience) partial.target_audience = targetAudience;

  const difficulty = toOptionalString(record.difficulty);
  if (difficulty) partial.difficulty = difficulty;

  const lengthValue = toOptionalString(record.length);
  if (lengthValue) partial.length = lengthValue;

  const topic = toOptionalString(record.topic);
  if (topic) partial.topic = topic;

  const description = toOptionalString(record.description);
  if (description) partial.description = description;

  const category = toOptionalString(record.category);
  if (category) partial.category = category;

  const tags = toStringArray(record.tags);
  if (tags.length > 0) partial.tags = tags;

  const learningObjectives = toStringArray(record.learning_objectives);
  if (learningObjectives.length > 0) {
    partial.learning_objectives = learningObjectives;
  }

  if ('question_count' in record) {
    const count = toNumberSafe(record.question_count, DEFAULT_CONTENT_SPECS.question_count ?? 10);
    partial.question_count = Math.max(1, Math.round(count));
  }

  const assessmentType = toOptionalString(record.assessment_type);
  if (assessmentType) partial.assessment_type = assessmentType;

  if ('include_explanations' in record) {
    partial.include_explanations = toBooleanSafe(record.include_explanations);
  }

  if ('include_media' in record) {
    partial.include_media = toBooleanSafe(record.include_media);
  }

  const tone = toOptionalString(record.tone);
  if (tone) partial.tone = tone;

  const visibility = toOptionalString(record.visibility)?.toLowerCase();
  if (visibility === 'public' || visibility === 'private') {
    partial.visibility = visibility;
  }

  if ('estimated_time' in record) {
    const estimated = toNumberSafe(record.estimated_time, DEFAULT_CONTENT_SPECS.estimated_time ?? 0);
    partial.estimated_time = Math.max(0, Math.round(estimated));
  }

  if ('auto_publish' in record) {
    partial.auto_publish = toBooleanSafe(record.auto_publish);
  }

  if ('crystal_reward' in record) {
    const reward = toNumberSafe(record.crystal_reward, DEFAULT_CONTENT_SPECS.crystal_reward ?? 0);
    partial.crystal_reward = Math.max(0, Math.round(reward));
  }

  return mergeContentSpecs(DEFAULT_CONTENT_SPECS, partial);
};

const normalizeJob = (payload: unknown): AIBuildJob | null => {
  const record = parseJsonRecord(payload);
  const id = normalizeId(record.id);
  if (!id) {
    return null;
  }

  const jobType = normalizeJobType(record.job_type);
  const status = normalizeJobStatus(record.status);
  const progress = clampProgress(toNumberSafe(record.progress, 0));

  const parametersValue = record.parameters;
  const parameters = parametersValue ? parseJsonRecord(parametersValue) : null;

  const contentSpecsValue = record.content_specs;
  const contentSpecs = contentSpecsValue ? normalizeContentSpecsFromPayload(contentSpecsValue) : null;

  const generatedContent = record.generated_content ?? null;

  return {
    id,
    job_type: jobType,
    target_type: toOptionalString(record.target_type) ?? jobType,
    ai_provider: toOptionalString(record.ai_provider) ?? 'openai',
    ai_model: toOptionalString(record.ai_model) ?? 'gpt-4',
    prompt: toOptionalString(record.prompt) ?? '',
    parameters,
    content_specs: contentSpecs,
    status,
    progress,
    generated_content: generatedContent,
    error_message: toOptionalString(record.error_message),
    created_at: toOptionalString(record.created_at) ?? new Date().toISOString(),
    completed_at: toOptionalString(record.completed_at),
    admin_id: toOptionalString(record.admin_id),
    created_assessment_id: toOptionalString(record.created_assessment_id),
    created_course_id: toOptionalString(record.created_course_id),
    created_exploration_id: toOptionalString(record.created_exploration_id),
  };
};

const parseGeneratedContent = (payload: unknown): UnknownRecord => {
  if (payload === null || typeof payload === 'undefined') {
    return {};
  }

  if (typeof payload === 'string') {
    return parseJsonRecord(payload);
  }

  return isRecord(payload) ? payload : {};
};

const TEMPLATE_TYPE_LABELS: Record<ContentType, string> = {
  assessment: 'Assessment',
  course: 'Course',
  exploration: 'Exploration',
};

const TEMPLATE_TYPE_ICONS: Record<ContentType, React.ComponentType<{ className?: string }>> = {
  assessment: Target,
  course: BookOpen,
  exploration: Brain,
};

const CONTENT_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'assessment-resilience',
    title: 'Emotional Resilience Pulse',
    description: 'Motivational resilience check-in exploring coping skills, stress triggers, and recovery habits.',
    type: 'assessment',
    specs: {
      topic: 'Emotional Resilience',
      learning_objectives: [
        'Identify current resilience and recovery habits',
        'Surface the most frequent stress triggers and support patterns',
        'Recommend immediate micro-habits to boost resilience',
      ],
      question_count: 10,
      tone: 'motivational',
      assessment_type: 'multiple_choice',
      include_explanations: true,
      include_media: false,
      difficulty: 'intermediate',
      visibility: 'private',
      length: 'medium',
      estimated_time: 20,
      tags: ['resilience', 'stress', 'wellness'],
    },
    prompt:
      'Design an uplifting resilience assessment for women balancing leadership, caregiving, and personal growth. Blend empathetic tone, research-backed coping strategies, and prompts that invite honest reflection. Provide 10 multiple choice questions with coaching-style explanations that reference supportive habits, community resources, and micro-recovery breaks.',
  },
  {
    id: 'assessment-purpose',
    title: 'Purpose & Fulfilment Index',
    description: 'Career and life alignment assessment diagnosing values, energy leaks, and vision clarity.',
    type: 'assessment',
    specs: {
      topic: 'Purpose and Fulfilment',
      learning_objectives: [
        'Clarify current career and life satisfaction drivers',
        'Highlight energy leaks in routines and relationships',
        'Provide recommendations to realign with core values',
      ],
      question_count: 12,
      tone: 'reflective',
      assessment_type: 'multiple_choice',
      include_explanations: true,
      visibility: 'private',
      length: 'medium',
      estimated_time: 25,
    },
  },
  {
    id: 'course-morning',
    title: 'Mindful Morning Reset',
    description: 'A 4-module micro-course guiding a compassionate morning ritual with somatic grounding.',
    type: 'course',
    specs: {
      topic: 'Mindful Morning Routine',
      learning_objectives: [
        'Introduce a gentle body-based awakening practice',
        'Anchor daily intentions through values-based journaling',
        'Design a personalized ritual balancing focus and softness',
        'Track progress with celebratory micro-reflections',
      ],
      tone: 'friendly',
      length: 'medium',
      visibility: 'public',
      include_media: true,
      include_explanations: false,
      tags: ['routine', 'mindfulness', 'ritual'],
    },
    prompt:
      'Create a four-module course that helps busy professionals craft a mindful morning ritual. Blend nervous system regulation, gentle movement, breath work, journaling prompts, and celebration moments. Include estimated timings, guided meditations, reflection prompts, and one downloadable worksheet per module.',
  },
  {
    id: 'course-burnout',
    title: 'Burnout Recovery Studio',
    description: 'Evidence-based 6-module curriculum for restoring energy, boundaries, and self-advocacy.',
    type: 'course',
    specs: {
      topic: 'Burnout Recovery',
      learning_objectives: [
        'Diagnose the dominant burnout archetype and its signals',
        'Rebuild energy through restorative nervous system protocols',
        'Establish courageous boundaries and communication scripts',
        'Design a sustainable maintenance plan with accountability rituals',
      ],
      tone: 'professional',
      length: 'long',
      visibility: 'private',
      include_media: true,
      include_explanations: true,
      tags: ['career', 'leadership', 'wellbeing'],
    },
  },
  {
    id: 'exploration-higher-self',
    title: 'Higher Self Alignment Journey',
    description: 'Guided inquiry blending somatic check-ins, visualization, and future-self dialogue.',
    type: 'exploration',
    specs: {
      topic: 'Higher Self Alignment',
      learning_objectives: [
        'Surface current desires and misalignments',
        'Connect with inner wisdom and compassionate self-guidance',
        'Define three grounded actions to embody the insights',
      ],
      tone: 'motivational',
      length: 'medium',
      visibility: 'private',
      include_media: false,
      estimated_time: 25,
    },
    prompt:
      'Craft an exploration that guides the participant through grounding, values reflection, and a conversation with their future self. Provide 7 structured prompts, each followed by a gentle integration instruction. Encourage sensory descriptions, emotional honesty, and somatic awareness.',
  },
  {
    id: 'exploration-career',
    title: 'Career North Star Mapping',
    description: 'Strategic career exploration focusing on signature strengths, dream scenarios, and experiments.',
    type: 'exploration',
    specs: {
      topic: 'Career Visioning',
      learning_objectives: [
        'Clarify signature strengths and joyful contributions',
        'Visualize an ideal career day aligned with values',
        'Design bold but safe experiments to test next steps',
      ],
      tone: 'professional',
      length: 'medium',
      visibility: 'public',
      include_media: false,
      estimated_time: 30,
      tags: ['career', 'vision', 'strategy'],
    },
  },
];

export const AIContentBuilder: React.FC<AIContentBuilderProps> = ({ onContentPublished }) => {
  const { toast } = useToast();

  const { isAdmin, verified } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<BuilderTab>('create');
  const [contentType, setContentType] = useState<ContentType>('assessment');
  const [buildJobs, setBuildJobs] = useState<AIBuildJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [publishingJobId, setPublishingJobId] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>('all');

  const filteredTemplates = useMemo(() => {
    if (templateFilter === 'all') {
      return CONTENT_TEMPLATES;
    }

    return CONTENT_TEMPLATES.filter((template) => template.type === templateFilter);
  }, [templateFilter]);

  // Form state
  const [contentSpecs, setContentSpecs] = useState<ContentSpecs>({
    ...DEFAULT_CONTENT_SPECS,
    learning_objectives: [...DEFAULT_CONTENT_SPECS.learning_objectives],
  });

  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000,
  });

  const [customPrompt, setCustomPrompt] = useState('');
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);

  useEffect(() => {
    if (verified) {
      fetchBuildJobs();
    }
  }, [verified]);


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

      const { data, error } = await supabase
        .from('ai_build_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
        .returns<UnknownRecord[]>();

      if (error) throw error;

      const normalizedJobs = (data ?? [])
        .map((payload) => {
          const normalized = normalizeJob(payload);
          if (!normalized) {
            logger.warn('Skipping invalid AI build job payload', 'AIContentBuilder');
          }
          return normalized;
        })
        .filter((job): job is AIBuildJob => Boolean(job));

      setBuildJobs(normalizedJobs);

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
      const prompt = generatePrompt();

      const sanitizedSpecs = sanitizeContentSpecs(contentSpecs);
      const parameters: Record<string, unknown> = {
        temperature: aiSettings.temperature,
        max_tokens: aiSettings.max_tokens,
        provider: aiSettings.provider,
        model: aiSettings.model,
      };

      if (customPrompt.trim()) {
        parameters.custom_prompt = customPrompt.trim();
      }

      const jobData: AIBuildJobInsert = {
        job_type: contentType,
        target_type:
          contentType === 'assessment'
            ? sanitizedSpecs.assessment_type ?? 'assessment'
            : contentType,
        ai_provider: aiSettings.provider,
        ai_model: aiSettings.model,
        prompt,
        parameters,
        content_specs: sanitizedSpecs,

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


      const normalizedJob = normalizeJob(data);
      if (!normalizedJob) {
        throw new Error('Failed to normalize AI content generation job.');
      }

      await triggerAIGeneration(normalizedJob.id);

      toast({
        title: 'Content Generated!',
        description: `Successfully generated ${generationRequest.contentType} with ${template.questions.length} questions.`,
      });


      setBuildJobs((previousJobs) => [
        normalizedJob,
        ...previousJobs.filter((job) => job.id !== normalizedJob.id),
      ]);

      // Refresh jobs list asynchronously to capture the latest server state
      void fetchBuildJobs();

      // Switch to jobs tab to monitor progress
      setActiveTab('jobs');

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


  const applyTemplate = (template: TemplateDefinition) => {
    setContentSpecs((previous) => mergeContentSpecs(previous, template.specs));

    setContentType(template.type);
    setCustomPrompt(template.prompt ?? '');
    setActiveTab('create');
    setPreviewState(null);

    toast({
      title: 'Template Applied',
      description: `${template.title} is prefilled in the Create tab. Review and generate when ready.`,
    });
  };

  const previewGeneration = () => {
    const prompt = generatePrompt();
    setPreviewState({
      mode: 'prompt',
      prompt,
      specs: sanitizeContentSpecs(contentSpecs),
      settings: aiSettings,
    });
  };

  const previewJobResult = (job: AIBuildJob) => {
    setPreviewState({
      mode: 'job',
      job,
      parsedContent: parseGeneratedContent(job.generated_content),
    });
  };

  const editGeneratedJob = (job: AIBuildJob) => {
    const parsedContent = parseGeneratedContent(job.generated_content);
    const fallbackTopic = toOptionalString(parsedContent.topic)
      || toOptionalString(parsedContent.title)
      || job.content_specs?.topic
      || contentSpecs.topic;

    const partialSpecs: Partial<ContentSpecs> = job.content_specs
      ? { ...job.content_specs }
      : { topic: fallbackTopic ?? DEFAULT_CONTENT_SPECS.topic };

    partialSpecs.topic = fallbackTopic ?? partialSpecs.topic ?? DEFAULT_CONTENT_SPECS.topic;

    const mergedSpecs = mergeContentSpecs(DEFAULT_CONTENT_SPECS, partialSpecs);

    setContentSpecs({
      ...mergedSpecs,
      learning_objectives: [...mergedSpecs.learning_objectives],
    });

    setContentType(job.job_type);
    setCustomPrompt(job.prompt);
    setAiSettings((previous) => ({
      ...previous,
      provider: isKnownProvider(job.ai_provider) ? job.ai_provider : previous.provider,
      model: job.ai_model || previous.model,
    }));
    setActiveTab('create');
    setPreviewState(null);
  };

  const addLearningObjective = () => {
    setContentSpecs(prev => ({
      ...prev,
      learning_objectives: [...prev.learning_objectives, '']
    }));
  };

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


  const generateSlug = (value: string) => {
    return (
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .slice(0, 60) || `content-${Date.now()}`
    );
  };

  const resolveAdminId = async (job: AIBuildJob) => {
    if (job.admin_id) return job.admin_id;
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  };

  const publishAssessment = async (job: AIBuildJob, parsedContent: UnknownRecord) => {
    const specs = sanitizeContentSpecs(job.content_specs ?? DEFAULT_CONTENT_SPECS);
    const questionValues = toUnknownArray(parsedContent.questions);

    if (questionValues.length === 0) {
      throw new Error('Generated assessment did not include any questions.');
    }

    const formattedQuestions = questionValues.map((questionValue, index) => {
      const questionRecord = isRecord(questionValue) ? questionValue : {};
      const fallbackQuestionText = extractText(questionValue);
      const questionText = pickFirstString(
        questionRecord['question_text'],
        questionRecord['question'],
        questionRecord['text'],
        questionRecord['prompt'],
        fallbackQuestionText ?? undefined,
      );

      if (!questionText) {
        throw new Error(`Question ${index + 1} is missing text.`);
      }

      const rawOptions = toUnknownArray(
        questionRecord['options']
          ?? questionRecord['choices']
          ?? questionRecord['answers']
          ?? questionRecord['options_list'],
      );

      const normalizedCorrectAnswers = new Set<string>();

      toUnknownArray(questionRecord['correct_answers']).forEach((answerValue) => {
        const normalized = extractText(answerValue);
        if (normalized) {
          normalizedCorrectAnswers.add(normalized.toLowerCase());
        }
      });

      const correctAnswerRaw = questionRecord['correct_answer'];
      const directAnswer = extractText(correctAnswerRaw) ?? extractText(questionRecord['answer']);
      if (directAnswer) {
        normalizedCorrectAnswers.add(directAnswer.toLowerCase());
      }

      const numericCorrectIndex = typeof correctAnswerRaw === 'number'
        ? correctAnswerRaw
        : typeof questionRecord['answer_index'] === 'number'
          ? Number(questionRecord['answer_index'])
          : undefined;

      const options = rawOptions.map((optionValue, optIndex) => {
        const optionRecord = isRecord(optionValue) ? optionValue : {};
        const optionText = pickFirstString(
          optionRecord['option_text'],
          optionRecord['text'],
          optionRecord['option'],
          optionRecord['label'],
          optionRecord['title'],
          optionRecord['value'],
          extractText(optionValue) ?? undefined,
        ) ?? `Option ${optIndex + 1}`;

        const optionKey = optionText.toLowerCase();
        const isCorrect = optionRecord['is_correct'] === true
          || optionRecord['correct'] === true
          || normalizedCorrectAnswers.has(optionKey)
          || (typeof numericCorrectIndex === 'number' && numericCorrectIndex === optIndex);

        return {
          option_text: optionText,
          is_correct: isCorrect,
          position: typeof optionRecord['position'] === 'number'
            ? Number(optionRecord['position'])
            : optIndex + 1,
          feedback: extractText(optionRecord['feedback']) ?? undefined,
        };
      });

      const explicitType = pickFirstString(
        questionRecord['question_type'],
        questionRecord['type'],
        questionRecord['format'],
      );
      const normalizedType = explicitType?.toLowerCase();

      const questionType: 'multiple_choice' | 'scale' | 'free_text' =
        normalizedType?.includes('scale')
          ? 'scale'
          : normalizedType?.includes('text') || options.length === 0
            ? 'free_text'
            : 'multiple_choice';

      return {
        question_text: questionText,
        question_type: questionType,
        position: index + 1,
        options,
      };
    });

    const generatedTitle = toOptionalString(parsedContent.title);
    const title = generatedTitle || `Assessment: ${specs.topic || 'Untitled'}`;

    const { data, error } = await supabase.rpc('create_assessment_with_questions', {
      _title: title,
      _description: toOptionalString(parsedContent.description) || specs.description || 'AI-generated assessment',
      _type: specs.assessment_type || 'multiple_choice',
      _visibility: specs.visibility === 'public' ? 'public' : 'private',
      _ai_provider: job.ai_provider,
      _ai_model: job.ai_model,
      _ai_prompt: job.prompt,
      _questions: formattedQuestions,
    });

    if (error) throw error;

    const assessmentId = resolveRecordId(data);

    if (!assessmentId) {
      throw new Error('Assessment was created but no identifier was returned.');
    }

    const adminId = await resolveAdminId(job);
    const slug = `${generateSlug(title)}-${assessmentId.slice(0, 6)}`;

    const fallbackMinutes = specs.estimated_time && specs.estimated_time > 0
      ? specs.estimated_time
      : specs.length === 'short'
        ? 10
        : specs.length === 'medium'
          ? 20
          : 30;
    const generatedDuration = 'estimated_time' in parsedContent
      ? toNumberSafe(parsedContent.estimated_time)
      : null;
    const estimatedMinutes = Math.max(5, Math.round(generatedDuration && generatedDuration > 0 ? generatedDuration : fallbackMinutes));

    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        slug,
        ai_generated: true,
        created_by: adminId,
        ai_provider: job.ai_provider,
        ai_model: job.ai_model,
        ai_prompt: job.prompt,
        learning_outcomes: specs.learning_objectives,
        tags: specs.tags ?? [],
        estimated_time: estimatedMinutes,
        is_public: specs.visibility === 'public',
        requires_auth: specs.visibility !== 'public',
      })
      .eq('id', assessmentId);

    if (updateError) throw updateError;

    return assessmentId;
  };

  const publishCourse = async (job: AIBuildJob, parsedContent: UnknownRecord) => {
    const specs = sanitizeContentSpecs(job.content_specs ?? DEFAULT_CONTENT_SPECS);
    const adminId = await resolveAdminId(job);
    const title = toOptionalString(parsedContent.title) || specs.topic || 'AI Generated Course';
    const slug = `${generateSlug(title)}-${job.id.slice(0, 6)}`;

    const estimatedHoursSource = toNumberSafe(parsedContent.estimated_duration_hours ?? parsedContent.estimated_duration);
    const fallbackHours = specs.length === 'short' ? 1 : specs.length === 'medium' ? 3 : 6;
    const estimatedHours = Math.max(1, Math.round(estimatedHoursSource > 0 ? estimatedHoursSource : fallbackHours));

    const generatedObjectives = toStringArray(parsedContent.learning_objectives);
    const learningObjectives = generatedObjectives.length > 0 ? generatedObjectives : specs.learning_objectives;
    const prerequisites = toStringArray(parsedContent.prerequisites);

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert([
        {
          slug,
          title,
          description: toOptionalString(parsedContent.description) || specs.description || 'AI-generated learning experience',
          learning_objectives: learningObjectives,
          prerequisites,
          estimated_duration_hours: estimatedHours,
          difficulty: specs.difficulty || 'intermediate',
          is_published: specs.visibility === 'public',
          requires_enrollment: false,
          tags: specs.tags ?? [],
          metadata: {
            generatedFromJob: job.id,
            provider: job.ai_provider,
          },
          created_by: adminId,
        },
      ])
      .select()
      .single();

    if (courseError) throw courseError;

    const courseRecord = parseJsonRecord(courseData);
    const courseId = normalizeId(courseRecord.id);

    if (!courseId) {
      throw new Error('Failed to determine the created course identifier.');
    }

    const modules = toUnknownArray(parsedContent.modules);
    for (let index = 0; index < modules.length; index += 1) {
      const moduleValue = modules[index];
      const moduleRecord = isRecord(moduleValue) ? moduleValue : {};
      const moduleTitle = pickFirstString(
        moduleRecord['title'],
        moduleRecord['name'],
        `Module ${index + 1}`,
      ) ?? `Module ${index + 1}`;
      const moduleDescription = pickFirstString(
        moduleRecord['description'],
        moduleRecord['summary'],
        moduleRecord['content'],
      ) ?? '';
      const moduleType = pickFirstString(
        moduleRecord['content_type'],
        moduleRecord['type'],
        moduleRecord['format'],
      ) ?? 'lesson';

      const { error: moduleError } = await supabase.from('course_modules').insert([
        {
          course_id: courseId,
          title: moduleTitle,
          description: moduleDescription,
          content_type: moduleType,
          order_index: index,
          is_required: moduleRecord['is_required'] === false ? false : true,
          passing_score: typeof moduleRecord['passing_score'] === 'number'
            ? Number(moduleRecord['passing_score'])
            : 70,
          max_attempts: typeof moduleRecord['max_attempts'] === 'number'
            ? Number(moduleRecord['max_attempts'])
            : 0,
        },
      ]);

      if (moduleError) throw moduleError;
    }

    return courseId;
  };

  const publishExploration = async (job: AIBuildJob, parsedContent: UnknownRecord) => {
    const specs = sanitizeContentSpecs(job.content_specs ?? DEFAULT_CONTENT_SPECS);
    const promptsSource = parsedContent.prompts ?? parsedContent.steps ?? parsedContent.questions;

    const prompts = toUnknownArray(promptsSource)
      .map((item, index) => {
        const promptText = extractText(item)
          ?? (isRecord(item)
            ? pickFirstString(item['prompt'], item['question'], item['text'])
            : null);
        return promptText ?? `Prompt ${index + 1}`;
      })
      .map((prompt) => prompt.trim())
      .filter((prompt) => prompt.length > 0);

    if (prompts.length === 0) {
      throw new Error('Generated exploration did not include any prompts.');
    }

    const estimatedTimeSource = toNumberSafe(parsedContent.estimated_time);
    const fallbackTime = specs.estimated_time ?? (specs.length === 'short' ? 10 : specs.length === 'medium' ? 20 : 30);
    const estimatedTime = Math.max(5, Math.round(estimatedTimeSource > 0 ? estimatedTimeSource : fallbackTime));

    const { data: explorationData, error: explorationError } = await supabase
      .from('explorations')
      .insert([
        {
          title: toOptionalString(parsedContent.title) || specs.topic || 'AI Exploration',
          description: toOptionalString(parsedContent.description) || specs.description || 'AI-generated exploration experience.',
          questions: prompts,
          facilitator_prompt: toOptionalString(parsedContent.facilitator_prompt) || 'Guide the participant through each prompt with empathy and curiosity.',
          higher_self_prompt: toOptionalString(parsedContent.higher_self_prompt) || 'Encourage responses that reflect the participant\'s highest wisdom.',
          difficulty_level: specs.difficulty || 'intermediate',
          estimated_duration: estimatedTime,
          visibility: specs.visibility || 'private',
          is_active: true,
          category: specs.category || 'self-discovery',
          crystal_reward: Math.max(0, Math.round(toNumberSafe(parsedContent.crystal_reward, specs.crystal_reward ?? 150))),
          analysis_structure: isRecord(parsedContent.analysis_structure)
            ? parsedContent.analysis_structure
            : null,
        },
      ])
      .select()
      .single();

    if (explorationError) throw explorationError;

    const explorationRecord = parseJsonRecord(explorationData);
    const explorationId = normalizeId(explorationRecord.id);

    if (!explorationId) {
      throw new Error('Failed to determine exploration identifier.');
    }

    return explorationId;
  };

  const publishGeneratedContent = async (job: AIBuildJob) => {
    if (!verified) {
      toast({
        title: 'Access Denied',
        description: 'Admin verification is required to publish generated content.',
        variant: 'destructive',
      });
      return;
    }

    if (!job.generated_content) {
      toast({
        title: 'No Generated Content',
        description: 'Generate content before attempting to publish it.',
        variant: 'destructive',
      });
      return;
    }

    setPublishingJobId(job.id);

    try {
      const parsedContent = parseGeneratedContent(job.generated_content);

      let recordId: string | null = null;

      switch (job.job_type) {
        case 'assessment':
          recordId = await publishAssessment(job, parsedContent);
          break;
        case 'course':
          recordId = await publishCourse(job, parsedContent);
          break;
        case 'exploration':
          recordId = await publishExploration(job, parsedContent);
          break;
        default:
          throw new Error(`Publishing is not supported for job type ${job.job_type}`);
      }

      if (!recordId) {
        throw new Error('Content was generated but could not be published.');
      }

      const updatePayload: Partial<AIBuildJob> = {
        created_assessment_id: job.job_type === 'assessment' ? recordId : job.created_assessment_id,
        created_course_id: job.job_type === 'course' ? recordId : job.created_course_id,
        created_exploration_id: job.job_type === 'exploration' ? recordId : job.created_exploration_id,
        status: 'completed',
        progress: 100,
      };

      const { error: jobUpdateError } = await supabase
        .from('ai_build_jobs')
        .update(updatePayload)
        .eq('id', job.id);

      if (jobUpdateError) {
        throw jobUpdateError;
      }
=======
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


      onContentPublished?.({ type: job.job_type as 'assessment' | 'course' | 'exploration', id: recordId, title: parsedContent?.title });
      fetchBuildJobs();
        
    } catch (error) {
      console.error('Error publishing template:', error);
      toast({
        title: 'Publishing Failed',

        description: error instanceof Error ? error.message : 'Failed to publish the generated content.',

        description: 'Failed to publish content. Please try again.',

        variant: 'destructive',
      });
    } finally {
      setPublishingJobId(null);
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
                onClick={() => setContentType(type as ContentType)}
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

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>AI Provider</Label>
              <Select value={aiSettings.provider} onValueChange={(value) =>
                setAiSettings(prev => ({ ...prev, provider: value as AIProvider }))
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

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="preview">Preview & Edit</TabsTrigger>
          <TabsTrigger value="manage">Manage Templates</TabsTrigger>
        </TabsList>


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
        buildJobs.map((job) => {
          const isPublished = Boolean(
            job.created_assessment_id || job.created_course_id || job.created_exploration_id
          );
          const publishedId = job.created_assessment_id || job.created_course_id || job.created_exploration_id;

          return (
            <Card key={job.id} className="glass-strong">

        {/* Generate Content Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>

            <CardHeader>
              <CardTitle>Content Generation Settings</CardTitle>
              <CardDescription>
                Configure the parameters for AI content generation
              </CardDescription>
            </CardHeader>


            <CardContent className="space-y-4">
              {job.status === 'in_progress' && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} />

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


              {job.status === 'completed' && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => publishGeneratedContent(job)}
                    disabled={isPublished || publishingJobId === job.id}
                  >
                    {publishingJobId === job.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isPublished ? 'Published' : 'Publish'}
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={publishingJobId === job.id || !job.generated_content}
                    onClick={() => previewJobResult(job)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={publishingJobId === job.id}
                    onClick={() => editGeneratedJob(job)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {isPublished && (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Published
                    </Badge>
                  )}

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


              <div className="text-sm text-muted-foreground">
                <p>Provider: {job.ai_provider} ({job.ai_model})</p>
                <p>Target: {job.content_specs?.target_audience} | {job.content_specs?.difficulty}</p>
                {publishedId && (
                  <p className="text-xs mt-1">Published ID: {publishedId}</p>
                )}

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
          );
        })
      )}
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardContent className="py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 text-primary p-3 shadow-inner shadow-primary/20">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Template Library</h3>
                <p className="text-sm text-muted-foreground">
                  Jumpstart creation with curated presets tuned for real use cases.
                </p>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Select
                value={templateFilter}
                onValueChange={(value) => setTemplateFilter(value as TemplateFilter)}
              >
                <SelectTrigger className="glass w-full md:w-[220px]">
                  <SelectValue placeholder="Filter by content type" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">All templates</SelectItem>
                  <SelectItem value="assessment">Assessments</SelectItem>
                  <SelectItem value="course">Courses</SelectItem>
                  <SelectItem value="exploration">Explorations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredTemplates.length === 0 ? (
        <Card className="glass">
          <CardContent className="p-10 text-center space-y-3">
            <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No templates match this filter</h3>
            <p className="text-sm text-muted-foreground">
              Adjust the filter to explore more AI-optimized starting points.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => {
            const Icon = TEMPLATE_TYPE_ICONS[template.type];

            return (
              <Card
                key={template.id}
                className="glass-strong h-full border border-white/10 shadow-xl shadow-black/10 transition-transform hover:-translate-y-1"
              >
                <CardHeader className="space-y-3 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{template.title}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize bg-white/5 border-white/10">
                      {TEMPLATE_TYPE_LABELS[template.type]}
                    </Badge>
                  </div>

                  {template.specs.tags && template.specs.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {template.specs.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-primary/5 border-primary/20 text-primary"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 text-sm">
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    {template.specs.difficulty && (
                      <Badge variant="secondary" className="bg-white/5 border border-white/10 text-xs">
                        Difficulty: {template.specs.difficulty}
                      </Badge>
                    )}
                    {template.specs.length && (
                      <Badge variant="secondary" className="bg-white/5 border border-white/10 text-xs">
                        Length: {template.specs.length}
                      </Badge>
                    )}
                    {template.specs.tone && (
                      <Badge variant="secondary" className="bg-white/5 border border-white/10 text-xs">
                        Tone: {template.specs.tone}
                      </Badge>
                    )}
                    {template.specs.question_count && (
                      <Badge variant="secondary" className="bg-white/5 border border-white/10 text-xs">
                        {template.specs.question_count} Questions
                      </Badge>
                    )}
                    {template.specs.estimated_time && (
                      <Badge variant="secondary" className="bg-white/5 border border-white/10 text-xs">
                        ~{template.specs.estimated_time} min
                      </Badge>
                    )}
                  </div>

                  {template.specs.learning_objectives && template.specs.learning_objectives.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Focus Areas</p>
                      <ul className="space-y-1 text-muted-foreground">
                        {template.specs.learning_objectives.slice(0, 4).map((objective, index) => (
                          <li key={`${template.id}-objective-${index}`} className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-white/5 bg-white/5 backdrop-blur px-6 py-4">
                  <div className="text-xs text-muted-foreground">
                    {template.prompt ? 'Includes crafted AI prompt' : 'Uses adaptive prompt generator'}
                  </div>
                  <Button size="sm" onClick={() => applyTemplate(template)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BuilderTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="jobs">Generation Jobs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

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


        <TabsContent value="templates">
          {renderTemplatesTab()}

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


      {/* Preview Modal */}
      {previewState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {previewState.mode === 'prompt' ? 'Generation Preview' : 'Generated Content Preview'}
              </CardTitle>
              <CardDescription>
                {previewState.mode === 'prompt'
                  ? 'Review the AI prompt and configured parameters before generating content.'
                  : 'Inspect the generated content payload before publishing it to the platform.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {previewState.mode === 'prompt' ? (
                <>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Prompt</h4>
                    <pre className="bg-muted p-4 rounded text-sm whitespace-pre-wrap">
                      {previewState.prompt}
                    </pre>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="font-semibold">Audience</p>
                      <p className="text-muted-foreground">{previewState.specs.target_audience}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">Tone</p>
                      <p className="text-muted-foreground">{previewState.specs.tone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">Difficulty</p>
                      <p className="text-muted-foreground">{previewState.specs.difficulty}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">Length</p>
                      <p className="text-muted-foreground">{previewState.specs.length}</p>
                    </div>
                  </div>
                </>
              ) : (
                (() => {
                  const summaryTitle = toOptionalString(previewState.parsedContent.title)
                    || previewState.job.content_specs?.topic
                    || previewState.job.job_type;
                  const summaryDescription = toOptionalString(previewState.parsedContent.description);
                  const itemsPreview = toUnknownArray(
                    previewState.parsedContent.questions
                    ?? previewState.parsedContent.modules
                    ?? previewState.parsedContent.prompts,
                  );
                  const previewJson = JSON.stringify(previewState.parsedContent, null, 2);

                  return (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-muted-foreground">Summary</p>
                        <h3 className="text-lg font-bold">{summaryTitle}</h3>
                        {summaryDescription && (
                          <p className="text-sm text-muted-foreground">{summaryDescription}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                            {previewState.job.job_type.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                            Items: {itemsPreview.length}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                            Provider: {previewState.job.ai_provider}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-muted-foreground">Payload</p>
                        <pre className="bg-muted p-4 rounded text-xs whitespace-pre-wrap overflow-x-auto">
                          {previewJson}
                        </pre>
                      </div>
                    </div>
                  );
                })()
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewState(null)}>
                Close
              </Button>
              {previewState.mode === 'prompt' && (
                <Button
                  onClick={() => {
                    setPreviewState(null);
                    void generateContent();
                  }}
                >
                  Generate with this Prompt
                </Button>
              )}
            </CardFooter>

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