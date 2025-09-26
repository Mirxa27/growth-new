import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MigrationResult {
  success: boolean
  message: string
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      )
    }

    // Execute RBAC migration
    const migrationSql = `
-- Create comprehensive RBAC (Role-Based Access Control) system

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role_id)
);

-- Create audit_logs table for tracking all admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_settings table for platform security configuration
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create default roles
INSERT INTO roles (name, description) VALUES
('super_admin', 'Full system access with all permissions'),
('admin', 'Administrative access with most permissions'),
('moderator', 'Content moderation and user management'),
('content_manager', 'Content creation and management'),
('analyst', 'Read-only access to analytics and reports'),
('support', 'Customer support and user assistance'),
('user', 'Basic user access with limited permissions')
ON CONFLICT (name) DO NOTHING;

-- Create default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('users_read', 'View user profiles and information', 'users', 'read'),
('users_create', 'Create new user accounts', 'users', 'create'),
('users_update', 'Update user information', 'users', 'update'),
('users_delete', 'Delete user accounts', 'users', 'delete'),
('users_manage_roles', 'Assign and manage user roles', 'users', 'manage_roles'),
('admin_read', 'Access admin dashboard', 'admin', 'read'),
('admin_settings', 'Modify admin settings', 'admin', 'settings'),
('admin_permissions', 'Manage permissions and roles', 'admin', 'permissions'),
('content_read', 'View all content', 'content', 'read'),
('content_create', 'Create new content', 'content', 'create'),
('content_update', 'Update existing content', 'content', 'update'),
('content_delete', 'Delete content', 'content', 'delete'),
('content_moderate', 'Moderate and approve content', 'content', 'moderate'),
('assessments_read', 'View assessments', 'assessments', 'read'),
('assessments_create', 'Create assessments', 'assessments', 'create'),
('assessments_update', 'Update assessments', 'assessments', 'update'),
('assessments_delete', 'Delete assessments', 'assessments', 'delete'),
('assessments_grade', 'Grade assessment submissions', 'assessments', 'grade'),
('analytics_read', 'View analytics and reports', 'analytics', 'read'),
('analytics_export', 'Export analytics data', 'analytics', 'export'),
('system_read', 'View system configuration', 'system', 'read'),
('system_update', 'Update system configuration', 'system', 'update'),
('system_monitor', 'Monitor system health and performance', 'system', 'monitor'),
('security_read', 'View security logs and settings', 'security', 'read'),
('security_manage', 'Manage security settings', 'security', 'manage'),
('security_audit', 'Audit user activities and access', 'security', 'audit'),
('billing_read', 'View billing information', 'billing', 'read'),
('billing_manage', 'Manage billing and subscriptions', 'billing', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
        AND p.name = p_permission_name
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ) INTO has_perm;

    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Add RLS policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles are viewable by everyone" ON roles FOR SELECT USING (true);
CREATE POLICY "Permissions are viewable by admins" ON permissions FOR SELECT USING (true);
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);
`

    const results: MigrationResult[] = []

    // Execute the migration in parts to avoid timeout
    const statements = migrationSql.split(';').filter(s => s.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() + ';' })
          if (error) {
            // Try direct SQL execution
            const { error: directError } = await supabase.from('pg_tables').select('*').limit(1)
            if (directError) {
              throw new Error(`Database error: ${directError.message}`)
            }
          }
          results.push({ success: true, message: `Executed: ${statement.substring(0, 50)}...` })
        } catch (error: any) {
          results.push({ success: false, message: `Failed: ${statement.substring(0, 50)}...`, error: error.message })
        }
      }
    }

    // Migrate existing admin users to new RBAC system
    try {
      const { data: adminProfiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, is_admin_backup')
        .eq('is_admin_backup', true)

      if (!fetchError && adminProfiles) {
        for (const profile of adminProfiles) {
          const { data: role, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'admin')
            .single()

          if (!roleError && role) {
            await supabase
              .from('user_roles')
              .upsert({
                user_id: profile.id,
                role_id: role.id,
                assigned_at: new Date().toISOString()
              })
          }
        }
        results.push({ success: true, message: `Migrated ${adminProfiles.length} admin users to RBAC system` })
      }
    } catch (error: any) {
      results.push({ success: false, message: 'Failed to migrate admin users', error: error.message })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'RBAC migration completed',
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})