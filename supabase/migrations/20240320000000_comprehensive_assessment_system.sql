-- Comprehensive Assessment System Migration
-- This migration creates all necessary tables for the complete assessment system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create assessments table for user assessments
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  content_type TEXT DEFAULT 'assessment' CHECK (content_type IN ('assessment', 'quiz', 'exploration', 'course')),
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  target_audience TEXT DEFAULT 'users' CHECK (target_audience IN ('visitors', 'users', 'premium')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar', 'both')),
  estimated_time INTEGER DEFAULT 15, -- in minutes
  questions JSONB NOT NULL DEFAULT '[]',
  result_categories JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  is_active BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  slug TEXT UNIQUE,
  tags TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  learning_objectives TEXT[] DEFAULT '{}',
  completion_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  time_limit INTEGER DEFAULT 10, -- in minutes
  passing_score INTEGER DEFAULT 70, -- percentage
  questions JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  slug TEXT UNIQUE,
  completion_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create explorations table
CREATE TABLE IF NOT EXISTS explorations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_time INTEGER DEFAULT 20, -- in minutes
  content JSONB NOT NULL DEFAULT '{}',
  reflection_prompts JSONB DEFAULT '[]',
  resources JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  slug TEXT UNIQUE,
  completion_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_time INTEGER DEFAULT 60, -- in minutes
  modules JSONB NOT NULL DEFAULT '[]',
  learning_objectives TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  resources JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  slug TEXT UNIQUE,
  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create assessment_attempts table for tracking user attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_id TEXT, -- for non-authenticated users
  responses JSONB NOT NULL DEFAULT '[]',
  result JSONB,
  score INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0.0,
  time_taken INTEGER DEFAULT 0, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_id TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0.0,
  passed BOOLEAN DEFAULT false,
  time_taken INTEGER DEFAULT 0, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

-- Create exploration_sessions table
CREATE TABLE IF NOT EXISTS exploration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exploration_id UUID REFERENCES explorations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  responses JSONB DEFAULT '{}',
  reflections JSONB DEFAULT '{}',
  insights JSONB DEFAULT '{}',
  progress DECIMAL(5,2) DEFAULT 0.0,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  time_spent INTEGER DEFAULT 0 -- in seconds
);

-- Create course_enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  progress DECIMAL(5,2) DEFAULT 0.0,
  completed_modules JSONB DEFAULT '[]',
  current_module INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create content_ratings table for user feedback
CREATE TABLE IF NOT EXISTS content_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('assessment', 'quiz', 'exploration', 'course')),
  content_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create visitor_sessions table for tracking anonymous users
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  session_data JSONB DEFAULT '{}',
  assessments_taken TEXT[] DEFAULT '{}',
  total_time_spent INTEGER DEFAULT 0, -- in seconds
  first_visit TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_visit TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT
);

-- Create ai_generated_content table for tracking AI-generated content
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('assessment', 'quiz', 'exploration', 'course')),
  topic TEXT NOT NULL,
  ai_provider TEXT NOT NULL,
  ai_model TEXT,
  generation_prompt TEXT,
  generated_content JSONB NOT NULL,
  quality_score DECIMAL(3,2),
  human_reviewed BOOLEAN DEFAULT false,
  published_as UUID, -- reference to the actual content table
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_category ON assessments(category);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_audience ON assessments(target_audience);
CREATE INDEX IF NOT EXISTS idx_assessments_active ON assessments(is_active);
CREATE INDEX IF NOT EXISTS idx_assessments_slug ON assessments(slug);

CREATE INDEX IF NOT EXISTS idx_quizzes_category ON quizzes(category);
CREATE INDEX IF NOT EXISTS idx_quizzes_active ON quizzes(is_active);
CREATE INDEX IF NOT EXISTS idx_quizzes_slug ON quizzes(slug);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_visitor ON assessment_attempts(visitor_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_completed ON assessment_attempts(completed_at);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_visitor ON quiz_attempts(visitor_id);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor ON visitor_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_last_visit ON visitor_sessions(last_visit);

CREATE INDEX IF NOT EXISTS idx_ai_generated_content_type ON ai_generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_provider ON ai_generated_content(ai_provider);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_explorations_updated_at BEFORE UPDATE ON explorations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies

-- Assessments policies
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public assessments are viewable by everyone" ON assessments
  FOR SELECT USING (is_active = true AND target_audience IN ('visitors', 'users'));

CREATE POLICY "Users can view user assessments" ON assessments
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    is_active = true AND 
    target_audience IN ('users', 'premium')
  );

CREATE POLICY "Admins can manage all assessments" ON assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Quiz policies
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public quizzes are viewable by everyone" ON quizzes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all quizzes" ON quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Assessment attempts policies
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts" ON assessment_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own attempts" ON assessment_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Visitors can create attempts with visitor_id" ON assessment_attempts
  FOR INSERT WITH CHECK (visitor_id IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Admins can view all attempts" ON assessment_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Quiz attempts policies
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts" ON quiz_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Visitors can create quiz attempts with visitor_id" ON quiz_attempts
  FOR INSERT WITH CHECK (visitor_id IS NOT NULL AND user_id IS NULL);

-- Content ratings policies
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and create their own ratings" ON content_ratings
  FOR ALL USING (user_id = auth.uid());

-- Visitor sessions policies
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitors can manage their own sessions" ON visitor_sessions
  FOR ALL USING (true); -- Allow all operations for visitor tracking

-- AI generated content policies
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI generated content" ON ai_generated_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Create functions for calculating statistics

-- Function to update assessment completion count
CREATE OR REPLACE FUNCTION update_assessment_completion_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.completed_at IS NOT NULL THEN
    UPDATE assessments 
    SET completion_count = completion_count + 1
    WHERE id = NEW.assessment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for assessment completion count
CREATE TRIGGER update_assessment_completion_count_trigger
  AFTER INSERT ON assessment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_completion_count();

-- Function to update quiz completion count
CREATE OR REPLACE FUNCTION update_quiz_completion_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.completed_at IS NOT NULL THEN
    UPDATE quizzes 
    SET completion_count = completion_count + 1,
        average_score = (
          SELECT AVG(percentage) 
          FROM quiz_attempts 
          WHERE quiz_id = NEW.quiz_id AND completed_at IS NOT NULL
        )
    WHERE id = NEW.quiz_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quiz completion count
CREATE TRIGGER update_quiz_completion_count_trigger
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_completion_count();

-- Function to update content ratings
CREATE OR REPLACE FUNCTION update_content_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update assessment ratings
    IF NEW.content_type = 'assessment' THEN
      UPDATE assessments 
      SET average_rating = (
        SELECT AVG(rating) 
        FROM content_ratings 
        WHERE content_type = 'assessment' AND content_id = NEW.content_id
      )
      WHERE id = NEW.content_id;
    END IF;
    
    -- Update quiz ratings
    IF NEW.content_type = 'quiz' THEN
      UPDATE quizzes 
      SET average_rating = (
        SELECT AVG(rating) 
        FROM content_ratings 
        WHERE content_type = 'quiz' AND content_id = NEW.content_id
      )
      WHERE id = NEW.content_id;
    END IF;
    
    -- Update exploration ratings
    IF NEW.content_type = 'exploration' THEN
      UPDATE explorations 
      SET average_rating = (
        SELECT AVG(rating) 
        FROM content_ratings 
        WHERE content_type = 'exploration' AND content_id = NEW.content_id
      )
      WHERE id = NEW.content_id;
    END IF;
    
    -- Update course ratings
    IF NEW.content_type = 'course' THEN
      UPDATE courses 
      SET average_rating = (
        SELECT AVG(rating) 
        FROM content_ratings 
        WHERE content_type = 'course' AND content_id = NEW.content_id
      )
      WHERE id = NEW.content_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for content ratings
CREATE TRIGGER update_content_rating_trigger
  AFTER INSERT OR UPDATE ON content_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_content_rating();

-- Insert sample visitor assessments
INSERT INTO assessments (
  title, description, category, target_audience, language, estimated_time, 
  questions, result_categories, status, is_active, slug, tags, learning_objectives
) VALUES 
(
  'Personality Insights Discovery',
  'Discover your unique personality traits and how they influence your daily life, relationships, and career choices.',
  'personality',
  'visitors',
  'en',
  8,
  '[{"id":"p1","question":"In social situations, you typically:","type":"multiple_choice","options":[{"id":"p1a","text":"Feel energized and seek out conversations","value":5,"category":"extroversion"},{"id":"p1b","text":"Enjoy talking with a few close friends","value":3,"category":"extroversion"},{"id":"p1c","text":"Prefer to observe and listen","value":1,"category":"extroversion"},{"id":"p1d","text":"Feel drained and need alone time afterward","value":0,"category":"extroversion"}],"category":"extroversion"}]',
  '[{"id":"extroverted-leader","name":"Extroverted Leader","description":"You thrive in social situations and naturally take charge.","minScore":35,"maxScore":50,"color":"bg-red-500","recommendations":["Consider leadership roles in your career","Join networking groups and professional organizations"]}]',
  'published',
  true,
  'personality-insights',
  ARRAY['personality', 'self-discovery', 'traits', 'behavior'],
  ARRAY['Understand your core personality traits', 'Identify your strengths and blind spots']
),
(
  'Holistic Wellness Check',
  'Evaluate your overall well-being across physical, mental, emotional, and social dimensions.',
  'wellness',
  'visitors',
  'en',
  10,
  '[{"id":"w1","question":"How would you rate your current energy levels?","type":"scale","scaleMin":1,"scaleMax":10,"scaleLabels":{"min":"Always exhausted","max":"Full of energy"},"category":"physical"}]',
  '[{"id":"thriving","name":"Thriving Wellness","description":"You demonstrate excellent wellness across multiple dimensions.","minScore":45,"maxScore":60,"color":"bg-green-500","recommendations":["Maintain your current healthy habits","Consider sharing your wellness strategies with others"]}]',
  'published',
  true,
  'wellness-check',
  ARRAY['wellness', 'health', 'balance', 'lifestyle'],
  ARRAY['Assess your overall well-being', 'Identify areas for improvement']
);

-- Insert sample AI provider configurations for Realtime API
INSERT INTO admin_ai_providers (
  provider_type, provider_name, configuration, is_active
) VALUES 
(
  'openai_realtime',
  'OpenAI Realtime API',
  '{
    "model": "gpt-4o-realtime-preview-2024-12-17",
    "voice": "marin",
    "instructions": "You are a helpful AI assistant for the Newomen personal growth platform. Be supportive, empathetic, and encouraging while helping users with their personal development journey.",
    "temperature": 0.7,
    "enableTranscription": true,
    "sessionType": "realtime",
    "inputModalities": ["text", "audio"],
    "outputModalities": ["text", "audio"],
    "turnDetection": {
      "type": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 200
    }
  }',
  true
),
(
  'openai_transcription',
  'OpenAI Transcription',
  '{
    "model": "whisper-1",
    "language": "en",
    "response_format": "verbose_json",
    "temperature": 0,
    "enable_word_timestamps": true,
    "enable_speaker_detection": false
  }',
  true
) ON CONFLICT (provider_type) DO UPDATE SET
  configuration = EXCLUDED.configuration,
  updated_at = CURRENT_TIMESTAMP;

-- Create views for analytics

-- Assessment analytics view
CREATE OR REPLACE VIEW assessment_analytics AS
SELECT 
  a.id,
  a.title,
  a.category,
  a.target_audience,
  a.completion_count,
  a.average_rating,
  COUNT(aa.id) as total_attempts,
  COUNT(aa.id) FILTER (WHERE aa.completed_at IS NOT NULL) as completed_attempts,
  AVG(aa.time_taken) FILTER (WHERE aa.completed_at IS NOT NULL) as avg_completion_time,
  AVG(aa.percentage) FILTER (WHERE aa.completed_at IS NOT NULL) as avg_score
FROM assessments a
LEFT JOIN assessment_attempts aa ON a.id = aa.assessment_id
GROUP BY a.id, a.title, a.category, a.target_audience, a.completion_count, a.average_rating;

-- Quiz analytics view
CREATE OR REPLACE VIEW quiz_analytics AS
SELECT 
  q.id,
  q.title,
  q.category,
  q.completion_count,
  q.average_score,
  COUNT(qa.id) as total_attempts,
  COUNT(qa.id) FILTER (WHERE qa.completed_at IS NOT NULL) as completed_attempts,
  COUNT(qa.id) FILTER (WHERE qa.passed = true) as passed_attempts,
  AVG(qa.time_taken) FILTER (WHERE qa.completed_at IS NOT NULL) as avg_completion_time
FROM quizzes q
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
GROUP BY q.id, q.title, q.category, q.completion_count, q.average_score;

-- Visitor activity view
CREATE OR REPLACE VIEW visitor_activity AS
SELECT 
  DATE(vs.last_visit) as activity_date,
  COUNT(DISTINCT vs.visitor_id) as unique_visitors,
  COUNT(aa.id) as assessments_completed,
  COUNT(qa.id) as quizzes_completed,
  AVG(vs.total_time_spent) as avg_time_spent
FROM visitor_sessions vs
LEFT JOIN assessment_attempts aa ON vs.visitor_id = aa.visitor_id
LEFT JOIN quiz_attempts qa ON vs.visitor_id = qa.visitor_id
GROUP BY DATE(vs.last_visit)
ORDER BY activity_date DESC;

-- Grant necessary permissions
GRANT ALL ON assessments TO authenticated;
GRANT ALL ON quizzes TO authenticated;
GRANT ALL ON explorations TO authenticated;
GRANT ALL ON courses TO authenticated;
GRANT ALL ON assessment_attempts TO authenticated;
GRANT ALL ON quiz_attempts TO authenticated;
GRANT ALL ON exploration_sessions TO authenticated;
GRANT ALL ON course_enrollments TO authenticated;
GRANT ALL ON content_ratings TO authenticated;
GRANT ALL ON visitor_sessions TO anon, authenticated;
GRANT ALL ON ai_generated_content TO authenticated;

GRANT SELECT ON assessment_analytics TO authenticated;
GRANT SELECT ON quiz_analytics TO authenticated;
GRANT SELECT ON visitor_activity TO authenticated;