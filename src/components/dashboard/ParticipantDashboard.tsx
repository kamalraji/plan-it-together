import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { FollowedOrganizations } from '@/components/organization';
import { QRCodeDisplay } from '@/components/attendance';
import { Registration as CoreRegistration, RegistrationStatus } from '../../types';

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
  });

  const { data: certificates } = useQuery<Certificate[]>({
    queryKey: ['participant-certificates'],
    queryFn: async () => {
      const response = await api.get('/certificates/my-certificates');
      return response.data.certificates as Certificate[];
    },
  });

  const upcomingRegistrations =
    registrations?.filter((registration) => {
      const start = new Date(registration.event.startDate).getTime();
      const now = Date.now();
      return start >= now;
    }) ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Participant Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* QR Pass Modal */}
      {canShowQrPass && qrCoreRegistration && qrRegistration && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Event Pass</h2>
                <button
                  onClick={() => setQrRegistration(null)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close event pass"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600">
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

      {/* Navigation Tabs */}
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="border-b border-border">
           <nav className="-mb-px flex space-x-8">
             {[
               { key: 'events', label: 'My Events' },
               { key: 'certificates', label: 'Certificates' },
               { key: 'profile', label: 'Profile' },
             ].map((tab) => (
               <button
                 key={tab.key}
                 onClick={() => setActiveTab(tab.key as any)}
                 className={`py-2 px-1 border-b-2 font-medium text-sm ${
                   activeTab === tab.key
                     ? 'border-primary text-primary'
                     : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                 }`}
               >
                 {tab.label}
               </button>
             ))}
           </nav>
         </div>
       </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'events' && (
          <div className="space-y-10">
            <div>
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-foreground">My Registered Events</h2>
               <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                 <span>
                   {registrations?.length || 0} event
                   {(registrations?.length || 0) !== 1 ? 's' : ''} registered
                 </span>
                 <button
                   onClick={() => navigate('/dashboard/participant-events')}
                   className="text-primary hover:text-primary/80 font-medium"
                 >
                   Browse all events
                 </button>
               </div>
             </div>

              {registrations && registrations.length > 0 ? (
                <div className="space-y-6">
                  {registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="bg-white rounded-lg shadow overflow-hidden"
                    >
                      {/* Event Header */}
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                           <div>
                             <h3 className="text-lg font-semibold text-foreground">
                               {registration.event.name}
                             </h3>
                             <p className="text-sm text-muted-foreground mt-1">
                               {new Date(
                                 registration.event.startDate,
                               ).toLocaleDateString()}{' '}
                               -{' '}
                               {new Date(
                                 registration.event.endDate,
                               ).toLocaleDateString()}
                             </p>
                           </div>
                           <div className="flex items-center space-x-2">
                             <span
                               className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
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
                               <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800">
                                 Checked In
                               </span>
                             )}
                           </div>
                         </div>
                      </div>

                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                         <div className="flex-1">
                             <p className="text-muted-foreground text-sm mb-4">
                               {registration.event.description}
                             </p>

                            {/* Event Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                               <div className="space-y-2">
                                 <div className="flex justify-between">
                                   <span className="text-muted-foreground">Start Time:</span>
                                   <span className="text-foreground">
                                     {new Date(
                                       registration.event.startDate,
                                     ).toLocaleString()}
                                   </span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-muted-foreground">End Time:</span>
                                   <span className="text-foreground">
                                     {new Date(
                                       registration.event.endDate,
                                     ).toLocaleString()}
                                   </span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-muted-foreground">Event Mode:</span>
                                   <span className="text-foreground capitalize">
                                     {registration.event.mode.toLowerCase()}
                                   </span>
                                 </div>
                               </div>
                              <div className="space-y-2">
                                 <div className="flex justify-between">
                                   <span className="text-muted-foreground">Registered:</span>
                                   <span className="text-foreground">
                                     {new Date(
                                       registration.registeredAt,
                                     ).toLocaleDateString()}
                                   </span>
                                 </div>
                                 {registration.attendance && (
                                   <div className="flex justify-between">
                                     <span className="text-muted-foreground">Checked In:</span>
                                     <span className="text-foreground">
                                       {new Date(
                                         registration.attendance.checkInTime,
                                       ).toLocaleString()}
                                     </span>
                                   </div>
                                 )}
                               </div>
                            </div>

                            {/* Location/Virtual Links */}
                             {registration.event.venue && (
                               <div className="mt-4 p-3 bg-muted rounded-lg">
                                 <div className="flex items-start">
                                   <svg
                                     className="h-5 w-5 text-muted-foreground mt-0.5 mr-2"
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
                                       d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
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
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-start">
                                  <svg
                                    className="h-5 w-5 text-blue-400 mt-0.5 mr-2"
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
                                    <p className="text-sm font-medium text-gray-900">
                                      Virtual Meeting
                                    </p>
                                    <a
                                      href={registration.event.virtualLinks.meetingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                                    >
                                      Join Meeting
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="mt-4">
                              <Link
                                to={`/events/${registration.event.id}`}
                                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                View Event Page
                              </Link>
                            </div>
                          </div>

                          {/* QR Code Section */}
                          {registration.status === 'CONFIRMED' && (
                            <div className="md:ml-6 text-center bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">
                                Check-in QR Code
                              </h4>
                              <div className="bg-white p-2 rounded border">
                                <img
                                  src={generateQRCode(registration.qrCode)}
                                  alt="QR Code for check-in"
                                  className="w-24 h-24"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-2 mb-3">
                                Show this at the event for check-in
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
                                  className="w-full text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
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
                                  className="w-full text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                                >
                                  Share QR
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Waitlist Status */}
                          {registration.status === 'WAITLISTED' && (
                            <div className="md:ml-6 text-center bg-yellow-50 p-4 rounded-lg">
                              <div className="text-yellow-600 mb-2">
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
                              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                                On Waitlist
                              </h4>
                              <p className="text-xs text-yellow-700">
                                You'll be notified if a spot becomes available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-4h8v4z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Events Registered
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You haven't registered for any events yet. Browse available events to
                    get started.
                  </p>
                  <button
                    onClick={() => navigate('/events')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Browse Events
                  </button>
                </div>
              )}
            </div>

            {/* Compact event discovery so participants can browse upcoming events */}
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Discover Upcoming Events
                  </h3>
                  <p className="text-sm text-gray-600">
                    Browse a few upcoming events you might be interested in.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/events')}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View all
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingRegistrations.slice(0, 3).map((registration) => (
                  <div
                    key={registration.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {registration.event.name}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {registration.event.description}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {new Date(
                        registration.event.startDate,
                      ).toLocaleDateString()}{' '}
                      • {registration.event.mode.toLowerCase()}
                    </p>
                    <Link
                      to={`/events/${registration.event.id}`}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      View event
                    </Link>
                  </div>
                ))}

                {upcomingRegistrations.length === 0 && (
                  <div className="col-span-full text-sm text-gray-500">
                    You don't have any upcoming events yet. Browse events to discover
                    what's coming up.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-gray-900">My Certificates</h2>
              <Link
                to="/verify-certificate"
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Public certificate verification
              </Link>
            </div>

            {certificates && certificates.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="bg-white rounded-lg shadow p-4 flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {certificate.event.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">Certificate ID</p>
                      <p className="text-xs font-mono text-gray-800 break-all mb-3">
                        {certificate.code}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-auto">
                      Issued on{' '}
                      {new Date(certificate.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Certificates Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Certificates from completed events will appear here.
                </p>
                <p className="text-sm text-gray-500">
                  If you think you're missing a certificate, please contact the event
                  organizer.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
              <Link
                to="/complete-profile"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Edit Profile
              </Link>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user?.name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{user?.role}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Organization
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user?.organization || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user?.phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user?.website ? (
                          <a
                            href={user.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            {user.website}
                          </a>
                        ) : (
                          'Not provided'
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Status
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user?.emailVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {user?.emailVerified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {user?.bio && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <p className="mt-1 text-sm text-gray-900">{user.bio}</p>
                  </div>
                )}

                {user?.socialLinks && Object.keys(user.socialLinks).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Social Links
                    </label>
                    <div className="flex space-x-4">
                      {user.socialLinks.linkedin && (
                        <a
                          href={user.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          LinkedIn
                        </a>
                      )}
                      {user.socialLinks.twitter && (
                        <a
                          href={user.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          Twitter
                        </a>
                      )}
                      {user.socialLinks.github && (
                        <a
                          href={user.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Followed Organizations
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Stay up to date with announcements and events from organizations you
                  follow.
                </p>
                <FollowedOrganizations />
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
