-- Script to apply the error logs fix
-- Run this script in your Supabase SQL editor or via the CLI

-- Apply the comprehensive error logs fix migration
-- This will:
-- 1. Drop the existing error_logs table if it exists
-- 2. Recreate it with proper structure and permissions
-- 3. Set up RLS policies for secure access
-- 4. Create helper functions and views

-- Execute the migration
\i supabase/migrations/20250926000000_restore_error_logs_permissions.sql

-- Verify the table was created correctly
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'error_logs'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'error_logs';

-- Verify the function was created
SELECT
    routine_name,
    routine_type,
    data_type,
    external_language
FROM information_schema.routines
WHERE routine_name = 'log_application_error'
    AND routine_schema = 'public';

-- Verify the view was created
SELECT
    viewname,
    viewowner,
    definition
FROM pg_views
WHERE viewname = 'error_stats'
    AND schemaname = 'public';

-- Test basic insert permission (this should work)
INSERT INTO public.error_logs (
    message,
    severity,
    category
) VALUES (
    'Test error after fix',
    'low',
    'unknown'
) RETURNING id;

-- Clean up test data
DELETE FROM public.error_logs
WHERE message = 'Test error after fix';