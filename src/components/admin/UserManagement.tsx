import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Eye, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Mail,
  Crown,
  Settings,
  Ban,
  UserCheck,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';
import { validationUtils } from '@/lib/validation';

interface AdminUser {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  is_admin_backup: boolean;
  last_sign_in_at?: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [userDetailDialog, setUserDetailDialog] = useState(false);
  const { toast } = useToast();
  const { logAdminAction } = useSecurityAudit();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterTier]);

  const loadUsers = async () => {
    try {
      const { data: safeUsers, error } = await supabase
        .rpc('get_admin_safe_profiles');

      if (error) throw error;
      setUsers(safeUsers || []);
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Note: Tier filter removed since it's not in the current schema

    setFilteredUsers(filtered);
  };

  const viewUserDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setUserDetailDialog(true);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Validate input
      if (!validationUtils.validateUUID(userId)) {
        throw new Error('Invalid user ID format');
      }
      
      if (!['user', 'moderator', 'admin'].includes(newRole)) {
        throw new Error('Invalid role specified');
      }

      const { error } = await supabase.rpc('update_user_role_secure', {
        target_user_id: userId,
        new_role: newRole,
      });

      if (error) throw error;

      // Log admin action
      await logAdminAction('update_user_role', userId, { new_role: newRole });

      toast({
        title: "User role updated",
        description: `User role changed to ${newRole}`
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error updating user role",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateSubscriptionTier = async (userId: string, newTier: string) => {
    try {
      const { error } = await supabase.rpc('update_user_subscription_secure', {
        target_user_id: userId,
        new_tier: newTier,
      });

      if (error) throw error;

      toast({
        title: "Subscription updated",
        description: `Subscription tier changed to ${newTier}`
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error updating subscription",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const awardCrystals = async (userId: string, amount: number) => {
    try {
      const { error } = await supabase
        .rpc('award_crystals', { 
          user_id_input: userId, 
          crystal_amount: amount 
        });

      if (error) throw error;

      toast({
        title: "Crystals awarded",
        description: `${amount} crystals awarded to user`
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error awarding crystals",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'premium': return 'default';
      case 'pro': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card border-glass">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </CardContent>
      </Card>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-500">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Crown className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-500">
              {users.filter(u => u.role === 'admin').length}
            </p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">
              {users.filter(u => u.is_admin_backup).length}
            </p>
            <p className="text-xs text-muted-foreground">Backup Admins</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-glass">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <UserCheck className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-500">
              {users.filter(u => {
                const lastLogin = u.last_sign_in_at ? new Date(u.last_sign_in_at) : null;
                if (!lastLogin) return false;
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return lastLogin > weekAgo;
              }).length}
            </p>
            <p className="text-xs text-muted-foreground">Active This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="glass-card border-glass">
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-glass">
                <tr>
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Tier</th>
                  <th className="text-left p-4">Crystals</th>
                  <th className="text-left p-4">Joined</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-b border-glass/50 hover:bg-glass/20">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {getRoleIcon(user.role)}
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.user_id.slice(0, 8)}...</p>
                      </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{user.email}</td>
                    <td className="p-4">
                      <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        N/A
                      </Badge>
                    </td>
                    <td className="p-4 text-sm font-mono">N/A</td>
                    <td className="p-4 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => viewUserDetails(user)}
                        className="glass"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={userDetailDialog} onOpenChange={setUserDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Manage user account and permissions
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <p className="text-sm">{selectedUser.role}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <p className="text-xs font-mono">{selectedUser.user_id}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Join Date</Label>
                    <p className="text-sm">{new Date(selectedUser.created_at).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Login</Label>
                    <p className="text-sm">
                      {selectedUser.last_sign_in_at 
                        ? new Date(selectedUser.last_sign_in_at).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Backup</Label>
                    <p className="text-sm">{selectedUser.is_admin_backup ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-3 bg-muted/20 rounded">
                    <p className="text-2xl font-bold text-primary">N/A</p>
                    <p className="text-xs text-muted-foreground">Crystals</p>
                  </div>
                  <div className="text-center p-3 bg-muted/20 rounded">
                    <p className="text-2xl font-bold text-secondary">N/A</p>
                    <p className="text-xs text-muted-foreground">Level</p>
                  </div>
                  <div className="text-center p-3 bg-muted/20 rounded">
                    <Badge variant="outline">
                      N/A
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Subscription</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_role">User Role</Label>
                    <Select
                      value={selectedUser.role}
                      onValueChange={(value) => updateUserRole(selectedUser.user_id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Subscription Tier</Label>
                    <p className="text-sm">Not available in current schema</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Award Crystals</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => awardCrystals(selectedUser.user_id, 50)}
                        className="glass"
                      >
                        +50 Crystals
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => awardCrystals(selectedUser.user_id, 100)}
                        className="glass"
                      >
                        +100 Crystals
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => awardCrystals(selectedUser.user_id, 500)}
                        className="glass"
                      >
                        +500 Crystals
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Actions</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="glass">
                        <Mail className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                      <Button variant="outline" size="sm" className="glass">
                        <Settings className="w-4 h-4 mr-2" />
                        Reset Password
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Danger Zone</h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      These actions are irreversible. Please be careful.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm">
                        <Ban className="w-4 h-4 mr-2" />
                        Suspend Account
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};