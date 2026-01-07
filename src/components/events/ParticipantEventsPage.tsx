import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { Event, EventMode, EventStatus } from '@/types';
import { Calendar, MapPin, Globe, Users, ArrowRight, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

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
  landing_page_slug?: string | null;
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
    landingPageUrl: row.landing_page_slug ? `/e/${row.landing_page_slug}` : `/events/${row.id}`,
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export function ParticipantEventsPage() {
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');
  const [modeFilter, setModeFilter] = useState<EventMode | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['participant-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, description, mode, start_date, end_date, capacity, visibility, status, landing_page_slug')
        .eq('visibility', 'PUBLIC')
        .order('start_date', { ascending: true });

      if (error) throw error;

      const mapped = (data as SupabaseEventRow[]).map(mapRowToEvent).filter(Boolean) as Event[];
      return mapped;
    },
  });

  useEffect(() => {
    document.title = 'Discover Events | Thittam1Hub';

    const description = 'Discover amazing events happening near you and online. Filter by date, type, and status.';

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
    const matchesSearch = !searchQuery || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDate && matchesStatus && matchesMode && matchesSearch;
  });

  const getModeIcon = (mode: EventMode) => {
    switch (mode) {
      case EventMode.ONLINE: return <Globe className="h-4 w-4" />;
      case EventMode.OFFLINE: return <MapPin className="h-4 w-4" />;
      case EventMode.HYBRID: return <Users className="h-4 w-4" />;
    }
  };

  const getModeLabel = (mode: EventMode) => {
    switch (mode) {
      case EventMode.ONLINE: return 'Online';
      case EventMode.OFFLINE: return 'In Person';
      case EventMode.HYBRID: return 'Hybrid';
    }
  };

  const getStatusVariant = (status: EventStatus) => {
    switch (status) {
      case EventStatus.ONGOING: return 'default';
      case EventStatus.PUBLISHED: return 'secondary';
      case EventStatus.COMPLETED: return 'outline';
      default: return 'secondary';
    }
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-b border-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Discover Amazing Events
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
              Find Your Next Experience
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Explore conferences, workshops, meetups, and more happening around you and online.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events by name or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-base rounded-xl border-border/50 bg-background/80 backdrop-blur-sm shadow-lg focus-visible:ring-primary"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Pills */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 mb-8"
        >
          <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg">
            {(['UPCOMING', 'PAST', 'ALL'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  dateFilter === filter
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filter === 'ALL' ? 'All Events' : filter === 'UPCOMING' ? 'Upcoming' : 'Past'}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border hidden sm:block" />

          <div className="flex flex-wrap gap-2">
            {([EventMode.ONLINE, EventMode.OFFLINE, EventMode.HYBRID] as EventMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setModeFilter(modeFilter === mode ? 'ALL' : mode)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all ${
                  modeFilter === mode
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {getModeIcon(mode)}
                {getModeLabel(mode)}
              </button>
            ))}
          </div>

          <div className="ml-auto text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredEvents.length}</span> events found
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-16 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
            <p className="text-destructive font-medium">Unable to load events right now.</p>
            <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
          </div>
        )}

        {/* Events Grid */}
        {!isLoading && !error && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredEvents.map((event) => {
              const startDate = formatEventDate(event.startDate);

              return (
                <motion.div key={event.id} variants={cardVariants}>
                  <Link
                    to={event.landingPageUrl || `/events/${event.id}`}
                    className="group block bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                  >
                    {/* Card Header with Date */}
                    <div className="p-5">
                      <div className="flex gap-4">
                        {/* Date Block */}
                        <div className="flex-shrink-0 w-14 text-center">
                          <div className="bg-primary/10 rounded-lg p-2">
                            <span className="block text-2xl font-bold text-primary">{startDate.day}</span>
                            <span className="block text-xs font-medium text-primary uppercase">{startDate.month}</span>
                          </div>
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {event.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            {getModeIcon(event.mode)}
                            <span>{getModeLabel(event.mode)}</span>
                            <span>•</span>
                            <span>{startDate.time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                        {event.description || 'No description available'}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <Badge variant={getStatusVariant(event.status)}>
                          {event.status === EventStatus.ONGOING && 'Live Now'}
                          {event.status === EventStatus.PUBLISHED && 'Upcoming'}
                          {event.status === EventStatus.COMPLETED && 'Completed'}
                          {event.status === EventStatus.DRAFT && 'Draft'}
                          {event.status === EventStatus.CANCELLED && 'Cancelled'}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          View details
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && filteredEvents.length === 0 && !error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No events found</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery 
                ? `No events match "${searchQuery}". Try a different search term.`
                : 'Try adjusting your filters to discover more events.'}
            </p>
            <button
              onClick={() => {
                setDateFilter('ALL');
                setModeFilter('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ParticipantEventsPage;
