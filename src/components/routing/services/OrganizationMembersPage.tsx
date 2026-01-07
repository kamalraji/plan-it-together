import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCurrentOrganization } from '@/components/organization/OrganizationContext';
import { useMyOrganizationMemberships } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Crown, 
  Check, 
  X, 
  Mail, 
  BarChart3, 
  Settings2,
  ArrowLeft,
  Clock,
  TrendingUp
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
  const { toast } = useToast();
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);

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

  useEffect(() => {
    const loadPendingOrganizers = async () => {
      if (!canManage || !organization?.id) return;
      setIsLoadingPending(true);
      setPendingError(null);
      try {
        const { data, error } = await supabase.functions.invoke('pending-organizers');
        if (error) throw error;
        const all = (data as any)?.organizers ?? [];
        const filtered = all.filter(
          (o: any) => !organization.id || o.firstOrganizationId === organization.id
        );
        setPendingOrganizers(filtered);
      } catch (err: any) {
        console.error('Failed to load pending organizers', err);
        setPendingError(err?.message || 'Failed to load pending organizer requests.');
      } finally {
        setIsLoadingPending(false);
      }
    };

    loadPendingOrganizers();
  }, [canManage, organization?.id]);

  const handleApprove = async (req: any) => {
    try {
      const { error } = await supabase.functions.invoke('approve-organizer', {
        body: { userId: req.userId, organizationId: organization?.id },
      });
      if (error) throw error;
      setPendingOrganizers((prev) => prev.filter((p) => p.userId !== req.userId));
      toast({
        title: 'Organizer approved',
        description: 'The user now has organizer access.',
      });
    } catch (err: any) {
      console.error('Failed to approve organizer', err);
      toast({
        title: 'Failed to approve organizer',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeny = (userId: string) => {
    setPendingOrganizers((prev) => prev.filter((p) => p.userId !== userId));
  };

  // Loading state
  if (membershipsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
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

  // Mock stats - replace with real data
  const stats = [
    { label: 'Total Members', value: 15, icon: Users, color: 'text-primary' },
    { label: 'Owners', value: 1, icon: Crown, color: 'text-amber-500' },
    { label: 'Admins', value: 3, icon: Shield, color: 'text-blue-500' },
    { label: 'Pending', value: pendingOrganizers.length, icon: Clock, color: 'text-orange-500' },
  ];

  const quickActions = [
    {
      icon: Mail,
      title: 'Bulk Invite',
      description: 'Invite multiple members via CSV',
      onClick: () => toast({ title: 'Coming soon', description: 'Bulk invite feature is in development.' }),
    },
    {
      icon: BarChart3,
      title: 'Activity Report',
      description: 'View member engagement metrics',
      onClick: () => toast({ title: 'Coming soon', description: 'Reports feature is in development.' }),
    },
    {
      icon: Settings2,
      title: 'Role Settings',
      description: 'Configure role permissions',
      onClick: () => toast({ title: 'Coming soon', description: 'Role settings is in development.' }),
    },
  ];

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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Organizer Requests */}
      {(pendingError || isLoadingPending || pendingOrganizers.length > 0) && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Pending Requests
                </CardTitle>
                <CardDescription>Organizer access requests awaiting approval</CardDescription>
              </div>
              {isLoadingPending && (
                <Badge variant="secondary" className="animate-pulse">Loading...</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
                {pendingError}
              </div>
            )}
            {pendingOrganizers.length === 0 && !isLoadingPending ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrganizers.map((req) => (
                  <div
                    key={req.userId}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {req.name || req.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {req.email}
                          {req.requestedAt && ` • ${new Date(req.requestedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleApprove(req)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeny(req.userId)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.onClick}
                className="w-full text-left p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{action.title}</h4>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Member List Placeholder */}
        <Card className="lg:col-span-2 border-border">
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
      </div>

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
