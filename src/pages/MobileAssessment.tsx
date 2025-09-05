import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import RealAssessmentService from '@/services/realAssessmentService';
import { Assessment } from '@/types/assessment';
import LocalAssessmentTaker from '@/components/assessment/LocalAssessmentTaker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const MobileAssessment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!id) {
        setError('Assessment ID is required');
        setLoading(false);
        return;
      }

      try {
        const assessmentData = await RealAssessmentService.getAssessmentById(id);
        setAssessment(assessmentData);
      } catch (err) {
        setError('Failed to load assessment');
        console.error('Error loading assessment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id]);

  const handleComplete = async (results: { answers: Record<string, string | number | string[]>; score?: number; category?: string; }) => {
    console.log('Assessment completed:', results);
    // Could implement results saving or navigation here
  };

  const handleBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-white">Loading assessment...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Assessment Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-white/70 mb-4">
              {error || 'The requested assessment could not be found.'}
            </p>
            <Button onClick={handleBack} variant="outline" className="flex items-center space-x-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <LocalAssessmentTaker
        assessment={assessment}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    </div>
  );
};

export default MobileAssessment;
