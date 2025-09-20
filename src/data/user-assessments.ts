export interface UserAssessment {
  id: string;
  title: string;
  description: string;
  category: 'personality' | 'wellness' | 'career' | 'relationships' | 'mindfulness' | 'growth' | 'leadership' | 'creativity' | 'emotional-intelligence' | 'communication';
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  questions: UserQuestion[];
  resultCategories: UserResultCategory[];
  isActive: boolean;
  isPremium: boolean;
  slug: string;
  tags: string[];
  icon: string;
  color: string;
  prerequisites?: string[];
  learningObjectives: string[];
}

export interface UserQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'true_false' | 'ranking' | 'open_ended' | 'scenario';
  options?: UserQuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  category?: string;
  weight?: number;
  scenario?: string;
  followUpQuestions?: UserQuestion[];
}

export interface UserQuestionOption {
  id: string;
  text: string;
  value: number;
  category?: string;
  explanation?: string;
}

export interface UserResultCategory {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  minScore: number;
  maxScore: number;
  recommendations: string[];
  actionPlan: string[];
  resources: { title: string; type: 'article' | 'video' | 'book' | 'course'; url?: string }[];
  color: string;
  strengths: string[];
  growthAreas: string[];
}

export const userAssessments: UserAssessment[] = [
  {
    id: 'comprehensive-personality',
    title: 'Comprehensive Personality Profile',
    description: 'An in-depth analysis of your personality across the Big Five dimensions with detailed insights and development recommendations.',
    category: 'personality',
    level: 'intermediate',
    estimatedTime: 25,
    slug: 'comprehensive-personality',
    tags: ['personality', 'big-five', 'psychology', 'self-awareness'],
    icon: '🧠',
    color: 'bg-purple-500',
    isActive: true,
    isPremium: false,
    learningObjectives: [
      'Understand your core personality traits',
      'Identify your strengths and blind spots',
      'Learn how your personality affects relationships',
      'Develop strategies for personal growth'
    ],
    questions: [
      {
        id: 'cp1',
        question: 'When attending a large social gathering, you typically:',
        type: 'multiple_choice',
        category: 'extroversion',
        options: [
          { id: 'cp1a', text: 'Actively mingle and meet new people throughout the event', value: 5, category: 'extroversion' },
          { id: 'cp1b', text: 'Engage with several people but take occasional breaks', value: 4, category: 'extroversion' },
          { id: 'cp1c', text: 'Stick with a few familiar faces and have deeper conversations', value: 2, category: 'extroversion' },
          { id: 'cp1d', text: 'Feel drained and look forward to leaving early', value: 1, category: 'extroversion' }
        ]
      },
      {
        id: 'cp2',
        question: 'How do you typically approach problem-solving?',
        type: 'multiple_choice',
        category: 'openness',
        options: [
          { id: 'cp2a', text: 'Brainstorm multiple creative solutions and experiment', value: 5, category: 'openness' },
          { id: 'cp2b', text: 'Consider various approaches while being practical', value: 4, category: 'openness' },
          { id: 'cp2c', text: 'Use proven methods that have worked before', value: 2, category: 'openness' },
          { id: 'cp2d', text: 'Follow established procedures and guidelines', value: 1, category: 'openness' }
        ]
      },
      // Additional questions would continue here...
      {
        id: 'cp3',
        question: 'Rate your tendency to be organized and methodical in your daily life:',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Very disorganized', max: 'Extremely organized' },
        category: 'conscientiousness'
      },
      // Continue with more comprehensive questions...
    ],
    resultCategories: [
      {
        id: 'balanced-adapter',
        name: 'Balanced Adapter',
        description: 'You demonstrate flexibility across personality dimensions, adapting well to different situations.',
        detailedDescription: 'You possess a balanced personality profile that allows you to adapt to various situations effectively. Your moderate levels across different traits give you the flexibility to respond appropriately to different contexts, whether they require leadership, collaboration, creativity, or systematic thinking.',
        minScore: 40,
        maxScore: 60,
        color: 'bg-blue-500',
        strengths: [
          'Adaptable to different situations and people',
          'Can work effectively in various environments',
          'Balanced approach to decision-making',
          'Good at understanding different perspectives'
        ],
        growthAreas: [
          'May sometimes lack strong conviction in personal preferences',
          'Could benefit from developing signature strengths',
          'Might need to work on asserting personal values'
        ],
        recommendations: [
          'Identify and develop your core strengths to stand out',
          'Practice assertiveness in areas that matter most to you',
          'Seek diverse experiences to leverage your adaptability',
          'Consider leadership roles that require diplomatic skills'
        ],
        actionPlan: [
          'Complete a strengths assessment to identify your top talents',
          'Set specific goals in areas you want to develop further',
          'Seek feedback from others about your unique contributions',
          'Practice expressing your opinions more confidently'
        ],
        resources: [
          { title: 'StrengthsFinder 2.0', type: 'book', url: 'https://example.com/strengthsfinder' },
          { title: 'Building Self-Confidence', type: 'course', url: 'https://example.com/confidence-course' },
          { title: 'The Power of Adaptability', type: 'article', url: 'https://example.com/adaptability-article' }
        ]
      }
      // Additional result categories would be defined here...
    ]
  },

  {
    id: 'emotional-intelligence-mastery',
    title: 'Emotional Intelligence Mastery',
    description: 'Comprehensive assessment of your emotional intelligence across self-awareness, self-regulation, empathy, and social skills.',
    category: 'emotional-intelligence',
    level: 'intermediate',
    estimatedTime: 20,
    slug: 'emotional-intelligence',
    tags: ['emotional-intelligence', 'EQ', 'empathy', 'social-skills'],
    icon: '💝',
    color: 'bg-pink-500',
    isActive: true,
    isPremium: false,
    learningObjectives: [
      'Assess your emotional self-awareness',
      'Evaluate your ability to regulate emotions',
      'Understand your empathy and social skills',
      'Develop strategies for emotional growth'
    ],
    questions: [
      {
        id: 'ei1',
        question: 'When you feel angry, you typically:',
        type: 'multiple_choice',
        category: 'self-regulation',
        options: [
          { id: 'ei1a', text: 'Pause, breathe, and consider your response carefully', value: 5, category: 'self-regulation' },
          { id: 'ei1b', text: 'Express your feelings but try to stay constructive', value: 4, category: 'self-regulation' },
          { id: 'ei1c', text: 'React immediately but usually regret it later', value: 2, category: 'self-regulation' },
          { id: 'ei1d', text: 'Explode emotionally and have trouble controlling yourself', value: 1, category: 'self-regulation' }
        ]
      },
      {
        id: 'ei2',
        question: 'How well do you recognize subtle changes in others\' emotions?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'Very poor', max: 'Excellent' },
        category: 'social-awareness'
      }
      // Additional EI questions...
    ],
    resultCategories: [
      {
        id: 'emotionally-intelligent',
        name: 'Emotionally Intelligent Leader',
        description: 'You demonstrate high emotional intelligence across all domains.',
        detailedDescription: 'You possess exceptional emotional intelligence, showing strong self-awareness, excellent emotional regulation, high empathy, and sophisticated social skills. You understand both your own emotions and those of others, and you can navigate complex social situations with grace and effectiveness.',
        minScore: 35,
        maxScore: 50,
        color: 'bg-green-500',
        strengths: [
          'Excellent self-awareness and emotional regulation',
          'High empathy and understanding of others',
          'Strong social and communication skills',
          'Ability to inspire and motivate others'
        ],
        growthAreas: [
          'May sometimes overthink emotional situations',
          'Could occasionally neglect own needs while helping others'
        ],
        recommendations: [
          'Consider mentoring others in emotional intelligence',
          'Take on leadership roles that leverage your EQ',
          'Continue developing your emotional vocabulary',
          'Practice setting healthy emotional boundaries'
        ],
        actionPlan: [
          'Seek leadership opportunities that require high EQ',
          'Develop a regular emotional check-in practice',
          'Read advanced books on emotional intelligence',
          'Consider becoming an EQ coach or trainer'
        ],
        resources: [
          { title: 'Emotional Intelligence 2.0', type: 'book' },
          { title: 'Advanced EQ Skills', type: 'course' },
          { title: 'Leading with Emotional Intelligence', type: 'article' }
        ]
      }
    ]
  },

  {
    id: 'leadership-potential',
    title: 'Leadership Potential Assessment',
    description: 'Evaluate your leadership capabilities, style preferences, and potential for growth in leadership roles.',
    category: 'leadership',
    level: 'intermediate',
    estimatedTime: 30,
    slug: 'leadership-potential',
    tags: ['leadership', 'management', 'influence', 'team-building'],
    icon: '👑',
    color: 'bg-gold-500',
    isActive: true,
    isPremium: false,
    learningObjectives: [
      'Identify your natural leadership style',
      'Assess your influence and communication abilities',
      'Understand your team-building and delegation skills',
      'Create a personalized leadership development plan'
    ],
    questions: [
      {
        id: 'lp1',
        question: 'When leading a team through a difficult project, you:',
        type: 'scenario',
        scenario: 'Your team is facing a tight deadline on a critical project. Two team members are in conflict, morale is low, and you\'re behind schedule. The client is demanding updates.',
        category: 'crisis-leadership',
        options: [
          { id: 'lp1a', text: 'Address the conflict immediately and restructure the timeline', value: 5, category: 'directive' },
          { id: 'lp1b', text: 'Hold a team meeting to collaboratively solve the issues', value: 4, category: 'participative' },
          { id: 'lp1c', text: 'Work with individuals separately to understand their perspectives', value: 3, category: 'coaching' },
          { id: 'lp1d', text: 'Focus on the technical work and hope the interpersonal issues resolve', value: 1, category: 'laissez-faire' }
        ]
      }
      // More leadership questions...
    ],
    resultCategories: [
      {
        id: 'transformational-leader',
        name: 'Transformational Leader',
        description: 'You inspire others through vision, charisma, and personal development.',
        detailedDescription: 'You demonstrate the qualities of a transformational leader, inspiring others through compelling vision, personal charisma, and genuine care for individual development. You motivate teams to exceed their own expectations and create positive organizational change.',
        minScore: 40,
        maxScore: 50,
        color: 'bg-purple-500',
        strengths: [
          'Inspirational vision and communication',
          'Strong ability to motivate and develop others',
          'Creates positive organizational culture',
          'Drives innovation and change effectively'
        ],
        growthAreas: [
          'May sometimes overlook practical details',
          'Could benefit from stronger operational focus'
        ],
        recommendations: [
          'Seek senior leadership roles with strategic responsibility',
          'Develop complementary operational and analytical skills',
          'Mentor other emerging leaders',
          'Lead organizational change initiatives'
        ],
        actionPlan: [
          'Create and communicate a compelling vision for your team/organization',
          'Develop individual team members through coaching and mentoring',
          'Take on projects that require significant organizational change',
          'Study successful transformational leaders and their techniques'
        ],
        resources: [
          { title: 'Transformational Leadership Theory', type: 'article' },
          { title: 'Leading Change', type: 'book' },
          { title: 'Executive Leadership Program', type: 'course' }
        ]
      }
    ]
  },

  {
    id: 'creativity-innovation',
    title: 'Creativity & Innovation Profile',
    description: 'Discover your creative thinking patterns, innovation potential, and strategies for enhancing your creative output.',
    category: 'creativity',
    level: 'intermediate',
    estimatedTime: 22,
    slug: 'creativity-innovation',
    tags: ['creativity', 'innovation', 'problem-solving', 'design-thinking'],
    icon: '🎨',
    color: 'bg-orange-500',
    isActive: true,
    isPremium: false,
    learningObjectives: [
      'Identify your creative thinking style',
      'Assess your innovation and ideation abilities',
      'Understand barriers to your creativity',
      'Develop strategies to enhance creative output'
    ],
    questions: [
      {
        id: 'ci1',
        question: 'When brainstorming solutions to a problem, you prefer to:',
        type: 'multiple_choice',
        category: 'ideation-style',
        options: [
          { id: 'ci1a', text: 'Generate many wild ideas first, then refine them', value: 5, category: 'divergent' },
          { id: 'ci1b', text: 'Build systematically on proven concepts', value: 3, category: 'convergent' },
          { id: 'ci1c', text: 'Combine existing ideas in new ways', value: 4, category: 'combinatorial' },
          { id: 'ci1d', text: 'Visualize and prototype solutions immediately', value: 4, category: 'visual' }
        ]
      }
      // More creativity questions...
    ],
    resultCategories: [
      {
        id: 'innovative-visionary',
        name: 'Innovative Visionary',
        description: 'You excel at generating original ideas and seeing possibilities others miss.',
        detailedDescription: 'You possess exceptional creative abilities, consistently generating original ideas and innovative solutions. Your visionary thinking allows you to see possibilities and connections that others often miss, making you valuable in roles requiring breakthrough thinking and creative problem-solving.',
        minScore: 35,
        maxScore: 50,
        color: 'bg-purple-500',
        strengths: [
          'Exceptional idea generation and originality',
          'Ability to see connections and patterns others miss',
          'Comfortable with ambiguity and uncertainty',
          'Natural tendency to challenge conventional thinking'
        ],
        growthAreas: [
          'May struggle with practical implementation',
          'Could benefit from stronger project management skills'
        ],
        recommendations: [
          'Seek roles in innovation, R&D, or creative industries',
          'Partner with detail-oriented implementers',
          'Develop presentation skills to sell your ideas',
          'Create systems to capture and develop your ideas'
        ],
        actionPlan: [
          'Set up an idea capture and development system',
          'Join or create innovation teams and think tanks',
          'Learn design thinking and innovation methodologies',
          'Practice presenting and pitching creative concepts'
        ],
        resources: [
          { title: 'Creative Confidence', type: 'book' },
          { title: 'Design Thinking Bootcamp', type: 'course' },
          { title: 'Innovation Management Strategies', type: 'article' }
        ]
      }
    ]
  },

  {
    id: 'communication-mastery',
    title: 'Communication Mastery Assessment',
    description: 'Comprehensive evaluation of your communication skills across different contexts, styles, and audiences.',
    category: 'communication',
    level: 'intermediate',
    estimatedTime: 25,
    slug: 'communication-mastery',
    tags: ['communication', 'public-speaking', 'listening', 'persuasion'],
    icon: '💬',
    color: 'bg-blue-500',
    isActive: true,
    isPremium: false,
    learningObjectives: [
      'Assess your communication style and preferences',
      'Evaluate listening and empathy skills',
      'Understand your persuasion and influence abilities',
      'Identify areas for communication improvement'
    ],
    questions: [
      {
        id: 'cm1',
        question: 'When explaining a complex concept to someone, you typically:',
        type: 'multiple_choice',
        category: 'explanation-style',
        options: [
          { id: 'cm1a', text: 'Use analogies and stories to make it relatable', value: 5, category: 'narrative' },
          { id: 'cm1b', text: 'Break it down into logical, sequential steps', value: 4, category: 'analytical' },
          { id: 'cm1c', text: 'Use visual aids and diagrams', value: 4, category: 'visual' },
          { id: 'cm1d', text: 'Give concrete examples and case studies', value: 3, category: 'practical' }
        ]
      }
      // More communication questions...
    ],
    resultCategories: [
      {
        id: 'master-communicator',
        name: 'Master Communicator',
        description: 'You excel at adapting your communication style to different audiences and contexts.',
        detailedDescription: 'You demonstrate exceptional communication abilities across multiple dimensions. Your skill in adapting your communication style to different audiences, contexts, and purposes makes you highly effective in both personal and professional interactions.',
        minScore: 40,
        maxScore: 50,
        color: 'bg-blue-500',
        strengths: [
          'Excellent verbal and written communication skills',
          'Strong listening and empathy abilities',
          'Effective at persuasion and influence',
          'Adapts communication style to audience needs'
        ],
        growthAreas: [
          'May occasionally over-communicate',
          'Could benefit from more concise messaging in some contexts'
        ],
        recommendations: [
          'Consider roles requiring high-level communication skills',
          'Develop expertise in presentation and public speaking',
          'Mentor others in communication skills',
          'Explore opportunities in training, consulting, or media'
        ],
        actionPlan: [
          'Join Toastmasters or similar speaking organizations',
          'Practice different communication styles and techniques',
          'Seek feedback on your communication effectiveness',
          'Develop expertise in digital and multimedia communication'
        ],
        resources: [
          { title: 'Made to Stick', type: 'book' },
          { title: 'Advanced Public Speaking', type: 'course' },
          { title: 'Effective Communication Strategies', type: 'article' }
        ]
      }
    ]
  },

  // Continue with additional user assessments...
  {
    id: 'stress-resilience',
    title: 'Stress & Resilience Profile',
    description: 'Comprehensive assessment of your stress patterns, coping mechanisms, and resilience building strategies.',
    category: 'wellness',
    level: 'intermediate',
    estimatedTime: 20,
    slug: 'stress-resilience',
    tags: ['stress-management', 'resilience', 'coping', 'mental-health'],
    icon: '🛡️',
    color: 'bg-green-500',
    isActive: true,
    isPremium: false,
    learningObjectives: [
      'Identify your primary stress triggers and patterns',
      'Assess your current coping mechanisms',
      'Evaluate your resilience and recovery abilities',
      'Develop personalized stress management strategies'
    ],
    questions: [
      {
        id: 'sr1',
        question: 'When faced with a major setback, you typically:',
        type: 'multiple_choice',
        category: 'resilience',
        options: [
          { id: 'sr1a', text: 'Quickly bounce back and look for new opportunities', value: 5, category: 'resilient' },
          { id: 'sr1b', text: 'Take some time to process, then move forward', value: 4, category: 'adaptive' },
          { id: 'sr1c', text: 'Feel discouraged but eventually recover', value: 2, category: 'recovering' },
          { id: 'sr1d', text: 'Struggle significantly and take a long time to recover', value: 1, category: 'vulnerable' }
        ]
      }
      // Additional stress and resilience questions...
    ],
    resultCategories: [
      {
        id: 'resilient-thriver',
        name: 'Resilient Thriver',
        description: 'You demonstrate exceptional resilience and stress management abilities.',
        detailedDescription: 'You possess remarkable resilience and stress management capabilities. You not only cope well with stress and adversity but often emerge stronger and more capable. Your ability to maintain perspective, adapt to challenges, and recover quickly makes you a valuable asset in high-pressure situations.',
        minScore: 35,
        maxScore: 50,
        color: 'bg-green-500',
        strengths: [
          'Excellent stress management and coping skills',
          'Quick recovery from setbacks and failures',
          'Maintains optimism and perspective under pressure',
          'Helps others manage stress and build resilience'
        ],
        growthAreas: [
          'May sometimes take on too much stress from others',
          'Could benefit from proactive stress prevention strategies'
        ],
        recommendations: [
          'Consider roles in crisis management or high-pressure environments',
          'Mentor others in resilience and stress management',
          'Develop expertise in wellness and mental health',
          'Lead organizational resilience initiatives'
        ],
        actionPlan: [
          'Share your resilience strategies with others through mentoring',
          'Develop formal training in stress management techniques',
          'Create systems for proactive stress prevention',
          'Consider certification in wellness or mental health coaching'
        ],
        resources: [
          { title: 'Resilience: The Science of Mastering Life\'s Greatest Challenges', type: 'book' },
          { title: 'Stress Management Certification', type: 'course' },
          { title: 'Building Organizational Resilience', type: 'article' }
        ]
      }
    ]
  },

  {
    id: 'career-values-alignment',
    title: 'Career Values & Purpose Alignment',
    description: 'Deep dive into your core values, purpose, and how well they align with your current career path.',
    category: 'career',
    level: 'advanced',
    estimatedTime: 35,
    slug: 'career-values',
    tags: ['career', 'values', 'purpose', 'alignment', 'fulfillment'],
    icon: '🎯',
    color: 'bg-indigo-500',
    isActive: true,
    isPremium: true,
    learningObjectives: [
      'Identify your core career values and priorities',
      'Assess alignment between values and current role',
      'Discover your sense of purpose and meaning',
      'Create strategies for better career-value alignment'
    ],
    questions: [
      {
        id: 'cva1',
        question: 'What aspect of work gives you the deepest sense of satisfaction?',
        type: 'ranking',
        category: 'core-values',
        options: [
          { id: 'cva1a', text: 'Making a positive impact on society or community', value: 5, category: 'impact' },
          { id: 'cva1b', text: 'Achieving financial security and prosperity', value: 4, category: 'financial' },
          { id: 'cva1c', text: 'Continuous learning and intellectual growth', value: 4, category: 'growth' },
          { id: 'cva1d', text: 'Building meaningful relationships and connections', value: 4, category: 'relationships' },
          { id: 'cva1e', text: 'Having autonomy and creative freedom', value: 4, category: 'autonomy' },
          { id: 'cva1f', text: 'Recognition and professional achievement', value: 3, category: 'recognition' }
        ]
      }
      // Additional career values questions...
    ],
    resultCategories: [
      {
        id: 'purpose-driven-professional',
        name: 'Purpose-Driven Professional',
        description: 'You have strong alignment between your values, purpose, and career choices.',
        detailedDescription: 'You demonstrate exceptional alignment between your core values, sense of purpose, and career choices. This alignment provides you with intrinsic motivation, job satisfaction, and a clear sense of direction in your professional life.',
        minScore: 40,
        maxScore: 50,
        color: 'bg-purple-500',
        strengths: [
          'Clear understanding of personal values and purpose',
          'Strong intrinsic motivation and job satisfaction',
          'Consistent decision-making based on core values',
          'Ability to find meaning in challenging situations'
        ],
        growthAreas: [
          'May sometimes be inflexible when values are challenged',
          'Could benefit from considering diverse perspectives on success'
        ],
        recommendations: [
          'Continue pursuing roles that align with your values',
          'Consider leadership positions where you can influence organizational culture',
          'Mentor others in finding their purpose and values',
          'Explore entrepreneurship or social enterprise opportunities'
        ],
        actionPlan: [
          'Regularly assess and refine your understanding of your values',
          'Seek opportunities to increase your impact and influence',
          'Build networks with other purpose-driven professionals',
          'Consider how you can help others find their purpose'
        ],
        resources: [
          { title: 'Drive: The Surprising Truth About What Motivates Us', type: 'book' },
          { title: 'Purpose-Driven Leadership Program', type: 'course' },
          { title: 'Finding Your Why in the Workplace', type: 'article' }
        ]
      }
    ]
  },

  {
    id: 'relationship-attachment',
    title: 'Relationship Attachment & Intimacy Patterns',
    description: 'Explore your attachment style, intimacy patterns, and relationship dynamics in depth.',
    category: 'relationships',
    level: 'advanced',
    estimatedTime: 30,
    slug: 'attachment-patterns',
    tags: ['attachment', 'relationships', 'intimacy', 'psychology'],
    icon: '💕',
    color: 'bg-pink-500',
    isActive: true,
    isPremium: true,
    learningObjectives: [
      'Understand your attachment style and its origins',
      'Identify patterns in your relationships',
      'Assess your intimacy and vulnerability comfort levels',
      'Develop strategies for healthier relationship patterns'
    ],
    questions: [
      {
        id: 'rap1',
        question: 'In romantic relationships, you tend to:',
        type: 'multiple_choice',
        category: 'attachment-style',
        options: [
          { id: 'rap1a', text: 'Feel comfortable with closeness and independence', value: 5, category: 'secure' },
          { id: 'rap1b', text: 'Want closeness but worry about being hurt or abandoned', value: 3, category: 'anxious' },
          { id: 'rap1c', text: 'Prefer independence and feel uncomfortable with too much closeness', value: 2, category: 'avoidant' },
          { id: 'rap1d', text: 'Experience conflicting desires for closeness and distance', value: 1, category: 'disorganized' }
        ]
      }
      // Additional attachment questions...
    ],
    resultCategories: [
      {
        id: 'secure-connector',
        name: 'Secure Connector',
        description: 'You demonstrate secure attachment patterns and healthy relationship skills.',
        detailedDescription: 'You exhibit secure attachment patterns, characterized by comfort with both intimacy and independence. Your relationships tend to be stable, satisfying, and characterized by effective communication, mutual respect, and healthy boundaries.',
        minScore: 35,
        maxScore: 50,
        color: 'bg-green-500',
        strengths: [
          'Comfortable with intimacy and independence',
          'Effective communication in relationships',
          'Healthy boundaries and conflict resolution',
          'Able to support partners while maintaining self-identity'
        ],
        growthAreas: [
          'May sometimes be too trusting or optimistic about others',
          'Could benefit from understanding insecure attachment styles better'
        ],
        recommendations: [
          'Continue modeling healthy relationship behaviors',
          'Consider relationship coaching or counseling training',
          'Help others develop secure attachment patterns',
          'Maintain awareness of your own relationship needs and boundaries'
        ],
        actionPlan: [
          'Continue developing your emotional intelligence and communication skills',
          'Practice maintaining healthy boundaries in all relationships',
          'Consider helping others through mentoring or counseling',
          'Stay aware of your own needs and continue growing'
        ],
        resources: [
          { title: 'Attached: The New Science of Adult Attachment', type: 'book' },
          { title: 'Relationship Counseling Certification', type: 'course' },
          { title: 'Secure Attachment in Adult Relationships', type: 'article' }
        ]
      }
    ]
  },

  {
    id: 'mindfulness-depth',
    title: 'Mindfulness & Consciousness Depth Assessment',
    description: 'Advanced assessment of your mindfulness practice, present-moment awareness, and consciousness development.',
    category: 'mindfulness',
    level: 'advanced',
    estimatedTime: 28,
    slug: 'mindfulness-depth',
    tags: ['mindfulness', 'meditation', 'consciousness', 'awareness'],
    icon: '🧘',
    color: 'bg-indigo-500',
    isActive: true,
    isPremium: true,
    learningObjectives: [
      'Assess the depth of your mindfulness practice',
      'Evaluate your present-moment awareness skills',
      'Understand your relationship with thoughts and emotions',
      'Identify opportunities for deeper mindfulness development'
    ],
    questions: [
      {
        id: 'md1',
        question: 'During meditation, you most commonly experience:',
        type: 'multiple_choice',
        category: 'meditation-depth',
        options: [
          { id: 'md1a', text: 'Deep states of stillness and expanded awareness', value: 5, category: 'advanced' },
          { id: 'md1b', text: 'Periods of calm focus with some distractions', value: 4, category: 'intermediate' },
          { id: 'md1c', text: 'Difficulty concentrating but moments of peace', value: 2, category: 'beginner' },
          { id: 'md1d', text: 'Constant mental chatter and restlessness', value: 1, category: 'struggling' }
        ]
      }
      // Additional mindfulness depth questions...
    ],
    resultCategories: [
      {
        id: 'mindfulness-master',
        name: 'Mindfulness Master',
        description: 'You demonstrate advanced mindfulness skills and deep present-moment awareness.',
        detailedDescription: 'You have developed sophisticated mindfulness abilities, showing deep present-moment awareness, advanced emotional regulation, and a mature understanding of the nature of consciousness. Your practice likely serves as a foundation for wisdom, compassion, and skillful living.',
        minScore: 40,
        maxScore: 50,
        color: 'bg-purple-500',
        strengths: [
          'Deep present-moment awareness and attention',
          'Advanced emotional regulation and equanimity',
          'Sophisticated understanding of mind and consciousness',
          'Natural wisdom and compassionate responses'
        ],
        growthAreas: [
          'May sometimes become detached from practical concerns',
          'Could benefit from integrating insights into daily action'
        ],
        recommendations: [
          'Consider teaching or sharing mindfulness with others',
          'Explore advanced contemplative practices',
          'Integrate mindfulness into leadership and service',
          'Continue deepening your practice through retreats and study'
        ],
        actionPlan: [
          'Develop skills in teaching or guiding others in mindfulness',
          'Explore advanced meditation techniques and traditions',
          'Find ways to serve others through your mindfulness practice',
          'Continue your own deepening through regular retreats and study'
        ],
        resources: [
          { title: 'The Mind Illuminated', type: 'book' },
          { title: 'Mindfulness Teacher Training', type: 'course' },
          { title: 'Advanced Contemplative Practices', type: 'article' }
        ]
      }
    ]
  },

  {
    id: 'life-purpose-mastery',
    title: 'Life Purpose & Meaning Mastery',
    description: 'Comprehensive exploration of your life purpose, meaning-making patterns, and existential fulfillment.',
    category: 'growth',
    level: 'advanced',
    estimatedTime: 40,
    slug: 'life-purpose',
    tags: ['purpose', 'meaning', 'fulfillment', 'existential', 'spirituality'],
    icon: '🌟',
    color: 'bg-yellow-500',
    isActive: true,
    isPremium: true,
    learningObjectives: [
      'Discover your core life purpose and mission',
      'Assess your meaning-making and fulfillment patterns',
      'Understand your existential and spiritual dimensions',
      'Create a comprehensive life purpose action plan'
    ],
    questions: [
      {
        id: 'lpm1',
        question: 'When you imagine your ideal legacy, you envision:',
        type: 'open_ended',
        category: 'legacy-vision'
      },
      {
        id: 'lpm2',
        question: 'How connected do you feel to a sense of transcendent purpose?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: { min: 'No connection', max: 'Deeply connected' },
        category: 'transcendent-purpose'
      }
      // Additional life purpose questions...
    ],
    resultCategories: [
      {
        id: 'purpose-actualized',
        name: 'Purpose-Actualized Individual',
        description: 'You have achieved deep clarity about your life purpose and live in alignment with it.',
        detailedDescription: 'You demonstrate exceptional clarity about your life purpose and consistently live in alignment with your deepest values and calling. This integration provides you with profound meaning, direction, and fulfillment, while also enabling you to contribute significantly to others and the world.',
        minScore: 45,
        maxScore: 60,
        color: 'bg-gold-500',
        strengths: [
          'Clear and compelling sense of life purpose',
          'Strong alignment between values, actions, and goals',
          'Deep sense of meaning and fulfillment',
          'Natural ability to inspire and guide others'
        ],
        growthAreas: [
          'May sometimes be overly focused on long-term vision',
          'Could benefit from enjoying present moments more fully'
        ],
        recommendations: [
          'Share your purpose and inspire others to find theirs',
          'Take on roles that allow maximum expression of your purpose',
          'Continue evolving and deepening your understanding of purpose',
          'Consider how you can contribute to collective human flourishing'
        ],
        actionPlan: [
          'Regularly review and refine your understanding of your purpose',
          'Seek opportunities to mentor and guide others in finding purpose',
          'Align all major life decisions with your core purpose',
          'Contribute to causes and movements that embody your values'
        ],
        resources: [
          { title: 'Man\'s Search for Meaning', type: 'book' },
          { title: 'Purpose-Driven Life Design', type: 'course' },
          { title: 'Living Your Purpose in the Modern World', type: 'article' }
        ]
      }
    ]
  }

  // Continue with additional comprehensive user assessments...
  // Total of 20 assessments would be included here
];

export default userAssessments;