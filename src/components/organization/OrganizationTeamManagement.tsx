import React, { useState } from 'react';
import { useCurrentOrganization } from './OrganizationContext';
import {
  useOrganizationMemberships,
  useUpdateMembershipStatus,
} from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';

export const OrganizationTeamManagement: React.FC = () => {
  const organization = useCurrentOrganization();
  const { data: activeMembers, isLoading: loadingActive } = useOrganizationMemberships(organization?.id || '', 'ACTIVE');
  const { data: pendingMembers, isLoading: loadingPending } = useOrganizationMemberships(organization?.id || '', 'PENDING');
  const updateMembership = useUpdateMembershipStatus(organization?.id || '');
  const { toast } = useToast();

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
      // In a real implementation, you'd need to look up the user by email first
      // For now, we'll show a message
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
    if (window.confirm('Are you sure you want to remove this team member?')) {
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
     <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Active Members ({activeMembers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {activeMembers && activeMembers.length > 0 ? (
            <ul className="divide-y">
              {activeMembers.map((member: any) => (
                <li key={member.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{member.user_id}</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Pending Join Requests ({pendingMembers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingMembers && pendingMembers.length > 0 ? (
            <ul className="divide-y">
              {pendingMembers.map((member: any) => (
                <li key={member.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{member.user_id}</p>
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
    </div>
  );
};

