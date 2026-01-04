import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Search,
  MoreHorizontal,
  UserX,
  UserCheck,
  Eye,
  Loader2,
  Users,
  Plus,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Available roles from the app_role enum
const AVAILABLE_ROLES: readonly string[] = [
  'admin',
  'moderator',
  'user',
  'organizer',
  'participant',
  'judge',
  'volunteer',
  'speaker',
];

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  organization: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface UserWithRoles extends UserProfile {
  roles: string[];
  email?: string;
}

export const AdminUserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<string>('');

  // Fetch user profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<UserProfile[]>({
    queryKey: ['admin-user-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, organization, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Fetch user roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-user-roles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (error) throw error;
      return data as UserRole[];
    },
  });

  // Combine profiles with roles
  const usersWithRoles = useMemo(() => {
    const rolesMap = new Map<string, string[]>();
    for (const role of roles) {
      const existing = rolesMap.get(role.user_id) || [];
      existing.push(role.role);
      rolesMap.set(role.user_id, existing);
    }

    return profiles.map(profile => ({
      ...profile,
      roles: rolesMap.get(profile.id) || [],
    }));
  }, [profiles, roles]);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersWithRoles;

    const query = searchQuery.toLowerCase();
    return usersWithRoles.filter(user =>
      user.full_name?.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query) ||
      user.organization?.toLowerCase().includes(query) ||
      user.roles.some(r => r.toLowerCase().includes(query))
    );
  }, [usersWithRoles, searchQuery]);

  // Suspend user mutation (remove all roles except participant)
  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      // Log the suspension (use any to avoid type issues with generated types)
      await (supabase as any).from('admin_audit_logs').insert({
        admin_id: currentUser?.id,
        admin_email: currentUser?.email,
        action: 'USER_SUSPENDED',
        target_type: 'user',
        target_id: userId,
        details: { reason },
      });

      // Remove all roles except participant
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .neq('role', 'participant');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles-list'] });
      toast.success('User suspended successfully');
      setShowSuspendDialog(false);
      setSuspendReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to suspend user');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (userId: string) => {
      await (supabase as any).from('admin_audit_logs').insert({
        admin_id: currentUser?.id,
        admin_email: currentUser?.email,
        action: 'USER_RESTORED',
        target_type: 'user',
        target_id: userId,
        details: {},
      });

      // We don't automatically restore roles - admin should manually assign
      return;
    },
    onSuccess: () => {
      toast.success('User restored - you can now assign roles manually');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to restore user');
    },
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Log the action
      await (supabase as any).from('admin_audit_logs').insert({
        admin_id: currentUser?.id,
        admin_email: currentUser?.email,
        action: 'ROLE_GRANTED',
        target_type: 'user',
        target_id: userId,
        details: { role },
      });

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as any });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles-list'] });
      toast.success(`Role "${variables.role}" granted successfully`);
      setSelectedRoleToAdd('');
      // Update selectedUser's roles locally
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          roles: [...selectedUser.roles, variables.role],
        });
      }
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('User already has this role');
      } else {
        toast.error(error.message || 'Failed to grant role');
      }
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Log the action
      await (supabase as any).from('admin_audit_logs').insert({
        admin_id: currentUser?.id,
        admin_email: currentUser?.email,
        action: 'ROLE_REVOKED',
        target_type: 'user',
        target_id: userId,
        details: { role },
      });

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles-list'] });
      toast.success(`Role "${variables.role}" revoked successfully`);
      // Update selectedUser's roles locally
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          roles: selectedUser.roles.filter(r => r !== variables.role),
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to revoke role');
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'organizer':
        return 'secondary';
      case 'participant':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const openUserDetails = (user: UserWithRoles) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const openSuspendDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setShowSuspendDialog(true);
  };

  const openRoleDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setSelectedRoleToAdd('');
    setShowRoleDialog(true);
  };

  const handleSuspend = () => {
    if (!selectedUser || !suspendReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }
    suspendMutation.mutate({ userId: selectedUser.id, reason: suspendReason });
  };

  const handleAddRole = () => {
    if (!selectedUser || !selectedRoleToAdd) {
      toast.error('Please select a role to add');
      return;
    }
    addRoleMutation.mutate({ userId: selectedUser.id, role: selectedRoleToAdd });
  };

  const handleRemoveRole = (role: string) => {
    if (!selectedUser) return;
    
    // Prevent removing the last role
    if (selectedUser.roles.length === 1) {
      toast.error('Cannot remove the last role. User must have at least one role.');
      return;
    }
    
    removeRoleMutation.mutate({ userId: selectedUser.id, role });
  };

  // Get available roles that the user doesn't already have
  const availableRolesToAdd = useMemo(() => {
    if (!selectedUser) return AVAILABLE_ROLES;
    return AVAILABLE_ROLES.filter(role => !selectedUser.roles.includes(role));
  }, [selectedUser]);

  const isLoading = profilesLoading || rolesLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </h2>
          <p className="text-muted-foreground text-sm">
            View, search, and manage user accounts.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            All Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users found.
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.full_name || 'Unnamed User'}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                            {user.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge
                                key={role}
                                variant={getRoleBadgeVariant(role)}
                                className="text-xs"
                              >
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.organization || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openUserDetails(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Manage Roles
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.roles.includes('admin') ? null : (
                              <>
                                {user.roles.length > 1 ? (
                                  <DropdownMenuItem
                                    onClick={() => openSuspendDialog(user)}
                                    className="text-amber-600"
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Suspend User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => restoreMutation.mutate(user.id)}
                                    className="text-emerald-600"
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Restore User
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this user.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-foreground">{selectedUser.full_name || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization</label>
                  <p className="text-foreground">{selectedUser.organization || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-foreground">{selectedUser.phone || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Joined</label>
                  <p className="text-foreground">
                    {format(new Date(selectedUser.created_at), 'PPP')}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-foreground font-mono text-xs break-all">{selectedUser.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Roles</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedUser.roles.length > 0 ? (
                    selectedUser.roles.map((role) => (
                      <Badge key={role} variant={getRoleBadgeVariant(role)}>
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No roles assigned</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <UserX className="h-5 w-5" />
              Suspend User
            </DialogTitle>
            <DialogDescription>
              This will remove all roles except 'participant' from this user, effectively
              suspending their access to organizer and admin features.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for suspension</label>
              <Textarea
                placeholder="Provide a reason for this suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Roles Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Manage Roles
            </DialogTitle>
            <DialogDescription>
              Grant or revoke roles for {selectedUser?.full_name || 'this user'}.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Current Roles */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles.length > 0 ? (
                    selectedUser.roles.map((role) => (
                      <Badge
                        key={role}
                        variant={getRoleBadgeVariant(role)}
                        className="flex items-center gap-1 pr-1"
                      >
                        {role}
                        <button
                          onClick={() => handleRemoveRole(role)}
                          disabled={removeRoleMutation.isPending || selectedUser.roles.length === 1}
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={selectedUser.roles.length === 1 ? 'Cannot remove last role' : `Remove ${role}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">No roles assigned</span>
                  )}
                </div>
              </div>

              {/* Add New Role */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Add New Role
                </label>
                <div className="flex gap-2">
                  <Select
                    value={selectedRoleToAdd}
                    onValueChange={setSelectedRoleToAdd}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRolesToAdd.length > 0 ? (
                        availableRolesToAdd.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          User has all available roles
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddRole}
                    disabled={!selectedRoleToAdd || addRoleMutation.isPending}
                    size="icon"
                  >
                    {addRoleMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
