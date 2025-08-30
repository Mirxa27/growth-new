import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  Brain,
  Zap,
  Target,
  Search,
  Filter,
  TrendingUp,
  Heart,
  Users,
  Star,
  BookOpen,
  ArrowRight,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_public: boolean;
  time_limit_minutes?: number;
  passing_score: number;
  show_correct_answers: boolean;
  quiz_questions: { id: string }[];
}

interface QuizBrowserProps {
  onQuizSelect?: (quiz: Quiz) => void;
  filterPublic?: boolean;
}

export const QuizBrowser: React.FC<QuizBrowserProps> = ({
  onQuizSelect,
  filterPublic = false
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
  }, [filterPublic]);

  const fetchQuizzes = async () => {
    try {
      let query = supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions(id)
        `);

      if (filterPublic) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to load quizzes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories', icon: BookOpen },
    { value: 'wellness', label: 'Wellness', icon: Heart },
    { value: 'relationships', label: 'Relationships', icon: Users },
    { value: 'growth', label: 'Personal Growth', icon: TrendingUp },
    { value: 'spirituality', label: 'Spirituality', icon: Star },
    { value: 'career', label: 'Career', icon: Target },
  ];

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner', color: 'text-green-600' },
    { value: 'intermediate', label: 'Intermediate', color: 'text-yellow-600' },
    { value: 'advanced', label: 'Advanced', color: 'text-red-600' },
  ];

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || quiz.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || quiz.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getCategoryIcon = (category: string) => {
    const categoryItem = categories.find(c => c.value === category);
    return categoryItem?.icon || BookOpen;
  };

  const getDifficultyColor = (difficulty: string) => {
    const difficultyItem = difficulties.find(d => d.value === difficulty);
    return difficultyItem?.color || 'text-muted-foreground';
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
          {filterPublic ? 'Free Learning Quizzes' : 'All Quizzes'}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {filterPublic 
            ? 'Test your knowledge and learn new concepts with our interactive quizzes. No signup required!'
            : 'Explore our comprehensive collection of educational quizzes and knowledge tests.'
          }
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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

        {/* Difficulty Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          {difficulties.map((difficulty) => (
            <Button
              key={difficulty.value}
              variant={selectedDifficulty === difficulty.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDifficulty(difficulty.value)}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {difficulty.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Quiz Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredQuizzes.map((quiz) => {
            const Icon = getCategoryIcon(quiz.category);
            const questionCount = quiz.quiz_questions.length;
            
            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.02 }}
                className="h-full"
              >
                <Card className="h-full flex flex-col glass hover:glass-glow transition-all duration-300 cursor-pointer"
                      onClick={() => onQuizSelect?.(quiz)}>
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {quiz.category}
                        </Badge>
                      </div>
                      {quiz.is_public && (
                        <Badge variant="outline" className="text-xs">
                          Free
                        </Badge>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg line-clamp-2">
                        {quiz.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {quiz.description}
                      </p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Brain className="w-4 h-4" />
                          {questionCount} questions
                        </div>
                        {quiz.time_limit_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {quiz.time_limit_minutes} min
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          <span className={getDifficultyColor(quiz.difficulty)}>
                            {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>Pass: {quiz.passing_score}%</span>
                        </div>
                      </div>

                      {quiz.show_correct_answers && (
                        <Badge variant="outline" className="text-xs w-fit">
                          <Award className="w-3 h-3 mr-1" />
                          Detailed feedback
                        </Badge>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full mt-4 group"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuizSelect?.(quiz);
                      }}
                    >
                      Start Quiz
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredQuizzes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all' 
              ? 'No quizzes match your current filters.' 
              : 'No quizzes available.'
            }
          </div>
          {(searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all') && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizBrowser;
