// Production-ready enhanced assessment data with 10-15+ questions each
// Fixed and optimized for the current system architecture

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  options?: string[];
  scale?: { min: number; max: number; labels: string[] };
  category?: string;
  value?: number; // For scoring
  maxScore?: number; // Maximum score for this question
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
    interpretation?: Record<string, string>;
    weights?: Record<string, number>;
  };
  results: {
    summary: string;
    insights: string[];
    recommendations: string[];
    aiAnalysis?: AIAnalysis;
  };
  createdBy?: string;
  difficulty?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Enhanced Personality Assessment with 15 questions - FIXED VERSION
export const enhancedPersonalityAssessment: Assessment = {
  id: 'personality-basics',
  title: 'Personality Discovery',
  description: 'Discover your core personality traits and understand what makes you unique',
  type: 'personality',
  category: 'self-discovery',
  visibility: 'public',
  estimatedTime: 8,
  questions: [
    {
      id: 'p1',
      text: 'In social situations, you tend to:',
      type: 'single',
      options: ['Initiate conversations with new people', 'Wait for others to approach you', 'Prefer small groups over large gatherings', 'Avoid social situations when possible'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p2',
      text: 'When making decisions, you primarily rely on:',
      type: 'single',
      options: ['Logic and objective analysis', 'Your gut feelings and intuition', 'Input from trusted friends/family', 'Practical considerations and past experiences'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p3',
      text: 'Your ideal weekend involves:',
      type: 'single',
      options: ['Adventure and new experiences', 'Relaxation and quiet time', 'Socializing with friends', 'Productive activities and learning'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p4',
      text: 'When faced with unexpected changes, you:',
      type: 'single',
      options: ['Embrace the change enthusiastically', 'Feel anxious but adapt quickly', 'Need time to process and adjust', 'Prefer to stick to original plans'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p5',
      text: 'In group projects, you naturally take on the role of:',
      type: 'single',
      options: ['The leader coordinating the team', 'The creative contributor generating ideas', 'The detail-oriented organizer', 'The supportive mediator between team members'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p6',
      text: 'When learning something new, you prefer to:',
      type: 'single',
      options: ['Read about it thoroughly first', 'Jump in and figure it out hands-on', 'Listen to explanations and ask questions', 'Watch others demonstrate and then copy'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p7',
      text: 'Your workspace is typically:',
      type: 'single',
      options: ['Highly organized and structured', 'Cluttered but you know where everything is', 'Minimalist and clean', 'Personalized with many personal touches'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p8',
      text: 'When giving feedback, you focus on:',
      type: 'single',
      options: ['Constructive criticism to improve performance', 'Encouragement and positive reinforcement', 'Fair and balanced assessment', 'Specific facts and evidence'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p9',
      text: 'In arguments, you react by:',
      type: 'single',
      options: ['Staying calm and addressing the issues logically', 'Becoming emotional and defending your position', 'Trying to understand the other viewpoint', 'Avoiding confrontation if possible'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p10',
      text: 'Your approach to planning is:',
      type: 'single',
      options: ['Detailed planning well in advance', 'Flexible planning with room for changes', 'Minimal planning, preferring spontaneity', 'Planning only the essential elements'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p11',
      text: 'Rate your comfort with uncertainty:',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very comfortable'] },
      value: 1,
      maxScore: 5
    },
    {
      id: 'p12',
      text: 'When you complete a task, you feel most satisfied by:',
      type: 'single',
      options: ['The process and learning experience', 'Achieving the results and meeting goals', 'Helping others who benefit from your work', 'Creating something innovative or different'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p13',
      text: 'In your relationships, you tend to be:',
      type: 'single',
      options: ['Loyal and committed to long-term connections', 'Flexible and open to new friendships easily', 'Selective and careful about who you let in', 'Warm and inclusive with most people you meet'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p14',
      text: 'When faced with criticism, your first reaction is:',
      type: 'single',
      options: ['To defend yourself and explain your position', 'To feel hurt and withdraw for a time', 'To analyze what you might learn from it', 'To discuss it openly to understand all perspectives'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'p15',
      text: 'Your attitude toward rules and procedures is:',
      type: 'single',
      options: ['I appreciate structure and clear guidelines', 'I often question rules and look for better ways', 'I follow rules when they make sense, bend them when they don\'t', 'I prefer freedom and dislike rigid procedures'],
      value: 1,
      maxScore: 4
    }
  ],
  scoring: {
    type: 'personality',
    categories: ['Extraversion', 'Intuition', 'Feeling', 'Perceiving'],
    interpretation: {
      'high-extraversion': 'Energized by social interaction and thrive in stimulating environments',
      'low-extraversion': 'Prefer quiet, solitary activities and need time alone to recharge',
      'high-intuition': 'Focus on future possibilities and innovative ideas',
      'low-intuition': 'Grounded in present realities and practical details',
      'high-feeling': 'Prioritize harmony, relationships, and empathetic understanding',
      'low-feeling': 'Emphasize logic, objectivity, and systematic decision-making',
      'high-perceiving': 'Flexible, spontaneous, and enjoy keeping options open',
      'low-perceiving': 'Structured, organized, and prefer clear plans and schedules'
    }
  },
  results: {
    summary: 'Your personality profile reveals your natural preferences in how you interact with the world, process information, make decisions, and organize your life.',
    insights: [
      'Understanding your personality type helps you leverage your natural strengths',
      'Recognize situations where you thrive versus where you need to adapt your approach',
      'Develop communication strategies that work better with different personality types',
      'Use your natural preferences as a guide for personal and career development'
    ],
    recommendations: [
      'Take our full 16-personality assessment for deeper insights into your unique traits',
      'Explore career paths that align with your personality strengths and preferences',
      'Learn communication strategies tailored for different personality types',
      'Consider how your personality affects team dynamics and leadership styles'
    ],
    aiAnalysis: {
      insights: [
        'Your responses show distinct patterns in social engagement, decision-making processes, and adaptation to change',
        'Learning preferences indicate a preferred cognitive processing style that optimizes information retention',
        'Work style patterns suggest natural approaches to organization, planning, and problem-solving',
        'Interpersonal dynamics reveal relationship preferences and communication tendencies',
        'Stress response patterns demonstrate coping mechanisms and resilience strategies',
        'Time management preferences indicate natural approaches to scheduling and productivity',
        'Feedback processing suggests how you handle criticism and external input'
      ],
      recommendations: [
        'Leverage your dominant personality traits in roles that allow natural expression of these preferences',
        'Develop flexibility in less dominant areas by consciously practicing alternative approaches',
        'Build relationships by recognizing and adapting to different personality styles in others',
        'Use self-awareness to proactively manage situations that might trigger less constructive patterns',
        'Create environments that support your natural energy patterns and cognitive preferences',
        'Seek growth opportunities in personality areas that could enhance overall life satisfaction',
        'Consider how your personality influences feedback processing and relationship dynamics'
      ],
      summary: 'Your comprehensive personality profile reveals a complex individual with clear preferences and patterns. The analysis shows someone with well-developed self-awareness who generally operates from a place of strength in their dominant traits. Opportunities for growth exist in expanding flexibility within less dominant areas, which could enhance overall adaptability and interpersonal effectiveness. This profile suggests high potential for personal and professional development when operating within supportive environments that align with core preferences while encouraging measured expansion beyond comfort zones.'
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Enhanced Decision Making Assessment with 13 questions - FIXED VERSION
export const enhancedDecisionMakingAssessment: Assessment = {
  id: 'decision-making-style',
  title: 'Decision Making Style Assessment',
  description: 'Discover how you make decisions and where you can improve your process',
  type: 'cognitive',
  category: 'personal-development',
  visibility: 'public',
  estimatedTime: 6,
  questions: [
    {
      id: 'dm1',
      text: 'When faced with a major decision, your first step is usually:',
      type: 'single',
      options: ['Research all available information extensively', 'Trust your initial gut feeling or instinct', 'Discuss the options with trusted friends/family', 'Make a quick decision and adjust as needed'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'dm2',
      text: 'When gathering information for a decision, you are most likely to:',
      type: 'single',
      options: ['Focus on data, facts, and logical analysis', 'Consider how the decision will affect various people', 'Seek quick, practical solutions that work', 'Explore creative alternatives and possibilities'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'dm3',
      text: 'Your biggest decision-making challenge is:',
      type: 'single',
      options: ['Getting stuck in analysis paralysis', 'Making impulsive choices I later regret', 'Being overly influenced by others\' opinions', 'Putting off decisions as long as possible'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'dm4',
      text: 'When you make a decision, you feel most confident when:',
      type: 'single',
      options: ['You have thoroughly analyzed all the pros and cons', 'Your choice aligns with your core values and feelings', 'The decision is practical and immediately actionable', 'You have support from people you trust'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'dm5',
      text: 'In group decisions, you typically play the role of:',
      type: 'single',
      options: ['The analyst who researches and presents facts', 'The mediator who considers everyone\'s feelings', 'The practical guide who moves things forward', 'The visionary who proposes innovative solutions'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'dm6',
      text: 'After making a difficult decision, you most likely:',
      type: 'single',
      options: ['Second-guess yourself and analyze what you might have missed', 'Move forward confidently with your choice', 'Seek validation from others who support the decision', 'Feel immediately relieved and ready to proceed'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'dm7',
      text: 'When unexpected obstacles arise with your decision, you tend to:',
      type: 'single',
      options: ['Re-evaluate and analyze the impact on your overall strategy', 'Communicate openly and seek support from others', 'Adapt quickly and find practical solutions', 'Stay committed to your original plan despite challenges'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'dm8',
      text: 'Rate your comfort level with making decisions under time pressure:',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very uncomfortable - I panic under pressure', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very comfortable - I thrive under pressure'] },
      value: 1,
      maxScore: 5
    },
    {
      id: 'dm9',
      text: 'You make your best decisions when you have:',
      type: 'single',
      options: ['Complete information and time to process it all', 'Input from others but the final call is yours', 'Clear criteria and practical constraints', 'Freedom to be creative and think outside the box'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'dm10',
      text: 'When presented with too many choices, you tend to:',
      type: 'single',
      options: ['Analyze all options systematically to find the best one', 'Narrow it down quickly to avoid overwhelm', 'Seek advice to help choose between options', 'Feel energized and create new alternatives'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'dm11',
      text: 'Your decision-making approach in your career is most influenced by:',
      type: 'single',
      options: ['Career advancement and professional growth', 'Work-life balance and personal fulfillment', 'Practical financial and security considerations', 'Creativity and innovation opportunities'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'dm12',
      text: 'Rate your satisfaction with your usual decision-making outcomes:',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very dissatisfied - Often regret decisions', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied - Usually make good choices'] },
      value: 1,
      maxScore: 5
    },
    {
      id: 'dm13',
      text: 'When you learn from past decisions, you are most likely to focus on:',
      type: 'single',
      options: ['Improvements to your analysis and research process', 'Better understanding of your emotions and intuition', 'More practical approaches and quicker implementation', 'Different approaches and creative alternatives'],
      value: 1,
      maxScore: 4
    }
  ],
  scoring: {
    type: 'categorical',
    categories: ['Analytical', 'Intuitive', 'Dependent', 'Avoidant'],
    interpretation: {
      'Analytical': 'Thorough, systematic and data-driven decision-maker who may over-analyze',
      'Intuitive': 'Fast, instinct-led decisions that can miss important details',
      'Dependent': 'Values input from others but may struggle with independent decisions',
      'Avoidant': 'Tendency to delay decisions which may create missed opportunities'
    }
  },
  results: {
    summary: 'Your decision-making style affects your confidence, speed, and satisfaction with choices across all areas of life.',
    insights: [
      'No decision-making style is inherently better - each has strengths and challenges',
      'Awareness of your style helps you compensate for blind spots',
      'Different situations may call for different approaches',
      'Effective decision-making combines multiple styles strategically'
    ],
    recommendations: [
      'Learn effective frameworks for your decision-making style',
      'Practice decision-making in low-stakes situations to build confidence',
      'Explore our critical thinking and decision-making courses',
      'Consider creating a personal decision-making toolkit'
    ],
    aiAnalysis: {
      insights: [
        'Your decision-making patterns reveal consistent approaches to information gathering and analysis',
        'Emotional processing during decisions indicates your comfort with uncertainty',
        'Information-seeking behaviors suggest preferred cognitive processing style',
        'Follow-through tendencies demonstrate commitment to implementation',
        'Learning patterns from past decisions indicate self-reflection capabilities',
        'Time pressure responses reveal decision-making resilience',
        'Group dynamics preferences suggest collaboration style in shared decisions'
      ],
      recommendations: [
        'Build complementary decision-making skills in your less dominant areas',
        'Create a personal decision framework that leverages your strengths',
        'Practice mindful decision-making to reduce impulsive or avoidant tendencies',
        'Develop strategies for quick decisions while maintaining analytical rigor',
        'Use technology tools to support your preferred decision-making style',
        'Seek mentorship for complex decisions beyond your comfort zone',
        'Establish regular review processes to learn from decision outcomes'
      ],
      summary: 'Your decision-making profile reveals a thoughtful approach with room for development in confidence and consistency. While you demonstrate strengths in your primary style, building flexibility across different decision-making approaches will enhance your overall effectiveness. The analysis shows potential for growth in speed, collaboration, and risk assessment, which could significantly improve your personal and professional outcomes.'
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Enhanced Communication Style Assessment with 11 questions - FIXED VERSION
export const enhancedCommunicationAssessment: Assessment = {
  id: 'communication-style',
  title: 'Communication Style Assessment',
  description: 'Understand how you communicate and connect with others effectively',
  type: 'communication',
  category: 'social-skills',
  visibility: 'public',
  estimatedTime: 7,
  questions: [
    {
      id: 'c1',
      text: 'When explaining something complex, you tend to:',
      type: 'single',
      options: ['Use lots of details and examples for clarity', 'Focus on the main points and big picture', 'Make it conversational and ask for questions', 'Use analogies and make it engaging'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'c2',
      text: 'Your preferred way of handling difficult conversations is:',
      type: 'single',
      options: ['Direct and to the point to address the issue quickly', 'Gentle and empathetic to maintain relationships', 'Analytical, focusing on facts and solutions', 'Humorous or light-hearted to reduce tension'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'c3',
      text: 'When you receive feedback, you are most likely to:',
      type: 'single',
      options: ['Ask for specific examples to understand better', 'Feel hurt but try to see the positive intent', 'Analyze how to apply it practically', 'Defend your perspective immediately'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'c4',
      text: 'In group discussions, your typical contribution is:',
      type: 'single',
      options: ['Detailed analysis and well-thought-out opinions', 'Building consensus and including everyone\'s view', 'Practical advice and solutions', 'Creative ideas and different perspectives'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'c5',
      text: 'When someone is upset, your communication focus is on:',
      type: 'single',
      options: ['Understanding the facts of what happened', 'Empathizing with their feelings and emotions', 'Finding practical solutions to resolve it', 'Lightening the mood and changing the subject'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'c6',
      text: 'Rate how comfortable you are with public speaking:',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very uncomfortable and avoid at all costs', 'Uncomfortable but can manage', 'Neutral', 'Comfortable and enjoy when prepared', 'Very comfortable and enjoy speaking'] },
      value: 1,
      maxScore: 5
    },
    {
      id: 'c7',
      text: 'Your writing style in emails and messages tends to be:',
      type: 'single',
      options: ['Comprehensive and detailed with all necessary information', 'Warm and personable with emojis and friendly language', 'Direct and concise with clear action items', 'Creative and engaging with unique expressions'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'c8',
      text: 'When you disagree with someone, you typically:',
      type: 'single',
      options: ['Present logical evidence to support your view', 'Try to see their perspective and find common ground', 'Suggest practical compromises that work for both', 'Use humor or lighten the mood to reduce tension'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'c9',
      text: 'Your listening style is best described as:',
      type: 'single',
      options: ['Active listener who asks clarifying questions and summarizes', 'Empathetic listener who focuses on understanding feelings', 'Attentive listener who looks for key points and next steps', 'Reflective listener who connects to their own experiences'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'c10',
      text: 'In professional settings, you communicate to:',
      type: 'single',
      options: ['Demonstrate expertise and provide thoughtful analysis', 'Build rapport and create positive work relationships', 'Achieve results and advance towards goals', 'Innovate and share creative ideas and solutions'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'c11',
      text: 'Rate your overall confidence in expressing your thoughts and opinions:',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very shy and rarely express opinions', 'Shy but can express when necessary', 'Neutral', 'Generally confident in communication', 'Very confident and expressive'] },
      value: 1,
      maxScore: 5
    }
  ],
  scoring: {
    type: 'categorical',
    categories: ['Analytical', 'Amiable', 'Driver', 'Expressive'],
    interpretation: {
      'Analytical': 'Detailed, systematic, and thoughtful communicator who values accuracy',
      'Amiable': 'Warm, relationship-focused, and harmony-seeking in interactions',
      'Driver': 'Direct, results-oriented, and confident in decision-making communication',
      'Expressive': 'Enthusiastic, creatively-minded, and socially engaging communicator'
    }
  },
  results: {
    summary: 'Your communication style influences how effectively you connect with others, resolve conflicts, and share ideas.',
    insights: [
      'Different situations and people require different communication approaches',
      'Flexibility in communication style improves relationship quality',
      'Understanding others\' communication styles prevents misunderstandings',
      'Self-awareness of your style leads to better communication effectiveness'
    ],
    recommendations: [
      'Learn to adapt your communication style to different audiences and situations',
      'Explore active listening and empathy skills for better relationships',
      'Take our advanced communication skills course',
      'Practice communication techniques for professional and personal settings'
    ],
    aiAnalysis: {
      insights: [
        'Your communication patterns reveal preferred interpersonal interaction styles',
        'Language choices indicate comfort with emotion and vulnerability',
        'Conflict resolution communication suggests relationship preservation priorities',
        'Group interaction preferences demonstrate social engagement approaches',
        'Writing and speaking style differences reveal digital vs. interpersonal preferences',
        'Feedback processing indicates comfort with criticism and improvement'
      ],
      recommendations: [
        'Develop communication flexibility to handle diverse audiences and situations',
        'Practice assertive communication to balance honesty with tact',
        'Build confidence in speaking by starting with supportive audiences',
        'Use active listening techniques to improve understanding and empathy',
        'Adapt communication style to feedback patterns for better relationships',
        'Create personalized communication strategies for different contexts',
        'Seek feedback on communication effectiveness from trusted sources'
      ],
      summary: 'Your communication profile reveals someone with strong natural skills in their preferred areas, but with room to develop flexibility across different contexts. The analysis shows clear communication strengths that can serve as a foundation for building more adaptable and effective interpersonal skills. Focus on understanding others\' communication styles and consciously flexing your approach could significantly enhance relationship quality and professional effectiveness.'
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Enhanced Life Balance Assessment with 12 questions - FIXED VERSION
export const enhancedLifeBalanceAssessment: Assessment = {
  id: 'life-balance-check',
  title: 'Life Balance Assessment',
  description: 'Evaluate your current life balance across key areas',
  type: 'lifestyle',
  category: 'well-being',
  visibility: 'public',
  estimatedTime: 8,
  questions: [
    {
      id: 'l1',
      text: 'Rate your satisfaction with your career/professional life:',
      type: 'scale',
      scale: { min: 1, max: 10, labels: ['Very dissatisfied', '', '', '', 'Neutral', '', '', '', '', 'Very satisfied'] },
      value: 1,
      maxScore: 10
    },
    {
      id: 'l2',
      text: 'How would you rate your physical health and fitness?',
      type: 'scale',
      scale: { min: 1, max: 10, labels: ['Very poor', '', '', '', 'Average', '', '', '', '', 'Excellent'] },
      value: 1,
      maxScore: 10
    },
    {
      id: 'l3',
      text: 'Rate the quality of your relationships:',
      type: 'scale',
      scale: { min: 1, max: 10, labels: ['Very poor', '', '', '', 'Average', '', '', '', '', 'Excellent'] },
      value: 1,
      maxScore: 10
    },
    {
      id: 'l4',
      text: 'How fulfilled do you feel personally/spiritually?',
      type: 'scale',
      scale: { min: 1, max: 10, labels: ['Very unfulfilled', '', '', '', 'Neutral', '', '', '', '', 'Very fulfilled'] },
      value: 1,
      maxScore: 10
    },
    {
      id: 'l5',
      text: 'How well do you maintain boundaries between work and personal life?',
      type: 'single',
      options: ['Very well - clear separation', 'Generally well but sometimes blurred', 'Sometimes check work emails outside hours', 'Poor boundaries - always connected to work', 'No boundaries whatsoever'],
      value: 1,
      maxScore: 5
    },
    {
      id: 'l6',
      text: 'Rate your energy levels throughout the day:',
      type: 'scale',
      scale: { min: 1, max: 10, labels: ['Constant fatigue', '', '', '', 'Variable energy', '', '', '', '', 'High and consistent energy'] },
      value: 1,
      maxScore: 10
    },
    {
      id: 'l7',
      text: 'How often do you engage in meaningful hobbies or leisure activities?',
      type: 'single',
      options: ['Daily or almost daily', 'A few times a week', 'Once a week', 'A few times a month', 'Rarely or never'],
      value: 1,
      maxScore: 5
    },
    {
      id: 'l8',
      text: 'Rate your ability to say no to requests that overcommit you:',
      type: 'scale',
      scale: { min: 1, max: 10, labels: ['Always say yes despite overcommitment', '', '', '', 'Sometimes say no', '', '', '', '', 'Confidently set limits'] },
      value: 1,
      maxScore: 10
    },
    {
      id: 'l9',
      text: 'How do you typically spend your downtime?',
      type: 'single',
      options: ['Relaxation and restoration activities', 'Household chores and errands', 'Social media and casual internet browsing', 'Learning or skill development', 'Pursuing creative interests'],
      value: 1,
      maxScore: 5
    },
    {
      id: 'l10',
      text: 'Rate your sleep quality and duration:',
      type: 'scale',
      scale: { min: 1, max: 10, labels: ['Poor quality and insufficient', '', '', '', 'Adequate but could be better', '', '', '', '', 'Excellent quality and duration'] },
      value: 1,
      maxScore: 10
    },
    {
      id: 'l11',
      text: 'How often do you experience work-life conflict?',
      type: 'single',
      options: ['Never or very rarely', 'Occasionally', 'Sometimes', 'Often', 'Daily - constant tension'],
      value: 1,
      maxScore: 5
    },
    {
      id: 'l12',
      text: 'Rate your overall sense of purpose and direction in life:',
      type: 'scale',
      scale: { min: 1, max: 10, labels: ['No clear purpose', '', '', '', 'Some direction but unclear', '', '', '', '', 'Strong sense of purpose'] },
      value: 1,
      maxScore: 10
    }
  ],
  scoring: {
    type: 'categorical',
    categories: ['Career/Finance', 'Health/Wellness', 'Relationships/Social', 'Personal Growth/Spirituality'],
    interpretation: {
      'high-balance': 'Well-balanced across life areas with sustainable lifestyle patterns',
      'career-focus': 'Strong in career and professional achievement, may need attention to other areas',
      'health-focus': 'Good health habits and physical well-being, consider other life areas',
      'relationship-focus': 'Strong social connections, balance professional and personal growth',
      'growth-focus': 'Personal development focus, consider practical life areas like career and health'
    }
  },
  results: {
    summary: 'Your life balance assessment reveals which areas are thriving and which may need more attention to create a more fulfilling life.',
    insights: [
      'Imbalance in one area often affects other areas of life',
      'Small improvements in low-scoring areas can create significant positive impact',
      'Balance doesn\'t mean equal time in each area, but appropriate attention to each',
      'Regular assessment and adjustment leads to better overall well-being'
    ],
    recommendations: [
      'Focus on your lowest-scoring area with small daily actions',
      'Explore our goal-setting and habit formation tools',
      'Consider our life coaching programs for personalized balance strategies',
      'Learn techniques for setting healthy boundaries and saying no'
    ],
    aiAnalysis: {
      insights: [
        'Your energy patterns reveal how lifestyle factors affect daily performance',
        'Boundary-setting capabilities indicate how well you protect personal time',
        'Work-life interaction patterns show the effectiveness of current balance strategies',
        'Leisure activity preferences suggest how you naturally replenish and find joy',
        'Sleep quality correlations point to underlying health and stress factors',
        'Purpose alignment indicates the degree of personal fulfillment you\'re experiencing'
      ],
      recommendations: [
        'Develop a personalized life balance routine that matches your energy patterns',
        'Practice boundary-setting skills to protect time and energy across life domains',
        'Create intentional downtime activities that truly replenish your energy',
        'Address work-life conflicts through proactive scheduling and communication',
        'Build purpose-driven activities that provide deeper life satisfaction',
        'Consider professional coaching for complex balance challenges',
        'Track your life areas regularly to maintain sustainable balance over time'
      ],
      summary: 'Your life balance analysis reveals a complex interplay of professional responsibilities, personal well-being, and life satisfaction. The assessment shows that while some areas may be thriving, the key to sustainable happiness lies in addressing imbalances proactively. Small, consistent adjustments in lower-scoring areas can create ripple effects throughout your entire lifestyle, leading to improved energy, better relationships, and greater overall fulfillment.'
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Enhanced Relationship Assessment with 14 questions - FIXED VERSION
export const enhancedRelationshipAssessment: Assessment = {
  id: 'relationship-style',
  title: 'Relationship Attachment Style',
  description: 'Understand your patterns in relationships and how you connect with others',
  type: 'relationships',
  category: 'relationships',
  visibility: 'public',
  estimatedTime: 7,
  questions: [
    {
      id: 'r1',
      text: 'When your partner needs space, you tend to:',
      type: 'single',
      options: ['Feel relieved and enjoy the independence', 'Feel anxious and worry about the relationship', 'Respect their needs while staying connected', 'Get angry or try to change their mind'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r2',
      text: 'In arguments, you typically:',
      type: 'single',
      options: ['Withdraw and need time alone', 'Pursue resolution immediately', 'Seek compromise and understanding', 'Escalate the conflict'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r3',
      text: 'Your biggest relationship fear is:',
      type: 'single',
      options: ['Losing your independence', 'Being abandoned or rejected', 'Conflict and disharmony', 'Not being good enough'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r4',
      text: 'How do you show affection?',
      type: 'single',
      options: ['Through words of affirmation and verbal appreciation', 'Through acts of service and doing things for others', 'Through quality time and focused attention', 'Through physical touch and closeness'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r5',
      text: 'When you feel hurt by your partner, you:',
      type: 'single',
      options: ['Express it clearly and discuss it calmly', 'Withdraw and process it internally', 'Seek reassurance through frequent communication', 'Become defensive and counter-attack'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r6',
      text: 'Your ideal balance in a relationship is:',
      type: 'single',
      options: ['High independence with occasional connection', 'Deep intimacy and constant closeness', 'Balanced interdependence with healthy boundaries', 'Flexible based on the situation'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r7',
      text: 'When making important relationship decisions, you:',
      type: 'single',
      options: ['Decide independently and seek agreement', 'Discuss thoroughly and decide together', 'Base decisions on maintaining harmony', 'Move forward confidently and explain reasoning'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r8',
      text: 'Rate your trust in relationship partners:',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very cautious about trust', 'Slow to trust', 'Neutral', 'Generally trusting', 'Very trusting'] },
      value: 1,
      maxScore: 5
    },
    {
      id: 'r9',
      text: 'How do you respond to a partner\'s success?',
      type: 'single',
      options: ['Genuinely happy and supportive', 'Feel happy but slightly envious', 'Neutral or disinterested', 'Use it as motivation for myself'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r10',
      text: 'Your approach to relationship conflict is:',
      type: 'single',
      options: ['Avoid conflict at all costs', 'Address issues immediately when they arise', 'Save conflicts for important matters only', 'See conflict as growth opportunities'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r11',
      text: 'In terms of relationship values, you prioritize:',
      type: 'single',
      options: ['Personal freedom and autonomy', 'Deep emotional connection and intimacy', 'Mutual respect and shared responsibility', 'Adventure and growth together'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r12',
      text: 'When you\'re stressed, you need from your partner:',
      type: 'single',
      options: ['Space to process alone', 'Emotional support and reassurance', 'Practical help with tasks', 'Distraction and fun activities'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r13',
      text: 'Your ideal relationship communication style is:',
      type: 'single',
      options: ['Direct and to the point', 'Gentle and diplomatic', 'Deep and emotional', 'Practical and solution-focused'],
      value: 1,
      maxScore: 4
    },
    {
      id: 'r14',
      text: 'Rate your comfort with vulnerability in relationships:',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very uncomfortable being vulnerable', 'Uncomfortable', 'Sometimes comfortable', 'Generally comfortable', 'Very comfortable and open'] },
      value: 1,
      maxScore: 5
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
      'Different styles can complement each other with understanding',
      'Self-awareness is the first step in relationship growth'
    ],
    recommendations: [
      'Take our full relationship compatibility assessment',
      'Explore communication strategies for your attachment style',
      'Learn about healthy boundaries and relationship skills',
      'Consider how your style affects your relationship patterns'
    ],
    aiAnalysis: {
      insights: [
        'Your attachment patterns reveal core emotional needs and fears about relationships',
        'Communication preferences suggest how you process and express emotions',
        'Conflict resolution style indicates your approach to relationship challenges',
        'Trust patterns influence the depth and pace of relationship development',
        'Independence/interdependence balance affects relationship satisfaction',
        'Vulnerability comfort level predicts emotional intimacy potential'
      ],
      recommendations: [
        'Recognize your attachment triggers and develop healthy responses',
        'Communicate your emotional needs clearly to partners',
        'Practice the art of secure attachment behaviors',
        'Address fears that may stem from past relationship experiences',
        'Build healthy boundaries that protect your emotional well-being',
        'Consider couples counseling for deeper relationship dynamics',
        'Focus on personal growth to develop more secure attachment patterns'
      ],
      summary: 'Your relationship attachment style reveals a complex interplay of security needs, emotional patterns, and interpersonal dynamics. The analysis shows that while certain patterns may create challenges, understanding these tendencies opens the door to conscious relationship choices. With awareness and effort, attachment styles can evolve, leading to healthier, more fulfilling partnerships that meet your emotional needs while allowing for genuine connection and intimacy.'
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Enhanced Stress Assessment with 10 questions - FIXED VERSION
export const enhancedStressAssessment: Assessment = {
  id: 'stress-level-check',
  title: 'Stress Level Assessment',
  description: 'Quick check-in to understand your current stress levels and triggers',
  type: 'wellness',
  category: 'mental-health',
  visibility: 'public',
  estimatedTime: 5,
  questions: [
    {
      id: 's1',
      text: 'Over the past week, how often have you felt overwhelmed?',
      type: 'single',
      options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Daily'],
      value: 1,
      maxScore: 5
    },
    {
      id: 's2',
      text: 'Physical symptoms you\'ve experienced recently:',
      type: 'multiple',
      options: ['Headaches', 'Sleep problems', 'Muscle tension', 'Fatigue', 'Digestive issues', 'None of these'],
      value: 1,
      maxScore: 6
    },
    {
      id: 's3',
      text: 'When under stress, which coping strategy do you use most?',
      type: 'single',
      options: ['Deep breathing or meditation', 'Exercise or physical activity', 'Talking to friends/family', 'Forcing yourself to work through it', 'Taking time alone', 'Eating or other comfort behaviors'],
      value: 1,
      maxScore: 6
    },
    {
      id: 's4',
      text: 'How often do you experience racing thoughts?',
      type: 'single',
      options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Most of the time'],
      value: 1,
      maxScore: 5
    },
    {
      id: 's5',
      text: 'Rate your usual sleep quality when stressed:',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'] },
      value: 1,
      maxScore: 5
    },
    {
      id: 's6',
      text: 'How do you typically react to unexpected challenges?',
      type: 'single',
      options: ['Address them immediately and systematically', 'Feel overwhelmed but eventually handle them', 'Ask others for help or advice', 'Avoid dealing with them as long as possible', 'Feel anxious but stay focused on solutions'],
      value: 1,
      maxScore: 5
    },
    {
      id: 's7',
      text: 'Rate your ability to relax and unwind after a stressful day:',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'] },
      value: 1,
      maxScore: 5
    },
    {
      id: 's8',
      text: 'Which environment feels most stressful to you?',
      type: 'single',
      options: ['Work or professional settings', 'Social situations or parties', 'Public speaking or presentations', 'Family conflicts or expectations', 'Personal health or relationship concerns'],
      value: 1,
      maxScore: 5
    },
    {
      id: 's9',
      text: 'How often do you practice stress management activities?',
      type: 'single',
      options: ['Daily', 'A few times a week', 'Once a week', 'Rarely', 'Never'],
      value: 1,
      maxScore: 5
    },
    {
      id: 's10',
      text: 'Rate your current ability to cope with daily challenges:',
      type: 'scale',
      scale: { min: 1, max: 10, labels: ['Very poor', '', '', '', 'Average', '', '', '', '', 'Excellent'] },
      value: 1,
      maxScore: 10
    }
  ],
  scoring: {
    type: 'cumulative',
    interpretation: {
      '0-10': 'Low stress - Good coping mechanisms in place',
      '11-20': 'Moderate stress - Some areas could use attention',
      '21-30': 'High stress - Consider stress management strategies',
      '31-40': 'Very high stress - Professional support recommended',
      '41+': 'Severe stress - Seek immediate professional help'
    }
  },
  results: {
    summary: 'Your stress assessment provides insight into your current stress levels and helps identify specific areas that may need attention.',
    insights: [
      'Physical symptoms often indicate stress before we mentally recognize it',
      'Stress affects both mental and physical health significantly',
      'Consistent coping strategies are more effective than occasional ones',
      'Early stress management prevents it from becoming chronic'
    ],
    recommendations: [
      'Try our guided breathing exercises and meditation techniques',
      'Explore stress management resources in our wellness section',
      'Consider our comprehensive stress management course',
      'Practice daily relaxation techniques to build resilience'
    ],
    aiAnalysis: {
      insights: [
        'Your stress pattern reveals specific triggers and coping mechanisms that influence daily functioning',
        'Physical symptom patterns suggest stress may be manifesting in predictable ways',
        'Sleep quality indicators point to the effectiveness of current relaxation strategies',
        'Social and environmental factors play significant roles in your stress experience',
        'Current coping strategies show varying levels of effectiveness across different stress types',
        'Recovery patterns after stress suggest opportunities for improved restoration techniques'
      ],
      recommendations: [
        'Develop targeted coping strategies for your most common stress triggers',
        'Establish consistent daily routines to prevent stress accumulation',
        'Build a personalized stress management toolkit with proven techniques',
        'Identify and modify environmental factors that contribute to stress',
        'Practice proactive stress prevention rather than just reactive management',
        'Consider professional guidance for persistent high stress levels'
      ],
      summary: 'Your stress profile indicates you\'re experiencing moderate to high stress levels with identifiable patterns in coping and recovery. The analysis reveals both effective coping mechanisms you already use and areas where additional strategies could significantly improve your resilience. Consistent implementation of stress management techniques combined with lifestyle adjustments could help you maintain better balance and prevent stress from impacting your health and productivity.'
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Assessment Database Export - FIXED VERSION
export const assessmentDB = {
  assessments: {
    'personality-basics': enhancedPersonalityAssessment,
    'decision-making-style': enhancedDecisionMakingAssessment,
    'communication-style': enhancedCommunicationAssessment,
    'life-balance-check': enhancedLifeBalanceAssessment,
    'relationship-style': enhancedRelationshipAssessment,
    'stress-level-check': enhancedStressAssessment
  }
};


// Type for assessment IDs
export type AssessmentId = keyof typeof assessmentDB.assessments;
