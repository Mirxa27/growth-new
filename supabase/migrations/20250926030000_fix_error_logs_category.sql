-- Fix error_logs table category column inconsistency
-- This migration ensures the category column exists and has the correct constraints

-- Ensure the error_logs table has the category column with proper constraints
DO $$
BEGIN
    -- Check if category column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'error_logs'
        AND column_name = 'category'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.error_logs ADD COLUMN category TEXT DEFAULT 'unknown';

        -- Add check constraint for allowed categories
        ALTER TABLE public.error_logs ADD CONSTRAINT error_logs_category_check
            CHECK (category IN ('authentication', 'authorization', 'validation', 'network', 'database', 'business_logic', 'external_api', 'unknown'));

        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_error_logs_category ON public.error_logs(category);

        RAISE NOTICE 'Added category column to error_logs table';
    ELSE
        -- Check if the check constraint exists, if not add it
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'error_logs_category_check'
            AND table_name = 'error_logs'
            AND table_schema = 'public'
        ) THEN
            -- First, update any existing null values to 'unknown'
            UPDATE public.error_logs SET category = 'unknown' WHERE category IS NULL;

            -- Add the check constraint
            ALTER TABLE public.error_logs ADD CONSTRAINT error_logs_category_check
                CHECK (category IN ('authentication', 'authorization', 'validation', 'network', 'database', 'business_logic', 'external_api', 'unknown'));

            RAISE NOTICE 'Added category check constraint to error_logs table';
        END IF;

        -- Ensure the index exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE indexname = 'idx_error_logs_category'
            AND tablename = 'error_logs'
            AND schemaname = 'public'
        ) THEN
            CREATE INDEX idx_error_logs_category ON public.error_logs(category);
            RAISE NOTICE 'Created category index on error_logs table';
        END IF;
    END IF;
END $$;

-- Update any existing null values to ensure data integrity
UPDATE public.error_logs SET category = 'unknown' WHERE category IS NULL;

-- Grant appropriate permissions
GRANT ALL ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO anon;

-- Add comment to the column
COMMENT ON COLUMN public.error_logs.category IS 'Error category for classification and filtering';