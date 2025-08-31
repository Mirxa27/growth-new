import { MinimalPlaceholder } from '../admin/MinimalPlaceholder';

interface AssessmentBrowserProps {
  onAssessmentSelect?: (assessment: any) => void;
}

export const AssessmentBrowser: React.FC<AssessmentBrowserProps> = () => {
  return <MinimalPlaceholder />;
};

export default AssessmentBrowser;