import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { visitorAssessments } from '@/data/visitor-assessments';
import { 
  ArrowRight, 
  Clock, 
  Star, 
  Users, 
  TrendingUp,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export const AssessmentShowcase: React.FC = () => {
  const navigate = useNavigate();

  const featuredAssessments = visitorAssessments.slice(0, 3);
  const stats = {
    totalAssessments: visitorAssessments.length,
    avgTime: Math.round(visitorAssessments.reduce((sum, a) => sum + a.estimatedTime, 0) / visitorAssessments.length),
    totalQuestions: visitorAssessments.reduce((sum, a) => sum + a.questions.length, 0),
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Free Self-Discovery Tools
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Yourself with Free Assessments
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Take science-based assessments to understand your personality, wellness, career potential, 
            and relationship patterns. Get instant insights with no signup required.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalAssessments}</div>
            <div className="text-gray-600">Free Assessments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.totalQuestions}</div>
            <div className="text-gray-600">Total Questions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.avgTime}</div>
            <div className="text-gray-600">Avg Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">100%</div>
            <div className="text-gray-600">Free Forever</div>
          </div>
        </div>

        {/* Featured Assessments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {featuredAssessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl ${assessment.color} flex items-center justify-center text-white text-2xl`}>
                    {assessment.icon}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {assessment.category}
                  </Badge>
                </div>
                <CardTitle className="group-hover:text-blue-600 transition-colors">
                  {assessment.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {assessment.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{assessment.estimatedTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{assessment.questions.length} questions</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {assessment.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button 
                  onClick={() => navigate(`/assessment/${assessment.slug}`)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group"
                >
                  Start Assessment
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: <Star className="w-6 h-6" />,
              title: '100% Free',
              description: 'All assessments are completely free with no hidden costs',
              color: 'text-yellow-600'
            },
            {
              icon: <Clock className="w-6 h-6" />,
              title: 'Quick & Easy',
              description: 'Complete assessments in 5-15 minutes with instant results',
              color: 'text-blue-600'
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: 'No Signup Required',
              description: 'Start exploring immediately without creating an account',
              color: 'text-green-600'
            },
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: 'Science-Based',
              description: 'Built on proven psychological frameworks and research',
              color: 'text-purple-600'
            }
          ].map((benefit, index) => (
            <Card key={index} className="text-center hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className={`flex justify-center mb-3 ${benefit.color}`}>
                  {benefit.icon}
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="text-center py-12">
            <h3 className="text-3xl font-bold mb-4">Ready to Discover Yourself?</h3>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of people who have gained valuable insights about themselves through our assessments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/assessments')}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Star className="w-5 h-5 mr-2" />
                Browse All Assessments
              </Button>
              <Button 
                onClick={() => navigate('/assessment/personality-insights')}
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Start with Personality
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AssessmentShowcase;