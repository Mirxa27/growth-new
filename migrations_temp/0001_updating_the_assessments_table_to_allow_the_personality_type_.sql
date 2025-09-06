-- Drop the existing constraint
ALTER TABLE public.assessments DROP CONSTRAINT assessments_type_check;

-- Add a new constraint that includes 'personality'
ALTER TABLE public.assessments ADD CONSTRAINT assessments_type_check 
CHECK (type IN ('quiz', 'test', 'exploration', 'course', 'personality'));