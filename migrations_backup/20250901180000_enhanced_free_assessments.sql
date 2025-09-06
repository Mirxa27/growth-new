-- Enhanced Free Assessments for Visitors (No Signup Required)
-- This migration adds more comprehensive questions to existing assessments and ensures they're properly configured

-- First, let's delete existing assessment questions to start fresh
DELETE FROM public.assessment_options WHERE question_id IN (
  SELECT id FROM public.assessment_questions WHERE assessment_id IN (
    SELECT id FROM public.assessments WHERE visibility = 'public'
  )
);
DELETE FROM public.assessment_questions WHERE assessment_id IN (
  SELECT id FROM public.assessments WHERE visibility = 'public'
);
DELETE FROM public.assessments WHERE visibility = 'public';

-- Enhanced Assessment 1: Personal Growth Journey Quiz (10 questions)
SELECT public.create_assessment_with_questions(
  'Personal Growth Journey Assessment',
  'Discover where you are on your personal development journey and receive personalized insights for your next steps towards growth and self-improvement.',
  'quiz',
  'public',
  'beginner',
  'personal development',
  'openai',
  'gpt-4o-mini',
  'Comprehensive personal growth assessment for women focusing on self-awareness, goal-setting, and personal transformation',
  '[
    {
      "question_text": "What motivates you most in your personal growth journey?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Understanding your core motivation helps identify the most effective growth strategies for you.",
      "options": [
        {
          "option_text": "Achieving specific goals and milestones",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "Goal-oriented motivation drives tangible progress"
        },
        {
          "option_text": "Building deeper self-awareness and understanding",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Self-awareness is the foundation of sustainable growth"
        },
        {
          "option_text": "Overcoming past challenges and limitations",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Healing and transformation create space for new possibilities"
        },
        {
          "option_text": "Creating positive impact on others",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Purpose-driven growth creates meaningful change"
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
          "score_value": 1,
          "feedback": "Taking time to process is healthy, but watch for extended periods"
        },
        {
          "option_text": "I analyze what went wrong and make adjustments",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Learning from setbacks accelerates growth"
        },
        {
          "option_text": "I seek support from others to help me through",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Seeking support shows wisdom and emotional intelligence"
        },
        {
          "option_text": "I try to avoid similar situations in the future",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Avoidance may limit growth opportunities"
        }
      ]
    },
    {
      "question_text": "Which area of personal growth do you feel needs the most attention right now?",
      "question_type": "multiple_choice",
      "position": 3,
      "points": 1,
      "explanation": "Identifying priority areas helps focus your growth efforts effectively.",
      "options": [
        {
          "option_text": "Building confidence and self-esteem",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "Inner confidence transforms how you show up in the world"
        },
        {
          "option_text": "Improving relationships and communication",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Strong relationships are essential for wellbeing"
        },
        {
          "option_text": "Finding purpose and direction",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Clarity of purpose guides meaningful decisions"
        },
        {
          "option_text": "Managing stress and emotions",
          "is_correct": true,
          "position": 4,
          "score_value": 4,
          "feedback": "Emotional regulation is foundational for all growth"
        }
      ]
    },
    {
      "question_text": "How often do you invest time in self-reflection?",
      "question_type": "multiple_choice",
      "position": 4,
      "points": 1,
      "explanation": "Regular self-reflection accelerates personal insight and growth.",
      "options": [
        {
          "option_text": "Daily through journaling or meditation",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Consistent practice yields profound insights"
        },
        {
          "option_text": "Weekly when I have quiet moments",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Regular reflection supports steady progress"
        },
        {
          "option_text": "Occasionally when prompted by events",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Consider creating more intentional reflection time"
        },
        {
          "option_text": "Rarely - I prefer to keep moving forward",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Reflection helps ensure you''re moving in the right direction"
        }
      ]
    },
    {
      "question_text": "What is your biggest obstacle to personal growth?",
      "question_type": "multiple_choice",
      "position": 5,
      "points": 1,
      "explanation": "Identifying obstacles is the first step to overcoming them.",
      "options": [
        {
          "option_text": "Fear of failure or judgment",
          "is_correct": false,
          "position": 1,
          "score_value": 2,
          "feedback": "Fear often masks our greatest growth opportunities"
        },
        {
          "option_text": "Lack of time or energy",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Prioritization can create space for what matters"
        },
        {
          "option_text": "Not knowing where to start",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Small steps in any direction build momentum"
        },
        {
          "option_text": "Self-doubt and limiting beliefs",
          "is_correct": true,
          "position": 4,
          "score_value": 3,
          "feedback": "Challenging beliefs opens new possibilities"
        }
      ]
    },
    {
      "question_text": "How do you prefer to learn and grow?",
      "question_type": "multiple_choice",
      "position": 6,
      "points": 1,
      "explanation": "Understanding your learning style helps optimize your growth journey.",
      "options": [
        {
          "option_text": "Through books, courses, and structured learning",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "Structured learning provides solid foundations"
        },
        {
          "option_text": "Through experiences and hands-on practice",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Experiential learning creates lasting change"
        },
        {
          "option_text": "Through conversations and community",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Community accelerates growth through shared wisdom"
        },
        {
          "option_text": "Through reflection and inner work",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Inner work creates authentic transformation"
        }
      ]
    },
    {
      "question_text": "What does success in personal growth mean to you?",
      "question_type": "multiple_choice",
      "position": 7,
      "points": 1,
      "explanation": "Defining success helps measure progress meaningfully.",
      "options": [
        {
          "option_text": "Achieving my goals and dreams",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "External achievements reflect inner growth"
        },
        {
          "option_text": "Feeling peaceful and content with myself",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Inner peace is the ultimate success"
        },
        {
          "option_text": "Having positive impact on others",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Your growth ripples out to benefit others"
        },
        {
          "option_text": "Continuous learning and evolution",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Growth as a journey, not destination"
        }
      ]
    },
    {
      "question_text": "How comfortable are you with change?",
      "question_type": "multiple_choice",
      "position": 8,
      "points": 1,
      "explanation": "Your relationship with change affects your growth potential.",
      "options": [
        {
          "option_text": "I embrace change as opportunity",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Embracing change accelerates transformation"
        },
        {
          "option_text": "I adapt when change is necessary",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Flexibility serves you well"
        },
        {
          "option_text": "I find change challenging but manage",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Building comfort with change expands possibilities"
        },
        {
          "option_text": "I prefer stability and predictability",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Small, gradual changes can feel more manageable"
        }
      ]
    },
    {
      "question_text": "What role does self-compassion play in your life?",
      "question_type": "multiple_choice",
      "position": 9,
      "points": 1,
      "explanation": "Self-compassion is crucial for sustainable personal growth.",
      "options": [
        {
          "option_text": "I practice it regularly and forgive myself easily",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Self-compassion fuels resilience and growth"
        },
        {
          "option_text": "I''m learning to be kinder to myself",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Growing self-compassion transforms your journey"
        },
        {
          "option_text": "I struggle with self-criticism",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Gentleness with yourself opens growth"
        },
        {
          "option_text": "I push myself hard to improve",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Balance drive with self-kindness"
        }
      ]
    },
    {
      "question_text": "How do you measure your personal growth progress?",
      "question_type": "multiple_choice",
      "position": 10,
      "points": 1,
      "explanation": "How you measure progress affects your motivation and direction.",
      "options": [
        {
          "option_text": "By how I feel about myself",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Internal measures reflect authentic growth"
        },
        {
          "option_text": "By feedback from others",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "External validation has limitations"
        },
        {
          "option_text": "By goals achieved",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Goals are milestones, not the whole journey"
        },
        {
          "option_text": "By comparing to my past self",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Progress over perfection"
        }
      ]
    }
  ]'::jsonb
);

-- Enhanced Assessment 2: Emotional Intelligence Mastery Quiz (10 questions)
SELECT public.create_assessment_with_questions(
  'Emotional Intelligence Mastery Assessment',
  'Evaluate your emotional intelligence across self-awareness, self-regulation, social awareness, and relationship management to unlock your full potential.',
  'quiz',
  'public',
  'intermediate',
  'emotional intelligence',
  'openai',
  'gpt-4o-mini',
  'Comprehensive emotional intelligence assessment covering all four domains of EQ',
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
          "score_value": 1,
          "feedback": "Pushing through may lead to burnout"
        },
        {
          "option_text": "Take a step back and assess the situation",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Pausing allows for wise responses"
        },
        {
          "option_text": "Seek immediate help from others",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Seeking support shows emotional intelligence"
        },
        {
          "option_text": "Withdraw and avoid the situation",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Avoidance may increase overwhelm"
        }
      ]
    },
    {
      "question_text": "How accurately can you identify your emotions as they arise?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Emotional awareness is the foundation of emotional intelligence.",
      "options": [
        {
          "option_text": "I can name specific emotions instantly",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Precise emotional vocabulary enhances EQ"
        },
        {
          "option_text": "I recognize general feelings (good/bad)",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Developing specificity improves emotional clarity"
        },
        {
          "option_text": "I notice emotions after they''ve passed",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Practicing present-moment awareness helps"
        },
        {
          "option_text": "I often don''t know what I''m feeling",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Emotion journaling can build awareness"
        }
      ]
    },
    {
      "question_text": "In a heated discussion, how do you typically respond?",
      "question_type": "multiple_choice",
      "position": 3,
      "points": 1,
      "explanation": "Your conflict response reveals emotional regulation abilities.",
      "options": [
        {
          "option_text": "Stay calm and listen actively",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Calm presence de-escalates conflicts"
        },
        {
          "option_text": "Get defensive and argue my point",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Defensiveness blocks understanding"
        },
        {
          "option_text": "Shut down and disengage",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Disengagement prevents resolution"
        },
        {
          "option_text": "Try to find middle ground quickly",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Seeking harmony shows social awareness"
        }
      ]
    },
    {
      "question_text": "How well do you pick up on others'' emotional states?",
      "question_type": "multiple_choice",
      "position": 4,
      "points": 1,
      "explanation": "Reading others'' emotions is key to social intelligence.",
      "options": [
        {
          "option_text": "I notice subtle cues and unspoken feelings",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "High empathy enhances relationships"
        },
        {
          "option_text": "I pick up on obvious emotions",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Good foundation for deeper awareness"
        },
        {
          "option_text": "I focus more on words than feelings",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Tuning into nonverbals enriches understanding"
        },
        {
          "option_text": "I often misread others'' emotions",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Practice observing without assuming"
        }
      ]
    },
    {
      "question_text": "When someone shares difficult emotions with you, you:",
      "question_type": "multiple_choice",
      "position": 5,
      "points": 1,
      "explanation": "Your response to others'' emotions shows empathetic capacity.",
      "options": [
        {
          "option_text": "Listen fully and validate their feelings",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Validation creates emotional safety"
        },
        {
          "option_text": "Immediately offer solutions",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Sometimes presence matters more than solutions"
        },
        {
          "option_text": "Share your similar experiences",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Balance sharing with focused listening"
        },
        {
          "option_text": "Feel uncomfortable and change topics",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Building comfort with emotions deepens connections"
        }
      ]
    },
    {
      "question_text": "How do you handle criticism?",
      "question_type": "multiple_choice",
      "position": 6,
      "points": 1,
      "explanation": "Response to criticism reveals emotional maturity.",
      "options": [
        {
          "option_text": "Consider it objectively for growth",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Growth mindset transforms criticism into opportunity"
        },
        {
          "option_text": "Feel hurt but try to learn",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Feeling and learning can coexist"
        },
        {
          "option_text": "Defend myself immediately",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Pause before responding"
        },
        {
          "option_text": "Take it very personally",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Separating feedback from self-worth helps"
        }
      ]
    },
    {
      "question_text": "In group settings, you tend to:",
      "question_type": "multiple_choice",
      "position": 7,
      "points": 1,
      "explanation": "Group behavior reveals social emotional intelligence.",
      "options": [
        {
          "option_text": "Read the room and adapt accordingly",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Social flexibility enhances group dynamics"
        },
        {
          "option_text": "Focus on my own agenda",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Balancing personal and group needs matters"
        },
        {
          "option_text": "Observe more than participate",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Finding your voice enriches groups"
        },
        {
          "option_text": "Try to lead or direct",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Leadership includes knowing when to follow"
        }
      ]
    },
    {
      "question_text": "How do you manage stress in your daily life?",
      "question_type": "multiple_choice",
      "position": 8,
      "points": 1,
      "explanation": "Stress management reflects emotional self-care.",
      "options": [
        {
          "option_text": "Regular practices like meditation or exercise",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Proactive practices build resilience"
        },
        {
          "option_text": "Deal with it as it comes",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Reactive approaches may overwhelm"
        },
        {
          "option_text": "Often feel overwhelmed",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Small daily practices can help"
        },
        {
          "option_text": "Distract myself with activities",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Healthy distractions differ from avoidance"
        }
      ]
    },
    {
      "question_text": "When making decisions, emotions play what role?",
      "question_type": "multiple_choice",
      "position": 9,
      "points": 1,
      "explanation": "Integrating emotion and logic optimizes decisions.",
      "options": [
        {
          "option_text": "I consider them as valuable information",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Emotions provide important data"
        },
        {
          "option_text": "I try to ignore them completely",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Suppressing emotions can backfire"
        },
        {
          "option_text": "They often override my logic",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Balance emotion with reasoning"
        },
        {
          "option_text": "I''m not sure of their influence",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Awareness of emotional influence helps"
        }
      ]
    },
    {
      "question_text": "How comfortable are you expressing vulnerability?",
      "question_type": "multiple_choice",
      "position": 10,
      "points": 1,
      "explanation": "Vulnerability is strength in emotional intelligence.",
      "options": [
        {
          "option_text": "I share authentically when appropriate",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Appropriate vulnerability deepens connections"
        },
        {
          "option_text": "Only with very close people",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Selective vulnerability shows wisdom"
        },
        {
          "option_text": "I prefer to appear strong",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Strength includes showing humanity"
        },
        {
          "option_text": "It depends on my mood",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Intentional vulnerability serves relationships"
        }
      ]
    }
  ]'::jsonb
);

-- Enhanced Assessment 3: Relationship Harmony Assessment (10 questions)
SELECT public.create_assessment_with_questions(
  'Relationship Harmony Assessment',
  'Gain deep insights into your relationship patterns, attachment style, and communication effectiveness to build more fulfilling connections.',
  'quiz',
  'public',
  'intermediate',
  'relationships',
  'openai',
  'gpt-4o-mini',
  'Comprehensive relationship assessment covering attachment, communication, boundaries, and connection patterns',
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
          "score_value": 1,
          "feedback": "Avoidance can lead to unresolved issues"
        },
        {
          "option_text": "Address issues directly but respectfully",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Direct communication builds trust"
        },
        {
          "option_text": "Wait for the other person to bring it up",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Taking initiative shows maturity"
        },
        {
          "option_text": "Get emotional and reactive",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Managing emotions improves outcomes"
        }
      ]
    },
    {
      "question_text": "How do you typically express love and care?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Understanding love languages improves connection.",
      "options": [
        {
          "option_text": "Through words of affirmation",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "Words can powerfully affirm others"
        },
        {
          "option_text": "Through acts of service",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Actions speak volumes about care"
        },
        {
          "option_text": "Through quality time",
          "is_correct": true,
          "position": 3,
          "score_value": 4,
          "feedback": "Presence is a precious gift"
        },
        {
          "option_text": "Through physical touch or gifts",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Tangible expressions create connection"
        }
      ]
    },
    {
      "question_text": "What''s your biggest relationship challenge?",
      "question_type": "multiple_choice",
      "position": 3,
      "points": 1,
      "explanation": "Identifying challenges helps focus improvement efforts.",
      "options": [
        {
          "option_text": "Setting healthy boundaries",
          "is_correct": true,
          "position": 1,
          "score_value": 3,
          "feedback": "Boundaries create sustainable relationships"
        },
        {
          "option_text": "Trusting others fully",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Trust builds gradually with consistency"
        },
        {
          "option_text": "Expressing my needs clearly",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Clear needs prevent misunderstandings"
        },
        {
          "option_text": "Maintaining independence",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Balance of togetherness and autonomy"
        }
      ]
    },
    {
      "question_text": "How do you handle relationship disappointments?",
      "question_type": "multiple_choice",
      "position": 4,
      "points": 1,
      "explanation": "Processing disappointment affects relationship resilience.",
      "options": [
        {
          "option_text": "Communicate my feelings openly",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Open communication heals and strengthens"
        },
        {
          "option_text": "Withdraw and process alone",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Balance solo processing with sharing"
        },
        {
          "option_text": "Pretend everything is fine",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Authenticity prevents resentment"
        },
        {
          "option_text": "End the relationship quickly",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Working through challenges builds depth"
        }
      ]
    },
    {
      "question_text": "In relationships, you need:",
      "question_type": "multiple_choice",
      "position": 5,
      "points": 1,
      "explanation": "Knowing your needs helps create fulfilling relationships.",
      "options": [
        {
          "option_text": "Deep emotional connection",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Emotional intimacy creates lasting bonds"
        },
        {
          "option_text": "Lots of personal space",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Space allows individual growth"
        },
        {
          "option_text": "Constant reassurance",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Building inner security helps relationships"
        },
        {
          "option_text": "Intellectual stimulation",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Mental connection enhances bonding"
        }
      ]
    },
    {
      "question_text": "How do you build trust in relationships?",
      "question_type": "multiple_choice",
      "position": 6,
      "points": 1,
      "explanation": "Trust-building strategies shape relationship quality.",
      "options": [
        {
          "option_text": "Through consistent actions over time",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Consistency is the foundation of trust"
        },
        {
          "option_text": "By being completely open immediately",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Gradual opening can be healthier"
        },
        {
          "option_text": "By testing the other person",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Testing can damage trust"
        },
        {
          "option_text": "I struggle to trust others",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Small steps can rebuild trust capacity"
        }
      ]
    },
    {
      "question_text": "What role do you typically play in relationships?",
      "question_type": "multiple_choice",
      "position": 7,
      "points": 1,
      "explanation": "Relationship roles affect dynamics and satisfaction.",
      "options": [
        {
          "option_text": "Equal partner and collaborator",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Equality creates sustainable relationships"
        },
        {
          "option_text": "The caregiver and supporter",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Balance giving with receiving"
        },
        {
          "option_text": "The one who needs support",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Interdependence is healthy"
        },
        {
          "option_text": "It varies by relationship",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Flexibility shows relational intelligence"
        }
      ]
    },
    {
      "question_text": "How do you maintain long-term relationships?",
      "question_type": "multiple_choice",
      "position": 8,
      "points": 1,
      "explanation": "Maintenance strategies determine relationship longevity.",
      "options": [
        {
          "option_text": "Regular check-ins and quality time",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Intentional connection sustains bonds"
        },
        {
          "option_text": "Assuming they''ll always be there",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Relationships need active nurturing"
        },
        {
          "option_text": "Occasional contact when convenient",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Consistency deepens connections"
        },
        {
          "option_text": "Focus on shared activities",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Activities plus emotional connection"
        }
      ]
    },
    {
      "question_text": "What attracts you most in relationships?",
      "question_type": "multiple_choice",
      "position": 9,
      "points": 1,
      "explanation": "Understanding attraction patterns guides healthy choices.",
      "options": [
        {
          "option_text": "Emotional maturity and stability",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Maturity creates lasting relationships"
        },
        {
          "option_text": "Excitement and unpredictability",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Balance excitement with stability"
        },
        {
          "option_text": "Someone who needs me",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Mutual support over dependency"
        },
        {
          "option_text": "Shared values and goals",
          "is_correct": false,
          "position": 4,
          "score_value": 4,
          "feedback": "Alignment creates harmony"
        }
      ]
    },
    {
      "question_text": "How do you handle relationship transitions?",
      "question_type": "multiple_choice",
      "position": 10,
      "points": 1,
      "explanation": "Managing transitions affects relationship evolution.",
      "options": [
        {
          "option_text": "Communicate openly about changes",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Communication eases transitions"
        },
        {
          "option_text": "Resist change to maintain comfort",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Flexibility allows growth"
        },
        {
          "option_text": "Let things evolve naturally",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Balance flow with intention"
        },
        {
          "option_text": "Feel anxious about changes",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Change is natural in relationships"
        }
      ]
    }
  ]'::jsonb
);

-- Enhanced Assessment 4: Holistic Self-Care Evaluation (10 questions)
SELECT public.create_assessment_with_questions(
  'Holistic Self-Care Evaluation',
  'Assess your self-care practices across physical, mental, emotional, and spiritual dimensions to create a personalized wellness plan.',
  'quiz',
  'public',
  'beginner',
  'wellness',
  'openai',
  'gpt-4o-mini',
  'Comprehensive self-care assessment covering all dimensions of wellness',
  '[
    {
      "question_text": "How often do you engage in activities that truly rejuvenate you?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Regular self-care is essential for sustainable well-being.",
      "options": [
        {
          "option_text": "Daily - it''s a non-negotiable priority",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Consistent self-care creates resilience"
        },
        {
          "option_text": "Weekly - when I remember",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Regular practice supports balance"
        },
        {
          "option_text": "Monthly - when I have time",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Consider smaller daily practices"
        },
        {
          "option_text": "Rarely - I feel guilty taking time for myself",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Self-care enables you to care for others"
        }
      ]
    },
    {
      "question_text": "What''s your relationship with your body?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Body relationship affects overall wellness.",
      "options": [
        {
          "option_text": "I listen to and honor its needs",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Body wisdom guides wellness"
        },
        {
          "option_text": "I often push through discomfort",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Honoring limits prevents burnout"
        },
        {
          "option_text": "I''m often disconnected from it",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Reconnecting enhances well-being"
        },
        {
          "option_text": "I have a love-hate relationship",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Cultivating body appreciation helps"
        }
      ]
    },
    {
      "question_text": "How do you nourish your mental health?",
      "question_type": "multiple_choice",
      "position": 3,
      "points": 1,
      "explanation": "Mental health practices are crucial for overall wellness.",
      "options": [
        {
          "option_text": "Regular therapy or counseling",
          "is_correct": false,
          "position": 1,
          "score_value": 4,
          "feedback": "Professional support is valuable"
        },
        {
          "option_text": "Meditation, journaling, or mindfulness",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Mindfulness practices build resilience"
        },
        {
          "option_text": "Talking with friends when needed",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Social support is important"
        },
        {
          "option_text": "I don''t have specific practices",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Small daily practices make a difference"
        }
      ]
    },
    {
      "question_text": "What''s your sleep quality like?",
      "question_type": "multiple_choice",
      "position": 4,
      "points": 1,
      "explanation": "Sleep quality affects all aspects of wellness.",
      "options": [
        {
          "option_text": "Consistently restful and restorative",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Quality sleep supports optimal health"
        },
        {
          "option_text": "Usually good with occasional issues",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Generally healthy sleep patterns"
        },
        {
          "option_text": "Often disrupted or insufficient",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Sleep hygiene can help"
        },
        {
          "option_text": "Chronic sleep problems",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Consider professional sleep support"
        }
      ]
    },
    {
      "question_text": "How do you handle stress in your daily life?",
      "question_type": "multiple_choice",
      "position": 5,
      "points": 1,
      "explanation": "Stress management is central to self-care.",
      "options": [
        {
          "option_text": "Proactive practices and boundaries",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Prevention is powerful self-care"
        },
        {
          "option_text": "React as stress arises",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Building proactive habits helps"
        },
        {
          "option_text": "Often feel overwhelmed",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Small stress-relief practices help"
        },
        {
          "option_text": "Push through until I crash",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Regular breaks prevent burnout"
        }
      ]
    },
    {
      "question_text": "What role does movement play in your life?",
      "question_type": "multiple_choice",
      "position": 6,
      "points": 1,
      "explanation": "Movement is medicine for body and mind.",
      "options": [
        {
          "option_text": "Joyful daily movement I love",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Enjoyable movement is sustainable"
        },
        {
          "option_text": "Regular exercise routine",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Consistency supports health"
        },
        {
          "option_text": "Sporadic when motivated",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Finding enjoyable movement helps"
        },
        {
          "option_text": "Little to no regular movement",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Start with 5 minutes daily"
        }
      ]
    },
    {
      "question_text": "How connected do you feel to your spiritual side?",
      "question_type": "multiple_choice",
      "position": 7,
      "points": 1,
      "explanation": "Spiritual connection enhances overall wellness.",
      "options": [
        {
          "option_text": "Deeply connected through regular practice",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Spiritual practice nourishes the soul"
        },
        {
          "option_text": "Somewhat connected",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Nurturing this connection enriches life"
        },
        {
          "option_text": "Curious but not actively engaged",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Exploration can be rewarding"
        },
        {
          "option_text": "Not important to me",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Spirituality takes many forms"
        }
      ]
    },
    {
      "question_text": "How do you practice emotional self-care?",
      "question_type": "multiple_choice",
      "position": 8,
      "points": 1,
      "explanation": "Emotional self-care prevents burnout and builds resilience.",
      "options": [
        {
          "option_text": "Regular emotional processing and release",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Processing emotions maintains balance"
        },
        {
          "option_text": "Talk to friends when upset",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Support systems are valuable"
        },
        {
          "option_text": "Distract myself from difficult feelings",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Feeling emotions helps them pass"
        },
        {
          "option_text": "Push through emotional discomfort",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Emotions need acknowledgment"
        }
      ]
    },
    {
      "question_text": "What''s your relationship with saying ''no''?",
      "question_type": "multiple_choice",
      "position": 9,
      "points": 1,
      "explanation": "Boundaries are essential self-care.",
      "options": [
        {
          "option_text": "I say no easily to protect my energy",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Clear boundaries support wellness"
        },
        {
          "option_text": "Getting better at it",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Progress in boundary-setting matters"
        },
        {
          "option_text": "Struggle but trying",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Practice makes it easier"
        },
        {
          "option_text": "I rarely say no",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Your needs matter too"
        }
      ]
    },
    {
      "question_text": "How do you define self-care success?",
      "question_type": "multiple_choice",
      "position": 10,
      "points": 1,
      "explanation": "Your definition shapes your practice.",
      "options": [
        {
          "option_text": "Feeling balanced and energized",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Energy and balance indicate good self-care"
        },
        {
          "option_text": "Never getting sick or tired",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Unrealistic expectations create pressure"
        },
        {
          "option_text": "Meeting all my obligations",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Self-care isn''t just about productivity"
        },
        {
          "option_text": "Having time for everything",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Quality over quantity in self-care"
        }
      ]
    }
  ]'::jsonb
);

-- Enhanced Assessment 5: Life Purpose Discovery Journey (Free-text exploration)
SELECT public.create_assessment_with_questions(
  'Life Purpose Discovery Journey',
  'Embark on a transformative exploration of your core values, passions, gifts, and calling to uncover your unique life purpose.',
  'exploration',
  'public',
  'intermediate',
  'purpose',
  'openai',
  'gpt-4o-mini',
  'Deep life purpose exploration through reflective questions and guided discovery',
  '[
    {
      "question_text": "When you imagine your ideal life 5 years from now, what aspect excites you most? Describe the vision that makes your heart sing.",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Your vision reveals what truly matters to you and where your passion lies."
    },
    {
      "question_text": "What activities make you lose track of time because you enjoy them so much? When do you feel most alive and in flow?",
      "question_type": "free_text",
      "position": 2,
      "explanation": "Flow states often indicate areas where your natural talents and interests align."
    },
    {
      "question_text": "What injustices or problems in the world make you feel called to action? What change do you most want to see?",
      "question_type": "free_text",
      "position": 3,
      "explanation": "Your passion for change often points to your purpose."
    },
    {
      "question_text": "What unique combination of experiences, skills, and perspectives do you bring that no one else has?",
      "question_type": "free_text",
      "position": 4,
      "explanation": "Your unique gifts are clues to your purpose."
    },
    {
      "question_text": "If you knew you couldn''t fail and resources were unlimited, what would you create or contribute to the world?",
      "question_type": "free_text",
      "position": 5,
      "explanation": "Removing limitations reveals your true desires."
    },
    {
      "question_text": "What themes or patterns have appeared throughout your life? What keeps calling you back?",
      "question_type": "free_text",
      "position": 6,
      "explanation": "Life patterns often reveal deeper purpose."
    },
    {
      "question_text": "Who do you feel most called to serve or help? What group of people or cause resonates deeply with you?",
      "question_type": "free_text",
      "position": 7,
      "explanation": "Your calling often involves serving others."
    },
    {
      "question_text": "What legacy do you want to leave? How do you want to be remembered?",
      "question_type": "free_text",
      "position": 8,
      "explanation": "Legacy thinking clarifies life purpose."
    }
  ]'::jsonb
);

-- Enhanced Assessment 6: Confidence & Empowerment Blueprint (10 questions)
SELECT public.create_assessment_with_questions(
  'Confidence & Empowerment Blueprint',
  'Uncover your confidence patterns, identify limiting beliefs, and create a personalized roadmap to unshakeable self-assurance and personal power.',
  'quiz',
  'public',
  'beginner',
  'confidence',
  'openai',
  'gpt-4o-mini',
  'Comprehensive confidence assessment covering self-belief, assertiveness, and personal empowerment',
  '[
    {
      "question_text": "When faced with a new challenge, your inner voice typically says:",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Your inner dialogue shapes your confidence and actions.",
      "options": [
        {
          "option_text": "I can learn and figure this out",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Growth mindset fuels confidence"
        },
        {
          "option_text": "This might be too difficult for me",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Challenge negative self-talk"
        },
        {
          "option_text": "I should wait until I''m more prepared",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Perfection can block progress"
        },
        {
          "option_text": "Others are better suited for this",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "You have unique strengths"
        }
      ]
    },
    {
      "question_text": "How do you typically celebrate your achievements?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Celebrating success builds lasting confidence.",
      "options": [
        {
          "option_text": "I acknowledge them briefly then move on",
          "is_correct": false,
          "position": 1,
          "score_value": 2,
          "feedback": "Savor successes longer"
        },
        {
          "option_text": "I share them with people who matter",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Sharing multiplies joy and confidence"
        },
        {
          "option_text": "I downplay them - anyone could have done it",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Own your accomplishments fully"
        },
        {
          "option_text": "I rarely acknowledge achievements",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Recognition builds confidence"
        }
      ]
    },
    {
      "question_text": "In social or professional settings, you tend to:",
      "question_type": "multiple_choice",
      "position": 3,
      "points": 1,
      "explanation": "How you show up reveals confidence levels.",
      "options": [
        {
          "option_text": "Speak up and share your ideas confidently",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Your voice matters"
        },
        {
          "option_text": "Wait to be asked for input",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Initiative demonstrates confidence"
        },
        {
          "option_text": "Doubt if your ideas are valuable",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Your perspective is unique and valuable"
        },
        {
          "option_text": "Let others take the lead",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Step into your leadership"
        }
      ]
    },
    {
      "question_text": "How do you handle compliments?",
      "question_type": "multiple_choice",
      "position": 4,
      "points": 1,
      "explanation": "Receiving compliments gracefully reflects self-worth.",
      "options": [
        {
          "option_text": "Accept them with genuine thanks",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Graceful acceptance shows confidence"
        },
        {
          "option_text": "Deflect or minimize them",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Allow others to appreciate you"
        },
        {
          "option_text": "Feel uncomfortable but say thanks",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Practice receiving with ease"
        },
        {
          "option_text": "Wonder if they''re being sincere",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Trust positive feedback"
        }
      ]
    },
    {
      "question_text": "What''s your biggest confidence challenge?",
      "question_type": "multiple_choice",
      "position": 5,
      "points": 1,
      "explanation": "Identifying challenges helps target growth.",
      "options": [
        {
          "option_text": "Imposter syndrome",
          "is_correct": false,
          "position": 1,
          "score_value": 2,
          "feedback": "You belong where you are"
        },
        {
          "option_text": "Fear of judgment",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Others'' opinions don''t define you"
        },
        {
          "option_text": "Comparing myself to others",
          "is_correct": true,
          "position": 3,
          "score_value": 2,
          "feedback": "Your journey is unique"
        },
        {
          "option_text": "Past failures or criticism",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "The past doesn''t determine your future"
        }
      ]
    },
    {
      "question_text": "How do you assert your boundaries?",
      "question_type": "multiple_choice",
      "position": 6,
      "points": 1,
      "explanation": "Boundary setting reflects self-respect and confidence.",
      "options": [
        {
          "option_text": "Clearly and without guilt",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Strong boundaries show self-respect"
        },
        {
          "option_text": "With difficulty but I do it",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Practice makes it easier"
        },
        {
          "option_text": "I often feel guilty saying no",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Your needs are valid"
        },
        {
          "option_text": "I struggle to set boundaries",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Start with small boundaries"
        }
      ]
    },
    {
      "question_text": "What''s your relationship with risk-taking?",
      "question_type": "multiple_choice",
      "position": 7,
      "points": 1,
      "explanation": "Calculated risks build confidence through experience.",
      "options": [
        {
          "option_text": "I take calculated risks regularly",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Smart risks accelerate growth"
        },
        {
          "option_text": "I prefer my comfort zone",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Growth happens outside comfort"
        },
        {
          "option_text": "I overthink before acting",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Trust your judgment more"
        },
        {
          "option_text": "Fear usually stops me",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Small steps build courage"
        }
      ]
    },
    {
      "question_text": "How do you view your mistakes?",
      "question_type": "multiple_choice",
      "position": 8,
      "points": 1,
      "explanation": "Your relationship with mistakes affects confidence resilience.",
      "options": [
        {
          "option_text": "As learning opportunities",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "This mindset builds resilience"
        },
        {
          "option_text": "As proof I''m not good enough",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Mistakes are human and helpful"
        },
        {
          "option_text": "I try to hide them",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Authenticity builds confidence"
        },
        {
          "option_text": "They shake my confidence",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Reframe mistakes as data"
        }
      ]
    },
    {
      "question_text": "What empowers you most?",
      "question_type": "multiple_choice",
      "position": 9,
      "points": 1,
      "explanation": "Understanding your power sources helps cultivate confidence.",
      "options": [
        {
          "option_text": "Knowledge and continuous learning",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "Learning expands possibilities"
        },
        {
          "option_text": "Supporting and uplifting others",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Service strengthens confidence"
        },
        {
          "option_text": "Achieving my goals",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Success builds on success"
        },
        {
          "option_text": "Being authentically myself",
          "is_correct": true,
          "position": 4,
          "score_value": 4,
          "feedback": "Authenticity is ultimate power"
        }
      ]
    },
    {
      "question_text": "How do you want to feel about yourself in one year?",
      "question_type": "multiple_choice",
      "position": 10,
      "points": 1,
      "explanation": "Vision creates direction for confidence building.",
      "options": [
        {
          "option_text": "Unshakeable and self-assured",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "This vision is achievable"
        },
        {
          "option_text": "More confident than now",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Specific goals accelerate growth"
        },
        {
          "option_text": "Less worried about others'' opinions",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Freedom from judgment is powerful"
        },
        {
          "option_text": "I hope to feel better",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Claim your confidence actively"
        }
      ]
    }
  ]'::jsonb
);

-- Grant necessary permissions
GRANT ALL ON public.assessments TO authenticated;
GRANT ALL ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_options TO authenticated;
GRANT ALL ON public.assessment_results TO authenticated;

-- Grant permissions for anonymous users to view public assessments
GRANT SELECT ON public.assessments TO anon;
GRANT SELECT ON public.assessment_questions TO anon;
GRANT SELECT ON public.assessment_options TO anon;