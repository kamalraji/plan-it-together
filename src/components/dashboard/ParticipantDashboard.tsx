import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { QRCodeDisplay } from '@/components/attendance';
import { useApiHealth } from '@/hooks/useApiHealth';
import { Registration as CoreRegistration, RegistrationStatus } from '../../types';
import { CertificateQr } from '@/components/certificates/CertificateQr';
import { ParticipantProfileEditor } from '@/components/dashboard/ParticipantProfileEditor';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
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
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('th1_profile_banner_dismissed') !== '1';
  });
  const [showOrganizerBanner, setShowOrganizerBanner] = useState(false);
  const [showOrganizerSummaryBanner, setShowOrganizerSummaryBanner] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('th1_organizer_summary_banner_dismissed') !== '1';
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
      } catch (error) {
        console.warn('Failed to read auth metadata for organizer banner', error);
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
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'getMyCertificates' },
      });
      if (error) throw error;
      return (data?.certificates || []) as Certificate[];
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

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past' | 'attended'>('all');

  const now = new Date();

  const filteredRegistrations = (registrations ?? []).filter((registration) => {
    const eventStart = new Date(registration.event.startDate);
    const eventEnd = new Date(registration.event.endDate);
    const isUpcoming = eventStart >= now;
    const isPast = eventEnd < now;
    const isAttended = !!registration.attendance;

    if (statusFilter === 'upcoming' && !isUpcoming) return false;
    if (statusFilter === 'past' && !isPast) return false;
    if (statusFilter === 'attended' && !isAttended) return false;

    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      registration.event.name.toLowerCase().includes(query) ||
      registration.event.description.toLowerCase().includes(query)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
        <span className="text-muted-foreground/70">Home</span>
        <span>/</span>
        <span className="text-foreground font-medium">Participant Dashboard</span>
      </div>

      {/* Hero with glassmorphic profile summary */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl shadow-xl min-h-[180px] sm:min-h-[220px]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-primary/5" />

          <div className="relative px-6 sm:px-10 py-6 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl px-4 sm:px-6 py-4 shadow-2xl">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">/ Participant view</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Participant Dashboard
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Welcome back{user?.name ? `, ${user.name}` : ''}. Track your event journey, certificates, and
                profile in one place.
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

      {/* Profile banner */}
      {showProfileBanner && isProfileIncomplete && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl px-6 py-4 shadow-md flex items-center justify-between">
            <p className="text-sm text-foreground">
              Your profile is incomplete. Please update your profile to get the best experience.
            </p>
            <button
              onClick={() => {
                setShowProfileBanner(false);
                localStorage.setItem('th1_profile_banner_dismissed', '1');
              }}
              className="text-xs text-primary hover:text-primary/80 font-semibold"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* Organizer signup banner */}
      {showOrganizerBanner && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl px-6 py-4 shadow-md flex items-center justify-between">
            <p className="text-sm text-foreground">
              You signed up as an organizer. Please complete your organizer onboarding.
            </p>
            <button
              onClick={() => {
                setShowOrganizerBanner(false);
                localStorage.setItem('th1_organizer_banner_dismissed', '1');
              }}
              className="text-xs text-primary hover:text-primary/80 font-semibold"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* Organizer summary banner */}
      {showOrganizerSummaryBanner && hasCompletedOrganizerOnboarding && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl px-6 py-4 shadow-md flex items-center justify-between">
            <p className="text-sm text-foreground">
              Organizer onboarding complete. Access your organizer dashboard for analytics and management.
            </p>
            <button
              onClick={() => {
                setShowOrganizerSummaryBanner(false);
                localStorage.setItem('th1_organizer_summary_banner_dismissed', '1');
              }}
              className="text-xs text-primary hover:text-primary/80 font-semibold"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* QR Pass Modal */}
      <AnimatePresence>
        {canShowQrPass && qrCoreRegistration && qrRegistration && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQrRegistration(null)}
          >
            <motion.div
              className="bg-background rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl relative"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Your QR Pass</h2>
                <button
                  type="button"
                  onClick={() => setQrRegistration(null)}
                  className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Close QR pass"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <QRCodeDisplay registration={qrCoreRegistration} eventName={qrRegistration.event.name} />

              <button
                onClick={() => setQrRegistration(null)}
                className="mt-4 sm:mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10 mb-16 sm:mb-24">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar navigation for participants (desktop/tablet) */}
          <aside className="hidden lg:flex lg:w-64 flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 shadow-sm">
            <div className="flex flex-col gap-1 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                Participant
              </span>
              <p className="text-sm font-semibold text-foreground">Your workspace</p>
            </div>

            <nav className="flex flex-col gap-1 mt-1">
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`flex items-center justify-between rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'events'
                    ? 'bg-primary/10 text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <span>My events</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">E</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('certificates')}
                className={`flex items-center justify-between rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'certificates'
                    ? 'bg-primary/10 text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <span>Certificates</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">C</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center justify-between rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-primary/10 text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <span>Profile</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">P</span>
              </button>
            </nav>

            {/* Contextual quick actions */}
            <div className="mt-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-3 flex flex-col gap-2">
              <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground/80">
                Quick actions
              </p>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('events');
                  setPage(1);
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center justify-between rounded-full px-3 py-2 text-xs font-medium text-foreground bg-muted/70 hover:bg-muted transition-colors"
              >
                <span>View upcoming events</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">Go</span>
              </button>

              <button
                type="button"
                disabled={!certificates || certificates.length === 0}
                onClick={() => {
                  if (!certificates || certificates.length === 0) return;
                  setActiveTab('certificates');
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center justify-between rounded-full px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary/10 text-primary hover:bg-primary/15"
              >
                <span>{certificates && certificates.length > 0 ? 'Go to latest certificate' : 'No certificates yet'}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">Cert</span>
              </button>
            </div>
          </aside>

          {/* Main content */}
          <section className="flex-1">
            {/* Compact tab row for smaller screens */}
            <div className="flex gap-4 border-b border-border/60 lg:hidden">
              <button
                onClick={() => setActiveTab('events')}
                className={`py-2 px-4 text-sm font-semibold transition-colors ${
                  activeTab === 'events'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Events
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`py-2 px-4 text-sm font-semibold transition-colors ${
                  activeTab === 'certificates'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Certificates
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-4 text-sm font-semibold transition-colors ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Profile
              </button>
            </div>

            {/* Events Tab */}
            {activeTab === 'events' && (
              <section className="mt-6">
                <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="inline-flex flex-wrap gap-1 rounded-full border border-border/60 bg-card/80 px-2 py-1">
                      {[
                        { key: 'all', label: 'All' },
                        { key: 'upcoming', label: 'Upcoming' },
                        { key: 'past', label: 'Past' },
                        { key: 'attended', label: 'Attended' },
                      ].map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => {
                            setStatusFilter(chip.key as typeof statusFilter);
                            setPage(1);
                          }}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                            statusFilter === chip.key
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="w-full sm:w-64 rounded-md border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label htmlFor="rowsPerPage" className="text-sm text-muted-foreground">
                        Rows per page:
                      </label>
                      <select
                        id="rowsPerPage"
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        className="rounded-md border border-border/60 px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {[5, 10, 20].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Link
                      to="/events"
                      className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs sm:text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                    >
                      Browse public events
                    </Link>
                  </div>
                </div>

                {paginatedRegistrations.length > 0 ? (
                  <div className="space-y-4">
                    {paginatedRegistrations.map((registration) => (
                      <div
                        key={registration.id}
                        className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{registration.event.name}</h3>
                          <p className="text-sm text-muted-foreground">{registration.event.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(registration.event.startDate).toLocaleDateString()} -{' '}
                            {new Date(registration.event.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setQrRegistration(registration)}
                            className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm transition-colors hover:bg-primary/90 hover-scale animate-fade-in"
                          >
                            Show QR Pass
                          </button>
                          <Link
                            to={`/events/${registration.event.id}`}
                            className="text-primary text-sm font-medium hover:underline"
                          >
                            View Event
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground mt-10">No events found.</p>
                )}

                {/* Pagination */}
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-md border border-border/60 px-3 py-1 text-sm text-foreground disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-border/60 px-3 py-1 text-sm text-foreground disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </section>
            )}

            {/* Certificates Tab */}
            {activeTab === 'certificates' && (
              <section className="mt-6 bg-card border border-border/60 rounded-2xl shadow-sm px-4 sm:px-6 py-5 sm:py-6 space-y-6 sm:space-y-8">
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
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                              {certificate.event.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">Certificate ID</p>
                            <p className="text-[11px] sm:text-xs font-mono text-foreground break-all">
                              {certificate.code}
                            </p>
                          </div>
                          <div className="flex items-center justify-center">
                            <CertificateQr certificateId={certificate.code} size={112} />
                          </div>
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-3">
                          Issued on {new Date(certificate.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 sm:py-12 rounded-2xl border border-dashed border-border/70 bg-background">
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No certificates yet</h3>
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

            {activeTab === 'profile' && user && (
              <section className="mt-6">
                <ParticipantProfileEditor userId={user.id} userEmail={user.email ?? undefined} />
              </section>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
