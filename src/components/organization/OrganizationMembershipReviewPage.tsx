import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOrganizationMemberships, useUpdateMembershipStatus } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PAGE_SIZE = 10;

export const OrganizationMembershipReviewPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED' | 'ALL'>('PENDING');
  const [page, setPage] = useState(1);

  const { data: memberships, isLoading, error } = useOrganizationMemberships(
    organizationId || '',
    statusFilter === 'ALL' ? undefined : statusFilter,
  );

  const updateStatus = useUpdateMembershipStatus(organizationId || '');

  const pagedMemberships = useMemo(() => {
    const list = memberships || [];
    const start = (page - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [memberships, page]);

  const totalPages = useMemo(() => {
    const total = memberships?.length || 0;
    return total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;
  }, [memberships]);

  const handleStatusChange = (membershipId: string, status: 'ACTIVE' | 'REJECTED') => {
    updateStatus.mutate({ membershipId, status });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
            Organization memberships
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Review join requests
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Approve or reject membership requests for this organization. Only owners and admins can
            manage membership status.
          </p>
        </header>

        <Card className="border-border/70 bg-card/90 backdrop-blur">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">
              Pending and recent membership changes
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status filter</span>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as any);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="REMOVED">Removed</SelectItem>
                  <SelectItem value="ALL">All statuses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 rounded-full border-b-2 border-primary animate-spin" />
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">
                Failed to load membership requests. Please try again.
              </p>
            ) : !memberships || memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No membership records found for this organization yet.
              </p>
            ) : (
              <div className="space-y-2">
                {pagedMemberships.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/40 px-3 py-3 sm:px-4 sm:py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {m.user_id}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Role: {m.role} • Status: {m.status}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateStatus.isPending}
                            onClick={() => handleStatusChange(m.id, 'ACTIVE')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={updateStatus.isPending}
                            onClick={() => handleStatusChange(m.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {memberships && memberships.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationMembershipReviewPage;
