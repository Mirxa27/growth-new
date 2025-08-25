-- Add sample exploration data for the Newomen platform
INSERT INTO public.explorations (
  title,
  description,
  category,
  difficulty_level,
  estimated_duration,
  crystal_reward,
  facilitator_prompt,
  higher_self_prompt,
  questions,
  analysis_structure
) VALUES 
(
  'Confronting the Shadow Self',
  'Explore the hidden aspects of your personality that you may have rejected or denied. This profound journey helps you integrate all parts of yourself with compassion and understanding.',
  'self-discovery',
  'intermediate',
  45,
  150,
  'You are NewMe, a gentle and wise facilitator. Your role is to guide the user through their shadow work exploration with empathy and non-judgment. Simply acknowledge their answers warmly and ask the next question. Do not analyze or interpret until the analysis phase.',
  'You are the user''s Higher Self - their most wise, loving, and compassionate inner voice. You have witnessed their entire journey and understand their deepest truths. Provide insights that are both profound and practical, helping them integrate their shadow aspects with love and acceptance.',
  '[
    "What qualities in others trigger the strongest negative reactions in you? Be specific about what bothers you most.",
    "Think of a time when you acted in a way that surprised or disappointed you. What was happening internally?",
    "What parts of yourself do you try to hide from others? What would happen if people saw these aspects?",
    "When you were growing up, what messages did you receive about which emotions or behaviors were ''acceptable''?",
    "Describe a pattern in your relationships where you keep attracting the same type of challenges or conflicts.",
    "What would your harshest inner critic say about you? Write it in their voice.",
    "If you could ask your 7-year-old self what they needed to feel safe and loved, what would they say?",
    "What dreams or desires have you abandoned because you thought they were ''too much'' or ''unrealistic''?",
    "How do you sabotage yourself when things are going well? What fear might be driving this?",
    "If your shadow self could speak freely for one day, what would they want the world to know about you?"
  ]',
  '{
    "structure": ["Core Shadow Pattern", "Hidden Gold", "Integration Steps", "Shadow Affirmations", "Compassionate Closing"],
    "description": "A comprehensive analysis of the user''s shadow work exploration"
  }'
),
(
  'Deconstructing Relationship Patterns',
  'Examine the recurring patterns in your relationships - romantic, family, and friendships. Discover how your past shapes your present connections and how to create healthier dynamics.',
  'relationships',
  'beginner',
  35,
  100,
  'You are NewMe, a compassionate relationship guide. Help the user explore their relationship patterns with curiosity and kindness. Acknowledge their responses with understanding and guide them to the next question without judgment.',
  'You are their Higher Self who sees all their relationships with clarity and love. Help them understand their patterns not to judge themselves, but to grow and create more authentic connections.',
  '[
    "Describe the relationship dynamic you experienced between your primary caregivers. How did they show love and handle conflict?",
    "What do you consistently seek from others in your relationships? What underlying need does this fulfill?",
    "When conflict arises in your relationships, what is your typical response? Fight, flight, freeze, or fawn?",
    "What type of person do you repeatedly attract into your life? What might they be reflecting back to you?",
    "Describe a relationship that ended. What role did you play in its conclusion?",
    "What boundaries do you struggle to maintain in relationships? Where do you give too much or too little?",
    "When do you feel most authentically yourself in relationships? What conditions allow this?",
    "What fears come up for you around intimacy and being truly seen by another person?",
    "How do you handle it when someone you care about is upset with you or withdraws their attention?",
    "If you could heal one relationship pattern, what would it be and how would your life change?"
  ]',
  '{
    "structure": ["Relationship Core Pattern", "Generational Influence", "Growth Edge", "Relationship Affirmations", "Love Forward Message"],
    "description": "Deep insights into relationship patterns and pathways to healthier connections"
  }'
),
(
  'Healing the Inner Child',
  'Connect with the younger parts of yourself that still need love, attention, and healing. This gentle exploration helps you reparent yourself and break cycles of old pain.',
  'self-discovery',
  'advanced',
  50,
  200,
  'You are NewMe, a nurturing and patient guide for inner child work. Approach this sacred exploration with the gentleness of speaking to a beloved child. Simply hold space and ask questions with infinite compassion.',
  'You are their wise, loving Higher Self who has always been the perfect parent to their inner child. Speak with the voice of unconditional love and provide the healing message their inner child has been waiting to hear.',
  '[
    "When you think of yourself as a child, what age comes to mind immediately? What was happening in your life then?",
    "What did you need as a child that you didn''t receive enough of? Love, attention, safety, understanding, or something else?",
    "What activities brought you pure joy as a child, before you learned to worry about what others thought?",
    "Describe a moment from childhood when you felt misunderstood or alone. What would you want to tell that child now?",
    "What messages about your worth or lovability did you internalize growing up? Who gave you these messages?",
    "When you feel hurt or scared now, how does it echo experiences from your childhood?",
    "What parts of your childhood self do you miss most? What qualities did you have to hide or lose?",
    "If you could go back and be the adult in your childhood home, what would you do differently?",
    "What does your inner child want you to know about your life right now? What wisdom do they have?",
    "How can you nurture and care for your inner child in your daily adult life?"
  ]',
  '{
    "structure": ["Inner Child Core Wound", "Gifts of Your Younger Self", "Reparenting Steps", "Inner Child Affirmations", "Loving Parent Message"],
    "description": "A healing journey to embrace and nurture your inner child"
  }'
),
(
  'Exploring Life Purpose and Calling',
  'Dive deep into your authentic purpose and calling. Explore what truly matters to you beyond external expectations and discover the unique gifts you came here to share.',
  'personal-growth',
  'beginner',
  40,
  125,
  'You are NewMe, an inspiring guide for life purpose exploration. Help the user connect with their authentic calling with enthusiasm and gentle encouragement. Simply witness their answers and guide them forward.',
  'You are their Higher Self who knows their true purpose and the gifts they came to share. Speak with clarity and inspiration about their unique mission and path forward.',
  '[
    "What activities make you lose track of time because you''re so engaged and energized by them?",
    "If you had unlimited resources and couldn''t fail, what would you dedicate your life to creating or changing?",
    "What injustices or problems in the world stir the deepest passion or anger in you?",
    "When you were a child, what did you dream of becoming or doing when you grew up? What called to your heart?",
    "What unique combination of skills, experiences, and perspectives do you bring that others might not have?",
    "What would you regret not trying or expressing if you looked back on your life?",
    "When do you feel most alive and in alignment with who you truly are?",
    "What legacy do you want to leave behind? How do you want to be remembered?",
    "What fear or limiting belief has kept you from pursuing what truly calls to you?",
    "If your life purpose could speak to you right now, what would it say about your next steps?"
  ]',
  '{
    "structure": ["Core Life Mission", "Unique Gifts & Talents", "Purpose-Aligned Actions", "Purpose Affirmations", "Calling Forward Message"],
    "description": "Clarity and direction for living your authentic purpose"
  }'
),
(
  'Transforming Fear into Power',
  'Face your deepest fears and transform them into sources of strength and wisdom. This exploration helps you understand what fear is trying to teach you and how to move forward courageously.',
  'personal-growth',
  'intermediate',
  30,
  100,
  'You are NewMe, a courageous and supportive guide for fear transformation. Help the user face their fears with bravery and compassion. Acknowledge their courage in looking at what scares them and gently guide them to the next question.',
  'You are their fearless Higher Self who sees through all illusions to the truth of their power. Help them transform fear into wisdom and strength.',
  '[
    "What is your greatest fear about your life, relationships, or future? Be completely honest.",
    "When did this fear first appear in your life? What was happening when you first felt this way?",
    "How has this fear protected you or served you in some way? What has it helped you avoid?",
    "What opportunities or experiences have you missed because of this fear?",
    "If this fear had a voice, what would it be trying to tell you about what you need or value?",
    "Describe a time when you acted despite fear and what happened as a result.",
    "What would be possible in your life if this fear no longer controlled your choices?",
    "What small step could you take toward what you fear that would prove you can handle it?",
    "What support or resources would you need to feel more courage in facing this fear?",
    "If fear were your teacher, what is the most important lesson it wants you to learn?"
  ]',
  '{
    "structure": ["Core Fear Pattern", "Fear as Teacher", "Courage Building Steps", "Courage Affirmations", "Fearless Self Message"],
    "description": "Transformation of fear into personal power and wisdom"
  }'
);

-- Add sample breathing practices
INSERT INTO public.breathing_practices (
  title,
  description,
  duration_minutes,
  difficulty_level,
  category,
  instructions,
  audio_url
) VALUES 
(
  'Heart Coherence Breathing',
  'A scientifically-backed breathing technique that creates coherence between your heart, mind, and emotions. Perfect for reducing stress and increasing emotional balance.',
  5,
  1,
  'relaxation',
  '{
    "steps": [
      "Sit comfortably with your back straight",
      "Place one hand on your heart",
      "Breathe in slowly for 5 counts through your nose",
      "Breathe out slowly for 5 counts through your mouth",
      "Focus on feelings of appreciation or gratitude",
      "Continue for the full duration"
    ],
    "benefits": ["Reduces stress hormones", "Improves emotional regulation", "Enhances mental clarity"]
  }',
  NULL
),
(
  'Energizing Morning Breath',
  'An invigorating breathing practice designed to awaken your body and mind. Use this to start your day with vitality and focus.',
  8,
  2,
  'energy',
  '{
    "steps": [
      "Stand with feet hip-width apart",
      "Inhale deeply raising arms overhead",
      "Hold breath for 3 counts",
      "Exhale forcefully while lowering arms",
      "Repeat with increasing intensity",
      "End with 3 deep, calming breaths"
    ],
    "benefits": ["Increases energy levels", "Improves circulation", "Enhances mental alertness"]
  }',
  NULL
),
(
  '4-7-8 Anxiety Relief',
  'Dr. Andrew Weil''s famous technique for calming the nervous system and reducing anxiety. Known as a natural tranquilizer for the mind.',
  10,
  1,
  'relaxation',
  '{
    "steps": [
      "Sit with your back straight",
      "Exhale completely through your mouth",
      "Close your mouth, inhale through nose for 4 counts",
      "Hold your breath for 7 counts",
      "Exhale through mouth for 8 counts making a whoosh sound",
      "Repeat cycle 4 times"
    ],
    "benefits": ["Reduces anxiety", "Promotes better sleep", "Calms the nervous system"]
  }',
  NULL
),
(
  'Focus Enhancement Breath',
  'A concentration-building practice that sharpens mental focus and clarity. Ideal before important tasks or meditation.',
  12,
  2,
  'focus',
  '{
    "steps": [
      "Sit in meditation posture",
      "Close your eyes and focus on your breath",
      "Count each inhale and exhale up to 10",
      "When you reach 10, start over at 1",
      "If you lose count, gently return to 1",
      "Notice increased mental clarity"
    ],
    "benefits": ["Improves concentration", "Enhances mindfulness", "Reduces mental chatter"]
  }',
  NULL
),
(
  'Deep Healing Breath',
  'A profound breathing practice for emotional healing and release. Creates space for processing and letting go of stored emotions.',
  20,
  3,
  'relaxation',
  '{
    "steps": [
      "Lie down comfortably with eyes closed",
      "Begin with natural breathing",
      "Gradually deepen each breath",
      "Breathe into your belly, then chest",
      "Pause briefly before each exhale",
      "Allow any emotions to arise and pass",
      "End with gratitude for your body"
    ],
    "benefits": ["Promotes emotional release", "Reduces stored tension", "Enhances self-compassion"]
  }',
  NULL
);

-- Add balance wheel areas
INSERT INTO public.balance_wheel_areas (
  name,
  description,
  icon,
  color,
  order_index
) VALUES 
('Health & Wellness', 'Physical health, mental wellbeing, energy levels, and self-care practices', 'Heart', '#10B981', 1),
('Career & Purpose', 'Professional growth, life purpose, meaningful work, and contribution to the world', 'Briefcase', '#3B82F6', 2),
('Relationships & Love', 'Romantic relationships, family bonds, friendships, and social connections', 'Users', '#EC4899', 3),
('Personal Growth', 'Learning, spiritual development, self-awareness, and continuous improvement', 'TrendingUp', '#8B5CF6', 4),
('Financial Security', 'Money management, financial goals, abundance mindset, and economic stability', 'DollarSign', '#F59E0B', 5),
('Fun & Recreation', 'Hobbies, entertainment, adventure, play, and activities that bring joy', 'Smile', '#06B6D4', 6),
('Home & Environment', 'Living space, organization, comfort, and environmental harmony', 'Home', '#84CC16', 7),
('Contribution & Legacy', 'Giving back, making a difference, and the mark you want to leave on the world', 'Globe', '#EF4444', 8);

-- Add personality questions for assessment
INSERT INTO public.personality_questions (
  question_text,
  question_type,
  category,
  options,
  order_index
) VALUES 
(
  'When facing a difficult decision, you typically:',
  'multiple_choice',
  'decision_making',
  '[
    {"value": "intuitive", "text": "Trust your gut feeling and inner wisdom"},
    {"value": "analytical", "text": "Gather data and analyze all possible outcomes"},
    {"value": "social", "text": "Seek advice from trusted friends or mentors"},
    {"value": "experiential", "text": "Try different approaches and learn by doing"}
  ]',
  1
),
(
  'In social situations, you feel most energized when:',
  'multiple_choice',
  'social_energy',
  '[
    {"value": "large_groups", "text": "In large groups with lots of stimulating conversation"},
    {"value": "small_groups", "text": "In intimate settings with a few close friends"},
    {"value": "one_on_one", "text": "Having deep, meaningful one-on-one conversations"},
    {"value": "alone_time", "text": "You prefer quiet time alone to recharge"}
  ]',
  2
),
(
  'Your ideal approach to personal growth involves:',
  'multiple_choice',
  'growth_style',
  '[
    {"value": "structured", "text": "Following structured programs and clear frameworks"},
    {"value": "intuitive", "text": "Following your intuition and inner guidance"},
    {"value": "collaborative", "text": "Learning through relationships and shared experiences"},
    {"value": "experimental", "text": "Trying new experiences and reflecting on them"}
  ]',
  3
),
(
  'When you encounter stress or overwhelm, you naturally:',
  'multiple_choice',
  'stress_response',
  '[
    {"value": "action", "text": "Take immediate action to solve the problem"},
    {"value": "reflection", "text": "Step back and reflect on the deeper meaning"},
    {"value": "support", "text": "Reach out to others for support and guidance"},
    {"value": "solitude", "text": "Retreat into solitude to process and recharge"}
  ]',
  4
),
(
  'Your core motivation in life is driven by:',
  'multiple_choice',
  'life_motivation',
  '[
    {"value": "achievement", "text": "Achieving goals and making tangible progress"},
    {"value": "connection", "text": "Building deep, meaningful relationships"},
    {"value": "growth", "text": "Continuous learning and self-improvement"},
    {"value": "contribution", "text": "Making a positive impact on the world"}
  ]',
  5
),
(
  'You feel most authentic and alive when:',
  'multiple_choice',
  'authenticity',
  '[
    {"value": "creating", "text": "Creating something new or expressing creativity"},
    {"value": "helping", "text": "Helping others and making a difference"},
    {"value": "exploring", "text": "Exploring new ideas, places, or experiences"},
    {"value": "connecting", "text": "Connecting deeply with yourself or others"}
  ]',
  6
);

-- Add daily affirmations
INSERT INTO public.daily_affirmations (
  text,
  category,
  personality_types,
  cultural_context
) VALUES 
('I trust my inner wisdom to guide me toward my highest good', 'self-trust', '{"intuitive", "reflective"}', NULL),
('I am worthy of love, success, and all the beautiful experiences life offers', 'self-worth', '{}', NULL),
('My authentic self is my greatest strength and gift to the world', 'authenticity', '{}', NULL),
('I embrace challenges as opportunities for growth and expansion', 'growth', '{"achiever", "explorer"}', NULL),
('I release what no longer serves me and welcome positive change', 'letting-go', '{}', NULL),
('My relationships are built on love, respect, and mutual understanding', 'relationships', '{"connector", "helper"}', NULL),
('I have the courage to pursue my dreams and live my purpose', 'courage', '{"achiever", "creator"}', NULL),
('I am grateful for my journey and trust in perfect timing', 'gratitude', '{}', NULL),
('My voice matters and my contributions make a difference', 'contribution', '{"helper", "creator"}', NULL),
('I choose peace, joy, and love in every moment', 'emotional-balance', '{}', NULL),
('أنا قوية وقادرة على تحقيق أحلامي', 'empowerment', '{}', 'arabic'),
('I honor my cultural heritage while embracing my unique path', 'cultural-identity', '{}', 'multicultural'),
('My sensitivity is a superpower that connects me to others', 'sensitivity', '{"intuitive", "connector"}', NULL),
('I create boundaries that protect my energy and well-being', 'boundaries', '{}', NULL),
('Every experience teaches me something valuable about myself', 'learning', '{"growth", "explorer"}', NULL);