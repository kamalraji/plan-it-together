import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { Event, EventMode, EventStatus, EventCategory } from '@/types';
import { Calendar, MapPin, Globe, Users, ArrowRight, Search, Sparkles, Filter, X, Clock, Zap, Building2, Code, GraduationCap, Presentation, Mic, Briefcase, Trophy, Video, Award, LayoutGrid, BookOpen, Landmark, PartyPopper, Dumbbell, UserCheck, UsersRound, School, MessageSquare, ShieldQuestion, Megaphone, Package, Building, Handshake, Medal, Plane, Network, Store, Rocket, Mountain, PanelTop, Heart, Gift, HandHeart, Leaf, Hand, Music, ImageIcon, Tent, Coffee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { OrganizationsListView } from './OrganizationsListView';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { useSeo } from '@/hooks/useSeo';

interface SupabaseEventRow {
  id: string;
  name: string;
  description?: string | null;
  mode: string;
  category?: string | null;
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
    category: (row.category as EventCategory) || EventCategory.OTHER,
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
    organizationId: null,
    inviteLink: null,
    venue: undefined,
    virtualLinks: undefined,
    organization: undefined,
    createdAt: '',
    updatedAt: '',
  };
}

type DateFilter = 'ALL' | 'PAST';
type ListType = 'events' | 'organizations';

const categoryConfig: Record<EventCategory, { icon: typeof Code; label: string; color: string }> = {
  // Original categories
  [EventCategory.HACKATHON]: { icon: Code, label: 'Hackathon', color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  [EventCategory.BOOTCAMP]: { icon: GraduationCap, label: 'Bootcamp', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  [EventCategory.WORKSHOP]: { icon: Presentation, label: 'Workshop', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  [EventCategory.CONFERENCE]: { icon: Mic, label: 'Conference', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  [EventCategory.MEETUP]: { icon: Users, label: 'Meetup', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  [EventCategory.STARTUP_PITCH]: { icon: Briefcase, label: 'Startup Pitch', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  [EventCategory.HIRING_CHALLENGE]: { icon: Trophy, label: 'Hiring Challenge', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  [EventCategory.WEBINAR]: { icon: Video, label: 'Webinar', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  [EventCategory.COMPETITION]: { icon: Award, label: 'Competition', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  [EventCategory.OTHER]: { icon: LayoutGrid, label: 'Other', color: 'bg-muted-foreground/30/10 text-muted-foreground border-gray-500/20' },
  // College/University
  [EventCategory.SEMINAR]: { icon: BookOpen, label: 'Seminar', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  [EventCategory.SYMPOSIUM]: { icon: Landmark, label: 'Symposium', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  [EventCategory.CULTURAL_FEST]: { icon: PartyPopper, label: 'Cultural Fest', color: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20' },
  [EventCategory.SPORTS_EVENT]: { icon: Dumbbell, label: 'Sports Event', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  [EventCategory.ORIENTATION]: { icon: UserCheck, label: 'Orientation', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  [EventCategory.ALUMNI_MEET]: { icon: UsersRound, label: 'Alumni Meet', color: 'bg-lime-500/10 text-lime-600 border-lime-500/20' },
  [EventCategory.CAREER_FAIR]: { icon: School, label: 'Career Fair', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  [EventCategory.LECTURE]: { icon: MessageSquare, label: 'Lecture', color: 'bg-slate-500/10 text-muted-foreground border-slate-500/20' },
  [EventCategory.QUIZ]: { icon: ShieldQuestion, label: 'Quiz', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  [EventCategory.DEBATE]: { icon: Megaphone, label: 'Debate', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  // Company
  [EventCategory.PRODUCT_LAUNCH]: { icon: Package, label: 'Product Launch', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  [EventCategory.TOWN_HALL]: { icon: Building, label: 'Town Hall', color: 'bg-stone-500/10 text-stone-600 border-stone-500/20' },
  [EventCategory.TEAM_BUILDING]: { icon: Handshake, label: 'Team Building', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  [EventCategory.TRAINING]: { icon: GraduationCap, label: 'Training', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  [EventCategory.AWARDS_CEREMONY]: { icon: Medal, label: 'Awards Ceremony', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  [EventCategory.OFFSITE]: { icon: Plane, label: 'Offsite', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  [EventCategory.NETWORKING]: { icon: Network, label: 'Networking', color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  // Industry
  [EventCategory.TRADE_SHOW]: { icon: Store, label: 'Trade Show', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  [EventCategory.EXPO]: { icon: Building2, label: 'Expo', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  [EventCategory.SUMMIT]: { icon: Mountain, label: 'Summit', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  [EventCategory.PANEL_DISCUSSION]: { icon: PanelTop, label: 'Panel Discussion', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  [EventCategory.DEMO_DAY]: { icon: Rocket, label: 'Demo Day', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  // Non-Profit
  [EventCategory.FUNDRAISER]: { icon: Heart, label: 'Fundraiser', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  [EventCategory.GALA]: { icon: Gift, label: 'Gala', color: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20' },
  [EventCategory.CHARITY_EVENT]: { icon: HandHeart, label: 'Charity Event', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  [EventCategory.VOLUNTEER_DRIVE]: { icon: Hand, label: 'Volunteer Drive', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  [EventCategory.AWARENESS_CAMPAIGN]: { icon: Leaf, label: 'Awareness Campaign', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  // General
  [EventCategory.CONCERT]: { icon: Music, label: 'Concert', color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  [EventCategory.EXHIBITION]: { icon: ImageIcon, label: 'Exhibition', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  [EventCategory.FESTIVAL]: { icon: Tent, label: 'Festival', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  [EventCategory.SOCIAL_GATHERING]: { icon: Coffee, label: 'Social Gathering', color: 'bg-stone-500/10 text-stone-600 border-stone-500/20' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
  }
};

export function ParticipantEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const listType = (searchParams.get('list') as ListType) || 'events';
  
  const [modeFilter, setModeFilter] = useState<EventMode | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const setListType = (type: ListType) => {
    setSearchParams({ list: type });
  };

  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['participant-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, description, mode, category, start_date, end_date, capacity, visibility, status, landing_page_slug')
        .eq('visibility', 'PUBLIC')
        .eq('status', 'PUBLISHED')
        .order('start_date', { ascending: false });

      if (error) throw error;

      const mapped = (data as SupabaseEventRow[]).map(mapRowToEvent).filter(Boolean) as Event[];
      return mapped;
    },
  });

  useSeo({
    title: 'Discover Events | Thittam1Hub',
    description: 'Discover amazing events happening near you and online. Filter by date, type, and status.',
    canonicalPath: '/events',
  });

  const now = new Date().getTime();

  const filteredEvents = (events || []).filter((event) => {
    const startTime = new Date(event.startDate).getTime();

    const matchesDate =
      dateFilter === 'ALL' ||
      (dateFilter === 'PAST' && startTime < now);

    const matchesMode = modeFilter === 'ALL' || event.mode === modeFilter;
    const matchesCategory = categoryFilter === 'ALL' || event.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDate && matchesMode && matchesCategory && matchesSearch;
  });

  const activeFiltersCount = [
    modeFilter !== 'ALL',
    categoryFilter !== 'ALL',
    dateFilter !== 'ALL'
  ].filter(Boolean).length;

  const getModeIcon = (mode: EventMode, size = 4) => {
    const className = `h-${size} w-${size}`;
    switch (mode) {
      case EventMode.ONLINE: return <Globe className={className} />;
      case EventMode.OFFLINE: return <MapPin className={className} />;
      case EventMode.HYBRID: return <Users className={className} />;
    }
  };

  const getModeLabel = (mode: EventMode) => {
    switch (mode) {
      case EventMode.ONLINE: return 'Online';
      case EventMode.OFFLINE: return 'In Person';
      case EventMode.HYBRID: return 'Hybrid';
    }
  };

  const getStatusConfig = (status: EventStatus) => {
    switch (status) {
      case EventStatus.ONGOING: 
        return { label: 'Live Now', variant: 'default' as const, icon: <Zap className="h-3 w-3" /> };
      case EventStatus.PUBLISHED: 
        return { label: 'Upcoming', variant: 'secondary' as const, icon: <Clock className="h-3 w-3" /> };
      case EventStatus.COMPLETED: 
        return { label: 'Completed', variant: 'outline' as const, icon: null };
      default: 
        return { label: status, variant: 'secondary' as const, icon: null };
    }
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      year: date.getFullYear(),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  const clearFilters = () => {
    setDateFilter('ALL');
    setModeFilter('ALL');
    setCategoryFilter('ALL');
    setSearchQuery('');
  };

  const FilterPills = () => (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Date Filter Tabs */}
      <div className="flex items-center p-1 bg-muted/60 rounded-xl backdrop-blur-sm">
        {(['ALL', 'PAST'] as DateFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setDateFilter(filter)}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
              dateFilter === filter
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            {filter === 'ALL' ? 'All Events' : 'Past Events'}
          </button>
        ))}
      </div>

      <div className="hidden sm:block h-6 w-px bg-border/60" />

      {/* Category Filter Dropdown */}
      <div className="hidden sm:flex flex-wrap gap-2">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as EventCategory | 'ALL')}
          className="px-3 py-2 text-sm rounded-xl border-2 border-border/50 bg-background/80 text-foreground hover:border-primary/40 transition-all cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block h-6 w-px bg-border/60" />

      {/* Mode Filters */}
      <div className="hidden sm:flex flex-wrap gap-2">
        {([EventMode.ONLINE, EventMode.OFFLINE, EventMode.HYBRID] as EventMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setModeFilter(modeFilter === mode ? 'ALL' : mode)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border-2 transition-all duration-200 ${
              modeFilter === mode
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                : 'bg-background/80 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground hover:shadow-sm'
            }`}
          >
            {getModeIcon(mode)}
            {getModeLabel(mode)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <PublicPageLayout>
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-accent/20 to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-3xl opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-6 sm:pb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4" />
              <span>{listType === 'events' ? 'Discover Amazing Events' : 'Explore Organizations'}</span>
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4 sm:mb-6">
              {listType === 'events' ? (
                <>
                  Find Your Next
                  <span className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                    Experience
                  </span>
                </>
              ) : (
                <>
                  Discover
                  <span className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                    Organizations
                  </span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto px-4">
              {listType === 'events' 
                ? 'Explore conferences, workshops, meetups, and more happening around you and online.'
                : 'Find and follow organizations hosting events in your area of interest.'}
            </p>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="relative max-w-2xl mx-auto px-4 sm:px-0"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
                <div className="relative flex items-center">
                  <Search className="absolute left-4 sm:left-5 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    type="text"
                    placeholder={listType === 'events' ? 'Search events...' : 'Search organizations...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 sm:pl-14 pr-4 py-5 sm:py-6 text-base rounded-xl sm:rounded-2xl border-2 border-border/40 bg-background/90 backdrop-blur-md shadow-lg focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* List Type Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6"
        >
          <div className="flex items-center p-1.5 bg-muted/60 rounded-2xl backdrop-blur-sm w-fit">
            <button
              onClick={() => setListType('events')}
              className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                listType === 'events'
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Events</span>
            </button>
            <button
              onClick={() => setListType('organizations')}
              className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                listType === 'organizations'
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Organizations</span>
            </button>
          </div>
        </motion.div>

        {/* Organizations List View */}
        {listType === 'organizations' && (
          <OrganizationsListView searchQuery={searchQuery} />
        )}

        {/* Events List View */}
        {listType === 'events' && (
          <>
        {/* Filters Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8"
        >
          {/* Desktop Filters */}
          <div className="hidden sm:block">
            <FilterPills />
          </div>

          {/* Mobile Filter Button */}
          <div className="flex sm:hidden items-center justify-between w-full">
            <div className="flex items-center p-1 bg-muted/60 rounded-xl">
              {(['ALL', 'PAST'] as DateFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    dateFilter === filter
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : 'Past'}
                </button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* Mobile Filters Dropdown */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="sm:hidden w-full overflow-hidden"
              >
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                  {/* Category Filter */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Category</p>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as EventCategory | 'ALL')}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
                    >
                      <option value="ALL">All Categories</option>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Event Type */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Event Type</p>
                    <div className="flex flex-wrap gap-2">
                      {([EventMode.ONLINE, EventMode.OFFLINE, EventMode.HYBRID] as EventMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setModeFilter(modeFilter === mode ? 'ALL' : mode)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-all ${
                            modeFilter === mode
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          {getModeIcon(mode)}
                          {getModeLabel(mode)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Count */}
          <div className="flex items-center gap-3">
            {(activeFiltersCount > 0 || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filters
              </button>
            )}
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredEvents.length}</span>
              <span className="hidden sm:inline"> events found</span>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 sm:p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-20 bg-muted rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-muted rounded-lg w-3/4" />
                    <div className="h-4 bg-muted rounded-lg w-1/2" />
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-4 bg-muted rounded-lg w-full" />
                  <div className="h-4 bg-muted rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-destructive font-semibold text-lg">Unable to load events</p>
            <p className="text-sm text-muted-foreground mt-2">Please check your connection and try again.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Events Grid */}
        {!isLoading && !error && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {filteredEvents.map((event) => {
              const startDate = formatEventDate(event.startDate);
              const statusConfig = getStatusConfig(event.status);
              const isLive = event.status === EventStatus.ONGOING;

              return (
                <motion.div key={event.id} variants={cardVariants}>
                  <Link
                    to={event.landingPageUrl || `/events/${event.id}`}
                    className="group block h-full bg-card rounded-2xl border-2 border-border/50 overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300"
                  >
                    {/* Live indicator bar */}
                    {isLive && (
                      <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
                    )}

                    <div className="p-5 sm:p-6 h-full flex flex-col">
                      <div className="flex gap-4">
                        {/* Date Block */}
                        <div className="flex-shrink-0">
                          <div className={`w-16 sm:w-18 text-center rounded-xl p-3 transition-colors ${
                            isLive 
                              ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30' 
                              : 'bg-primary/10 group-hover:bg-primary/15'
                          }`}>
                            <span className="block text-xs font-medium text-muted-foreground uppercase">
                              {startDate.weekday}
                            </span>
                            <span className={`block text-2xl sm:text-3xl font-bold ${isLive ? 'text-red-500' : 'text-primary'}`}>
                              {startDate.day}
                            </span>
                            <span className={`block text-xs font-semibold uppercase ${isLive ? 'text-red-500/80' : 'text-primary/80'}`}>
                              {startDate.month}
                            </span>
                          </div>
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {event.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              {getModeIcon(event.mode)}
                              <span className="hidden xs:inline">{getModeLabel(event.mode)}</span>
                            </span>
                            <span className="text-border">•</span>
                            <span>{startDate.time}</span>
                          </div>
                          {/* Category Badge */}
                          {event.category && event.category !== EventCategory.OTHER && categoryConfig[event.category as EventCategory] && (
                            <div className="mt-2">
                              <Badge variant="outline" className={`text-xs ${categoryConfig[event.category as EventCategory].color}`}>
                                {(() => {
                                  const CategoryIcon = categoryConfig[event.category as EventCategory].icon;
                                  return <CategoryIcon className="h-3 w-3 mr-1" />;
                                })()}
                                {categoryConfig[event.category as EventCategory].label}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mt-4 text-sm text-muted-foreground line-clamp-2 flex-grow">
                        {event.description || 'No description available for this event.'}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
                        <Badge 
                          variant={statusConfig.variant}
                          className={`${isLive ? 'animate-pulse bg-red-500/10 text-red-600 border-red-500/30' : ''}`}
                        >
                          <span className="flex items-center gap-1">
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </Badge>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
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
            className="text-center py-12 sm:py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center border border-border/50">
              <Calendar className="h-12 w-12 text-muted-foreground/60" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">No events found</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto px-4">
              {searchQuery 
                ? `No events match "${searchQuery}". Try a different search term.`
                : 'Try adjusting your filters to discover more events.'}
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={clearFilters}
              className="rounded-xl"
            >
              <X className="h-4 w-4 mr-2" />
              Clear all filters
            </Button>
          </motion.div>
        )}
          </>
        )}
      </div>
      </div>
    </PublicPageLayout>
  );
}

export default ParticipantEventsPage;
