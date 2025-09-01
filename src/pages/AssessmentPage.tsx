import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssessmentById } from '../data/assessments';
import { FreeAssessmentTaker } from '@/components/assessment/FreeAssessmentTaker';
import { FreeAssessmentResults } from '@/components/assessment/FreeAssessmentResults';

const AssessmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [results, setResults] = useState<any | null>(null);

  if (!id) {
    navigate('/mobile-assessment-hub');
    return null;
  }

  const assessment = getAssessmentById(id);
  
  if (!assessment) {
    navigate('/mobile-assessment-hub');
    return null;
  }

  const handleBack = () => {
    navigate('/mobile-assessment-hub');
  };

  const handleComplete = (resultData: any) => {
    setResults(resultData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background p-4">
      {!results ? (
        <FreeAssessmentTaker assessment={assessment} onBack={handleBack} onComplete={handleComplete} />
      ) : (
        <FreeAssessmentResults
          results={results}
          assessment={assessment}
          onRetake={() => setResults(null)}
          onNewAssessment={() => navigate('/mobile-assessment-hub')}
        />
      )}
    </div>
  );
};

export default AssessmentPage;
