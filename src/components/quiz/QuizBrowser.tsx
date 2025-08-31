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
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  time_limit_minutes?: number;
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
          .from('quizzes' as any)
          .select(`
            id,
            title,
            description,
            category,
            difficulty,
            time_limit_minutes
          `);

        if (filterPublic) {
          query = query.eq('is_public', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        setQuizzes(data || []);
        setFilteredQuizzes(data || []);
      } catch (error) {
        console.error('Error loading quizzes:', error);
        toast({
          title: "Error",
          description: "Failed to load quizzes.",
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
      filtered = filtered.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }
    setFilteredQuizzes(filtered);
  }, [searchQuery, selectedCategory, quizzes]);

  const categories = ['all', 'Wellness', 'Relationships', 'Self-Awareness', 'Productivity'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Wellness': return <Heart className="w-4 h-4" />;
      case 'Relationships': return <Users className="w-4 h-4" />;
      case 'Self-Awareness': return <Brain className="w-4 h-4" />;
      case 'Productivity': return <Zap className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
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
                  {cat}
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
                  {getCategoryIcon(quiz.category)}
                </div>
                <Badge variant="secondary" className="glass">{quiz.category}</Badge>
              </div>
              <CardTitle>{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground flex-1">{quiz.description}</p>
              <div className="flex justify-between items-center mt-4 text-sm">
                <Badge variant="outline">{quiz.difficulty}</Badge>
                {quiz.time_limit_minutes && <span>{quiz.time_limit_minutes} min</span>}
              </div>
              <Button onClick={() => onQuizSelect(quiz)} className="w-full mt-4 bg-gradient-primary">
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuizBrowser;