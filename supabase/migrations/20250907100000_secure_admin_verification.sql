-- Secure Admin Verification System
-- Creates server-side functions for robust admin authentication

-- Function to verify admin status server-side
CREATE OR REPLACE FUNCTION public.verify_admin_status()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_profile RECORD;
    is_admin_result BOOLEAN := FALSE;
BEGIN
    -- Get the current authenticated user
    current_user_id := auth.uid();
    
    -- Return false if no user is authenticated
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get user profile with admin fields
    SELECT role, is_admin, is_admin_backup, email
    INTO user_profile
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.id = current_user_id;
    
    -- Check various admin indicators
    IF user_profile.role = 'admin' THEN
        is_admin_result := TRUE;
    ELSIF user_profile.is_admin = TRUE THEN
        is_admin_result := TRUE;
    ELSIF user_profile.is_admin_backup = TRUE THEN
        is_admin_result := TRUE;
    ELSIF user_profile.email IN ('admin@newomen.me', 'administrator@newomen.me') THEN
        is_admin_result := TRUE;
    END IF;
    
    -- Log admin verification attempt
    INSERT INTO public.admin_logs (admin_id, action, details)
    VALUES (
        current_user_id,
        'admin_verification',
        jsonb_build_object(
            'result', is_admin_result,
            'method', 'server_side_verification',
            'timestamp', NOW()
        )
    );
    
    RETURN is_admin_result;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return false for security
        INSERT INTO public.admin_logs (admin_id, action, details)
        VALUES (
            current_user_id,
            'admin_verification_error',
            jsonb_build_object(
                'error', SQLERRM,
                'timestamp', NOW()
            )
        );
        RETURN FALSE;
END;
$$;

-- Function to check admin access for API endpoints
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    has_access BOOLEAN := FALSE;
BEGIN
    -- Get the current authenticated user
    current_user_id := auth.uid();
    
    -- Return false if no user is authenticated
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Use the verify_admin_status function
    SELECT public.verify_admin_status() INTO has_access;
    
    -- Additional security check: ensure user exists in profiles
    IF has_access THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id) THEN
            has_access := FALSE;
        END IF;
    END IF;
    
    RETURN has_access;
END;
$$;

-- Function to get admin user info securely
CREATE OR REPLACE FUNCTION public.get_admin_user_info()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    role TEXT,
    is_admin BOOLEAN,
    last_login TIMESTAMPTZ,
    permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Verify admin access first
    IF NOT public.check_admin_access() THEN
        RAISE EXCEPTION 'Insufficient privileges';
    END IF;
    
    current_user_id := auth.uid();
    
    RETURN QUERY
    SELECT 
        p.id as user_id,
        u.email,
        p.role,
        COALESCE(p.is_admin, FALSE) as is_admin,
        u.last_sign_in_at as last_login,
        jsonb_build_object(
            'can_manage_users', TRUE,
            'can_manage_content', TRUE,
            'can_manage_settings', TRUE,
            'can_view_analytics', TRUE
        ) as permissions
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.id = current_user_id;
END;
$$;

-- Function to safely update admin flags (admin-only)
CREATE OR REPLACE FUNCTION public.update_user_admin_status(
    target_user_id UUID,
    new_admin_status BOOLEAN,
    admin_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    operation_success BOOLEAN := FALSE;
BEGIN
    -- Verify current user is admin
    IF NOT public.check_admin_access() THEN
        RAISE EXCEPTION 'Insufficient privileges to modify admin status';
    END IF;
    
    current_user_id := auth.uid();
    
    -- Prevent self-demotion
    IF target_user_id = current_user_id AND new_admin_status = FALSE THEN
        RAISE EXCEPTION 'Cannot remove your own admin privileges';
    END IF;
    
    -- Update the user's admin status
    UPDATE public.profiles 
    SET 
        is_admin = new_admin_status,
        is_admin_backup = new_admin_status,
        role = CASE 
            WHEN new_admin_status = TRUE THEN COALESCE(admin_role, 'admin')
            WHEN new_admin_status = FALSE THEN 'user'
            ELSE role
        END,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Check if update was successful
    IF FOUND THEN
        operation_success := TRUE;
        
        -- Log the admin action
        INSERT INTO public.admin_logs (admin_id, action, details)
        VALUES (
            current_user_id,
            'user_admin_status_changed',
            jsonb_build_object(
                'target_user_id', target_user_id,
                'new_status', new_admin_status,
                'new_role', COALESCE(admin_role, 'admin'),
                'timestamp', NOW()
            )
        );
    END IF;
    
    RETURN operation_success;
END;
$$;

-- Function to get all admin users (admin-only)
CREATE OR REPLACE FUNCTION public.get_all_admin_users()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    display_name TEXT,
    role TEXT,
    is_admin BOOLEAN,
    created_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify admin access
    IF NOT public.check_admin_access() THEN
        RAISE EXCEPTION 'Insufficient privileges';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id as user_id,
        u.email,
        p.display_name,
        p.role,
        COALESCE(p.is_admin, FALSE) as is_admin,
        p.created_at,
        u.last_sign_in_at as last_login
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role = 'admin' 
       OR p.is_admin = TRUE 
       OR p.is_admin_backup = TRUE
       OR u.email IN ('admin@newomen.me', 'administrator@newomen.me')
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users (functions handle their own security)
GRANT EXECUTE ON FUNCTION public.verify_admin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_admin_status(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_admin_users() TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_admin_flags ON public.profiles(role, is_admin, is_admin_backup);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_action ON public.admin_logs(admin_id, action, timestamp);

-- Insert a comment for tracking
INSERT INTO public.system_settings (key, value, description, category)
VALUES ('admin_verification_system', 'true'::jsonb, 'Secure admin verification system enabled', 'security')
ON CONFLICT (key) DO UPDATE SET 
    value = 'true'::jsonb,
    updated_at = NOW();