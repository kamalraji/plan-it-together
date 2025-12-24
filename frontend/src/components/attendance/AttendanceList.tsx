import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { AttendanceReport } from '../../types';

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
  
  useQueryClient();

  // Fetch attendance report
  const { data: attendanceReport, isLoading, refetch } = useQuery<AttendanceReport>({
    queryKey: ['attendance-report', eventId, sessionId],
    queryFn: async () => {
      const url = sessionId 
        ? `/attendance/events/${eventId}/sessions/${sessionId}`
        : `/attendance/events/${eventId}/report`;
      const response = await api.get(url);
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Manual check-in mutation
  const manualCheckInMutation = useMutation({
    mutationFn: async (data: ManualCheckInData) => {
      const response = await api.post('/attendance/manual-check-in', data);
      return response.data.data;
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!attendanceReport) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Data</h3>
          <p className="text-gray-600">Unable to load attendance information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Attendance List</h3>
            <p className="text-sm text-gray-600 mt-1">
              {attendanceReport.attendedCount} of {attendanceReport.totalRegistrations} participants checked in
              ({attendanceReport.checkInRate.toFixed(1)}% attendance rate)
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <button
              onClick={() => refetch()}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <svg className="h-4 w-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowManualCheckIn(true)}
              className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Manual Check-in
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Participants</option>
              <option value="attended">Checked In</option>
              <option value="not_attended">Not Checked In</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="divide-y divide-gray-200">
        {filteredRecords.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">No participants match your search criteria.</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div key={record.registrationId} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{record.userName}</h4>
                      <p className="text-sm text-gray-600">{record.userEmail}</p>
                    </div>
                    <div className="ml-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.attended
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {record.attended ? 'Checked In' : 'Not Checked In'}
                      </span>
                    </div>
                  </div>
                  
                  {record.attended && record.checkInTime && (
                    <div className="mt-2 text-xs text-gray-500">
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

                <div className="ml-4 flex items-center space-x-2">
                  {record.attended ? (
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedRegistration(record.registrationId);
                        setShowManualCheckIn(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Check In
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Check-in Modal */}
      {showManualCheckIn && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Check-in</h3>
              
              <div className="mb-4">
                <label htmlFor="registration-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Participant
                </label>
                <select
                  id="registration-select"
                  value={selectedRegistration}
                  onChange={(e) => setSelectedRegistration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">
                    {(manualCheckInMutation.error as any)?.response?.data?.error?.message || 'Check-in failed'}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleManualCheckIn}
                  disabled={!selectedRegistration || manualCheckInMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {manualCheckInMutation.isPending ? 'Checking In...' : 'Check In'}
                </button>
                <button
                  onClick={() => {
                    setShowManualCheckIn(false);
                    setSelectedRegistration('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};