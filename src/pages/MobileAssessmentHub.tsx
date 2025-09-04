import React from 'react';
import { MobileAssessmentCard } from '@/components/assessments/MobileAssessmentCard';
import { freeAssessments } from '@/data/freeAssessments';

const MobileAssessmentHub: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Assessments</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {freeAssessments.map((assessment) => (
          <MobileAssessmentCard key={assessment.id} assessment={assessment} isPublic />
        ))}
      </div>
    </div>
  );
};

export default MobileAssessmentHub;