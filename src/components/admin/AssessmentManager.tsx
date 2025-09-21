import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2,
  Edit,
  Eye,
  Search,
  Copy,
  Download,
  Save,
  X,
  AlertCircle,
  Target,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { Json, Tables } from '@/integrations/supabase/types';
import { z } from 'zod';
import { logger } from '@/utils/logger';

// Validation schemas
const optionSchema = z.object({
  id: z.string().uuid().optional(),
  option_text: z.string().min(1),
  is_correct: z.boolean(),
  feedback: z.string().optional(),
  position: z.number().int().positive(),
});

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  question_text: z.string().min(1),
  question_type: z.enum(['multiple_choice', 'free_text', 'image']),
  position: z.number().int().positive(),
  media_url: z.string().url().optional(),
  options: z.array(optionSchema).default([]),
});

const assessmentSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['quiz', 'personality', 'test']),
  visibility: z.enum(['public', 'private']),
  ai_provider: z.string().optional(),
  ai_model: z.string().optional(),
  ai_prompt: z.string().optional(),
  questions: z.array(questionSchema),
});
// Removed unused zod schemas/imports

type Assessment = {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'personality' | 'test';
  visibility: 'public' | 'private';
  question_count: number;
  attempt_count: number;
  completion_count: number;
  ai_provider?: string;
  ai_model?: string;
  ai_prompt?: string;
  created_at: string;
  updated_at: string;
}

interface Question {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'free_text' | 'image';
  position: number;
  media_url?: string;
  options: Option[];
}

interface Option {
  id?: string;
  option_text: string;
  is_correct: boolean;
  feedback?: string;
  position: number;
}

interface AssessmentForm {
  id?: string;
  title: string;
  description: string;
  type: 'quiz' | 'personality' | 'test';
  visibility: 'public' | 'private';
  ai_provider: string;
  ai_model: string;
  ai_prompt: string;
  questions: Question[];
}

type ParsedAssessment = z.infer<typeof assessmentSchema>;

type QuestionRow = Tables<'assessment_questions'> & {
  options?: (Tables<'assessment_options'> & { feedback?: string | null })[];
};

export const AssessmentManager: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Assessment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const originalQuestionIdsRef = useRef<string[]>([]);
  const originalOptionIdsRef = useRef<Record<string, string[]>>({});
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);

  const [assessmentForm, setAssessmentForm] = useState<AssessmentForm>({
    id: undefined,
    title: '',
    description: '',
    type: 'quiz',
    visibility: 'private',
    ai_provider: 'openai',
    ai_model: 'gpt-4o-mini',
    ai_prompt: '',
    questions: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_assessment_admin_summary', {
        limit_count: 200,
      });

      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      const assessmentsWithMetrics: Assessment[] = rows.map((row) => {
        const rawType = typeof row.type === 'string' ? row.type : 'quiz';
        const normalizedType: Assessment['type'] = ['quiz', 'personality', 'test'].includes(rawType)
          ? (rawType as Assessment['type'])
          : 'quiz';

        const rawVisibility = typeof row.visibility === 'string' ? row.visibility : 'private';
        const normalizedVisibility: Assessment['visibility'] = rawVisibility === 'public' ? 'public' : 'private';

        return {
          id: String(row.id),
          title: row.title ?? 'Untitled Assessment',
          description: row.description ?? '',
          type: normalizedType,
          visibility: normalizedVisibility,
          question_count: Number(row.question_count ?? 0),
          attempt_count: Number(row.attempt_count ?? 0),
          completion_count: Number(row.completion_count ?? 0),
          ai_provider: row.ai_provider ?? undefined,
          ai_model: row.ai_model ?? undefined,
          ai_prompt: row.ai_prompt ?? undefined,
          created_at: row.created_at ?? new Date().toISOString(),
          updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
        };
      });

      setAssessments(assessmentsWithMetrics);
      setFilteredAssessments(assessmentsWithMetrics);
    } catch (error) {
      logger.error('Error fetching assessments', 'AssessmentManager', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch assessments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  useEffect(() => {
    let filtered = assessments;
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === typeFilter);
    }
    
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(a => a.visibility === visibilityFilter);
    }
    
    setFilteredAssessments(filtered);
  }, [assessments, searchTerm, typeFilter, visibilityFilter]);

  const resetForm = () => {
    setAssessmentForm({
      id: undefined,
      title: '',
      description: '',
      type: 'quiz',
      visibility: 'private',
      ai_provider: 'openai',
      ai_model: 'gpt-4o-mini',
      ai_prompt: '',
      questions: []
    });
    setEditingAssessmentId(null);
    originalQuestionIdsRef.current = [];
    originalOptionIdsRef.current = {};
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      question_text: '',
      question_type: 'multiple_choice',
      position: assessmentForm.questions.length + 1,
      options: [
        { option_text: '', is_correct: true, position: 1 },
        { option_text: '', is_correct: false, position: 2 },
        { option_text: '', is_correct: false, position: 3 },
        { option_text: '', is_correct: false, position: 4 }
      ]
    };
    
    setAssessmentForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (index: number) => {
    setAssessmentForm(prev => ({
      ...prev,
      questions: prev.questions
        .filter((_, i) => i !== index)
        .map((question, idx) => ({ ...question, position: idx + 1 })),
    }));
  };

  const updateQuestion = <K extends keyof Question>(index: number, field: K, value: Question[K]) => {
    setAssessmentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const addOption = (questionIndex: number) => {
    setAssessmentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== questionIndex) return q;
        const updatedOptions = [...q.options, {
          option_text: '',
          is_correct: false,
          position: q.options.length + 1,
        }].map((option, idx) => ({ ...option, position: idx + 1 }));
        return { ...q, options: updatedOptions };
      }),
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setAssessmentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== questionIndex) return q;
        const filtered = q.options.filter((_, oi) => oi !== optionIndex);
        return {
          ...q,
          options: filtered.map((option, idx) => ({ ...option, position: idx + 1 })),
        };
      }),
    }));
  };

  const updateOption = <K extends keyof Option>(questionIndex: number, optionIndex: number, field: K, value: Option[K]) => {
    setAssessmentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== questionIndex) return q;
        const updatedOptions = q.options.map((o, oi) => {
          if (oi !== optionIndex) {
            if (field === 'is_correct' && value === true) {
              return { ...o, is_correct: false };
            }
            return o;
          }
          const nextOption = { ...o, [field]: value } as Option;
          return field === 'is_correct' ? { ...nextOption, is_correct: Boolean(value) } : nextOption;
        });
        return { ...q, options: updatedOptions };
      }),
    }));
  };

  const syncQuestionOptions = async (questionId: string, options: Option[], originalOptionIds: string[]) => {
    const optionIdsToDelete = new Set(originalOptionIds);

    for (let index = 0; index < options.length; index++) {
      const option = options[index];
      const payload = {
        option_text: option.option_text,
        is_correct: option.is_correct,
        feedback: option.feedback || null,
        position: index + 1,
      };

      if (option.id) {
        const { error: updateError } = await supabase
          .from('assessment_options')
          .update(payload)
          .eq('id', option.id);

        if (updateError) {
          throw updateError;
        }

        optionIdsToDelete.delete(option.id);
      } else {
        const { data: insertedOption, error: insertError } = await supabase
          .from('assessment_options')
          .insert([{ ...payload, question_id: questionId }])
          .select('id')
          .single();

        if (insertError) {
          throw insertError;
        }

        if (insertedOption?.id) {
          option.id = insertedOption.id;
        }
      }
    }

    const idsToRemove = Array.from(optionIdsToDelete);
    if (idsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('assessment_options')
        .delete()
        .in('id', idsToRemove);

      if (deleteError) {
        throw deleteError;
      }
    }
  };

  const updateExistingAssessment = async (assessmentId: string, data: ParsedAssessment) => {
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        title: data.title,
        description: data.description,
        type: data.type,
        visibility: data.visibility,
        ai_provider: data.ai_provider,
        ai_model: data.ai_model,
        ai_prompt: data.ai_prompt,
      })
      .eq('id', assessmentId);

    if (updateError) {
      throw updateError;
    }

    const retainedQuestionIds: string[] = [];

    for (let index = 0; index < data.questions.length; index++) {
      const question = data.questions[index];
      const payload = {
        question_text: question.question_text,
        question_type: question.question_type,
        position: index + 1,
      };

      let questionId = question.id;

      if (questionId) {
        const { error: questionUpdateError } = await supabase
          .from('assessment_questions')
          .update(payload)
          .eq('id', questionId);

        if (questionUpdateError) {
          throw questionUpdateError;
        }
      } else {
        const { data: insertedQuestion, error: insertQuestionError } = await supabase
          .from('assessment_questions')
          .insert([{ ...payload, assessment_id: assessmentId }])
          .select('id')
          .single();

        if (insertQuestionError) {
          throw insertQuestionError;
        }

        questionId = insertedQuestion?.id as string | undefined;
      }

      if (questionId) {
        retainedQuestionIds.push(questionId);
        const originalOptionIds = originalOptionIdsRef.current[questionId] ?? [];
        const questionOptions = question.question_type === 'multiple_choice' ? question.options ?? [] : [];
        await syncQuestionOptions(questionId, questionOptions, originalOptionIds);
        originalOptionIdsRef.current[questionId] = questionOptions
          .map(opt => opt.id)
          .filter((value): value is string => Boolean(value));
      }
    }

    const questionIdsToDelete = originalQuestionIdsRef.current.filter((id) => !retainedQuestionIds.includes(id));
    if (questionIdsToDelete.length > 0) {
      const { error: deleteQuestionsError } = await supabase
        .from('assessment_questions')
        .delete()
        .in('id', questionIdsToDelete);

      if (deleteQuestionsError) {
        throw deleteQuestionsError;
      }
    }

    originalQuestionIdsRef.current = retainedQuestionIds;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const normalizedQuestions = assessmentForm.questions.map((question, index) => ({
        ...question,
        position: index + 1,
        options: question.question_type === 'multiple_choice'
          ? question.options.map((option, optIndex) => ({
              ...option,
              position: optIndex + 1,
            }))
          : [],
      }));

      const validatedData = assessmentSchema.parse({
        ...assessmentForm,
        questions: normalizedQuestions,
      });

      validatedData.questions.forEach((question, index) => {
        if (question.question_type === 'multiple_choice') {
          const options = question.options ?? [];
          const correctOptions = options.filter(opt => opt.is_correct);
          if (correctOptions.length !== 1) {
            throw new Error(`Question ${index + 1} must have exactly one correct answer`);
          }
        }
      });

      if (editingAssessmentId) {
        await updateExistingAssessment(editingAssessmentId, validatedData);
        toast({ title: 'Assessment updated', description: 'Changes saved successfully.' });
        logger.info('Assessment updated', { assessmentId: editingAssessmentId });
      } else {
        const { error } = await supabase.rpc('create_assessment_with_questions', {
          _title: validatedData.title,
          _description: validatedData.description,
          _type: validatedData.type,
          _visibility: validatedData.visibility,
          _ai_provider: validatedData.ai_provider,
          _ai_model: validatedData.ai_model,
          _ai_prompt: validatedData.ai_prompt,
          _questions: validatedData.questions as unknown as Json,
          _created_by: null,
        });

        if (error) {
          logger.error('Database error creating assessment', 'AssessmentManager', error);
          throw new Error('Failed to save assessment to database');
        }

        toast({ title: 'Assessment created', description: 'New assessment created successfully.' });
        logger.info('Assessment created', { title: validatedData.title });
      }

      handleDialogOpenChange(false);
      fetchAssessments();
    } catch (error) {
      logger.error('Error saving assessment', 'AssessmentManager', error);

      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
        toast({
          title: 'Validation Error',
          description: errors,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to save assessment',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (assessment: Assessment) => {
    try {
      setIsSubmitting(true);
      setSelectedAssessment(assessment);
      setEditingAssessmentId(assessment.id);

      const { data: detail, error: detailError } = await supabase
        .from('assessments')
        .select('title, description, type, visibility, ai_provider, ai_model, ai_prompt')
        .eq('id', assessment.id)
        .single();

      if (detailError || !detail) {
        throw detailError || new Error('Assessment not found');
      }

      const { data: rawQuestionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('id, question_text, question_type, position, options:assessment_options(id, option_text, is_correct, position, feedback)')
        .eq('assessment_id', assessment.id)
        .order('position', { ascending: true });

      if (questionsError) {
        throw questionsError;
      }

      const questionsData = (rawQuestionsData ?? []) as QuestionRow[];

      const normalizedQuestions: Question[] = questionsData.map((question, index) => {
        const rawType = typeof question.question_type === 'string' ? question.question_type : 'multiple_choice';
        const questionType: Question['question_type'] = ['multiple_choice', 'free_text', 'image'].includes(rawType)
          ? (rawType as Question['question_type'])
          : 'multiple_choice';

        const optionRows = Array.isArray(question.options) ? question.options : [];
        const normalizedOptions = optionRows
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((option, optIndex) => ({
            id: option.id,
            option_text: option.option_text ?? '',
            is_correct: Boolean(option.is_correct),
            feedback: option.feedback ?? '',
            position: optIndex + 1,
          }));

        return {
          id: question.id,
          question_text: question.question_text ?? '',
          question_type: questionType,
          position: index + 1,
          options: questionType === 'multiple_choice' ? normalizedOptions : [],
        };
      });

      originalQuestionIdsRef.current = normalizedQuestions
        .map((question) => question.id)
        .filter((value): value is string => Boolean(value));

      originalOptionIdsRef.current = normalizedQuestions.reduce((acc, question) => {
        if (question.id) {
          acc[question.id] = question.options
            .map((option) => option.id)
            .filter((value): value is string => Boolean(value));
        }
        return acc;
      }, {} as Record<string, string[]>);

      const normalizedType = ['quiz', 'personality', 'test'].includes((detail.type ?? '').toString())
        ? (detail.type as AssessmentForm['type'])
        : 'quiz';

      setAssessmentForm({
        id: assessment.id,
        title: detail.title ?? '',
        description: detail.description ?? '',
        type: normalizedType,
        visibility: detail.visibility === 'public' ? 'public' : 'private',
        ai_provider: detail.ai_provider || 'openai',
        ai_model: detail.ai_model || 'gpt-4o-mini',
        ai_prompt: detail.ai_prompt || '',
        questions: normalizedQuestions,
      });

      setIsCreateDialogOpen(true);
    } catch (error) {
      logger.error('Error loading assessment for editing', 'AssessmentManager', error);
      toast({
        title: 'Unable to load assessment',
        description: error instanceof Error ? error.message : 'Failed to load assessment details.',
        variant: 'destructive',
      });
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleView = async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (assessment: Assessment) => {
    setPendingDelete(assessment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      toast({
        title: "Error",
        description: "No assessment selected for deletion",
        variant: "destructive",
      });
      return;
    }

    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', pendingDelete.id);

      if (error) {
        logger.error('Database error deleting assessment', 'AssessmentManager', error);
        throw new Error('Failed to delete assessment from database');
      }

      setAssessments(prev => prev.filter(a => a.id !== pendingDelete.id));
      toast({ title: "Success", description: "Assessment deleted successfully" });
    } catch (error) {
      logger.error('Error deleting assessment', 'AssessmentManager', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete assessment",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setPendingDelete(null);
    }
  };

  const handleDuplicate = async (assessment: Assessment) => {
    try {
      if (!assessment?.id) {
        throw new Error('Invalid assessment data for duplication');
      }

      setIsSubmitting(true);

      const { data: rawQuestionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('id, question_text, question_type, position, options:assessment_options(id, option_text, is_correct, position, feedback)')
        .eq('assessment_id', assessment.id)
        .order('position', { ascending: true });

      if (questionsError) {
        throw questionsError;
      }

      const questionsData = (rawQuestionsData ?? []) as QuestionRow[];

      const formattedQuestions = questionsData.map((question, index) => {
        const rawType = typeof question.question_type === 'string' ? question.question_type : 'multiple_choice';
        const questionType = ['multiple_choice', 'free_text', 'image'].includes(rawType)
          ? rawType
          : 'multiple_choice';

        const optionRows = Array.isArray(question.options) ? question.options : [];

        const options = questionType === 'multiple_choice'
          ? optionRows
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((option, optIndex) => ({
                option_text: option.option_text ?? '',
                is_correct: Boolean(option.is_correct),
                feedback: option.feedback ?? undefined,
                position: optIndex + 1,
              }))
          : [];

        return {
          question_text: question.question_text ?? '',
          question_type: questionType,
          position: index + 1,
          options,
        };
      });

      const duplicateTitle = `${assessment.title} (Copy)`;

      const { error } = await supabase.rpc('create_assessment_with_questions', {
        _title: duplicateTitle,
        _description: assessment.description,
        _type: assessment.type,
        _visibility: 'private',
        _ai_provider: assessment.ai_provider || 'openai',
        _ai_model: assessment.ai_model || 'gpt-4o-mini',
        _ai_prompt: assessment.ai_prompt || '',
        _questions: formattedQuestions as unknown as Json,
        _created_by: null,
      });

      if (error) {
        logger.error('Database error duplicating assessment', 'AssessmentManager', error);
        throw new Error('Failed to duplicate assessment in database');
      }

      toast({ title: 'Success', description: 'Assessment duplicated successfully' });
      fetchAssessments();
    } catch (error) {
      logger.error('Error duplicating assessment', 'AssessmentManager', error);

      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
        toast({
          title: "Validation Error",
          description: errors,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to duplicate assessment",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'bg-blue-100 text-blue-800';
      case 'personality': return 'bg-purple-100 text-purple-800';
      case 'test': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isEditing = Boolean(editingAssessmentId);

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6" />
                Assessment Manager
              </CardTitle>
              <CardDescription>
                Create, edit, and manage all assessments and quizzes. Track completions and analyze performance.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="glass">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(true);
                }}
                className="bg-gradient-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32 glass">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="personality">Personality</SelectItem>
                <SelectItem value="test">Test</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-32 glass">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssessments.map((assessment) => (
          <Card key={assessment.id} className="glass-strong hover:glass-glow transition-all">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{assessment.title}</CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">
                    {assessment.description}
                  </CardDescription>
                </div>
                <Badge className={getTypeColor(assessment.type)}>
                  {assessment.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{assessment.question_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Attempts:</span>
                  <span className="font-medium">{assessment.attempt_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completions:</span>
                  <span className="font-medium">{assessment.completion_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Visibility:</span>
                  <Badge variant={assessment.visibility === 'public' ? 'default' : 'secondary'}>
                    {assessment.visibility}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleView(assessment)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEdit(assessment)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDuplicate(assessment)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(assessment)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAssessments.length === 0 && (
        <Card className="glass-strong">
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assessments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || typeFilter !== 'all' || visibilityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first assessment'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && visibilityFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-strong">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Assessment' : 'Create New Assessment'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the assessment details, questions, and AI configuration.'
                : 'Build a comprehensive assessment with custom questions and options.'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={assessmentForm.title}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter assessment title"
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={assessmentForm.type} onValueChange={(value: 'quiz' | 'personality' | 'test') => setAssessmentForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="personality">Personality</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={assessmentForm.description}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this assessment measures..."
                  rows={3}
                  className="glass-input"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="visibility"
                  checked={assessmentForm.visibility === 'public'}
                  onCheckedChange={(checked) => setAssessmentForm(prev => ({ ...prev, visibility: checked ? 'public' : 'private' }))}
                />
                <Label htmlFor="visibility">Make this assessment public</Label>
              </div>
            </TabsContent>
            
            <TabsContent value="questions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Questions ({assessmentForm.questions.length})</h3>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
              
              {assessmentForm.questions.map((question, qIndex) => (
                <Card key={qIndex} className="glass">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Question {qIndex + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        <MinusCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Question Text</Label>
                      <Textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                        placeholder="Enter your question..."
                        className="glass-input"
                      />
                    </div>
                    
                    <div>
                      <Label>Question Type</Label>
                      <Select 
                        value={question.question_type} 
                        onValueChange={(value: Question['question_type']) => updateQuestion(qIndex, 'question_type', value)}
                      >
                        <SelectTrigger className="glass">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="free_text">Free Text</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {question.question_type === 'multiple_choice' && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label>Options</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(qIndex)}
                          >
                            <PlusCircle className="w-3 h-3 mr-1" />
                            Add Option
                          </Button>
                        </div>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2 mb-2">
                            <Input
                              value={option.option_text}
                              onChange={(e) => updateOption(qIndex, oIndex, 'option_text', e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              className="flex-1 glass-input"
                            />
                            <Switch
                              checked={option.is_correct}
                              onCheckedChange={(checked) => updateOption(qIndex, oIndex, 'is_correct', checked)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(qIndex, oIndex)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {assessmentForm.questions.length === 0 && (
                <Card className="glass">
                  <CardContent className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No questions added yet</p>
                    <Button onClick={addQuestion} variant="outline" className="mt-4">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Your First Question
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>AI Provider</Label>
                  <Select value={assessmentForm.ai_provider} onValueChange={(value) => setAssessmentForm(prev => ({ ...prev, ai_provider: value }))}>
                    <SelectTrigger className="glass">
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
                  <Label>AI Model</Label>
                  <Select value={assessmentForm.ai_model} onValueChange={(value) => setAssessmentForm(prev => ({ ...prev, ai_model: value }))}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>AI Prompt</Label>
                <Textarea
                  value={assessmentForm.ai_prompt}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, ai_prompt: e.target.value }))}
                  placeholder="Enter custom prompt for AI generation..."
                  rows={4}
                  className="glass-input"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-primary">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Save Changes' : 'Create Assessment'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl glass-strong">
          <DialogHeader>
            <DialogTitle>{selectedAssessment?.title}</DialogTitle>
            <DialogDescription>
              Assessment details and overview
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssessment && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <p className="text-sm">{selectedAssessment.type}</p>
                </div>
                <div>
                  <Label>Visibility</Label>
                  <p className="text-sm">{selectedAssessment.visibility}</p>
                </div>
                <div>
                  <Label>Questions</Label>
                  <p className="text-sm">{selectedAssessment.question_count}</p>
                </div>
                <div>
                  <Label>Attempts</Label>
                  <p className="text-sm">{selectedAssessment.attempt_count}</p>
                </div>
                <div>
                  <Label>Completions</Label>
                  <p className="text-sm">{selectedAssessment.completion_count}</p>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="text-sm">{selectedAssessment.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{new Date(selectedAssessment.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-sm">{new Date(selectedAssessment.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete assessment</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `Are you sure you want to delete "${pendingDelete.title}"? This action cannot be undone.`
                : 'Are you sure you want to delete this assessment?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteLoading} className="bg-destructive hover:bg-destructive/90">
              {deleteLoading ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Removed unused zod schemas
