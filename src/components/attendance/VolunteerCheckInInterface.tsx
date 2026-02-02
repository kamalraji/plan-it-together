import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeScanner } from './QRCodeScanner';
import { AttendanceList } from './AttendanceList';
import { CheckInSkeleton } from './CheckInSkeleton';
import { Event, AttendanceRecord } from '../../types';

interface VolunteerCheckInInterfaceProps {
  eventId: string;
}

interface EventSession {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export const VolunteerCheckInInterface: React.FC<VolunteerCheckInInterfaceProps> = ({
  eventId,
}) => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'list'>('scanner');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [recentCheckIns, setRecentCheckIns] = useState<AttendanceRecord[]>([]);
  const queryClient = useQueryClient();

  // Fetch event details from Supabase
  const { data: event } = useQuery<Event | null>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (error || !data) {
        throw error || new Error('Event not found');
      }

      // Map Supabase row (snake_case) to frontend Event shape (camelCase)
      const mappedEvent: Event = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        mode: data.mode as Event['mode'],
        startDate: data.start_date,
        endDate: data.end_date,
        capacity: data.capacity ?? undefined,
        registrationDeadline: undefined,
        organizerId: data.organization_id || '',
        organizationId: data.organization_id || undefined,
        visibility: data.visibility as Event['visibility'],
        inviteLink: null,
        branding: { primaryColor: undefined, secondaryColor: undefined },
        venue: undefined,
        virtualLinks: undefined,
        status: data.status as Event['status'],
        landingPageUrl: '',
        timeline: undefined,
        agenda: undefined,
        prizes: undefined,
        sponsors: undefined,
        organization: undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return mappedEvent;
    },
  });

  // Mock sessions data (in a real app, this would come from the event timeline)
  const sessions: EventSession[] = [
    { id: '', name: 'General Event', startTime: '', endTime: '' },
    { id: 'session-1', name: 'Opening Ceremony', startTime: '09:00', endTime: '10:00' },
    { id: 'session-2', name: 'Workshop 1', startTime: '10:30', endTime: '12:00' },
    { id: 'session-3', name: 'Lunch Break', startTime: '12:00', endTime: '13:00' },
    { id: 'session-4', name: 'Workshop 2', startTime: '13:00', endTime: '14:30' },
    { id: 'session-5', name: 'Closing Ceremony', startTime: '15:00', endTime: '16:00' },
  ];

  const handleScanSuccess = (result: AttendanceRecord) => {
    // Add to recent check-ins
    setRecentCheckIns((prev) => [result, ...prev.slice(0, 4)]);
  };

  const handleScanError = (_error: string) => {
    // Scan error is handled by the QRCodeScanner component UI
  };

  // Realtime updates for recent check-ins and attendance list
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`attendance_events_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newRecord = payload.new as any;
          const attendance: AttendanceRecord = {
            id: newRecord.id,
            registrationId: newRecord.registration_id,
            sessionId: newRecord.session_id,
            checkInTime: newRecord.check_in_time,
            checkInMethod: newRecord.check_in_method,
            volunteerId: newRecord.volunteer_id,
          };

          setRecentCheckIns((prev) => [attendance, ...prev.slice(0, 4)]);
          queryClient.invalidateQueries({ queryKey: ['attendance-report', eventId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);

  if (!event) {
    return <CheckInSkeleton />;
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="rounded-xl bg-card border border-border p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">Volunteer Check-in</h1>
          <p className="text-sm sm:text-lg text-muted-foreground">{event.name}</p>
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-xs sm:text-sm text-muted-foreground">
              {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
            </div>
            <div>
              <span className={`inline-flex px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-full ${
                event.status === 'ONGOING' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : event.status === 'PUBLISHED'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {event.status}
              </span>
            </div>
          </div>
        </div>

        {/* Session Selection */}
        <div className="rounded-xl bg-card border border-border p-4 sm:p-6 mb-4 sm:mb-6">
          <label htmlFor="session-select" className="block text-sm font-medium text-foreground mb-2">
            Select Session (Optional)
          </label>
          <select
            id="session-select"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full sm:max-w-xs px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
                {session.startTime && ` (${session.startTime} - ${session.endTime})`}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Leave as "General Event" for overall event check-in, or select a specific session
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 sm:mb-6 rounded-xl bg-card border border-border overflow-hidden">
          <div className="border-b border-border px-4 sm:px-6">
            <nav className="-mb-px flex gap-1 sm:gap-4 overflow-x-auto py-1">
              <button
                onClick={() => setActiveTab('scanner')}
                className={`py-2.5 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'scanner'
                    ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                QR Scanner
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2.5 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'list'
                    ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Attendance List
              </button>
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
              {activeTab === 'scanner' && (
                <QRCodeScanner
                  eventId={eventId}
                  sessionId={selectedSession || undefined}
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                />
              )}
              
              {activeTab === 'list' && (
                <AttendanceList
                  eventId={eventId}
                  sessionId={selectedSession || undefined}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Recent Check-ins */}
            <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Recent Check-ins</h3>
              {recentCheckIns.length === 0 ? (
                <p className="text-muted-foreground text-xs sm:text-sm">No recent check-ins</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {recentCheckIns.map((checkIn, index) => (
                    <div key={`${checkIn.id}-${index}`} className="flex items-center p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground">Check-in Successful</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {new Date(checkIn.checkInTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Quick Stats</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Event Status:</span>
                  <span className="text-xs sm:text-sm font-medium text-foreground">{event.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Mode:</span>
                  <span className="text-xs sm:text-sm font-medium text-foreground">{event.mode}</span>
                </div>
                {event.capacity && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Capacity:</span>
                    <span className="text-xs sm:text-sm font-medium text-foreground">{event.capacity}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Selected Session:</span>
                  <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[120px]">
                    {sessions.find(s => s.id === selectedSession)?.name || 'General Event'}
                  </span>
                </div>
              </div>
            </div>

            {/* Help & Tips */}
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4">Tips for Volunteers</h3>
              <div className="space-y-2 text-xs sm:text-sm text-primary/80">
                <div className="flex items-start">
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Use the QR scanner for fastest check-in</span>
                </div>
                <div className="flex items-start">
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>If QR code won't scan, use manual entry</span>
                </div>
                <div className="flex items-start">
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Check attendance list for manual check-ins</span>
                </div>
                <div className="flex items-start">
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Green = success, Red = error or duplicate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};