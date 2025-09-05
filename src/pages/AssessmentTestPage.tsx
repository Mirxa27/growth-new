import React from 'react';
import RealAssessmentList from '@/components/assessment/RealAssessmentList';

const AssessmentTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Assessment System Test
        </h1>
        <RealAssessmentList />
      </div>
    </div>
  );
};

export default AssessmentTestPage;
