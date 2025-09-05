/**
 * DTO Validation Utilities
 * Comprehensive validation for all data transfer objects
 */

export const validateSubmitAssessmentDTO = (params: any) => {
  if (!params.assessmentId || typeof params.assessmentId !== 'string') {
    throw new Error('Assessment ID is required and must be a string');
  }

  if (!params.responses || typeof params.responses !== 'object') {
    throw new Error('Responses are required and must be an object');
  }

  if (params.userId && typeof params.userId !== 'string') {
    throw new Error('User ID must be a string');
  }

  if (params.visitorSessionId && typeof params.visitorSessionId !== 'string') {
    throw new Error('Visitor session ID must be a string');
  }
};

export const validateResponses = (assessment: any, responses: Record<string, any>) => {
  if (!assessment.questions || assessment.questions.length === 0) {
    throw new Error('Assessment has no questions');
  }

  const requiredQuestions = assessment.questions.filter((q: any) => !q.optional);
  const answeredQuestions = Object.keys(responses);

  // Check for missing required questions
  const missingQuestions = requiredQuestions.filter(
    (q: any) => !answeredQuestions.includes(q.id)
  );

  if (missingQuestions.length > 0) {
    throw new Error(
      `Missing responses for questions: ${missingQuestions.map((q: any) => q.id).join(', ')}`
    );
  }

  return true;
};

export const validateQuestionResponse = (question: any, answer: any) => {
  switch (question.type) {
    case 'multiple_choice':
      if (typeof answer !== 'string' || !question.options.some((opt: any) => opt.id === answer)) {
        throw new Error(`Invalid response for question ${question.id}`);
      }
      break;
    case 'scale':
      if (typeof answer !== 'number' || answer < 1 || answer > (question.max || 10)) {
        throw new Error(`Scale response must be between 1 and ${question.max || 10}`);
      }
      break;
    case 'boolean':
      if (typeof answer !== 'boolean') {
        throw new Error(`Boolean response required for question ${question.id}`);
      }
      break;
    case 'text':
      if (typeof answer !== 'string' || answer.trim().length === 0) {
        throw new Error(`Text response required for question ${question.id}`);
      }
      break;
  }
  return true;
};

export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = { ...input };
    Object.keys(sanitized).forEach(key => {
      sanitized[key] = sanitizeInput(sanitized[key]);
    });
    return sanitized;
  }
  
  return input;
};