import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  Search,
  Clock,
  Users,
  Star,
  Play,
  BookOpen,
  Zap,
  CheckSquare,
  PenTool,
  Timer,
  Image as ImageIcon,
  Volume2,
  Gift,
  Sparkles,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { logger } from '@/utils/logger';

interface AssessmentSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  estimated_time: number;
  is_featured: boolean;
  tags: string[];
  question_count: number;
  attempt_count: number;
}

const ASSESSMENT_TYPE_INFO = {
  multiple_choice: {
    icon: CheckSquare,
    name: 'Multiple Choice',
    description: 'Choose the best answer from given options',
    color: 'bg-blue-500/15 text-blue-100'
  },
  true_false: {
    icon: Zap,
    name: 'True/False',
    description: 'Quick true or false questions',
    color: 'bg-emerald-500/15 text-emerald-100'
  },
  short_answer: {
    icon: PenTool,
    name: 'Short Answer',
    description: 'Write thoughtful responses',
    color: 'bg-purple-500/15 text-purple-100'
  },
  timed_quiz: {
    icon: Timer,
    name: 'Timed Quiz',
    description: 'Answer questions within time limits',
    color: 'bg-orange-500/15 text-orange-100'
  },
  image_identification: {
    icon: ImageIcon,
    name: 'Image Tasks',
    description: 'Visual identification and analysis',
    color: 'bg-pink-500/15 text-pink-100'
  },
  audio_response: {
    icon: Volume2,
    name: 'Audio Response',
    description: 'Voice-based questions and responses',
    color: 'bg-indigo-500/15 text-indigo-100'
  }
};

const DIFFICULTY_COLORS = {
  beginner: 'border-emerald-400/40 bg-emerald-300/10 text-emerald-200',
  intermediate: 'border-amber-400/40 bg-amber-300/10 text-amber-200',
  advanced: 'border-rose-400/40 bg-rose-300/10 text-rose-200'
};

const MobileAssessmentHub: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const loadPublicAssessments = useCallback(async () => {
    try {
      setLoading(true);

      // Use local data instead of Supabase query since the table structure doesn't match
      // This provides a fallback that works with the existing assessment data
      const localAssessments: AssessmentSummary[] = [
        {
          id: 'personality-insights',
          slug: 'personality-insights',
          title: 'Personality Insights Discovery',
          description: 'Discover your unique personality traits and how they influence your daily life, relationships, and career choices.',
          type: 'multiple_choice',
          difficulty: 'beginner',
          estimated_time: 8,
          is_featured: true,
          tags: ['personality', 'self-discovery', 'traits', 'behavior'],
          question_count: 12,
          attempt_count: 0
        },
        {
          id: 'wellness-assessment',
          slug: 'wellness-check',
          title: 'Holistic Wellness Check',
          description: 'Evaluate your overall well-being across physical, mental, emotional, and social dimensions to identify areas for improvement.',
          type: 'multiple_choice',
          difficulty: 'beginner',
          estimated_time: 10,
          is_featured: true,
          tags: ['wellness', 'health', 'balance', 'lifestyle'],
          question_count: 12,
          attempt_count: 0
        },
        {
          id: 'career-direction',
          slug: 'career-compass',
          title: 'Career Direction Compass',
          description: 'Discover your career strengths, interests, and ideal work environment to guide your professional development.',
          type: 'multiple_choice',
          difficulty: 'intermediate',
          estimated_time: 12,
          is_featured: false,
          tags: ['career', 'professional', 'strengths', 'development'],
          question_count: 13,
          attempt_count: 0
        },
        {
          id: 'relationship-patterns',
          slug: 'relationship-patterns',
          title: 'Relationship Patterns Assessment',
          description: 'Understand your relationship style, communication patterns, and how you connect with others in personal and professional settings.',
          type: 'multiple_choice',
          difficulty: 'intermediate',
          estimated_time: 9,
          is_featured: false,
          tags: ['relationships', 'communication', 'attachment', 'social'],
          question_count: 12,
          attempt_count: 0
        },
        {
          id: 'mindfulness-awareness',
          slug: 'mindfulness-awareness',
          title: 'Mindfulness & Awareness Assessment',
          description: 'Evaluate your present-moment awareness, emotional regulation, and mindful living practices to enhance your mental well-being.',
          type: 'multiple_choice',
          difficulty: 'beginner',
          estimated_time: 8,
          is_featured: false,
          tags: ['mindfulness', 'awareness', 'meditation', 'presence'],
          question_count: 12,
          attempt_count: 0
        },
        {
          id: 'personal-growth',
          slug: 'growth-readiness',
          title: 'Personal Growth Readiness',
          description: 'Assess your motivation, openness, and readiness for personal development and positive life changes.',
          type: 'multiple_choice',
          difficulty: 'beginner',
          estimated_time: 10,
          is_featured: false,
          tags: ['growth', 'development', 'change', 'motivation'],
          question_count: 13,
          attempt_count: 0
        }
      ];

      setAssessments(localAssessments);
      logger.info(`Loaded local assessments: ${localAssessments.length}`);

    } catch (error) {
      logger.error('Failed to load assessments', 'MobileAssessmentHub', error);
      setError('Failed to load assessments. Please try again.');

      toast({
        title: 'Loading Error',
        description: 'Failed to load assessments. Please check your connection and try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [setAssessments, setLoading, setError, toast]);

  useEffect(() => {
    loadPublicAssessments();
  }, [loadPublicAssessments]);

  const filteredAssessments = assessments.filter(assessment => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        assessment.title.toLowerCase().includes(query) ||
        assessment.description.toLowerCase().includes(query) ||
        (assessment.tags && assessment.tags.some(tag => tag.toLowerCase().includes(query)));

      if (!matchesSearch) return false;
    }

    // Apply type filter
    if (selectedType !== 'all' && assessment.type !== selectedType) {
      return false;
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all' && assessment.difficulty !== selectedDifficulty) {
      return false;
    }

    return true;
  });

  const handleSelectAssessment = (assessment: AssessmentSummary) => {
    navigate(`/assessment/${assessment.slug}`);
  };

  const renderAssessmentCard = (assessment: AssessmentSummary, index: number) => {
    const typeInfo = ASSESSMENT_TYPE_INFO[assessment.type] || ASSESSMENT_TYPE_INFO.multiple_choice;
    const TypeIcon = typeInfo.icon;
    const difficultyColor = DIFFICULTY_COLORS[assessment.difficulty] || DIFFICULTY_COLORS.beginner;

    return (
      <motion.div
        key={assessment.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      >
        <Card
          className="group relative overflow-hidden border-white/10 bg-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent glass cursor-pointer"
        >
          <div className="absolute inset-px rounded-xl bg-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <CardHeader className="relative pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-lg bg-primary/20 p-2 text-primary">
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  {assessment.is_featured && (
                    <Badge variant="outline" className="border-amber-400/40 bg-amber-200/20 text-amber-200">
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-emerald-400/40 bg-emerald-200/10 text-emerald-200">
                    FREE
                  </Badge>
                </div>
                <CardTitle className="text-xl font-semibold tracking-tight text-white group-hover:text-primary transition-colors">
                  {assessment.title}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-5">
            <CardDescription className="text-sm text-muted-foreground/90">
              {assessment.description}
            </CardDescription>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className={`${difficultyColor} capitalize`}>
                {assessment.difficulty}
              </Badge>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80">
                <Clock className="mr-1 h-3 w-3" />
                {assessment.estimated_time} min
              </Badge>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80">
                <Users className="mr-1 h-3 w-3" />
                {assessment.attempt_count} attempts
              </Badge>
            </div>

            {assessment.tags && assessment.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 text-xs">
                {assessment.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="border-white/5 bg-white/10 text-white/80">
                    #{tag}
                  </Badge>
                ))}
                {assessment.tags.length > 3 && (
                  <Badge variant="secondary" className="border-white/5 bg-white/10 text-white/80">
                    +{assessment.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center text-sm text-muted-foreground/90">
                <CheckSquare className="mr-2 h-4 w-4 text-primary" />
                {assessment.question_count} questions
              </div>
              <Button
                onClick={() => handleSelectAssessment(assessment)}
                className="glass-button border border-primary/40 bg-primary/20 text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              >
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />
        <div className="relative space-y-4 rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-glass backdrop-blur-2xl">
          <LoadingSpinner size="lg" />
          <h2 className="text-xl font-semibold text-white">Loading Assessments</h2>
          <p className="text-white/70">Finding the perfect assessments for you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-3xl" />
        <Card className="relative w-full max-w-md border border-white/10 bg-white/10 text-center backdrop-blur-2xl">
          <CardContent className="space-y-6 p-10">
            <AlertCircle className="mx-auto h-16 w-16 text-rose-300" />
            <div>
              <h2 className="text-2xl font-semibold text-white">Unable to Load Assessments</h2>
              <p className="mt-2 text-white/70">{error}</p>
            </div>
            <div className="space-y-3">
              <Button onClick={loadPublicAssessments} className="w-full rounded-xl border border-primary/40 bg-primary/80 text-primary-foreground">
                Try Again
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full rounded-xl border-white/30 bg-transparent text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAssessments = assessments.length;
  const totalQuestions = assessments.reduce((sum, assessment) => sum + (assessment.question_count || 0), 0);
  const averageMinutes = Math.round(
    assessments.reduce((sum, assessment) => sum + (assessment.estimated_time || 0), 0) /
      Math.max(totalAssessments, 1)
  );

  const heroMetrics = [
    { label: 'Free Assessments', value: totalAssessments, accent: 'text-primary' },
    { label: 'Total Questions', value: totalQuestions, accent: 'text-emerald-300' },
    { label: 'Avg Minutes', value: averageMinutes, accent: 'text-blue-300' },
    { label: 'Free Forever', value: '100%', accent: 'text-violet-300' }
  ];

  return (
    <main className="relative min-h-screen pb-16">
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-8 text-center backdrop-blur-2xl shadow-glass"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-secondary/10 to-transparent opacity-70" />
          <div className="relative space-y-6">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm uppercase tracking-[0.3em] text-white/70">
              <Sparkles className="h-4 w-4" />
              Free Self-Discovery Tools
            </div>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
              Discover Yourself with Free Assessments
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/80">
              Take science-based assessments to understand your personality, wellness, and growth patterns. Instant insights with zero signup.
            </p>

            <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-glass">
                  <div className={`text-3xl font-bold ${metric.accent}`}>{metric.value}</div>
                  <div className="text-sm text-white/70">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Filters */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
        >
          <Card className="overflow-hidden border border-white/10 bg-white/10 backdrop-blur-2xl">
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                    <Input
                      placeholder="Search assessments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 rounded-xl border-white/10 bg-white/10 pl-10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-48 rounded-xl border-white/10 bg-white/10 text-white">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-background/90 backdrop-blur-xl">
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(ASSESSMENT_TYPE_INFO).map(([type, info]) => (
                        <SelectItem key={type} value={type}>
                          {info.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="w-40 rounded-xl border-white/10 bg-white/10 text-white">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-background/90 backdrop-blur-xl">
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Assessment Grid */}
        <section>
          {filteredAssessments.length === 0 ? (
            <Card className="border border-white/10 bg-white/10 text-center backdrop-blur-2xl">
              <CardContent className="p-12">
                <BookOpen className="mx-auto mb-6 h-16 w-16 text-white/50" />
                <h3 className="text-2xl font-semibold text-white">No assessments found</h3>
                <p className="mt-3 text-white/70">
                  {assessments.length === 0
                    ? 'No assessments are currently available. Please try again later.'
                    : 'Try adjusting your search or filter criteria.'}
                </p>
                <Button onClick={loadPublicAssessments} className="mt-6 rounded-xl border border-primary/40 bg-primary/80 text-primary-foreground">
                  Refresh Assessments
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredAssessments.map((assessment, index) => renderAssessmentCard(assessment, index))}
            </div>
          )}
        </section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        >
          <Card className="overflow-hidden border border-primary/20 bg-primary/10 backdrop-blur-2xl">
            <CardContent className="relative p-8 text-center">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-transparent to-secondary/20 opacity-80" />
              <div className="relative space-y-4">
                <Gift className="mx-auto h-10 w-10 text-white" />
                <h3 className="text-2xl font-semibold text-white">Ready to Start Your Growth Journey?</h3>
                <p className="text-white/80">
                  Choose any assessment above to begin discovering insights about yourself. Every assessment is free and completely anonymous.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button onClick={() => navigate('/')} variant="outline" className="w-full rounded-xl border-white/30 bg-transparent text-white sm:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                  <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full rounded-xl border border-primary/40 bg-primary/80 text-primary-foreground sm:w-auto">
                    <Star className="mr-2 h-4 w-4" />
                    Choose an Assessment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </main>
  );
};

export default MobileAssessmentHub;
