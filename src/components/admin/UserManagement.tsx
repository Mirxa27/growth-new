import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Calendar,
  Activity,
  TrendingUp,
  Search,
  MoreVertical,
  Ban,
  UserCheck
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'admin' | 'moderator';
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newThisWeek: number;
  bannedUsers: number;
  adminUsers: number;
}

export const UserManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newThisWeek: 0,
    bannedUsers: 0,
    adminUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
      calculateStats(data || []);
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
  };

  const calculateStats = (profiles: Profile[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: UserStats = {
      totalUsers: profiles.length,
      activeUsers: profiles.filter(p => {
        const updatedAt = new Date(p.updated_at);
        return updatedAt > monthAgo && !p.is_banned;
      }).length,
      newThisWeek: profiles.filter(p => new Date(p.created_at) > weekAgo).length,
      bannedUsers: profiles.filter(p => p.is_banned).length,
      adminUsers: profiles.filter(p => p.role === 'admin').length
    };

    setStats(stats);
  };

  const handleRoleChange = async (profileId: string, newRole: 'user' | 'admin' | 'moderator') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.map(profile => 
        profile.id === profileId ? { ...profile, role: newRole } : profile
      ));

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const handleBanUser = async (profileId: string, ban: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: ban })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.map(profile => 
        profile.id === profileId ? { ...profile, is_banned: ban } : profile
      ));

      toast({
        title: "Success",
        description: ban ? "User has been banned" : "User ban has been lifted",
      });
    } catch (error) {
      console.error('Error updating ban status:', error);
      toast({
        title: "Error",
        description: "Failed to update ban status",
        variant: "destructive"
      });
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !profile.is_banned) ||
                         (statusFilter === 'banned' && profile.is_banned);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusBadgeColor = (isBanned: boolean) => {
    return isBanned ? 'destructive' : 'default';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.newThisWeek}</p>
                <p className="text-xs text-muted-foreground">New This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Ban className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.bannedUsers}</p>
                <p className="text-xs text-muted-foreground">Banned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.adminUsers}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
            </div>
            <Button className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Invite User</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left">User</th>
                  <th className="p-2 text-left hidden md:table-cell">Role</th>
                  <th className="p-2 text-left hidden lg:table-cell">Status</th>
                  <th className="p-2 text-left hidden lg:table-cell">Joined</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="border-b hover:bg-muted/25">
                    <td className="p-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                          {profile.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{profile.full_name || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground">{profile.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      <Badge variant={getRoleBadgeColor(profile.role)}>
                        {profile.role}
                      </Badge>
                    </td>
                    <td className="p-2 hidden lg:table-cell">
                      <Badge variant={getStatusBadgeColor(profile.is_banned)}>
                        {profile.is_banned ? 'Banned' : 'Active'}
                      </Badge>
                    </td>
                    <td className="p-2 hidden lg:table-cell">
                      <p className="text-sm text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedProfile(profile);
                            setIsUserDialogOpen(true);
                          }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(profile.id, 
                            profile.role === 'admin' ? 'user' : 'admin'
                          )}>
                            {profile.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(profile.id, 
                            profile.role === 'moderator' ? 'user' : 'moderator'
                          )}>
                            {profile.role === 'moderator' ? 'Remove Moderator' : 'Make Moderator'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleBanUser(profile.id, !profile.is_banned)}
                            className={profile.is_banned ? 'text-green-600' : 'text-red-600'}
                          >
                            {profile.is_banned ? 'Unban User' : 'Ban User'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProfiles.length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-semibold">
                  {selectedProfile.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedProfile.full_name || 'Unknown User'}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProfile.user_id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <p className="text-sm">{selectedProfile.role}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-sm">{selectedProfile.is_banned ? 'Banned' : 'Active'}</p>
                </div>
                <div>
                  <Label>Joined</Label>
                  <p className="text-sm">{new Date(selectedProfile.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-sm">{new Date(selectedProfile.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedProfile.bio && (
                <div>
                  <Label>Bio</Label>
                  <p className="text-sm mt-1">{selectedProfile.bio}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};