import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { useMyOrganizations } from '@/hooks/useOrganization';
import { VendorApprovalPanel } from './VendorApprovalPanel';

// Use untyped Supabase client here because generated types are empty until DB introspection runs
const supabaseAny = supabase as any;

// App roles used in Supabase user_roles table
export type AppRole =
  | 'admin'
  | 'organizer'
  | 'participant'
  | 'judge'
  | 'volunteer'
  | 'speaker';

// Minimal shape of a row in the user_roles table
export interface UserRoleRow {
  id?: string;
  user_id: string;
  role: AppRole | string;
}

interface GroupedUserRoles {
  userId: string;
  roles: AppRole[];
}

export const AdminUserRolesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: myOrganizations, isLoading: orgsLoading } = useMyOrganizations();

  const [search, setSearch] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('participant');
  const [auditNote, setAuditNote] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    userId: string;
    email: string;
    roles: AppRole[];
  } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    document.title = 'Admin User Roles | Thittam1Hub';

    const description =
      'SUPER_ADMIN console to view and manage app roles stored in the secure user_roles table.';

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'SUPER_ADMIN') return;
    if (orgsLoading) return;

    const isThittamAdmin = myOrganizations?.some((org: any) => org.slug === 'thittam1hub');
    if (!isThittamAdmin) {
      window.location.href = '/dashboard';
    }
  }, [user, myOrganizations, orgsLoading]);

  const { data, isLoading } = useQuery<UserRoleRow[]>({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('user_roles')
        .select('*')
        .order('user_id', { ascending: true })
        .order('role', { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });

  const groupedUsers: GroupedUserRoles[] = useMemo(() => {
    if (!data) return [];

    const map = new Map<string, AppRole[]>();

    for (const row of data) {
      const roles = map.get(row.user_id) ?? [];
      roles.push(row.role as AppRole);
      map.set(row.user_id, roles);
    }

    let entries: GroupedUserRoles[] = Array.from(map.entries()).map(([userId, roles]) => ({
      userId,
      roles: Array.from(new Set(roles)),
    }));

    const query = search.trim().toLowerCase();
    if (query) {
      entries = entries.filter(({ userId, roles }) =>
        userId.toLowerCase().includes(query) ||
        roles.some((r) => r.toLowerCase().includes(query)),
      );
    }

    return entries;
  }, [data, search]);

  const addRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
      note,
      actorId,
    }: {
      userId: string;
      role: AppRole;
      note?: string;
      actorId?: string | null;
    }) => {
      const { error } = await supabaseAny.from('user_roles').insert({ user_id: userId, role });

      if (error) {
        throw error;
      }

      console.log('Role change audit', {
        action: 'add',
        targetUserId: userId,
        role,
        note: note ?? null,
        performedBy: actorId ?? null,
        at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast({ title: 'Role added', description: 'The user role was added successfully.' });
      setNewUserId('');
      setNewRole('participant');
      setAuditNote('');
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to add role';
      toast({ title: 'Failed to add role', description: message, variant: 'destructive' });
    },
  });

  const updatePrimaryRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      primaryRole,
      currentRoles,
      note,
      actorId,
    }: {
      userId: string;
      primaryRole: AppRole;
      currentRoles: AppRole[];
      note?: string;
      actorId?: string | null;
    }) => {
      const { error: deleteError } = await supabaseAny
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      const allRoles = Array.from(new Set<AppRole>([primaryRole, ...currentRoles]));

      const { error: insertError } = await supabaseAny
        .from('user_roles')
        .insert(allRoles.map((role) => ({ user_id: userId, role })));

      if (insertError) {
        throw insertError;
      }

      console.log('Role change audit', {
        action: 'update_primary',
        targetUserId: userId,
        roles: allRoles,
        note: note ?? null,
        performedBy: actorId ?? null,
        at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast({ title: 'Roles updated', description: 'User roles have been updated.' });
      setAuditNote('');
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to update roles';
      toast({ title: 'Failed to update roles', description: message, variant: 'destructive' });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
      note,
      actorId,
    }: {
      userId: string;
      role: AppRole;
      note?: string;
      actorId?: string | null;
    }) => {
      const { error } = await supabaseAny
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        throw error;
      }

      console.log('Role change audit', {
        action: 'remove',
        targetUserId: userId,
        role,
        note: note ?? null,
        performedBy: actorId ?? null,
        at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast({ title: 'Role removed', description: 'The role has been removed from this user.' });
      setAuditNote('');
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to remove role';
      toast({ title: 'Failed to remove role', description: message, variant: 'destructive' });
    },
  });

  const handleAddRole = () => {
    const trimmedId = newUserId.trim();
    const note = auditNote.trim();

    if (!trimmedId) {
      toast({ title: 'User ID is required', variant: 'destructive' });
      return;
    }

    if (!note) {
      toast({ title: 'Audit note is required', description: 'Please add a short note for this change.', variant: 'destructive' });
      return;
    }

    addRoleMutation.mutate({ userId: trimmedId, role: newRole, note, actorId: user?.id });
  };

  const handleLookupByEmail = async () => {
    const email = lookupEmail.trim();
    if (!email) {
      toast({ title: 'Email is required', variant: 'destructive' });
      return;
    }

    setIsLookingUp(true);
    setLookupResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('admin-user-roles', {
        body: { action: 'lookup', email },
      });

      if (error) {
        throw error;
      }

      if (!data?.user) {
        toast({ title: 'No user found', description: 'No user was found for that email address.' });
        return;
      }

      setLookupResult({
        userId: data.user.id,
        email: data.user.email,
        roles: (data.user.roles ?? []) as AppRole[],
      });
    } catch (err: any) {
      const message = err?.message || 'Failed to look up user';
      toast({ title: 'Lookup failed', description: message, variant: 'destructive' });
    } finally {
      setIsLookingUp(false);
    }
  };

  const requireAuditNoteOrWarn = (): string | null => {
    const note = auditNote.trim();
    if (!note) {
      toast({
        title: 'Audit note is required',
        description: 'Please provide a short note describing this change.',
        variant: 'destructive',
      });
      return null;
    }
    return note;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-lavender/20 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">
            Admin Console
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage user roles, vendor applications, and other administrative tasks.
          </p>
        </div>

        <div className="rounded-md border border-coral/30 bg-coral/5 px-4 py-2 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>
            This admin console is scoped to the{' '}
            <span className="font-semibold text-foreground">Thittam1Hub</span> organization.
          </span>
          <div className="flex gap-2 flex-wrap">
            <Button asChild size="sm" variant="outline">
              <Link to="/console/admin/roles-diagram">View role model & access matrix</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/thittam1hub/dashboard">Back to Thittam1Hub dashboard</Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="roles">User Roles</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-6">
        <Card className="shadow-soft border-coral/20 bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-col gap-4">
            <CardTitle className="text-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span>Assign Roles to Users</span>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Input
                  placeholder="Paste user UUID..."
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="sm:max-w-xs font-mono text-xs"
                />
                <Select value={newRole} onValueChange={(value: AppRole) => setNewRole(value)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="organizer">Organizer</SelectItem>
                    <SelectItem value="participant">Participant</SelectItem>
                    <SelectItem value="judge">Judge</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="speaker">Speaker</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddRole} disabled={addRoleMutation.isPending} className="whitespace-nowrap">
                  {addRoleMutation.isPending ? 'Adding…' : 'Add Role'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This interface talks directly to the <code className="font-mono text-xs">user_roles</code> table using the
                  secure Supabase client and Row Level Security.
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Audit note for role changes</label>
                  <Textarea
                    placeholder="Explain why you are changing this user's roles (required for all changes)..."
                    value={auditNote}
                    onChange={(e) => setAuditNote(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    These notes are logged with each change to support future audits.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">Lookup user by email</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                  />
                  <Button onClick={handleLookupByEmail} disabled={isLookingUp} className="whitespace-nowrap">
                    {isLookingUp ? 'Looking up…' : 'Lookup'}
                  </Button>
                </div>
                {lookupResult && (
                  <div className="rounded-lg border border-border bg-background/60 p-3 space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">Email:</span> {lookupResult.email}
                    </div>
                    <div className="break-all">
                      <span className="font-semibold">User UUID:</span>{' '}
                      <button
                        type="button"
                        className="font-mono text-xs underline decoration-dotted underline-offset-4"
                        onClick={() => setNewUserId(lookupResult.userId)}
                      >
                        {lookupResult.userId}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="font-semibold mr-1">Current roles:</span>
                      {lookupResult.roles.length ? (
                        lookupResult.roles.map((role) => (
                          <Badge key={role} variant={role === 'admin' ? 'default' : 'outline'}>
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No roles</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Filter by user ID or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:max-w-xs"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral" />
              </div>
            ) : !groupedUsers.length ? (
              <div className="text-center py-12 text-muted-foreground">
                No role assignments found.
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-white/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Current Roles</TableHead>
                      <TableHead>Primary Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedUsers.map(({ userId, roles }) => {
                      const primaryRole = roles[0] ?? 'participant';

                      const handlePrimaryChange = (value: AppRole) => {
                        const note = requireAuditNoteOrWarn();
                        if (!note) return;

                        updatePrimaryRoleMutation.mutate({
                          userId,
                          primaryRole: value,
                          currentRoles: roles,
                          note,
                          actorId: user?.id,
                        });
                      };

                      const handleRemoveRoleClick = (role: AppRole) => {
                        const note = requireAuditNoteOrWarn();
                        if (!note) return;

                        removeRoleMutation.mutate({
                          userId,
                          role,
                          note,
                          actorId: user?.id,
                        });
                      };

                      return (
                        <TableRow key={userId}>
                          <TableCell>
                            <div className="font-mono text-xs break-all">{userId}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {roles.map((role) => (
                                <Badge key={role} variant={role === 'admin' ? 'default' : 'outline'}>
                                  {role}
                                </Badge>
                              ))}
                              {!roles.length && (
                                <span className="text-xs text-muted-foreground">No roles</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select defaultValue={primaryRole} onValueChange={handlePrimaryChange}>
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select primary" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="organizer">Organizer</SelectItem>
                                <SelectItem value="participant">Participant</SelectItem>
                                <SelectItem value="judge">Judge</SelectItem>
                                <SelectItem value="volunteer">Volunteer</SelectItem>
                                <SelectItem value="speaker">Speaker</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {roles.map((role) => (
                                <Button
                                  key={role}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveRoleClick(role)}
                                  disabled={removeRoleMutation.isPending}
                                >
                                  Remove {role}
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6">
            <VendorApprovalPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminUserRolesPage;
