-- Create exploration_responses table for narrative identity exploration
CREATE TABLE IF NOT EXISTS exploration_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exploration_type TEXT NOT NULL CHECK (exploration_type IN ('narrative_identity', 'values_exploration', 'relationship_patterns', 'life_purpose')),
  question_id TEXT NOT NULL,
  response TEXT NOT NULL,
  follow_up_response TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for exploration responses
CREATE INDEX IF NOT EXISTS idx_exploration_responses_user_id ON exploration_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_exploration_responses_type ON exploration_responses(exploration_type);
CREATE INDEX IF NOT EXISTS idx_exploration_responses_question_id ON exploration_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_exploration_responses_created_at ON exploration_responses(created_at);

-- Enable RLS for exploration responses
ALTER TABLE exploration_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exploration responses
CREATE POLICY "Users can view their own exploration responses"
  ON exploration_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exploration responses"
  ON exploration_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exploration responses"
  ON exploration_responses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create exploration_analyses table for AI analysis results
CREATE TABLE IF NOT EXISTS exploration_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exploration_type TEXT NOT NULL,
  core_themes TEXT[] DEFAULT '{}',
  narrative_patterns TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  growth_areas TEXT[] DEFAULT '{}',
  insights TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  analysis_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exploration_type)
);

-- Create indexes for exploration analyses
CREATE INDEX IF NOT EXISTS idx_exploration_analyses_user_id ON exploration_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_exploration_analyses_type ON exploration_analyses(exploration_type);
CREATE INDEX IF NOT EXISTS idx_exploration_analyses_created_at ON exploration_analyses(created_at);

-- Enable RLS for exploration analyses
ALTER TABLE exploration_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exploration analyses
CREATE POLICY "Users can view their own exploration analyses"
  ON exploration_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exploration analyses"
  ON exploration_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exploration analyses"
  ON exploration_analyses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update exploration_responses updated_at
CREATE OR REPLACE FUNCTION update_exploration_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for exploration responses updated_at
DROP TRIGGER IF EXISTS update_exploration_responses_updated_at ON exploration_responses;
CREATE TRIGGER update_exploration_responses_updated_at
  BEFORE UPDATE ON exploration_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_exploration_responses_updated_at();

-- Function to get user's exploration progress
CREATE OR REPLACE FUNCTION get_user_exploration_progress(
  user_id_param UUID,
  exploration_type_param TEXT
) RETURNS JSONB AS $$
DECLARE
  total_questions INTEGER;
  completed_questions INTEGER;
  progress_percentage INTEGER;
  last_response_date TIMESTAMPTZ;
  result JSONB;
BEGIN
  -- Count total questions for this exploration type (hardcoded for now)
  CASE exploration_type_param
    WHEN 'narrative_identity' THEN total_questions := 10;
    WHEN 'values_exploration' THEN total_questions := 8;
    WHEN 'relationship_patterns' THEN total_questions := 6;
    WHEN 'life_purpose' THEN total_questions := 7;
    ELSE total_questions := 10;
  END CASE;
  
  -- Count completed questions
  SELECT COUNT(*), MAX(created_at)
  INTO completed_questions, last_response_date
  FROM exploration_responses
  WHERE user_id = user_id_param AND exploration_type = exploration_type_param;
  
  -- Calculate progress percentage
  progress_percentage := CASE 
    WHEN total_questions > 0 THEN (completed_questions * 100) / total_questions
    ELSE 0
  END;
  
  -- Build result
  result := jsonb_build_object(
    'exploration_type', exploration_type_param,
    'total_questions', total_questions,
    'completed_questions', completed_questions,
    'progress_percentage', progress_percentage,
    'is_complete', completed_questions >= total_questions,
    'last_response_date', last_response_date
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save exploration analysis
CREATE OR REPLACE FUNCTION save_exploration_analysis(
  user_id_param UUID,
  exploration_type_param TEXT,
  core_themes_param TEXT[],
  narrative_patterns_param TEXT[],
  strengths_param TEXT[],
  growth_areas_param TEXT[],
  insights_param TEXT[],
  recommendations_param TEXT[],
  analysis_data_param JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO exploration_analyses (
    user_id, exploration_type, core_themes, narrative_patterns,
    strengths, growth_areas, insights, recommendations, analysis_data
  )
  VALUES (
    user_id_param, exploration_type_param, core_themes_param, narrative_patterns_param,
    strengths_param, growth_areas_param, insights_param, recommendations_param, analysis_data_param
  )
  ON CONFLICT (user_id, exploration_type)
  DO UPDATE SET
    core_themes = EXCLUDED.core_themes,
    narrative_patterns = EXCLUDED.narrative_patterns,
    strengths = EXCLUDED.strengths,
    growth_areas = EXCLUDED.growth_areas,
    insights = EXCLUDED.insights,
    recommendations = EXCLUDED.recommendations,
    analysis_data = EXCLUDED.analysis_data,
    created_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create couples_challenges table for couples challenge feature
CREATE TABLE IF NOT EXISTS couples_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  challenge_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired')),
  current_question_index INTEGER DEFAULT 0,
  questions JSONB NOT NULL DEFAULT '[]',
  initiator_responses JSONB DEFAULT '[]',
  partner_responses JSONB DEFAULT '[]',
  compatibility_analysis JSONB,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for couples challenges
CREATE INDEX IF NOT EXISTS idx_couples_challenges_initiator_id ON couples_challenges(initiator_id);
CREATE INDEX IF NOT EXISTS idx_couples_challenges_partner_id ON couples_challenges(partner_id);
CREATE INDEX IF NOT EXISTS idx_couples_challenges_challenge_code ON couples_challenges(challenge_code);
CREATE INDEX IF NOT EXISTS idx_couples_challenges_status ON couples_challenges(status);
CREATE INDEX IF NOT EXISTS idx_couples_challenges_expires_at ON couples_challenges(expires_at);

-- Enable RLS for couples challenges
ALTER TABLE couples_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for couples challenges
CREATE POLICY "Users can view challenges they initiated or participate in"
  ON couples_challenges FOR SELECT
  USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

CREATE POLICY "Users can insert challenges they initiate"
  ON couples_challenges FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Users can update challenges they participate in"
  ON couples_challenges FOR UPDATE
  USING (auth.uid() = initiator_id OR auth.uid() = partner_id)
  WITH CHECK (auth.uid() = initiator_id OR auth.uid() = partner_id);

-- Function to create couples challenge
CREATE OR REPLACE FUNCTION create_couples_challenge(
  initiator_id_param UUID,
  questions_param JSONB
) RETURNS TEXT AS $$
DECLARE
  challenge_code TEXT;
  challenge_id UUID;
BEGIN
  -- Generate unique challenge code
  challenge_code := 'CC-' || UPPER(substring(gen_random_uuid()::text from 1 for 8));
  
  -- Ensure uniqueness
  WHILE EXISTS(SELECT 1 FROM couples_challenges WHERE challenge_code = challenge_code) LOOP
    challenge_code := 'CC-' || UPPER(substring(gen_random_uuid()::text from 1 for 8));
  END LOOP;
  
  -- Insert challenge
  INSERT INTO couples_challenges (initiator_id, challenge_code, questions)
  VALUES (initiator_id_param, challenge_code, questions_param)
  RETURNING id INTO challenge_id;
  
  RETURN challenge_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join couples challenge
CREATE OR REPLACE FUNCTION join_couples_challenge(
  challenge_code_param TEXT,
  partner_id_param UUID
) RETURNS BOOLEAN AS $$
DECLARE
  challenge_exists BOOLEAN;
BEGIN
  -- Check if challenge exists and is available
  SELECT EXISTS(
    SELECT 1 FROM couples_challenges 
    WHERE challenge_code = challenge_code_param 
    AND status = 'pending' 
    AND partner_id IS NULL
    AND expires_at > NOW()
  ) INTO challenge_exists;
  
  IF challenge_exists THEN
    -- Update challenge with partner
    UPDATE couples_challenges
    SET partner_id = partner_id_param, status = 'active'
    WHERE challenge_code = challenge_code_param;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for user exploration dashboard
CREATE OR REPLACE VIEW user_exploration_dashboard AS
SELECT 
  u.id as user_id,
  COALESCE(narrative_progress.progress_percentage, 0) as narrative_identity_progress,
  COALESCE(narrative_progress.is_complete, false) as narrative_identity_complete,
  COALESCE(values_progress.progress_percentage, 0) as values_exploration_progress,
  COALESCE(values_progress.is_complete, false) as values_exploration_complete,
  COALESCE(relationship_progress.progress_percentage, 0) as relationship_patterns_progress,
  COALESCE(relationship_progress.is_complete, false) as relationship_patterns_complete,
  COALESCE(challenges_count.total_challenges, 0) as total_challenges_initiated,
  COALESCE(challenges_count.completed_challenges, 0) as completed_challenges
FROM auth.users u
LEFT JOIN LATERAL get_user_exploration_progress(u.id, 'narrative_identity') narrative_progress ON true
LEFT JOIN LATERAL get_user_exploration_progress(u.id, 'values_exploration') values_progress ON true
LEFT JOIN LATERAL get_user_exploration_progress(u.id, 'relationship_patterns') relationship_progress ON true
LEFT JOIN (
  SELECT 
    initiator_id as user_id,
    COUNT(*) as total_challenges,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_challenges
  FROM couples_challenges
  GROUP BY initiator_id
) challenges_count ON u.id = challenges_count.user_id;