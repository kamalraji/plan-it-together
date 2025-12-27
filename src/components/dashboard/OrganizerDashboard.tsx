import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useVendorStatus } from '../../hooks/useVendorStatus';
import { MarketplaceOrganizerInterface } from '../marketplace';
import { useCurrentOrganization } from '../organization/OrganizationContext';
import { OrganizerOnboardingChecklist } from '../organization/OrganizerOnboardingChecklist';

interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  registrationCount: number;
  capacity?: number;
}

interface WorkspaceSummary {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  event?: { id: string; name: string } | null;
}
 
export function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const organization = useCurrentOrganization();
  const { isVendor, isLoading: vendorLoading } = useVendorStatus(user?.id || '');
  const [activeTab, setActiveTab] = useState<'events' | 'analytics' | 'marketplace' | 'profile'>('events');
  const [, setShowProfilePrompt] = useState(false);

  // Check if profile completion is needed (Requirements 2.4, 2.5)
  const isProfileIncomplete = !user?.profileCompleted || 
    !user?.bio || 
    !user?.organization;

  const { data: events, isLoading } = useQuery({
    queryKey: ['organizer-events', organization.id],
    queryFn: async () => {
      const response = await api.get('/events/my-events', {
        params: { organizationId: organization.id },
      });
      return response.data.events as Event[];
    },
  });
 
  const { data: workspaces } = useQuery({
    queryKey: ['organizer-workspaces', organization.id],
    queryFn: async () => {
      const response = await api.get('/workspaces/my-workspaces', {
        params: { orgSlug: organization.slug },
      });
      return response.data.workspaces as WorkspaceSummary[];
    },
  });
 
  const { data: analytics } = useQuery({
    queryKey: ['organizer-analytics', organization.id],
    queryFn: async () => {
      const response = await api.get('/analytics/organizer-summary', {
        params: { organizationId: organization.id },
      });
      return response.data;
    },
  });

  const topWorkspaces = useMemo(() => {
    if (!workspaces) return [];
    return [...workspaces]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [workspaces]);
 
  const upcomingMilestones = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    return [...events]
      .filter((event) => new Date(event.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 3);
  }, [events]);
 
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
       {/* Header */}
       <header className="bg-card shadow">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-center py-6">
             <div>
               <h1 className="text-3xl font-bold text-foreground">Organizer Dashboard</h1>
               <p className="text-muted-foreground">Welcome back, {user?.name}</p>
             </div>
             <div className="flex items-center space-x-4">
               {!vendorLoading && (
                 <Link
                   to={isVendor ? "/vendor/dashboard" : "/vendor/register"}
                   className="text-primary hover:text-primary/80 transition-colors font-medium"
                 >
                   {isVendor ? "Vendor Dashboard" : "Become a Vendor"}
                 </Link>
               )}
               <Link
                 to="/events/create"
                 className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
               >
                 Create Event
               </Link>
               <button
                 onClick={logout}
                 className="text-muted-foreground hover:text-foreground transition-colors"
               >
                 Logout
               </button>
             </div>
           </div>
         </div>
       </header>

      {/* Navigation Tabs */}
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="border-b border-border">
           <nav className="-mb-px flex space-x-8">
             {[
               { key: 'events', label: 'My Events' },
               { key: 'analytics', label: 'Analytics' },
               { key: 'marketplace', label: 'Marketplace' },
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
         {/* Onboarding Checklist */}
         <div className="mb-6">
           <OrganizerOnboardingChecklist />
         </div>
 
         {/* Organizer overview widgets */}
         <div className="mb-8 grid gap-6 lg:grid-cols-3">
           <div className="bg-card rounded-lg shadow p-6">
             <h2 className="text-lg font-semibold text-foreground mb-3">Top Workspaces</h2>
             {topWorkspaces.length > 0 ? (
               <ul className="space-y-3 text-sm text-muted-foreground">
                 {topWorkspaces.map((ws) => (
                   <li key={ws.id} className="flex items-center justify-between">
                     <div>
                       <div className="font-medium text-foreground">{ws.name}</div>
                       {ws.event && (
                         <div className="text-xs text-muted-foreground">Event: {ws.event.name}</div>
                       )}
                     </div>
                     <Link
                       to={`/${organization.slug}/workspaces/${ws.id}`}
                       className="text-primary hover:text-primary/80 text-xs font-medium"
                     >
                       Open
                     </Link>
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-sm text-muted-foreground">No workspaces yet for this organization.</p>
             )}
           </div>
 
           <div className="bg-card rounded-lg shadow p-6">
             <h2 className="text-lg font-semibold text-foreground mb-3">Upcoming Event Milestones</h2>
             {upcomingMilestones.length > 0 ? (
               <ul className="space-y-3 text-sm text-muted-foreground">
                 {upcomingMilestones.map((event) => (
                   <li key={event.id} className="flex items-center justify-between">
                     <div>
                       <div className="font-medium text-foreground">{event.name}</div>
                       <div className="text-xs text-muted-foreground">
                         Starts {new Date(event.startDate).toLocaleDateString()}
                       </div>
                     </div>
                     <Link
                       to={`/events/${event.id}`}
                       className="text-primary hover:text-primary/80 text-xs font-medium"
                     >
                       View
                     </Link>
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
             )}
           </div>
 
           <div className="bg-card rounded-lg shadow p-6">
             <h2 className="text-lg font-semibold text-foreground mb-3">Quick Links</h2>
             <div className="space-y-3 text-sm">
               <Link
                 to={`/${organization.slug}/workspaces`}
                 className="block w-full text-left px-4 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 font-medium"
               >
                 Go to Workspaces
               </Link>
               <Link
                 to="/dashboard/organizations"
                 className="block w-full text-left px-4 py-2 rounded-md bg-muted text-foreground hover:bg-muted/80 font-medium"
               >
                 Manage Organizations
               </Link>
             </div>
           </div>
         </div>
 
         {/* Profile Completion Prompt (Requirements 2.4, 2.5) */}
         {isProfileIncomplete && (
           <div className="mb-6 bg-amber-50 border border-amber-200 rounded-md p-4">
             <div className="flex">
               <div className="flex-shrink-0">
                 <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
               </div>
               <div className="ml-3">
                 <h3 className="text-sm font-medium text-amber-800">
                   Complete Your Profile
                 </h3>
                 <div className="mt-2 text-sm text-amber-700">
                   <p>
                     Complete your organizer profile to unlock all dashboard features and improve your event management experience.
                   </p>
                 </div>
                 <div className="mt-4">
                   <div className="-mx-2 -my-1.5 flex">
                     <Link
                       to="/complete-profile"
                       className="bg-amber-50 px-2 py-1.5 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-600"
                     >
                       Complete Profile
                     </Link>
                     <button
                       type="button"
                       onClick={() => setShowProfilePrompt(false)}
                       className="ml-3 bg-amber-50 px-2 py-1.5 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-600"
                     >
                       Dismiss
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}

        {activeTab === 'events' && (
           <div>
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-foreground">My Events</h2>
               <Link
                 to={`/${organization.slug}/eventmanagement/create`}
                 className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
               >
                 Create New Event
               </Link>
             </div>

            {events && events.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {event.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p>Start: {new Date(event.startDate).toLocaleDateString()}</p>
                      <p>End: {new Date(event.endDate).toLocaleDateString()}</p>
                      <p>Status: <span className="capitalize">{event.status}</span></p>
                      <p>
                        Registrations: {event.registrationCount}
                        {event.capacity && ` / ${event.capacity}`}
                      </p>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Link
                        to={`/events/${event.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View Details
                      </Link>
                      <Link
                        to={`/events/${event.id}/edit`}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <Link
                         to={`/${organization.slug}/workspaces?eventId=${event.id}`}
                         className="text-green-600 hover:text-green-800 text-sm font-medium"
                       >
                         Event Workspace
                       </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No events yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first event.
                </p>
                <Link
                  to="/events/create"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Create Your First Event
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
           <div>
             <h2 className="text-2xl font-bold text-foreground mb-6">Analytics Overview</h2>
             {analytics ? (
               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 <div className="bg-card rounded-lg shadow p-6">
                   <h3 className="text-lg font-semibold text-foreground mb-2">
                     Total Events
                   </h3>
                   <p className="text-3xl font-bold text-primary">
                     {analytics.totalEvents || 0}
                   </p>
                 </div>
                 <div className="bg-card rounded-lg shadow p-6">
                   <h3 className="text-lg font-semibold text-foreground mb-2">
                     Total Registrations
                   </h3>
                   <p className="text-3xl font-bold text-emerald-500">
                     {analytics.totalRegistrations || 0}
                   </p>
                 </div>
                 <div className="bg-card rounded-lg shadow p-6">
                   <h3 className="text-lg font-semibold text-foreground mb-2">
                     Active Events
                   </h3>
                   <p className="text-3xl font-bold text-sky-500">
                     {analytics.activeEvents || 0}
                   </p>
                 </div>
                 <div className="bg-card rounded-lg shadow p-6">
                   <h3 className="text-lg font-semibold text-foreground mb-2">
                     Certificates Issued
                   </h3>
                   <p className="text-3xl font-bold text-violet-500">
                     {analytics.certificatesIssued || 0}
                   </p>
                 </div>
               </div>
             ) : (
               <div className="text-center py-12">
                 <p className="text-muted-foreground">Loading analytics...</p>
               </div>
             )}
           </div>
         )}

        {activeTab === 'marketplace' && (
          <MarketplaceOrganizerInterface />
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
            
            {/* Profile Completion Status */}
            <div className="mb-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Completion</h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Profile completeness</span>
                    <span>{isProfileIncomplete ? '60%' : '100%'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isProfileIncomplete ? 'bg-yellow-400' : 'bg-green-500'}`}
                      style={{ width: isProfileIncomplete ? '60%' : '100%' }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    isProfileIncomplete 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isProfileIncomplete ? 'Incomplete' : 'Complete'}
                  </span>
                </div>
              </div>
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