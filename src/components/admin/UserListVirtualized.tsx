import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Mail, UserCheck, Ban, Shield, Trash2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

interface UserListVirtualizedProps {
  profiles: Tables<'profiles'>[];
  selectedUsers: Set<string>;
  onToggleUser: (userId: string) => void;
  onToggleSelectAll: () => void;
  onUpdateRole: (userId: string, newRole: string) => void;
  onSendEmail: (email: string) => void;
  onToggleBan: (userId: string, isBanned: boolean) => void;
  onDeleteUser: (userId: string) => void;
}

// Row component for virtualized list
const UserRow = React.memo(({
  index,
  style,
  data
}: {
  index: number;
  style: React.CSSProperties;
  data: UserListVirtualizedProps['profiles'][0] & {
    selectedUsers: Set<string>;
    onToggleUser: (userId: string) => void;
    onUpdateRole: (userId: string, newRole: string) => void;
    onSendEmail: (email: string) => void;
    onToggleBan: (userId: string, isBanned: boolean) => void;
    onDeleteUser: (userId: string) => void;
  };
}) => {
  const profile = data;
  const { selectedUsers, onToggleUser, onUpdateRole, onSendEmail, onToggleBan, onDeleteUser } = data;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="destructive">Admin</Badge>;
      case 'moderator': return <Badge variant="secondary">Moderator</Badge>;
      default: return <Badge variant="outline">User</Badge>;
    }
  };

  return (
    <div style={style} className="border-b border-glass hover:bg-muted/10">
      <div className="flex items-center p-2">
        <div className="w-8 flex-shrink-0">
          <Checkbox
            checked={selectedUsers.has(profile.user_id!)}
            onCheckedChange={() => onToggleUser(profile.user_id!)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{profile.display_name}</p>
              <p className="text-sm text-muted-foreground truncate hidden md:block">
                {profile.email}
              </p>
            </div>
            <div className="hidden md:block">
              {getRoleBadge(profile.role || 'user')}
            </div>
            <div className="hidden lg:block">
              <Badge variant={profile.is_banned ? "destructive" : "default"}>
                {profile.is_banned ? 'Banned' : 'Active'}
              </Badge>
            </div>
            <div className="hidden lg:block text-sm text-muted-foreground">
              {new Date(profile.created_at!).toLocaleDateString()}
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onSendEmail(profile.email!)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateRole(profile.user_id!, profile.role === 'admin' ? 'user' : 'admin')}>
                    <Shield className="h-4 w-4 mr-2" />
                    {profile.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleBan(profile.user_id!, !profile.is_banned)}>
                    {profile.is_banned ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Unban User
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-2" />
                        Ban User
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteUser(profile.user_id!)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

UserRow.displayName = 'UserRow';

// Header component
const TableHeader = React.memo(({
  onSelectAll,
  allSelected,
  profilesCount
}: {
  onSelectAll: () => void;
  allSelected: boolean;
  profilesCount: number;
}) => (
  <div className="bg-muted/10 border-b border-glass p-2">
    <div className="flex items-center">
      <div className="w-8 flex-shrink-0">
        <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
      </div>
      <div className="flex-1 grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
        <div className="col-span-4">User</div>
        <div className="col-span-2 hidden md:block">Role</div>
        <div className="col-span-2 hidden lg:block">Status</div>
        <div className="col-span-2 hidden lg:block">Joined</div>
        <div className="col-span-2">Actions</div>
      </div>
    </div>
  </div>
));

TableHeader.displayName = 'TableHeader';

export const UserListVirtualized: React.FC<UserListVirtualizedProps> = ({
  profiles,
  selectedUsers,
  onToggleUser,
  onToggleSelectAll,
  onUpdateRole,
  onSendEmail,
  onToggleBan,
  onDeleteUser,
}) => {
  // Memoize calculations
  const allSelected = useMemo(
    () => profiles.length > 0 && selectedUsers.size === profiles.length,
    [profiles.length, selectedUsers.size]
  );

  // Prepare item data for rows
  const itemData = useMemo(() => {
    return profiles.map(profile => ({
      ...profile,
      selectedUsers,
      onToggleUser,
      onUpdateRole,
      onSendEmail,
      onToggleBan,
      onDeleteUser,
    }));
  }, [profiles, selectedUsers, onToggleUser, onUpdateRole, onSendEmail, onToggleBan, onDeleteUser]);

  return (
    <div className="rounded-md border border-glass">
      <TableHeader
        onSelectAll={onToggleSelectAll}
        allSelected={allSelected}
        profilesCount={profiles.length}
      />
      <div className="h-[600px]">
        <List
          height={600}
          itemCount={profiles.length}
          itemSize={80} // Approximate row height
          width="100%"
          itemData={itemData}
        >
          {UserRow}
        </List>
      </div>
    </div>
  );
};