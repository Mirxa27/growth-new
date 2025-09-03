import React, { useState, useEffect } from 'react';
import { MobileAssessmentCard } from '@/components/assessments/MobileAssessmentCard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Assessment {
  id: number;
  title: string;
  description: string;
  type: string;
  difficulty?: string;
  category?: string;
  visibility: string;
  created_at: string;
}

const MobileAssessmentHub = () => {
  const [publicAssessments, setPublicAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      // Load public assessments
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublicAssessments(data || []);
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeAssessments = (assessments: Assessment[]) => {
    const categories: Record<string, Assessment[]> = {
      'Personal Growth': [],
      'Emotional Intelligence': [],
      'Relationships': [],
      'Wellness': [],
      'Purpose': [],
      'Confidence': [],
      'All': assessments
    };

    assessments.forEach(assessment => {
      const category = assessment.category || 'Other';
      if (category === 'personal development') {
        categories['Personal Growth'].push(assessment);
      } else if (category === 'emotional intelligence') {
        categories['Emotional Intelligence'].push(assessment);
      } else if (category === 'relationships') {
        categories['Relationships'].push(assessment);
      } else if (category === 'wellness') {
        categories['Wellness'].push(assessment);
      } else if (category === 'purpose') {
        categories['Purpose'].push(assessment);
      } else if (category === 'confidence') {
        categories['Confidence'].push(assessment);
      }
    });

    return categories;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const categorizedAssessments = categorizeAssessments(publicAssessments);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold gradient-text">Free Assessments</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover insights about yourself with our free assessments. No signup required!
          </p>
        </div>

        {/* Assessment Tabs */}
        <Tabs defaultValue="All" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-7 gap-2 h-auto p-1 mb-6">
            {Object.keys(categorizedAssessments).map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="text-xs md:text-sm"
                disabled={category !== 'All' && categorizedAssessments[category].length === 0}
              >
                {category} {category !== 'All' && `(${categorizedAssessments[category].length})`}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(categorizedAssessments).map(([category, assessments]) => (
            <TabsContent key={category} value={category}>
              {assessments.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {assessments.map((assessment) => (
                    <MobileAssessmentCard
                      key={assessment.id}
                      assessment={assessment}
                      isPublic={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No assessments in this category yet.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Info Section */}
        <div className="mt-12 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          <p>
            These assessments are designed to help you gain insights into various aspects of your life.
            For more comprehensive assessments and personalized tracking, consider creating a free account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileAssessmentHub;