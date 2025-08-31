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
      <h2 className="text-heading mb-2">{assessmentTitle} Results</h2>
      <p className="text-sm text-muted-foreground mb-2">Category: {assessmentCategory}</p>
      <div>Score: {results.score}</div>
      {results.submitted_at && <div>Submitted: {new Date(results.submitted_at).toLocaleString()}</div>}
      <div className="mt-2">
        <h3 className="text-display mb-1">Answers</h3>
        <pre className="bg-black/10 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(results.answers, null, 2)}</pre>
      </div>
      {(onRetake || onNewAssessment) && (
        <div className="mt-4 flex gap-2">
          {onRetake && <Button onClick={onRetake} variant="outline">Retake</Button>}
          {onNewAssessment && <Button onClick={onNewAssessment}>New Assessment</Button>}
        </div>
      )}
    </div>
  );
};

export default AssessmentResults;