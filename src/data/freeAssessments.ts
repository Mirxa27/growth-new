/*
  Free Assessments Data
  This file exports an array of free assessments available to visitors.
  Each assessment contains an id, title, description, and a list of questions.
  Each question includes the question text and an array of possible options.

  There are 6 assessments provided, each with 10-15 questions.
*/

export interface Question {
  question: string;
  options: string[];
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export const freeAssessments: Assessment[] = [
  {
    id: 'free-1',
    title: 'Emotional Intelligence Quiz',
    description: 'Discover your ability to perceive, control, and evaluate emotions.',
    questions: [
      { question: 'How well do you recognize your own emotions?', options: ['Very well', 'Somewhat well', 'Rarely', 'Not at all'] },
      { question: 'How comfortable are you with expressing your feelings?', options: ['Very comfortable', 'Somewhat comfortable', 'Neutral', 'Uncomfortable'] },
      { question: 'How often do you find it easy to understand others’ emotions?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'How do you rate your ability to manage stress?', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      { question: 'How empathetic do you consider yourself?', options: ['Highly empathetic', 'Moderately empathetic', 'Somewhat empathetic', 'Not empathetic'] },
      { question: 'How do you respond when someone is upset?', options: ['Offer immediate support', 'Wait to see if they improve', 'Avoid the situation', 'Become anxious'] },
      { question: 'How well do you balance work and personal life?', options: ['Very balanced', 'Somewhat balanced', 'Rarely balanced', 'Never balanced'] },
      { question: 'How do you handle criticism?', options: ['Use it for growth', 'Take it personally', 'Ignore it', 'Become defensive'] },
      { question: 'How often do you reflect on your emotional well-being?', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
      { question: 'How aware are you of nonverbal cues in conversations?', options: ['Very aware', 'Somewhat aware', 'Not very aware', 'Not aware at all'] }
    ]
  },
  {
    id: 'free-2',
    title: 'Stress Management Assessment',
    description: 'Evaluate your stress triggers and your ability to manage stress effectively.',
    questions: [
      { question: 'How frequently do you feel overwhelmed?', options: ['Almost always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'How effectively do you respond to stressful situations?', options: ['Very effectively', 'Somewhat effectively', 'Not very effectively', 'Not at all'] },
      { question: 'How often do you use relaxation techniques?', options: ['Frequently', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'How well do you identify your stress triggers?', options: ['Very well', 'Well', 'Somewhat', 'Not at all'] },
      { question: 'How comfortable are you with asking for help?', options: ['Very comfortable', 'Somewhat comfortable', 'Neutral', 'Uncomfortable'] },
      { question: 'How often do you take breaks during intense work periods?', options: ['Regularly', 'Sometimes', 'Rarely', 'Never'] },
      { question: 'How do you rate your work-life balance?', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      { question: 'How often do you practice physical exercise to manage stress?', options: ['Daily', 'Few times a week', 'Occasionally', 'Never'] },
      { question: 'How regularly do you engage in mindfulness or meditation?', options: ['Regularly', 'Sometimes', 'Rarely', 'Never'] },
      { question: 'How would you rate your overall stress level?', options: ['High', 'Moderate', 'Low', 'Very low'] }
    ]
  },
  {
    id: 'free-3',
    title: 'Leadership Style Quiz',
    description: 'Identify your natural leadership style and strengths.',
    questions: [
      { question: 'How comfortable are you taking charge in group situations?', options: ['Very comfortable', 'Comfortable', 'Reluctant', 'Avoidant'] },
      { question: 'How do you approach decision-making?', options: ['Decisively and quickly', 'After thorough analysis', 'With significant deliberation', 'I often defer to others'] },
      { question: 'How do you motivate team members?', options: ['Inspirational speeches', 'Mentoring', 'Delegation', 'Hands-off approach'] },
      { question: 'How do you handle conflicts within a team?', options: ['Direct confrontation', 'Mediation', 'Avoidance', 'Seek compromise'] },
      { question: 'How do you view team success?', options: ['Personal achievement', 'Collective success', 'Balanced view', 'Unclear'] },
      { question: 'How do you prefer to set goals?', options: ['Clear targets', 'Flexible objectives', 'Collaboratively', 'Individually'] },
      { question: 'How innovative are you in solving problems?', options: ['Highly innovative', 'Moderately innovative', 'Conventional', 'Resistant to change'] },
      { question: 'How do you describe your communication style?', options: ['Assertive', 'Empathetic', 'Reserved', 'Indirect'] },
      { question: 'How do you handle pressure and responsibility?', options: ['Thrive under pressure', 'Manage well', 'Struggle sometimes', 'Often overwhelmed'] },
      { question: 'How do you envision your ideal team dynamic?', options: ['Collaborative', 'Hierarchical', 'Flat structure', 'Autonomous individuals'] }
    ]
  },
  {
    id: 'free-4',
    title: 'Self-Care Impact Assessment',
    description: 'Assess how well you incorporate self-care practices into your daily life.',
    questions: [
      { question: 'How often do you set aside time for self-care?', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
      { question: 'How important is self-care to you?', options: ['Extremely important', 'Important', 'Somewhat important', 'Not important'] },
      { question: 'How do you usually unwind after a long day?', options: ['Exercise', 'Meditation', 'Entertainment', 'Sleep'] },
      { question: 'How regularly do you get adequate sleep?', options: ['Always', 'Usually', 'Sometimes', 'Rarely'] },
      { question: 'How conscious are you about your nutritional intake?', options: ['Very conscious', 'Somewhat conscious', 'Not very conscious', 'Not at all'] },
      { question: 'How often do you disconnect from digital devices?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'How do you manage your work-life boundaries?', options: ['Very well', 'Moderately well', 'Poorly', 'Not at all'] },
      { question: 'How often do you engage in activities purely for enjoyment?', options: ['Frequently', 'Sometimes', 'Rarely', 'Never'] },
      { question: 'How effective are your methods of stress relief?', options: ['Highly effective', 'Effective', 'Somewhat effective', 'Ineffective'] },
      { question: 'How do you rate your overall self-care routine?', options: ['Excellent', 'Good', 'Fair', 'Poor'] }
    ]
  },
  {
    id: 'free-5',
    title: 'Creativity Insight Assessment',
    description: 'Explore your creative potential and how you approach problem-solving in innovative ways.',
    questions: [
      { question: 'How often do you engage in creative activities?', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
      { question: 'How do you solve problems at work or school?', options: ['In innovative ways', 'Following standard procedures', 'Combined approach', 'I rely on others'] },
      { question: 'How open are you to trying new methods?', options: ['Very open', 'Open', 'Somewhat reserved', 'Not open'] },
      { question: 'How do you rate your ability to think outside the box?', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      { question: 'How often do you brainstorm new ideas?', options: ['Frequently', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'How do you manage creative blocks?', options: ['Seek inspiration', 'Take a break', 'Push through', 'Avoid creative tasks'] },
      { question: 'How important is creativity in your personal growth?', options: ['Essential', 'Important', 'Moderately important', 'Not important'] },
      { question: 'How do you react to unconventional ideas?', options: ['Embrace them', 'Consider them', 'Critique them', 'Dismiss them'] },
      { question: 'How often do you collaborate on creative projects?', options: ['Regularly', 'Sometimes', 'Rarely', 'Never'] },
      { question: 'How do you feel about structured vs free-flow thinking?', options: ['Prefer free-flow', 'Balanced', 'Prefer structure', 'Indifferent'] }
    ]
  },
  {
    id: 'free-6',
    title: 'Relationship Dynamics Quiz',
    description: 'Understand the dynamics of your interpersonal relationships and how you interact with others.',
    questions: [
      { question: 'How do you typically resolve conflicts?', options: ['Open discussion', 'Avoidance', 'Compromise', 'Assertiveness'] },
      { question: 'How do you feel when sharing personal experiences?', options: ['Comfortable', 'Somewhat comfortable', 'Reserved', 'Uncomfortable'] },
      { question: 'How often do you reflect on your relationships?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'How do you manage differing opinions in a conversation?', options: ['Calm negotiation', 'Defensive stance', 'Agree to disagree', 'Withdraw'] },
      { question: 'How do you express affection to close ones?', options: ['Openly and frequently', 'Sometimes', 'Rarely', 'Not at all'] },
      { question: 'How sensitive are you to criticism from loved ones?', options: ['Very sensitive', 'Somewhat sensitive', 'Neutral', 'Not sensitive'] },
      { question: 'How do you make decisions in group settings?', options: ['Collaboratively', 'Independently', 'Support others', 'Follow majority'] },
      { question: 'How do you handle misunderstandings in relationships?', options: ['Address immediately', 'Wait for calm', 'Avoid conflict', 'Seek advice'] },
      { question: 'How important is effective communication in your relationships?', options: ['Critical', 'Important', 'Somewhat important', 'Not important'] },
      { question: 'How do you perceive emotional vulnerability?', options: ['Strength', 'Weakness', 'Neutral', 'Uncertain'] }
    ]
  }
];

// Updated function to calculate the assessment result based on real user responses
export function calculateFreeAssessmentResult(assessmentId: string, answers: number[]): string {
  const assessment = freeAssessments.find(a => a.id === assessmentId);
  if (!assessment) return 'Assessment not found.';
  
  // Calculate the average score from the provided answer indices
  const totalQuestions = assessment.questions.length;
  const sum = answers.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / totalQuestions;

  // Return a result message based on the average score
  if (avg < 1) {
    return 'Excellent! Your performance is exemplary.';
  } else if (avg < 2) {
    return 'Good job! There is potential for further improvement.';
  } else if (avg < 3) {
    return 'Average performance; consider focusing on key development areas.';
  } else {
    return 'Needs improvement; it may help to review foundational concepts.';
  }
}

// Helper function to retrieve a free assessment by its ID
export function getFreeAssessmentById(assessmentId: string) {
  return freeAssessments.find(a => a.id === assessmentId);
}

// Helper function to list titles of all free assessments
export function listFreeAssessmentTitles(): string[] {
  return freeAssessments.map(assessment => assessment.title);
}

// Helper function to get a summary of a free assessment by its ID
export function getFreeAssessmentSummary(assessmentId: string) {
  const assessment = getFreeAssessmentById(assessmentId);
  if (!assessment) return null;
  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    questionCount: assessment.questions.length
  };
}

// Function to validate that the provided answers array matches the number of questions for a free assessment
export function validateFreeAssessmentAnswers(assessmentId: string, answers: number[]): boolean {
  const assessment = getFreeAssessmentById(assessmentId);
  if (!assessment) return false;
  return answers.length === assessment.questions.length;
}

// Function to attempt a free assessment and return the result
export function attemptFreeAssessment(assessmentId: string, answers: number[]): { success: boolean; result?: string; error?: string } {
  if (!validateFreeAssessmentAnswers(assessmentId, answers)) {
    return { success: false, error: "Number of answers does not match the number of questions." };
  }

  const result = calculateFreeAssessmentResult(assessmentId, answers);
  return { success: true, result };
}

// Function to generate a detailed report for a free assessment attempt
export function generateFreeAssessmentReport(assessmentId: string, answers: number[]): { summary?: any; result?: string; suggestion?: string; error?: string } {
  if (!validateFreeAssessmentAnswers(assessmentId, answers)) {
    return { error: "Number of answers does not match the number of questions." };
  }
  
  const summary = getFreeAssessmentSummary(assessmentId);
  const attempt = attemptFreeAssessment(assessmentId, answers);
  if (!attempt.success) {
    return { error: attempt.error };
  }

  // Simple suggestion logic based on average answer score
  // Note: Lower average indicates better performance
  const assessment = getFreeAssessmentById(assessmentId);
  const totalQuestions = assessment ? assessment.questions.length : 0;
  const sum = answers.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / totalQuestions;
  let suggestion = "";
  if (avg < 1) {
    suggestion = "Keep up the great work maintaining your skills!";
  } else if (avg < 2) {
    suggestion = "Good job! Consider exploring advanced techniques to further enhance your abilities.";
  } else if (avg < 3) {
    suggestion = "Fair performance. Reflect on areas of improvement and consider targeted practice.";
  } else {
    suggestion = "Needs improvement. It might be beneficial to review foundational concepts and seek guidance.";
  }

  return { summary, result: attempt.result, suggestion };
}
