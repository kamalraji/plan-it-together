import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/routing/PageHeader';
import { AttendanceList } from '@/components/attendance';
import { QRCodeScanner } from '@/components/attendance/QRCodeScanner';
import { supabase } from '@/integrations/supabase/client';
import type { AttendanceReport } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
export const EventOpsConsole: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: attendanceReport } = useQuery<AttendanceReport>({
    queryKey: ['attendance-report', eventId, undefined],
    queryFn: async () => {
      if (!eventId) throw new Error('Missing event id');
      const { data, error } = await supabase.functions.invoke('attendance-report', {
        body: { eventId },
      });
      if (error || !data?.success) {
        throw error || new Error('Failed to load attendance');
      }
      return data.data as AttendanceReport;
    },
    enabled: !!eventId,
    refetchInterval: 5000,
  });

  const totalRegistrations = attendanceReport?.totalRegistrations ?? 0;
  const attendedCount = attendanceReport?.attendedCount ?? 0;
  const checkInRate = attendanceReport?.checkInRate ?? 0;

  const recentCheckIns = (attendanceReport?.attendanceRecords || [])
    .filter((r) => r.attended)
    .sort((a, b) => {
      const aTime = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
      const bTime = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 10);

  const handleOpenVolunteerConsole = () => {
    if (!eventId) return;
    navigate(`/console/events/${eventId}/check-in`);
  };

  const handleViewEventDetails = () => {
    if (!eventId) return;
    navigate(`/console/events/${eventId}`);
  };

  if (!eventId) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h2 className="text-sm font-semibold text-red-800 mb-1">Missing event context</h2>
            <p className="text-sm text-red-700">
              The Event-Day Ops console needs a valid event id in the URL.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Event-Day Ops Console"
        subtitle="Monitor live check-ins, print badges, and coordinate volunteers for this event."
        breadcrumbs={[
          { label: 'Events', href: '/console/events' },
          { label: `Event ${eventId}`, href: `/console/events/${eventId}` },
          { label: 'Ops Console', current: true },
        ]}
        actions={[
          {
            label: 'Volunteer Console',
            action: handleOpenVolunteerConsole,
            variant: 'primary',
          },
          {
            label: 'View Event Details',
            action: handleViewEventDetails,
            variant: 'secondary',
          },
        ]}
      />

      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top summary bar */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-500 mb-1">Total registrations</p>
              <p className="text-2xl font-semibold text-gray-900">{totalRegistrations}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-500 mb-1">Checked-in</p>
              <p className="text-2xl font-semibold text-green-600">{attendedCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-500 mb-1">Attendance rate</p>
              <p className="text-2xl font-semibold text-indigo-600">
                {checkInRate.toFixed(1)}%
              </p>
            </div>
          </section>

          {/* Main layout */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: Scanner + Attendance list */}
            <div className="space-y-6 lg:col-span-2">
              <QRCodeScanner eventId={eventId} />
              <AttendanceList eventId={eventId} />
            </div>

            {/* Right: Recent check-ins + volunteer helpers */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent check-ins</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Live feed of the most recent attendees checked in to this event.
                </p>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentCheckIns.length === 0 ? (
                    <p className="text-sm text-gray-500">No check-ins yet.</p>
                  ) : (
                    recentCheckIns.map((record) => {
                      const initials = (record.userName || '?')
                        .split(' ')
                        .map((n) => n.charAt(0).toUpperCase())
                        .slice(0, 2)
                        .join('');

                      return (
                        <div
                          key={record.registrationId}
                          className="flex items-start justify-between border border-gray-100 rounded-md px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    to={`/dashboard/profile/${record.userId}/public`}
                                    className="inline-flex flex-shrink-0 group"
                                  >
                                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold overflow-hidden ring-1 ring-transparent transition-all group-hover:ring-primary/40 group-hover:shadow-sm">
                                      {record.avatarUrl ? (
                                        <img
                                          src={record.avatarUrl}
                                          alt={`Avatar for ${record.userName}`}
                                          className="h-full w-full object-cover rounded-full transition-transform group-hover:scale-105"
                                        />
                                      ) : (
                                        <span>{initials}</span>
                                      )}
                                    </div>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">View public profile for {record.userName}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <div>
                              <p className="text-sm font-medium text-gray-900">{record.userName}</p>
                              <p className="text-xs text-gray-500">{record.userEmail}</p>
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <p>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</p>
                            <p className="mt-0.5">
                              {record.checkInMethod === 'QR_SCAN' ? 'QR scan' : 'Manual'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Volunteer coordination</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Share the Volunteer Console with on-site staff so they can scan QR codes, print badges,
                  and help manage the check-in line.
                </p>
                <button
                  onClick={handleOpenVolunteerConsole}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Open Volunteer Console
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
