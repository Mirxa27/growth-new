-- Create comprehensive RBAC (Role-Based Access Control) system
-- This migration adds roles, permissions, and access control tables

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
-- User management permissions
('users_read', 'View user profiles and information', 'users', 'read'),
('users_create', 'Create new user accounts', 'users', 'create'),
('users_update', 'Update user information', 'users', 'update'),
('users_delete', 'Delete user accounts', 'users', 'delete'),
('users_manage_roles', 'Assign and manage user roles', 'users', 'manage_roles'),

-- Admin permissions
('admin_read', 'Access admin dashboard', 'admin', 'read'),
('admin_settings', 'Modify admin settings', 'admin', 'settings'),
('admin_permissions', 'Manage permissions and roles', 'admin', 'permissions'),

-- Content permissions
('content_read', 'View all content', 'content', 'read'),
('content_create', 'Create new content', 'content', 'create'),
('content_update', 'Update existing content', 'content', 'update'),
('content_delete', 'Delete content', 'content', 'delete'),
('content_moderate', 'Moderate and approve content', 'content', 'moderate'),

-- Assessment permissions
('assessments_read', 'View assessments', 'assessments', 'read'),
('assessments_create', 'Create assessments', 'assessments', 'create'),
('assessments_update', 'Update assessments', 'assessments', 'update'),
('assessments_delete', 'Delete assessments', 'assessments', 'delete'),
('assessments_grade', 'Grade assessment submissions', 'assessments', 'grade'),

-- Analytics permissions
('analytics_read', 'View analytics and reports', 'analytics', 'read'),
('analytics_export', 'Export analytics data', 'analytics', 'export'),

-- System permissions
('system_read', 'View system configuration', 'system', 'read'),
('system_update', 'Update system configuration', 'system', 'update'),
('system_monitor', 'Monitor system health and performance', 'system', 'monitor'),

-- Security permissions
('security_read', 'View security logs and settings', 'security', 'read'),
('security_manage', 'Manage security settings', 'security', 'manage'),
('security_audit', 'Audit user activities and access', 'security', 'audit'),

-- Billing permissions
('billing_read', 'View billing information', 'billing', 'read'),
('billing_manage', 'Manage billing and subscriptions', 'billing', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign admin permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
AND p.name NOT IN ('system_update', 'security_manage', 'billing_manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign moderator permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'moderator'
AND p.name IN (
    'users_read', 'users_update', 'content_read', 'content_moderate',
    'assessments_read', 'assessments_grade', 'analytics_read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign content manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'content_manager'
AND p.name IN (
    'content_read', 'content_create', 'content_update', 'content_delete',
    'assessments_read', 'assessments_create', 'assessments_update'
)
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

-- Create function to check user role
CREATE OR REPLACE FUNCTION has_role(p_user_id UUID, p_role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_role BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id
        AND r.name = p_role_name
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ) INTO has_role;

    RETURN has_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(permission_name TEXT, resource TEXT, action TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name, p.resource, p.action
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_settings_updated_at
    BEFORE UPDATE ON security_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Create RLS policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Roles policies
CREATE POLICY "Roles are viewable by everyone" ON roles
    FOR SELECT USING (true);

CREATE POLICY "Only super_admin can insert roles" ON roles
    FOR INSERT WITH CHECK (has_permission(auth.uid(), 'admin_permissions'));

CREATE POLICY "Only super_admin can update roles" ON roles
    FOR UPDATE USING (has_permission(auth.uid(), 'admin_permissions'));

CREATE POLICY "Only super_admin can delete roles" ON roles
    FOR DELETE USING (has_permission(auth.uid(), 'admin_permissions'));

-- Permissions policies
CREATE POLICY "Permissions are viewable by admins" ON permissions
    FOR SELECT USING (has_permission(auth.uid(), 'admin_permissions') OR has_permission(auth.uid(), 'admin_read'));

CREATE POLICY "Only super_admin can modify permissions" ON permissions
    FOR ALL USING (has_permission(auth.uid(), 'admin_permissions'));

-- Role permissions policies
CREATE POLICY "Role permissions are viewable by admins" ON role_permissions
    FOR SELECT USING (has_permission(auth.uid(), 'admin_permissions') OR has_permission(auth.uid(), 'admin_read'));

CREATE POLICY "Only super_admin can modify role permissions" ON role_permissions
    FOR ALL USING (has_permission(auth.uid(), 'admin_permissions'));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid() OR has_permission(auth.uid(), 'users_read'));

CREATE POLICY "Admins can view all user roles" ON user_roles
    FOR SELECT USING (has_permission(auth.uid(), 'users_read'));

CREATE POLICY "Only admins can manage user roles" ON user_roles
    FOR INSERT WITH CHECK (has_permission(auth.uid(), 'users_manage_roles'));

CREATE POLICY "Users can update their own role assignments" ON user_roles
    FOR UPDATE USING (user_id = auth.uid() OR has_permission(auth.uid(), 'users_manage_roles'));

CREATE POLICY "Only admins can delete user roles" ON user_roles
    FOR DELETE USING (has_permission(auth.uid(), 'users_manage_roles'));

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid() OR has_permission(auth.uid(), 'security_read'));

CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (has_permission(auth.uid(), 'security_audit'));

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions" ON user_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions" ON user_sessions
    FOR DELETE USING (user_id = auth.uid() OR has_permission(auth.uid(), 'security_manage'));

-- Security settings policies
CREATE POLICY "Security settings are viewable by admins" ON security_settings
    FOR SELECT USING (has_permission(auth.uid(), 'security_read'));

CREATE POLICY "Only super_admin can modify security settings" ON security_settings
    FOR ALL USING (has_permission(auth.uid(), 'security_manage'));

-- Add comments for documentation
COMMENT ON TABLE roles IS 'User roles with permission sets';
COMMENT ON TABLE permissions IS 'System permissions defining access to resources and actions';
COMMENT ON TABLE role_permissions IS 'Many-to-many relationship between roles and permissions';
COMMENT ON TABLE user_roles IS 'Role assignments for users with optional expiration';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system actions';
COMMENT ON TABLE user_sessions IS 'User session management for security and monitoring';
COMMENT ON TABLE security_settings IS 'Platform-wide security configuration settings';

-- Initialize default security settings
INSERT INTO security_settings (setting_key, setting_value, description) VALUES
('password_policy', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special_chars": false}', 'Password complexity requirements'),
('session_timeout', '{"duration_minutes": 1440, "idle_timeout_minutes": 30}', 'Session timeout settings'),
('mfa_required', '{"enabled": false, "exclude_roles": ["super_admin"]}', 'Multi-factor authentication requirements'),
('ip_restrictions', '{"enabled": false, "allowed_ips": []}', 'IP address restrictions'),
('rate_limiting', '{"enabled": true, "requests_per_minute": 60, "requests_per_hour": 1000}', 'API rate limiting settings'),
('audit_retention', '{"days": 365}', 'Audit log retention period')
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    updated_at = NOW();