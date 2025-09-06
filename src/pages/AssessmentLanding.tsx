import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AssessmentHub from '@/components/assessment/AssessmentHub';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  Heart, 
  Briefcase, 
  Users, 
  Sparkles, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Star,
  Award,
  Zap
} from 'lucide-react';

interface AssessmentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const AssessmentLanding: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [showAssessments, setShowAssessments] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to default categories if database isn't ready
      setCategories([
        { id: '1', name: 'Personality', description: 'Discover your unique traits', icon: '🧠', color: '#8B5CF6' },
        { id: '2', name: 'Emotional Intelligence', description: 'Assess your emotional awareness', icon: '💝', color: '#EC4899' },
        { id: '3', name: 'Career Development', description: 'Explore your professional path', icon: '💼', color: '#10B981' },
        { id: '4', name: 'Relationships', description: 'Understand your connection patterns', icon: '💕', color: '#F59E0B' }
      ]);
    }
  };

  const handleStartAssessment = () => {
    setShowAssessments(true);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case '🧠': return Brain;
      case '💝': return Heart;
      case '💼': return Briefcase;
      case '💕': return Users;
      default: return Sparkles;
    }
  };

  if (showAssessments) {
    return <AssessmentHub />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Free Assessment Platform</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            Discover Your True Self
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Take comprehensive assessments designed specifically for women to unlock your personality, 
            emotional intelligence, career potential, and relationship patterns with AI-powered insights.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">100% Free</span>
            </div>
            <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm">10-15 Minutes</span>
            </div>
            <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
              <Award className="w-4 h-4 text-purple-500" />
              <span className="text-sm">AI-Powered Results</span>
            </div>
            <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">Instant Insights</span>
            </div>
          </div>
        </motion.div>

        {/* Assessment Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-4">Choose Your Discovery Path</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Each assessment is scientifically designed with 10-15 questions and provides personalized insights 
            based on your unique responses.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="glass-card group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/5 backdrop-blur-xl">
                    <CardHeader className="text-center pb-4">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <IconComponent 
                          className="w-8 h-8 transition-all duration-300" 
                          style={{ color: category.color }}
                        />
                      </div>
                      <CardTitle className="text-lg font-semibold group-hover:text-purple-600 transition-colors">
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {category.description}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border-0"
                      >
                        15 Questions
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <Card className="glass-card border-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl">
            <CardContent className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
                  <p className="text-gray-600">
                    Advanced algorithms analyze your responses to provide deep, personalized insights about your personality and potential.
                  </p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Personalized Results</h3>
                  <p className="text-gray-600">
                    Receive detailed feedback tailored to your unique responses, with actionable recommendations for growth.
                  </p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Instant Insights</h3>
                  <p className="text-gray-600">
                    Get immediate results with comprehensive analysis, growth recommendations, and areas for development.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ready to Discover Your Hidden Self?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of women who've unlocked their potential through our comprehensive assessment platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleStartAssessment}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold rounded-2xl"
              >
                Start Free Assessment
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="glass-button border-purple-200 hover:border-purple-300 px-8 py-4 text-lg font-medium rounded-2xl"
              >
                Learn More
              </Button>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              No signup required • Complete privacy • Instant results
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AssessmentLanding;
