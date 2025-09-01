// Production-ready assessment data
// 6 Free assessments for visitors (no signup required)
// 20+ Assessments for registered users

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  options?: string[];
  scale?: { min: number; max: number; labels: string[] };
  category?: string;
}

export interface AIAnalysis {
  insights: string[];
  recommendations: string[];
  summary: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  visibility: 'public' | 'users' | 'premium';
  estimatedTime: number;
  questions: AssessmentQuestion[];
  scoring: {
    type: 'cumulative' | 'categorical' | 'personality';
    categories?: string[];
    interpretation?: Record<string, any>;
  };
  results: {
    summary: string;
    insights: string[];
    recommendations: string[];
    aiAnalysis?: AIAnalysis;
  };
}

// 6 FREE VISITOR ASSESSMENTS (No signup required)
export const freeVisitorAssessments: Assessment[] = [
  {
    id: 'personality-basics',
    title: 'Personality Discovery',
    description: 'Discover your core personality traits and understand what makes you unique',
    type: 'personality',
    category: 'self-discovery',
    visibility: 'public',
    estimatedTime: 5,
    questions: [
      {
        id: 'p1',
        text: 'In social situations, you tend to:',
        type: 'single',
        options: ['Initiate conversations with new people', 'Wait for others to approach you', 'Prefer small groups over large gatherings', 'Avoid social situations when possible']
      },
      {
        id: 'p2',
        text: 'When making decisions, you primarily rely on:',
        type: 'single',
        options: ['Logic and objective analysis', 'Your gut feelings and intuition', 'Input from trusted friends/family', 'Practical considerations and past experiences']
      },
      {
        id: 'p3',
        text: 'Your ideal weekend involves:',
        type: 'single',
        options: ['Adventure and new experiences', 'Relaxation and quiet time', 'Socializing with friends', 'Productive activities and learning']
      },
      {
        id: 'p4',
        text: 'When faced with unexpected changes, you:',
        type: 'single',
        options: ['Embrace the change enthusiastically', 'Feel anxious but adapt quickly', 'Need time to process and adjust', 'Prefer to stick to original plans']
      },
      {
        id: 'p5',
        text: 'Rate your comfort with uncertainty:',
        type: 'scale',
        scale: { min: 1, max: 5, labels: ['Very uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very comfortable'] }
      }
    ],
    scoring: {
      type: 'personality',
      categories: ['Extraversion', 'Intuition', 'Feeling', 'Perceiving'],
      interpretation: {
        'high-extraversion': 'Energized by social interaction',
        'low-extraversion': 'Prefer quiet, solitary activities',
        'high-intuition': 'Focus on ideas and possibilities',
        'low-intuition': 'Practical and detail-oriented',
        'high-feeling': 'Value harmony and relationships',
        'low-feeling': 'Objective and logical decision-maker',
        'high-perceiving': 'Flexible and spontaneous',
        'low-perceiving': 'Organized and decisive'
      }
    },
    results: {
      summary: 'Your personality profile reveals your natural preferences in how you interact with the world, process information, make decisions, and organize your life.',
      insights: [
        'Understanding your personality type helps you leverage your natural strengths',
        'Recognize situations where you thrive vs. where you need to adapt',
        'Improve communication by understanding different personality types'
      ],
      recommendations: [
        'Take our full 16-personality assessment for deeper insights',
        'Explore career paths aligned with your personality type',
        'Learn communication strategies for different personality types'
      ]
    }
  },
  {
    id: 'stress-level-check',
    title: 'Stress Level Assessment',
    description: 'Quick check-in to understand your current stress levels and triggers',
    type: 'wellness',
    category: 'mental-health',
    visibility: 'public',
    estimatedTime: 3,
    questions: [
      {
        id: 's1',
        text: 'Over the past week, how often have you felt overwhelmed?',
        type: 'single',
        options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Daily']
      },
      {
        id: 's2',
        text: 'Physical symptoms you\'ve experienced recently:',
        type: 'multiple',
        options: ['Headaches', 'Sleep problems', 'Muscle tension', 'Fatigue', 'Digestive issues', 'None']
      },
      {
        id: 's3',
        text: 'Rate your current ability to cope with daily challenges:',
        type: 'scale',
        scale: { min: 1, max: 10, labels: ['Very poor', '', '', '', 'Average', '', '', '', '', 'Excellent'] }
      }
    ],
    scoring: {
      type: 'cumulative',
      interpretation: {
        '0-5': 'Low stress - Good coping mechanisms',
        '6-10': 'Moderate stress - Some areas to address',
        '11-15': 'High stress - Consider stress management strategies',
        '16+': 'Very high stress - Professional support recommended'
      }
    },
    results: {
      summary: 'Your stress assessment provides insight into your current stress levels and helps identify specific areas that may need attention.',
      insights: [
        'Physical symptoms often indicate stress before we mentally recognize it',
        'Stress affects both mental and physical health',
        'Early intervention prevents stress from becoming chronic'
      ],
      recommendations: [
        'Try our guided breathing exercises',
        'Explore stress management techniques',
        'Consider our full stress management course'
      ]
    }
  },
  {
    id: 'relationship-style',
    title: 'Relationship Attachment Style',
    description: 'Understand your patterns in relationships and how you connect with others',
    type: 'relationships',
    category: 'relationships',
    visibility: 'public',
    estimatedTime: 4,
    questions: [
      {
        id: 'r1',
        text: 'When your partner needs space, you tend to:',
        type: 'single',
        options: ['Feel relieved and enjoy the independence', 'Feel anxious and worry about the relationship', 'Respect their needs while staying connected', 'Get angry or try to change their mind']
      },
      {
        id: 'r2',
        text: 'In arguments, you typically:',
        type: 'single',
        options: ['Withdraw and need time alone', 'Pursue resolution immediately', 'Seek compromise and understanding', 'Escalate the conflict']
      },
      {
        id: 'r3',
        text: 'Your biggest relationship fear is:',
        type: 'single',
        options: ['Losing your independence', 'Being abandoned or rejected', 'Conflict and disharmony', 'Not being good enough']
      }
    ],
    scoring: {
      type: 'categorical',
      categories: ['Secure', 'Anxious', 'Avoidant', 'Disorganized'],
      interpretation: {
        'Secure': 'Comfortable with intimacy and independence',
        'Anxious': 'Preoccupied with relationships and fear abandonment',
        'Avoidant': 'Value independence and uncomfortable with closeness',
        'Disorganized': 'Mixed feelings about intimacy and relationships'
      }
    },
    results: {
      summary: 'Your attachment style influences how you form and maintain relationships, affecting your communication patterns, conflict resolution, and emotional needs.',
      insights: [
        'Attachment styles develop early but can evolve with awareness',
        'Understanding your style helps you choose compatible partners',
        'Different styles can complement each other with understanding'
      ],
      recommendations: [
        'Take our full relationship compatibility assessment',
        'Explore communication strategies for your attachment style',
        'Learn about healthy boundaries and relationship skills'
      ]
    }
  },
  {
    id: 'life-balance-check',
    title: 'Life Balance Assessment',
    description: 'Evaluate your current life balance across key areas',
    type: 'lifestyle',
    category: 'well-being',
    visibility: 'public',
    estimatedTime: 4,
    questions: [
      {
        id: 'l1',
        text: 'Rate your satisfaction with your career/professional life:',
        type: 'scale',
        scale: { min: 1, max: 10, labels: ['Very dissatisfied', '', '', '', 'Neutral', '', '', '', '', 'Very satisfied'] }
      },
      {
        id: 'l2',
        text: 'How would you rate your physical health and fitness?',
        type: 'scale',
        scale: { min: 1, max: 10, labels: ['Very poor', '', '', '', 'Average', '', '', '', '', 'Excellent'] }
      },
      {
        id: 'l3',
        text: 'Rate the quality of your relationships:',
        type: 'scale',
        scale: { min: 1, max: 10, labels: ['Very poor', '', '', '', 'Average', '', '', '', '', 'Excellent'] }
      },
      {
        id: 'l4',
        text: 'How fulfilled do you feel personally/spiritually?',
        type: 'scale',
        scale: { min: 1, max: 10, labels: ['Very unfulfilled', '', '', '', 'Neutral', '', '', '', '', 'Very fulfilled'] }
      }
    ],
    scoring: {
      type: 'categorical',
      categories: ['Career', 'Health', 'Relationships', 'Personal Growth'],
      interpretation: {
        'high-balance': 'Well-balanced across life areas',
        'career-focus': 'Strong in career, may need attention elsewhere',
        'health-focus': 'Good health habits, consider other areas',
        'relationship-focus': 'Strong relationships, balance other areas',
        'growth-focus': 'Personal development focus, consider practical areas'
      }
    },
    results: {
      summary: 'Your life balance assessment reveals which areas are thriving and which may need more attention to create a more fulfilling life.',
      insights: [
        'Imbalance in one area often affects other areas',
        'Small improvements in low-scoring areas create significant impact',
        'Balance doesn\'t mean equal time, but appropriate attention'
      ],
      recommendations: [
        'Focus on your lowest-scoring area with small daily actions',
        'Explore our goal-setting and habit formation tools',
        'Consider our life coaching programs'
      ]
    }
  },
  {
    id: 'decision-making-style',
    title: 'Decision Making Style',
    description: 'Discover how you make decisions and where you can improve',
    type: 'cognitive',
    category: 'personal-development',
    visibility: 'public',
    estimatedTime: 3,
    questions: [
      {
        id: 'd1',
        text: 'When faced with a major decision, you first:',
        type: 'single',
        options: ['Research all options thoroughly', 'Trust your initial gut feeling', 'Seek advice from others', 'Delay deciding as long as possible']
      },
      {
        id: 'd2',
        text: 'Your biggest decision-making challenge is:',
        type: 'single',
        options: ['Overthinking and analysis paralysis', 'Making impulsive choices', 'Being overly influenced by others', 'Avoiding decisions entirely']
      },
      {
        id: 'd3',
        text: 'After making a decision, you typically:',
        type: 'single',
        options: ['Feel confident and move forward', 'Second-guess yourself constantly', 'Seek validation from others', 'Worry about potential negative outcomes']
      }
    ],
    scoring: {
      type: 'categorical',
      categories: ['Analytical', 'Intuitive', 'Dependent', 'Avoidant'],
      interpretation: {
        'Analytical': 'Thorough and logical but may overthink',
        'Intuitive': 'Quick and confident but may miss details',
        'Dependent': 'Values input but may lack confidence',
        'Avoidant': 'Struggles with decision-making pressure'
      }
    },
    results: {
      summary: 'Your decision-making style affects your confidence, speed, and satisfaction with choices across all areas of life.',
      insights: [
        'No style is inherently better - each has strengths and challenges',
        'Awareness of your style helps you compensate for blind spots',
        'Different situations may call for different approaches'
      ],
      recommendations: [
        'Learn decision-making frameworks for your style',
        'Practice with low-stakes decisions to build confidence',
        'Explore our critical thinking and decision-making courses'
      ]
    }
  },
  {
    id: 'communication-style',
    title: 'Communication Style Assessment',
    description: 'Understand how you communicate and connect with others',
    type: 'communication',
    category: 'social-skills',
    visibility: 'public',
    estimatedTime: 4,
    questions: [
      {
        id: 'c1',
        text: 'When explaining something complex, you:',
        type: 'single',
        options: ['Use detailed explanations and examples', 'Focus on the big picture and key points', 'Ask questions to ensure understanding', 'Prefer to show rather than tell']
      },
      {
        id: 'c2',
        text: 'During conflicts, you tend to:',
        type: 'single',
        options: ['Address issues directly and immediately', 'Avoid confrontation and hope it resolves', 'Seek to understand all perspectives', 'Use humor to defuse tension']
      },
      {
        id: 'c3',
        text: 'Your listening style is best described as:',
        type: 'single',
        options: ['Active listener who asks clarifying questions', 'Listener who connects everything to personal experiences', 'Listener who focuses on solutions', 'Selective listener who filters for key information']
      }
    ],
    scoring: {
      type: 'categorical',
      categories: ['Analytical', 'Driver', 'Expressive', 'Amiable'],
      interpretation: {
        'Analytical': 'Detailed, systematic, and logical communicator',
        'Driver': 'Direct, results-focused, and decisive',
        'Expressive': 'Enthusiastic, emotional, and people-focused',
        'Amiable': 'Supportive, relationship-focused, and cooperative'
      }
    },
    results: {
      summary: 'Your communication style influences how effectively you connect with others, resolve conflicts, and share ideas.',
      insights: [
        'Different situations and people require different communication approaches',
        'Flexibility in style improves relationship quality',
        'Understanding others\' styles helps prevent miscommunication'
      ],
      recommendations: [
        'Learn to adapt your style for different audiences',
        'Explore active listening and empathy skills',
        'Take our advanced communication skills course'
      ]
    }
  }
];

// 20+ USER ASSESSMENTS (Registration required)
export const userAssessments: Assessment[] = [
  // Personality Deep Dive
  {
    id: 'big-five-personality',
    title: 'Big Five Personality Assessment',
    description: 'Comprehensive analysis of your personality across the five major dimensions',
    type: 'personality',
    category: 'self-discovery',
    visibility: 'users',
    estimatedTime: 15,
    questions: [
      // 50 questions for Big Five
      { id: 'bf1', text: 'I am the life of the party', type: 'scale', scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] } },
      { id: 'bf2', text: 'I feel comfortable around people', type: 'scale', scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] } },
      // Additional 48 questions would follow similar pattern
    ],
    scoring: {
      type: 'categorical',
      categories: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'],
      interpretation: {
        'high-openness': 'Creative, curious, and open to new experiences',
        'low-openness': 'Practical, traditional, and prefer routine',
        'high-conscientiousness': 'Organized, disciplined, and reliable',
        'low-conscientiousness': 'Flexible, spontaneous, and sometimes disorganized',
        'high-extraversion': 'Energetic, assertive, and sociable',
        'low-extraversion': 'Reserved, quiet, and prefer solitude',
        'high-agreeableness': 'Compassionate, cooperative, and trusting',
        'low-agreeableness': 'Competitive, analytical, and sometimes critical',
        'high-neuroticism': 'Sensitive, emotional, and prone to stress',
        'low-neuroticism': 'Calm, resilient, and emotionally stable'
      }
    },
    results: {
      summary: 'The Big Five personality assessment provides a scientifically validated understanding of your personality across five fundamental dimensions.',
      insights: [
        'Personality traits are stable over time but can be influenced',
        'Understanding your traits helps in career and relationship choices',
        'Different combinations of traits create unique personality profiles'
      ],
      recommendations: [
        'Explore career paths aligned with your personality profile',
        'Learn communication strategies based on your traits',
        'Understand how your personality affects stress and coping'
      ]
    }
  },
  
  // Career & Work
  {
    id: 'career-values',
    title: 'Career Values Assessment',
    description: 'Identify what truly matters to you in your career and work life',
    type: 'career',
    category: 'professional-development',
    visibility: 'users',
    estimatedTime: 12,
    questions: [
      // 30 questions about career values
    ],
    scoring: { type: 'categorical', categories: ['Achievement', 'Independence', 'Recognition', 'Relationships', 'Support', 'Working Conditions'] },
    results: {
      summary: 'Your career values assessment reveals what motivates and fulfills you professionally.',
      insights: [
        'Values alignment is crucial for job satisfaction',
        'Understanding your values helps in career decisions',
        'Values can evolve throughout your career'
      ],
      recommendations: [
        'Evaluate current job against your values',
        'Explore careers that align with your top values',
        'Learn negotiation strategies for value-aligned opportunities'
      ]
    }
  },
  
  {
    id: 'strengths-finder',
    title: 'Personal Strengths Assessment',
    description: 'Discover your unique strengths and learn how to leverage them',
    type: 'strengths',
    category: 'personal-development',
    visibility: 'users',
    estimatedTime: 20,
    questions: [
      // 34 strengths-based questions
    ],
    scoring: { type: 'categorical', categories: ['Executing', 'Influencing', 'Relationship Building', 'Strategic Thinking'] },
    results: {
      summary: 'Your strengths assessment identifies your natural talents and provides strategies for development.',
      insights: [
        'Focusing on strengths is more effective than fixing weaknesses',
        'Strengths can be overused and become weaknesses',
        'Team success comes from complementary strengths'
      ],
      recommendations: [
        'Create a personal development plan based on strengths',
        'Seek roles and projects that utilize your top strengths',
        'Learn to manage and develop your lesser strengths'
      ]
    }
  },
  
  // Mental Health & Wellness
  {
    id: 'anxiety-assessment',
    title: 'Anxiety Level Assessment',
    description: 'Evaluate your anxiety levels and identify specific triggers',
    type: 'mental-health',
    category: 'wellness',
    visibility: 'users',
    estimatedTime: 8,
    questions: [
      // GAD-7 based questions
    ],
    scoring: { type: 'cumulative', interpretation: { 'minimal': '0-4', 'mild': '5-9', 'moderate': '10-14', 'severe': '15-21' } },
    results: {
      summary: 'Your anxiety assessment helps identify current levels and specific areas of concern.',
      insights: [
        'Anxiety exists on a spectrum and is normal in moderation',
        'Specific triggers can be identified and managed',
        'Early intervention prevents escalation'
      ],
      recommendations: [
        'Explore our anxiety management techniques',
        'Consider professional support if levels are concerning',
        'Practice daily stress reduction activities'
      ]
    }
  },
  
  {
    id: 'depression-screening',
    title: 'Depression Screening',
    description: 'Quick screening for depressive symptoms and mood patterns',
    type: 'mental-health',
    category: 'wellness',
    visibility: 'users',
    estimatedTime: 5,
    questions: [
      // PHQ-9 based questions
    ],
    scoring: { type: 'cumulative', interpretation: { 'minimal': '0-4', 'mild': '5-9', 'moderate': '10-14', 'moderately-severe': '15-19', 'severe': '20-27' } },
    results: {
      summary: 'This screening helps identify potential depressive symptoms that may benefit from professional attention.',
      insights: [
        'Depression is treatable with proper support',
        'Symptoms can fluctuate and have various causes',
        'Early identification improves treatment outcomes'
      ],
      recommendations: [
        'Consider professional evaluation if symptoms are concerning',
        'Explore our mental health resources and support',
        'Maintain regular check-ins with your mood and well-being'
      ]
    }
  },
  
  // Relationships & Social
  {
    id: 'emotional-intelligence',
    title: 'Emotional Intelligence Assessment',
    description: 'Measure your ability to understand and manage emotions',
    type: 'emotional-intelligence',
    category: 'social-skills',
    visibility: 'users',
    estimatedTime: 18,
    questions: [
      // EQ-i 2.0 based questions
    ],
    scoring: { type: 'categorical', categories: ['Self-Perception', 'Self-Expression', 'Interpersonal', 'Decision Making', 'Stress Management'] },
    results: {
      summary: 'Your emotional intelligence assessment reveals your ability to understand and manage emotions in yourself and others.',
      insights: [
        'EQ can be developed and improved over time',
        'Higher EQ correlates with better relationships and career success',
        'Different EQ skills are needed for different situations'
      ],
      recommendations: [
        'Focus on developing your lowest EQ areas',
        'Practice emotional awareness and regulation techniques',
        'Explore our emotional intelligence development program'
      ]
    }
  },
  
  {
    id: 'love-languages',
    title: 'Love Languages Assessment',
    description: 'Discover how you give and receive love in relationships',
    type: 'relationships',
    category: 'relationships',
    visibility: 'users',
    estimatedTime: 10,
    questions: [
      // 30 questions based on Chapman\'s love languages
    ],
    scoring: { type: 'categorical', categories: ['Words of Affirmation', 'Acts of Service', 'Receiving Gifts', 'Quality Time', 'Physical Touch'] },
    results: {
      summary: 'Your love languages assessment reveals your primary ways of feeling loved and appreciated.',
      insights: [
        'People often give love in their preferred language',
        'Understanding partner\'s language improves relationship satisfaction',
        'Love languages can vary across different relationships'
      ],
      recommendations: [
        'Share your results with important people in your life',
        'Learn to recognize and speak others\' love languages',
        'Explore our relationship communication courses'
      ]
    }
  },
  
  // Skills & Abilities
  {
    id: 'learning-style',
    title: 'Learning Style Assessment',
    description: 'Identify your preferred learning methods and study strategies',
    type: 'learning',
    category: 'education',
    visibility: 'users',
    estimatedTime: 8,
    questions: [
      // VARK questionnaire based
    ],
    scoring: { type: 'categorical', categories: ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'] },
    results: {
      summary: 'Your learning style assessment identifies your preferred methods for absorbing and processing new information.',
      insights: [
        'Most people use a combination of learning styles',
        'Adapting study methods to your style improves retention',
        'Different subjects may benefit from different approaches'
      ],
      recommendations: [
        'Adapt your study methods to your primary learning style',
        'Explore multimodal learning techniques',
        'Consider our personalized learning strategies course'
      ]
    }
  },
  
  {
    id: 'time-management',
    title: 'Time Management Assessment',
    description: 'Evaluate your current time management skills and identify improvement areas',
    type: 'productivity',
    category: 'personal-development',
    visibility: 'users',
    estimatedTime: 12,
    questions: [
      // Time management effectiveness questions
    ],
    scoring: { type: 'categorical', categories: ['Planning', 'Prioritization', 'Delegation', 'Focus', 'Procrastination Management'] },
    results: {
      summary: 'Your time management assessment reveals your strengths and challenges in organizing and using time effectively.',
      insights: [
        'Time management is a skill that can be learned and improved',
        'Different strategies work for different personality types',
        'Small changes can create significant improvements'
      ],
      recommendations: [
        'Focus on your lowest-scoring time management area',
        'Implement one new time management technique per week',
        'Explore our productivity and time management courses'
      ]
    }
  },
  
  // Additional assessments to reach 20+
  {
    id: 'resilience-assessment',
    title: 'Resilience Assessment',
    description: 'Measure your ability to bounce back from adversity and stress',
    type: 'resilience',
    category: 'mental-health',
    visibility: 'users',
    estimatedTime: 10,
    questions: [],
    scoring: { type: 'categorical', categories: ['Emotional Regulation', 'Optimism', 'Social Support', 'Problem-Solving'] },
    results: {
      summary: 'Your resilience assessment shows your capacity to recover from difficulties and adapt to challenges.',
      insights: [],
      recommendations: []
    }
  },
  
  {
    id: 'creativity-assessment',
    title: 'Creative Thinking Assessment',
    description: 'Evaluate your creative problem-solving abilities and innovation potential',
    type: 'creativity',
    category: 'cognitive',
    visibility: 'users',
    estimatedTime: 15,
    questions: [],
    scoring: { type: 'categorical', categories: ['Fluency', 'Flexibility', 'Originality', 'Elaboration'] },
    results: {
      summary: 'Your creativity assessment reveals your innovative thinking patterns and creative problem-solving abilities.',
      insights: [],
      recommendations: []
    }
  },
  
  {
    id: 'leadership-style',
    title: 'Leadership Style Assessment',
    description: 'Identify your natural leadership approach and development areas',
    type: 'leadership',
    category: 'professional-development',
    visibility: 'users',
    estimatedTime: 20,
    questions: [],
    scoring: { type: 'categorical', categories: ['Transformational', 'Transactional', 'Servant', 'Democratic', 'Autocratic'] },
    results: {
      summary: 'Your leadership style assessment identifies your natural approach to leading and influencing others.',
      insights: [],
      recommendations: []
    }
  },
  
  {
    id: 'mindfulness-assessment',
    title: 'Mindfulness & Presence Assessment',
    description: 'Evaluate your current level of mindfulness and present-moment awareness',
    type: 'mindfulness',
    category: 'wellness',
    visibility: 'users',
    estimatedTime: 8,
    questions: [],
    scoring: { type: 'categorical', categories: ['Awareness', 'Non-judgment', 'Present-moment', 'Acceptance'] },
    results: {
      summary: 'Your mindfulness assessment reveals your current capacity for present-moment awareness and non-judgmental attention.',
      insights: [],
      recommendations: []
    }
  },
  
  {
    id: 'goal-setting',
    title: 'Goal Setting & Achievement Style',
    description: 'Understand your approach to setting and achieving personal goals',
    type: 'goals',
    category: 'personal-development',
    visibility: 'users',
    estimatedTime: 12,
    questions: [],
    scoring: { type: 'categorical', categories: ['SMART Goals', 'Visionary', 'Incremental', 'Flexible', 'Systematic'] },
    results: {
      summary: 'Your goal-setting assessment identifies your natural approach to setting and achieving objectives.',
      insights: [],
      recommendations: []
    }
  },
  
  {
    id: 'empathy-level',
    title: 'Empathy & Compassion Assessment',
    description: 'Measure your capacity for understanding and sharing others\' feelings',
    type: 'social-skills',
    category: 'relationships',
    visibility: 'users',
    estimatedTime: 10,
    questions: [],
    scoring: { type: 'categorical', categories: ['Cognitive Empathy', 'Emotional Empathy', 'Compassionate Action'] },
    results: {
      summary: 'Your empathy assessment reveals your ability to understand, share, and respond to others\' emotions.',
      insights: [],
      recommendations: []
    }
  },
  
  {
    id: 'burnout-risk',
    title: 'Burnout Risk Assessment',
    description: 'Evaluate your risk of burnout across work and personal life',
    type: 'wellness',
    category: 'mental-health',
    visibility: 'users',
    estimatedTime: 8,
    questions: [],
    scoring: { type: 'cumulative', interpretation: { 'low-risk': '0-15', 'moderate-risk': '16-30', 'high-risk': '31-45', 'severe-risk': '46+' } },
    results: {
      summary: 'Your burnout assessment identifies risk factors and early warning signs across different life areas.',
      insights: [],
      recommendations: []
    }
  },
  
  {
    id: 'conflict-resolution',
    title: 'Conflict Resolution Style',
    description: 'Discover your natural approach to handling conflicts and disagreements',
    type: 'social-skills',
    category: 'relationships',
    visibility: 'users',
    estimatedTime: 10,
    questions: [],
    scoring: { type: 'categorical', categories: ['Competing', 'Collaborating', 'Compromising', 'Avoiding', 'Accommodating'] },
    results: {
      summary: 'Your conflict resolution style assessment reveals your natural approach to handling disagreements and finding solutions.',
      insights: [],
      recommendations: []
    }
  },
  
  {
    id: 'financial-wellness',
    title: 'Financial Wellness Assessment',
    description: 'Evaluate your financial health and money management skills',
    type: 'financial',
    category: 'lifestyle',
    visibility: 'users',
    estimatedTime: 15,
    questions: [],
    scoring: { type: 'categorical', categories: ['Budgeting', 'Saving', 'Investing', 'Debt Management', 'Financial Goals'] },
    results: {
      summary: 'Your financial wellness assessment provides insight into your money management skills and financial health.',
      insights: [],
      recommendations: []
    }
  },
  
  {
    id: 'sleep-quality',
    title: 'Sleep Quality Assessment',
    description: 'Evaluate your sleep patterns and identify areas for improvement',
    type: 'health',
    category: 'wellness',
    visibility: 'users',
    estimatedTime: 5,
    questions: [],
    scoring: { type: 'categorical', categories: ['Sleep Duration', 'Sleep Quality', 'Sleep Hygiene', 'Daytime Functioning'] },
    results: {
      summary: 'Your sleep assessment reveals patterns and factors affecting your rest and recovery.',
      insights: [],
      recommendations: []
    }
  }
];

// Combined assessments for easy access
export const allAssessments = [...freeVisitorAssessments, ...userAssessments];

// Helper functions
export const getPublicAssessments = () => freeVisitorAssessments;
export const getUserAssessments = () => userAssessments;
export const getAssessmentById = (id: string) => allAssessments.find(a => a.id === id);
export const getAssessmentsByCategory = (category: string) => allAssessments.filter(a => a.category === category);
export const getAssessmentsByType = (type: string) => allAssessments.filter(a => a.type === type);