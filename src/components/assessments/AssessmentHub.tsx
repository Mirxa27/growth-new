import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search,
  Clock,
  Users,
  Star,
  Play,
  Filter,
  BookOpen,
  Brain,
  Heart,
  Briefcase,
  MessageCircle,
  TrendingUp,
  Zap,
  Camera,
  Mic,
  Timer,
  CheckSquare,
  PenTool,
  Image as ImageIcon,
  Volume2
} from 'lucide-react';
import { logger } from '@/utils/logger';

export interface AssessmentSummary {
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

interface AssessmentHubProps {
  onSelectAssessment: (assessment: AssessmentSummary) => void;
  showFeaturedOnly?: boolean;
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
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800'
};

const CATEGORY_ICONS = {
  personality: Brain,
  wellness: Heart,
  career: Briefcase,
  relationships: MessageCircle,
  growth: TrendingUp,
  general: BookOpen
};

export const AssessmentHub: React.FC<AssessmentHubProps> = ({
  onSelectAssessment,
  showFeaturedOnly = false
}) => {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_public_assessments', {
        p_type: null,
        p_difficulty: null,
        p_limit: 100,
        p_offset: 0
      });

      if (error) throw error;

      setAssessments(data?.assessments || []);
      logger.info('Fetched assessments', { count: data?.assessments?.length });
    } catch (error) {
      logger.error('Failed to fetch assessments', 'AssessmentHub', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessments. Please try again.',
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
        assessment.tags.some(tag => tag.toLowerCase().includes(query));
      
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

    // Apply tab filter
    if (activeTab !== 'all') {
      if (activeTab === 'featured' && !assessment.is_featured) return false;
      if (activeTab === 'popular' && assessment.attempt_count < 10) return false;
      if (activeTab === 'quick' && assessment.estimated_time > 15) return false;
    }

    // Apply featured only filter
    if (showFeaturedOnly && !assessment.is_featured) {
      return false;
    }

    return true;
  });

  const groupedAssessments = filteredAssessments.reduce((groups, assessment) => {
    const type = assessment.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(assessment);
    return groups;
  }, {} as Record<string, AssessmentSummary[]>);

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
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
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

          {assessment.tags.length > 0 && (
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
              onClick={() => onSelectAssessment(assessment)}
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

  const renderAssessmentsByType = () => {
    return Object.entries(groupedAssessments).map(([type, typeAssessments]) => {
      const typeInfo = ASSESSMENT_TYPE_INFO[type] || ASSESSMENT_TYPE_INFO.multiple_choice;
      const TypeIcon = typeInfo.icon;

      return (
        <div key={type} className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${typeInfo.color}`}>
              <TypeIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{typeInfo.name}</h3>
              <p className="text-sm text-muted-foreground">{typeInfo.description}</p>
            </div>
            <Badge variant="outline" className="ml-auto">
              {typeAssessments.length} available
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeAssessments.map(renderAssessmentCard)}
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Free Assessments
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-96 mx-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="quick">Quick</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8 mt-8">
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No assessments found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            renderAssessmentsByType()
          )}
        </TabsContent>

        <TabsContent value="featured" className="space-y-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssessments.filter(a => a.is_featured).map(renderAssessmentCard)}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssessments
              .filter(a => a.attempt_count >= 10)
              .sort((a, b) => b.attempt_count - a.attempt_count)
              .map(renderAssessmentCard)}
          </div>
        </TabsContent>

        <TabsContent value="quick" className="space-y-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssessments
              .filter(a => a.estimated_time <= 15)
              .sort((a, b) => a.estimated_time - b.estimated_time)
              .map(renderAssessmentCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{assessments.length}</div>
              <div className="text-sm text-muted-foreground">Total Assessments</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {Object.keys(ASSESSMENT_TYPE_INFO).length}
              </div>
              <div className="text-sm text-muted-foreground">Assessment Types</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {assessments.reduce((sum, a) => sum + a.attempt_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Attempts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-muted-foreground">Free & Anonymous</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentHub;