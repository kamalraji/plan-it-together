import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCurrentOrganization } from '@/components/organization/OrganizationContext';
import { useMyOrganizationMemberships } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings2,
  ArrowLeft
} from 'lucide-react';

/**
 * OrganizationMembersPage - Modern member management interface
 * Uses org-scoped routing (/:orgSlug/organizations/members)
 */
export const OrganizationMembersPage: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const organization = useCurrentOrganization();
  const { user } = useAuth();
  const { data: memberships, isLoading: membershipsLoading } = useMyOrganizationMemberships();

  // Get user's role in this organization
  const activeMembership = useMemo(() => {
    if (!memberships || !organization) return null;
    return memberships.find(
      (m: any) => m.organization_id === organization.id && m.status === 'ACTIVE'
    );
  }, [memberships, organization]);

  const userRole = activeMembership?.role?.toLowerCase() || null;
  const isOwner = organization?.owner_id === user?.id;
  const canManage = isOwner || userRole === 'admin' || userRole === 'organizer';

  // Loading state
  if (membershipsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  // Organization not found
  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Organization Not Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          The organization you're looking for doesn't exist or you don't have access.
        </p>
        <Button asChild variant="outline">
          <Link to={`/${orgSlug}/organizations/list`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizations
          </Link>
        </Button>
      </div>
    );
  }

  // Access denied
  if (!canManage || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          You don't have permission to manage members for this organization.
        </p>
        <Button asChild variant="outline">
          <Link to={`/${orgSlug}/dashboard`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border p-6 md:p-8">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Member Management
                  </h1>
                  <p className="text-muted-foreground">
                    {organization.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to={`/${orgSlug}/settings`}>
                  <Settings2 className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Card */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Team Members
              </CardTitle>
              <CardDescription>Manage your organization's team</CardDescription>
            </div>
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="font-medium text-foreground mb-2">Member List</h3>
            <p className="text-sm max-w-sm mx-auto">
              Team member management is integrated with the organization admin panel. 
              Use the invite button above to add new members.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Member Management Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-1">Role Assignment</h4>
              <p className="text-muted-foreground">
                Assign roles based on responsibilities. Owners have full access, Admins can manage
                events and members, Members have basic access.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Regular Reviews</h4>
              <p className="text-muted-foreground">
                Regularly review member access and remove inactive members to maintain security and
                organization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationMembersPage;
