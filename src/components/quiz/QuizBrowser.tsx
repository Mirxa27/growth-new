import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  TrendingUp,
  Zap,
  Brain,
  Heart,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'personality' | 'test' | 'exploration' | 'course';
  visibility: 'public' | 'private';
  created_at?: string;
  ai_provider?: string;
  ai_model?: string;
  question_count?: number;
}

interface QuizBrowserProps {
  onQuizSelect: (quiz: Quiz) => void;
  filterPublic?: boolean;
}

const QuizBrowser: React.FC<QuizBrowserProps> = ({ onQuizSelect, filterPublic = false }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    const loadQuizzes = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('assessments')
          .select(`
            id,
            title,
            description,
            type,
            visibility,
            created_at,
            ai_provider,
            ai_model,
            assessment_questions(count)
          `);

        if (filterPublic) {
          query = query.eq('visibility', 'public');
        }

        const { data, error } = await query;
        if (error) throw error;

        const transformedData = data?.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          type: item.type,
          visibility: item.visibility,
          created_at: item.created_at,
          ai_provider: item.ai_provider,
          ai_model: item.ai_model,
          question_count: item.assessment_questions?.length || 0
        })) || [];

        setQuizzes(transformedData);
        setFilteredQuizzes(transformedData);
      } catch (error) {
        console.error('Error loading assessments:', error);
        toast({
          title: "Error",
          description: "Failed to load assessments.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadQuizzes();
  }, [filterPublic, toast]);

  useEffect(() => {
    let filtered = quizzes;
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.type === selectedCategory);
    }
    setFilteredQuizzes(filtered);
  }, [searchQuery, selectedCategory, quizzes]);

  const categories = ['all', 'quiz', 'personality', 'test'];

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <Zap className="w-4 h-4" />;
      case 'personality': return <Brain className="w-4 h-4" />;
      case 'test': return <TrendingUp className="w-4 h-4" />;
      case 'exploration': return <Heart className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  if (loading) return <div className="text-center p-8">Loading quizzes...</div>;

  return (
    <div className="space-y-6">
      <Card className="glass-card border-glass">
        <CardHeader>
          <CardTitle>Browse Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? "bg-gradient-primary" : "glass"}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz) => (
          <Card key={quiz.id} className="glass-card border-glass flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  {getCategoryIcon(quiz.type)}
                </div>
                <Badge variant="secondary" className="glass">{quiz.type}</Badge>
                {quiz.visibility === 'public' && (
                  <Badge variant="outline" className="text-green-600 border-green-200">Public</Badge>
                )}
              </div>
              <CardTitle>{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground flex-1">{quiz.description}</p>
              <div className="flex justify-between items-center mt-4 text-sm">
                <Badge variant="outline">{quiz.ai_provider || 'AI Generated'}</Badge>
                {quiz.question_count && (
                  <span className="text-muted-foreground">
                    {quiz.question_count} questions
                  </span>
                )}
              </div>
              <Button onClick={() => onQuizSelect(quiz)} className="w-full mt-4 bg-gradient-primary">
                Start {quiz.type === 'personality' ? 'Assessment' : 'Quiz'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuizBrowser;