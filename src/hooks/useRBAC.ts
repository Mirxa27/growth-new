import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rbacService, type Role, type Permission, type UserRole } from '@/services/rbac'
import { useAuth } from '@/components/auth/AuthProvider'

// RBAC query keys
export const rbacKeys = {
  roles: ['roles'] as const,
  role: (id: string) => ['roles', id] as const,
  permissions: ['permissions'] as const,
  userRoles: (userId: string) => ['userRoles', userId] as const,
  userPermissions: (userId: string) => ['userPermissions', userId] as const,
  auditLogs: (filters?: any) => ['auditLogs', filters] as const,
  userSessions: (userId: string) => ['userSessions', userId] as const,
  securitySettings: ['securitySettings'] as const,
  systemStats: ['systemStats'] as const,
}

// Role hooks
export function useRoles() {
  return useQuery({
    queryKey: rbacKeys.roles,
    queryFn: () => rbacService.getRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useRole(id: string) {
  return useQuery({
    queryKey: rbacKeys.role(id),
    queryFn: () => rbacService.getRole(id),
    enabled: !!id,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (role: Omit<Role, 'id' | 'created_at' | 'updated_at'>) =>
      rbacService.createRole(role),
    onSuccess: async (newRole) => {
      // Log the action
      if (user) {
        await rbacService.logAudit({
          user_id: user.id,
          action_type: 'create',
          resource_type: 'role',
          resource_id: newRole.id,
          description: `Created role: ${newRole.name}`,
          metadata: { role_name: newRole.name }
        })
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Role>) =>
      rbacService.updateRole(id, updates),
    onSuccess: async (updatedRole) => {
      // Log the action
      if (user) {
        await rbacService.logAudit({
          user_id: user.id,
          action_type: 'update',
          resource_type: 'role',
          resource_id: updatedRole.id,
          description: `Updated role: ${updatedRole.name}`,
          metadata: { updates }
        })
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles })
      queryClient.invalidateQueries({ queryKey: rbacKeys.role(updatedRole.id) })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (id: string) => rbacService.deleteRole(id),
    onSuccess: async (_, roleId) => {
      // Log the action
      if (user) {
        await rbacService.logAudit({
          user_id: user.id,
          action_type: 'delete',
          resource_type: 'role',
          resource_id: roleId,
          description: `Deleted role with ID: ${roleId}`,
        })
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles })
    },
  })
}

// Permission hooks
export function usePermissions() {
  return useQuery({
    queryKey: rbacKeys.permissions,
    queryFn: () => rbacService.getPermissions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: ['rolePermissions', roleId] as const,
    queryFn: () => rbacService.getRolePermissions(roleId),
    enabled: !!roleId,
  })
}

// User role hooks
export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: rbacKeys.userRoles(userId),
    queryFn: () => rbacService.getUserRoles(userId),
    enabled: !!userId,
  })
}

export function useAssignRoleToUser() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ userId, roleId, expiresAt }: { userId: string; roleId: string; expiresAt?: string }) =>
      rbacService.assignRoleToUser(userId, roleId, user?.id, expiresAt),
    onSuccess: async (userRole, variables) => {
      // Log the action
      if (user) {
        await rbacService.logAudit({
          user_id: user.id,
          action_type: 'assign',
          resource_type: 'user_role',
          resource_id: userRole.id,
          description: `Assigned role to user ${variables.userId}`,
          metadata: {
            target_user_id: variables.userId,
            role_id: variables.roleId,
            expires_at: variables.expiresAt
          }
        })
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: rbacKeys.userRoles(variables.userId) })
      queryClient.invalidateQueries({ queryKey: rbacKeys.userPermissions(variables.userId) })
    },
  })
}

export function useRemoveRoleFromUser() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      rbacService.removeRoleFromUser(userId, roleId),
    onSuccess: async (_, variables) => {
      // Log the action
      if (user) {
        await rbacService.logAudit({
          user_id: user.id,
          action_type: 'remove',
          resource_type: 'user_role',
          description: `Removed role from user ${variables.userId}`,
          metadata: {
            target_user_id: variables.userId,
            role_id: variables.roleId
          }
        })
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: rbacKeys.userRoles(variables.userId) })
      queryClient.invalidateQueries({ queryKey: rbacKeys.userPermissions(variables.userId) })
    },
  })
}

// Permission assignment hooks
export function useAssignPermissionToRole() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      rbacService.assignPermissionToRole(roleId, permissionId),
    onSuccess: async (_, variables) => {
      // Log the action
      if (user) {
        await rbacService.logAudit({
          user_id: user.id,
          action_type: 'assign',
          resource_type: 'role_permission',
          description: `Assigned permission to role`,
          metadata: {
            role_id: variables.roleId,
            permission_id: variables.permissionId
          }
        })
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: rbacKeys.rolePermissions(variables.roleId) })
    },
  })
}

export function useRemovePermissionFromRole() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      rbacService.removePermissionFromRole(roleId, permissionId),
    onSuccess: async (_, variables) => {
      // Log the action
      if (user) {
        await rbacService.logAudit({
          user_id: user.id,
          action_type: 'remove',
          resource_type: 'role_permission',
          description: `Removed permission from role`,
          metadata: {
            role_id: variables.roleId,
            permission_id: variables.permissionId
          }
        })
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: rbacKeys.rolePermissions(variables.roleId) })
    },
  })
}

// Permission checking hooks
export function useUserPermissions(userId: string) {
  return useQuery({
    queryKey: rbacKeys.userPermissions(userId),
    queryFn: () => rbacService.getUserPermissions(userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useHasPermission(userId: string, permissionName: string) {
  return useQuery({
    queryKey: ['hasPermission', userId, permissionName] as const,
    queryFn: () => rbacService.hasPermission(userId, permissionName),
    enabled: !!userId && !!permissionName,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useHasRole(userId: string, roleName: string) {
  return useQuery({
    queryKey: ['hasRole', userId, roleName] as const,
    queryFn: () => rbacService.hasRole(userId, roleName),
    enabled: !!userId && !!roleName,
    staleTime: 60 * 1000, // 1 minute
  })
}

// Current user permissions hook
export function useCurrentUserPermissions() {
  const { user } = useAuth()
  return useUserPermissions(user?.id || '')
}

export function useCurrentUserHasPermission(permissionName: string) {
  const { user } = useAuth()
  return useHasPermission(user?.id || '', permissionName)
}

export function useCurrentUserHasRole(roleName: string) {
  const { user } = useAuth()
  return useHasRole(user?.id || '', roleName)
}

// Audit log hooks
export function useAuditLogs(filters?: any) {
  return useQuery({
    queryKey: rbacKeys.auditLogs(filters),
    queryFn: () => rbacService.getAuditLogs(filters),
    keepPreviousData: true,
  })
}

// Session hooks
export function useUserSessions(userId: string) {
  return useQuery({
    queryKey: rbacKeys.userSessions(userId),
    queryFn: () => rbacService.getUserSessions(userId),
    enabled: !!userId,
  })
}

export function useTerminateSession() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (sessionId: string) => rbacService.terminateSession(sessionId),
    onSuccess: async (_, sessionId) => {
      // Log the action
      if (user) {
        await rbacService.logAudit({
          user_id: user.id,
          action_type: 'terminate',
          resource_type: 'session',
          description: `Terminated session ${sessionId}`,
        })
      }

      // Invalidate queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: rbacKeys.userSessions(user.id) })
      }
    },
  })
}

export function useTerminateAllUserSessions() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (userId: string) => rbacService.terminateAllUserSessions(userId),
    onSuccess: async (_, userId) => {
      // Log the action
      if (user) {
        await rbacService.logAudit({
          user_id: user.id,
          action_type: 'terminate',
          resource_type: 'session',
          description: `Terminated all sessions for user ${userId}`,
          metadata: { target_user_id: userId }
        })
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: rbacKeys.userSessions(userId) })
    },
  })
}

// Security settings hooks
export function useSecuritySettings() {
  return useQuery({
    queryKey: rbacKeys.securitySettings,
    queryFn: () => rbacService.getSecuritySettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateSecuritySetting() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: Record<string, any> }) =>
      rbacService.updateSecuritySetting(key, value),
    onSuccess: async (_, variables) => {
      // Log the action
      if (user) {
        await rbacService.logAudit({
          user_id: user.id,
          action_type: 'update',
          resource_type: 'security_setting',
          description: `Updated security setting: ${variables.key}`,
          metadata: { setting_key: variables.key, setting_value: variables.value }
        })
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: rbacKeys.securitySettings })
    },
  })
}

// System stats hook
export function useSystemStats() {
  return useQuery({
    queryKey: rbacKeys.systemStats,
    queryFn: () => rbacService.getSystemStats(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// Permission guard hook
export function usePermissionGuard(permissionName: string) {
  const { data: hasPermission, isLoading } = useCurrentUserHasPermission(permissionName)

  return {
    hasPermission: hasPermission || false,
    isLoading,
    canAccess: !isLoading && hasPermission
  }
}

// Role guard hook
export function useRoleGuard(roleName: string) {
  const { data: hasRole, isLoading } = useCurrentUserHasRole(roleName)

  return {
    hasRole: hasRole || false,
    isLoading,
    canAccess: !isLoading && hasRole
  }
}

// Multiple permissions hook
export function useHasAllPermissions(permissionNames: string[]) {
  const { user } = useAuth()
  const permissionQueries = useQueries({
    queries: permissionNames.map(permission => ({
      queryKey: ['hasPermission', user?.id || '', permission] as const,
      queryFn: () => rbacService.hasPermission(user?.id || '', permission),
      enabled: !!user && !!permission,
      staleTime: 30 * 1000,
    }))
  })

  const hasAllPermissions = permissionQueries.every(query => query.data === true)
  const isLoading = permissionQueries.some(query => query.isLoading)

  return {
    hasAllPermissions,
    isLoading,
    canAccess: !isLoading && hasAllPermissions
  }
}

// Multiple roles hook
export function useHasAnyRole(roleNames: string[]) {
  const { user } = useAuth()
  const roleQueries = useQueries({
    queries: roleNames.map(role => ({
      queryKey: ['hasRole', user?.id || '', role] as const,
      queryFn: () => rbacService.hasRole(user?.id || '', role),
      enabled: !!user && !!role,
      staleTime: 60 * 1000,
    }))
  })

  const hasAnyRole = roleQueries.some(query => query.data === true)
  const isLoading = roleQueries.some(query => query.isLoading)

  return {
    hasAnyRole,
    isLoading,
    canAccess: !isLoading && hasAnyRole
  }
}