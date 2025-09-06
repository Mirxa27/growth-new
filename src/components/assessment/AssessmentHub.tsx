import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { 
  Clock, 
  Brain, 
  Target, 
  TrendingUp, 
  Award, 
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Star,
  Sparkles
} from 'lucide-react';

interface AssessmentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  category_id: string;
  type: string;
  difficulty: string;
  estimated_duration: number;
  instructions: string;
  is_featured: boolean;
  assessment_questions: AssessmentQuestion[];
  category?: AssessmentCategory;
}

interface AssessmentQuestion {
  id: string;
  question_text: string;
  question_type: string;
  position: number;
  required: boolean;
  points: number;
  explanation?: string;
  assessment_options: AssessmentOption[];
}

interface AssessmentOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  position: number;
  score_value: number;
  feedback?: string;
}

interface AssessmentResult {
  id: string;
  score: number;
  max_score: number;
  percentage: number;
  personality_type?: string;
  ai_feedback?: string;
  growth_recommendations: string[];
  next_steps: string[];
  category_scores: Record<string, number>;
}

interface AssessmentAttempt {
  id: string;
  status: string;
  responses: Record<string, any>;
  ai_analysis: {
    insights: string[];
    recommendations: string[];
    strengths: string[];
    areas_for_improvement: string[];
    personalized_feedback: string;
    growth_plan: string[];
  };
}

const AssessmentHub: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load assessment categories.",
        variant: "destructive" 
      });
    }
  };

  const loadAssessments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          assessment_categories (*)
        `)
        .eq('is_active', true)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load assessments.",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssessments = selectedCategory === 'all' 
    ? assessments 
    : assessments.filter(a => a.category_id === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personality': return <Brain className="w-4 h-4" />;
      case 'skills': return <Target className="w-4 h-4" />;
      case 'career': return <TrendingUp className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/50 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-64 bg-white/50 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Personal Growth Assessments
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover insights about yourself through our comprehensive assessments designed specifically for your growth journey.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 justify-center mb-8"
        >
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className="glass-button"
          >
            All Assessments
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className="glass-button"
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </motion.div>

        {/* Assessments Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredAssessments.map((assessment, index) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                index={index}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredAssessments.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No assessments found
            </h3>
            <p className="text-gray-500">
              Try selecting a different category or check back later for new assessments.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

interface AssessmentCardProps {
  assessment: Assessment;
  index: number;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({ assessment, index }) => {
  const [showTakeAssessment, setShowTakeAssessment] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personality': return <Brain className="w-4 h-4" />;
      case 'skills': return <Target className="w-4 h-4" />;
      case 'career': return <TrendingUp className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (showTakeAssessment) {
    return <AssessmentTaker assessment={assessment} onBack={() => setShowTakeAssessment(false)} />;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="glass-card group cursor-pointer"
      onClick={() => setShowTakeAssessment(true)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 group-hover:text-purple-600 transition-colors">
              {assessment.title}
              {assessment.is_featured && (
                <Star className="w-4 h-4 text-yellow-500 inline ml-2" />
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              {assessment.description}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1 text-purple-600">
            {getTypeIcon(assessment.type)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <Badge className={getDifficultyColor(assessment.difficulty)}>
            {assessment.difficulty}
          </Badge>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            {assessment.estimated_duration}min
          </div>
        </div>

        <Button 
          className="w-full glass-button group-hover:bg-purple-600 group-hover:text-white transition-all"
          onClick={(e) => {
            e.stopPropagation();
            setShowTakeAssessment(true);
          }}
        >
          Start Assessment
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </motion.div>
  );
};

interface AssessmentTakerProps {
  assessment: Assessment;
  onBack: () => void;
}

const AssessmentTaker: React.FC<AssessmentTakerProps> = ({ assessment, onBack }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [attemptId, setAttemptId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (user) {
      initializeAssessment();
    }
  }, [user, assessment.id]);

  const initializeAssessment = async () => {
    try {
      setIsLoading(true);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select(`
          *,
          assessment_options (*)
        `)
        .eq('assessment_id', assessment.id)
        .order('position');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Create attempt record
      const { data: attemptData, error: attemptError } = await supabase
        .from('user_assessment_attempts')
        .insert({
          user_id: user!.id,
          assessment_id: assessment.id,
          attempt_number: 1, // Could be improved to track actual attempt number
          status: 'in_progress'
        })
        .select()
        .single();

      if (attemptError) throw attemptError;
      setAttemptId(attemptData.id);

    } catch (error) {
      console.error('Error initializing assessment:', error);
      toast({ 
        title: "Error", 
        description: "Failed to start assessment.",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitAssessment = async () => {
    if (!user || !attemptId) return;

    setIsSubmitting(true);
    try {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

      // Process assessment results via edge function
      const { data, error } = await supabase.functions.invoke('process-assessment-results', {
        body: {
          user_id: user.id,
          assessment_id: assessment.id,
          attempt_id: attemptId,
          responses,
          duration_seconds: durationSeconds
        }
      });

      if (error) throw error;

      // Get the result details
      const { data: resultData, error: resultError } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('attempt_id', attemptId)
        .single();

      if (resultError) throw resultError;
      setResult(resultData);

      toast({
        title: "Assessment Complete!",
        description: "Your personalized results are ready.",
      });

    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({ 
        title: "Error", 
        description: "Failed to submit assessment.",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const currentQ = questions[currentQuestion];

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card max-w-2xl mx-auto"
      >
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-purple-200 rounded mb-4"></div>
            <div className="h-8 bg-purple-200 rounded mb-6"></div>
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-12 bg-purple-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </motion.div>
    );
  }

  if (result) {
    return <AssessmentResults result={result} assessment={assessment} onBack={onBack} />;
  }

  if (!currentQ) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card max-w-2xl mx-auto"
      >
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            No Questions Available
          </h3>
          <p className="text-gray-600 mb-4">
            This assessment doesn't have any questions configured yet.
          </p>
          <Button onClick={onBack} variant="outline">
            Back to Assessments
          </Button>
        </CardContent>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Badge variant="outline">
              Question {currentQuestion + 1} of {questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="mb-4" />
          <CardTitle className="text-xl">{assessment.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {currentQ.question_text}
            </h3>

            <QuestionRenderer
              question={currentQ}
              value={responses[currentQ.id]}
              onChange={(value) => handleResponse(currentQ.id, value)}
            />
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={submitAssessment}
                disabled={!responses[currentQ.id] || isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 mr-2"
                    >
                      ⏳
                    </motion.div>
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Assessment
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                disabled={!responses[currentQ.id]}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface QuestionRendererProps {
  question: AssessmentQuestion;
  value: any;
  onChange: (value: any) => void;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({ question, value, onChange }) => {
  const sortedOptions = [...question.assessment_options].sort((a, b) => a.position - b.position);

  switch (question.question_type) {
    case 'multiple_choice':
    case 'single_choice':
      return (
        <RadioGroup value={value} onValueChange={onChange}>
          <div className="space-y-3">
            {sortedOptions.map((option) => (
              <motion.div
                key={option.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer"
                onClick={() => onChange(option.id)}
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.option_text}
                </Label>
              </motion.div>
            ))}
          </div>
        </RadioGroup>
      );

    case 'true_false':
      return (
        <RadioGroup value={value} onValueChange={onChange}>
          <div className="space-y-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer"
              onClick={() => onChange('true')}
            >
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer"
              onClick={() => onChange('false')}
            >
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
            </motion.div>
          </div>
        </RadioGroup>
      );

    case 'scale':
      return (
        <div className="space-y-4">
          <Slider
            value={[value || 1]}
            onValueChange={([newValue]) => onChange(newValue)}
            max={5}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
          {value && (
            <p className="text-center text-sm text-purple-600">
              Selected: {value}
            </p>
          )}
        </div>
      );

    case 'ranking':
      // Simple checkbox multi-select for ranking questions
      return (
        <div className="space-y-3">
          {sortedOptions.map((option) => (
            <motion.div
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
            >
              <Checkbox
                id={option.id}
                checked={Array.isArray(value) && value.includes(option.id)}
                onCheckedChange={(checked) => {
                  const currentValues = Array.isArray(value) ? value : [];
                  if (checked) {
                    onChange([...currentValues, option.id]);
                  } else {
                    onChange(currentValues.filter((v: string) => v !== option.id));
                  }
                }}
              />
              <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                {option.option_text}
              </Label>
            </motion.div>
          ))}
        </div>
      );

    default:
      return (
        <div className="text-center text-gray-500">
          Question type not supported: {question.question_type}
        </div>
      );
  }
};

interface AssessmentResultsProps {
  result: AssessmentResult;
  assessment: Assessment;
  onBack: () => void;
}

const AssessmentResults: React.FC<AssessmentResultsProps> = ({ result, assessment, onBack }) => {
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);

  useEffect(() => {
    loadAttemptData();
  }, [result]);

  const loadAttemptData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_assessment_attempts')
        .select('*')
        .eq('id', result.id)
        .single();

      if (error) throw error;
      setAttempt(data);
    } catch (error) {
      console.error('Error loading attempt data:', error);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <Card className="glass-card bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Award className="w-16 h-16 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-2">Assessment Complete!</h2>
          <p className="text-purple-100">
            You've completed the {assessment.title} assessment
          </p>
        </CardContent>
      </Card>

      {/* Score Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Your Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getGradeColor(result.percentage)}`}>
                {result.percentage.toFixed(1)}%
              </div>
              <p className="text-gray-600">Overall Score</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">
                {result.score}/{result.max_score}
              </div>
              <p className="text-gray-600">Points Earned</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {result.personality_type || 'N/A'}
              </div>
              <p className="text-gray-600">Personality Type</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Feedback */}
      {result.ai_feedback && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Personalized Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed">
                {result.ai_feedback}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights & Recommendations */}
      {attempt?.ai_analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Insights */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {attempt.ai_analysis.insights.map((insight, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start"
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">{insight}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {attempt.ai_analysis.strengths.map((strength, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start"
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">{strength}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Growth Recommendations */}
      {result.growth_recommendations && result.growth_recommendations.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Growth Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.growth_recommendations.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-purple-200"
                >
                  <p className="text-gray-700">{recommendation}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {result.next_steps && result.next_steps.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRight className="w-5 h-5 mr-2" />
              Your Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.next_steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{step}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assessments
        </Button>
        <Button 
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          onClick={() => window.print()}
        >
          <Award className="w-4 h-4 mr-2" />
          Save Results
        </Button>
      </div>
    </motion.div>
  );
};

export default AssessmentHub;
