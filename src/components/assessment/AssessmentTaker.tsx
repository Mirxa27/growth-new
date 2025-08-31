import { MinimalPlaceholder } from '../admin/MinimalPlaceholder';

interface AssessmentTakerProps {
  assessment: any;
  onComplete?: (results: any) => void;
  onCancel?: () => void;
}

export const AssessmentTaker: React.FC<AssessmentTakerProps> = () => {
  return <MinimalPlaceholder />;
};

export default AssessmentTaker;