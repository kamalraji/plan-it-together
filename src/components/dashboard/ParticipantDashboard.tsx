import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ChevronRight, LayoutDashboard } from 'lucide-react';
import api from '../../lib/api';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { FollowedOrganizations } from '@/components/organization';
import { QRCodeDisplay } from '@/components/attendance';
import { useApiHealth } from '@/hooks/useApiHealth';
import { Registration as CoreRegistration, RegistrationStatus } from '../../types';
import { preferenceStorage } from '@/lib/storage';
import { RichTextDisplay, stripHtmlTags } from '@/components/ui/rich-text-display';

interface Registration {
  id: string;
  status: string;
  qrCode: string;
  registeredAt: string;
  event: {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    mode: string;
    venue?: {
      address: string;
    };
    virtualLinks?: {
      meetingUrl: string;
    };
  };
  attendance?: {
    checkInTime: string;
  };
}

interface Certificate {
  id: string;
  code: string;
  issuedAt: string;
  event: {
    id: string;
    name: string;
  };
}

const mapToCoreRegistration = (registration: Registration, userId: string): CoreRegistration => {
  return {
    id: registration.id,
    eventId: registration.event.id,
    userId,
    status: registration.status as RegistrationStatus,
    formResponses: {},
    qrCode: registration.qrCode,
    registeredAt: registration.registeredAt,
    updatedAt: registration.registeredAt,
  };
};

export function ParticipantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'events' | 'certificates' | 'profile'>('events');
  const [qrRegistration, setQrRegistration] = useState<Registration | null>(null);
  const [showProfileBanner, setShowProfileBanner] = useState(() => {
    const stored = preferenceStorage.getString('profile_banner_dismissed');
    return stored !== '1';
  });
  const [showOrganizerBanner, setShowOrganizerBanner] = useState(false);
  const [showOrganizerSummaryBanner, setShowOrganizerSummaryBanner] = useState(() => {
    const stored = preferenceStorage.getString('organizer_summary_banner_dismissed');
    return stored !== '1';
  });

  const { isHealthy } = useApiHealth();

  useEffect(() => {
    const checkOrganizerSignup = async () => {
      if (!user) return;
      try {
        const { data } = await supabase.auth.getUser();
        const desiredRole = data.user?.user_metadata?.desiredRole;
        const isOrganizerSignup = desiredRole === 'ORGANIZER';
        if (isOrganizerSignup && user.role === 'PARTICIPANT') {
          setShowOrganizerBanner(true);
        }
      } catch (_error) {
        // Failed to read auth metadata silently
      }
    };

    void checkOrganizerSignup();
  }, [user]);

  const { data: registrations, isLoading } = useQuery<Registration[]>({
    queryKey: ['participant-registrations'],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch user registrations joined with events
      const { data: rawRegistrations, error: registrationsError } = await supabase
        .from('registrations')
        .select(
          `id, status, created_at, updated_at,
           event:events (id, name, description, start_date, end_date, mode)`,
        )
        .eq('user_id', user.id);

      if (registrationsError) {
        throw registrationsError;
      }

      const registrationIds = (rawRegistrations ?? []).map((r: any) => r.id);

      // Fetch attendance records for these registrations to mark check-in status
      const { data: attendanceRecords, error: attendanceError } =
        registrationIds.length > 0
          ? await supabase
              .from('attendance_records')
              .select('registration_id, check_in_time')
              .in('registration_id', registrationIds)
          : { data: [], error: null };

      if (attendanceError) {
        throw attendanceError;
      }

      const attendanceByRegistrationId = new Map<string, string>();
      (attendanceRecords ?? []).forEach((record: any) => {
        const existing = attendanceByRegistrationId.get(record.registration_id);
        if (!existing || new Date(record.check_in_time) > new Date(existing)) {
          attendanceByRegistrationId.set(record.registration_id, record.check_in_time);
        }
      });

      return (rawRegistrations ?? []).map((r: any) => {
        const attendanceTime = attendanceByRegistrationId.get(r.id);

        const registration: Registration = {
          id: r.id,
          status: r.status,
          qrCode: '',
          registeredAt: r.created_at,
          event: {
            id: r.event.id,
            name: r.event.name,
            description: r.event.description ?? '',
            startDate: r.event.start_date,
            endDate: r.event.end_date,
            mode: r.event.mode,
            venue: undefined,
            virtualLinks: undefined,
          },
          attendance: attendanceTime
            ? {
                checkInTime: attendanceTime,
              }
            : undefined,
        };

        return registration;
      });
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isHealthy !== false,
  });
 
  const { data: certificates } = useQuery<Certificate[]>({
    queryKey: ['participant-certificates'],
    queryFn: async () => {
      const response = await api.get('/certificates/my-certificates');
      return response.data.certificates as Certificate[];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isHealthy !== false,
  });

  const { data: organizerOnboardingStatus } = useQuery<{ completed_at: string | null } | null>({
    queryKey: ['organizer-onboarding-status', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('onboarding_checklist')
        .select('completed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!user && user.role === 'ORGANIZER' && isHealthy !== false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const hasCompletedOrganizerOnboarding = !!organizerOnboardingStatus?.completed_at;


  const isProfileIncomplete = !user?.profileCompleted;

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;

    const redirectDone = sessionStorage.getItem('th1_profile_redirect_done') === '1';

    if (isProfileIncomplete && !redirectDone) {
      sessionStorage.setItem('th1_profile_redirect_done', '1');
      navigate('/dashboard/profile');
    }
  }, [user, navigate, isProfileIncomplete]);

  const upcomingRegistrations =
    registrations?.filter((registration) => {
      const start = new Date(registration.event.startDate).getTime();
      const now = Date.now();
      return start >= now;
    }) ?? [];

  // Simple search and pagination for registrations
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const filteredRegistrations = (registrations ?? []).filter((registration) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      registration.event.name.toLowerCase().includes(query) ||
      stripHtmlTags(registration.event.description).toLowerCase().includes(query)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const canShowQrPass = user && qrRegistration;

  const qrCoreRegistration =
    canShowQrPass && user
      ? mapToCoreRegistration(qrRegistration as Registration, user.id)
      : null;

  const generateQRCode = (qrCode: string) => {
    return `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="black">
          QR: ${qrCode.substring(0, 10)}...
        </text>
      </svg>
    `)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link 
              to="/dashboard"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </li>
          <li>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          </li>
          <li>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Hero with glassmorphic profile summary */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl shadow-xl min-h-[180px] sm:min-h-[220px]">
          {/* Themed gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-primary/5" />

          {/* Glassmorphic overlay */}
          <div className="relative px-6 sm:px-10 py-6 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl px-4 sm:px-6 py-4 shadow-2xl">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">/ Participant view</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Participant Dashboard
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Track your event journey, certificates, and profile in one place.
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-3">
              <div className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl px-4 py-3 shadow-xl min-w-[220px] max-w-xs">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Signed in as
                </p>
                <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                  {user?.name || user?.email || 'Participant'}
                </p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center rounded-full border border-border/70 bg-background/80 backdrop-blur px-4 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-background/90 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* Organizer onboarding banner for new organizer signups */}
      {showOrganizerBanner && (
        <div className="bg-accent/80 text-accent-foreground border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
            <span>
              You signed up as an organizer. To unlock organizer tools, first join or create an organization.
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard/organizations/join')}
                className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-3 py-1 text-xs font-medium hover:bg-primary/90"
              >
                Join or create organization
              </button>
              <button
                onClick={() => setShowOrganizerBanner(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organizer summary banner after onboarding completion */}
      {user?.role === 'ORGANIZER' && hasCompletedOrganizerOnboarding && showOrganizerSummaryBanner && (
        <div className="bg-accent text-accent-foreground border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm">
            <div className="space-y-1">
              <p className="font-medium text-foreground">You're all set as an organizer.</p>
              <p className="text-muted-foreground">
                Create and manage events, invite your team, and keep everything organized from your organizer console.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate('/dashboard/eventmanagement/events')}
                className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90"
              >
                View events
              </button>
              <button
                onClick={() => navigate('/dashboard/team')}
                className="inline-flex items-center rounded-md bg-secondary text-secondary-foreground px-3 py-1.5 text-xs font-medium hover:bg-secondary/90"
              >
                Manage team
              </button>
              <button
                onClick={() => {
                  setShowOrganizerSummaryBanner(false);
                  preferenceStorage.setString('organizer_summary_banner_dismissed', '1');
                }}
                className="text-xs text-muted-foreground hover:text-foreground ml-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile completion banner */}
      {isProfileIncomplete && showProfileBanner && (
        <div className="bg-accent text-accent-foreground border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
            <span>
              Complete your profile so organizers and teammates can recognize you.
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard/profile')}
                className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-3 py-1 text-xs font-medium hover:bg-primary/90"
              >
                Finish profile
              </button>
              <button
                onClick={() => {
                  setShowProfileBanner(false);
                  preferenceStorage.setString('profile_banner_dismissed', '1');
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}


      {/* QR Pass Modal */}
      {canShowQrPass && qrCoreRegistration && qrRegistration && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Event Pass</h2>
                <button
                  onClick={() => setQrRegistration(null)}
                  className="text-muted-foreground hover:text-foreground text-lg leading-none"
                  aria-label="Close event pass"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  This QR code is your personal check-in ID. It works for any event where you have a confirmed registration.
                </p>
                <QRCodeDisplay
                  registration={qrCoreRegistration}
                  eventName={qrRegistration.event.name}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary metrics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-between">
            <div className="text-xs font-medium text-muted-foreground mb-1">Upcoming events</div>
            <div className="flex items-end justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                {upcomingRegistrations.length}
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground">Next {upcomingRegistrations.length === 1 ? 'event' : 'events'}</span>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-between">
            <div className="text-xs font-medium text-muted-foreground mb-1">Past events</div>
            <div className="flex items-end justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                {(registrations?.length ?? 0) - upcomingRegistrations.length}
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground">Completed experiences</span>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-between">
            <div className="text-xs font-medium text-muted-foreground mb-1">Certificates</div>
            <div className="flex items-end justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                {certificates?.length ?? 0}
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground">Earned so far</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-12">
        <div className="bg-card border border-border/60 rounded-2xl px-2 sm:px-3 py-2 shadow-sm overflow-x-auto">
          <nav className="flex gap-2 sm:gap-3 min-w-max">
            {[
              { key: 'events', label: 'My Events' },
              { key: 'certificates', label: 'Certificates' },
              { key: 'profile', label: 'Profile' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-14 sm:pt-16">
        {activeTab === 'events' && (
          <div className="space-y-6 sm:space-y-8">
            <section className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 sm:px-6 py-5 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-accent/60 px-3 py-1 text-[11px] sm:text-xs font-medium text-accent-foreground mb-2">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent-foreground" />
                    Primary participant dashboard
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">My Registered Events</h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl">
                    Access a comprehensive listing of all events you have registered for and participated in.
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2 text-xs sm:text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{filteredRegistrations.length}</span>{' '}
                    event{filteredRegistrations.length !== 1 ? 's' : ''} shown
                  </p>
                  <button
                    onClick={() => navigate('/dashboard/participant-events')}
                    className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Browse all events
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Search events</label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by event name or description"
                    className="w-full rounded-full border border-input bg-background px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="text-muted-foreground">Rows per page</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="rounded-full border border-input bg-background px-2 py-1 text-xs sm:text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/60"
                  >
                    {[5, 10, 25].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {paginatedRegistrations.length > 0 ? (
                <div className="space-y-4 sm:space-y-5">
                  {paginatedRegistrations.map((registration) => (
                    <div key={registration.id} className="space-y-3">
                      {/* Mobile accordion card */}
                      <div className="md:hidden rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
                        <details className="group">
                          <summary className="list-none cursor-pointer">
                            <div className="px-4 py-3 bg-muted/40 border-b border-border/60 flex flex-col gap-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                                    {registration.event.name}
                                  </h3>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {new Date(registration.event.startDate).toLocaleDateString()} -{' '}
                                    {new Date(registration.event.endDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span
                                    className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                                      registration.status === 'CONFIRMED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : registration.status === 'WAITLISTED'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {registration.status}
                                  </span>
                                  {registration.attendance && (
                                    <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-accent text-accent-foreground">
                                      Checked in
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>
                                  {new Date(registration.registeredAt).toLocaleDateString()} •{' '}
                                  {registration.event.mode.toLowerCase()}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-primary group-open:text-primary/80">
                                  <span>{'Details'}</span>
                                  <span className="transition-transform group-open:rotate-180">▾</span>
                                </span>
                              </div>
                            </div>
                          </summary>

                          <div className="px-4 pt-3 pb-4 space-y-3 text-xs">
                            <RichTextDisplay
                              content={registration.event.description}
                              className="text-muted-foreground"
                            />
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Start</span>
                                <span className="text-foreground">
                                  {new Date(registration.event.startDate).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">End</span>
                                <span className="text-foreground">
                                  {new Date(registration.event.endDate).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Registered</span>
                                <span className="text-foreground">
                                  {new Date(registration.registeredAt).toLocaleDateString()}
                                </span>
                              </div>
                              {registration.attendance && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Checked in</span>
                                  <span className="text-foreground">
                                    {new Date(registration.attendance.checkInTime).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {registration.event.venue && (
                              <div className="mt-1 p-2 rounded-lg bg-muted/60">
                                <p className="text-[11px] font-medium text-foreground mb-0.5">Venue</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {registration.event.venue.address}
                                </p>
                              </div>
                            )}

                            {registration.event.virtualLinks && (
                              <div className="mt-1 p-2 rounded-lg bg-accent/40">
                                <p className="text-[11px] font-medium text-foreground mb-0.5">Virtual meeting</p>
                                <a
                                  href={registration.event.virtualLinks.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-primary hover:text-primary/80 underline"
                                >
                                  Join meeting
                                </a>
                              </div>
                            )}

                            <div className="flex flex-col gap-2 mt-1">
                              <Link
                                to={`/events/${registration.event.id}`}
                                className="text-[11px] font-medium text-primary hover:text-primary/80"
                              >
                                View event page
                              </Link>
                              {registration.status === 'CONFIRMED' && (
                                <div className="bg-muted/40 p-3 rounded-xl text-center">
                                  <h4 className="text-xs font-medium text-foreground mb-2">
                                    Check-in QR code
                                  </h4>
                                  <div className="bg-background p-2 rounded border border-border/60 inline-block mb-2">
                                    <img
                                      src={generateQRCode(registration.qrCode)}
                                      alt="QR code for check-in"
                                      className="w-20 h-20"
                                    />
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mb-2">
                                    Show this at the event for check-in.
                                  </p>
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.download = `qr-code-${registration.event.name
                                        .replace(/[^a-z0-9]/gi, '_')
                                        .toLowerCase()}.svg`;
                                      link.href = generateQRCode(registration.qrCode);
                                      link.click();
                                    }}
                                    className="w-full text-[11px] rounded-full bg-primary text-primary-foreground px-3 py-1 hover:bg-primary/90 transition-colors"
                                  >
                                    Download QR
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </details>
                      </div>

                      {/* Desktop / tablet card */}
                      <div className="hidden md:block rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden hover:shadow-md transition-shadow">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-muted/40 border-b border-border/60">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                                {registration.event.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                {new Date(registration.event.startDate).toLocaleDateString()} -{' '}
                                {new Date(registration.event.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-full ${
                                  registration.status === 'CONFIRMED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : registration.status === 'WAITLISTED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {registration.status}
                              </span>
                              {registration.attendance && (
                                <span className="inline-flex px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-full bg-accent text-accent-foreground">
                                  Checked in
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 sm:gap-6">
                            <div className="flex-1">
                              <RichTextDisplay
                                content={registration.event.description}
                                className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4"
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Start time</span>
                                    <span className="text-foreground">
                                      {new Date(registration.event.startDate).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">End time</span>
                                    <span className="text-foreground">
                                      {new Date(registration.event.endDate).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Event mode</span>
                                    <span className="text-foreground capitalize">
                                      {registration.event.mode.toLowerCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Registered</span>
                                    <span className="text-foreground">
                                      {new Date(registration.registeredAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {registration.attendance && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Checked in</span>
                                      <span className="text-foreground">
                                        {new Date(registration.attendance.checkInTime).toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {registration.event.venue && (
                                <div className="mt-4 p-3 rounded-lg bg-muted/60">
                                  <div className="flex items-start gap-2">
                                    <svg
                                      className="h-5 w-5 text-muted-foreground mt-0.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 3 0 016 0z"
                                      />
                                    </svg>
                                    <div>
                                      <p className="text-sm font-medium text-foreground">Venue</p>
                                      <p className="text-sm text-muted-foreground">
                                        {registration.event.venue.address}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {registration.event.virtualLinks && (
                                <div className="mt-4 p-3 rounded-lg bg-accent/40">
                                  <div className="flex items-start gap-2">
                                    <svg
                                      className="h-5 w-5 text-accent-foreground mt-0.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                      />
                                    </svg>
                                    <div>
                                      <p className="text-sm font-medium text-foreground">Virtual meeting</p>
                                      <a
                                        href={registration.event.virtualLinks.meetingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:text-primary/80 underline"
                                      >
                                        Join meeting
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="mt-4">
                                <Link
                                  to={`/events/${registration.event.id}`}
                                  className="text-sm font-medium text-primary hover:text-primary/80"
                                >
                                  View event page
                                </Link>
                              </div>
                            </div>

                            {registration.status === 'CONFIRMED' && (
                              <div className="md:ml-6 text-center bg-muted/40 p-4 rounded-xl">
                                <h4 className="text-sm font-medium text-foreground mb-3">
                                  Check-in QR code
                                </h4>
                                <div className="bg-background p-2 rounded border border-border/60 inline-block">
                                  <img
                                    src={generateQRCode(registration.qrCode)}
                                    alt="QR code for check-in"
                                    className="w-24 h-24"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 mb-3">
                                  Show this at the event for check-in.
                                </p>
                                <div className="space-y-2">
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.download = `qr-code-${registration.event.name
                                        .replace(/[^a-z0-9]/gi, '_')
                                        .toLowerCase()}.svg`;
                                      link.href = generateQRCode(registration.qrCode);
                                      link.click();
                                    }}
                                    className="w-full text-xs rounded-full bg-primary text-primary-foreground px-3 py-1 hover:bg-primary/90 transition-colors"
                                  >
                                    Download QR
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (navigator.share) {
                                        navigator.share({
                                          title: `QR Code - ${registration.event.name}`,
                                          text: `My check-in QR code for ${registration.event.name}`,
                                          url: generateQRCode(registration.qrCode),
                                        });
                                      }
                                    }}
                                    className="w-full text-xs rounded-full bg-secondary text-secondary-foreground px-3 py-1 hover:bg-secondary/90 transition-colors"
                                  >
                                    Share QR
                                  </button>
                                </div>
                              </div>
                            )}

                            {registration.status === 'WAITLISTED' && (
                              <div className="md:ml-6 text-center bg-accent/40 p-4 rounded-xl">
                                <div className="text-accent-foreground mb-2">
                                  <svg
                                    className="h-8 w-8 mx-auto"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </div>
                                <h4 className="text-sm font-medium text-foreground mb-1">
                                  On waitlist
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  You'll be notified if a spot becomes available.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 sm:py-12 rounded-2xl border border-dashed border-border/70 bg-background">
                  <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-4h8v4z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No events registered yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't registered for any events yet. Browse available events to get started.
                  </p>
                  <button
                    onClick={() => navigate('/events')}
                    className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Browse events
                  </button>
                </div>
              )}

              <div className="mt-6 border-t border-border/60 pt-4 flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                <div>
                  Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
                  <span className="font-medium text-foreground">{totalPages}</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full border border-input bg-background px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/60 transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full border border-input bg-background px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/60 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 sm:px-6 py-5 sm:py-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Discover upcoming events</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Browse a few upcoming events you might be interested in.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/events')}
                  className="text-xs sm:text-sm font-medium text-primary hover:text-primary/80"
                >
                  View all
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingRegistrations.slice(0, 3).map((registration) => (
                  <div
                    key={registration.id}
                    className="rounded-xl border border-border/60 bg-background p-4 hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      {registration.event.name}
                    </h4>
                    <RichTextDisplay
                      content={registration.event.description}
                      lineClamp={2}
                      className="text-xs text-muted-foreground mb-2"
                    />
                    <p className="text-xs text-muted-foreground mb-3">
                      {new Date(registration.event.startDate).toLocaleDateString()} •{' '}
                      {registration.event.mode.toLowerCase()}
                    </p>
                    <Link
                      to={`/events/${registration.event.id}`}
                      className="text-xs font-medium text-primary hover:text-primary/80"
                    >
                      View event
                    </Link>
                  </div>
                ))}

                {upcomingRegistrations.length === 0 && (
                  <div className="col-span-full text-sm text-muted-foreground">
                    You don't have any upcoming events yet. Browse events to discover what's coming up.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'certificates' && (
          <section className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 sm:px-6 py-5 sm:py-6 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">My Certificates</h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Certificates from completed events will appear here once issued by organizers.
                </p>
              </div>
              <Link
                to="/verify-certificate"
                className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium"
              >
                Public certificate verification
              </Link>
            </div>

            {certificates && certificates.length > 0 ? (
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="bg-background rounded-xl border border-border/60 p-4 flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                        {certificate.event.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">Certificate ID</p>
                      <p className="text-[11px] sm:text-xs font-mono text-foreground break-all mb-2.5 sm:mb-3">
                        {certificate.code}
                      </p>
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-auto">
                      Issued on {new Date(certificate.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 sm:py-12 rounded-2xl border border-dashed border-border/70 bg-background">
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                  No certificates yet
                </h3>
                <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
                  Certificates from completed events will appear here.
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  If you think you're missing a certificate, please contact the event organizer.
                </p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 sm:space-y-8">
            <section className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 sm:px-6 py-5 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Profile settings</h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Keep your personal details up to date so organizers and teammates can recognize you.
                  </p>
                </div>
                <Link
                  to="/complete-profile"
                  className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Edit profile
                </Link>
              </div>

              <div className="space-y-6 sm:space-y-8">
                <div className="bg-background rounded-xl border border-border/60 p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-muted-foreground">Name</label>
                        <p className="mt-1 text-sm text-foreground">{user?.name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-muted-foreground">Email</label>
                        <p className="mt-1 text-sm text-foreground">{user?.email}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-muted-foreground">Role</label>
                        <p className="mt-1 text-sm text-foreground">{user?.role}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-muted-foreground">Organization</label>
                        <p className="mt-1 text-sm text-foreground">{user?.organization || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="mt-1 text-sm text-foreground">{user?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-muted-foreground">Website</label>
                        <p className="mt-1 text-sm text-foreground">
                          {user?.website ? (
                            <a
                              href={user.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              {user.website}
                            </a>
                          ) : (
                            'Not provided'
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-muted-foreground">Email status</label>
                        <p className="mt-1 text-sm text-foreground">
                          <span
                            className={`inline-flex px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-full ${
                              user?.emailVerified
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {user?.emailVerified ? 'Verified' : 'Pending verification'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {user?.bio && (
                    <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-border">
                      <label className="block text-xs sm:text-sm font-medium text-muted-foreground">Bio</label>
                      <p className="mt-1 text-sm text-foreground">{user.bio}</p>
                    </div>
                  )}

                  {user?.socialLinks && Object.keys(user.socialLinks).length > 0 && (
                    <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-border">
                      <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
                        Social links
                      </label>
                      <div className="flex flex-wrap gap-3 text-sm">
                        {user.socialLinks.linkedin && (
                          <a
                            href={user.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            LinkedIn
                          </a>
                        )}
                        {user.socialLinks.twitter && (
                          <a
                            href={user.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            Twitter
                          </a>
                        )}
                        {user.socialLinks.github && (
                          <a
                            href={user.socialLinks.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-card border border-border/60 rounded-2xl shadow-sm px-4 sm:px-6 py-5 sm:py-6">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1.5 sm:mb-2">
                Followed organizations
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Stay up to date with announcements and events from organizations you follow.
              </p>
              <FollowedOrganizations />
            </section>
          </div>
        )}
      </main>

    </div>
  );
}
