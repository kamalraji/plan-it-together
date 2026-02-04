import React, { useState } from 'react';
import { useCurrentOrganization } from './OrganizationContext';
import {
  useOrganizationAdmins,
  useRemoveOrganizationAdmin,
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
  const { data: admins, isLoading } = useOrganizationAdmins(organization?.id);
  const removeAdmin = useRemoveOrganizationAdmin(organization?.id);
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

  const handleRemoveAdmin = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      await removeAdmin.mutateAsync(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
          <p className="text-muted-foreground">
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
          <CardTitle>Team Members ({admins?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {admins && admins.length > 0 ? (
            <ul className="divide-y">
              {admins.map((admin: any) => (
                <li key={admin.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{admin.user_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {admin.role || 'Admin'} • Added {new Date(admin.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAdmin(admin.user_id)}
                  >
                    <TrashIcon className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No team members yet. Invite someone to get started!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
