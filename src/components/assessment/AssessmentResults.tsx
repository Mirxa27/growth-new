import { MinimalPlaceholder } from '../admin/MinimalPlaceholder';

interface AssessmentResultsProps {
  results: any;
  assessmentTitle: string;
  assessmentCategory: string;
  onRetake?: () => void;
  onNewAssessment?: () => void;
}

export const AssessmentResults: React.FC<AssessmentResultsProps> = () => {
  return <MinimalPlaceholder />;
};

export default AssessmentResults;