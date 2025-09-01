-- Seed Free Assessments
-- Create 6 free public assessments as specified in reference.md

-- Assessment 1: Personal Growth Quiz
SELECT public.create_assessment_with_questions(
  'Personal Growth Journey Quiz',
  'Discover your current stage in personal development and get insights into areas for growth and self-improvement.',
  'quiz',
  'public',
  'beginner',
  'personal development',
  'openai',
  'gpt-4o-mini',
  'Personal growth assessment for women',
  '[
    {
      "question_text": "What motivates you most in your personal growth journey?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Understanding your motivation helps identify the most effective growth strategies for you.",
      "options": [
        {
          "option_text": "Achieving specific goals and milestones",
          "is_correct": false,
          "position": 1,
          "score_value": 1
        },
        {
          "option_text": "Building deeper self-awareness and understanding",
          "is_correct": true,
          "position": 2,
          "score_value": 2
        },
        {
          "option_text": "Overcoming past challenges and limitations",
          "is_correct": false,
          "position": 3,
          "score_value": 1
        },
        {
          "option_text": "Creating positive impact on others",
          "is_correct": false,
          "position": 4,
          "score_value": 1
        }
      ]
    },
    {
      "question_text": "How do you typically respond to setbacks or challenges?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Your response to challenges reveals your resilience and growth mindset.",
      "options": [
        {
          "option_text": "I get discouraged and need time to recover",
          "is_correct": false,
          "position": 1,
          "score_value": 0
        },
        {
          "option_text": "I analyze what went wrong and make adjustments",
          "is_correct": true,
          "position": 2,
          "score_value": 2
        },
        {
          "option_text": "I seek support from others to help me through",
          "is_correct": false,
          "position": 3,
          "score_value": 1
        },
        {
          "option_text": "I try to avoid similar situations in the future",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    }
  ]'::jsonb
);

-- Assessment 2: Emotional Intelligence Quiz  
SELECT public.create_assessment_with_questions(
  'Emotional Intelligence Assessment',
  'Evaluate your ability to understand and manage emotions, both your own and others, in various life situations.',
  'quiz',
  'public',
  'intermediate',
  'emotional intelligence',
  'openai',
  'gpt-4o-mini',
  'Emotional intelligence assessment for women',
  '[
    {
      "question_text": "When you feel overwhelmed, what is your first instinct?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "How you handle overwhelm shows your emotional regulation skills.",
      "options": [
        {
          "option_text": "Push through and keep going",
          "is_correct": false,
          "position": 1,
          "score_value": 0
        },
        {
          "option_text": "Take a step back and assess the situation",
          "is_correct": true,
          "position": 2,
          "score_value": 2
        },
        {
          "option_text": "Seek immediate help from others",
          "is_correct": false,
          "position": 3,
          "score_value": 1
        },
        {
          "option_text": "Withdraw and avoid the situation",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    }
  ]'::jsonb
);

-- Assessment 3: Relationship Patterns Quiz
SELECT public.create_assessment_with_questions(
  'Relationship Patterns Quiz',
  'Understand your relationship patterns, communication style, and areas for improvement in personal connections.',
  'quiz',
  'public',
  'intermediate',
  'relationships',
  'openai',
  'gpt-4o-mini',
  'Relationship patterns assessment',
  '[
    {
      "question_text": "In conflicts, you tend to:",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Your conflict style affects all your relationships.",
      "options": [
        {
          "option_text": "Avoid confrontation at all costs",
          "is_correct": false,
          "position": 1,
          "score_value": 0
        },
        {
          "option_text": "Address issues directly but respectfully",
          "is_correct": true,
          "position": 2,
          "score_value": 2
        },
        {
          "option_text": "Wait for the other person to bring it up",
          "is_correct": false,
          "position": 3,
          "score_value": 0
        },
        {
          "option_text": "Get emotional and reactive",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    }
  ]'::jsonb
);

-- Assessment 4: Self-Care Assessment
SELECT public.create_assessment_with_questions(
  'Self-Care Assessment',
  'Evaluate how well you take care of your physical, mental, and emotional needs in your daily life.',
  'quiz',
  'public',
  'beginner',
  'wellness',
  'openai',
  'gpt-4o-mini',
  'Self-care assessment for women',
  '[
    {
      "question_text": "How often do you engage in activities that truly rejuvenate you?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Regular self-care is essential for mental and emotional well-being.",
      "options": [
        {
          "option_text": "Daily - it is a priority for me",
          "is_correct": true,
          "position": 1,
          "score_value": 2
        },
        {
          "option_text": "Weekly - when I remember",
          "is_correct": false,
          "position": 2,
          "score_value": 1
        },
        {
          "option_text": "Monthly - when I have time",
          "is_correct": false,
          "position": 3,
          "score_value": 0
        },
        {
          "option_text": "Rarely - I feel guilty taking time for myself",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    }
  ]'::jsonb
);

-- Assessment 5: Life Purpose Explorer
SELECT public.create_assessment_with_questions(
  'Life Purpose Explorer',
  'Discover insights about your core values, passions, and what gives your life meaning and direction.',
  'exploration',
  'public',
  'intermediate',
  'purpose',
  'openai',
  'gpt-4o-mini',
  'Life purpose exploration for women',
  '[
    {
      "question_text": "When you imagine your ideal life 5 years from now, what aspect excites you most?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "This question helps identify what truly matters to you and where your passion lies."
    },
    {
      "question_text": "What activities make you lose track of time because you enjoy them so much?",
      "question_type": "free_text",
      "position": 2,
      "explanation": "Flow states often indicate areas where your natural talents and interests align."
    }
  ]'::jsonb
);

-- Assessment 6: Confidence Builder Quiz
SELECT public.create_assessment_with_questions(
  'Confidence Builder Assessment',
  'Identify your confidence strengths and areas where you can build more self-assurance and empowerment.',
  'quiz',
  'public',
  'beginner',
  'confidence',
  'openai',
  'gpt-4o-mini',
  'Confidence assessment for women',
  '[
    {
      "question_text": "When faced with a new challenge, your inner voice typically says:",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Your inner dialogue greatly influences your confidence and willingness to take on challenges.",
      "options": [
        {
          "option_text": "I can learn and figure this out",
          "is_correct": true,
          "position": 1,
          "score_value": 2
        },
        {
          "option_text": "This might be too difficult for me",
          "is_correct": false,
          "position": 2,
          "score_value": 0
        },
        {
          "option_text": "I should wait until I am more prepared",
          "is_correct": false,
          "position": 3,
          "score_value": 0
        },
        {
          "option_text": "Others are better suited for this than me",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    },
    {
      "question_text": "How do you typically celebrate your achievements?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Celebrating wins, both big and small, helps build lasting confidence.",
      "options": [
        {
          "option_text": "I acknowledge them briefly then move on",
          "is_correct": false,
          "position": 1,
          "score_value": 1
        },
        {
          "option_text": "I share them with people who matter to me",
          "is_correct": true,
          "position": 2,
          "score_value": 2
        },
        {
          "option_text": "I downplay them - anyone could have done it",
          "is_correct": false,
          "position": 3,
          "score_value": 0
        },
        {
          "option_text": "I rarely take time to acknowledge achievements",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    }
  ]'::jsonb
);