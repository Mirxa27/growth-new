export interface Question {
  id: string
  text: string
  type: 'multiple_choice' | 'rating' | 'true_false'
  options?: string[]
  scale?: { min: number; max: number; labels?: string[] }
}

export interface Assessment {
  id: string
  category: string
  title: string
  description: string
  instructions: string
  questions: Question[]
  scoring?: {
    type: 'personality' | 'score' | 'category'
    categories?: string[]
    interpretations?: Record<string, string>
  }
}

export const freeAssessments: Record<string, Assessment> = {
  personality: {
    id: '1',
    category: 'personality',
    title: 'Personality Assessment',
    description: 'Discover your personality type based on the Big Five model',
    instructions: 'Answer each question honestly based on how you typically behave. There are no right or wrong answers.',
    questions: [
      {
        id: 'p1',
        text: 'I enjoy being the center of attention at social gatherings.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
      },
      {
        id: 'p2',
        text: 'I prefer to have a detailed plan before starting any project.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
      },
      {
        id: 'p3',
        text: 'I often feel emotionally affected by other people\'s problems.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
      },
      {
        id: 'p4',
        text: 'I enjoy trying new and unfamiliar experiences.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
      },
      {
        id: 'p5',
        text: 'I often worry about things that might go wrong.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
      },
      {
        id: 'p6',
        text: 'I find it easy to make new friends.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
      },
      {
        id: 'p7',
        text: 'I always complete tasks on time.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
      },
      {
        id: 'p8',
        text: 'I go out of my way to help others.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
      },
      {
        id: 'p9',
        text: 'I enjoy philosophical discussions.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
      },
      {
        id: 'p10',
        text: 'I remain calm under pressure.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
      },
      // Add more questions for a comprehensive assessment
    ],
    scoring: {
      type: 'personality',
      categories: ['Extraversion', 'Conscientiousness', 'Agreeableness', 'Openness', 'Emotional Stability'],
      interpretations: {
        'high-extraversion': 'You are outgoing, energetic, and enjoy social interactions.',
        'low-extraversion': 'You prefer quieter environments and smaller social circles.',
        'high-conscientiousness': 'You are organized, reliable, and goal-oriented.',
        'low-conscientiousness': 'You are flexible and spontaneous in your approach.',
        'high-agreeableness': 'You are compassionate, cooperative, and trusting.',
        'low-agreeableness': 'You are independent and direct in your interactions.',
        'high-openness': 'You are creative, curious, and open to new experiences.',
        'low-openness': 'You prefer familiar routines and practical approaches.',
        'high-stability': 'You handle stress well and maintain emotional balance.',
        'low-stability': 'You are sensitive and experience emotions deeply.'
      }
    }
  },
  career: {
    id: '2',
    category: 'career',
    title: 'Career Aptitude Test',
    description: 'Discover careers that match your interests and strengths',
    instructions: 'Select the option that best describes you or your preferences.',
    questions: [
      {
        id: 'c1',
        text: 'Which work environment appeals to you most?',
        type: 'multiple_choice',
        options: [
          'Office with regular hours and structure',
          'Remote work with flexible schedule',
          'Outdoor or field work',
          'Laboratory or research facility',
          'Creative studio or workshop'
        ]
      },
      {
        id: 'c2',
        text: 'What type of tasks do you enjoy most?',
        type: 'multiple_choice',
        options: [
          'Analyzing data and solving problems',
          'Working with people and helping others',
          'Creating or designing things',
          'Managing projects and leading teams',
          'Working with your hands or tools'
        ]
      },
      {
        id: 'c3',
        text: 'I prefer work that involves frequent interaction with others.',
        type: 'true_false'
      },
      {
        id: 'c4',
        text: 'How important is job security to you?',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Not Important', 'Slightly Important', 'Moderately Important', 'Very Important', 'Extremely Important'] }
      },
      {
        id: 'c5',
        text: 'Which skill set best describes you?',
        type: 'multiple_choice',
        options: [
          'Technical and analytical',
          'Creative and artistic',
          'Interpersonal and communication',
          'Leadership and organizational',
          'Practical and mechanical'
        ]
      },
      {
        id: 'c6',
        text: 'I enjoy taking risks and trying new approaches.',
        type: 'true_false'
      },
      {
        id: 'c7',
        text: 'What motivates you most in a career?',
        type: 'multiple_choice',
        options: [
          'Financial rewards and stability',
          'Making a positive impact',
          'Personal growth and learning',
          'Recognition and advancement',
          'Work-life balance'
        ]
      },
      {
        id: 'c8',
        text: 'How comfortable are you with technology?',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Very Uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very Comfortable'] }
      },
      {
        id: 'c9',
        text: 'I prefer to work independently rather than in teams.',
        type: 'true_false'
      },
      {
        id: 'c10',
        text: 'Which industry interests you most?',
        type: 'multiple_choice',
        options: [
          'Technology and Innovation',
          'Healthcare and Wellness',
          'Education and Training',
          'Business and Finance',
          'Arts and Entertainment',
          'Science and Research'
        ]
      }
    ],
    scoring: {
      type: 'category',
      categories: ['Analytical', 'Creative', 'Social', 'Enterprising', 'Conventional', 'Realistic']
    }
  },
  'learning-style': {
    id: '3',
    category: 'learning-style',
    title: 'Learning Style Assessment',
    description: 'Identify your preferred learning methods and study strategies',
    instructions: 'Choose the answer that best describes how you prefer to learn.',
    questions: [
      {
        id: 'l1',
        text: 'When learning something new, I prefer to:',
        type: 'multiple_choice',
        options: [
          'Read about it in detail',
          'Watch demonstrations or videos',
          'Try it out hands-on',
          'Discuss it with others'
        ]
      },
      {
        id: 'l2',
        text: 'I remember information best when:',
        type: 'multiple_choice',
        options: [
          'I write it down',
          'I see diagrams or images',
          'I practice or apply it',
          'I hear it explained'
        ]
      },
      {
        id: 'l3',
        text: 'In a classroom, I prefer:',
        type: 'multiple_choice',
        options: [
          'Lectures with detailed explanations',
          'Visual presentations with slides',
          'Interactive activities and experiments',
          'Group discussions and debates'
        ]
      },
      {
        id: 'l4',
        text: 'When studying, I am most productive:',
        type: 'multiple_choice',
        options: [
          'In complete silence',
          'With background music',
          'In a group study session',
          'While moving or walking'
        ]
      },
      {
        id: 'l5',
        text: 'I learn best when information is presented:',
        type: 'multiple_choice',
        options: [
          'In a logical, step-by-step manner',
          'With real-world examples',
          'Through stories and analogies',
          'With opportunities to experiment'
        ]
      },
      {
        id: 'l6',
        text: 'I prefer learning at my own pace.',
        type: 'true_false'
      },
      {
        id: 'l7',
        text: 'How do you prefer to demonstrate your knowledge?',
        type: 'multiple_choice',
        options: [
          'Written essays or reports',
          'Oral presentations',
          'Practical demonstrations',
          'Creative projects'
        ]
      },
      {
        id: 'l8',
        text: 'I need frequent breaks when studying.',
        type: 'true_false'
      },
      {
        id: 'l9',
        text: 'When solving problems, I:',
        type: 'multiple_choice',
        options: [
          'Analyze all options systematically',
          'Trust my intuition',
          'Seek input from others',
          'Try different approaches'
        ]
      },
      {
        id: 'l10',
        text: 'I prefer structured learning environments with clear objectives.',
        type: 'true_false'
      }
    ],
    scoring: {
      type: 'category',
      categories: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing']
    }
  },
  eq: {
    id: '4',
    category: 'eq',
    title: 'Emotional Intelligence Test',
    description: 'Assess your emotional awareness and interpersonal skills',
    instructions: 'Rate how well each statement describes you.',
    questions: [
      {
        id: 'e1',
        text: 'I can easily identify my emotions as I experience them.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      },
      {
        id: 'e2',
        text: 'I can sense others\' emotions even when they don\'t express them verbally.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      },
      {
        id: 'e3',
        text: 'I manage my emotions well in stressful situations.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      },
      {
        id: 'e4',
        text: 'I can motivate myself to achieve my goals.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      },
      {
        id: 'e5',
        text: 'I handle conflicts constructively.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      },
      {
        id: 'e6',
        text: 'I adapt easily to change.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      },
      {
        id: 'e7',
        text: 'I can calm myself down when I feel anxious or upset.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      },
      {
        id: 'e8',
        text: 'I show empathy towards others\' feelings.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      },
      {
        id: 'e9',
        text: 'I can influence others positively.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      },
      {
        id: 'e10',
        text: 'I bounce back quickly from setbacks.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      }
    ],
    scoring: {
      type: 'score',
      interpretations: {
        'high': 'You have strong emotional intelligence skills.',
        'medium': 'You have moderate emotional intelligence with room for growth.',
        'low': 'Developing your emotional intelligence could benefit your relationships and well-being.'
      }
    }
  },
  stress: {
    id: '5',
    category: 'stress',
    title: 'Stress Management Evaluation',
    description: 'Evaluate your current stress levels and coping mechanisms',
    instructions: 'Answer based on your experiences over the past month.',
    questions: [
      {
        id: 's1',
        text: 'How often have you felt overwhelmed by your responsibilities?',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often'] }
      },
      {
        id: 's2',
        text: 'I have trouble sleeping due to stress or worry.',
        type: 'true_false'
      },
      {
        id: 's3',
        text: 'How often do you experience physical symptoms of stress (headaches, muscle tension, etc.)?',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often'] }
      },
      {
        id: 's4',
        text: 'I use healthy coping strategies when stressed.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      },
      {
        id: 's5',
        text: 'How satisfied are you with your work-life balance?',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'] }
      },
      {
        id: 's6',
        text: 'I feel in control of my stress levels.',
        type: 'true_false'
      },
      {
        id: 's7',
        text: 'How often do you take time for relaxation or self-care?',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Daily'] }
      },
      {
        id: 's8',
        text: 'Stress negatively affects my relationships.',
        type: 'true_false'
      },
      {
        id: 's9',
        text: 'I have a strong support system to help me manage stress.',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
      },
      {
        id: 's10',
        text: 'How would you rate your overall stress level?',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'] }
      }
    ],
    scoring: {
      type: 'score',
      interpretations: {
        'low': 'Your stress levels are well-managed. Keep up the good work!',
        'moderate': 'You experience moderate stress. Consider incorporating more stress-reduction techniques.',
        'high': 'Your stress levels are high. It\'s important to develop better coping strategies.'
      }
    }
  },
  communication: {
    id: '6',
    category: 'communication',
    title: 'Communication Style Quiz',
    description: 'Understand your communication preferences and improve interactions',
    instructions: 'Select the response that best describes your typical behavior.',
    questions: [
      {
        id: 'cm1',
        text: 'In conversations, I tend to:',
        type: 'multiple_choice',
        options: [
          'Get straight to the point',
          'Share personal stories and experiences',
          'Ask questions and listen actively',
          'Use humor to connect with others'
        ]
      },
      {
        id: 'cm2',
        text: 'When giving feedback, I:',
        type: 'multiple_choice',
        options: [
          'Am direct and honest',
          'Try to be gentle and considerate',
          'Focus on specific behaviors',
          'Avoid it if possible'
        ]
      },
      {
        id: 'cm3',
        text: 'I prefer written communication over face-to-face conversations.',
        type: 'true_false'
      },
      {
        id: 'cm4',
        text: 'In conflicts, I typically:',
        type: 'multiple_choice',
        options: [
          'Address issues immediately',
          'Avoid confrontation',
          'Seek compromise',
          'Stand firm on my position'
        ]
      },
      {
        id: 'cm5',
        text: 'How comfortable are you with public speaking?',
        type: 'rating',
        scale: { min: 1, max: 5, labels: ['Very Uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very Comfortable'] }
      },
      {
        id: 'cm6',
        text: 'I adapt my communication style based on my audience.',
        type: 'true_false'
      },
      {
        id: 'cm7',
        text: 'When listening to others, I:',
        type: 'multiple_choice',
        options: [
          'Focus entirely on their words',
          'Think about my response',
          'Pay attention to body language',
          'Take notes to remember key points'
        ]
      },
      {
        id: 'cm8',
        text: 'I express my emotions openly in conversations.',
        type: 'true_false'
      },
      {
        id: 'cm9',
        text: 'In group discussions, I:',
        type: 'multiple_choice',
        options: [
          'Take the lead and guide the conversation',
          'Contribute when I have something valuable to add',
          'Prefer to listen and observe',
          'Encourage others to share their thoughts'
        ]
      },
      {
        id: 'cm10',
        text: 'How do you prefer to receive important information?',
        type: 'multiple_choice',
        options: [
          'Detailed written documentation',
          'Visual presentations',
          'Verbal briefings',
          'Interactive discussions'
        ]
      }
    ],
    scoring: {
      type: 'category',
      categories: ['Assertive', 'Passive', 'Analytical', 'Expressive']
    }
  }
}