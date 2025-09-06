import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  Heart, 
  Users, 
  Target, 
  Compass, 
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface AssessmentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
}

const SimpleAssessmentLanding = () => {
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const iconMap = {
    'brain': Brain,
    'heart': Heart,
    'users': Users,
    'target': Target,
    'compass': Compass,
    'star': Star
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching categories:', error);
        // Show fallback categories
        setCategories([
          {
            id: '1',
            name: 'Personality Discovery',
            description: 'Discover your core personality traits and strengths',
            icon: 'brain',
            color: 'from-purple-500 to-pink-500',
            is_active: true
          },
          {
            id: '2',
            name: 'Career Alignment',
            description: 'Find your ideal career path and professional direction',
            icon: 'target',
            color: 'from-blue-500 to-cyan-500',
            is_active: true
          },
          {
            id: '3',
            name: 'Relationship Insights',
            description: 'Understand your relationship patterns and compatibility',
            icon: 'heart',
            color: 'from-pink-500 to-rose-500',
            is_active: true
          }
        ]);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Show fallback categories on error
      setCategories([
        {
          id: '1',
          name: 'Personality Discovery',
          description: 'Discover your core personality traits and strengths',
          icon: 'brain',
          color: 'from-purple-500 to-pink-500',
          is_active: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    // Navigate to mobile assessment with category
    navigate(`/mobile-assessment?category=${categoryId}`);
  };

  const handleOpenAssessmentHub = () => {
    // Navigate to the comprehensive assessment system
    navigate('/mobile-assessment-hub');
  };

  if (showAssessmentHub) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <h1 className="text-4xl font-bold mb-8">Assessment Hub Component Would Load Here</h1>
        <Button onClick={() => setShowAssessmentHub(false)}>
          Back to Categories
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-primary/5">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="relative inline-block mb-6">
            <Sparkles className="absolute -top-2 -left-2 w-6 h-6 text-primary/60 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Discover Your True Self
            </h1>
            <Sparkles className="absolute -bottom-2 -right-2 w-6 h-6 text-secondary/60 animate-pulse delay-300" />
          </div>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Embark on a transformative journey of self-discovery through our comprehensive assessment system. 
            Unlock insights about your personality, strengths, and path to personal growth.
          </p>
        </motion.div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Assessment Categories
          </h2>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-lg mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => {
                const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Brain;
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card 
                      className="glass-card group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-0 backdrop-blur-md"
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <CardHeader className="space-y-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} p-3 group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="w-full h-full text-white" />
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                          {category.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          {category.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="glass">
                            Interactive
                          </Badge>
                          <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready for Deep Insights?</h3>
            <p className="text-muted-foreground mb-6">
              Access our comprehensive assessment platform for detailed analysis and personalized recommendations.
            </p>
            <Button 
              onClick={handleOpenAssessmentHub}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-3 text-lg font-semibold group"
            >
              Open Assessment Hub
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SimpleAssessmentLanding;
