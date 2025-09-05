/**
 * Assessment Demo Page
 * Demonstrates the real assessment system functionality
 * Shows how to replace mock data with actual database integration
 */

'use client';

import { useState } from 'react';
import { CheckCircle, Play } from 'lucide-react';
import RealAssessmentService from '@/services/realAssessmentService';
import RealAssessmentList, { CategoryFilter } from '@/components/assessment/RealAssessmentList';
import RealAssessmentPage from '@/components/assessment/RealAssessmentPage';
import { Assessment } from '@/types/assessment';

export default function AssessmentDemoPage(): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'take' | 'service'>('list');

  // Handle assessment selection
  const handleSelectAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setActiveTab('take');
  };

  // Service demonstration
  const handleServiceDemo = async () => {
    try {
      console.log('🔍 Testing Real Assessment Service...');
      
      // Test fetching public assessments
      const assessments = await RealAssessmentService.getPublicAssessments();
      console.log('✅ Fetched assessments:', assessments);
      
      if (assessments.length > 0) {
        // Test fetching a specific assessment
        const assessment = await RealAssessmentService.getAssessmentById(assessments[0].id);
        console.log('✅ Fetched single assessment:', assessment);
        
        // Test submitting a sample response
        const sampleResponses = {
          '1': 'Initiate conversations with new people',
          '2': 'Logic and objective analysis'
        };
        
        try {
          const result = await RealAssessmentService.submitAssessment({
            assessmentId: assessments[0].id,
            userId: 'demo-user',
            responses: sampleResponses
          });
          console.log('✅ Submitted assessment:', result);
        } catch (submitError) {
          console.log('ℹ️ Submission test (expected to fail without full data):', submitError);
        }
      }
      
    } catch (error) {
      console.error('❌ Service demo error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Real Assessment System Demo</h1>
              <p className="text-gray-600 mt-2">Database-driven assessments with real scoring algorithms</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Real Data Integrated
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Assessment List
            </button>
            <button
              onClick={() => setActiveTab('take')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'take'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Take Assessment
            </button>
            <button
              onClick={() => setActiveTab('service')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'service'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Service Demo
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'list' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Assessment Catalog</h2>
              <p className="text-gray-600 mb-6">
                Browse real assessments from the database. Categories and filtering work with actual data.
              </p>
              
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>

            <RealAssessmentList
              category={selectedCategory}
              onSelectAssessment={handleSelectAssessment}
            />
          </div>
        )}

        {activeTab === 'take' && (
          <div>
            {selectedAssessment ? (
              <RealAssessmentPage />
            ) : (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Select an Assessment to Begin
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose an assessment from the list to see the real assessment taking experience.
                </p>
                <button
                  onClick={() => setActiveTab('list')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Assessments
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'service' && (
          <div>
            <div className="max-w-4xl">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Real Assessment Service</h2>
              <p className="text-gray-600 mb-6">
                Test the assessment service functionality. This demonstrates how the system replaces mock data with real database operations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Database Integration</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Real Supabase database connection
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Assessment, questions, and options tables
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Results storage and retrieval
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Type-safe data transformations
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Scoring System</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Real algorithmic scoring
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Multiple question types support
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Personality type calculation
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Category-based insights
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">API Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Fetch assessments by category
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Get assessment details with questions
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Submit responses with validation
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      User result history
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Error Handling</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Comprehensive error classes
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Graceful fallbacks
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      User-friendly messages
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Detailed logging
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Test the Service</h3>
                <p className="text-gray-600 mb-4">
                  Click the button below to test the assessment service methods. Check the browser console to see the results.
                </p>
                <button
                  onClick={handleServiceDemo}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Run Service Tests
                </button>
              </div>

              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Implementation Status</h3>
                <p className="text-yellow-700 mb-4">
                  The real assessment system is now implemented and ready to replace mock data throughout the application. 
                  Here's what was accomplished:
                </p>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• ✅ Created RealAssessmentService with full database integration</li>
                  <li>• ✅ Implemented real scoring algorithms for different question types</li>
                  <li>• ✅ Built components that use real data instead of mock data</li>
                  <li>• ✅ Added proper TypeScript types and error handling</li>
                  <li>• ✅ Created seeding scripts for sample data</li>
                  <li>• ⚠️ Need to populate database with assessment content</li>
                  <li>• ⚠️ Need to replace mock data imports in existing components</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
