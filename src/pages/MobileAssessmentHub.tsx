import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search,
  Clock,
  Users,
  Star,
  Play,
  BookOpen,
  Brain,
  Heart,
  Briefcase,
  MessageCircle,
  TrendingUp,
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
    color: 'bg-blue-100 text-blue-800'
  },
  true_false: {
    icon: Zap,
    name: 'True/False',
    description: 'Quick true or false questions',
    color: 'bg-green-100 text-green-800'
  },
  short_answer: {
    icon: PenTool,
    name: 'Short Answer',
    description: 'Write thoughtful responses',
    color: 'bg-purple-100 text-purple-800'
  },
  timed_quiz: {
    icon: Timer,
    name: 'Timed Quiz',
    description: 'Answer questions within time limits',
    color: 'bg-orange-100 text-orange-800'
  },
  image_identification: {
    icon: ImageIcon,
    name: 'Image Tasks',
    description: 'Visual identification and analysis',
    color: 'bg-pink-100 text-pink-800'
  },
  audio_response: {
    icon: Volume2,
    name: 'Audio Response',
    description: 'Voice-based questions and responses',
    color: 'bg-indigo-100 text-indigo-800'
  }
};

const DIFFICULTY_COLORS = {
  beginner: 'glass-subtle text-green-400 border-green-400/20',
  intermediate: 'glass-subtle text-yellow-400 border-yellow-400/20',
  advanced: 'glass-subtle text-red-400 border-red-400/20'
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

  useEffect(() => {
    loadPublicAssessments();
  }, []);

  const loadPublicAssessments = async () => {
    try {
      setLoading(true);
      
      // Use the RPC function to get public assessments
      const { data, error } = await supabase.rpc('get_public_assessments', {
        p_type: null,
        p_difficulty: null,
        p_limit: 50,
        p_offset: 0
      });

      if (error) {
        throw error;
      }

      if (data && data.assessments) {
        setAssessments(data.assessments);
        logger.info('Loaded public assessments', { count: data.assessments.length });
      } else {
        // Fallback: direct query if RPC function not available
        const { data: directData, error: directError } = await supabase
          .from('assessments')
          .select(`
            id,
            slug,
            title,
            description,
            type,
            difficulty,
            estimated_time,
            is_featured,
            tags
          `)
          .eq('is_public', true)
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false });

        if (directError) {
          throw directError;
        }

        // Add question count (simplified)
        const assessmentsWithCounts = (directData || []).map(assessment => ({
          ...assessment,
          question_count: 5, // Default count
          attempt_count: 0   // Default count
        }));

        setAssessments(assessmentsWithCounts);
        logger.info('Loaded assessments via direct query', { count: assessmentsWithCounts.length });
      }

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
  };

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

  const renderAssessmentCard = (assessment: AssessmentSummary) => {
    const typeInfo = ASSESSMENT_TYPE_INFO[assessment.type] || ASSESSMENT_TYPE_INFO.multiple_choice;
    const TypeIcon = typeInfo.icon;
    const difficultyColor = DIFFICULTY_COLORS[assessment.difficulty] || DIFFICULTY_COLORS.beginner;

    return (
      <Card key={assessment.id} className="glass hover:glass-strong transition-all duration-200 group cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                  <TypeIcon className="h-4 w-4" />
                </div>
                {assessment.is_featured && (
                  <Badge variant="default" className="glass-subtle text-yellow-400 border-yellow-400/20">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  FREE
                </Badge>
              </div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {assessment.title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription className="text-sm line-clamp-2">
            {assessment.description}
          </CardDescription>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={difficultyColor}>
              {assessment.difficulty}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {assessment.estimated_time} min
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {assessment.attempt_count} attempts
            </Badge>
          </div>

          {assessment.tags && assessment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {assessment.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {assessment.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{assessment.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckSquare className="h-4 w-4 mr-1" />
              {assessment.question_count} questions
            </div>
            <Button 
              onClick={() => handleSelectAssessment(assessment)}
              className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <h2 className="text-xl font-semibold">Loading Assessments</h2>
          <p className="text-muted-foreground">Finding the perfect assessments for you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="glass-strong max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Assessments</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-2">
              <Button onClick={loadPublicAssessments} className="w-full">
                Try Again
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Gift className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Free Assessment Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover insights about yourself with our collection of free, anonymous assessments. 
            No signup required!
          </p>
        </div>

        {/* Filters */}
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search assessments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(ASSESSMENT_TYPE_INFO).map(([type, info]) => (
                      <SelectItem key={type} value={type}>
                        {info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
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

        {/* Assessment Grid */}
        {filteredAssessments.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No assessments found</h3>
              <p className="text-muted-foreground mb-6">
                {assessments.length === 0 
                  ? 'No assessments are currently available. Please try again later.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              <Button onClick={loadPublicAssessments}>
                Refresh Assessments
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssessments.map(renderAssessmentCard)}
          </div>
        )}

        {/* Stats Footer */}
        <Card className="glass">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{assessments.length}</div>
                <div className="text-sm text-muted-foreground">Free Assessments</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">6</div>
                <div className="text-sm text-muted-foreground">Assessment Types</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {assessments.reduce((sum, a) => sum + (a.attempt_count || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Attempts</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">100%</div>
                <div className="text-sm text-muted-foreground">Anonymous & Free</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="glass border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-6 text-center">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Ready to Start Your Growth Journey?</h3>
            <p className="text-muted-foreground mb-4">
              Choose any assessment above to begin discovering insights about yourself. 
              All assessments are completely free and require no signup!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <Star className="h-4 w-4 mr-2" />
                Choose an Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileAssessmentHub;