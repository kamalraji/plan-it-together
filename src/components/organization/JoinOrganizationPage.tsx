import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchOrganizations, useMyOrganizationMemberships, useRequestJoinOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Types re-used from OrganizationDirectory for consistency
export type JoinOrganizationCategory = 'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT';

export interface JoinOrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'ORGANIZER' | 'VIEWER';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED';
}

export const JoinOrganizationPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: organizations, isLoading, error } = useSearchOrganizations({
    query: debouncedQuery.trim() || undefined,
    limit: 50,
    offset: 0,
  });

  const { data: memberships, isLoading: loadingMemberships } = useMyOrganizationMemberships();

  const [requestingOrgId, setRequestingOrgId] = useState<string | null>(null);
  const requestJoin = useRequestJoinOrganization();
 
  const handleRequestJoin = (organization: any) => {
    setJoinError(null);
    setRequestingOrgId(organization.id);
    requestJoin.mutate(organization.id, {
      onSuccess: () => {
        navigate('/dashboard/organizations/join/success', {
          state: { organizationName: organization.name },
        });
      },
      onError: (error: any) => {
        const message =
          (error as any)?.message ||
          (error as any)?.data?.message ||
          'Failed to send join request. Please try again.';
        setJoinError(message);
      },
      onSettled: () => setRequestingOrgId(null),
    });
  };

  const getMembershipForOrg = useMemo(
    () =>
      (orgId: string) =>
        memberships?.find((m: any) => m.organization_id === orgId) ?? null,
    [memberships],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
            Organizations
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Join an Organization
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Search for your college, company, or community. Request to join an existing
            organization or create a new one if it doesn&apos;t exist yet.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="border-border/70 bg-card/90 backdrop-blur">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg">Find your organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search by name</Label>
                <Input
                  id="search"
                  placeholder="e.g. Anna University, Google Developer Group"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="min-h-[160px]">
                {isLoading || loadingMemberships ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 rounded-full border-b-2 border-primary animate-spin" />
                  </div>
                ) : error ? (
                  <p className="text-sm text-destructive">
                    Failed to load organizations. Please try again.
                  </p>
                ) : !organizations || organizations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No organizations found. Try a different search term or create a new
                    organization.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {organizations.map((org: any) => {
                      const membership = getMembershipForOrg(org.id);
                      const isActive = membership?.status === 'ACTIVE';
                      const isPending = membership?.status === 'PENDING';

                      return (
                        <div
                          key={org.id}
                          className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-3 sm:px-4 sm:py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {org.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {org.category} • {org.slug}
                            </p>
                          </div>

                          <div className="ml-3 flex flex-col items-end gap-1">
                            {isActive ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
                                Joined
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500">
                                Pending approval
                              </span>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRequestJoin(org)}
                                  disabled={requestingOrgId === org.id || requestJoin.isPending}
                                >
                                  {requestingOrgId === org.id
                                    ? 'Requesting...'
                                    : 'Request to join'}
                                </Button>
                                {joinError && (
                                  <p className="max-w-xs text-right text-[11px] text-destructive">
                                    {joinError}
                                  </p>
                                )}
                              </>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-border/70 bg-card/80 backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base sm:text-lg">Can&apos;t find it?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                If your organization isn&apos;t listed yet, you can create it and request
                verification. Our team will review and approve new organizations.
              </p>
              <Button
                className="w-full"
                onClick={() => navigate('/organizations/create')}
              >
                Create new organization
              </Button>
              <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                New organizations start in a pending state. Platform admins will
                review your request and may contact you for additional verification
                details before approving.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default JoinOrganizationPage;
