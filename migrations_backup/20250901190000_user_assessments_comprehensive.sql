-- 20 Comprehensive Assessments for Registered Users
-- These assessments cover various aspects of personal development, wellness, and growth

-- Assessment 1: Career Purpose & Fulfillment Assessment
SELECT public.create_assessment_with_questions(
  'Career Purpose & Fulfillment Assessment',
  'Discover alignment between your career and life purpose, identify areas for professional growth, and create a roadmap for meaningful work.',
  'quiz',
  'private',
  'intermediate',
  'career',
  'openai',
  'gpt-4o-mini',
  'Career fulfillment and purpose alignment assessment',
  '[
    {
      "question_text": "How aligned is your current work with your personal values?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Value alignment is crucial for career satisfaction.",
      "options": [
        {"option_text": "Completely aligned", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Mostly aligned", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Somewhat misaligned", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Significantly misaligned", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 2: Financial Wellness & Abundance Mindset
SELECT public.create_assessment_with_questions(
  'Financial Wellness & Abundance Mindset Assessment',
  'Evaluate your relationship with money, identify limiting beliefs, and develop strategies for financial empowerment and abundance.',
  'quiz',
  'private',
  'intermediate',
  'finance',
  'openai',
  'gpt-4o-mini',
  'Financial wellness and money mindset assessment',
  '[
    {
      "question_text": "What best describes your relationship with money?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Your money relationship affects financial outcomes.",
      "options": [
        {"option_text": "Healthy and empowered", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Working on improvement", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Anxious and uncertain", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Avoidant or fearful", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 3: Trauma Healing & Resilience Assessment
SELECT public.create_assessment_with_questions(
  'Trauma Healing & Resilience Assessment',
  'Gently explore your healing journey, identify areas needing support, and discover pathways to post-traumatic growth and resilience.',
  'exploration',
  'private',
  'advanced',
  'healing',
  'openai',
  'gpt-4o-mini',
  'Trauma-informed healing and resilience assessment',
  '[
    {
      "question_text": "Where are you in your healing journey? What support would be most helpful right now?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Understanding your current needs guides healing."
    }
  ]'::jsonb
);

-- Assessment 4: Spiritual Awakening & Connection Assessment
SELECT public.create_assessment_with_questions(
  'Spiritual Awakening & Connection Assessment',
  'Explore your spiritual journey, identify practices that resonate, and deepen your connection to the sacred in everyday life.',
  'exploration',
  'private',
  'intermediate',
  'spirituality',
  'openai',
  'gpt-4o-mini',
  'Spiritual growth and connection assessment',
  '[
    {
      "question_text": "How do you currently experience the sacred or spiritual in your life?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Spiritual connection takes many forms."
    }
  ]'::jsonb
);

-- Assessment 5: Creative Expression & Innovation Assessment
SELECT public.create_assessment_with_questions(
  'Creative Expression & Innovation Assessment',
  'Unlock your creative potential, identify blocks, and develop strategies to express your unique gifts and innovations.',
  'quiz',
  'private',
  'beginner',
  'creativity',
  'openai',
  'gpt-4o-mini',
  'Creativity and innovation potential assessment',
  '[
    {
      "question_text": "How often do you engage in creative activities?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Regular creative practice nurtures innovation.",
      "options": [
        {"option_text": "Daily creative practice", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Weekly creative time", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Occasional creativity", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Rarely express creatively", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 6: Leadership & Influence Assessment
SELECT public.create_assessment_with_questions(
  'Leadership & Influence Assessment',
  'Discover your leadership style, identify strengths and growth areas, and develop your capacity for positive influence and impact.',
  'quiz',
  'private',
  'advanced',
  'leadership',
  'openai',
  'gpt-4o-mini',
  'Leadership potential and influence assessment',
  '[
    {
      "question_text": "What type of leader do you naturally tend to be?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Understanding your style enhances leadership.",
      "options": [
        {"option_text": "Visionary and inspiring", "is_correct": false, "position": 1, "score_value": 4},
        {"option_text": "Collaborative and inclusive", "is_correct": true, "position": 2, "score_value": 4},
        {"option_text": "Strategic and analytical", "is_correct": false, "position": 3, "score_value": 4},
        {"option_text": "Supportive and nurturing", "is_correct": false, "position": 4, "score_value": 4}
      ]
    }
  ]'::jsonb
);

-- Assessment 7: Parenting & Family Dynamics Assessment
SELECT public.create_assessment_with_questions(
  'Parenting & Family Dynamics Assessment',
  'Explore your parenting style, family patterns, and create strategies for nurturing healthy, connected family relationships.',
  'exploration',
  'private',
  'intermediate',
  'family',
  'openai',
  'gpt-4o-mini',
  'Parenting and family dynamics assessment',
  '[
    {
      "question_text": "What values are most important for you to pass on to your children or future generations?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Clarifying values guides parenting decisions."
    }
  ]'::jsonb
);

-- Assessment 8: Health & Vitality Optimization Assessment
SELECT public.create_assessment_with_questions(
  'Health & Vitality Optimization Assessment',
  'Comprehensively evaluate your physical health, energy levels, and create a personalized plan for optimal vitality and longevity.',
  'quiz',
  'private',
  'intermediate',
  'health',
  'openai',
  'gpt-4o-mini',
  'Physical health and vitality assessment',
  '[
    {
      "question_text": "How would you rate your overall energy levels?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Energy levels indicate overall health status.",
      "options": [
        {"option_text": "Abundant and consistent", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Generally good", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Often low or fluctuating", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Chronically depleted", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 9: Time Management & Productivity Assessment
SELECT public.create_assessment_with_questions(
  'Time Management & Productivity Assessment',
  'Analyze how you use your time, identify productivity blocks, and create systems for achieving more while maintaining balance.',
  'quiz',
  'private',
  'beginner',
  'productivity',
  'openai',
  'gpt-4o-mini',
  'Time management and productivity assessment',
  '[
    {
      "question_text": "How well do you manage competing priorities?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Priority management is key to productivity.",
      "options": [
        {"option_text": "Excellently with clear systems", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Well most of the time", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Often feel overwhelmed", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Constantly struggling", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 10: Communication Mastery Assessment
SELECT public.create_assessment_with_questions(
  'Communication Mastery Assessment',
  'Evaluate your communication skills across different contexts and develop strategies for clear, compassionate, and effective expression.',
  'quiz',
  'private',
  'intermediate',
  'communication',
  'openai',
  'gpt-4o-mini',
  'Communication skills and effectiveness assessment',
  '[
    {
      "question_text": "How effectively do you communicate your needs?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Clear communication prevents misunderstandings.",
      "options": [
        {"option_text": "Very clearly and directly", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Usually well", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Sometimes struggle", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Often go unheard", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 11: Anxiety & Stress Resilience Assessment
SELECT public.create_assessment_with_questions(
  'Anxiety & Stress Resilience Assessment',
  'Understand your stress patterns, anxiety triggers, and build a personalized toolkit for calm, resilience, and emotional regulation.',
  'quiz',
  'private',
  'intermediate',
  'mental health',
  'openai',
  'gpt-4o-mini',
  'Anxiety management and stress resilience assessment',
  '[
    {
      "question_text": "How well do you manage anxiety when it arises?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Anxiety management skills can be developed.",
      "options": [
        {"option_text": "Very effectively with tools", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Moderately well", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "With difficulty", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Feel overwhelmed by it", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 12: Body Image & Self-Love Assessment
SELECT public.create_assessment_with_questions(
  'Body Image & Self-Love Assessment',
  'Explore your relationship with your body, heal negative patterns, and cultivate radical self-love and body acceptance.',
  'exploration',
  'private',
  'intermediate',
  'self-love',
  'openai',
  'gpt-4o-mini',
  'Body image and self-love assessment',
  '[
    {
      "question_text": "Describe your current relationship with your body. What would you like to heal or transform?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Body relationships can be transformed with compassion."
    }
  ]'::jsonb
);

-- Assessment 13: Boundaries & Assertiveness Assessment
SELECT public.create_assessment_with_questions(
  'Boundaries & Assertiveness Assessment',
  'Identify boundary patterns, develop assertiveness skills, and create strategies for maintaining healthy limits in all relationships.',
  'quiz',
  'private',
  'intermediate',
  'boundaries',
  'openai',
  'gpt-4o-mini',
  'Boundaries and assertiveness assessment',
  '[
    {
      "question_text": "How comfortable are you setting boundaries?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Healthy boundaries protect your energy.",
      "options": [
        {"option_text": "Very comfortable and clear", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Getting better at it", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Often struggle", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Find it very difficult", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 14: Life Transitions & Change Navigation
SELECT public.create_assessment_with_questions(
  'Life Transitions & Change Navigation Assessment',
  'Assess your readiness for change, develop transition skills, and create strategies for navigating life changes with grace.',
  'exploration',
  'private',
  'advanced',
  'transitions',
  'openai',
  'gpt-4o-mini',
  'Life transitions and change management assessment',
  '[
    {
      "question_text": "What major transition are you currently facing or anticipating? How prepared do you feel?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Awareness helps navigate transitions smoothly."
    }
  ]'::jsonb
);

-- Assessment 15: Intuition & Inner Wisdom Assessment
SELECT public.create_assessment_with_questions(
  'Intuition & Inner Wisdom Assessment',
  'Strengthen your connection to intuition, learn to trust inner guidance, and develop practices for accessing your inner wisdom.',
  'quiz',
  'private',
  'intermediate',
  'intuition',
  'openai',
  'gpt-4o-mini',
  'Intuition and inner wisdom development assessment',
  '[
    {
      "question_text": "How connected are you to your intuition?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Intuition is a powerful guide when trusted.",
      "options": [
        {"option_text": "Deeply connected and trusting", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Growing connection", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Sometimes hear it", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Rarely trust it", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 16: Sexual Wellness & Intimacy Assessment
SELECT public.create_assessment_with_questions(
  'Sexual Wellness & Intimacy Assessment',
  'Explore your relationship with sexuality, identify areas for healing or growth, and create a path to fulfilling intimate connections.',
  'exploration',
  'private',
  'advanced',
  'intimacy',
  'openai',
  'gpt-4o-mini',
  'Sexual wellness and intimacy assessment',
  '[
    {
      "question_text": "What aspects of intimacy and sexuality would you like to explore or heal?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Sexual wellness is part of overall health."
    }
  ]'::jsonb
);

-- Assessment 17: Aging & Wisdom Integration Assessment
SELECT public.create_assessment_with_questions(
  'Aging & Wisdom Integration Assessment',
  'Embrace the aging process, integrate accumulated wisdom, and create a vision for thriving through all life stages.',
  'exploration',
  'private',
  'advanced',
  'aging',
  'openai',
  'gpt-4o-mini',
  'Aging gracefully and wisdom integration assessment',
  '[
    {
      "question_text": "How do you view aging and what wisdom have you gained from your life experiences?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Each life stage offers unique gifts."
    }
  ]'::jsonb
);

-- Assessment 18: Social Impact & Contribution Assessment
SELECT public.create_assessment_with_questions(
  'Social Impact & Contribution Assessment',
  'Identify your unique contribution to the world, explore ways to create positive impact, and align your actions with your values.',
  'quiz',
  'private',
  'intermediate',
  'impact',
  'openai',
  'gpt-4o-mini',
  'Social impact and contribution assessment',
  '[
    {
      "question_text": "How do you currently contribute to positive change?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Everyone can create meaningful impact.",
      "options": [
        {"option_text": "Through active service/activism", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "In my daily interactions", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Want to do more", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Not sure how to help", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 19: Dreams & Manifestation Assessment
SELECT public.create_assessment_with_questions(
  'Dreams & Manifestation Assessment',
  'Clarify your dreams, identify blocks to manifestation, and create an action plan for bringing your vision into reality.',
  'exploration',
  'private',
  'intermediate',
  'manifestation',
  'openai',
  'gpt-4o-mini',
  'Dreams and manifestation potential assessment',
  '[
    {
      "question_text": "What is your biggest dream that you haven''t yet manifested? What do you believe is holding you back?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Identifying blocks helps clear the path."
    }
  ]'::jsonb
);

-- Assessment 20: Holistic Life Balance Assessment
SELECT public.create_assessment_with_questions(
  'Holistic Life Balance Assessment',
  'Evaluate balance across all life areas, identify priorities, and create a comprehensive plan for whole-life harmony and fulfillment.',
  'quiz',
  'private',
  'intermediate',
  'balance',
  'openai',
  'gpt-4o-mini',
  'Comprehensive life balance assessment',
  '[
    {
      "question_text": "Which life area needs the most attention right now?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Identifying priorities guides focus.",
      "options": [
        {"option_text": "Career/Purpose", "is_correct": false, "position": 1, "score_value": 3},
        {"option_text": "Relationships/Love", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Health/Vitality", "is_correct": true, "position": 3, "score_value": 3},
        {"option_text": "Personal Growth", "is_correct": false, "position": 4, "score_value": 3}
      ]
    }
  ]'::jsonb
);

-- Update permissions
GRANT ALL ON public.assessments TO authenticated;
GRANT ALL ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_options TO authenticated;
GRANT ALL ON public.assessment_results TO authenticated;