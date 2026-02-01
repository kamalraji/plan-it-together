import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ChevronRight, LayoutDashboard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { FollowedOrganizations } from '@/components/organization';
import { QRCodeDisplay } from '@/components/attendance';
import { useApiHealth } from '@/hooks/useApiHealth';
import { Registration as CoreRegistration, RegistrationStatus } from '../../types';
import { preferenceStorage } from '@/lib/storage';

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
 
  // Fetch certificates using Supabase
  const { data: certificates } = useQuery<Certificate[]>({
    queryKey: ['participant-certificates'],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('certificates')
        .select(`
          id,
          certificate_id,
          issued_at,
          event:events (id, name)
        `)
        .eq('recipient_id', user.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((c: any) => ({
        id: c.id,
        code: c.certificate_id,
        issuedAt: c.issued_at,
        event: {
          id: c.event?.id || '',
          name: c.event?.name || 'Unknown Event',
        },
      }));
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isHealthy !== false && !!user,
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

  // Simple search and pagination for registrations
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const filteredRegistrations = (registrations ?? []).filter((registration) => {
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

      {/* Dashboard Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'events'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            My Events ({registrations?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'certificates'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Certificates ({certificates?.length || 0})
          </button>
        </div>

        {/* Events Tab Content */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="flex-1 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Event List */}
            {paginatedRegistrations.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <p className="text-muted-foreground">No events found</p>
                <Link
                  to="/discover"
                  className="text-primary hover:underline text-sm mt-2 inline-block"
                >
                  Discover events
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {paginatedRegistrations.map((registration) => (
                  <div
                    key={registration.id}
                    className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-foreground mb-1">
                      {registration.event.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {registration.event.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {new Date(registration.event.startDate).toLocaleDateString()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          registration.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {registration.status}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        to={`/events/${registration.event.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View Event
                      </Link>
                      <button
                        onClick={() => setQrRegistration(registration)}
                        className="text-xs text-primary hover:underline"
                      >
                        Show QR Pass
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-input rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-input rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Certificates Tab Content */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            {!certificates || certificates.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <p className="text-muted-foreground">No certificates yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Certificates will appear here after you complete events
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <h3 className="font-semibold text-foreground mb-1">
                      {cert.event.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      Certificate ID: {cert.code}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                    </p>
                    <Link
                      to={`/certificates/${cert.id}`}
                      className="text-xs text-primary hover:underline mt-2 inline-block"
                    >
                      View Certificate
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Followed Organizations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <FollowedOrganizations />
      </section>
    </div>
  );
}