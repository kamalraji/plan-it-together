import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { QRCodeScanner } from './QRCodeScanner';
import { AttendanceList } from './AttendanceList';
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

  // Fetch event details
  const { data: event } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}`);
      return response.data.data;
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
    setRecentCheckIns(prev => [result, ...prev.slice(0, 4)]);
  };

  const handleScanError = (error: string) => {
    console.error('Scan error:', error);
  };

  if (!event) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Check-in</h1>
        <p className="text-lg text-gray-600">{event.name}</p>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
          </div>
          <div className="mt-2 sm:mt-0">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              event.status === 'ONGOING' 
                ? 'bg-green-100 text-green-800'
                : event.status === 'PUBLISHED'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {event.status}
            </span>
          </div>
        </div>
      </div>

      {/* Session Selection */}
      <div className="mb-6">
        <label htmlFor="session-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Session (Optional)
        </label>
        <select
          id="session-select"
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.name}
              {session.startTime && ` (${session.startTime} - ${session.endTime})`}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Leave as "General Event" for overall event check-in, or select a specific session
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scanner'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              QR Scanner
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Attendance List
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Check-ins */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Check-ins</h3>
            {recentCheckIns.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent check-ins</p>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn, index) => (
                  <div key={`${checkIn.id}-${index}`} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <svg className="h-5 w-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Check-in Successful</p>
                      <p className="text-xs text-gray-600">
                        {new Date(checkIn.checkInTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Event Status:</span>
                <span className="text-sm font-medium text-gray-900">{event.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Mode:</span>
                <span className="text-sm font-medium text-gray-900">{event.mode}</span>
              </div>
              {event.capacity && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Capacity:</span>
                  <span className="text-sm font-medium text-gray-900">{event.capacity}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Selected Session:</span>
                <span className="text-sm font-medium text-gray-900">
                  {sessions.find(s => s.id === selectedSession)?.name || 'General Event'}
                </span>
              </div>
            </div>
          </div>

          {/* Help & Tips */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Tips for Volunteers</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start">
                <svg className="h-4 w-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Use the QR scanner for fastest check-in</span>
              </div>
              <div className="flex items-start">
                <svg className="h-4 w-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>If QR code won't scan, use manual entry</span>
              </div>
              <div className="flex items-start">
                <svg className="h-4 w-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Check attendance list for manual check-ins</span>
              </div>
              <div className="flex items-start">
                <svg className="h-4 w-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Green = success, Red = error or duplicate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};