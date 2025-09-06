import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AssessmentHub from '@/components/assessment/AssessmentHub';
import ComprehensiveAssessmentSystem from '@/components/assessment/ComprehensiveAssessmentSystem';

// Add these routes to your main App.tsx or router configuration

export const AssessmentRoutes = () => {
  return (
    <Routes>
      {/* User-facing assessment interface */}
      <Route path="/assessment" element={<AssessmentHub />} />
      <Route path="/assessment/:id" element={<AssessmentHub />} />
      
      {/* Admin assessment management */}
      <Route path="/admin/assessments" element={<ComprehensiveAssessmentSystem />} />
    </Routes>
  );
};

// Or add directly to your existing routes:
export const AppRoutesExample = () => {
  return (
    <Routes>
      {/* Your existing routes would go here */}
      
      {/* New Assessment Routes */}
      <Route path="/assessment" element={<AssessmentHub />} />
      <Route path="/assessment/:id" element={<AssessmentHub />} />
      
      {/* Admin Routes - add to your existing admin routes */}
      <Route path="/admin/assessments" element={<ComprehensiveAssessmentSystem />} />
    </Routes>
  );
};

// Quick start component for testing
export const QuickAssessmentTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          🧠 Assessment System Test
        </h1>
        
        {/* Assessment Hub */}
        <AssessmentHub />
        
        {/* Admin System (uncomment to test admin features) */}
        {/* <ComprehensiveAssessmentSystem /> */}
      </div>
    </div>
  );
};
