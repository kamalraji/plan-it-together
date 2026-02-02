import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { useAuth } from '@/hooks/useAuth';
import { Enums } from '@/integrations/supabase/types';

/**
 * EventRegistrationsOverviewPage
 *
 * Functional overview of registrations across events, with basic
 * filtering, pagination, and links back to event detail pages.
 */
export const EventRegistrationsOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const pageSize = 10;

  useEffect(() => {
    document.title = 'Event Registrations Overview | Thittam1Hub';

    const description =
      'Review and manage registrations across your events, including waitlists and participant status.';

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
    canonical.setAttribute('href', window.location.href);
  }, []);

  // Sync filters/pagination to URL for shareable views
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (statusFilter === 'all') {
      params.delete('status');
    } else {
      params.set('status', statusFilter);
    }
    params.set('page', String(page));
    navigate({ search: params.toString() }, { replace: true });
  }, [statusFilter, page, location.search, navigate]);

  const canViewRegistrations = user?.role === 'SUPER_ADMIN' || user?.role === 'ORGANIZER';

  type RegistrationRow = {
    id: string;
    event_id: string;
    user_id: string;
    status: Enums<'registration_status'>;
    created_at: string;
    events: {
      name: string;
      start_date: string | null;
    } | null;
  };

  // For non-admins, we need to filter registrations to only events they can access
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const { data, isLoading } = useQuery<{ rows: RegistrationRow[]; total: number }>(
    {
      queryKey: ['event-registrations-overview', statusFilter, page, pageSize, user?.id, isAdmin],
      queryFn: async () => {
        if (!user?.id) {
          return { rows: [], total: 0 };
        }

        // Admins can see all registrations; organizers need scoped access
        if (!isAdmin) {
          // Step 1: Get user's organization IDs
          const { data: memberships } = await supabase
            .from('organization_memberships')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE');

          const userOrgIds = (memberships ?? []).map((m: { organization_id: string }) => m.organization_id);

          // Step 2: Get event IDs the user can access (owner or org member)
          let eventsQuery = supabase.from('events').select('id');
          
          if (userOrgIds.length > 0) {
            eventsQuery = eventsQuery.or(`owner_id.eq.${user.id},organization_id.in.(${userOrgIds.join(',')})`);
          } else {
            eventsQuery = eventsQuery.eq('owner_id', user.id);
          }

          const { data: accessibleEvents } = await eventsQuery;
          const accessibleEventIds = (accessibleEvents ?? []).map((e: { id: string }) => e.id);

          if (accessibleEventIds.length === 0) {
            return { rows: [], total: 0 };
          }

          // Step 3: Query registrations filtered to accessible events
          let query = supabase
            .from('registrations')
            .select('id, event_id, user_id, status, created_at, events(name, start_date)', {
              count: 'exact',
            })
            .in('event_id', accessibleEventIds)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

          if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter as Enums<'registration_status'>);
          }

          const { data: rows, error, count } = await query;

          if (error) {
            throw error;
          }

          return {
            rows: (rows ?? []) as RegistrationRow[],
            total: count ?? 0,
          };
        }

        // Admin path: query all registrations
        let query = supabase
          .from('registrations')
          .select('id, event_id, user_id, status, created_at, events(name, start_date)', {
            count: 'exact',
          })
          .order('created_at', { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter as Enums<'registration_status'>);
        }

        const { data: rows, error, count } = await query;

        if (error) {
          throw error;
        }

        return {
          rows: (rows ?? []) as RegistrationRow[],
          total: count ?? 0,
        };
      },
      enabled: canViewRegistrations && !!user?.id,
    },
  );

  const totalPages = useMemo(() => {
    if (!data) return 1;
    const typed = data as { total: number };
    return Math.max(1, Math.ceil(typed.total / pageSize));
  }, [data, pageSize]);

  if (!canViewRegistrations) {
    return (
      <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl mx-auto">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Event Registrations Overview</h1>
        </header>
        <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">
            You need organizer or admin access to view registrations across events.
          </p>
        </section>
      </main>
    );
  }

  const typedData = (data || { rows: [], total: 0 }) as { rows: RegistrationRow[]; total: number };

  const fromIndex = typedData.rows.length ? (page - 1) * pageSize + 1 : 0;
  const toIndex = (page - 1) * pageSize + typedData.rows.length;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto">
      <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Event Registrations Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Track registrations across your events, filter by status, and jump directly into event
            detail pages.
          </p>
        </div>
      </header>

      <section className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-muted-foreground">Status:</span>
          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            {['all', 'PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setPage(1);
                  setStatusFilter(value);
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-colors ${
                  statusFilter === value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {value === 'all' ? 'All' : value}
              </button>
            ))}
          </div>
        </div>

        {data && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing {fromIndex}–{toIndex} of {typedData.total} registrations
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Event
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Registered At
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {isLoading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 sm:px-6 py-6 text-center text-sm text-muted-foreground"
                  >
                    Loading registrations...
                  </td>
                </tr>
              )}

              {!isLoading && typedData.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 sm:px-6 py-6 text-center text-sm text-muted-foreground"
                  >
                    No registrations found for the selected filters.
                  </td>
                </tr>
              )}

              {!isLoading &&
                typedData.rows.map((reg: RegistrationRow) => (
                  <tr key={reg.id} className="hover:bg-muted/60">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {reg.events?.name ?? 'Unknown event'}
                        </span>
                        {reg.events?.start_date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(reg.events.start_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-full bg-primary/10 text-primary">
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                      {new Date(reg.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm">
                      <Link
                        to={`/dashboard/eventmanagement/${reg.event_id}`}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        View event
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {typedData.total > pageSize && (
          <div className="flex items-center justify_between border-t border-border px-4 sm:px-6 py-3 text-xs sm:text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default EventRegistrationsOverviewPage;
