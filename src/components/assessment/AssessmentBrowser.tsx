import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  Users, 
  CheckCircle,
  Brain,
  Heart,
  Sparkles,
  TrendingUp,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AssessmentType {
  id: string;
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  estimated_duration: number;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'boolean' | 'multi_select';
  category?: string;
  is_required: boolean;
  order_index: number;
  options?: QuestionOption[];
}

interface QuestionOption {
  id: string;
  text: string;
  value: string;
  score_weights: Record<string, number>;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  is_public: boolean;
  scoring_algorithm: string;
  assessment_type: AssessmentType;
  assessment_questions: {
    question: Question;
    order_index: number;
    is_required: boolean;
    weight: number;
  }[];
}

interface AssessmentBrowserProps {
  onAssessmentSelect?: (assessment: Assessment) => void;
  filterPublic?: boolean;
}

export const AssessmentBrowser: React.FC<AssessmentBrowserProps> = ({
  onAssessmentSelect,
  filterPublic = false
}) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchAssessments();
  }, [filterPublic]);

  const fetchAssessments = async () => {
    try {
      let query = supabase
        .from('assessments')
        .select(`
          *,
          assessment_type:assessment_types(*),
          assessment_questions(
            order_index,
            is_required,
            weight,
            question:questions(
              *,
              options:question_options(*)
            )
          )
        `)
        .eq('is_published', true);

      if (filterPublic) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: "Error",
        description: "Failed to load assessments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories', icon: Sparkles },
    { value: 'personality', label: 'Personality', icon: Brain },
    { value: 'wellness', label: 'Wellness', icon: Heart },
    { value: 'relationships', label: 'Relationships', icon: Users },
    { value: 'career', label: 'Career', icon: TrendingUp },
    { value: 'growth', label: 'Growth', icon: Star },
  ];

  const filteredAssessments = selectedCategory === 'all' 
    ? assessments 
    : assessments.filter(a => a.assessment_type.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const categoryItem = categories.find(c => c.value === category);
    return categoryItem?.icon || Sparkles;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">
          {filterPublic ? 'Free Assessments' : 'All Assessments'}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {filterPublic 
            ? 'Discover insights about yourself with our free, no-signup-required assessments.'
            : 'Explore our comprehensive collection of personal growth and discovery assessments.'
          }
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAssessments.map((assessment) => {
            const Icon = getCategoryIcon(assessment.assessment_type.category);
            const questionCount = assessment.assessment_questions.length;
            
            return (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.02 }}
                className="h-full"
              >
                <Card className="h-full flex flex-col glass hover:glass-glow transition-all duration-300 cursor-pointer"
                      onClick={() => onAssessmentSelect?.(assessment)}>
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {assessment.assessment_type.category}
                        </Badge>
                      </div>
                      {assessment.is_public && (
                        <Badge variant="outline" className="text-xs">
                          Free
                        </Badge>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg line-clamp-2">
                        {assessment.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {assessment.description}
                      </p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {assessment.assessment_type.estimated_duration} min
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {questionCount} questions
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4 group"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssessmentSelect?.(assessment);
                      }}
                    >
                      Start Assessment
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredAssessments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            No assessments found in this category.
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentBrowser;
