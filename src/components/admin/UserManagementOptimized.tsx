import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  ShieldCheck,
  Search,
  Download,
  Upload,
  Mail,
  Trash2,
  UserPlus,
  Shield
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserListVirtualized } from './UserListVirtualized';

const roleUpdateSchema = z.object({
  target_user_id: z.string().uuid(),
  new_role: z.enum(['user', 'admin', 'moderator']),
});

const banUpdateSchema = z.object({
  target_user_id: z.string().uuid(),
  new_status: z.boolean(),
});

type Profile = Tables<'profiles'>;

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newThisWeek: number;
  bannedUsers: number;
  adminUsers: number;
  moderatorUsers: number;
}

const UserManagementOptimized: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newThisWeek: 0,
    bannedUsers: 0,
    adminUsers: 0,
    moderatorUsers: 0,
  });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');

  // Memoize fetchProfiles function
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);

      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(profilesData || []);

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        totalUsers: profilesData?.length || 0,
        activeUsers: profilesData?.filter(p => !p.is_banned).length || 0,
        newThisWeek: profilesData?.filter(p => new Date(p.created_at || '') > weekAgo).length || 0,
        bannedUsers: profilesData?.filter(p => p.is_banned).length || 0,
        adminUsers: profilesData?.filter(p => p.role === 'admin').length || 0,
        moderatorUsers: profilesData?.filter(p => p.role === 'moderator').length || 0,
      };

      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user profiles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Memoize filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = !search ||
        profile.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        profile.email?.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === 'all' || profile.role === roleFilter;

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && !profile.is_banned) ||
        (statusFilter === 'banned' && profile.is_banned);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [profiles, search, roleFilter, statusFilter]);

  // Memoize handlers with useCallback
  const handleUpdateRole = useCallback(async (userId: string, newRole: string) => {
    try {
      const params = roleUpdateSchema.parse({
        target_user_id: userId,
        new_role,
      });
      const { error } = await supabase.rpc('update_user_role_secure', params);

      if (error) throw error;
      toast({ title: "Success", description: `User role updated to ${newRole}` });
      fetchProfiles();
    } catch (error: any) {
      console.error('Role update error:', error);
      toast({
        title: "Error",
        description: `Failed to update user role: ${error.message || 'Invalid parameters'}`,
        variant: "destructive"
      });
    }
  }, [toast, fetchProfiles]);

  const handleToggleBan = useCallback(async (userId: string, isBanned: boolean) => {
    try {
      const params = banUpdateSchema.parse({
        target_user_id: userId,
        new_status: isBanned,
      });
      const { error } = await supabase.rpc('update_user_ban_status_secure', params);

      if (error) throw error;
      toast({
        title: "Success",
        description: isBanned ? "User has been banned" : "User ban has been lifted"
      });
      fetchProfiles();
    } catch (error: any) {
      console.error('Ban update error:', error);
      toast({
        title: "Error",
        description: `Failed to update ban status: ${error.message || 'Invalid parameters'}`,
        variant: "destructive"
      });
    }
  }, [toast, fetchProfiles]);

  const handleSendEmail = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: { to: email, subject: 'Admin Message', message: bulkMessage }
      });

      if (error) throw error;
      toast({ title: "Success", description: "Email sent successfully" });
    } catch (error: any) {
      console.error('Email send error:', error);
      toast({
        title: "Error",
        description: `Failed to send email: ${error.message}`,
        variant: "destructive"
      });
    }
  }, [toast, bulkMessage]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;
      toast({ title: "Success", description: "User deleted successfully" });
      fetchProfiles();
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive"
      });
    }
  }, [toast, fetchProfiles]);

  const handleSelectUser = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(userId)) {
        newSelected.delete(userId);
      } else {
        newSelected.add(userId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedUsers(prev => {
      if (prev.size === filteredProfiles.length) {
        return new Set();
      } else {
        return new Set(filteredProfiles.map(p => p.user_id!));
      }
    });
  }, [filteredProfiles]);

  const handleBulkAction = useCallback(async () => {
    if (selectedUsers.size === 0) return;

    try {
      setIsBulkProcessing(true);
      const userIds = Array.from(selectedUsers);

      switch (bulkAction) {
        case 'delete':
          await Promise.all(userIds.map(userId => handleDeleteUser(userId)));
          break;
        case 'ban':
          await Promise.all(userIds.map(userId => handleToggleBan(userId, true)));
          break;
        case 'unban':
          await Promise.all(userIds.map(userId => handleToggleBan(userId, false)));
          break;
        case 'admin':
          await Promise.all(userIds.map(userId => handleUpdateRole(userId, 'admin')));
          break;
        case 'user':
          await Promise.all(userIds.map(userId => handleUpdateRole(userId, 'user')));
          break;
        case 'email':
          if (!bulkMessage.trim()) return;
          // For bulk email, we would need to implement a batch email function
          toast({ title: "Info", description: "Bulk email feature coming soon" });
          break;
      }

      setSelectedUsers(new Set());
      setIsBulkDialogOpen(false);
      toast({ title: "Success", description: "Bulk action completed successfully" });
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast({
        title: "Error",
        description: `Failed to complete bulk action: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsBulkProcessing(false);
    }
  }, [selectedUsers, bulkAction, bulkMessage, handleDeleteUser, handleToggleBan, handleUpdateRole, toast]);

  // Memoize export functions
  const exportToCSV = useCallback(() => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Joined', 'Last Active'];
    const rows = filteredProfiles.map(p => [
      p.display_name || '',
      p.email || '',
      p.role || '',
      p.is_banned ? 'Banned' : 'Active',
      p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
      p.last_login_at ? new Date(p.last_login_at).toLocaleDateString() : '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [filteredProfiles]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="glass-strong">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.newThisWeek}</p>
                <p className="text-xs text-muted-foreground">New This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.adminUsers}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.moderatorUsers}</p>
                <p className="text-xs text-muted-foreground">Moderators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.bannedUsers}</p>
                <p className="text-xs text-muted-foreground">Banned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="moderator">Moderators</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              {selectedUsers.size > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkAction('email');
                    setIsBulkDialogOpen(true);
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Bulk Email ({selectedUsers.size})
                </Button>
              )}

              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Virtualized User List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <UserListVirtualized
              profiles={filteredProfiles}
              selectedUsers={selectedUsers}
              onToggleUser={handleSelectUser}
              onToggleSelectAll={handleSelectAll}
              onUpdateRole={handleUpdateRole}
              onSendEmail={handleSendEmail}
              onToggleBan={handleToggleBan}
              onDeleteUser={handleDeleteUser}
            />
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>
              Confirm {bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1)} Action
            </DialogTitle>
            <DialogDescription>
              You are about to {bulkAction} {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {bulkAction === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="bulk-message">Email Message</Label>
              <Textarea
                id="bulk-message"
                placeholder="Enter your message here..."
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Selected Users:</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {filteredProfiles
                .filter(p => selectedUsers.has(p.user_id!))
                .slice(0, 10)
                .map(profile => (
                  <div key={profile.id} className="text-sm text-muted-foreground">
                    • {profile.display_name} ({profile.email})
                  </div>
                ))}
              {selectedUsers.size > 10 && (
                <div className="text-sm text-muted-foreground">
                  ... and {selectedUsers.size - 10} more
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={isBulkProcessing || (bulkAction === 'email' && !bulkMessage.trim())}
              variant={bulkAction === 'delete' || bulkAction === 'ban' ? 'destructive' : 'default'}
            >
              {isBulkProcessing ? 'Processing...' : `Confirm ${bulkAction}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementOptimized;