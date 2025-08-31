import { useState, useCallback } from 'react';

export const useAssessment = (totalQuestions: number) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const nextQuestion = useCallback(() => {
    setCurrentQuestion((prev) => Math.min(prev + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const prevQuestion = useCallback(() => {
    setCurrentQuestion((prev) => Math.max(prev - 1, 0));
  }, []);

  const setAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const reset = useCallback(() => {
    setCurrentQuestion(0);
    setAnswers({});
  }, []);

  return {
    currentQuestion,
    answers,
    nextQuestion,
    prevQuestion,
    setAnswer,
    reset,
  };
};