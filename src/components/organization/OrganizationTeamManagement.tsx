import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCurrentOrganization } from './OrganizationContext';
import {
  useOrganizationMemberships,
  useUpdateMembershipStatus,
} from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';
import { OrgPageWrapper } from '@/components/organization/OrgPageWrapper';
import { ConfirmationDialog, useConfirmation } from '@/components/ui/confirmation-dialog';

import { Users, UserPlus, UserCog, Clock, UserCheck } from 'lucide-react';

const VALID_TABS = ['members', 'invite', 'roles', 'pending'] as const;
type TabValue = typeof VALID_TABS[number];

export const OrganizationTeamManagement: React.FC = () => {
  const organization = useCurrentOrganization();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: activeMembers, isLoading: loadingActive } = useOrganizationMemberships(organization?.id || '', 'ACTIVE');
  const { data: pendingMembers, isLoading: loadingPending } = useOrganizationMemberships(organization?.id || '', 'PENDING');
  const updateMembership = useUpdateMembershipStatus(organization?.id || '');
  const { toast } = useToast();
  const { confirm, dialogProps } = useConfirmation();

  const tabFromUrl = searchParams.get('tab') as TabValue | null;
  const activeTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'members';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Feature coming soon',
        description: 'Team member invitation will be implemented with user lookup',
      });
      setIsDialogOpen(false);
      setNewAdminEmail('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRemoveAdmin = async (membershipId: string) => {
    const confirmed = await confirm({
      title: 'Remove Team Member',
      description: 'Are you sure you want to remove this team member?',
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (confirmed) {
      await updateMembership.mutateAsync({ membershipId, status: 'REMOVED' });
    }
  };

  const isLoading = loadingActive || loadingPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <OrgPageWrapper className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Team Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage admins and team members for {organization?.name}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Invite Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddAdmin} className="w-full">
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="members" className="gap-1.5">
            <UserCheck className="h-3.5 w-3.5 hidden sm:inline" />
            Members
          </TabsTrigger>
          <TabsTrigger value="invite" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5 hidden sm:inline" />
            Invite
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5">
            <UserCog className="h-3.5 w-3.5 hidden sm:inline" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="h-3.5 w-3.5 hidden sm:inline" />
            Pending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Members ({activeMembers?.length || 0})
              </CardTitle>
              <CardDescription>All active team members in your organization</CardDescription>
            </CardHeader>
            <CardContent>
              {activeMembers && activeMembers.length > 0 ? (
                <ul className="divide-y divide-border">
                  {activeMembers.map((member: any) => (
                    <li key={member.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{member.user_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.role} • Joined {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAdmin(member.id)}
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No active members yet. Invite someone to get started!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite Members
              </CardTitle>
              <CardDescription>Send invitations to new team members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-md">
                <Label htmlFor="invite-email">Email Address</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                  <Button onClick={handleAddAdmin}>
                    Send Invite
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  The invited member will receive an email with instructions to join.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Role Management
              </CardTitle>
              <CardDescription>Configure member roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="font-medium text-foreground mb-1">Owner</h4>
                    <p className="text-sm text-muted-foreground">Full access to all organization settings, billing, and member management.</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="font-medium text-foreground mb-1">Admin</h4>
                    <p className="text-sm text-muted-foreground">Can manage events, members, and organization settings.</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="font-medium text-foreground mb-1">Organizer</h4>
                    <p className="text-sm text-muted-foreground">Can create and manage events, workspaces, and registrations.</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="font-medium text-foreground mb-1">Viewer</h4>
                    <p className="text-sm text-muted-foreground">Read-only access to organization data and analytics.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Requests ({pendingMembers?.length || 0})
              </CardTitle>
              <CardDescription>Review and approve join requests</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingMembers && pendingMembers.length > 0 ? (
                <ul className="divide-y divide-border">
                  {pendingMembers.map((member: any) => (
                    <li key={member.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{member.user_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Requested on {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateMembership.mutate({ membershipId: member.id, status: 'ACTIVE' })
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateMembership.mutate({ membershipId: member.id, status: 'REJECTED' })
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No pending join requests at the moment.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ConfirmationDialog {...dialogProps} />
    </OrgPageWrapper>
  );
};
