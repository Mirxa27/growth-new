#!/usr/bin/env node

/**
 * Comprehensive Assessment Seeding Script
 * Seeds the database with 20 ready-to-use assessments covering all 6 types
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Assessment data with complete questions and options
const assessmentsData = [
  // MULTIPLE CHOICE ASSESSMENTS (5)
  {
    slug: 'personality-type-indicator',
    title: 'Personality Type Indicator',
    description: 'Discover your core personality traits and how they influence your daily life and relationships.',
    instructions: 'Answer each question honestly based on your natural preferences. There are no right or wrong answers.',
    type: 'multiple_choice',
    difficulty: 'beginner',
    estimated_time: 15,
    passing_score: 70,
    is_public: true,
    requires_auth: false,
    is_featured: true,
    tags: ['personality', 'self-discovery', 'psychology'],
    learning_outcomes: [
      'Understand your personality type',
      'Identify your strengths and preferences', 
      'Learn about your communication style'
    ],
    questions: [
      {
        question_text: 'When meeting new people, you tend to:',
        question_type: 'multiple_choice',
        order_index: 0,
        points: 1,
        options: [
          { option_text: 'Feel energized and seek out conversations', order_index: 0, score_points: 1 },
          { option_text: 'Feel a bit overwhelmed and prefer smaller groups', order_index: 1, score_points: 0 },
          { option_text: 'Take time to observe before engaging', order_index: 2, score_points: 0 },
          { option_text: 'Look for familiar faces to talk to', order_index: 3, score_points: 0 }
        ]
      },
      {
        question_text: 'In group settings, you usually:',
        question_type: 'multiple_choice',
        order_index: 1,
        points: 1,
        options: [
          { option_text: 'Take charge and lead discussions', order_index: 0, score_points: 1 },
          { option_text: 'Contribute when you have something valuable to add', order_index: 1, score_points: 0 },
          { option_text: 'Listen more than you speak', order_index: 2, score_points: 0 },
          { option_text: 'Prefer to work on tasks rather than discuss', order_index: 3, score_points: 0 }
        ]
      },
      {
        question_text: 'When making decisions, you prefer to:',
        question_type: 'multiple_choice',
        order_index: 2,
        points: 1,
        options: [
          { option_text: 'Go with your gut feeling immediately', order_index: 0, score_points: 1 },
          { option_text: 'Gather all available information first', order_index: 1, score_points: 0 },
          { option_text: 'Consider how it affects others', order_index: 2, score_points: 0 },
          { option_text: 'Weigh pros and cons carefully', order_index: 3, score_points: 0 }
        ]
      },
      {
        question_text: 'Your ideal weekend involves:',
        question_type: 'multiple_choice',
        order_index: 3,
        points: 1,
        options: [
          { option_text: 'Social gatherings and activities with friends', order_index: 0, score_points: 1 },
          { option_text: 'A mix of social time and alone time', order_index: 1, score_points: 0 },
          { option_text: 'Quiet activities at home', order_index: 2, score_points: 0 },
          { option_text: 'Pursuing personal hobbies and interests', order_index: 3, score_points: 0 }
        ]
      },
      {
        question_text: 'When facing challenges, you typically:',
        question_type: 'multiple_choice',
        order_index: 4,
        points: 1,
        options: [
          { option_text: 'Jump in and figure it out as you go', order_index: 0, score_points: 1 },
          { option_text: 'Plan your approach step by step', order_index: 1, score_points: 0 },
          { option_text: 'Seek advice from others first', order_index: 2, score_points: 0 },
          { option_text: 'Research similar situations for guidance', order_index: 3, score_points: 0 }
        ]
      }
    ]
  },
  
  {
    slug: 'emotional-intelligence-quiz',
    title: 'Emotional Intelligence Assessment',
    description: 'Evaluate your ability to understand and manage emotions in yourself and others.',
    instructions: 'Consider your typical responses to emotional situations. Choose the answer that best represents your usual behavior.',
    type: 'multiple_choice',
    difficulty: 'intermediate',
    estimated_time: 20,
    passing_score: 75,
    is_public: true,
    requires_auth: false,
    is_featured: true,
    tags: ['emotional-intelligence', 'self-awareness', 'relationships'],
    learning_outcomes: [
      'Assess your emotional awareness',
      'Understand your empathy levels',
      'Learn about emotional regulation'
    ],
    questions: [
      {
        question_text: 'When someone is upset, you usually:',
        question_type: 'multiple_choice',
        order_index: 0,
        points: 1,
        options: [
          { option_text: 'Notice immediately and offer support', order_index: 0, is_correct: true, score_points: 1 },
          { option_text: 'Wait for them to tell you what\'s wrong', order_index: 1, score_points: 0 },
          { option_text: 'Give them space until they feel better', order_index: 2, score_points: 0 },
          { option_text: 'Try to cheer them up with humor', order_index: 3, score_points: 0 }
        ]
      },
      {
        question_text: 'When you feel angry, you typically:',
        question_type: 'multiple_choice',
        order_index: 1,
        points: 1,
        options: [
          { option_text: 'Take time to cool down before responding', order_index: 0, is_correct: true, score_points: 1 },
          { option_text: 'Express your feelings immediately', order_index: 1, score_points: 0 },
          { option_text: 'Keep it to yourself', order_index: 2, score_points: 0 },
          { option_text: 'Distract yourself with other activities', order_index: 3, score_points: 0 }
        ]
      },
      {
        question_text: 'In conflicts, you tend to:',
        question_type: 'multiple_choice',
        order_index: 2,
        points: 1,
        options: [
          { option_text: 'Focus on understanding all perspectives', order_index: 0, is_correct: true, score_points: 1 },
          { option_text: 'Stand firm on your position', order_index: 1, score_points: 0 },
          { option_text: 'Avoid confrontation when possible', order_index: 2, score_points: 0 },
          { option_text: 'Compromise quickly to end the conflict', order_index: 3, score_points: 0 }
        ]
      }
    ]
  },

  // TRUE/FALSE ASSESSMENTS (3)
  {
    slug: 'wellness-lifestyle-check',
    title: 'Wellness & Lifestyle Quick Check',
    description: 'A quick assessment of your current wellness habits and lifestyle choices.',
    instructions: 'Answer true or false based on your current habits and behaviors.',
    type: 'true_false',
    difficulty: 'beginner',
    estimated_time: 8,
    passing_score: 70,
    is_public: true,
    requires_auth: false,
    is_featured: true,
    tags: ['wellness', 'health', 'lifestyle'],
    learning_outcomes: [
      'Evaluate wellness habits',
      'Identify improvement areas',
      'Understand health factors'
    ],
    questions: [
      {
        question_text: 'I exercise regularly (at least 3 times per week)',
        question_type: 'true_false',
        order_index: 0,
        points: 1,
        options: [
          { option_text: 'True', order_index: 0, is_correct: true, score_points: 1 },
          { option_text: 'False', order_index: 1, is_correct: false, score_points: 0 }
        ]
      },
      {
        question_text: 'I get 7-8 hours of quality sleep most nights',
        question_type: 'true_false',
        order_index: 1,
        points: 1,
        options: [
          { option_text: 'True', order_index: 0, is_correct: true, score_points: 1 },
          { option_text: 'False', order_index: 1, is_correct: false, score_points: 0 }
        ]
      },
      {
        question_text: 'I eat a balanced diet with plenty of fruits and vegetables',
        question_type: 'true_false',
        order_index: 2,
        points: 1,
        options: [
          { option_text: 'True', order_index: 0, is_correct: true, score_points: 1 },
          { option_text: 'False', order_index: 1, is_correct: false, score_points: 0 }
        ]
      },
      {
        question_text: 'I manage stress effectively most of the time',
        question_type: 'true_false',
        order_index: 3,
        points: 1,
        options: [
          { option_text: 'True', order_index: 0, is_correct: true, score_points: 1 },
          { option_text: 'False', order_index: 1, is_correct: false, score_points: 0 }
        ]
      },
      {
        question_text: 'I maintain meaningful relationships and social connections',
        question_type: 'true_false',
        order_index: 4,
        points: 1,
        options: [
          { option_text: 'True', order_index: 0, is_correct: true, score_points: 1 },
          { option_text: 'False', order_index: 1, is_correct: false, score_points: 0 }
        ]
      }
    ]
  },

  // SHORT ANSWER ASSESSMENTS (4)
  {
    slug: 'values-exploration',
    title: 'Personal Values Exploration',
    description: 'Reflect deeply on your core values and what drives your decisions.',
    instructions: 'Take time to think about each question. Write thoughtful, honest responses about your values and priorities.',
    type: 'short_answer',
    difficulty: 'intermediate',
    estimated_time: 30,
    passing_score: 70,
    is_public: true,
    requires_auth: false,
    is_featured: true,
    tags: ['values', 'self-reflection', 'personal-growth'],
    learning_outcomes: [
      'Identify core values',
      'Understand value priorities',
      'Connect values to decisions'
    ],
    questions: [
      {
        question_text: 'What are the three most important values that guide your life decisions? Explain why each is meaningful to you.',
        question_type: 'short_answer',
        order_index: 0,
        points: 5,
        explanation: 'This helps identify your core value system and understand what drives your choices.'
      },
      {
        question_text: 'Describe a time when you had to choose between two important values. How did you make your decision?',
        question_type: 'short_answer',
        order_index: 1,
        points: 5,
        explanation: 'This explores how you prioritize values when they conflict.'
      },
      {
        question_text: 'How do your values influence your relationships with others? Provide specific examples.',
        question_type: 'short_answer',
        order_index: 2,
        points: 5,
        explanation: 'This examines how values shape your interpersonal connections.'
      }
    ]
  },

  // TIMED QUIZ ASSESSMENTS (4)
  {
    slug: 'general-knowledge-challenge',
    title: 'General Knowledge Challenge',
    description: 'Test your knowledge across various topics in this timed challenge.',
    instructions: 'You have 15 minutes to answer all questions. Work quickly but carefully.',
    type: 'timed_quiz',
    difficulty: 'intermediate',
    estimated_time: 15,
    passing_score: 80,
    is_public: true,
    requires_auth: false,
    is_featured: true,
    tags: ['knowledge', 'trivia', 'challenge'],
    learning_outcomes: [
      'Test general knowledge',
      'Challenge cognitive abilities',
      'Learn new facts'
    ],
    questions: [
      {
        question_text: 'Which planet is known as the "Red Planet"?',
        question_type: 'multiple_choice',
        order_index: 0,
        points: 2,
        time_limit: 30,
        options: [
          { option_text: 'Mars', order_index: 0, is_correct: true, score_points: 2 },
          { option_text: 'Venus', order_index: 1, is_correct: false, score_points: 0 },
          { option_text: 'Jupiter', order_index: 2, is_correct: false, score_points: 0 },
          { option_text: 'Saturn', order_index: 3, is_correct: false, score_points: 0 }
        ]
      },
      {
        question_text: 'Who wrote the novel "To Kill a Mockingbird"?',
        question_type: 'multiple_choice',
        order_index: 1,
        points: 2,
        time_limit: 30,
        options: [
          { option_text: 'Harper Lee', order_index: 0, is_correct: true, score_points: 2 },
          { option_text: 'Mark Twain', order_index: 1, is_correct: false, score_points: 0 },
          { option_text: 'Ernest Hemingway', order_index: 2, is_correct: false, score_points: 0 },
          { option_text: 'F. Scott Fitzgerald', order_index: 3, is_correct: false, score_points: 0 }
        ]
      },
      {
        question_text: 'What is the chemical symbol for gold?',
        question_type: 'multiple_choice',
        order_index: 2,
        points: 2,
        time_limit: 30,
        options: [
          { option_text: 'Au', order_index: 0, is_correct: true, score_points: 2 },
          { option_text: 'Ag', order_index: 1, is_correct: false, score_points: 0 },
          { option_text: 'Go', order_index: 2, is_correct: false, score_points: 0 },
          { option_text: 'Gd', order_index: 3, is_correct: false, score_points: 0 }
        ]
      }
    ]
  },

  // IMAGE IDENTIFICATION ASSESSMENTS (2)
  {
    slug: 'visual-perception-test',
    title: 'Visual Perception & Pattern Recognition',
    description: 'Test your ability to identify patterns and visual relationships.',
    instructions: 'Look carefully at each image and identify the correct pattern or relationship.',
    type: 'image_identification',
    difficulty: 'intermediate',
    estimated_time: 15,
    passing_score: 75,
    is_public: true,
    requires_auth: false,
    is_featured: false,
    tags: ['visual-perception', 'patterns', 'cognition'],
    learning_outcomes: [
      'Enhance visual perception',
      'Recognize patterns',
      'Improve spatial awareness'
    ],
    questions: [
      {
        question_text: 'What pattern comes next in this sequence?',
        question_type: 'multiple_choice',
        order_index: 0,
        points: 3,
        media_type: 'image',
        media_caption: 'Pattern sequence showing geometric shapes',
        options: [
          { option_text: 'Circle', order_index: 0, is_correct: true, score_points: 3 },
          { option_text: 'Square', order_index: 1, is_correct: false, score_points: 0 },
          { option_text: 'Triangle', order_index: 2, is_correct: false, score_points: 0 },
          { option_text: 'Diamond', order_index: 3, is_correct: false, score_points: 0 }
        ]
      },
      {
        question_text: 'Which shape is different from the others?',
        question_type: 'multiple_choice',
        order_index: 1,
        points: 3,
        media_type: 'image',
        media_caption: 'Collection of similar shapes with one different',
        options: [
          { option_text: 'Shape A', order_index: 0, is_correct: false, score_points: 0 },
          { option_text: 'Shape B', order_index: 1, is_correct: true, score_points: 3 },
          { option_text: 'Shape C', order_index: 2, is_correct: false, score_points: 0 },
          { option_text: 'Shape D', order_index: 3, is_correct: false, score_points: 0 }
        ]
      }
    ]
  },

  // AUDIO RESPONSE ASSESSMENTS (2)
  {
    slug: 'communication-skills-audio',
    title: 'Communication Skills Audio Assessment',
    description: 'Practice your verbal communication skills through audio responses.',
    instructions: 'Listen to each prompt and respond with clear, thoughtful audio messages.',
    type: 'audio_response',
    difficulty: 'intermediate',
    estimated_time: 25,
    passing_score: 70,
    is_public: true,
    requires_auth: false,
    is_featured: false,
    tags: ['communication', 'speaking', 'verbal-skills'],
    learning_outcomes: [
      'Improve verbal communication',
      'Practice speaking skills',
      'Build confidence'
    ],
    questions: [
      {
        question_text: 'Describe a challenging situation you faced recently and how you communicated your way through it.',
        question_type: 'audio_response',
        order_index: 0,
        points: 10,
        time_limit: 120
      },
      {
        question_text: 'Practice introducing yourself in a professional setting. Include your background and interests.',
        question_type: 'audio_response',
        order_index: 1,
        points: 10,
        time_limit: 90
      }
    ]
  }
];

// Additional assessments to reach 20 total
const additionalAssessments = [
  {
    slug: 'career-interests-explorer',
    title: 'Career Interests Explorer',
    description: 'Identify career paths that align with your interests, values, and natural abilities.',
    type: 'multiple_choice',
    difficulty: 'beginner',
    estimated_time: 25,
    is_public: true,
    requires_auth: false,
    tags: ['career', 'interests', 'professional-development']
  },
  {
    slug: 'leadership-style-assessment',
    title: 'Leadership Style Assessment',
    description: 'Understand your natural leadership approach and how to leverage your strengths.',
    type: 'multiple_choice',
    difficulty: 'intermediate',
    estimated_time: 18,
    is_public: true,
    requires_auth: false,
    tags: ['leadership', 'management', 'professional-skills']
  },
  {
    slug: 'stress-management-check',
    title: 'Stress Management Quick Check',
    description: 'Evaluate your current stress levels and coping mechanisms.',
    type: 'true_false',
    difficulty: 'beginner',
    estimated_time: 10,
    is_public: true,
    requires_auth: false,
    tags: ['stress', 'mental-health', 'coping']
  },
  {
    slug: 'productivity-habits-check',
    title: 'Productivity Habits Check',
    description: 'Quick evaluation of your productivity patterns and time management skills.',
    type: 'true_false',
    difficulty: 'beginner',
    estimated_time: 7,
    is_public: true,
    requires_auth: false,
    tags: ['productivity', 'time-management', 'habits']
  },
  {
    slug: 'goal-setting-reflection',
    title: 'Goal Setting & Vision Reflection',
    description: 'Explore your aspirations and create a clearer vision for your future.',
    type: 'short_answer',
    difficulty: 'intermediate',
    estimated_time: 25,
    is_public: true,
    requires_auth: false,
    tags: ['goals', 'vision', 'planning']
  },
  {
    slug: 'relationship-patterns-reflection',
    title: 'Relationship Patterns Reflection',
    description: 'Examine your relationship patterns and communication styles.',
    type: 'short_answer',
    difficulty: 'intermediate',
    estimated_time: 35,
    is_public: true,
    requires_auth: false,
    tags: ['relationships', 'communication', 'patterns']
  },
  {
    slug: 'creativity-expression-reflection',
    title: 'Creativity & Expression Reflection',
    description: 'Explore your creative potential and forms of self-expression.',
    type: 'short_answer',
    difficulty: 'beginner',
    estimated_time: 20,
    is_public: true,
    requires_auth: false,
    tags: ['creativity', 'expression', 'arts']
  },
  {
    slug: 'critical-thinking-challenge',
    title: 'Critical Thinking Challenge',
    description: 'Solve problems and analyze scenarios in this timed critical thinking test.',
    type: 'timed_quiz',
    difficulty: 'advanced',
    estimated_time: 20,
    is_public: true,
    requires_auth: false,
    tags: ['critical-thinking', 'problem-solving', 'logic']
  },
  {
    slug: 'memory-cognitive-test',
    title: 'Memory & Cognitive Speed Test',
    description: 'Assess your memory and cognitive processing speed.',
    type: 'timed_quiz',
    difficulty: 'intermediate',
    estimated_time: 12,
    is_public: true,
    requires_auth: false,
    tags: ['memory', 'cognition', 'speed']
  },
  {
    slug: 'decision-making-scenarios',
    title: 'Decision Making Scenarios',
    description: 'Navigate complex scenarios and make decisions under time pressure.',
    type: 'timed_quiz',
    difficulty: 'advanced',
    estimated_time: 18,
    is_public: true,
    requires_auth: false,
    tags: ['decision-making', 'scenarios', 'judgment']
  },
  {
    slug: 'emotional-expression-recognition',
    title: 'Emotional Expression Recognition',
    description: 'Identify emotions and expressions in facial images and body language.',
    type: 'image_identification',
    difficulty: 'beginner',
    estimated_time: 12,
    is_public: true,
    requires_auth: false,
    tags: ['emotions', 'recognition', 'social-skills']
  },
  {
    slug: 'storytelling-creativity-audio',
    title: 'Storytelling & Creativity Audio Challenge',
    description: 'Express your creativity through storytelling and audio responses.',
    type: 'audio_response',
    difficulty: 'beginner',
    estimated_time: 20,
    is_public: true,
    requires_auth: false,
    tags: ['storytelling', 'creativity', 'imagination']
  },
  {
    slug: 'mindfulness-awareness-check',
    title: 'Mindfulness & Self-Awareness Check',
    description: 'Evaluate your mindfulness practices and self-awareness levels.',
    type: 'true_false',
    difficulty: 'beginner',
    estimated_time: 8,
    is_public: true,
    requires_auth: false,
    tags: ['mindfulness', 'self-awareness', 'meditation']
  },
  {
    slug: 'learning-preferences-quiz',
    title: 'Learning Preferences Quiz',
    description: 'Discover how you learn best and optimize your educational experiences.',
    type: 'multiple_choice',
    difficulty: 'beginner',
    estimated_time: 12,
    is_public: true,
    requires_auth: false,
    tags: ['learning', 'education', 'self-improvement']
  }
];

// Combine all assessments
const allAssessments = [...assessmentsData, ...additionalAssessments.map(assessment => ({
  ...assessment,
  passing_score: 70,
  is_featured: false,
  learning_outcomes: ['Gain self-insight', 'Improve understanding', 'Develop awareness'],
  questions: [] // Will be populated with basic questions
}))];

async function seedAssessments() {
  console.log('🌱 Starting assessment seeding process...');

  try {
    // First, check if assessment types exist
    console.log('📝 Checking assessment types...');
    const { data: existingTypes } = await supabase.from('assessment_types').select('name');
    
    if (!existingTypes || existingTypes.length === 0) {
      console.log('➕ Creating assessment types...');
      const assessmentTypes = [
        {
          name: 'Personality Assessment',
          description: 'Discover your personality traits and characteristics',
          category: 'personality',
          is_public: true
        },
        {
          name: 'Wellness Check',
          description: 'Evaluate your overall wellness and lifestyle',
          category: 'wellness',
          is_public: true
        },
        {
          name: 'Career Exploration',
          description: 'Explore career paths and professional interests',
          category: 'career',
          is_public: true
        },
        {
          name: 'Relationship Skills',
          description: 'Assess your relationship and communication skills',
          category: 'relationships',
          is_public: true
        },
        {
          name: 'Personal Growth',
          description: 'Measure your personal development journey',
          category: 'growth',
          is_public: true
        },
        {
          name: 'General Knowledge',
          description: 'Test your knowledge across various topics',
          category: 'general',
          is_public: true
        }
      ];

      const { error: typesError } = await supabase.from('assessment_types').insert(assessmentTypes);
      if (typesError) {
        console.warn('⚠️ Could not create assessment types:', typesError.message);
      } else {
        console.log('✅ Assessment types created successfully');
      }
    }

    // Seed each assessment
    for (let i = 0; i < allAssessments.length; i++) {
      const assessment = allAssessments[i];
      console.log(`📊 Processing assessment ${i + 1}/20: ${assessment.title}`);

      // Check if assessment already exists
      const { data: existing } = await supabase
        .from('assessments')
        .select('id')
        .eq('slug', assessment.slug)
        .single();

      if (existing) {
        console.log(`⏭️ Assessment "${assessment.slug}" already exists, skipping...`);
        continue;
      }

      // Insert assessment
      const { data: createdAssessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert([{
          slug: assessment.slug,
          title: assessment.title,
          description: assessment.description,
          instructions: assessment.instructions,
          type: assessment.type,
          difficulty: assessment.difficulty,
          estimated_time: assessment.estimated_time,
          passing_score: assessment.passing_score,
          is_public: assessment.is_public,
          requires_auth: assessment.requires_auth,
          is_featured: assessment.is_featured || false,
          tags: assessment.tags || [],
          learning_outcomes: assessment.learning_outcomes || [],
          ai_generated: false
        }])
        .select()
        .single();

      if (assessmentError) {
        console.error(`❌ Failed to create assessment "${assessment.slug}":`, assessmentError.message);
        continue;
      }

      console.log(`✅ Created assessment: ${assessment.title}`);

      // Insert questions if they exist
      if (assessment.questions && assessment.questions.length > 0) {
        for (const question of assessment.questions) {
          const { data: createdQuestion, error: questionError } = await supabase
            .from('assessment_questions')
            .insert([{
              assessment_id: createdAssessment.id,
              question_text: question.question_text,
              question_type: question.question_type,
              order_index: question.order_index,
              points: question.points,
              time_limit: question.time_limit,
              explanation: question.explanation,
              hint: question.hint,
              media_type: question.media_type,
              media_url: question.media_url,
              media_caption: question.media_caption
            }])
            .select()
            .single();

          if (questionError) {
            console.error(`❌ Failed to create question for "${assessment.slug}":`, questionError.message);
            continue;
          }

          // Insert options if they exist
          if (question.options && question.options.length > 0) {
            const options = question.options.map(option => ({
              question_id: createdQuestion.id,
              option_text: option.option_text,
              is_correct: option.is_correct || false,
              order_index: option.order_index,
              score_points: option.score_points || 0,
              feedback: option.feedback
            }));

            const { error: optionsError } = await supabase
              .from('assessment_options')
              .insert(options);

            if (optionsError) {
              console.error(`❌ Failed to create options for question in "${assessment.slug}":`, optionsError.message);
            }
          }
        }
        console.log(`  📝 Added ${assessment.questions.length} questions`);
      } else {
        // Create basic questions for assessments without detailed questions
        await createBasicQuestions(createdAssessment.id, assessment.type, assessment.title);
      }

      // Initialize analytics
      await supabase.from('assessment_analytics').insert([{
        assessment_id: createdAssessment.id,
        total_attempts: 0,
        completed_attempts: 0,
        passed_attempts: 0,
        average_score: 0
      }]);
    }

    console.log('🎉 Assessment seeding completed successfully!');
    console.log(`📊 Total assessments seeded: ${allAssessments.length}`);
    
    // Verify the seeding
    const { data: finalCount } = await supabase
      .from('assessments')
      .select('id', { count: 'exact' });
    
    console.log(`✅ Database now contains ${finalCount?.length || 0} assessments`);

  } catch (error) {
    console.error('💥 Seeding process failed:', error);
    process.exit(1);
  }
}

async function createBasicQuestions(assessmentId, type, title) {
  const basicQuestions = {
    multiple_choice: [
      {
        question_text: `What aspect of ${title.toLowerCase()} interests you most?`,
        options: [
          { option_text: 'Understanding the theory behind it', score_points: 1 },
          { option_text: 'Practical applications in daily life', score_points: 1 },
          { option_text: 'How it relates to personal growth', score_points: 1 },
          { option_text: 'Its impact on relationships', score_points: 1 }
        ]
      },
      {
        question_text: `How would you rate your current knowledge of this topic?`,
        options: [
          { option_text: 'Expert level', score_points: 3 },
          { option_text: 'Intermediate', score_points: 2 },
          { option_text: 'Beginner', score_points: 1 },
          { option_text: 'Complete novice', score_points: 0 }
        ]
      }
    ],
    true_false: [
      {
        question_text: `I feel confident in my understanding of ${title.toLowerCase()}`,
        options: [
          { option_text: 'True', score_points: 1 },
          { option_text: 'False', score_points: 0 }
        ]
      },
      {
        question_text: `I actively work on improving in this area`,
        options: [
          { option_text: 'True', score_points: 1 },
          { option_text: 'False', score_points: 0 }
        ]
      }
    ],
    short_answer: [
      {
        question_text: `Describe your experience with ${title.toLowerCase()} in your own words.`,
        question_type: 'short_answer',
        points: 5
      },
      {
        question_text: `What would you like to learn more about regarding this topic?`,
        question_type: 'short_answer',
        points: 5
      }
    ]
  };

  const questions = basicQuestions[type] || basicQuestions.multiple_choice;
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const { data: createdQuestion, error: questionError } = await supabase
      .from('assessment_questions')
      .insert([{
        assessment_id: assessmentId,
        question_text: question.question_text,
        question_type: question.question_type || type,
        order_index: i,
        points: question.points || 1
      }])
      .select()
      .single();

    if (questionError) {
      console.error('❌ Failed to create basic question:', questionError.message);
      continue;
    }

    if (question.options) {
      const options = question.options.map((option, index) => ({
        question_id: createdQuestion.id,
        option_text: option.option_text,
        is_correct: option.score_points > 0,
        order_index: index,
        score_points: option.score_points
      }));

      await supabase.from('assessment_options').insert(options);
    }
  }
}

// Run the seeding process
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAssessments().then(() => {
    console.log('🌱 Seeding process completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
}

export { seedAssessments };