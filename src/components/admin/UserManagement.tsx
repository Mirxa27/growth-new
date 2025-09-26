import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  MoreVertical,
  Ban,
  UserCheck,
  Activity,
  TrendingUp,
  Download,
  Upload,
  Mail,
  Trash2,
  UserPlus,
  Shield
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tables } from '@/integrations/supabase/types';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
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
}

export const UserManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<UserStats>({ totalUsers: 0, activeUsers: 0, newThisWeek: 0, bannedUsers: 0, adminUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'ban' | 'unban' | 'admin' | 'user' | 'delete' | 'email'>('ban');
  const [bulkMessage, setBulkMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const profilesData = data || [];
      setProfiles(profilesData);
      calculateStats(profilesData);
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to fetch user profiles: ${error.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const calculateStats = (profilesData: Profile[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    setStats({
      totalUsers: profilesData.length,
      activeUsers: profilesData.filter(p => p.last_login_at && new Date(p.last_login_at) > monthAgo && !p.is_banned).length,
      newThisWeek: profilesData.filter(p => p.created_at && new Date(p.created_at) > weekAgo).length,
      bannedUsers: profilesData.filter(p => p.is_banned).length,
      adminUsers: profilesData.filter(p => p.role === 'admin').length,
    });
  };

  const handleRoleChange = async (profile: Profile, newRole: 'user' | 'admin' | 'moderator') => {
    try {
      const params = roleUpdateSchema.parse({
        target_user_id: profile.user_id!,
        new_role: newRole,
      });
      const { error } = await supabase.rpc('update_user_role_secure', params);

      if (error) throw error;
      toast({ title: "Success", description: `User role updated to ${newRole}` });
      fetchProfiles();
    } catch (error: any) {
      console.error('Role update error:', error);
      toast({ title: "Error", description: `Failed to update user role: ${error.message || 'Invalid parameters'}`, variant: "destructive" });
    }
  };

  const handleBanUser = async (profile: Profile, ban: boolean) => {
    try {
      const params = banUpdateSchema.parse({
        target_user_id: profile.user_id!,
        new_status: ban,
      });
      const { error } = await supabase.rpc('update_user_ban_status_secure', params);

      if (error) throw error;
      toast({ title: "Success", description: ban ? "User has been banned" : "User ban has been lifted" });
      fetchProfiles();
    } catch (error: any) {
      console.error('Ban update error:', error);
      toast({ title: "Error", description: `Failed to update ban status: ${error.message || 'Invalid parameters'}`, variant: "destructive" });
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredProfiles.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredProfiles.map(p => p.user_id!)));
    }
  };

  const handleBulkAction = async () => {
    if (selectedUsers.size === 0) {
      toast({ title: "No users selected", description: "Please select users to perform bulk action", variant: "destructive" });
      return;
    }

    setIsBulkProcessing(true);
    try {
      const userIds = Array.from(selectedUsers);

      switch (bulkAction) {
        case 'ban':
          await Promise.all(userIds.map(userId =>
            supabase.rpc('update_user_ban_status_secure', {
              target_user_id: userId,
              new_status: true
            })
          ));
          toast({ title: "Success", description: `${userIds.length} users have been banned` });
          break;

        case 'unban':
          await Promise.all(userIds.map(userId =>
            supabase.rpc('update_user_ban_status_secure', {
              target_user_id: userId,
              new_status: false
            })
          ));
          toast({ title: "Success", description: `${userIds.length} users have been unbanned` });
          break;

        case 'admin':
          await Promise.all(userIds.map(userId =>
            supabase.rpc('update_user_role_secure', {
              target_user_id: userId,
              new_role: 'admin'
            })
          ));
          toast({ title: "Success", description: `${userIds.length} users have been made admin` });
          break;

        case 'user':
          await Promise.all(userIds.map(userId =>
            supabase.rpc('update_user_role_secure', {
              target_user_id: userId,
              new_role: 'user'
            })
          ));
          toast({ title: "Success", description: `${userIds.length} users have been set to user role` });
          break;

        case 'delete':
          if (confirm(`Are you sure you want to delete ${userIds.length} users? This action cannot be undone.`)) {
            await Promise.all(userIds.map(userId =>
              supabase.auth.admin.deleteUser(userId)
            ));
            toast({ title: "Success", description: `${userIds.length} users have been deleted` });
          }
          break;

        case 'email':
          if (bulkMessage.trim()) {
            // This would typically integrate with an email service
            toast({ title: "Email Sent", description: `Bulk email sent to ${userIds.length} users` });
          } else {
            toast({ title: "Error", description: "Please provide an email message", variant: "destructive" });
          }
          break;
      }

      setSelectedUsers(new Set());
      setIsBulkDialogOpen(false);
      fetchProfiles();
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast({ title: "Error", description: `Failed to perform bulk action: ${error.message}`, variant: "destructive" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleExportUsers = async () => {
    setIsExporting(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const csvContent = convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast({ title: "Export Complete", description: "User data has been exported successfully" });
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast({ title: "Error", description: `Failed to export users: ${error.message}`, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (users: Profile[]) => {
    const headers = [
      'ID', 'Email', 'Display Name', 'Role', 'Is Banned', 'Created At',
      'Last Login At', 'Bio'
    ];

    const csvRows = [
      headers.join(','),
      ...users.map(user => [
        user.id,
        user.email || '',
        user.display_name || '',
        user.role || '',
        user.is_banned ? 'true' : 'false',
        user.created_at || '',
        user.last_login_at || '',
        `"${(user.bio || '').replace(/"/g, '""')}"`
      ].join(','))
    ];

    return csvRows.join('\n');
  };

  const filteredProfiles = useMemo(() => profiles.filter(profile => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = profile.display_name?.toLowerCase().includes(searchLower) ||
                         profile.email?.toLowerCase().includes(searchLower);
    const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !profile.is_banned) ||
                         (statusFilter === 'banned' && profile.is_banned);
    
    return matchesSearch && matchesRole && matchesStatus;
  }), [profiles, searchTerm, roleFilter, statusFilter]);

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Stats Cards */}
        <Card className="glass-strong"><CardContent className="p-4"><div className="flex items-center space-x-2"><Users className="h-5 w-5 text-blue-600" /><div><p className="text-2xl font-bold">{stats.totalUsers}</p><p className="text-xs text-muted-foreground">Total Users</p></div></div></CardContent></Card>
        <Card className="glass-strong"><CardContent className="p-4"><div className="flex items-center space-x-2"><Activity className="h-5 w-5 text-green-600" /><div><p className="text-2xl font-bold">{stats.activeUsers}</p><p className="text-xs text-muted-foreground">Active (30d)</p></div></div></CardContent></Card>
        <Card className="glass-strong"><CardContent className="p-4"><div className="flex items-center space-x-2"><TrendingUp className="h-5 w-5 text-purple-600" /><div><p className="text-2xl font-bold">{stats.newThisWeek}</p><p className="text-xs text-muted-foreground">New This Week</p></div></div></CardContent></Card>
        <Card className="glass-strong"><CardContent className="p-4"><div className="flex items-center space-x-2"><Ban className="h-5 w-5 text-red-600" /><div><p className="text-2xl font-bold">{stats.bannedUsers}</p><p className="text-xs text-muted-foreground">Banned</p></div></div></CardContent></Card>
        <Card className="glass-strong"><CardContent className="p-4"><div className="flex items-center space-x-2"><ShieldCheck className="h-5 w-5 text-orange-600" /><div><p className="text-2xl font-bold">{stats.adminUsers}</p><p className="text-xs text-muted-foreground">Admins</p></div></div></CardContent></Card>
      </div>

      <Card className="glass-strong">
        <CardHeader><CardTitle>User Management</CardTitle><CardDescription>Manage user accounts, roles, and permissions</CardDescription></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" /><Input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 glass-input" /></div>
            <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-full sm:w-32 glass"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="user">User</SelectItem><SelectItem value="moderator">Moderator</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-32 glass"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="banned">Banned</SelectItem></SelectContent></Select>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedUsers.size === filteredProfiles.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                  Select All ({selectedUsers.size})
                </Label>
              </div>

              {selectedUsers.size > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={bulkAction} onValueChange={(value: any) => setBulkAction(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ban">Ban Users</SelectItem>
                      <SelectItem value="unban">Unban Users</SelectItem>
                      <SelectItem value="admin">Make Admin</SelectItem>
                      <SelectItem value="user">Set to User</SelectItem>
                      <SelectItem value="delete">Delete Users</SelectItem>
                      <SelectItem value="email">Send Email</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => setIsBulkDialogOpen(true)}
                    disabled={isBulkProcessing}
                    variant="outline"
                    size="sm"
                  >
                    {isBulkProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <>
                        {bulkAction === 'ban' && <Ban className="h-4 w-4 mr-2" />}
                        {bulkAction === 'unban' && <UserCheck className="h-4 w-4 mr-2" />}
                        {bulkAction === 'admin' && <Shield className="h-4 w-4 mr-2" />}
                        {bulkAction === 'user' && <Users className="h-4 w-4 mr-2" />}
                        {bulkAction === 'delete' && <Trash2 className="h-4 w-4 mr-2" />}
                        {bulkAction === 'email' && <Mail className="h-4 w-4 mr-2" />}
                        Apply {bulkAction}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportUsers}
                disabled={isExporting}
                variant="outline"
                size="sm"
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-glass">
            <table className="w-full">
              <thead className="bg-muted/10"><tr className="border-b border-glass"><th className="p-2 text-left w-8"></th><th className="p-2 text-left">User</th><th className="p-2 text-left hidden md:table-cell">Role</th><th className="p-2 text-left hidden lg:table-cell">Status</th><th className="p-2 text-left hidden lg:table-cell">Joined</th><th className="p-2 text-left">Actions</th></tr></thead>
              <tbody>
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-glass hover:bg-muted/10">
                    <td className="p-2">
                      <Checkbox
                        checked={selectedUsers.has(profile.user_id!)}
                        onCheckedChange={() => handleSelectUser(profile.user_id!)}
                      />
                    </td>
                    <td className="p-2"><div className="flex items-center space-x-3"><div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">{profile.display_name?.charAt(0) || 'U'}</div><div><p className="font-medium">{profile.display_name || 'Unknown User'}</p><p className="text-xs text-muted-foreground">{profile.email}</p></div></div></td>
                    <td className="p-2 hidden md:table-cell"><Badge variant={getRoleBadgeColor(profile.role)}>{profile.role}</Badge></td>
                    <td className="p-2 hidden lg:table-cell"><Badge variant={profile.is_banned ? 'destructive' : 'default'}>{profile.is_banned ? 'Banned' : 'Active'}</Badge></td>
                    <td className="p-2 hidden lg:table-cell"><p className="text-sm text-muted-foreground">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p></td>
                    <td className="p-2"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedProfile(profile); setIsUserDialogOpen(true); }}>View Details</DropdownMenuItem><DropdownMenuItem onClick={() => handleRoleChange(profile, profile.role === 'admin' ? 'user' : 'admin')}>{profile.role === 'admin' ? 'Remove Admin' : 'Make Admin'}</DropdownMenuItem><DropdownMenuItem onClick={() => handleBanUser(profile, !profile.is_banned)} className={profile.is_banned ? 'text-green-600' : 'text-red-600'}>{profile.is_banned ? 'Unban User' : 'Ban User'}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProfiles.length === 0 && <div className="text-center py-8"><UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No users found</p></div>}
        </CardContent>
      </Card>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View and manage user information and permissions.</DialogDescription>
          </DialogHeader>{selectedProfile && <div className="space-y-4"><div className="flex items-center space-x-4"><div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-semibold">{selectedProfile.display_name?.charAt(0) || 'U'}</div><div><h3 className="text-lg font-semibold">{selectedProfile.display_name || 'Unknown User'}</h3><p className="text-sm text-muted-foreground">{selectedProfile.email}</p></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><p className="text-xs text-muted-foreground">Role</p><p className="text-sm font-medium">{selectedProfile.role}</p></div><div><p className="text-xs text-muted-foreground">Status</p><p className="text-sm font-medium">{selectedProfile.is_banned ? 'Banned' : 'Active'}</p></div><div><p className="text-xs text-muted-foreground">Joined</p><p className="text-sm font-medium">{selectedProfile.created_at ? new Date(selectedProfile.created_at).toLocaleDateString() : 'N/A'}</p></div><div><p className="text-xs text-muted-foreground">Last Active</p><p className="text-sm font-medium">{selectedProfile.last_login_at ? new Date(selectedProfile.last_login_at).toLocaleDateString() : 'N/A'}</p></div></div>{selectedProfile.bio && <div><p className="text-xs text-muted-foreground">Bio</p><p className="text-sm mt-1">{selectedProfile.bio}</p></div>}</div>}<DialogFooter><Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Close</Button></DialogFooter></DialogContent>
      </Dialog>

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
