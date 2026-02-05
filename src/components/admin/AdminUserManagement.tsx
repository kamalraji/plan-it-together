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
  SimpleDropdown,
  SimpleDropdownContent,
  SimpleDropdownItem,
  SimpleDropdownTrigger,
} from '@/components/ui/simple-dropdown';
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
} from 'lucide-react';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';

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
  const { logAction } = useAdminAuditLog();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

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
      // Log the suspension via secure edge function
      await logAction({
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
      await logAction({
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

  const handleSuspend = () => {
    if (!selectedUser || !suspendReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }
    suspendMutation.mutate({ userId: selectedUser.id, reason: suspendReason });
  };

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
                        <SimpleDropdown>
                          <SimpleDropdownTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </SimpleDropdownTrigger>
                          <SimpleDropdownContent align="end" className="w-48">
                            <SimpleDropdownItem onClick={() => openUserDetails(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </SimpleDropdownItem>
                            {!user.roles.includes('admin') && (
                              <>
                                <div className="-mx-1 my-1 h-px bg-muted" />
                                {user.roles.length > 1 ? (
                                  <SimpleDropdownItem
                                    onClick={() => openSuspendDialog(user)}
                                    className="text-warning"
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Suspend User
                                  </SimpleDropdownItem>
                                ) : (
                                  <SimpleDropdownItem
                                    onClick={() => restoreMutation.mutate(user.id)}
                                    className="text-emerald-600"
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Restore User
                                  </SimpleDropdownItem>
                                )}
                              </>
                            )}
                          </SimpleDropdownContent>
                        </SimpleDropdown>
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
            <DialogTitle className="flex items-center gap-2 text-warning">
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
    </div>
  );
};

export default AdminUserManagement;
