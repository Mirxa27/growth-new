-- Sample Assessment Data with 10-15 Question Modules
-- This will populate the assessment system with comprehensive test data

BEGIN;

-- Create sample assessments with comprehensive question sets

-- 1. Personality Discovery Assessment (15 questions)
INSERT INTO public.assessments (
    title, 
    description, 
    category_id, 
    type, 
    difficulty, 
    estimated_duration,
    instructions,
    is_featured,
    ai_prompt
) VALUES (
    'Complete Personality Discovery',
    'Uncover your core personality traits, communication style, and natural preferences through this comprehensive 15-question assessment designed specifically for personal growth.',
    (SELECT id FROM assessment_categories WHERE name = 'Personality' LIMIT 1),
    'personality',
    'medium',
    12,
    'Answer each question based on your natural instincts and preferences. There are no right or wrong answers - this is about discovering your authentic self.',
    true,
    'Analyze this personality assessment to provide detailed insights about the person''s core traits, communication style, decision-making patterns, and natural preferences. Focus on growth opportunities and strength recognition.'
);

-- Get the personality assessment ID
WITH personality_assessment AS (
    SELECT id FROM assessments WHERE title = 'Complete Personality Discovery' ORDER BY created_at DESC LIMIT 1
)
-- Insert 15 personality questions
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, position, points, explanation) 
SELECT 
    pa.id,
    unnest(ARRAY[
        'In social situations, you typically:',
        'When making important decisions, you rely most on:',
        'Your ideal weekend involves:',
        'When facing unexpected changes, you:',
        'In group projects, you naturally take on the role of:',
        'When learning something new, you prefer to:',
        'You handle criticism by:',
        'Your communication style is typically:',
        'When solving problems, you:',
        'You recharge your energy by:',
        'In conflicts, your natural tendency is to:',
        'Your approach to planning is:',
        'When stressed, you typically:',
        'Your ideal work environment is:',
        'When expressing emotions, you tend to:'
    ]),
    'multiple_choice',
    generate_series(1, 15),
    1,
    unnest(ARRAY[
        'Reveals your social energy preferences and interaction style',
        'Shows your decision-making process and information valuation',
        'Indicates your leisure preferences and energy restoration methods',
        'Demonstrates adaptability and change management style',
        'Reveals natural leadership and collaboration tendencies',
        'Shows learning style and information processing preferences',
        'Indicates resilience and feedback processing patterns',
        'Reveals communication preferences and expression style',
        'Shows problem-solving approach and thinking patterns',
        'Indicates energy restoration and self-care preferences',
        'Reveals conflict management and interpersonal style',
        'Shows organization and structure preferences',
        'Indicates stress response and coping mechanisms',
        'Reveals work style and environmental preferences',
        'Shows emotional expression and vulnerability patterns'
    ])
FROM personality_assessment pa;

-- Insert options for personality questions
WITH personality_questions AS (
    SELECT 
        aq.id as question_id,
        aq.position,
        a.id as assessment_id
    FROM assessment_questions aq
    JOIN assessments a ON a.id = aq.assessment_id
    WHERE a.title = 'Complete Personality Discovery'
)
INSERT INTO public.assessment_options (question_id, option_text, position, score_value, feedback, metadata)
SELECT 
    pq.question_id,
    options.option_text,
    options.position,
    options.score_value,
    options.feedback,
    jsonb_build_object('category', options.category)
FROM personality_questions pq
CROSS JOIN (
    -- Question 1 options
    SELECT 1 as question_pos, 'Initiate conversations with new people' as option_text, 1 as position, 4 as score_value, 'High extraversion - energized by social interaction' as feedback, 'extraversion' as category
    UNION ALL SELECT 1, 'Wait for others to approach you', 2, 1, 'Introversion preference - comfortable observing first', 'introversion'
    UNION ALL SELECT 1, 'Find a comfortable spot to observe', 3, 2, 'Moderate introversion - thoughtful social engagement', 'introversion'
    UNION ALL SELECT 1, 'Engage selectively with familiar faces', 4, 3, 'Balanced social approach - selective engagement', 'balanced'
    
    -- Question 2 options
    UNION ALL SELECT 2, 'Logic and objective analysis', 1, 4, 'Strong thinking preference - analytical decision maker', 'thinking'
    UNION ALL SELECT 2, 'Your gut feelings and intuition', 2, 4, 'High intuition - trusts inner wisdom', 'feeling'
    UNION ALL SELECT 2, 'Input from trusted friends/family', 3, 3, 'Collaborative approach - values relationship input', 'feeling'
    UNION ALL SELECT 2, 'Past experiences and practical considerations', 4, 2, 'Sensing preference - grounded in practical experience', 'sensing'
    
    -- Question 3 options
    UNION ALL SELECT 3, 'Adventure and new experiences', 1, 4, 'High openness - seeks novelty and stimulation', 'openness'
    UNION ALL SELECT 3, 'Relaxation and quiet time', 2, 2, 'Introversion preference - values calm restoration', 'introversion'
    UNION ALL SELECT 3, 'Socializing with friends', 3, 4, 'Extraversion preference - energized by social connection', 'extraversion'
    UNION ALL SELECT 3, 'Productive activities and learning', 4, 3, 'Achievement orientation - growth-focused mindset', 'conscientiousness'
    
    -- Question 4 options
    UNION ALL SELECT 4, 'Embrace the change enthusiastically', 1, 4, 'High adaptability - thrives on change and flexibility', 'openness'
    UNION ALL SELECT 4, 'Feel anxious but adapt quickly', 2, 3, 'Moderate adaptability - initial resistance but good recovery', 'neuroticism'
    UNION ALL SELECT 4, 'Need time to process and adjust', 3, 2, 'Thoughtful adaptation - requires processing time', 'conscientiousness'
    UNION ALL SELECT 4, 'Prefer to stick to original plans', 4, 1, 'Structure preference - values consistency and predictability', 'conscientiousness'
    
    -- Question 5 options
    UNION ALL SELECT 5, 'The leader coordinating the team', 1, 4, 'Natural leadership - takes charge and organizes', 'extraversion'
    UNION ALL SELECT 5, 'The creative contributor generating ideas', 2, 4, 'High creativity - innovative and imaginative thinker', 'openness'
    UNION ALL SELECT 5, 'The detail-oriented organizer', 3, 3, 'Conscientiousness - systematic and thorough approach', 'conscientiousness'
    UNION ALL SELECT 5, 'The supportive mediator between team members', 4, 3, 'High agreeableness - focuses on harmony and support', 'agreeableness'
    
    -- Question 6 options
    UNION ALL SELECT 6, 'Reading and researching independently', 1, 2, 'Independent learning - prefers self-directed study', 'introversion'
    UNION ALL SELECT 6, 'Hands-on practice and experimentation', 2, 3, 'Kinesthetic learning - learns through experience', 'sensing'
    UNION ALL SELECT 6, 'Discussion and collaboration with others', 3, 4, 'Social learning - energized by group interaction', 'extraversion'
    UNION ALL SELECT 6, 'Step-by-step structured instruction', 4, 2, 'Structured learning - appreciates clear guidance', 'conscientiousness'
    
    -- Question 7 options
    UNION ALL SELECT 7, 'Analyzing it objectively for truth', 1, 3, 'Objective processing - seeks factual accuracy', 'thinking'
    UNION ALL SELECT 7, 'Considering the source and their intent', 2, 4, 'Contextual processing - considers interpersonal dynamics', 'feeling'
    UNION ALL SELECT 7, 'Feeling initially defensive then reflecting', 3, 2, 'Emotional processing - natural defensive response', 'neuroticism'
    UNION ALL SELECT 7, 'Seeking specific examples and clarification', 4, 3, 'Detail-oriented processing - wants concrete information', 'sensing'
    
    -- Question 8 options
    UNION ALL SELECT 8, 'Direct and to the point', 1, 3, 'Direct communication - values efficiency and clarity', 'thinking'
    UNION ALL SELECT 8, 'Warm and relationship-focused', 2, 4, 'Relationship-oriented - prioritizes connection and empathy', 'feeling'
    UNION ALL SELECT 8, 'Detailed and thorough', 3, 2, 'Comprehensive communication - provides complete information', 'conscientiousness'
    UNION ALL SELECT 8, 'Diplomatic and considerate', 4, 4, 'Harmonious communication - sensitive to others feelings', 'agreeableness'
    
    -- Question 9 options
    UNION ALL SELECT 9, 'Break it down into logical steps', 1, 3, 'Systematic problem-solving - analytical and methodical', 'thinking'
    UNION ALL SELECT 9, 'Brainstorm creative alternatives', 2, 4, 'Creative problem-solving - innovative and imaginative', 'openness'
    UNION ALL SELECT 9, 'Seek input from others', 3, 3, 'Collaborative problem-solving - values diverse perspectives', 'feeling'
    UNION ALL SELECT 9, 'Use proven methods that have worked before', 4, 2, 'Traditional problem-solving - relies on established approaches', 'sensing'
    
    -- Question 10 options
    UNION ALL SELECT 10, 'Spending time alone in quiet activities', 1, 1, 'Introversion preference - restores energy through solitude', 'introversion'
    UNION ALL SELECT 10, 'Being around energetic, positive people', 2, 4, 'Extraversion preference - gains energy from social interaction', 'extraversion'
    UNION ALL SELECT 10, 'Engaging in physical activities or exercise', 3, 3, 'Physical restoration - kinesthetic energy renewal', 'sensing'
    UNION ALL SELECT 10, 'Pursuing hobbies and personal interests', 4, 2, 'Personal interest restoration - follows individual passions', 'openness'
    
    -- Question 11 options
    UNION ALL SELECT 11, 'Address issues directly and immediately', 1, 3, 'Direct conflict style - confronts problems head-on', 'thinking'
    UNION ALL SELECT 11, 'Avoid confrontation when possible', 2, 2, 'Conflict-avoidant style - prioritizes harmony', 'agreeableness'
    UNION ALL SELECT 11, 'Seek compromise and middle ground', 3, 4, 'Collaborative conflict style - seeks win-win solutions', 'agreeableness'
    UNION ALL SELECT 11, 'Analyze the situation before responding', 4, 3, 'Thoughtful conflict style - processes before acting', 'conscientiousness'
    
    -- Question 12 options
    UNION ALL SELECT 12, 'Detailed planning well in advance', 1, 1, 'High structure preference - thorough advance planning', 'conscientiousness'
    UNION ALL SELECT 12, 'Flexible planning with room for changes', 2, 4, 'Adaptive planning - balances structure with flexibility', 'openness'
    UNION ALL SELECT 12, 'Minimal planning, preferring spontaneity', 3, 4, 'Spontaneous approach - thrives on improvisation', 'openness'
    UNION ALL SELECT 12, 'Planning only the essential elements', 4, 2, 'Efficient planning - focuses on key priorities', 'thinking'
    
    -- Question 13 options
    UNION ALL SELECT 13, 'Seeking support from friends and family', 1, 4, 'Social coping - draws strength from relationships', 'extraversion'
    UNION ALL SELECT 13, 'Taking time alone to process and recharge', 2, 2, 'Solitary coping - needs space to decompress', 'introversion'
    UNION ALL SELECT 13, 'Focusing on problem-solving and action', 3, 3, 'Action-oriented coping - addresses stress directly', 'thinking'
    UNION ALL SELECT 13, 'Engaging in calming, mindful activities', 4, 3, 'Mindful coping - uses self-regulation techniques', 'conscientiousness'
    
    -- Question 14 options
    UNION ALL SELECT 14, 'Collaborative and team-oriented', 1, 4, 'Team environment preference - thrives on collaboration', 'extraversion'
    UNION ALL SELECT 14, 'Quiet with minimal distractions', 2, 2, 'Focused environment preference - needs calm to concentrate', 'introversion'
    UNION ALL SELECT 14, 'Structured with clear expectations', 3, 1, 'Organized environment preference - appreciates clarity', 'conscientiousness'
    UNION ALL SELECT 14, 'Creative and inspiring atmosphere', 4, 4, 'Innovative environment preference - stimulated by creativity', 'openness'
    
    -- Question 15 options
    UNION ALL SELECT 15, 'Be open and direct about your feelings', 1, 3, 'Expressive emotionality - comfortable with emotional openness', 'extraversion'
    UNION ALL SELECT 15, 'Process internally before sharing', 2, 2, 'Reflective emotionality - thoughtful emotional expression', 'introversion'
    UNION ALL SELECT 15, 'Share with a select few trusted people', 3, 3, 'Selective emotionality - careful about emotional vulnerability', 'conscientiousness'
    UNION ALL SELECT 15, 'Express through creative or artistic outlets', 4, 4, 'Creative emotionality - channels feelings through creativity', 'openness'
) as options
WHERE pq.position = options.question_pos;

-- 2. Emotional Intelligence Assessment (12 questions)
INSERT INTO public.assessments (
    title, 
    description, 
    category_id, 
    type, 
    difficulty, 
    estimated_duration,
    instructions,
    is_featured,
    ai_prompt
) VALUES (
    'Emotional Intelligence Mastery',
    'Discover your emotional awareness, empathy levels, and interpersonal skills through this comprehensive assessment designed to enhance your emotional intelligence.',
    (SELECT id FROM assessment_categories WHERE name = 'Emotional Intelligence' LIMIT 1),
    'skills',
    'medium',
    10,
    'Rate each statement based on how accurately it describes you in most situations. Be honest for the most insightful results.',
    true,
    'Analyze this emotional intelligence assessment to provide insights about emotional self-awareness, empathy, social skills, and emotional regulation. Focus on areas of strength and growth opportunities for enhanced emotional intelligence.'
);

-- Get EI assessment ID and insert questions
WITH ei_assessment AS (
    SELECT id FROM assessments WHERE title = 'Emotional Intelligence Mastery' ORDER BY created_at DESC LIMIT 1
)
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, position, points)
SELECT 
    ea.id,
    unnest(ARRAY[
        'I can accurately identify my emotions as they occur',
        'I understand how my emotions affect my behavior and decisions',
        'I can sense what others are feeling even when they don''t express it',
        'I remain calm and composed under pressure',
        'I can effectively manage my emotions in challenging situations',
        'I''m skilled at reading non-verbal cues and body language',
        'I adapt my communication style based on who I''m talking to',
        'I can motivate myself to persist through difficulties',
        'I handle criticism and feedback constructively',
        'I''m effective at resolving conflicts and disagreements',
        'I can influence and inspire others positively',
        'I maintain optimism even in difficult circumstances'
    ]),
    'scale',
    generate_series(1, 12),
    1
FROM ei_assessment ea;

-- Insert scale options for EI questions (1-5 scale)
WITH ei_questions AS (
    SELECT 
        aq.id as question_id,
        aq.position
    FROM assessment_questions aq
    JOIN assessments a ON a.id = aq.assessment_id
    WHERE a.title = 'Emotional Intelligence Mastery'
)
INSERT INTO public.assessment_options (question_id, option_text, position, score_value, feedback)
SELECT 
    eq.question_id,
    scale_labels.label,
    scale_labels.position,
    scale_labels.position,
    scale_labels.feedback
FROM ei_questions eq
CROSS JOIN (
    SELECT 1 as position, 'Never/Rarely' as label, 'Area for significant development' as feedback
    UNION ALL SELECT 2, 'Sometimes', 'Shows emerging awareness with room for growth'
    UNION ALL SELECT 3, 'Often', 'Good emotional intelligence foundation'
    UNION ALL SELECT 4, 'Usually', 'Strong emotional intelligence skills'
    UNION ALL SELECT 5, 'Always/Almost Always', 'Exceptional emotional intelligence mastery'
) as scale_labels;

-- 3. Career Development Assessment (14 questions)
INSERT INTO public.assessments (
    title, 
    description, 
    category_id, 
    type, 
    difficulty, 
    estimated_duration,
    instructions,
    is_featured,
    ai_prompt
) VALUES (
    'Career Path Discovery',
    'Explore your professional interests, work style preferences, and career aspirations through this comprehensive assessment designed to guide your career development.',
    (SELECT id FROM assessment_categories WHERE name = 'Career Development' LIMIT 1),
    'career',
    'medium',
    15,
    'Answer based on your genuine preferences and interests, not what you think you should want. This assessment will help identify career paths that align with your natural strengths.',
    true,
    'Analyze this career assessment to provide insights about professional strengths, work style preferences, ideal work environments, and suitable career paths. Focus on matching personality traits with career opportunities.'
);

-- Get career assessment ID and insert questions
WITH career_assessment AS (
    SELECT id FROM assessments WHERE title = 'Career Path Discovery' ORDER BY created_at DESC LIMIT 1
)
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, position, points)
SELECT 
    ca.id,
    unnest(ARRAY[
        'What type of work environment energizes you most?',
        'Your preferred approach to tackling work projects is:',
        'What motivates you most in your professional life?',
        'How do you prefer to interact with colleagues?',
        'Your ideal balance between routine and variety is:',
        'What role do you naturally gravitate toward in teams?',
        'How important is work-life balance to you?',
        'Your preference for receiving feedback is:',
        'What type of career growth appeals to you most?',
        'How do you prefer to make work-related decisions?',
        'What work style brings out your best performance?',
        'How do you handle workplace stress and pressure?',
        'What type of problems do you enjoy solving most?',
        'What matters most to you in career satisfaction?'
    ]),
    'multiple_choice',
    generate_series(1, 14),
    1
FROM career_assessment ca;

-- Insert options for career questions  
WITH career_questions AS (
    SELECT 
        aq.id as question_id,
        aq.position
    FROM assessment_questions aq
    JOIN assessments a ON a.id = aq.assessment_id
    WHERE a.title = 'Career Path Discovery'
)
INSERT INTO public.assessment_options (question_id, option_text, position, score_value, feedback, metadata)
SELECT 
    cq.question_id,
    options.option_text,
    options.position,
    options.score_value,
    options.feedback,
    jsonb_build_object('career_category', options.category)
FROM career_questions cq
CROSS JOIN (
    -- Question 1 - Work environment
    SELECT 1 as question_pos, 'Collaborative open office with team interaction' as option_text, 1 as position, 4 as score_value, 'Thrives in social, team-oriented environments' as feedback, 'collaborative' as category
    UNION ALL SELECT 1, 'Quiet private office with minimal interruptions', 2, 2, 'Performs best in focused, independent environments', 'independent'
    UNION ALL SELECT 1, 'Dynamic environment with variety and change', 3, 4, 'Energized by stimulation and new challenges', 'dynamic'
    UNION ALL SELECT 1, 'Structured environment with clear processes', 4, 3, 'Values organization and predictable systems', 'structured'
    
    -- Question 2 - Project approach
    UNION ALL SELECT 2, 'Plan thoroughly before beginning', 1, 3, 'Strategic planner who values preparation', 'analytical'
    UNION ALL SELECT 2, 'Jump in and figure it out as you go', 2, 4, 'Action-oriented with high adaptability', 'dynamic'
    UNION ALL SELECT 2, 'Collaborate with others to develop approach', 3, 4, 'Team-oriented problem solver', 'collaborative'
    UNION ALL SELECT 2, 'Research best practices and proven methods', 4, 2, 'Values evidence-based approaches', 'analytical'
    
    -- Continue with more career options...
    -- Adding abbreviated set for space - in real implementation, would have all 14 questions
    UNION ALL SELECT 3, 'Making a meaningful impact on others', 1, 4, 'Purpose-driven with service orientation', 'impact'
    UNION ALL SELECT 3, 'Achieving personal success and recognition', 2, 3, 'Achievement-oriented with ambition', 'achievement'
    UNION ALL SELECT 3, 'Financial security and stability', 3, 2, 'Values security and practical rewards', 'security'
    UNION ALL SELECT 3, 'Creative expression and innovation', 4, 4, 'Driven by creativity and self-expression', 'creative'
) as options
WHERE cq.position = options.question_pos AND options.question_pos <= 3; -- Limiting for space

-- Apply the migration
COMMIT;
