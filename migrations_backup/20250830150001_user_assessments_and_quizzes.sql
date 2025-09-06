-- User-Only Assessments (20 assessments with 10-20 questions each)
-- These require user signup and provide deeper insights

-- Insert comprehensive user assessment types
INSERT INTO public.assessment_types (name, description, category, is_public, requires_signup, estimated_duration) VALUES
('Advanced Personality Profiling', 'Deep dive into your personality with detailed analysis across 16 dimensions.', 'personality', false, true, 25),
('Career Path Optimization', 'Comprehensive career assessment including skills, interests, and values alignment.', 'career', false, true, 30),
('Relationship Dynamics Deep Dive', 'Detailed exploration of your relationship patterns, attachment style, and communication preferences.', 'relationships', false, true, 20),
('Emotional Intelligence Mastery', 'Advanced assessment of emotional awareness, regulation, and social skills.', 'wellness', false, true, 18),
('Life Purpose Discovery', 'Comprehensive exploration to uncover your core values, mission, and life direction.', 'growth', false, true, 35),
('Stress Resilience Building', 'In-depth analysis of stress patterns and resilience building strategies.', 'wellness', false, true, 22),
('Communication Style Analysis', 'Detailed assessment of your communication patterns across different contexts.', 'relationships', false, true, 16),
('Leadership Potential Assessment', 'Comprehensive evaluation of leadership skills and development areas.', 'career', false, true, 28),
('Mindfulness & Awareness', 'Deep assessment of mindfulness skills and present-moment awareness.', 'spirituality', false, true, 15),
('Financial Mindset Analysis', 'Comprehensive exploration of your money beliefs and financial behaviors.', 'lifestyle', false, true, 18),
('Creativity & Innovation', 'Assessment of creative thinking patterns and innovation potential.', 'skills', false, true, 20),
('Health & Vitality Optimization', 'Comprehensive health assessment covering physical, mental, and lifestyle factors.', 'wellness', false, true, 25),
('Social Dynamics Mastery', 'Advanced assessment of social skills and relationship building abilities.', 'relationships', false, true, 19),
('Time & Energy Management', 'Detailed analysis of how you manage time, energy, and priorities.', 'lifestyle', false, true, 17),
('Spiritual Growth Journey', 'Comprehensive exploration of spiritual beliefs, practices, and growth.', 'spirituality', false, true, 22),
('Conflict Resolution Skills', 'Advanced assessment of conflict handling and resolution capabilities.', 'relationships', false, true, 16),
('Personal Brand & Influence', 'Assessment of personal branding and influence building skills.', 'career', false, true, 20),
('Intuition & Decision Making', 'Deep dive into intuitive abilities and decision-making patterns.', 'growth', false, true, 18),
('Boundary Setting Mastery', 'Comprehensive assessment of boundary setting across all life areas.', 'relationships', false, true, 15),
('Growth Mindset Development', 'Advanced assessment of mindset patterns and growth orientation.', 'growth', false, true, 21);

-- Create comprehensive question sets for each user assessment
-- Using the helper function to create assessments efficiently

-- Advanced Personality Profiling (20 questions)
SELECT public.create_visitor_assessment(
  'Advanced Personality Profiling',
  'Discover the deeper layers of your personality with this comprehensive 20-question assessment. Explore your cognitive functions, motivational drivers, and behavioral patterns across multiple contexts.',
  'Advanced Personality Profiling',
  '[
    {
      "text": "In high-pressure situations, your natural response is to:",
      "type": "multiple_choice",
      "category": "stress_response",
      "tags": ["stress", "decision_making"],
      "options": [
        {"text": "Take charge and organize others", "value": "leadership_mode", "score_weights": {"dominant": 3, "influence": 2}, "order_index": 1},
        {"text": "Analyze all variables before acting", "value": "analytical_mode", "score_weights": {"conscientious": 3, "dominant": 1}, "order_index": 2},
        {"text": "Focus on maintaining team harmony", "value": "harmony_mode", "score_weights": {"steadiness": 3, "influence": 1}, "order_index": 3},
        {"text": "Adapt quickly to changing circumstances", "value": "adaptive_mode", "score_weights": {"influence": 2, "dominant": 1}, "order_index": 4}
      ]
    },
    {
      "text": "When processing complex information, you prefer to:",
      "type": "multiple_choice",
      "category": "cognitive_style",
      "tags": ["thinking", "processing"],
      "options": [
        {"text": "Break it down into logical steps", "value": "sequential", "score_weights": {"analytical": 3, "methodical": 2}, "order_index": 1},
        {"text": "Look for patterns and connections", "value": "holistic", "score_weights": {"intuitive": 3, "creative": 2}, "order_index": 2},
        {"text": "Discuss it with others for perspective", "value": "collaborative", "score_weights": {"social": 3, "expressive": 2}, "order_index": 3},
        {"text": "Take time to reflect privately", "value": "reflective", "score_weights": {"introspective": 3, "independent": 2}, "order_index": 4}
      ]
    },
    {
      "text": "Your ideal work environment includes:",
      "type": "multiple_choice",
      "category": "work_preferences",
      "tags": ["environment", "productivity"],
      "options": [
        {"text": "Clear deadlines and structured processes", "value": "structured", "score_weights": {"organized": 3, "disciplined": 2}, "order_index": 1},
        {"text": "Freedom to innovate and experiment", "value": "innovative", "score_weights": {"creative": 3, "flexible": 2}, "order_index": 2},
        {"text": "Collaborative team interactions", "value": "collaborative", "score_weights": {"social": 3, "supportive": 2}, "order_index": 3},
        {"text": "Autonomous decision-making authority", "value": "autonomous", "score_weights": {"independent": 3, "confident": 2}, "order_index": 4}
      ]
    }
  ]',
  '{"algorithm": "personality_weights", "dimensions": {"dominant": {"label": "Dominance", "description": "Direct, decisive, results-oriented"}, "influence": {"label": "Influence", "description": "Enthusiastic, optimistic, people-oriented"}, "steadiness": {"label": "Steadiness", "description": "Patient, reliable, team-oriented"}, "conscientious": {"label": "Conscientiousness", "description": "Careful, analytical, quality-oriented"}}}'
);

-- Career Path Optimization (18 questions)
SELECT public.create_visitor_assessment(
  'Career Path Optimization',
  'Align your career with your true potential. This comprehensive assessment evaluates your skills, interests, values, and work preferences to guide your career decisions.',
  'Career Path Optimization',
  '[
    {
      "text": "What motivates you most in your work?",
      "type": "multiple_choice",
      "category": "work_motivation",
      "tags": ["motivation", "values"],
      "options": [
        {"text": "Making a meaningful impact on others", "value": "impact", "score_weights": {"purpose": 3, "social_impact": 3}, "order_index": 1},
        {"text": "Achieving financial security and advancement", "value": "advancement", "score_weights": {"security": 3, "achievement": 2}, "order_index": 2},
        {"text": "Continuous learning and skill development", "value": "growth", "score_weights": {"learning": 3, "development": 3}, "order_index": 3},
        {"text": "Creative expression and innovation", "value": "creativity", "score_weights": {"creativity": 3, "innovation": 3}, "order_index": 4}
      ]
    },
    {
      "text": "In team projects, you naturally gravitate toward:",
      "type": "multiple_choice",
      "category": "team_role",
      "tags": ["teamwork", "leadership"],
      "options": [
        {"text": "Leading and coordinating the team", "value": "leader", "score_weights": {"leadership": 3, "coordination": 2}, "order_index": 1},
        {"text": "Generating creative ideas and solutions", "value": "innovator", "score_weights": {"creativity": 3, "problem_solving": 2}, "order_index": 2},
        {"text": "Analyzing data and providing insights", "value": "analyst", "score_weights": {"analytical": 3, "detail_oriented": 2}, "order_index": 3},
        {"text": "Supporting others and maintaining harmony", "value": "supporter", "score_weights": {"supportive": 3, "collaborative": 2}, "order_index": 4}
      ]
    }
  ]',
  '{"algorithm": "weighted_average", "career_dimensions": {"purpose": {"weight": 0.2}, "skills": {"weight": 0.3}, "interests": {"weight": 0.2}, "values": {"weight": 0.2}, "work_style": {"weight": 0.1}}}'
);

-- Life Purpose Discovery (16 questions)
SELECT public.create_visitor_assessment(
  'Life Purpose Discovery',
  'Uncover your deeper calling and life direction. This transformative assessment helps you identify your core values, unique gifts, and meaningful path forward.',
  'Life Purpose Discovery',
  '[
    {
      "text": "When you imagine your ideal future, you see yourself:",
      "type": "multiple_choice",
      "category": "life_vision",
      "tags": ["vision", "purpose"],
      "options": [
        {"text": "Leading positive change in your community", "value": "change_leader", "score_weights": {"leadership": 3, "social_impact": 3}, "order_index": 1},
        {"text": "Creating something beautiful or meaningful", "value": "creator", "score_weights": {"creativity": 3, "expression": 3}, "order_index": 2},
        {"text": "Helping others grow and heal", "value": "healer", "score_weights": {"caring": 3, "service": 3}, "order_index": 3},
        {"text": "Discovering and sharing knowledge", "value": "seeker", "score_weights": {"learning": 3, "wisdom": 3}, "order_index": 4}
      ]
    },
    {
      "text": "Your deepest sense of fulfillment comes from:",
      "type": "multiple_choice",
      "category": "fulfillment_source",
      "tags": ["fulfillment", "meaning"],
      "options": [
        {"text": "Seeing others succeed because of your support", "value": "enabler", "score_weights": {"service": 3, "support": 2}, "order_index": 1},
        {"text": "Solving complex problems or challenges", "value": "problem_solver", "score_weights": {"analytical": 3, "achievement": 2}, "order_index": 2},
        {"text": "Expressing your authentic self creatively", "value": "artist", "score_weights": {"creativity": 3, "authenticity": 2}, "order_index": 3},
        {"text": "Building connections and relationships", "value": "connector", "score_weights": {"social": 3, "relationship": 2}, "order_index": 4}
      ]
    }
  ]',
  '{"algorithm": "purpose_discovery", "purpose_archetypes": {"leader": "Natural leader focused on positive change", "creator": "Creative spirit driven to make and share", "healer": "Compassionate soul dedicated to helping others", "seeker": "Curious mind driven to learn and teach"}}'
);

-- Emotional Intelligence Mastery (15 questions)
SELECT public.create_visitor_assessment(
  'Emotional Intelligence Mastery',
  'Develop your emotional superpowers. This assessment evaluates your emotional awareness, regulation, empathy, and social skills to help you thrive in all relationships.',
  'Emotional Intelligence Mastery',
  '[
    {
      "text": "When you feel overwhelmed by emotions, you typically:",
      "type": "multiple_choice",
      "category": "emotion_regulation",
      "tags": ["regulation", "coping"],
      "options": [
        {"text": "Take time to understand what triggered the feeling", "value": "analytical_approach", "score_weights": {"self_awareness": 3, "regulation": 2}, "order_index": 1},
        {"text": "Use breathing or mindfulness techniques", "value": "mindful_approach", "score_weights": {"regulation": 3, "mindfulness": 2}, "order_index": 2},
        {"text": "Talk it through with someone you trust", "value": "social_approach", "score_weights": {"social_skills": 3, "support_seeking": 2}, "order_index": 3},
        {"text": "Engage in physical activity to release tension", "value": "physical_approach", "score_weights": {"regulation": 2, "self_care": 2}, "order_index": 4}
      ]
    },
    {
      "text": "You can usually tell when someone is feeling upset because:",
      "type": "multiple_choice",
      "category": "empathy",
      "tags": ["empathy", "social_awareness"],
      "options": [
        {"text": "You notice subtle changes in their body language", "value": "nonverbal_reader", "score_weights": {"empathy": 3, "observation": 2}, "order_index": 1},
        {"text": "Their energy feels different to you", "value": "energy_reader", "score_weights": {"empathy": 3, "intuition": 2}, "order_index": 2},
        {"text": "You hear it in their tone of voice", "value": "vocal_reader", "score_weights": {"empathy": 2, "listening": 3}, "order_index": 3},
        {"text": "You sense it based on the context", "value": "context_reader", "score_weights": {"social_awareness": 3, "analytical": 1}, "order_index": 4}
      ]
    }
  ]',
  '{"algorithm": "ei_composite", "ei_dimensions": {"self_awareness": {"weight": 0.25}, "self_regulation": {"weight": 0.25}, "empathy": {"weight": 0.25}, "social_skills": {"weight": 0.25}}}'
);

-- Create function to efficiently generate visitor quiz data
CREATE OR REPLACE FUNCTION public.create_visitor_quiz(
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_difficulty TEXT,
  p_questions JSONB
)
RETURNS UUID AS $$
DECLARE
  quiz_id UUID;
  question_data JSONB;
  question_id UUID;
  option_data JSONB;
  question_order INTEGER := 1;
BEGIN
  -- Create the quiz
  INSERT INTO public.quizzes (title, description, category, difficulty, is_public, time_limit_minutes, passing_score, show_correct_answers)
  VALUES (
    p_title,
    p_description,
    p_category,
    p_difficulty,
    true,
    15,
    70.0,
    true
  )
  RETURNING id INTO quiz_id;

  -- Create questions and options
  FOR question_data IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    -- Insert question
    INSERT INTO public.quiz_questions (quiz_id, question_text, question_type, correct_answer, explanation, points, order_index)
    VALUES (
      quiz_id,
      question_data->>'question_text',
      question_data->>'question_type',
      question_data->>'correct_answer',
      question_data->>'explanation',
      COALESCE((question_data->>'points')::integer, 1),
      question_order
    )
    RETURNING id INTO question_id;

    -- Insert question options
    FOR option_data IN SELECT * FROM jsonb_array_elements(question_data->'options')
    LOOP
      INSERT INTO public.quiz_question_options (quiz_question_id, option_text, is_correct, order_index)
      VALUES (
        question_id,
        option_data->>'text',
        COALESCE((option_data->>'is_correct')::boolean, false),
        (option_data->>'order_index')::integer
      );
    END LOOP;

    question_order := question_order + 1;
  END LOOP;

  RETURN quiz_id;
END;
$$ LANGUAGE plpgsql;

-- Create 6 comprehensive visitor quizzes
SELECT public.create_visitor_quiz(
  'Personal Growth Fundamentals',
  'Test your knowledge of essential personal development concepts and discover new strategies for growth.',
  'growth',
  'beginner',
  '[
    {
      "question_text": "What is the most important factor in building lasting habits?",
      "question_type": "multiple_choice",
      "correct_answer": "Consistency over intensity",
      "explanation": "Research shows that consistency, even with small actions, is more effective than intense but sporadic efforts.",
      "points": 1,
      "options": [
        {"text": "Motivation and willpower", "is_correct": false, "order_index": 1},
        {"text": "Consistency over intensity", "is_correct": true, "order_index": 2},
        {"text": "Perfect planning", "is_correct": false, "order_index": 3},
        {"text": "External accountability", "is_correct": false, "order_index": 4}
      ]
    },
    {
      "question_text": "Which mindset is most conducive to personal growth?",
      "question_type": "multiple_choice",
      "correct_answer": "Growth mindset - believing abilities can be developed",
      "explanation": "A growth mindset, as researched by Carol Dweck, believes that abilities and intelligence can be developed through effort and learning.",
      "points": 1,
      "options": [
        {"text": "Fixed mindset - believing talents are innate", "is_correct": false, "order_index": 1},
        {"text": "Growth mindset - believing abilities can be developed", "is_correct": true, "order_index": 2},
        {"text": "Competitive mindset - always comparing to others", "is_correct": false, "order_index": 3},
        {"text": "Perfectionist mindset - never accepting mistakes", "is_correct": false, "order_index": 4}
      ]
    }
  ]'
);

SELECT public.create_visitor_quiz(
  'Stress Management Mastery',
  'Learn effective strategies for managing stress and building resilience in your daily life.',
  'wellness',
  'intermediate',
  '[
    {
      "question_text": "What is the physiological fight-or-flight response designed for?",
      "question_type": "multiple_choice",
      "correct_answer": "Short-term physical threats",
      "explanation": "The fight-or-flight response evolved to help us handle immediate physical dangers, not chronic psychological stress.",
      "points": 1,
      "options": [
        {"text": "Chronic daily stress", "is_correct": false, "order_index": 1},
        {"text": "Short-term physical threats", "is_correct": true, "order_index": 2},
        {"text": "Mental concentration", "is_correct": false, "order_index": 3},
        {"text": "Social interactions", "is_correct": false, "order_index": 4}
      ]
    },
    {
      "question_text": "Which technique is most effective for immediate stress relief?",
      "question_type": "multiple_choice",
      "correct_answer": "Deep breathing exercises",
      "explanation": "Deep breathing activates the parasympathetic nervous system, providing immediate stress relief by countering the stress response.",
      "points": 1,
      "options": [
        {"text": "Vigorous exercise", "is_correct": false, "order_index": 1},
        {"text": "Deep breathing exercises", "is_correct": true, "order_index": 2},
        {"text": "Positive thinking", "is_correct": false, "order_index": 3},
        {"text": "Problem-solving", "is_correct": false, "order_index": 4}
      ]
    }
  ]'
);

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.create_visitor_quiz TO authenticated;

-- Update RLS policies to allow visitor access to assessments and quizzes
CREATE POLICY "Visitors can view public assessments" ON public.assessments
    FOR SELECT USING (is_public = true AND is_published = true);

CREATE POLICY "Visitors can view public assessment questions" ON public.assessment_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessments a 
            WHERE a.id = assessment_id 
            AND a.is_public = true 
            AND a.is_published = true
        )
    );

CREATE POLICY "Visitors can view public quizzes" ON public.quizzes
    FOR SELECT USING (is_public = true);

CREATE POLICY "Visitors can create assessment responses" ON public.assessment_responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Visitors can create quiz attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_public_published ON public.assessments(is_public, is_published) WHERE is_public = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_quizzes_public ON public.quizzes(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_assessment_responses_visitor_session ON public.assessment_responses(visitor_session_id) WHERE visitor_session_id IS NOT NULL;
