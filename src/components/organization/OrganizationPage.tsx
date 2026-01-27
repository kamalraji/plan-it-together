import React, { useState, useEffect } from 'react';
import { Organization, Event, User } from '../../types';
import api from '../../lib/api';

interface OrganizationPageProps {
  organizationId: string;
  currentUser?: User;
}

interface OrganizationPageData {
  organization: Organization;
  events: Event[];
  isFollowing: boolean;
}

const OrganizationPage: React.FC<OrganizationPageProps> = ({
  organizationId,
  currentUser
}) => {
  const [data, setData] = useState<OrganizationPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchOrganizationData();
  }, [organizationId]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [orgResponse, eventsResponse, followResponse] = await Promise.all([
        api.get(`/organizations/${organizationId}`),
        api.get(`/discovery/organizations/${organizationId}/events`),
        currentUser ? api.get(`/discovery/organizations/${organizationId}/following-status`) : Promise.resolve({ data: { isFollowing: false } })
      ]);

      setData({
        organization: orgResponse.data.data,
        events: eventsResponse.data.data,
        isFollowing: followResponse.data.data.isFollowing
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !data) return;

    try {
      setFollowLoading(true);
      
      if (data.isFollowing) {
        await api.delete(`/discovery/${organizationId}/follow`);
      } else {
        await api.post(`/discovery/${organizationId}/follow`);
      }

      setData({
        ...data,
        isFollowing: !data.isFollowing,
        organization: {
          ...data.organization,
          followerCount: data.isFollowing 
            ? data.organization.followerCount - 1 
            : data.organization.followerCount + 1
        }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const getUpcomingEvents = () => {
    if (!data) return [];
    const now = new Date();
    return data.events
      .filter(event => new Date(event.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  const getPastEvents = () => {
    if (!data) return [];
    const now = new Date();
    return data.events
      .filter(event => new Date(event.startDate) < now)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending Verification
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'COLLEGE':
        return 'bg-blue-100 text-blue-800';
      case 'COMPANY':
        return 'bg-purple-100 text-purple-800';
      case 'INDUSTRY':
        return 'bg-green-100 text-green-800';
      case 'NON_PROFIT':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50">
        <div className="animate-pulse">
          <div className="h-64 bg-muted"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Organization Not Found</h2>
          <p className="text-muted-foreground">{error || 'The organization you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  const { organization, isFollowing } = data;
  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Banner Section */}
      <div 
        className="h-64 bg-gradient-to-r from-blue-600 to-purple-600 relative"
        style={{
          backgroundImage: organization.branding.bannerUrl ? `url(${organization.branding.bannerUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      {/* Organization Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-32 pb-8">
          <div className="bg-card rounded-lg shadow-lg p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                {organization.branding.logoUrl ? (
                  <img
                    src={organization.branding.logoUrl}
                    alt={organization.name}
                    className="w-24 h-24 rounded-lg object-cover border-4 border-background shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center border-4 border-background shadow-lg">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {organization.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Organization Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">{organization.name}</h1>
                      {getVerificationBadge(organization.verificationStatus)}
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(organization.category)}`}>
                        {organization.category.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {organization.followerCount} followers
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {organization.eventCount} events
                      </span>
                    </div>

                    <p className="text-muted-foreground max-w-2xl">{organization.description}</p>
                  </div>

                  {/* Follow Button */}
                  {currentUser && (
                    <div className="mt-4 sm:mt-0">
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                          isFollowing
                            ? 'bg-muted text-foreground hover:bg-muted focus:ring-ring'
                            : 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-ring'
                        }`}
                      >
                        {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {Object.keys(organization.socialLinks).length > 0 && (
                  <div className="flex items-center space-x-4 mt-4">
                    {Object.entries(organization.socialLinks).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-muted-foreground"
                      >
                        <span className="sr-only">{platform}</span>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="pb-12">
          <div className="bg-card rounded-lg shadow">
            {/* Tab Navigation */}
            <div className="border-b border-border">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'upcoming'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
                  }`}
                >
                  Upcoming Events ({upcomingEvents.length})
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'past'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
                  }`}
                >
                  Past Events ({pastEvents.length})
                </button>
              </nav>
            </div>

            {/* Events List */}
            <div className="p-6">
              {activeTab === 'upcoming' && (
                <div className="space-y-6">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-foreground">No upcoming events</h3>
                      <p className="mt-1 text-sm text-muted-foreground">This organization hasn't scheduled any upcoming events yet.</p>
                    </div>
                  ) : (
                    upcomingEvents.map((event) => (
                      <div key={event.id} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">{event.name}</h3>
                            <p className="text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(event.startDate)}
                              </div>
                              
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {event.mode}
                              </div>

                              {event.capacity && (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {event.capacity} capacity
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ml-6">
                            <a
                              href={`/events/${event.id}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus-visible:ring-ring"
                            >
                              View Event
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'past' && (
                <div className="space-y-6">
                  {pastEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-foreground">No past events</h3>
                      <p className="mt-1 text-sm text-muted-foreground">This organization hasn't hosted any events yet.</p>
                    </div>
                  ) : (
                    pastEvents.map((event) => (
                      <div key={event.id} className="border border-border rounded-lg p-6 opacity-75">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">{event.name}</h3>
                            <p className="text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(event.startDate)}
                              </div>
                              
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {event.mode}
                              </div>

                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                                Completed
                              </span>
                            </div>
                          </div>

                          <div className="ml-6">
                            <a
                              href={`/events/${event.id}`}
                              className="bg-muted-foreground/40 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              View Event
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationPage;