-- Row Level Security (RLS) Setup for Growth Echo Nexus

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exploration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library_progress ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Assessments policies
DROP POLICY IF EXISTS "Anyone can view public assessments" ON public.assessments;
CREATE POLICY "Anyone can view public assessments" ON public.assessments
  FOR SELECT USING (visibility = 'public');

DROP POLICY IF EXISTS "Users can view their own assessments" ON public.assessments;
CREATE POLICY "Users can view their own assessments" ON public.assessments
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create assessments" ON public.assessments;
CREATE POLICY "Users can create assessments" ON public.assessments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own assessments" ON public.assessments;
CREATE POLICY "Users can update their own assessments" ON public.assessments
  FOR UPDATE USING (auth.uid() = created_by);

-- Assessment questions policies
DROP POLICY IF EXISTS "Anyone can view questions for public assessments" ON public.assessment_questions;
CREATE POLICY "Anyone can view questions for public assessments" ON public.assessment_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessments 
      WHERE id = assessment_id AND visibility = 'public'
    )
  );

DROP POLICY IF EXISTS "Users can view questions for their assessments" ON public.assessment_questions;
CREATE POLICY "Users can view questions for their assessments" ON public.assessment_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessments 
      WHERE id = assessment_id AND created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage questions for their assessments" ON public.assessment_questions;
CREATE POLICY "Users can manage questions for their assessments" ON public.assessment_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assessments 
      WHERE id = assessment_id AND created_by = auth.uid()
    )
  );

-- Assessment options policies
DROP POLICY IF EXISTS "Anyone can view options for public assessments" ON public.assessment_options;
CREATE POLICY "Anyone can view options for public assessments" ON public.assessment_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessment_questions aq
      JOIN public.assessments a ON a.id = aq.assessment_id
      WHERE aq.id = question_id AND a.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS "Users can manage options for their assessments" ON public.assessment_options;
CREATE POLICY "Users can manage options for their assessments" ON public.assessment_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assessment_questions aq
      JOIN public.assessments a ON a.id = aq.assessment_id
      WHERE aq.id = question_id AND a.created_by = auth.uid()
    )
  );

-- Assessment results policies
DROP POLICY IF EXISTS "Users can view their own results" ON public.assessment_results;
CREATE POLICY "Users can view their own results" ON public.assessment_results
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own results" ON public.assessment_results;
CREATE POLICY "Users can create their own results" ON public.assessment_results
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Quiz policies
DROP POLICY IF EXISTS "Anyone can view public quizzes" ON public.quizzes;
CREATE POLICY "Anyone can view public quizzes" ON public.quizzes
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can view their own quizzes" ON public.quizzes;
CREATE POLICY "Users can view their own quizzes" ON public.quizzes
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create quizzes" ON public.quizzes;
CREATE POLICY "Users can create quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Quiz questions policies
DROP POLICY IF EXISTS "Users can view quiz questions" ON public.quiz_questions;
CREATE POLICY "Users can view quiz questions" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE id = quiz_id AND (is_public = true OR created_by = auth.uid())
    )
  );

-- Quiz attempts policies
DROP POLICY IF EXISTS "Users can view their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can create their own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can update their own quiz attempts" ON public.quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- Explorations policies
DROP POLICY IF EXISTS "Anyone can view public explorations" ON public.explorations;
CREATE POLICY "Anyone can view public explorations" ON public.explorations
  FOR SELECT USING (visibility = 'public');

DROP POLICY IF EXISTS "Users can view their own explorations" ON public.explorations;
CREATE POLICY "Users can view their own explorations" ON public.explorations
  FOR SELECT USING (auth.uid() = created_by);

-- Voice agent configs policies
DROP POLICY IF EXISTS "Users can manage their own voice configs" ON public.voice_agent_configs;
CREATE POLICY "Users can manage their own voice configs" ON public.voice_agent_configs
  FOR ALL USING (auth.uid() = user_id);

-- Posts policies
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Post likes policies
DROP POLICY IF EXISTS "Authenticated users can manage likes" ON public.post_likes;
CREATE POLICY "Authenticated users can manage likes" ON public.post_likes
  FOR ALL USING (auth.uid() = user_id);

-- Library items policies
DROP POLICY IF EXISTS "Anyone can view public library items" ON public.library_items;
CREATE POLICY "Anyone can view public library items" ON public.library_items
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can view their own library items" ON public.library_items;
CREATE POLICY "Users can view their own library items" ON public.library_items
  FOR SELECT USING (auth.uid() = created_by);

-- User library progress policies
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_library_progress;
CREATE POLICY "Users can manage their own progress" ON public.user_library_progress
  FOR ALL USING (auth.uid() = user_id);

-- Admin AI providers policies
DROP POLICY IF EXISTS "Admins can manage AI providers" ON public.admin_ai_providers;
CREATE POLICY "Admins can manage AI providers" ON public.admin_ai_providers
  FOR ALL USING (public.is_admin(auth.uid()));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_attempts;
