import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useRolePermissions,
  useAssignPermissionToRole,
  useRemovePermissionFromRole,
  useUserRoles,
  useAssignRoleToUser,
  useRemoveRoleFromUser,
  useAuditLogs
} from '@/hooks/useRBAC'
import {
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'

interface RoleFormData {
  name: string
  description: string
}

export function RBACManager() {
  const [activeTab, setActiveTab] = useState('roles')
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [roleForm, setRoleForm] = useState<RoleFormData>({ name: '', description: '' })

  // Queries
  const { data: roles = [], isLoading: rolesLoading } = useRoles()
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions()
  const { data: rolePermissions = [], isLoading: rolePermissionsLoading } = useRolePermissions(selectedRole)
  const { data: userRoles = [], isLoading: userRolesLoading } = useUserRoles('') // Will be filtered

  // Mutations
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()
  const assignPermission = useAssignPermissionToRole()
  const removePermission = useRemovePermissionFromRole()
  const assignRole = useAssignRoleToUser()
  const removeRole = useRemoveRoleFromUser()
  const { data: auditLogs = [] } = useAuditLogs({ limit: 10 })

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault()
    createRole.mutate(roleForm, {
      onSuccess: () => {
        setRoleForm({ name: '', description: '' })
        setIsCreateRoleOpen(false)
      }
    })
  }

  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingRole) {
      updateRole.mutate({ id: editingRole.id, ...roleForm }, {
        onSuccess: () => {
          setEditingRole(null)
          setRoleForm({ name: '', description: '' })
        }
      })
    }
  }

  const handleDeleteRole = (roleId: string) => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      deleteRole.mutate(roleId)
    }
  }

  const handlePermissionToggle = (permissionId: string, isChecked: boolean) => {
    if (!selectedRole) return

    if (isChecked) {
      assignPermission.mutate({ roleId: selectedRole, permissionId })
    } else {
      removePermission.mutate({ roleId: selectedRole, permissionId })
    }
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = []
    }
    acc[permission.resource].push(permission)
    return acc
  }, {} as Record<string, typeof permissions>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RBAC Management</h2>
          <p className="text-muted-foreground">Manage roles, permissions, and access control</p>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    log.status === 'success' ? 'bg-green-500' :
                    log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{log.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="users">User Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roles</CardTitle>
                  <CardDescription>Manage user roles and their permissions</CardDescription>
                </div>
                <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>
                        Define a new role with specific permissions
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateRole} className="space-y-4">
                      <div>
                        <Label htmlFor="roleName">Role Name</Label>
                        <Input
                          id="roleName"
                          value={roleForm.name}
                          onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., content_manager"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="roleDescription">Description</Label>
                        <Textarea
                          id="roleDescription"
                          value={roleForm.description}
                          onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what this role can do..."
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createRole.isLoading}>
                          {createRole.isLoading ? 'Creating...' : 'Create Role'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="text-center py-8">Loading roles...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description || 'No description'}</TableCell>
                        <TableCell>{format(new Date(role.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingRole(role)
                                setRoleForm({ name: role.name, description: role.description || '' })
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={deleteRole.isLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Edit Role Dialog */}
          {editingRole && (
            <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Role</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateRole} className="space-y-4">
                  <div>
                    <Label htmlFor="editRoleName">Role Name</Label>
                    <Input
                      id="editRoleName"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editRoleDescription">Description</Label>
                    <Textarea
                      id="editRoleDescription"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateRole.isLoading}>
                      {updateRole.isLoading ? 'Updating...' : 'Update Role'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Role</CardTitle>
                <CardDescription>Choose a role to manage its permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedRole && (
              <Card>
                <CardHeader>
                  <CardTitle>Permissions for {roles.find(r => r.id === selectedRole)?.name}</CardTitle>
                  <CardDescription>
                    Configure what this role can access and do
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {permissionsLoading || rolePermissionsLoading ? (
                    <div className="text-center py-8">Loading permissions...</div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedPermissions).map(([resource, perms]) => (
                        <div key={resource} className="space-y-3">
                          <h4 className="font-medium capitalize">{resource}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {perms.map((permission) => {
                              const hasPermission = rolePermissions.some(p => p.id === permission.id)
                              return (
                                <div key={permission.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={permission.id}
                                    checked={hasPermission}
                                    onCheckedChange={(checked) =>
                                      handlePermissionToggle(permission.id, checked as boolean)
                                    }
                                    disabled={assignPermission.isLoading || removePermission.isLoading}
                                  />
                                  <Label htmlFor={permission.id} className="text-sm">
                                    {permission.action.replace('_', ' ')}
                                  </Label>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Role Assignments</CardTitle>
              <CardDescription>Manage which users have which roles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This section would typically include user search and role assignment functionality.
                For security reasons, user management should be handled through dedicated admin interfaces.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Available user management features:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Assign roles to users</li>
                  <li>Set role expiration dates</li>
                  <li>View user permission summaries</li>
                  <li>Bulk role assignments</li>
                  <li>Role assignment history</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}