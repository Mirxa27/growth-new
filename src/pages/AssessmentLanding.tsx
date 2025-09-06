/**
 * Assessment Landing Page
 * Entry point for users to discover and take assessments
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Brain, 
  Users, 
  Clock,
  Star,
  ChevronRight,
  Play
} from 'lucide-react';
import { getPublicAssessments, getAccessibleAssessments } from '@/services/api/assessment.service';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/services/logging/logger.service';
import { toast } from 'sonner';
import type { Assessment } from '@/types/assessment';

const AssessmentLanding: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssessments();
  }, [user]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load assessments based on user authentication status
      const data = user ? await getAccessibleAssessments() : await getPublicAssessments();
      setAssessments(data);

      logger.info('Assessments loaded successfully', {
        component: 'AssessmentLanding',
        action: 'loadAssessments',
        metadata: {
          count: data.length,
          userAuthenticated: !!user,
          userId: user?.id
        }
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assessments';
      setError(errorMessage);
      toast.error(errorMessage);
      
      logger.error('Failed to load assessments', {
        component: 'AssessmentLanding',
        action: 'loadAssessments',
        error: err
      });
    } finally {
      setLoading(false);
    }
  };

  const getAssessmentIcon = (type: string) => {
    switch (type) {
      case 'personality': return <Brain className="w-5 h-5 text-purple-600" />;
      case 'career': return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'relationships': return <Users className="w-5 h-5 text-pink-600" />;
      default: return <Star className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getAssessmentColor = (type: string) => {
    switch (type) {
      case 'personality': return 'border-purple-200 bg-purple-50';
      case 'career': return 'border-blue-200 bg-blue-50';
      case 'relationships': return 'border-pink-200 bg-pink-50';
      default: return 'border-yellow-200 bg-yellow-50';
    }
  };

  const handleStartAssessment = (assessmentId: string) => {
    logger.info('Assessment started', {
      component: 'AssessmentLanding',
      action: 'startAssessment',
      metadata: { assessmentId, userId: user?.id }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-2/3 mx-auto" />
          </div>
          
          {/* Assessment Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="glass">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="glass max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Unable to Load Assessments</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadAssessments}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Discover Your
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Authentic Self</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Take scientifically-designed assessments to uncover your personality, strengths, and growth opportunities. 
            Start your journey of self-discovery with our AI-powered insights.
          </p>
          {!user && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 font-medium">
                🌟 Create a free account to save your results and track your growth journey!
              </p>
              <Link to="/auth">
                <Button className="mt-3 bg-blue-600 hover:bg-blue-700">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Assessment Grid */}
        {assessments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment) => (
              <Card 
                key={assessment.id} 
                className={`glass hover:shadow-lg transition-all duration-200 hover:scale-105 ${getAssessmentColor(assessment.type)}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    {getAssessmentIcon(assessment.type)}
                    <Badge variant="secondary" className="text-xs">
                      {assessment.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2">
                    {assessment.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {assessment.description}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{assessment.questions?.length || 10} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>~{Math.ceil((assessment.questions?.length || 10) * 0.5)} min</span>
                    </div>
                  </div>

                  <Link to={`/assessment/${assessment.id}`}>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      onClick={() => handleStartAssessment(assessment.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Assessment
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assessments Available</h3>
              <p className="text-gray-600 mb-6">
                We're working on adding more assessments. Check back soon!
              </p>
              <Button onClick={loadAssessments}>
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-12">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose Our Assessments?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-gray-600">
                Advanced AI analysis provides personalized insights and recommendations for your growth journey.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Scientifically Validated</h3>
              <p className="text-sm text-gray-600">
                Our assessments are based on established psychological frameworks and research.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Personalized Results</h3>
              <p className="text-sm text-gray-600">
                Get customized feedback and actionable steps tailored to your unique personality and goals.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action for Visitors */}
        {!user && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Begin Your Growth Journey?</h2>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Join thousands of women who have discovered their authentic selves through our comprehensive assessments. 
              Create your free account to save results and track your progress over time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                  Sign Up Free
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                Learn More About Assessments
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentLanding;