-- Add a column to store scoring data for personality assessments
ALTER TABLE public.assessment_options
ADD COLUMN scoring_data JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.assessment_options.scoring_data IS 'Stores scoring weights for personality assessments, e.g., {"trait": "extrovert", "value": 2}';

-- Add a column to control visibility of explorations (public for visitors, private for users)
ALTER TABLE public.explorations
ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private'));