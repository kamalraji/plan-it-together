import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants, type Easing } from 'framer-motion';
import { 
  CalendarDays, 
  Plus, 
  Users, 
  TrendingUp, 
  Clock, 
  Eye, 
  Edit3, 
  ExternalLink, 
  Layout,
  Search,
  Calendar,
  MoreHorizontal,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useEventManagementPaths } from '@/hooks/useEventManagementPaths';
import { useEventManagementMetrics, DashboardEventRow } from '@/hooks/useEventManagementMetrics';
import { OrgPageWrapper } from '@/components/organization/OrgPageWrapper';
import { useOptionalOrganization } from '@/components/organization/OrganizationContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const easeOut: Easing = [0.0, 0.0, 0.2, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } }
};

const cardHoverVariants: Variants = {
  rest: { scale: 1, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
  hover: { scale: 1.02, boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.15)' }
};

// Status configuration with semantic colors
const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  PUBLISHED: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  DRAFT: { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  ONGOING: { bg: 'bg-sky-500/10', text: 'text-sky-600', dot: 'bg-sky-500' },
  PAST: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  CANCELLED: { bg: 'bg-destructive/10', text: 'text-destructive', dot: 'bg-destructive' },
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, trend, trendUp }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4 }}
    className="relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5"
  >
    <div className="flex items-start justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          trendUp ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
        )}>
          {trend}
        </span>
      )}
    </div>
    <div className="mt-3">
      <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</p>
    </div>
    {/* Decorative gradient */}
    <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl" />
  </motion.div>
);

interface EventCardProps {
  event: DashboardEventRow;
  registrations: number;
  paths: {
    detail: string;
    edit: string;
    pageBuilder: string;
    preview: string;
  };
}

const EventCard: React.FC<EventCardProps> = ({ event, registrations, paths }) => {
  const navigate = useNavigate();
  const status = statusConfig[event.status] ?? statusConfig.DRAFT;
  const isLive = event.status === 'ONGOING';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date set';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <motion.div
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
      className="group relative overflow-hidden rounded-xl border border-border bg-card transition-colors"
    >
      {/* Live indicator bar */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 animate-pulse" />
      )}

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <Link 
              to={paths.detail}
              className="text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
            >
              {event.name}
            </Link>
          </div>
          <Badge variant="secondary" className={cn("shrink-0 gap-1.5", status.bg, status.text)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
            {event.status}
          </Badge>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(event.start_date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {registrations} registrations
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => navigate(paths.detail)}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => navigate(paths.edit)}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </Button>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(paths.preview, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Public Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(paths.pageBuilder)}>
                <Layout className="h-4 w-4 mr-2" />
                Page Builder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};

// Empty state component
const EmptyState: React.FC<{ createPath: string }> = ({ createPath }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl rounded-full" />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg"
        >
          <Sparkles className="h-10 w-10 text-primary-foreground" />
        </motion.div>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
        No events yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Create your first event to get started with managing registrations, building landing pages, and tracking analytics.
      </p>
      <Button onClick={() => navigate(createPath)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create Your First Event
      </Button>
    </motion.div>
  );
};

export const EventServiceDashboard: React.FC = () => {
  const organization = useOptionalOrganization();
  const navigate = useNavigate();
  const [onlyMine, setOnlyMine] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { createPath, listPath, eventDetailPath, eventEditPath } = useEventManagementPaths();

  useEffect(() => {
    document.title = 'Event Management | Thittam1Hub';

    const description =
      'Manage your events, track registrations, and view recent activity in one place.';

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

  const { events, registrationsByEvent } = useEventManagementMetrics(organization?.id, onlyMine);

  // Compute metrics
  const metrics = useMemo(() => {
    const allEvents = events ?? [];
    const totalRegistrations = Object.values(registrationsByEvent ?? {}).reduce((a, b) => a + b, 0);
    const activeEvents = allEvents.filter(e => e.status === 'ONGOING' || e.status === 'PUBLISHED').length;
    const upcomingEvents = allEvents.filter(e => {
      if (!e.start_date) return false;
      return new Date(e.start_date) > new Date();
    }).length;

    return {
      totalEvents: allEvents.length,
      activeEvents,
      upcomingEvents,
      totalRegistrations,
    };
  }, [events, registrationsByEvent]);

  // Filter events by search
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events ?? [];
    const query = searchQuery.toLowerCase();
    return (events ?? []).filter(e => 
      e.name.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

  return (
    <OrgPageWrapper>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 sm:space-y-8"
      >
        {/* Hero Header */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border p-6 sm:p-8">
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Event Management
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                  Create, manage, and analyze your events. Track registrations, build landing pages, and monitor performance.
                </p>
              </div>
              <Button 
                onClick={() => navigate(createPath)} 
                size="lg" 
                className="shrink-0 gap-2 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        </motion.div>

        {/* Metrics Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            icon={<CalendarDays className="h-5 w-5 text-primary" />}
            label="Total Events"
            value={metrics.totalEvents}
          />
          <MetricCard
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            label="Active Events"
            value={metrics.activeEvents}
            trend={metrics.activeEvents > 0 ? "Live" : undefined}
            trendUp={metrics.activeEvents > 0}
          />
          <MetricCard
            icon={<Clock className="h-5 w-5 text-primary" />}
            label="Upcoming"
            value={metrics.upcomingEvents}
          />
          <MetricCard
            icon={<Users className="h-5 w-5 text-primary" />}
            label="Total Registrations"
            value={metrics.totalRegistrations}
          />
        </motion.div>

        {/* Filters Bar */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            {organization?.id && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <Switch
                  id="only-mine-toggle"
                  checked={onlyMine}
                  onCheckedChange={setOnlyMine}
                  className="scale-90"
                />
                <Label htmlFor="only-mine-toggle" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                  My events only
                </Label>
              </div>
            )}
          </div>
          <Link
            to={listPath}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 shrink-0"
          >
            View all events
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Events Grid */}
        <motion.section variants={itemVariants} aria-labelledby="event-service-recent-events-heading">
          <h2 id="event-service-recent-events-heading" className="sr-only">Recent Events</h2>
          
          <AnimatePresence mode="wait">
            {filteredEvents.length === 0 ? (
              <EmptyState createPath={createPath} />
            ) : (
              <motion.div
                key="events-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    registrations={registrationsByEvent?.[event.id] ?? 0}
                    paths={{
                      detail: eventDetailPath(event.id),
                      edit: eventEditPath(event.id),
                      pageBuilder: listPath.replace(/\/list$/, `/${event.id}/page-builder`),
                      preview: `/event/${event.id}`,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Feature Cards */}
        <motion.section 
          variants={itemVariants}
          aria-labelledby="event-service-features-heading" 
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <h2 id="event-service-features-heading" className="sr-only">Features</h2>
          
          {[
            {
              icon: <CalendarDays className="h-5 w-5" />,
              title: "Event Creation",
              description: "Create events with customizable templates, branding, and registration forms."
            },
            {
              icon: <Users className="h-5 w-5" />,
              title: "Registration Management",
              description: "Handle participant registration, waitlists, and communication."
            },
            {
              icon: <TrendingUp className="h-5 w-5" />,
              title: "Analytics & Insights",
              description: "Track event performance, attendance, and participant engagement."
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="group p-5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.section>
      </motion.div>
    </OrgPageWrapper>
  );
};
