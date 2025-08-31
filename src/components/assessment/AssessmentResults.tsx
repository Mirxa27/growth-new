import React from 'react';
import { Button } from '../ui/button';

interface AssessmentResult {
  id?: number;
  score: number;
  submitted_at?: string;
  answers: any;
}

interface AssessmentResultsProps {
  results: AssessmentResult;
  assessmentTitle: string;
  assessmentCategory: string;
  onRetake?: () => void;
  onNewAssessment?: () => void;
}

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({ results, assessmentTitle, assessmentCategory, onRetake, onNewAssessment }) => {
  if (!results) return <div className="glass-card p-4">No results found.</div>;

  return (
    <div className="glass-card p-4">
      <h2 className="text-heading mb-1">Your Results: {assessmentTitle}</h2>
      <p className="text-sm text-muted-foreground mb-4">Category: {assessmentCategory}</p>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-2xl font-bold">Score: {results.score}</div>
        {results.submitted_at && (
          <div className="text-xs text-muted-foreground">{new Date(results.submitted_at).toLocaleString()}</div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        Discover your strengths and spot growth opportunities. Use these insights to guide your next steps.
      </p>

      <div className="mt-2">
        <h3 className="text-display mb-1">Your Answers</h3>
        <pre className="bg-black/10 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(results.answers, null, 2)}</pre>
      </div>

      {(onRetake || onNewAssessment) && (
        <div className="mt-4 flex gap-2">
          {onRetake && <Button onClick={onRetake} variant="outline">Retake</Button>}
          {onNewAssessment && <Button onClick={onNewAssessment}>Try Another</Button>}
        </div>
      )}
    </div>
  );
};

export default AssessmentResults;
