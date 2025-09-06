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
  const [showAssessmentHub, setShowAssessmentHub] = useState(false);
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Background */}
        <div 
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: 'url(/hero-meditation.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Deep Purple Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-violet-900/90 to-indigo-900/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-purple-900/30 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        <div className="min-h-screen flex items-center justify-center p-8 relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-8 text-white">Assessment Hub Component Would Load Here</h1>
            <Button 
              onClick={() => setShowAssessmentHub(false)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              Back to Categories
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background - Matching Other Pages */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/hero-meditation.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Deep Purple Glassmorphism Overlay - Exact Match */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-violet-900/90 to-indigo-900/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-purple-900/30 to-transparent" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Subtle Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-white/20 animate-pulse opacity-40" />
        <div className="absolute top-[25%] right-[15%] w-1 h-1 rounded-full bg-purple-300/30 animate-pulse delay-1000 opacity-30" />
        <div className="absolute bottom-[35%] left-[20%] w-1.5 h-1.5 rounded-full bg-white/15 animate-pulse delay-2000 opacity-25" />
        <div className="absolute top-[60%] right-[10%] w-1 h-1 rounded-full bg-purple-300/25 animate-pulse delay-500 opacity-20" />
        <div className="absolute bottom-[20%] left-[30%] w-2 h-2 rounded-full bg-white/10 animate-pulse delay-3000 opacity-15" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="relative inline-block mb-6">
            <Sparkles className="absolute -top-2 -left-2 w-6 h-6 text-purple-300 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Discover Your True Self
            </h1>
            <Sparkles className="absolute -bottom-2 -right-2 w-6 h-6 text-pink-300 animate-pulse delay-300" />
          </div>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Embark on a transformative journey of self-discovery through our comprehensive assessment system. 
            Unlock insights about your personality, strengths, and path to personal growth.
          </p>
        </motion.div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">
            Assessment Categories
          </h2>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 animate-pulse">
                  <div className="w-12 h-12 bg-white/20 rounded-lg mb-4"></div>
                  <div className="h-6 bg-white/20 rounded mb-2"></div>
                  <div className="h-4 bg-white/20 rounded"></div>
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
                      className="bg-white/10 backdrop-blur-md border border-white/20 group cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-white/15 hover:border-white/30 rounded-2xl"
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <CardHeader className="space-y-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} p-3 group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="w-full h-full text-white" />
                        </div>
                        <CardTitle className="text-xl text-white group-hover:text-purple-300 transition-colors duration-300">
                          {category.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-white/70 mb-4 leading-relaxed">
                          {category.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-white/20 text-white/90">
                            Interactive
                          </Badge>
                          <ArrowRight className="w-5 h-5 text-purple-300 group-hover:translate-x-1 transition-transform duration-300" />
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
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-white">Ready for Deep Insights?</h3>
            <p className="text-white/70 mb-6">
              Access our comprehensive assessment platform for detailed analysis and personalized recommendations.
            </p>
            <Button 
              onClick={handleOpenAssessmentHub}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg font-semibold group"
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
