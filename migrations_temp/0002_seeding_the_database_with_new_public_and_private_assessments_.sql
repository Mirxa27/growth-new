-- Seeding a public assessment: "Communication Style"
SELECT public.create_assessment_with_questions(
    _title => 'Discover Your Communication Style',
    _description => 'Understand how you communicate and learn how to improve your interactions with others.',
    _type => 'personality',
    _visibility => 'public',
    _ai_provider => 'openai',
    _ai_model => 'gpt-4o-mini',
    _ai_prompt => 'Generate a 5-question personality assessment about communication styles.',
    _questions => '[
        {
            "question_text": "When in a disagreement, you are most likely to:",
            "question_type": "multiple_choice",
            "position": 1,
            "options": [
                {"option_text": "Clearly state your perspective and logic.", "is_correct": false, "position": 1},
                {"option_text": "Listen to the other person and find common ground.", "is_correct": false, "position": 2},
                {"option_text": "Avoid conflict and hope it resolves itself.", "is_correct": false, "position": 3},
                {"option_text": "Express your feelings about the situation openly.", "is_correct": false, "position": 4}
            ]
        },
        {
            "question_text": "How do you prefer to receive feedback?",
            "question_type": "multiple_choice",
            "position": 2,
            "options": [
                {"option_text": "Direct, honest, and to the point.", "is_correct": false, "position": 1},
                {"option_text": "Gentle, encouraging, and focused on positives.", "is_correct": false, "position": 2},
                {"option_text": "In writing, so I can process it on my own time.", "is_correct": false, "position": 3},
                {"option_text": "In a collaborative conversation.", "is_correct": false, "position": 4}
            ]
        }
    ]'::jsonb
);

-- Seeding a public assessment: "Stress Profile"
SELECT public.create_assessment_with_questions(
    _title => 'What''s Your Stress Profile?',
    _description => 'Identify your primary stressors and discover your unique response patterns to pressure.',
    _type => 'personality',
    _visibility => 'public',
    _ai_provider => 'openai',
    _ai_model => 'gpt-4o-mini',
    _ai_prompt => 'Generate a 5-question personality assessment about stress profiles.',
    _questions => '[
        {
            "question_text": "When you feel overwhelmed, your first instinct is to:",
            "question_type": "multiple_choice",
            "position": 1,
            "options": [
                {"option_text": "Create a to-do list and tackle tasks one by one.", "is_correct": false, "position": 1},
                {"option_text": "Talk to a friend or family member about it.", "is_correct": false, "position": 2},
                {"option_text": "Withdraw and spend time alone.", "is_correct": false, "position": 3},
                {"option_text": "Engage in a physical activity like walking or exercise.", "is_correct": false, "position": 4}
            ]
        }
    ]'::jsonb
);

-- Seeding a private assessment: "Core Values Identifier"
SELECT public.create_assessment_with_questions(
    _title => 'Core Values Identifier',
    _description => 'A deep dive to uncover the fundamental principles that guide your life and decisions.',
    _type => 'personality',
    _visibility => 'private',
    _ai_provider => 'openai',
    _ai_model => 'gpt-4o-mini',
    _ai_prompt => 'Generate a 10-question assessment to identify core values.',
    _questions => '[]'::jsonb
);

-- Seeding a private assessment: "Relationship Patterns"
SELECT public.create_assessment_with_questions(
    _title => 'Relationship Patterns Analysis',
    _description => 'Explore your attachment style and recurring patterns in your relationships.',
    _type => 'personality',
    _visibility => 'private',
    _ai_provider => 'openai',
    _ai_model => 'gpt-4o-mini',
    _ai_prompt => 'Generate a 10-question assessment on relationship patterns.',
    _questions => '[]'::jsonb
);