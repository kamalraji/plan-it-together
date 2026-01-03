import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceReport } from '../../types';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';
import { Search, RefreshCw, UserPlus, X } from 'lucide-react';

interface AttendanceListProps {
  eventId: string;
  sessionId?: string;
}

interface ManualCheckInData {
  registrationId: string;
  sessionId?: string;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  eventId,
  sessionId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attended' | 'not_attended'>('all');
  const [showManualCheckIn, setShowManualCheckIn] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<string>('');

  const { data: attendanceReport, isLoading, refetch } = useQuery<AttendanceReport>({
    queryKey: ['attendance-report', eventId, sessionId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('attendance-report', {
        body: { eventId, sessionId },
      });
      if (error || !data?.success) {
        throw error || new Error('Failed to load attendance');
      }
      return data.data as AttendanceReport;
    },
    refetchInterval: 5000,
  });

  const manualCheckInMutation = useMutation({
    mutationFn: async (data: ManualCheckInData) => {
      const { data: fnData, error } = await supabase.functions.invoke('attendance-manual-checkin', {
        body: data,
      });
      if (error || !fnData?.success) {
        throw error || new Error('Manual check-in failed');
      }
      return fnData.data;
    },

    onSuccess: () => {
      refetch();
      setShowManualCheckIn(false);
      setSelectedRegistration('');
    },
  });

  // Filter attendance records
  const filteredRecords = attendanceReport?.attendanceRecords.filter(record => {
    const matchesSearch = record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'attended' && record.attended) ||
                         (statusFilter === 'not_attended' && !record.attended);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleManualCheckIn = () => {
    if (!selectedRegistration) return;
    
    manualCheckInMutation.mutate({
      registrationId: selectedRegistration,
      sessionId,
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!attendanceReport) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-medium text-foreground mb-2">No Attendance Data</h3>
        <p className="text-muted-foreground">Unable to load attendance information.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="pb-4 border-b border-border mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">Attendance List</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {attendanceReport.attendedCount} of {attendanceReport.totalRegistrations} participants checked in
              ({attendanceReport.checkInRate.toFixed(1)}% attendance rate)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowManualCheckIn(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Manual Check-in</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Participants</option>
          <option value="attended">Checked In</option>
          <option value="not_attended">Not Checked In</option>
        </select>
      </div>

      {/* Attendance List */}
      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No participants match your search criteria.</p>
          </div>
          ) : (
            filteredRecords.map((record) => {
              const initials = (record.userName || '?')
                .split(' ')
                .map((n) => n.charAt(0).toUpperCase())
                .slice(0, 2)
                .join('');

              return (
                <div key={record.registrationId} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={`/dashboard/profile/${record.userId}/public`}
                              className="mr-3 inline-flex flex-shrink-0 group"
                            >
                              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold overflow-hidden ring-1 ring-transparent transition-all group-hover:ring-primary/40 group-hover:shadow-sm">
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

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">{record.userName}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{record.userEmail}</p>
                      </div>
                      <div className="ml-4 hidden sm:block">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.attended
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {record.attended ? 'Checked In' : 'Not Checked In'}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4 flex items-center space-x-2">
                      {record.attended ? (
                        <svg
                          className="h-5 w-5 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedRegistration(record.registrationId);
                            setShowManualCheckIn(true);
                          }}
                          className="text-primary hover:text-primary/80 text-sm font-medium"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>

                  {record.attended && record.checkInTime && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span>
                          Check-in: {new Date(record.checkInTime).toLocaleString()}
                        </span>
                        <span>
                          Method: {record.checkInMethod === 'QR_SCAN' ? 'QR Code' : 'Manual'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      {/* Manual Check-in Modal */}
      {showManualCheckIn && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-card w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Manual Check-in</h3>
              <button
                onClick={() => {
                  setShowManualCheckIn(false);
                  setSelectedRegistration('');
                }}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="mb-4">
              <label htmlFor="registration-select" className="block text-sm font-medium text-foreground mb-2">
                Select Participant
              </label>
              <select
                id="registration-select"
                value={selectedRegistration}
                onChange={(e) => setSelectedRegistration(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Choose a participant...</option>
                {attendanceReport.attendanceRecords
                  .filter(record => !record.attended)
                  .map((record) => (
                    <option key={record.registrationId} value={record.registrationId}>
                      {record.userName} ({record.userEmail})
                    </option>
                  ))}
              </select>
            </div>

            {manualCheckInMutation.isError && (
              <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">
                  {(manualCheckInMutation.error as any)?.response?.data?.error?.message || 'Check-in failed'}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleManualCheckIn}
                disabled={!selectedRegistration || manualCheckInMutation.isPending}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {manualCheckInMutation.isPending ? 'Checking In...' : 'Check In'}
              </button>
              <button
                onClick={() => {
                  setShowManualCheckIn(false);
                  setSelectedRegistration('');
                }}
                className="flex-1 bg-muted text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};