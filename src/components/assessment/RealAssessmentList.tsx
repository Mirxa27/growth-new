/**
 * Real Assessment List Component
 * Fetches assessments from database instead of using mock data
 */

'use client';

import { useState, useEffect } from 'react';
import { Clock, Users, Star, ChevronRight } from 'lucide-react';
import RealAssessmentService from '@/services/realAssessmentService';
import { Assessment } from '@/types/assessment';
import { ASSESSMENT_CATEGORIES } from '@/constants/assessment';

interface AssessmentListProps {
  category?: string;
  onSelectAssessment?: (assessment: Assessment) => void;
}

export default function RealAssessmentList({ 
  category, 
  onSelectAssessment 
}: AssessmentListProps): JSX.Element {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load assessments from database
  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setIsLoading(true);
        const data = await RealAssessmentService.getPublicAssessments();
        
        // Filter by category if specified
        const filteredData = category 
          ? data.filter(assessment => assessment.category === category)
          : data;
        
        setAssessments(filteredData);
        setError(null);
      } catch (err) {
        console.error('Error loading assessments:', err);
        setError('Failed to load assessments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessments();
  }, [category]);

  // Handle assessment selection
  const handleAssessmentClick = (assessment: Assessment) => {
    if (onSelectAssessment) {
      onSelectAssessment(assessment);
    } else {
      // Default navigation - replace with actual router when integrated
      console.log('Navigate to assessment:', assessment.id);
      if (typeof window !== 'undefined') {
        window.location.href = `/assessments/${assessment.id}`;
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-600 text-center">
          <p className="font-medium">Error Loading Assessments</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (assessments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📝</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          {category ? `No ${category} assessments available` : 'No assessments available'}
        </h3>
        <p className="text-gray-600">
          Check back later for new assessments or try a different category.
        </p>
      </div>
    );
  }

  // Assessment list
  return (
    <div className="space-y-4">
      {assessments.map((assessment) => (
        <AssessmentCard
          key={assessment.id}
          assessment={assessment}
          onClick={() => handleAssessmentClick(assessment)}
        />
      ))}
    </div>
  );
}

// Individual assessment card component
function AssessmentCard({ 
  assessment, 
  onClick 
}: { 
  assessment: Assessment; 
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {assessment.type}
            </span>
          </div>
          
          <p className="text-gray-600 mb-4">{assessment.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{assessment.estimatedTime} min</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{assessment.questions.length} questions</span>
            </div>
            
            {assessment.difficulty && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span className="capitalize">{assessment.difficulty}</span>
              </div>
            )}
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}

// Category filter component
export function CategoryFilter({ 
  selectedCategory, 
  onCategoryChange 
}: { 
  selectedCategory?: string; 
  onCategoryChange: (category?: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onCategoryChange(undefined)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          !selectedCategory
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All Categories
      </button>
      
      {ASSESSMENT_CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === category.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="mr-1">{category.icon}</span>
          {category.name}
        </button>
      ))}
    </div>
  );
}
