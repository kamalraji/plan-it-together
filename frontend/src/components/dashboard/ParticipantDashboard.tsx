import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

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

export function ParticipantDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'events' | 'certificates' | 'profile'>('events');
  const [, _setSelectedEventId] = useState<string | null>(null);

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['participant-registrations'],
    queryFn: async () => {
      const response = await api.get('/registrations/my-registrations');
      return response.data.registrations as Registration[];
    },
  });

  const { data: certificates } = useQuery({
    queryKey: ['participant-certificates'],
    queryFn: async () => {
      const response = await api.get('/certificates/my-certificates');
      return response.data.certificates;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const generateQRCode = (qrCode: string) => {
    // This would typically generate a QR code image
    // For now, we'll just display the code
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

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
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
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Registered Events</h2>
              <div className="text-sm text-gray-500">
                {registrations?.length || 0} event{(registrations?.length || 0) !== 1 ? 's' : ''} registered
              </div>
            </div>

            {registrations && registrations.length > 0 ? (
              <div className="space-y-6">
                {registrations.map((registration) => (
                  <div key={registration.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Event Header */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {registration.event.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(registration.event.startDate).toLocaleDateString()} - {new Date(registration.event.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            registration.status === 'CONFIRMED' 
                              ? 'bg-green-100 text-green-800'
                              : registration.status === 'WAITLISTED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {registration.status}
                          </span>
                          {registration.attendance && (
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Checked In
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-gray-600 text-sm mb-4">
                            {registration.event.description}
                          </p>
                          
                          {/* Event Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Start Time:</span>
                                <span className="text-gray-900">{new Date(registration.event.startDate).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">End Time:</span>
                                <span className="text-gray-900">{new Date(registration.event.endDate).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Event Mode:</span>
                                <span className="text-gray-900 capitalize">{registration.event.mode.toLowerCase()}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Registered:</span>
                                <span className="text-gray-900">{new Date(registration.registeredAt).toLocaleDateString()}</span>
                              </div>
                              {registration.attendance && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Checked In:</span>
                                  <span className="text-gray-900">{new Date(registration.attendance.checkInTime).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Location/Virtual Links */}
                          {registration.event.venue && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-start">
                                <svg className="h-5 w-5 text-gray-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Venue</p>
                                  <p className="text-sm text-gray-600">{registration.event.venue.address}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {registration.event.virtualLinks && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-start">
                                <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Virtual Meeting</p>
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
                        </div>

                        {/* QR Code Section - Requirements 3.5 */}
                        {registration.status === 'CONFIRMED' && (
                          <div className="ml-6 text-center bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Check-in QR Code</h4>
                            <div className="bg-white p-2 rounded border">
                              <img 
                                src={generateQRCode(registration.qrCode)}
                                alt="QR Code for check-in"
                                className="w-24 h-24"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 mb-3">Show this at the event for check-in</p>
                            <div className="space-y-2">
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.download = `qr-code-${registration.event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.svg`;
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
                                      url: generateQRCode(registration.qrCode)
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
                          <div className="ml-6 text-center bg-yellow-50 p-4 rounded-lg">
                            <div className="text-yellow-600 mb-2">
                              <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-medium text-yellow-800 mb-1">On Waitlist</h4>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-4h8v4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Events Registered
                </h3>
                <p className="text-gray-600 mb-4">
                  You haven't registered for any events yet. Browse available events to get started.
                </p>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                  Browse Events
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Certificates</h2>
            {certificates && certificates.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {certificates.map((certificate: any) => (
                  <div key={certificate.id} className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {certificate.event.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Certificate Type: {certificate.type}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
                    </p>
                    <div className="flex space-x-2">
                      <a
                        href={certificate.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Download PDF
                      </a>
                      <a
                        href={`/verify-certificate/${certificate.certificateId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        Verify
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No certificates yet
                </h3>
                <p className="text-gray-600">
                  Certificates will appear here once you complete events.
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
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.organization || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user?.website ? (
                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                          {user.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Status</label>
                    <p className="mt-1 text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user?.emailVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
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
                  <label className="block text-sm font-medium text-gray-700 mb-3">Social Links</label>
                  <div className="flex space-x-4">
                    {user.socialLinks.linkedin && (
                      <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                        LinkedIn
                      </a>
                    )}
                    {user.socialLinks.twitter && (
                      <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                        Twitter
                      </a>
                    )}
                    {user.socialLinks.github && (
                      <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}