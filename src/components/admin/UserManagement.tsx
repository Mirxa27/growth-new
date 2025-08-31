import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
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

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  role?: 'user' | 'admin' | 'moderator';
  is_banned?: boolean;
  raw_user_meta_data?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newThisWeek: number;
  bannedUsers: number;
  adminUsers: number;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      // In a real app, this would be from your auth.users table via admin API
      // For demo purposes, we'll simulate user data
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'sarah@example.com',
          created_at: '2025-08-25T10:00:00Z',
          last_sign_in_at: '2025-08-31T08:30:00Z',
          email_confirmed_at: '2025-08-25T10:15:00Z',
          role: 'user',
          is_banned: false,
          raw_user_meta_data: {
            full_name: 'Sarah Johnson',
            avatar_url: 'https://i.pravatar.cc/150?img=1'
          }
        },
        {
          id: '2',
          email: 'admin@newomen.me',
          created_at: '2025-08-01T10:00:00Z',
          last_sign_in_at: '2025-08-31T09:00:00Z',
          email_confirmed_at: '2025-08-01T10:15:00Z',
          role: 'admin',
          is_banned: false,
          raw_user_meta_data: {
            full_name: 'Admin User',
            avatar_url: 'https://i.pravatar.cc/150?img=2'
          }
        },
        {
          id: '3',
          email: 'mike.moderator@example.com',
          created_at: '2025-08-20T10:00:00Z',
          last_sign_in_at: '2025-08-30T15:20:00Z',
          email_confirmed_at: '2025-08-20T10:30:00Z',
          role: 'moderator',
          is_banned: false,
          raw_user_meta_data: {
            full_name: 'Mike Wilson',
            avatar_url: 'https://i.pravatar.cc/150?img=3'
          }
        },
        {
          id: '4',
          email: 'emma.user@example.com',
          created_at: '2025-08-28T14:00:00Z',
          last_sign_in_at: '2025-08-29T11:45:00Z',
          email_confirmed_at: '2025-08-28T14:15:00Z',
          role: 'user',
          is_banned: false,
          raw_user_meta_data: {
            full_name: 'Emma Davis',
            avatar_url: 'https://i.pravatar.cc/150?img=4'
          }
        },
        {
          id: '5',
          email: 'banned.user@example.com',
          created_at: '2025-08-15T10:00:00Z',
          last_sign_in_at: '2025-08-20T10:00:00Z',
          email_confirmed_at: '2025-08-15T10:15:00Z',
          role: 'user',
          is_banned: true,
          raw_user_meta_data: {
            full_name: 'Banned User',
            avatar_url: 'https://i.pravatar.cc/150?img=5'
          }
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from users data
      const mockStats: UserStats = {
        totalUsers: 1247,
        activeUsers: 892,
        newThisWeek: 34,
        bannedUsers: 12,
        adminUsers: 3
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'moderator') => {
    try {
      // In a real app, this would update the user's role in the database
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
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

  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      // In a real app, this would update the user's ban status
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_banned: ban } : user
      ));

      toast({
        title: "Success",
        description: `User ${ban ? 'banned' : 'unbanned'} successfully`,
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.raw_user_meta_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !user.is_banned) ||
                         (statusFilter === 'banned' && user.is_banned) ||
                         (statusFilter === 'unconfirmed' && !user.email_confirmed_at);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-blue-100 text-blue-800">Moderator</Badge>;
      case 'user':
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.is_banned) {
      return <Badge variant="destructive">Banned</Badge>;
    }
    if (!user.email_confirmed_at) {
      return <Badge variant="outline">Unconfirmed</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
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
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
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
              <ShieldCheck className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.adminUsers}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Ban className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.bannedUsers}</p>
                <p className="text-xs text-muted-foreground">Banned Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users, roles, and permissions</CardDescription>
            </div>
            <Button className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Invite User</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="moderator">Moderators</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
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
                <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {user.raw_user_meta_data?.avatar_url ? (
                      <img 
                        src={user.raw_user_meta_data.avatar_url} 
                        alt={user.raw_user_meta_data?.full_name || 'User'}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <Users className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">
                        {user.raw_user_meta_data?.full_name || 'Unknown User'}
                      </p>
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user)}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{user.email}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                      </span>
                      {user.last_sign_in_at && (
                        <span className="flex items-center space-x-1">
                          <Activity className="h-3 w-3" />
                          <span>Last active {new Date(user.last_sign_in_at).toLocaleDateString()}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select 
                    value={user.role || 'user'} 
                    onValueChange={(value: 'user' | 'admin' | 'moderator') => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {
                        setSelectedUser(user);
                        setIsUserDialogOpen(true);
                      }}>
                        <Users className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {user.is_banned ? (
                        <DropdownMenuItem onClick={() => handleBanUser(user.id, false)}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Unban User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleBanUser(user.id, true)}>
                          <Ban className="h-4 w-4 mr-2" />
                          Ban User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'No users match your current criteria.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  {selectedUser.raw_user_meta_data?.avatar_url ? (
                    <img 
                      src={selectedUser.raw_user_meta_data.avatar_url} 
                      alt={selectedUser.raw_user_meta_data?.full_name || 'User'}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <Users className="h-8 w-8 text-gray-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedUser.raw_user_meta_data?.full_name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Joined</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Active</Label>
                  <p className="text-sm font-medium">
                    {selectedUser.last_sign_in_at 
                      ? new Date(selectedUser.last_sign_in_at).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email Confirmed</Label>
                  <p className="text-sm font-medium">
                    {selectedUser.email_confirmed_at ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className="text-sm font-medium">
                    {selectedUser.is_banned ? 'Banned' : 'Active'}
                  </p>
                </div>
              </div>
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