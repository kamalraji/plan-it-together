import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from './AdminUserRolesPage';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrganizations } from '@/hooks/useOrganization';
import { Link } from 'react-router-dom';

interface PendingOrganizer {
  userId: string;
  email: string;
  name?: string | null;
  firstOrganizationId: string | null;
  firstOrganizationName: string | null;
  requestedAt: string | null;
}

export const PendingOrganizersAdminPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: myOrganizations, isLoading: orgsLoading } = useMyOrganizations();

  const { data, isLoading } = useQuery<PendingOrganizer[]>({
    queryKey: ['pending-organizers'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('pending-organizers');
      if (error) throw error;
      return (data as { organizers: PendingOrganizer[] }).organizers;
    },
  });

  useEffect(() => {
    if (!user || user.role !== 'SUPER_ADMIN') return;
    if (orgsLoading) return;

    const isThittamAdmin = myOrganizations?.some((org: any) => org.slug === 'thittam1hub');
    if (!isThittamAdmin) {
      window.location.href = '/dashboard';
    }
  }, [user, myOrganizations, orgsLoading]);

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.functions.invoke('approve-organizer', {
        body: { userId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-organizers'] });
      toast({ title: 'Organizer approved', description: 'Organizer has been granted moderator access.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to approve', description: error?.message || 'Please try again.', variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Minimal rejection: clear onboarding_checklist entries so they drop from the pending list
      const { error } = await supabase.functions.invoke('approve-organizer', {
        body: { userId, reject: true as unknown as AppRole },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-organizers'] });
      toast({ title: 'Organizer rejected', description: 'Onboarding entries removed.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to reject', description: error?.message || 'Please try again.', variant: 'destructive' });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-lavender/20 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">
            Pending Organizer Signups
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Review organizer candidates sourced from onboarding activity and approve or reject access.
          </p>
        </div>

        <div className="rounded-md border border-coral/30 bg-coral/5 px-4 py-2 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>
            This admin console is scoped to the{' '}
            <span className="font-semibold text-foreground">Thittam1Hub</span> organization.
          </span>
          <Button asChild size="sm" variant="outline">
            <Link to="/thittam1hub/dashboard">Back to Thittam1Hub dashboard</Link>
          </Button>
        </div>

        <Card className="shadow-soft border-coral/20 bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Organizer Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral" />
              </div>
            ) : !data || data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No pending organizer signups found.
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Requested At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((org) => (
                      <TableRow key={org.userId}>
                        <TableCell>
                          <div className="font-medium">{org.name || '—'}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{org.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {org.requestedAt ? new Date(org.requestedAt).toLocaleString() : '—'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(org.userId)}
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMutation.mutate(org.userId)}
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
