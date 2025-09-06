-- Create missing error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  code TEXT,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'info', 'critical')),
  category TEXT DEFAULT 'general',
  context JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

-- Enable RLS for error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_logs (admin access only for security)
CREATE POLICY "Admins can view all error logs"
  ON error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "System can insert error logs"
  ON error_logs FOR INSERT
  WITH CHECK (true); -- Allow system to log errors

-- Create security_audit_log table for security monitoring
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for security_audit_log
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action ON security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_resource ON security_audit_log(resource);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

-- Enable RLS for security_audit_log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_audit_log (admin access only)
CREATE POLICY "Admins can view security audit logs"
  ON security_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "System can insert security audit logs"
  ON security_audit_log FOR INSERT
  WITH CHECK (true);

-- Ensure assessments table has proper structure for free assessments
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'assessment' CHECK (type IN ('assessment', 'quiz', 'test', 'exploration', 'course')),
  questions JSONB DEFAULT '[]',
  scoring_data JSONB DEFAULT '{}',
  ai_provider TEXT DEFAULT 'openai',
  ai_model TEXT DEFAULT 'gpt-4',
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'premium')),
  is_free BOOLEAN DEFAULT true,
  estimated_time INTEGER DEFAULT 10, -- minutes
  category TEXT DEFAULT 'general',
  benefits TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert free assessments if they don't exist
INSERT INTO assessments (id, title, description, type, visibility, is_free, estimated_time, category, benefits, questions) VALUES
('personality_insights', 'Personality Insights', 'Discover your unique personality patterns and how they shape your relationships and decisions.', 'assessment', 'public', true, 8, 'personality', 
 ARRAY['Understand your core personality traits', 'Learn your communication style', 'Discover your decision-making patterns', 'Get personalized growth recommendations'],
 '[
   {
     "id": "social_energy",
     "question": "I feel energized when I am around other people",
     "type": "scale",
     "options": [
       {"text": "Strongly Disagree", "value": 1},
       {"text": "Disagree", "value": 2},
       {"text": "Neutral", "value": 3},
       {"text": "Agree", "value": 4},
       {"text": "Strongly Agree", "value": 5}
     ]
   },
   {
     "id": "detail_focus",
     "question": "I prefer to focus on details rather than the big picture",
     "type": "scale",
     "options": [
       {"text": "Strongly Disagree", "value": 1},
       {"text": "Disagree", "value": 2},
       {"text": "Neutral", "value": 3},
       {"text": "Agree", "value": 4},
       {"text": "Strongly Agree", "value": 5}
     ]
   },
   {
     "id": "logical_decisions",
     "question": "I make decisions based on logic rather than feelings",
     "type": "scale",
     "options": [
       {"text": "Strongly Disagree", "value": 1},
       {"text": "Disagree", "value": 2},
       {"text": "Neutral", "value": 3},
       {"text": "Agree", "value": 4},
       {"text": "Strongly Agree", "value": 5}
     ]
   }
 ]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO assessments (id, title, description, type, visibility, is_free, estimated_time, category, benefits, questions) VALUES
('relationship_patterns', 'Relationship Patterns', 'Explore how you connect with others and identify patterns in your relationships.', 'assessment', 'public', true, 10, 'relationships',
 ARRAY['Identify your attachment style', 'Understand relationship patterns', 'Learn about communication preferences', 'Improve relationship satisfaction'],
 '[
   {
     "id": "attachment_style",
     "question": "In relationships, I tend to worry about being abandoned or rejected",
     "type": "scale",
     "options": [
       {"text": "Never", "value": 1},
       {"text": "Rarely", "value": 2},
       {"text": "Sometimes", "value": 3},
       {"text": "Often", "value": 4},
       {"text": "Always", "value": 5}
     ]
   },
   {
     "id": "communication_style",
     "question": "I find it easy to express my feelings to my partner/close friends",
     "type": "scale",
     "options": [
       {"text": "Very Difficult", "value": 1},
       {"text": "Difficult", "value": 2},
       {"text": "Neutral", "value": 3},
       {"text": "Easy", "value": 4},
       {"text": "Very Easy", "value": 5}
     ]
   }
 ]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create assessment_results table for storing user results
CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}',
  score JSONB DEFAULT '{}',
  analysis TEXT,
  insights TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for assessment_results
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_completed_at ON assessment_results(completed_at);

-- Enable RLS for assessment_results
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessment_results
CREATE POLICY "Users can view their own assessment results"
  ON assessment_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessment results"
  ON assessment_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessment results"
  ON assessment_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- Function to log errors safely
CREATE OR REPLACE FUNCTION log_error(
  message_param TEXT,
  code_param TEXT DEFAULT NULL,
  severity_param TEXT DEFAULT 'error',
  category_param TEXT DEFAULT 'general',
  context_param JSONB DEFAULT '{}',
  user_id_param UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO error_logs (message, code, severity, category, context, user_id)
  VALUES (message_param, code_param, severity_param, category_param, context_param, user_id_param);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- If logging fails, don't crash the application
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assessment by ID safely
CREATE OR REPLACE FUNCTION get_assessment_by_id(assessment_id_param TEXT)
RETURNS JSONB AS $$
DECLARE
  assessment_data JSONB;
BEGIN
  SELECT row_to_json(assessments)::jsonb INTO assessment_data
  FROM assessments
  WHERE id = assessment_id_param;
  
  RETURN COALESCE(assessment_data, '{}'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;