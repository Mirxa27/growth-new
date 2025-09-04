import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { QuestionDisplay } from '@/components/assessments/QuestionDisplay';
import { AssessmentResults } from '@/components/assessments/AssessmentResults';
import { getFreeAssessmentById, calculateFreeAssessmentResult } from '@/data/freeAssessments';

const MobileAssessment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const assessment = getFreeAssessmentById(id!);

  if (!assessment) {
    return <div>Assessment not found</div>;
  }

  const handleAnswerChange = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = parseInt(answer, 10);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setIsCompleted(false);
  };

  if (isCompleted) {
    const result = calculateFreeAssessmentResult(id!, answers);
    return (
      <AssessmentResults
        assessmentTitle={assessment.title}
        score={0} // Replace with actual score calculation
        totalPoints={assessment.questions.length}
        percentage={0} // Replace with actual percentage calculation
        onRetake={handleRetake}
      />
    );
  }

  return (
    <QuestionDisplay
      question={assessment.questions[currentQuestionIndex]}
      currentAnswer={answers[currentQuestionIndex]?.toString() || ''}
      onAnswerChange={handleAnswerChange}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={assessment.questions.length}
      onNext={handleNext}
      onPrevious={handlePrevious}
      isFirst={currentQuestionIndex === 0}
      isLast={currentQuestionIndex === assessment.questions.length - 1}
    />
  );
};

export default MobileAssessment;