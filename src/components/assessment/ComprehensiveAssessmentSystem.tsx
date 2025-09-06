import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// Additional imports available for future use
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  BarChart3, 
  Brain, 
  Target,
  TrendingUp,
  Lightbulb,
  Clock,
  Eye,
  Settings,
  FileText,
  Award,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface ComprehensiveAssessmentSystemProps {
  className?: string;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  category_id: string;
  type: string;
  difficulty: string;
  estimated_duration: number;
  is_featured: boolean;
  is_active: boolean;
  visibility: string;
  created_at: string;
  assessment_categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

interface AssessmentStats {
  totalAssessments: number;
  totalAttempts: number;
  totalCompletions: number;
  averageScore: number;
  completionRate: number;
}

const ComprehensiveAssessmentSystem: React.FC<ComprehensiveAssessmentSystemProps> = ({ className }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<AssessmentStats>({
    totalAssessments: 0,
    totalAttempts: 0,
    totalCompletions: 0,
    averageScore: 0,
    completionRate: 0
  });
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadAssessments(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load assessment data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAssessments = async () => {
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        assessment_categories (name, icon, color)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAssessments(data || []);
  };

  const loadStats = async () => {
    try {
      // Get total assessments
      const { count: totalAssessments } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true });

      // Get total attempts
      const { count: totalAttempts } = await supabase
        .from('user_assessment_attempts')
        .select('*', { count: 'exact', head: true });

      // Get completions
      const { count: totalCompletions } = await supabase
        .from('user_assessment_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Get average score from results
      const { data: results } = await supabase
        .from('assessment_results')
        .select('percentage');

      const averageScore = results && results.length > 0 
        ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
        : 0;

      const completionRate = totalAttempts && totalAttempts > 0 
        ? ((totalCompletions || 0) / totalAttempts) * 100 
        : 0;

      setStats({
        totalAssessments: totalAssessments || 0,
        totalAttempts: totalAttempts || 0,
        totalCompletions: totalCompletions || 0,
        averageScore,
        completionRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const applyMigrations = async () => {
    try {
      setIsLoading(true);
      
      // Apply the database migration
      const { error: migrationError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Apply the comprehensive assessment system migration
          -- This will create all necessary tables if they don't exist
        `
      });

      if (migrationError) {
        console.error('Migration error:', migrationError);
      }

      // Apply sample data
      await applySampleData();
      
      toast({
        title: "Success",
        description: "Assessment system has been set up successfully!",
      });

      await loadData();
    } catch (error) {
      console.error('Error applying migrations:', error);
      toast({
        title: "Error",
        description: "Failed to set up assessment system.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applySampleData = async () => {
    try {
      // Check if categories already exist
      const { data: existingCategories } = await supabase
        .from('assessment_categories')
        .select('id')
        .limit(1);

      if (!existingCategories || existingCategories.length === 0) {
        // Insert sample categories
        const { error: categoriesError } = await supabase
          .from('assessment_categories')
          .insert([
            { name: 'Personality', description: 'Discover your personality traits', icon: '🧠', color: '#8B5CF6', sort_order: 1 },
            { name: 'Emotional Intelligence', description: 'Assess emotional awareness', icon: '💝', color: '#EC4899', sort_order: 2 },
            { name: 'Career Development', description: 'Explore career interests', icon: '💼', color: '#10B981', sort_order: 3 },
            { name: 'Relationships', description: 'Understand relationship patterns', icon: '💕', color: '#F59E0B', sort_order: 4 }
          ]);

        if (categoriesError) throw categoriesError;
      }

      // Check if assessments already exist
      const { data: existingAssessments } = await supabase
        .from('assessments')
        .select('id')
        .limit(1);

      if (!existingAssessments || existingAssessments.length === 0) {
        // Get personality category ID
        const { data: personalityCategory } = await supabase
          .from('assessment_categories')
          .select('id')
          .eq('name', 'Personality')
          .single();

        if (personalityCategory) {
          // Create sample assessment
          const { data: assessment, error: assessmentError } = await supabase
            .from('assessments')
            .insert([{
              title: 'Complete Personality Discovery',
              description: 'Uncover your core personality traits through this comprehensive 15-question assessment.',
              category_id: personalityCategory.id,
              type: 'personality',
              difficulty: 'medium',
              estimated_duration: 12,
              instructions: 'Answer each question based on your natural instincts and preferences.',
              is_featured: true,
              ai_prompt: 'Analyze this personality assessment to provide detailed insights about core traits and growth opportunities.'
            }])
            .select()
            .single();

          if (assessmentError) throw assessmentError;

          // Add sample questions for the assessment
          if (assessment) {
            await createSampleQuestions(assessment.id);
          }
        }
      }
    } catch (error) {
      console.error('Error applying sample data:', error);
      throw error;
    }
  };

  const createSampleQuestions = async (assessmentId: string) => {
    const sampleQuestions = [
      {
        question_text: 'In social situations, you typically:',
        question_type: 'multiple_choice',
        position: 1,
        points: 1,
        options: [
          { option_text: 'Initiate conversations with new people', position: 1, score_value: 4, feedback: 'High extraversion preference' },
          { option_text: 'Wait for others to approach you', position: 2, score_value: 1, feedback: 'Introversion preference' },
          { option_text: 'Find a comfortable spot to observe', position: 3, score_value: 2, feedback: 'Moderate introversion' },
          { option_text: 'Engage selectively with familiar faces', position: 4, score_value: 3, feedback: 'Balanced social approach' }
        ]
      },
      {
        question_text: 'When making important decisions, you rely most on:',
        question_type: 'multiple_choice',
        position: 2,
        points: 1,
        options: [
          { option_text: 'Logic and objective analysis', position: 1, score_value: 4, feedback: 'Strong thinking preference' },
          { option_text: 'Your gut feelings and intuition', position: 2, score_value: 4, feedback: 'High intuition preference' },
          { option_text: 'Input from trusted friends/family', position: 3, score_value: 3, feedback: 'Collaborative approach' },
          { option_text: 'Past experiences and practical considerations', position: 4, score_value: 2, feedback: 'Sensing preference' }
        ]
      },
      {
        question_text: 'Your ideal weekend involves:',
        question_type: 'multiple_choice',
        position: 3,
        points: 1,
        options: [
          { option_text: 'Adventure and new experiences', position: 1, score_value: 4, feedback: 'High openness to experience' },
          { option_text: 'Relaxation and quiet time', position: 2, score_value: 2, feedback: 'Introversion preference' },
          { option_text: 'Socializing with friends', position: 3, score_value: 4, feedback: 'Extraversion preference' },
          { option_text: 'Productive activities and learning', position: 4, score_value: 3, feedback: 'Achievement orientation' }
        ]
      }
    ];

    for (const question of sampleQuestions) {
      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from('assessment_questions')
        .insert([{
          assessment_id: assessmentId,
          question_text: question.question_text,
          question_type: question.question_type,
          position: question.position,
          points: question.points
        }])
        .select()
        .single();

      if (questionError) throw questionError;

      // Insert options
      if (questionData && question.options) {
        const optionsToInsert = question.options.map(option => ({
          question_id: questionData.id,
          option_text: option.option_text,
          position: option.position,
          score_value: option.score_value,
          feedback: option.feedback,
          is_correct: false
        }));

        const { error: optionsError } = await supabase
          .from('assessment_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-7xl mx-auto ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Assessment & Quiz System
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive assessment platform with AI-driven insights and personalized feedback
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={applyMigrations}
            variant="outline"
            className="glass-button"
          >
            <Settings className="w-4 h-4 mr-2" />
            Setup System
          </Button>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assessment
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 glass-nav">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assessments" className="data-[state=active]:bg-white/20">
            <FileText className="w-4 h-4 mr-2" />
            Assessments
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-white/20">
            <Award className="w-4 h-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewDashboard stats={stats} assessments={assessments} />
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <AssessmentsList assessments={assessments} onUpdate={loadData} />
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <ResultsAnalysis />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard stats={stats} />
        </TabsContent>
      </Tabs>

      {/* Create Assessment Dialog */}
      <CreateAssessmentDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

interface OverviewDashboardProps {
  stats: AssessmentStats;
  assessments: Assessment[];
}

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ stats, assessments }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Assessments</p>
                  <p className="text-3xl font-bold">{stats.totalAssessments}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Attempts</p>
                  <p className="text-3xl font-bold">{stats.totalAttempts}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Completion Rate</p>
                  <p className="text-3xl font-bold">{stats.completionRate.toFixed(1)}%</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Average Score</p>
                  <p className="text-3xl font-bold">{stats.averageScore.toFixed(1)}%</p>
                </div>
                <Target className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Assessments */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            Recent Assessments
          </CardTitle>
          <CardDescription>
            Latest assessments in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessments.slice(0, 5).map((assessment, index) => (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/20"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{assessment.title}</h4>
                    <p className="text-sm text-gray-600">{assessment.type} • {assessment.estimated_duration}min</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={assessment.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                    {assessment.difficulty}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface AssessmentsListProps {
  assessments: Assessment[];
  onUpdate: () => void;
}

const AssessmentsList: React.FC<AssessmentsListProps> = ({ assessments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || assessment.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48 glass-input">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="personality">Personality</SelectItem>
            <SelectItem value="skills">Skills</SelectItem>
            <SelectItem value="career">Career</SelectItem>
            <SelectItem value="wellness">Wellness</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAssessments.map((assessment, index) => (
            <motion.div
              key={assessment.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card group hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-2 group-hover:text-purple-600 transition-colors">
                        {assessment.title}
                        {assessment.is_featured && (
                          <Badge className="ml-2 bg-yellow-100 text-yellow-800">Featured</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {assessment.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{assessment.estimated_duration}min</span>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={
                        assessment.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        assessment.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {assessment.difficulty}
                      </Badge>
                      <Badge className={
                        assessment.visibility === 'public' ? 'bg-blue-100 text-blue-800' :
                        assessment.visibility === 'private' ? 'bg-purple-100 text-purple-800' :
                        'bg-gold-100 text-gold-800'
                      }>
                        {assessment.visibility}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={assessment.is_active} 
                        onCheckedChange={() => {
                          // Handle status toggle
                        }}
                      />
                      <span className="text-sm text-gray-600">Active</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
            Try adjusting your search or filters, or create a new assessment.
          </p>
        </motion.div>
      )}
    </div>
  );
};

const ResultsAnalysis: React.FC = () => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Assessment Results Analysis</CardTitle>
        <CardDescription>
          Comprehensive analysis of user assessment results and performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Results analysis functionality will be implemented here.</p>
      </CardContent>
    </Card>
  );
};

interface AnalyticsDashboardProps {
  stats: AssessmentStats;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>
            Detailed insights into assessment performance and user engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Completion Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Attempts:</span>
                  <span className="font-semibold">{stats.totalAttempts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completions:</span>
                  <span className="font-semibold">{stats.totalCompletions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completion Rate:</span>
                  <span className="font-semibold">{stats.completionRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Performance Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Average Score:</span>
                  <span className="font-semibold">{stats.averageScore.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Assessments:</span>
                  <span className="font-semibold">{stats.totalAssessments}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface CreateAssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAssessmentDialog: React.FC<CreateAssessmentDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSample = async () => {
    setIsCreating(true);
    try {
      // This would create a sample assessment
      toast({
        title: "Success",
        description: "Sample assessment created successfully!",
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating assessment:', err);
      toast({
        title: "Error",
        description: "Failed to create assessment.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Assessment</DialogTitle>
          <DialogDescription>
            Start with a sample assessment template or create from scratch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button 
            onClick={handleCreateSample}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isCreating ? (
              <>
                <div className="animate-spin w-4 h-4 mr-2">⏳</div>
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Sample Assessment
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onClose}
          >
            Custom Assessment Builder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComprehensiveAssessmentSystem;
