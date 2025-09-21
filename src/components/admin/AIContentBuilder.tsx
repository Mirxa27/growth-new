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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { openaiService } from '@/services/ai/openai.service';
import { logger } from '@/utils/logger';
import {
  Sparkles,
  Wand2,
  Brain,
  BookOpen,
  Target,
  CheckCircle,
  RefreshCw,
  Save,
  Download,
  Upload,
  Eye,
  Plus,
  Trash2,
  AlertCircle,
  Lightbulb,
  Zap,
  Filter,
  Edit,
  Loader2,
  FileText,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

// Types and Interfaces
interface ContentSpecs {
  target_audience: string;
  difficulty: string;
  length: string;
  topic: string;
  learning_objectives: string[];
  question_count: number;
  assessment_type: string;
  include_explanations: boolean;
  include_media: boolean;
  tone: string;
  visibility: 'public' | 'private';
  auto_publish: boolean;
  description: string;
  category: string;
  tags?: string[];
  estimated_time?: number;
  crystal_reward?: number;
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

interface AIBuildJob {
  id: string;
  job_type: 'assessment' | 'course' | 'exploration';
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

interface GenerationRequest {
  topic: string;
  contentType: 'assessment' | 'quiz' | 'exploration' | 'course';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionCount: number;
  category: string;
  audience: 'visitors' | 'users' | 'premium';
  additionalInstructions?: string;
}

type ContentType = 'assessment' | 'course' | 'exploration';
type TemplateFilter = 'all' | ContentType;
type AIProvider = 'openai' | 'anthropic' | 'google';

interface AISettings {
  provider: AIProvider;
  model: string;
  temperature: number;
  max_tokens: number;
}

interface TemplateDefinition {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  specs: Partial<ContentSpecs> & { topic: string; learning_objectives?: string[] };
  prompt?: string;
}

interface AIContentBuilderProps {
  onContentPublished?: (result: { type: ContentType; id: string; title?: string }) => void;
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

// Constants
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

// Utility functions
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

  const [activeTab, setActiveTab] = useState<BuilderTab>('create');
  const [contentType, setContentType] = useState<ContentType>('assessment');
  const [buildJobs, setBuildJobs] = useState<AIBuildJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [publishingJobId, setPublishingJobId] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>('all');

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

  const filteredTemplates = useMemo(() => {
    if (templateFilter === 'all') {
      return CONTENT_TEMPLATES;
    }

    return CONTENT_TEMPLATES.filter((template) => template.type === templateFilter);
  }, [templateFilter]);

  // Helper functions
  const generatePrompt = () => {
    const basePrompt = `Create comprehensive ${contentType} content about "${contentSpecs.topic}" with the following specifications:

Content Type: ${contentType}
Difficulty: ${contentSpecs.difficulty}
Question Count: ${contentSpecs.question_count}
Category: ${contentSpecs.category}
Target Audience: ${contentSpecs.target_audience}
Tone: ${contentSpecs.tone}
Length: ${contentSpecs.length}

Learning Objectives:
${contentSpecs.learning_objectives.map(obj => `- ${obj}`).join('\n')}

Assessment Type: ${contentSpecs.assessment_type}
Include Explanations: ${contentSpecs.include_explanations}
Include Media: ${contentSpecs.include_media}
Visibility: ${contentSpecs.visibility}
Auto Publish: ${contentSpecs.auto_publish}

${contentSpecs.tags?.length ? `Tags: ${contentSpecs.tags.join(', ')}` : ''}

${customPrompt ? `Custom Instructions: ${customPrompt}` : ''}

Please provide a JSON response with the following structure:
{
  "title": "Engaging title for the ${contentType}",
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
}`;

    return basePrompt;
  };

  const fetchBuildJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_build_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

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
    } catch (error) {
      logger.error('Failed to fetch AI build jobs', 'AIContentBuilder', error);
    }
  };

  const triggerAIGeneration = async (jobId: string) => {
    try {
      const { error } = await supabase.functions.invoke('trigger-ai-generation', {
        body: { jobId }
      });

      if (error) throw error;

      // Update job status to in_progress
      setBuildJobs(prev => prev.map(job =>
        job.id === jobId ? { ...job, status: 'in_progress' as const, progress: 10 } : job
      ));
    } catch (error) {
      logger.error('Failed to trigger AI generation', 'AIContentBuilder', error);
    }
  };

  const generateContent = async () => {
    if (!contentSpecs.topic.trim()) {
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

      const { data, error } = await supabase
        .from('ai_build_jobs')
        .insert([{
          job_type: contentType,
          target_type: contentType === 'assessment' ? sanitizedSpecs.assessment_type : contentType,
          ai_provider: aiSettings.provider,
          ai_model: aiSettings.model,
          prompt,
          parameters,
          content_specs: sanitizedSpecs,
          status: 'pending',
          progress: 0,
        }])
        .select()
        .single();

      if (error) throw error;

      const normalizedJob = normalizeJob(data);
      if (!normalizedJob) {
        throw new Error('Failed to normalize AI content generation job.');
      }

      await triggerAIGeneration(normalizedJob.id);

      toast({
        title: 'Content Generation Started!',
        description: `AI generation job has been queued and will begin processing shortly.`,
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
      contentType: contentType,
      difficulty: contentSpecs.difficulty as 'beginner' | 'intermediate' | 'advanced',
      questionCount: contentSpecs.question_count,
      category: contentSpecs.category,
      audience: contentSpecs.target_audience === 'general' ? 'visitors' :
               contentSpecs.target_audience === 'students' ? 'users' : 'premium',
      additionalInstructions: customPrompt,
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

  const updateLearningObjective = (index: number, value: string) => {
    setContentSpecs(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.map((obj, i) => i === index ? value : obj)
    }));
  };

  const removeLearningObjective = (index: number) => {
    setContentSpecs(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    setContentSpecs(prev => ({
      ...prev,
      tags: [...(prev.tags || []), '']
    }));
  };

  const updateTag = (index: number, value: string) => {
    setContentSpecs(prev => ({
      ...prev,
      tags: prev.tags?.map((tag, i) => i === index ? value : tag) || []
    }));
  };

  const removeTag = (index: number) => {
    setContentSpecs(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index) || []
    }));
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

      toast({
        title: 'Content Published!',
        description: 'Your AI-generated content has been successfully published.',
      });

      onContentPublished?.({ type: job.job_type, id: recordId, title: parsedContent?.title });
      fetchBuildJobs();

    } catch (error) {
      console.error('Error publishing content:', error);
      toast({
        title: 'Publishing Failed',
        description: error instanceof Error ? error.message : 'Failed to publish the generated content.',
        variant: 'destructive',
      });
    } finally {
      setPublishingJobId(null);
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

  useEffect(() => {
    fetchBuildJobs();
  }, []);

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

        <TabsContent value="create">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Difficulty</Label>
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
                    <Label>Length</Label>
                    <Select value={contentSpecs.length} onValueChange={(value) =>
                      setContentSpecs(prev => ({ ...prev, length: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (5-10 min)</SelectItem>
                        <SelectItem value="medium">Medium (15-30 min)</SelectItem>
                        <SelectItem value="long">Long (45-90 min)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Visibility</Label>
                    <Select value={contentSpecs.visibility} onValueChange={(value) =>
                      setContentSpecs(prev => ({ ...prev, visibility: value as 'public' | 'private' }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Learning Objectives</Label>
                  <div className="space-y-2">
                    {contentSpecs.learning_objectives.map((objective, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={objective}
                          onChange={(e) => updateLearningObjective(index, e.target.value)}
                          placeholder="e.g., Understand emotional intelligence principles"
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addLearningObjective}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Objective
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={contentSpecs.category} onValueChange={(value) =>
                      setContentSpecs(prev => ({ ...prev, category: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self-discovery">Self-Discovery</SelectItem>
                        <SelectItem value="professional-development">Professional Development</SelectItem>
                        <SelectItem value="mental-health">Mental Health</SelectItem>
                        <SelectItem value="relationships">Relationships</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="personal-development">Personal Development</SelectItem>
                        <SelectItem value="social-skills">Social Skills</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                        <SelectItem value="scale">Scale Rating</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="open_ended">Open Ended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Question Count</Label>
                    <Input
                      type="number"
                      value={contentSpecs.question_count}
                      onChange={(e) => setContentSpecs(prev => ({ ...prev, question_count: parseInt(e.target.value) || 10 }))}
                      min={1}
                      max={50}
                    />
                  </div>

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
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="motivational">Motivational</SelectItem>
                        <SelectItem value="empathetic">Empathetic</SelectItem>
                        <SelectItem value="reflective">Reflective</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Switch
                    checked={contentSpecs.include_explanations}
                    onCheckedChange={(checked) => setContentSpecs(prev => ({ ...prev, include_explanations: checked }))}
                  />
                  <Label>Include Explanations</Label>

                  <Switch
                    checked={contentSpecs.include_media}
                    onCheckedChange={(checked) => setContentSpecs(prev => ({ ...prev, include_media: checked }))}
                  />
                  <Label>Include Media</Label>

                  <Switch
                    checked={contentSpecs.auto_publish}
                    onCheckedChange={(checked) => setContentSpecs(prev => ({ ...prev, auto_publish: checked }))}
                  />
                  <Label>Auto Publish</Label>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="space-y-2">
                    {contentSpecs.tags?.map((tag, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={tag}
                          onChange={(e) => updateTag(index, e.target.value)}
                          placeholder="e.g., leadership, motivation"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTag(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addTag}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Tag
                    </Button>
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

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={previewGeneration}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Prompt
                  </Button>
                  <Button
                    onClick={generateContent}
                    disabled={isGenerating || !contentSpecs.topic.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs">
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
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="capitalize">{job.job_type} Generation</CardTitle>
                          <CardDescription>
                            Created {new Date(job.created_at).toLocaleDateString()} at {new Date(job.created_at).toLocaleTimeString()}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}
                          className="capitalize"
                        >
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
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        <p>Provider: {job.ai_provider} ({job.ai_model})</p>
                        <p>Target: {job.content_specs?.target_audience} | {job.content_specs?.difficulty}</p>
                        {publishedId && (
                          <p className="text-xs mt-1">Published ID: {publishedId}</p>
                        )}
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
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates">
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
        </TabsContent>
      </Tabs>

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
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIContentBuilder;