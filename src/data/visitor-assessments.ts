export interface VisitorAssessment {
  id: string;
  title: string;
  description: string;
  category: 'personality' | 'wellness' | 'career' | 'relationships' | 'mindfulness' | 'growth';
  estimatedTime: number; // in minutes
  questions: VisitorQuestion[];
  resultCategories: ResultCategory[];
  isActive: boolean;
  slug: string;
  tags: string[];
  icon: string;
  color: string;
}

export interface VisitorQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'true_false';
  options?: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  category?: string;
  weight?: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  value: number;
  category?: string;
}

export interface ResultCategory {
  id: string;
  name: string;
  description: string;
  minScore: number;
  maxScore: number;
  recommendations: string[];
  color: string;
}

export const visitorAssessments: VisitorAssessment[] = [
  {
    id: 'personality-insights',
    title: 'Personality Insights Discovery',
    description: 'Discover your unique personality traits and how they influence your daily life, relationships, and career choices.',
    category: 'personality',
    estimatedTime: 8,
    slug: 'personality-insights',
    tags: ['personality', 'self-discovery', 'traits', 'behavior'],
    icon: '🧠',
    color: 'bg-purple-500',
    isActive: true,
    questions: [
      {
        id: 'p1',
        question: 'In social situations, you typically:',
        type: 'multiple_choice',
        options: [
          { id: 'p1a', text: 'Feel energized and seek out conversations', value: 5, category: 'extroversion' },
          { id: 'p1b', text: 'Enjoy talking with a few close friends', value: 3, category: 'extroversion' },
          { id: 'p1c', text: 'Prefer to observe and listen', value: 1, category: 'extroversion' },
          { id: 'p1d', text: 'Feel drained and need alone time afterward', value: 0, category: 'extroversion' }
        ]
      },
      {
        id: 'p2',
        question: 'When making decisions, you rely more on:',
        type: 'multiple_choice',
        options: [
          { id: 'p2a', text: 'Logic and objective analysis', value: 5, category: 'thinking' },
          { id: 'p2b', text: 'A balance of logic and feelings', value: 3, category: 'thinking' },
          { id: 'p2c', text: 'Personal values and emotions', value: 1, category: 'thinking' },
          { id: 'p2d', text: 'Gut instinct and intuition', value: 0, category: 'thinking' }
        ]
      },
      {
        id: 'p3',
        question: 'Your ideal weekend involves:',
        type: 'multiple_choice',
        options: [
          { id: 'p3a', text: 'Spontaneous adventures and new experiences', value: 5, category: 'openness' },
          { id: 'p3b', text: 'A mix of planned activities and free time', value: 3, category: 'openness' },
          { id: 'p3c', text: 'Familiar activities with close friends or family', value: 1, category: 'openness' },
          { id: 'p3d', text: 'Quiet, predictable activities at home', value: 0, category: 'openness' }
        ]
      },
      {
        id: 'p4',
        question: 'How organized are you with your daily tasks?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Very disorganized', max: 'Extremely organized' },
        category: 'conscientiousness'
      },
      {
        id: 'p5',
        question: 'When facing stress, you typically:',
        type: 'multiple_choice',
        options: [
          { id: 'p5a', text: 'Stay calm and think through solutions', value: 5, category: 'neuroticism' },
          { id: 'p5b', text: 'Feel some anxiety but manage it well', value: 3, category: 'neuroticism' },
          { id: 'p5c', text: 'Get worried and seek support from others', value: 1, category: 'neuroticism' },
          { id: 'p5d', text: 'Feel overwhelmed and struggle to cope', value: 0, category: 'neuroticism' }
        ]
      },
      {
        id: 'p6',
        question: 'You prefer to work:',
        type: 'multiple_choice',
        options: [
          { id: 'p6a', text: 'In a team with lots of collaboration', value: 5, category: 'extroversion' },
          { id: 'p6b', text: 'With a small, close-knit group', value: 3, category: 'extroversion' },
          { id: 'p6c', text: 'Independently with occasional check-ins', value: 1, category: 'extroversion' },
          { id: 'p6d', text: 'Completely alone and self-directed', value: 0, category: 'extroversion' }
        ]
      },
      {
        id: 'p7',
        question: 'How important is it for you to help others?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Not important', max: 'Extremely important' },
        category: 'agreeableness'
      },
      {
        id: 'p8',
        question: 'When learning something new, you prefer:',
        type: 'multiple_choice',
        options: [
          { id: 'p8a', text: 'Hands-on experimentation and trial', value: 5, category: 'openness' },
          { id: 'p8b', text: 'A combination of theory and practice', value: 3, category: 'openness' },
          { id: 'p8c', text: 'Structured lessons and clear instructions', value: 1, category: 'openness' },
          { id: 'p8d', text: 'Traditional methods and proven approaches', value: 0, category: 'openness' }
        ]
      },
      {
        id: 'p9',
        question: 'Your friends would describe you as:',
        type: 'multiple_choice',
        options: [
          { id: 'p9a', text: 'The life of the party', value: 5, category: 'extroversion' },
          { id: 'p9b', text: 'Friendly and approachable', value: 3, category: 'extroversion' },
          { id: 'p9c', text: 'Thoughtful and reserved', value: 1, category: 'extroversion' },
          { id: 'p9d', text: 'Quiet and introspective', value: 0, category: 'extroversion' }
        ]
      },
      {
        id: 'p10',
        question: 'How do you handle deadlines?',
        type: 'multiple_choice',
        options: [
          { id: 'p10a', text: 'Complete tasks well in advance', value: 5, category: 'conscientiousness' },
          { id: 'p10b', text: 'Finish on time with good planning', value: 3, category: 'conscientiousness' },
          { id: 'p10c', text: 'Usually meet deadlines with some rushing', value: 1, category: 'conscientiousness' },
          { id: 'p10d', text: 'Often struggle to meet deadlines', value: 0, category: 'conscientiousness' }
        ]
      },
      {
        id: 'p11',
        question: 'In conflicts, you tend to:',
        type: 'multiple_choice',
        options: [
          { id: 'p11a', text: 'Seek compromise and understanding', value: 5, category: 'agreeableness' },
          { id: 'p11b', text: 'Try to find a fair solution', value: 3, category: 'agreeableness' },
          { id: 'p11c', text: 'Stand firm on your position', value: 1, category: 'agreeableness' },
          { id: 'p11d', text: 'Avoid conflict altogether', value: 0, category: 'agreeableness' }
        ]
      },
      {
        id: 'p12',
        question: 'How comfortable are you with change?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Very uncomfortable', max: 'Love change' },
        category: 'openness'
      }
    ],
    resultCategories: [
      {
        id: 'extroverted-leader',
        name: 'Extroverted Leader',
        description: 'You thrive in social situations and naturally take charge. You energize others and excel in collaborative environments.',
        minScore: 35,
        maxScore: 50,
        color: 'bg-red-500',
        recommendations: [
          'Consider leadership roles in your career',
          'Join networking groups and professional organizations',
          'Practice active listening to balance your natural speaking tendency',
          'Seek out team-based projects and collaborative opportunities'
        ]
      },
      {
        id: 'balanced-collaborator',
        name: 'Balanced Collaborator',
        description: 'You have a healthy balance of social and independent tendencies. You work well both in teams and alone.',
        minScore: 25,
        maxScore: 34,
        color: 'bg-blue-500',
        recommendations: [
          'Leverage your adaptability in various work environments',
          'Develop both leadership and followership skills',
          'Practice switching between collaborative and independent work modes',
          'Consider roles that offer variety in social interaction levels'
        ]
      },
      {
        id: 'thoughtful-analyst',
        name: 'Thoughtful Analyst',
        description: 'You prefer deeper, meaningful interactions and excel at independent work. You bring careful consideration to decisions.',
        minScore: 15,
        maxScore: 24,
        color: 'bg-green-500',
        recommendations: [
          'Seek roles that allow for deep focus and analysis',
          'Build a small network of meaningful professional relationships',
          'Practice speaking up in meetings to share your valuable insights',
          'Consider mentoring others who can benefit from your thoughtful approach'
        ]
      },
      {
        id: 'independent-thinker',
        name: 'Independent Thinker',
        description: 'You work best independently and bring unique perspectives. You value autonomy and deep thinking.',
        minScore: 0,
        maxScore: 14,
        color: 'bg-purple-500',
        recommendations: [
          'Seek autonomous work environments and remote opportunities',
          'Develop your unique expertise in specialized areas',
          'Practice communicating your ideas clearly to others',
          'Consider consulting or freelance opportunities that leverage your independence'
        ]
      }
    ]
  },

  {
    id: 'wellness-assessment',
    title: 'Holistic Wellness Check',
    description: 'Evaluate your overall well-being across physical, mental, emotional, and social dimensions to identify areas for improvement.',
    category: 'wellness',
    estimatedTime: 10,
    slug: 'wellness-check',
    tags: ['wellness', 'health', 'balance', 'lifestyle'],
    icon: '🌱',
    color: 'bg-green-500',
    isActive: true,
    questions: [
      {
        id: 'w1',
        question: 'How would you rate your current energy levels?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Always exhausted', max: 'Full of energy' },
        category: 'physical'
      },
      {
        id: 'w2',
        question: 'How many hours of quality sleep do you get per night on average?',
        type: 'multiple_choice',
        options: [
          { id: 'w2a', text: '8+ hours consistently', value: 5, category: 'physical' },
          { id: 'w2b', text: '7-8 hours most nights', value: 4, category: 'physical' },
          { id: 'w2c', text: '6-7 hours regularly', value: 2, category: 'physical' },
          { id: 'w2d', text: 'Less than 6 hours', value: 0, category: 'physical' }
        ]
      },
      {
        id: 'w3',
        question: 'How often do you engage in physical exercise?',
        type: 'multiple_choice',
        options: [
          { id: 'w3a', text: 'Daily or almost daily', value: 5, category: 'physical' },
          { id: 'w3b', text: '4-5 times per week', value: 4, category: 'physical' },
          { id: 'w3c', text: '2-3 times per week', value: 3, category: 'physical' },
          { id: 'w3d', text: 'Once a week or less', value: 1, category: 'physical' }
        ]
      },
      {
        id: 'w4',
        question: 'How would you describe your current stress levels?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Very low stress', max: 'Extremely stressed' },
        category: 'mental'
      },
      {
        id: 'w5',
        question: 'How often do you practice mindfulness or relaxation techniques?',
        type: 'multiple_choice',
        options: [
          { id: 'w5a', text: 'Daily meditation or mindfulness practice', value: 5, category: 'mental' },
          { id: 'w5b', text: 'Several times per week', value: 4, category: 'mental' },
          { id: 'w5c', text: 'Occasionally when stressed', value: 2, category: 'mental' },
          { id: 'w5d', text: 'Rarely or never', value: 0, category: 'mental' }
        ]
      },
      {
        id: 'w6',
        question: 'How satisfied are you with your current relationships?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Very unsatisfied', max: 'Completely satisfied' },
        category: 'social'
      },
      {
        id: 'w7',
        question: 'How often do you spend quality time with friends or family?',
        type: 'multiple_choice',
        options: [
          { id: 'w7a', text: 'Multiple times per week', value: 5, category: 'social' },
          { id: 'w7b', text: 'Once a week regularly', value: 4, category: 'social' },
          { id: 'w7c', text: 'A few times per month', value: 3, category: 'social' },
          { id: 'w7d', text: 'Rarely or only on special occasions', value: 1, category: 'social' }
        ]
      },
      {
        id: 'w8',
        question: 'How often do you feel emotionally balanced and stable?',
        type: 'multiple_choice',
        options: [
          { id: 'w8a', text: 'Almost always', value: 5, category: 'emotional' },
          { id: 'w8b', text: 'Most of the time', value: 4, category: 'emotional' },
          { id: 'w8c', text: 'Sometimes', value: 2, category: 'emotional' },
          { id: 'w8d', text: 'Rarely', value: 0, category: 'emotional' }
        ]
      },
      {
        id: 'w9',
        question: 'How well do you handle difficult emotions?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Very poorly', max: 'Very well' },
        category: 'emotional'
      },
      {
        id: 'w10',
        question: 'How satisfied are you with your work-life balance?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'No balance at all', max: 'Perfect balance' },
        category: 'lifestyle'
      },
      {
        id: 'w11',
        question: 'How often do you engage in activities you truly enjoy?',
        type: 'multiple_choice',
        options: [
          { id: 'w11a', text: 'Daily', value: 5, category: 'lifestyle' },
          { id: 'w11b', text: 'Several times per week', value: 4, category: 'lifestyle' },
          { id: 'w11c', text: 'Once a week', value: 3, category: 'lifestyle' },
          { id: 'w11d', text: 'Rarely', value: 1, category: 'lifestyle' }
        ]
      },
      {
        id: 'w12',
        question: 'How would you rate your overall life satisfaction?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Very dissatisfied', max: 'Completely satisfied' },
        category: 'overall'
      }
    ],
    resultCategories: [
      {
        id: 'thriving',
        name: 'Thriving Wellness',
        description: 'You demonstrate excellent wellness across multiple dimensions. You have strong foundations for continued well-being.',
        minScore: 45,
        maxScore: 60,
        color: 'bg-green-500',
        recommendations: [
          'Maintain your current healthy habits and routines',
          'Consider sharing your wellness strategies with others',
          'Continue to challenge yourself with new wellness goals',
          'Be a wellness role model in your community'
        ]
      },
      {
        id: 'balanced',
        name: 'Balanced Wellness',
        description: 'You maintain good wellness overall with some areas that could benefit from attention and improvement.',
        minScore: 30,
        maxScore: 44,
        color: 'bg-blue-500',
        recommendations: [
          'Identify 1-2 specific areas to focus on improving',
          'Create a structured wellness plan with achievable goals',
          'Consider working with a wellness coach or counselor',
          'Build stronger support systems in areas where you struggle'
        ]
      },
      {
        id: 'developing',
        name: 'Developing Wellness',
        description: 'You have room for significant improvement in your wellness journey. Focus on building sustainable habits.',
        minScore: 15,
        maxScore: 29,
        color: 'bg-yellow-500',
        recommendations: [
          'Start with small, manageable changes in one area',
          'Seek professional support for stress management',
          'Prioritize sleep and basic physical health habits',
          'Build a support network of friends, family, or professionals'
        ]
      },
      {
        id: 'needs-attention',
        name: 'Wellness Needs Attention',
        description: 'Your wellness requires immediate attention and support. Consider reaching out for professional help.',
        minScore: 0,
        maxScore: 14,
        color: 'bg-red-500',
        recommendations: [
          'Consider speaking with a healthcare professional',
          'Prioritize sleep, nutrition, and basic self-care',
          'Seek support from mental health professionals if needed',
          'Start with very small, achievable wellness goals'
        ]
      }
    ]
  },

  {
    id: 'career-direction',
    title: 'Career Direction Compass',
    description: 'Discover your career strengths, interests, and ideal work environment to guide your professional development.',
    category: 'career',
    estimatedTime: 12,
    slug: 'career-compass',
    tags: ['career', 'professional', 'strengths', 'development'],
    icon: '🎯',
    color: 'bg-blue-500',
    isActive: true,
    questions: [
      {
        id: 'c1',
        question: 'What motivates you most in your work?',
        type: 'multiple_choice',
        options: [
          { id: 'c1a', text: 'Solving complex problems and challenges', value: 5, category: 'analytical' },
          { id: 'c1b', text: 'Helping and supporting other people', value: 5, category: 'social' },
          { id: 'c1c', text: 'Creating and building something new', value: 5, category: 'creative' },
          { id: 'c1d', text: 'Leading teams and making strategic decisions', value: 5, category: 'leadership' }
        ]
      },
      {
        id: 'c2',
        question: 'In your ideal work environment, you would:',
        type: 'multiple_choice',
        options: [
          { id: 'c2a', text: 'Work independently with minimal supervision', value: 5, category: 'independent' },
          { id: 'c2b', text: 'Collaborate closely with a small team', value: 5, category: 'collaborative' },
          { id: 'c2c', text: 'Lead and manage larger groups', value: 5, category: 'leadership' },
          { id: 'c2d', text: 'Work with clients and external stakeholders', value: 5, category: 'social' }
        ]
      },
      {
        id: 'c3',
        question: 'Which type of tasks energize you most?',
        type: 'multiple_choice',
        options: [
          { id: 'c3a', text: 'Data analysis and research', value: 5, category: 'analytical' },
          { id: 'c3b', text: 'Creative design and innovation', value: 5, category: 'creative' },
          { id: 'c3c', text: 'Teaching and mentoring others', value: 5, category: 'social' },
          { id: 'c3d', text: 'Planning and organizing projects', value: 5, category: 'organizational' }
        ]
      },
      {
        id: 'c4',
        question: 'How important is work-life balance to you?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Not important', max: 'Extremely important' },
        category: 'lifestyle'
      },
      {
        id: 'c5',
        question: 'What type of recognition do you value most?',
        type: 'multiple_choice',
        options: [
          { id: 'c5a', text: 'Public recognition and awards', value: 5, category: 'recognition' },
          { id: 'c5b', text: 'Financial rewards and bonuses', value: 5, category: 'financial' },
          { id: 'c5c', text: 'Personal satisfaction and achievement', value: 5, category: 'intrinsic' },
          { id: 'c5d', text: 'Positive impact on others', value: 5, category: 'social' }
        ]
      },
      {
        id: 'c6',
        question: 'How do you prefer to learn new skills?',
        type: 'multiple_choice',
        options: [
          { id: 'c6a', text: 'Hands-on experience and trial-and-error', value: 5, category: 'practical' },
          { id: 'c6b', text: 'Formal training and structured courses', value: 5, category: 'structured' },
          { id: 'c6c', text: 'Mentoring and guidance from experts', value: 5, category: 'social' },
          { id: 'c6d', text: 'Self-directed research and study', value: 5, category: 'independent' }
        ]
      },
      {
        id: 'c7',
        question: 'What level of risk are you comfortable with in your career?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Very risk-averse', max: 'High risk-taker' },
        category: 'risk-tolerance'
      },
      {
        id: 'c8',
        question: 'Which work setting appeals to you most?',
        type: 'multiple_choice',
        options: [
          { id: 'c8a', text: 'Corporate office environment', value: 5, category: 'corporate' },
          { id: 'c8b', text: 'Remote or flexible workspace', value: 5, category: 'flexible' },
          { id: 'c8c', text: 'Startup or entrepreneurial environment', value: 5, category: 'entrepreneurial' },
          { id: 'c8d', text: 'Non-profit or mission-driven organization', value: 5, category: 'mission-driven' }
        ]
      },
      {
        id: 'c9',
        question: 'How important is career advancement to you?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Not important', max: 'Extremely important' },
        category: 'advancement'
      },
      {
        id: 'c10',
        question: 'What type of problems do you enjoy solving?',
        type: 'multiple_choice',
        options: [
          { id: 'c10a', text: 'Technical and logical challenges', value: 5, category: 'analytical' },
          { id: 'c10b', text: 'People and relationship issues', value: 5, category: 'social' },
          { id: 'c10c', text: 'Creative and design challenges', value: 5, category: 'creative' },
          { id: 'c10d', text: 'Strategic and business problems', value: 5, category: 'strategic' }
        ]
      },
      {
        id: 'c11',
        question: 'How do you handle workplace pressure?',
        type: 'multiple_choice',
        options: [
          { id: 'c11a', text: 'Thrive under pressure and tight deadlines', value: 5, category: 'high-pressure' },
          { id: 'c11b', text: 'Perform well with moderate pressure', value: 3, category: 'moderate-pressure' },
          { id: 'c11c', text: 'Prefer steady, predictable workloads', value: 1, category: 'low-pressure' },
          { id: 'c11d', text: 'Work best in low-stress environments', value: 0, category: 'low-pressure' }
        ]
      },
      {
        id: 'c12',
        question: 'What aspect of work gives you the most satisfaction?',
        type: 'multiple_choice',
        options: [
          { id: 'c12a', text: 'Completing projects and seeing results', value: 5, category: 'achievement' },
          { id: 'c12b', text: 'Building relationships and networks', value: 5, category: 'social' },
          { id: 'c12c', text: 'Continuous learning and growth', value: 5, category: 'growth' },
          { id: 'c12d', text: 'Having autonomy and independence', value: 5, category: 'autonomy' }
        ]
      },
      {
        id: 'c13',
        question: 'How important is making a positive impact through your work?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Not important', max: 'Extremely important' },
        category: 'impact'
      }
    ],
    resultCategories: [
      {
        id: 'analytical-leader',
        name: 'Analytical Leader',
        description: 'You excel at solving complex problems and leading data-driven initiatives. You thrive in strategic roles that combine analysis with leadership.',
        minScore: 45,
        maxScore: 65,
        color: 'bg-blue-500',
        recommendations: [
          'Consider roles in management consulting or business analysis',
          'Develop leadership skills alongside your analytical strengths',
          'Look for opportunities to lead data-driven projects',
          'Consider advanced degrees in business or analytics'
        ]
      },
      {
        id: 'creative-innovator',
        name: 'Creative Innovator',
        description: 'You bring fresh perspectives and innovative solutions. You work best in environments that value creativity and original thinking.',
        minScore: 35,
        maxScore: 55,
        color: 'bg-purple-500',
        recommendations: [
          'Explore roles in design, marketing, or product development',
          'Build a portfolio showcasing your creative work',
          'Network with other creative professionals',
          'Consider freelance or consulting opportunities for variety'
        ]
      },
      {
        id: 'people-focused-helper',
        name: 'People-Focused Helper',
        description: 'You find fulfillment in helping others and building relationships. You excel in collaborative, service-oriented environments.',
        minScore: 30,
        maxScore: 50,
        color: 'bg-green-500',
        recommendations: [
          'Consider careers in education, healthcare, or human resources',
          'Develop your coaching and mentoring skills',
          'Look for roles with significant interpersonal interaction',
          'Consider non-profit or mission-driven organizations'
        ]
      },
      {
        id: 'independent-specialist',
        name: 'Independent Specialist',
        description: 'You work best with autonomy and deep expertise. You value independence and prefer to be recognized as a subject matter expert.',
        minScore: 25,
        maxScore: 45,
        color: 'bg-orange-500',
        recommendations: [
          'Develop deep expertise in a specialized field',
          'Consider consulting or freelance opportunities',
          'Look for remote work or flexible arrangements',
          'Build your professional reputation through thought leadership'
        ]
      }
    ]
  },

  {
    id: 'relationship-patterns',
    title: 'Relationship Patterns Assessment',
    description: 'Understand your relationship style, communication patterns, and how you connect with others in personal and professional settings.',
    category: 'relationships',
    estimatedTime: 9,
    slug: 'relationship-patterns',
    tags: ['relationships', 'communication', 'attachment', 'social'],
    icon: '💕',
    color: 'bg-pink-500',
    isActive: true,
    questions: [
      {
        id: 'r1',
        question: 'In close relationships, you tend to:',
        type: 'multiple_choice',
        options: [
          { id: 'r1a', text: 'Share openly and expect the same from others', value: 5, category: 'secure' },
          { id: 'r1b', text: 'Take time to open up but value deep connections', value: 3, category: 'secure' },
          { id: 'r1c', text: 'Keep some emotional distance to protect yourself', value: 1, category: 'avoidant' },
          { id: 'r1d', text: 'Worry about being abandoned or rejected', value: 0, category: 'anxious' }
        ]
      },
      {
        id: 'r2',
        question: 'When conflicts arise, you typically:',
        type: 'multiple_choice',
        options: [
          { id: 'r2a', text: 'Address issues directly and seek resolution', value: 5, category: 'direct' },
          { id: 'r2b', text: 'Try to understand all perspectives first', value: 4, category: 'collaborative' },
          { id: 'r2c', text: 'Avoid confrontation when possible', value: 2, category: 'avoidant' },
          { id: 'r2d', text: 'Get emotional and need time to cool down', value: 1, category: 'emotional' }
        ]
      },
      {
        id: 'r3',
        question: 'How do you show care and affection?',
        type: 'multiple_choice',
        options: [
          { id: 'r3a', text: 'Through words of affirmation and praise', value: 5, category: 'words' },
          { id: 'r3b', text: 'By spending quality time together', value: 5, category: 'time' },
          { id: 'r3c', text: 'Through physical touch and closeness', value: 5, category: 'touch' },
          { id: 'r3d', text: 'By doing helpful acts of service', value: 5, category: 'service' }
        ]
      },
      {
        id: 'r4',
        question: 'How comfortable are you with emotional intimacy?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Very uncomfortable', max: 'Very comfortable' },
        category: 'intimacy'
      },
      {
        id: 'r5',
        question: 'In group settings, you usually:',
        type: 'multiple_choice',
        options: [
          { id: 'r5a', text: 'Take a leadership or organizing role', value: 5, category: 'leadership' },
          { id: 'r5b', text: 'Contribute actively to discussions', value: 4, category: 'participative' },
          { id: 'r5c', text: 'Listen more than you speak', value: 2, category: 'observer' },
          { id: 'r5d', text: 'Feel anxious and prefer smaller groups', value: 1, category: 'anxious' }
        ]
      },
      {
        id: 'r6',
        question: 'How do you handle jealousy or insecurity?',
        type: 'multiple_choice',
        options: [
          { id: 'r6a', text: 'Communicate openly about your feelings', value: 5, category: 'secure' },
          { id: 'r6b', text: 'Work through it internally first', value: 3, category: 'self-aware' },
          { id: 'r6c', text: 'Try to ignore or suppress the feelings', value: 1, category: 'avoidant' },
          { id: 'r6d', text: 'Feel overwhelmed and seek reassurance', value: 0, category: 'anxious' }
        ]
      },
      {
        id: 'r7',
        question: 'What do you value most in friendships?',
        type: 'multiple_choice',
        options: [
          { id: 'r7a', text: 'Loyalty and dependability', value: 5, category: 'loyalty' },
          { id: 'r7b', text: 'Fun and shared experiences', value: 5, category: 'fun' },
          { id: 'r7c', text: 'Deep, meaningful conversations', value: 5, category: 'depth' },
          { id: 'r7d', text: 'Mutual support and understanding', value: 5, category: 'support' }
        ]
      },
      {
        id: 'r8',
        question: 'How do you respond to criticism from loved ones?',
        type: 'multiple_choice',
        options: [
          { id: 'r8a', text: 'Listen and consider their perspective', value: 5, category: 'receptive' },
          { id: 'r8b', text: 'Feel hurt but try to understand', value: 3, category: 'sensitive' },
          { id: 'r8c', text: 'Become defensive and push back', value: 1, category: 'defensive' },
          { id: 'r8d', text: 'Withdraw and need space to process', value: 2, category: 'avoidant' }
        ]
      },
      {
        id: 'r9',
        question: 'How important is independence in your relationships?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Prefer togetherness', max: 'Need independence' },
        category: 'independence'
      },
      {
        id: 'r10',
        question: 'When someone you care about is upset, you:',
        type: 'multiple_choice',
        options: [
          { id: 'r10a', text: 'Offer comfort and emotional support', value: 5, category: 'supportive' },
          { id: 'r10b', text: 'Try to help solve their problem', value: 4, category: 'problem-solver' },
          { id: 'r10c', text: 'Give them space until they feel better', value: 2, category: 'space-giver' },
          { id: 'r10d', text: 'Feel uncomfortable and unsure how to help', value: 1, category: 'uncomfortable' }
        ]
      },
      {
        id: 'r11',
        question: 'How do you maintain long-distance relationships?',
        type: 'multiple_choice',
        options: [
          { id: 'r11a', text: 'Regular communication and planned visits', value: 5, category: 'committed' },
          { id: 'r11b', text: 'Occasional contact but trust the relationship', value: 3, category: 'trusting' },
          { id: 'r11c', text: 'Find it difficult and prefer local connections', value: 1, category: 'local-focused' },
          { id: 'r11d', text: 'Struggle with the uncertainty and distance', value: 0, category: 'anxious' }
        ]
      },
      {
        id: 'r12',
        question: 'How do you handle boundaries in relationships?',
        type: 'multiple_choice',
        options: [
          { id: 'r12a', text: 'Set clear boundaries and communicate them', value: 5, category: 'clear-boundaries' },
          { id: 'r12b', text: 'Have boundaries but sometimes compromise them', value: 3, category: 'flexible-boundaries' },
          { id: 'r12c', text: 'Struggle to set or maintain boundaries', value: 1, category: 'weak-boundaries' },
          { id: 'r12d', text: 'Prefer very few boundaries with close people', value: 2, category: 'open-boundaries' }
        ]
      }
    ],
    resultCategories: [
      {
        id: 'secure-connector',
        name: 'Secure Connector',
        description: 'You form healthy, balanced relationships with good communication and emotional regulation. You\'re comfortable with both intimacy and independence.',
        minScore: 40,
        maxScore: 60,
        color: 'bg-green-500',
        recommendations: [
          'Continue modeling healthy relationship behaviors for others',
          'Consider mentoring others in relationship skills',
          'Maintain your balance of closeness and independence',
          'Keep developing your emotional intelligence and communication skills'
        ]
      },
      {
        id: 'caring-supporter',
        name: 'Caring Supporter',
        description: 'You prioritize others\' needs and excel at providing emotional support. You may sometimes neglect your own needs in relationships.',
        minScore: 30,
        maxScore: 45,
        color: 'bg-blue-500',
        recommendations: [
          'Practice setting healthy boundaries with others',
          'Make sure to prioritize your own emotional needs',
          'Learn to ask for support when you need it',
          'Balance giving with receiving in your relationships'
        ]
      },
      {
        id: 'independent-protector',
        name: 'Independent Protector',
        description: 'You value autonomy and may keep emotional distance to protect yourself. You prefer self-reliance but may miss deeper connections.',
        minScore: 20,
        maxScore: 35,
        color: 'bg-yellow-500',
        recommendations: [
          'Practice gradually opening up to trusted people',
          'Work on expressing your emotions more openly',
          'Challenge yourself to accept help and support from others',
          'Consider counseling to explore past relationship patterns'
        ]
      },
      {
        id: 'anxious-seeker',
        name: 'Anxious Seeker',
        description: 'You deeply value relationships but may worry about abandonment or rejection. You benefit from reassurance and clear communication.',
        minScore: 0,
        maxScore: 25,
        color: 'bg-red-500',
        recommendations: [
          'Practice self-soothing and emotional regulation techniques',
          'Work on building self-confidence and self-worth',
          'Communicate your needs clearly rather than expecting others to guess',
          'Consider therapy to address underlying attachment concerns'
        ]
      }
    ]
  },

  {
    id: 'mindfulness-awareness',
    title: 'Mindfulness & Awareness Assessment',
    description: 'Evaluate your present-moment awareness, emotional regulation, and mindful living practices to enhance your mental well-being.',
    category: 'mindfulness',
    estimatedTime: 8,
    slug: 'mindfulness-awareness',
    tags: ['mindfulness', 'awareness', 'meditation', 'presence'],
    icon: '🧘',
    color: 'bg-indigo-500',
    isActive: true,
    questions: [
      {
        id: 'm1',
        question: 'How often do you notice when your mind is wandering?',
        type: 'multiple_choice',
        options: [
          { id: 'm1a', text: 'Very frequently throughout the day', value: 5, category: 'awareness' },
          { id: 'm1b', text: 'Several times a day', value: 4, category: 'awareness' },
          { id: 'm1c', text: 'Occasionally', value: 2, category: 'awareness' },
          { id: 'm1d', text: 'Rarely or never', value: 0, category: 'awareness' }
        ]
      },
      {
        id: 'm2',
        question: 'When eating, how present are you with the experience?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Always distracted', max: 'Fully present' },
        category: 'presence'
      },
      {
        id: 'm3',
        question: 'How do you typically respond to stressful situations?',
        type: 'multiple_choice',
        options: [
          { id: 'm3a', text: 'Pause, breathe, and respond thoughtfully', value: 5, category: 'regulation' },
          { id: 'm3b', text: 'Notice the stress and try to stay calm', value: 4, category: 'regulation' },
          { id: 'm3c', text: 'React immediately based on emotions', value: 1, category: 'regulation' },
          { id: 'm3d', text: 'Feel overwhelmed and struggle to cope', value: 0, category: 'regulation' }
        ]
      },
      {
        id: 'm4',
        question: 'How often do you practice formal meditation?',
        type: 'multiple_choice',
        options: [
          { id: 'm4a', text: 'Daily practice of 20+ minutes', value: 5, category: 'practice' },
          { id: 'm4b', text: 'Several times a week', value: 4, category: 'practice' },
          { id: 'm4c', text: 'Occasionally or when stressed', value: 2, category: 'practice' },
          { id: 'm4d', text: 'Never or very rarely', value: 0, category: 'practice' }
        ]
      },
      {
        id: 'm5',
        question: 'When walking, how aware are you of your surroundings?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Lost in thoughts', max: 'Fully aware' },
        category: 'awareness'
      },
      {
        id: 'm6',
        question: 'How do you handle difficult emotions?',
        type: 'multiple_choice',
        options: [
          { id: 'm6a', text: 'Observe them without judgment and let them pass', value: 5, category: 'acceptance' },
          { id: 'm6b', text: 'Acknowledge them and try to understand them', value: 4, category: 'acceptance' },
          { id: 'm6c', text: 'Try to distract myself or push them away', value: 1, category: 'acceptance' },
          { id: 'm6d', text: 'Get caught up in them and feel overwhelmed', value: 0, category: 'acceptance' }
        ]
      },
      {
        id: 'm7',
        question: 'How often do you multitask during daily activities?',
        type: 'multiple_choice',
        options: [
          { id: 'm7a', text: 'Rarely - I focus on one thing at a time', value: 5, category: 'focus' },
          { id: 'm7b', text: 'Sometimes, but I try to stay focused', value: 3, category: 'focus' },
          { id: 'm7c', text: 'Often - I like to be efficient', value: 1, category: 'focus' },
          { id: 'm7d', text: 'Constantly - I\'m always juggling multiple things', value: 0, category: 'focus' }
        ]
      },
      {
        id: 'm8',
        question: 'When someone is speaking to you, how present are you?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Often distracted', max: 'Completely present' },
        category: 'presence'
      },
      {
        id: 'm9',
        question: 'How aware are you of your breathing throughout the day?',
        type: 'multiple_choice',
        options: [
          { id: 'm9a', text: 'Very aware - I often notice and use my breath', value: 5, category: 'body-awareness' },
          { id: 'm9b', text: 'Somewhat aware - I notice it sometimes', value: 3, category: 'body-awareness' },
          { id: 'm9c', text: 'Rarely aware unless I think about it', value: 1, category: 'body-awareness' },
          { id: 'm9d', text: 'Never really notice my breathing', value: 0, category: 'body-awareness' }
        ]
      },
      {
        id: 'm10',
        question: 'How do you handle repetitive or boring tasks?',
        type: 'multiple_choice',
        options: [
          { id: 'm10a', text: 'Stay present and find interest in the process', value: 5, category: 'presence' },
          { id: 'm10b', text: 'Try to stay focused but sometimes get distracted', value: 3, category: 'presence' },
          { id: 'm10c', text: 'Let my mind wander to more interesting things', value: 1, category: 'presence' },
          { id: 'm10d', text: 'Feel restless and want to rush through them', value: 0, category: 'presence' }
        ]
      },
      {
        id: 'm11',
        question: 'How often do you judge your thoughts and feelings?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Very judgmental', max: 'Very accepting' },
        category: 'acceptance'
      },
      {
        id: 'm12',
        question: 'When you wake up, what\'s your typical mental state?',
        type: 'multiple_choice',
        options: [
          { id: 'm12a', text: 'Present and aware of the new day', value: 5, category: 'awareness' },
          { id: 'm12b', text: 'Gradually become aware of my surroundings', value: 3, category: 'awareness' },
          { id: 'm12c', text: 'Immediately start thinking about my to-do list', value: 1, category: 'awareness' },
          { id: 'm12d', text: 'Feel rushed and anxious about the day ahead', value: 0, category: 'awareness' }
        ]
      }
    ],
    resultCategories: [
      {
        id: 'mindful-master',
        name: 'Mindful Master',
        description: 'You demonstrate excellent mindfulness skills with strong present-moment awareness and emotional regulation. You live with conscious intention.',
        minScore: 45,
        maxScore: 60,
        color: 'bg-purple-500',
        recommendations: [
          'Continue deepening your meditation practice',
          'Consider teaching or sharing mindfulness with others',
          'Explore advanced mindfulness techniques and retreats',
          'Maintain your practice even during busy or stressful periods'
        ]
      },
      {
        id: 'aware-practitioner',
        name: 'Aware Practitioner',
        description: 'You have good mindfulness skills with room for growth. You understand the principles and practice them regularly.',
        minScore: 30,
        maxScore: 44,
        color: 'bg-blue-500',
        recommendations: [
          'Establish a more consistent daily meditation practice',
          'Work on extending mindfulness to more daily activities',
          'Practice non-judgmental awareness of thoughts and emotions',
          'Consider joining a mindfulness group or class'
        ]
      },
      {
        id: 'developing-awareness',
        name: 'Developing Awareness',
        description: 'You\'re beginning to develop mindfulness skills. You have some awareness but could benefit from more consistent practice.',
        minScore: 15,
        maxScore: 29,
        color: 'bg-yellow-500',
        recommendations: [
          'Start with short, daily meditation sessions (5-10 minutes)',
          'Practice mindful breathing throughout the day',
          'Use mindfulness apps or guided meditations',
          'Focus on single-tasking rather than multitasking'
        ]
      },
      {
        id: 'beginning-journey',
        name: 'Beginning Journey',
        description: 'You\'re at the start of your mindfulness journey. With practice and patience, you can develop greater awareness and presence.',
        minScore: 0,
        maxScore: 14,
        color: 'bg-green-500',
        recommendations: [
          'Start with basic breathing exercises and body awareness',
          'Try guided meditations for beginners',
          'Practice noticing when your mind wanders without judgment',
          'Consider taking a mindfulness-based stress reduction course'
        ]
      }
    ]
  },

  {
    id: 'personal-growth',
    title: 'Personal Growth Readiness',
    description: 'Assess your motivation, openness, and readiness for personal development and positive life changes.',
    category: 'growth',
    estimatedTime: 10,
    slug: 'growth-readiness',
    tags: ['growth', 'development', 'change', 'motivation'],
    icon: '🌟',
    color: 'bg-yellow-500',
    isActive: true,
    questions: [
      {
        id: 'g1',
        question: 'How motivated are you to make positive changes in your life?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Not motivated', max: 'Extremely motivated' },
        category: 'motivation'
      },
      {
        id: 'g2',
        question: 'When faced with feedback or criticism, you typically:',
        type: 'multiple_choice',
        options: [
          { id: 'g2a', text: 'Welcome it as an opportunity to learn and grow', value: 5, category: 'openness' },
          { id: 'g2b', text: 'Consider it carefully and look for truth in it', value: 4, category: 'openness' },
          { id: 'g2c', text: 'Feel defensive but try to listen', value: 2, category: 'openness' },
          { id: 'g2d', text: 'Reject it and feel attacked', value: 0, category: 'openness' }
        ]
      },
      {
        id: 'g3',
        question: 'How comfortable are you with stepping outside your comfort zone?',
        type: 'multiple_choice',
        options: [
          { id: 'g3a', text: 'I actively seek new challenges and experiences', value: 5, category: 'risk-taking' },
          { id: 'g3b', text: 'I\'m willing when I see the potential benefit', value: 4, category: 'risk-taking' },
          { id: 'g3c', text: 'I do it occasionally but prefer familiar territory', value: 2, category: 'risk-taking' },
          { id: 'g3d', text: 'I avoid it whenever possible', value: 0, category: 'risk-taking' }
        ]
      },
      {
        id: 'g4',
        question: 'How often do you reflect on your personal patterns and behaviors?',
        type: 'multiple_choice',
        options: [
          { id: 'g4a', text: 'Daily or weekly self-reflection', value: 5, category: 'self-awareness' },
          { id: 'g4b', text: 'Regular reflection, especially after significant events', value: 4, category: 'self-awareness' },
          { id: 'g4c', text: 'Occasional reflection when prompted', value: 2, category: 'self-awareness' },
          { id: 'g4d', text: 'Rarely think about my patterns', value: 0, category: 'self-awareness' }
        ]
      },
      {
        id: 'g5',
        question: 'How do you view failure or setbacks?',
        type: 'multiple_choice',
        options: [
          { id: 'g5a', text: 'As valuable learning experiences', value: 5, category: 'resilience' },
          { id: 'g5b', text: 'As temporary obstacles to overcome', value: 4, category: 'resilience' },
          { id: 'g5c', text: 'As disappointing but inevitable', value: 2, category: 'resilience' },
          { id: 'g5d', text: 'As evidence of my limitations', value: 0, category: 'resilience' }
        ]
      },
      {
        id: 'g6',
        question: 'How committed are you to personal development activities?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Not committed', max: 'Highly committed' },
        category: 'commitment'
      },
      {
        id: 'g7',
        question: 'When you set goals, you typically:',
        type: 'multiple_choice',
        options: [
          { id: 'g7a', text: 'Create detailed plans and track progress regularly', value: 5, category: 'planning' },
          { id: 'g7b', text: 'Set clear goals with some planning', value: 4, category: 'planning' },
          { id: 'g7c', text: 'Set goals but struggle with follow-through', value: 2, category: 'planning' },
          { id: 'g7d', text: 'Rarely set specific goals', value: 0, category: 'planning' }
        ]
      },
      {
        id: 'g8',
        question: 'How do you handle uncertainty and ambiguity?',
        type: 'multiple_choice',
        options: [
          { id: 'g8a', text: 'Embrace it as part of growth and adventure', value: 5, category: 'adaptability' },
          { id: 'g8b', text: 'Manage it reasonably well', value: 4, category: 'adaptability' },
          { id: 'g8c', text: 'Feel uncomfortable but can cope', value: 2, category: 'adaptability' },
          { id: 'g8d', text: 'Find it very stressful and anxiety-provoking', value: 0, category: 'adaptability' }
        ]
      },
      {
        id: 'g9',
        question: 'How important is continuous learning to you?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Not important', max: 'Extremely important' },
        category: 'learning'
      },
      {
        id: 'g10',
        question: 'When you encounter obstacles, you typically:',
        type: 'multiple_choice',
        options: [
          { id: 'g10a', text: 'Find creative solutions and persist', value: 5, category: 'persistence' },
          { id: 'g10b', text: 'Try different approaches until something works', value: 4, category: 'persistence' },
          { id: 'g10c', text: 'Make some effort but give up if it\'s too hard', value: 2, category: 'persistence' },
          { id: 'g10d', text: 'Get discouraged and avoid similar challenges', value: 0, category: 'persistence' }
        ]
      },
      {
        id: 'g11',
        question: 'How do you respond to new ideas or perspectives?',
        type: 'multiple_choice',
        options: [
          { id: 'g11a', text: 'Actively seek them out and explore them', value: 5, category: 'openness' },
          { id: 'g11b', text: 'Listen with interest and consider them', value: 4, category: 'openness' },
          { id: 'g11c', text: 'Hear them but prefer familiar viewpoints', value: 2, category: 'openness' },
          { id: 'g11d', text: 'Resist them and stick to what I know', value: 0, category: 'openness' }
        ]
      },
      {
        id: 'g12',
        question: 'How willing are you to invest time and energy in personal growth?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Not willing', max: 'Very willing' },
        category: 'investment'
      },
      {
        id: 'g13',
        question: 'How do you view your potential for change?',
        type: 'multiple_choice',
        options: [
          { id: 'g13a', text: 'I believe I can change and grow significantly', value: 5, category: 'growth-mindset' },
          { id: 'g13b', text: 'I can change with effort and support', value: 4, category: 'growth-mindset' },
          { id: 'g13c', text: 'I can change in small ways', value: 2, category: 'growth-mindset' },
          { id: 'g13d', text: 'I don\'t think people really change much', value: 0, category: 'growth-mindset' }
        ]
      }
    ],
    resultCategories: [
      {
        id: 'growth-champion',
        name: 'Growth Champion',
        description: 'You demonstrate exceptional readiness for personal growth. You actively seek development opportunities and embrace challenges.',
        minScore: 50,
        maxScore: 65,
        color: 'bg-green-500',
        recommendations: [
          'Set ambitious personal development goals',
          'Consider mentoring others in their growth journey',
          'Explore advanced personal development programs',
          'Share your growth mindset and inspire others'
        ]
      },
      {
        id: 'motivated-learner',
        name: 'Motivated Learner',
        description: 'You show strong motivation for growth with good self-awareness. You\'re ready to take on meaningful development challenges.',
        minScore: 35,
        maxScore: 49,
        color: 'bg-blue-500',
        recommendations: [
          'Create a structured personal development plan',
          'Seek out growth opportunities and new experiences',
          'Work on areas where you feel less confident',
          'Consider working with a coach or mentor'
        ]
      },
      {
        id: 'emerging-grower',
        name: 'Emerging Grower',
        description: 'You have some motivation for growth but may need support and structure. You\'re beginning to see the value of personal development.',
        minScore: 20,
        maxScore: 34,
        color: 'bg-yellow-500',
        recommendations: [
          'Start with small, achievable growth goals',
          'Find accountability partners or support groups',
          'Focus on building self-awareness through reflection',
          'Celebrate small wins to build momentum'
        ]
      },
      {
        id: 'potential-awakener',
        name: 'Potential Awakener',
        description: 'You may be at the beginning of recognizing your growth potential. With the right support, you can develop a stronger growth mindset.',
        minScore: 0,
        maxScore: 19,
        color: 'bg-orange-500',
        recommendations: [
          'Start by identifying one small area you\'d like to improve',
          'Seek inspiration from others\' growth stories',
          'Consider working with a counselor or coach',
          'Practice self-compassion as you begin your journey'
        ]
      }
    ]
  }
];

export default visitorAssessments;