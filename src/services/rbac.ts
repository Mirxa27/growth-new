import { supabase } from '@/integrations/supabase/client'

export interface Role {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  name: string
  description?: string
  resource: string
  action: string
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  assigned_by?: string
  assigned_at: string
  expires_at?: string
  role?: Role
}

export interface AuditLog {
  id: string
  user_id?: string
  action_type: string
  resource_type: string
  resource_id?: string
  description: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  status: string
  error_message?: string
  created_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  ip_address?: string
  user_agent?: string
  is_active: boolean
  last_activity: string
  expires_at: string
  created_at: string
}

export interface SecuritySetting {
  id: string
  setting_key: string
  setting_value: Record<string, any>
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

class RBACService {
  // Role management
  async getRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  }

  async getRole(id: string): Promise<Role | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .insert(role)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteRole(id: string): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Permission management
  async getPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('resource', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permission_id,
        permissions (*)
      `)
      .eq('role_id', roleId)

    if (error) throw error
    return data?.map(item => item.permissions).filter(Boolean) || []
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .insert({
        role_id: roleId,
        permission_id: permissionId
      })

    if (error) throw error
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId)

    if (error) throw error
  }

  // User role management
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        role (*)
      `)
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async assignRoleToUser(userId: string, roleId: string, assignedBy?: string, expiresAt?: string): Promise<UserRole> {
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
        expires_at: expiresAt
      })
      .select(`
        *,
        role (*)
      `)
      .single()

    if (error) throw error
    return data
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId)

    if (error) throw error
  }

  // Permission checking
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      // Try to use the database function first
      const { data, error } = await supabase
        .rpc('has_permission', {
          p_user_id: userId,
          p_permission_name: permissionName
        })

      if (!error && data !== null) {
        return data
      }
    } catch (error) {
      // Fallback to manual checking
      console.warn('Database function not available, using fallback:', error)
    }

    // Fallback: Check manually
    const userRoles = await this.getUserRoles(userId)
    const roleIds = userRoles.map(ur => ur.role_id)

    if (roleIds.length === 0) return false

    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select(`
        permissions (name)
      `)
      .in('role_id', roleIds)

    if (error) throw error

    const permissionNames = permissions
      ?.map(p => p.permissions?.name)
      .filter(Boolean) || []

    return permissionNames.includes(permissionName)
  }

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      // Try to use the database function first
      const { data, error } = await supabase
        .rpc('has_role', {
          p_user_id: userId,
          p_role_name: roleName
        })

      if (!error && data !== null) {
        return data
      }
    } catch (error) {
      // Fallback to manual checking
      console.warn('Database function not available, using fallback:', error)
    }

    // Fallback: Check manually
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select(`
        role (*)
      `)
      .eq('user_id', userId)

    if (error) throw error

    return userRoles?.some(ur => ur.role?.name === roleName) || false
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      // Try to use the database function first
      const { data, error } = await supabase
        .rpc('get_user_permissions', {
          p_user_id: userId
        })

      if (!error && data) {
        return data.map((p: any) => ({
          id: '',
          name: p.permission_name,
          resource: p.resource,
          action: p.action,
          created_at: '',
          updated_at: ''
        }))
      }
    } catch (error) {
      // Fallback to manual checking
      console.warn('Database function not available, using fallback:', error)
    }

    // Fallback: Get permissions manually
    const userRoles = await this.getUserRoles(userId)
    const roleIds = userRoles.map(ur => ur.role_id)

    if (roleIds.length === 0) return []

    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select(`
        permissions (*)
      `)
      .in('role_id', roleIds)

    if (error) throw error

    return permissions?.map(p => p.permissions).filter(Boolean) || []
  }

  // Audit logging
  async logAudit(action: {
    user_id?: string
    action_type: string
    resource_type: string
    resource_id?: string
    description: string
    metadata?: Record<string, any>
    ip_address?: string
    user_agent?: string
    status?: string
    error_message?: string
  }): Promise<AuditLog> {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        ...action,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getAuditLogs(filters?: {
    user_id?: string
    action_type?: string
    resource_type?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<{ logs: AuditLog[], total: number }> {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.action_type) {
      query = query.eq('action_type', filters.action_type)
    }
    if (filters?.resource_type) {
      query = query.eq('resource_type', filters.resource_type)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    query = query.order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error
    return { logs: data || [], total: count || 0 }
  }

  // Session management
  async getUserSessions(userId: string): Promise<UserSession[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity', { ascending: false })

    if (error) throw error
    return data || []
  }

  async terminateSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId)

    if (error) throw error
  }

  async terminateAllUserSessions(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (error) throw error
  }

  // Security settings
  async getSecuritySettings(): Promise<SecuritySetting[]> {
    const { data, error } = await supabase
      .from('security_settings')
      .select('*')
      .eq('is_active', true)

    if (error) throw error
    return data || []
  }

  async updateSecuritySetting(key: string, value: Record<string, any>): Promise<SecuritySetting> {
    const { data, error } = await supabase
      .from('security_settings')
      .update({
        setting_value: value,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', key)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Utility functions
  async getSystemStats(): Promise<{
    total_users: number
    active_sessions: number
    audit_logs_today: number
    failed_logins_today: number
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      { count: totalUsers },
      { count: activeSessions },
      { count: auditLogsToday },
      { count: failedLoginsToday }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_sessions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()).eq('status', 'failed')
    ])

    return {
      total_users: totalUsers || 0,
      active_sessions: activeSessions || 0,
      audit_logs_today: auditLogsToday || 0,
      failed_logins_today: failedLoginsToday || 0
    }
  }
}

export const rbacService = new RBACService()