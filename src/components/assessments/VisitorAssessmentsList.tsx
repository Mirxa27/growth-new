import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { visitorAssessments } from '@/data/visitor-assessments';
import { Clock, Search, Filter, Star, TrendingUp, Users } from 'lucide-react';

export const VisitorAssessmentsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = Array.from(new Set(visitorAssessments.map(a => a.category)));

  // Filter assessments
  const filteredAssessments = visitorAssessments
    .filter(assessment => assessment.isActive)
    .filter(assessment => {
      const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assessment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assessment.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || assessment.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

  /**
   * Get category display info
   */
  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      personality: { name: 'Personality', icon: '🧠', color: 'bg-purple-500' },
      wellness: { name: 'Wellness', icon: '🌱', color: 'bg-green-500' },
      career: { name: 'Career', icon: '🎯', color: 'bg-blue-500' },
      relationships: { name: 'Relationships', icon: '💕', color: 'bg-pink-500' },
      mindfulness: { name: 'Mindfulness', icon: '🧘', color: 'bg-indigo-500' },
      growth: { name: 'Growth', icon: '🌟', color: 'bg-yellow-500' },
    };
    return categoryMap[category as keyof typeof categoryMap] || { name: category, icon: '📊', color: 'bg-gray-500' };
  };

  /**
   * Start assessment
   */
  const startAssessment = (slug: string) => {
    navigate(`/assessment/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Discover Yourself
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Take free, science-based assessments to understand your personality, wellness, and growth potential
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-lg">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>5-15 Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Instant Results</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>No Signup Required</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => {
                const info = getCategoryInfo(category);
                return (
                  <SelectItem key={category} value={category}>
                    <span className="flex items-center gap-2">
                      <span>{info.icon}</span>
                      <span className="capitalize">{info.name}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Assessment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => {
            const categoryInfo = getCategoryInfo(assessment.category);
            
            return (
              <Card key={assessment.id} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-12 h-12 rounded-lg ${assessment.color} flex items-center justify-center text-white text-xl`}>
                      {assessment.icon}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {categoryInfo.name}
                    </Badge>
                  </div>
                  <CardTitle className="group-hover:text-blue-600 transition-colors">
                    {assessment.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {assessment.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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
                    {assessment.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{assessment.tags.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <Button 
                    onClick={() => startAssessment(assessment.slug)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredAssessments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No assessments found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or category filter.
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <Card className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-bold mb-4">Ready for More Detailed Insights?</h3>
            <p className="text-lg text-muted-foreground mb-6">
              Create a free account to access 20+ comprehensive assessments, track your progress over time, 
              and get personalized growth recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/auth/register')}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Create Free Account
              </Button>
              <Button 
                onClick={() => navigate('/auth/login')}
                size="lg"
                variant="outline"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitorAssessmentsList;