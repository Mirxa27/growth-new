import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { assessmentGeneratorService, GenerationRequest } from '@/services/ai/assessment-generator.service';
import AIContentBuilder from './AIContentBuilder';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  Download, 
  Upload,
  Wand2,
  Settings,
  Users,
  Clock,
  Target,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  FileText,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'assessment' | 'quiz' | 'exploration' | 'course';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audience: 'visitors' | 'users' | 'premium';
  status: 'draft' | 'review' | 'published' | 'archived';
  isActive: boolean;
  estimatedTime: number;
  questionCount: number;
  completionCount: number;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface ContentStats {
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  totalCompletions: number;
  averageRating: number;
  contentByType: Record<string, number>;
  contentByCategory: Record<string, number>;
}

export const ContentManagement: React.FC = () => {
  const { toast } = useToast();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<ContentStats>({
    totalContent: 0,
    publishedContent: 0,
    draftContent: 0,
    totalCompletions: 0,
    averageRating: 0,
    contentByType: {},
    contentByCategory: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIBuilder, setShowAIBuilder] = useState(false);

  /**
   * Load content items and stats
   */
  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      
      // Load content items (mock data for demo)
      const mockContent: ContentItem[] = [
        {
          id: '1',
          title: 'Comprehensive Personality Assessment',
          description: 'Deep dive into personality traits using Big Five model',
          type: 'assessment',
          category: 'personality',
          difficulty: 'intermediate',
          audience: 'users',
          status: 'published',
          isActive: true,
          estimatedTime: 25,
          questionCount: 15,
          completionCount: 1247,
          averageRating: 4.7,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-02-01'),
          createdBy: 'admin'
        },
        {
          id: '2',
          title: 'Quick Stress Level Check',
          description: 'Fast assessment of current stress levels',
          type: 'quiz',
          category: 'wellness',
          difficulty: 'beginner',
          audience: 'visitors',
          status: 'published',
          isActive: true,
          estimatedTime: 5,
          questionCount: 8,
          completionCount: 3421,
          averageRating: 4.3,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-25'),
          createdBy: 'admin'
        },
        {
          id: '3',
          title: 'Leadership Potential Explorer',
          description: 'Discover your leadership style and potential',
          type: 'exploration',
          category: 'leadership',
          difficulty: 'advanced',
          audience: 'premium',
          status: 'draft',
          isActive: false,
          estimatedTime: 35,
          questionCount: 20,
          completionCount: 0,
          averageRating: 0,
          createdAt: new Date('2024-02-10'),
          updatedAt: new Date('2024-02-15'),
          createdBy: 'ai_generator'
        }
      ];

      setContentItems(mockContent);

      // Calculate stats
      const stats: ContentStats = {
        totalContent: mockContent.length,
        publishedContent: mockContent.filter(item => item.status === 'published').length,
        draftContent: mockContent.filter(item => item.status === 'draft').length,
        totalCompletions: mockContent.reduce((sum, item) => sum + item.completionCount, 0),
        averageRating: mockContent.reduce((sum, item) => sum + item.averageRating, 0) / mockContent.length,
        contentByType: mockContent.reduce((acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        contentByCategory: mockContent.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      setStats(stats);
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content items.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Filter content items
   */
  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  /**
   * Generate new content with AI
   */
  const generateNewContent = async (request: GenerationRequest) => {
    try {
      setIsGenerating(true);
      
      const generatedContent = await assessmentGeneratorService.generateContent(request);
      
      // Save to database
      const contentId = await assessmentGeneratorService.saveGeneratedContent(
        generatedContent,
        request,
        'draft'
      );

      toast({
        title: 'Content Generated!',
        description: `New ${request.contentType} created successfully.`,
      });

      // Reload content list
      await loadContent();
      
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Update content status
   */
  const updateContentStatus = async (contentId: string, newStatus: string) => {
    try {
      // Update in database
      // const { error } = await supabase
      //   .from('assessments')
      //   .update({ status: newStatus, updated_at: new Date().toISOString() })
      //   .eq('id', contentId);

      // For demo, update local state
      setContentItems(prev => prev.map(item => 
        item.id === contentId 
          ? { ...item, status: newStatus as any, updatedAt: new Date() }
          : item
      ));

      toast({
        title: 'Status Updated',
        description: `Content status changed to ${newStatus}.`,
      });

    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update content status.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Delete content item
   */
  const deleteContent = async (contentId: string) => {
    try {
      // Delete from database
      // const { error } = await supabase
      //   .from('assessments')
      //   .delete()
      //   .eq('id', contentId);

      // For demo, update local state
      setContentItems(prev => prev.filter(item => item.id !== contentId));

      toast({
        title: 'Content Deleted',
        description: 'Content item has been permanently deleted.',
      });

    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete content item.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'review': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      case 'archived': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  /**
   * Get type icon
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <Target className="w-4 h-4" />;
      case 'quiz': return <HelpCircle className="w-4 h-4" />;
      case 'exploration': return <Lightbulb className="w-4 h-4" />;
      case 'course': return <BookOpen className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading content...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="text-center py-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalContent}</div>
            <div className="text-sm text-muted-foreground">Total Content</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <div className="text-2xl font-bold text-green-600">{stats.publishedContent}</div>
            <div className="text-sm text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.draftContent}</div>
            <div className="text-sm text-muted-foreground">Drafts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <div className="text-2xl font-bold text-purple-600">{stats.totalCompletions.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Completions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <div className="text-2xl font-bold text-orange-600">{stats.averageRating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Avg Rating</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage">Manage Content</TabsTrigger>
          <TabsTrigger value="generate">AI Generator</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Manage Content Tab */}
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Content Library</CardTitle>
                  <CardDescription>
                    Manage assessments, quizzes, explorations, and courses
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowAIBuilder(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="assessment">Assessments</SelectItem>
                    <SelectItem value="quiz">Quizzes</SelectItem>
                    <SelectItem value="exploration">Explorations</SelectItem>
                    <SelectItem value="course">Courses</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadContent} variant="outline">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContent.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <Badge variant="outline" className="capitalize">
                            {item.type}
                          </Badge>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(item.status)} text-white border-none`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.estimatedTime}min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            <span>{item.questionCount} questions</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{item.completionCount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{item.averageRating.toFixed(1)}/5</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {item.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {item.difficulty}
                          </Badge>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {item.audience}
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedContent(item)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedContent(item);
                              setIsEditing(true);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          {item.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => updateContentStatus(item.id, 'published')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Publish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteContent(item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* No Results */}
              {filteredContent.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No content found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filters.'
                      : 'Create your first piece of content to get started.'
                    }
                  </p>
                  <Button 
                    onClick={() => setShowAIBuilder(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Content with AI
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Generator Tab */}
        <TabsContent value="generate" className="space-y-4">
          <AIContentBuilder />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Content by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.contentByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(type)}
                        <span className="capitalize">{type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(count / stats.totalContent) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Content by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.contentByCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="capitalize">{category.replace('-', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(count / stats.totalContent) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {((stats.publishedContent / stats.totalContent) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Published Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {(stats.totalCompletions / stats.publishedContent || 0).toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Completions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.averageRating.toFixed(1)}/5
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(stats.totalCompletions / 30)}
                    </div>
                    <div className="text-sm text-muted-foreground">Daily Avg</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Builder Modal/Sheet */}
      {showAIBuilder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">AI Content Generator</h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowAIBuilder(false)}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <AIContentBuilder />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;