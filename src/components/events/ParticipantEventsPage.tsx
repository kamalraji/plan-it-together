import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { Event, EventMode, EventStatus } from '@/types';

interface SupabaseEventRow {
  id: string;
  name: string;
  description?: string | null;
  mode: string;
  start_date: string | null;
  end_date: string | null;
  capacity?: number | null;
  visibility?: string | null;
  status?: string | null;
}

function mapRowToEvent(row: SupabaseEventRow): Event | null {
  if (!row.start_date || !row.end_date) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    mode: (row.mode as EventMode) || EventMode.OFFLINE,
    startDate: row.start_date,
    endDate: row.end_date,
    capacity: row.capacity ?? undefined,
    registrationDeadline: undefined,
    organizerId: '',
    visibility: (row.visibility as any) ?? 'PUBLIC',
    branding: {},
    status: (row.status as EventStatus) || EventStatus.PUBLISHED,
    landingPageUrl: `/events/${row.id}`,
    timeline: [],
    agenda: [],
    prizes: [],
    sponsors: [],
    organizationId: undefined,
    inviteLink: undefined,
    venue: undefined,
    virtualLinks: undefined,
    organization: undefined,
    createdAt: '',
    updatedAt: '',
  };
}

type DateFilter = 'ALL' | 'UPCOMING' | 'PAST';

export function ParticipantEventsPage() {
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');
  const [modeFilter, setModeFilter] = useState<EventMode | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');

  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['participant-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, description, mode, start_date, end_date, capacity, visibility, status')
        .order('start_date', { ascending: true });

      if (error) throw error;

      const mapped = (data as SupabaseEventRow[]).map(mapRowToEvent).filter(Boolean) as Event[];
      return mapped;
    },
  });

  useEffect(() => {
    document.title = 'Browse Events | Thittam1Hub';

    const description = 'Browse upcoming and past events with filters for date, type, and status.';

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
    canonical.setAttribute('href', window.location.origin + '/events');
  }, []);

  const now = new Date().getTime();

  const filteredEvents = (events || []).filter((event) => {
    const startTime = new Date(event.startDate).getTime();

    const matchesDate =
      dateFilter === 'ALL' ||
      (dateFilter === 'UPCOMING' && startTime >= now) ||
      (dateFilter === 'PAST' && startTime < now);

    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
    const matchesMode = modeFilter === 'ALL' || event.mode === modeFilter;

    return matchesDate && matchesStatus && matchesMode;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Explore Events</h1>
            <p className="text-muted-foreground mt-2">
              Browse all upcoming and past events. Use filters to quickly find what interests you.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-primary hover:text-primary/80"
          >
            ← Back to dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="block w-full border-input rounded-md text-sm shadow-sm focus:ring-primary focus:border-primary bg-background/80"
              >
                <option value="ALL">All dates</option>
                <option value="UPCOMING">Upcoming only</option>
                <option value="PAST">Past only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="block w-full border-input rounded-md text-sm shadow-sm focus:ring-primary focus:border-primary bg-background/80"
              >
                <option value="ALL">All statuses</option>
                <option value={EventStatus.PUBLISHED}>Published</option>
                <option value={EventStatus.ONGOING}>Ongoing</option>
                <option value={EventStatus.COMPLETED}>Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as any)}
                className="block w-full border-input rounded-md text-sm shadow-sm focus:ring-primary focus:border-primary bg-background/80"
              >
                <option value="ALL">All types</option>
                <option value={EventMode.ONLINE}>Online</option>
                <option value={EventMode.OFFLINE}>In person</option>
                <option value={EventMode.HYBRID}>Hybrid</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mt-2 md:mt-0">
            Showing <span className="font-medium">{filteredEvents.length}</span> event
            {filteredEvents.length === 1 ? '' : 's'}
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        )}

        {error && !isLoading && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load events right now. Please try again later.
          </div>
        )}

        {/* Events list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);

            return (
              <div
                key={event.id}
                className="bg-card rounded-lg border border-border p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">{event.name}</h2>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">When</span>
                      <span className="text-foreground text-right">
                        {start.toLocaleDateString()} • {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Until</span>
                      <span className="text-foreground text-right">
                        {end.toLocaleDateString()} • {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="text-foreground">
                        {event.mode === EventMode.ONLINE && 'Online'}
                        {event.mode === EventMode.OFFLINE && 'In person'}
                        {event.mode === EventMode.HYBRID && 'Hybrid'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                  <Link
                    to={`/events/${event.id}`}
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    View details
                  </Link>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    {event.status === EventStatus.ONGOING && 'Ongoing'}
                    {event.status === EventStatus.PUBLISHED && 'Upcoming'}
                    {event.status === EventStatus.COMPLETED && 'Completed'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {!isLoading && filteredEvents.length === 0 && !error && (
          <div className="text-center py-16">
            <h2 className="text-lg font-semibold text-foreground mb-2">No events match your filters</h2>
            <p className="text-muted-foreground mb-4">
              Try changing the date, status, or type filters to see more events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParticipantEventsPage;
