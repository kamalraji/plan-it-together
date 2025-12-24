import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  HeartIcon,
  CalendarIcon,
  CheckBadgeIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import api from '../../lib/api';
import { Organization, Event, OrganizationCategory } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface FollowedOrganizationsProps {
  className?: string;
}

interface FollowedOrganization extends Organization {
  latestEvents: Event[];
}

const categoryIcons = {
  [OrganizationCategory.COLLEGE]: '🎓',
  [OrganizationCategory.COMPANY]: '🏢',
  [OrganizationCategory.INDUSTRY]: '🏭',
  [OrganizationCategory.NON_PROFIT]: '❤️',
};

const categoryLabels = {
  [OrganizationCategory.COLLEGE]: 'College',
  [OrganizationCategory.COMPANY]: 'Company',
  [OrganizationCategory.INDUSTRY]: 'Industry',
  [OrganizationCategory.NON_PROFIT]: 'Non-Profit',
};

export default function FollowedOrganizations({ className = '' }: FollowedOrganizationsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: followedOrganizations, isLoading, error } = useQuery({
    queryKey: ['followed-organizations', user?.id],
    queryFn: async () => {
      const response = await api.get('/discovery/following');
      return response.data.data as FollowedOrganization[];
    },
    enabled: !!user,
  });

  const unfollowMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      await api.delete(`/discovery/${organizationId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followed-organizations'] });
    },
  });

  const handleUnfollow = async (organizationId: string, organizationName: string) => {
    if (window.confirm(`Are you sure you want to unfollow ${organizationName}?`)) {
      try {
        await unfollowMutation.mutateAsync(organizationId);
      } catch (error) {
        console.error('Failed to unfollow organization:', error);
      }
    }
  };

  if (!user) {
    return (
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
        <div className="text-center py-12">
          <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sign in required</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please sign in to view your followed organizations.
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Followed Organizations</h1>
        <p className="text-gray-600">
          Stay updated with events from organizations you follow
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">Error loading followed organizations. Please try again.</p>
        </div>
      ) : !followedOrganizations || followedOrganizations.length === 0 ? (
        <div className="text-center py-12">
          <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No followed organizations</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start following organizations to see their latest events here.
          </p>
          <div className="mt-6">
            <Link
              to="/organizations"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Discover Organizations
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {followedOrganizations.map((organization) => (
            <FollowedOrganizationCard
              key={organization.id}
              organization={organization}
              onUnfollow={() => handleUnfollow(organization.id, organization.name)}
              isUnfollowing={unfollowMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FollowedOrganizationCardProps {
  organization: FollowedOrganization;
  onUnfollow: () => void;
  isUnfollowing: boolean;
}

function FollowedOrganizationCard({ 
  organization, 
  onUnfollow, 
  isUnfollowing 
}: FollowedOrganizationCardProps) {
  const isEventUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const upcomingEvents = organization.latestEvents.filter(event => 
    isEventUpcoming(event.startDate)
  );

  const pastEvents = organization.latestEvents.filter(event => 
    !isEventUpcoming(event.startDate)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Organization Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Link to={`/organizations/${organization.id}`} className="flex items-center">
              {organization.branding?.logoUrl ? (
                <img
                  src={organization.branding.logoUrl}
                  alt={`${organization.name} logo`}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                  {categoryIcons[organization.category]}
                </div>
              )}
              <div className="ml-4">
                <div className="flex items-center">
                  <h2 className="text-xl font-semibold text-gray-900 hover:text-indigo-600">
                    {organization.name}
                  </h2>
                  {organization.verificationStatus === 'VERIFIED' && (
                    <CheckBadgeIcon className="h-5 w-5 text-blue-500 ml-2" title="Verified Organization" />
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span>{categoryLabels[organization.category]}</span>
                  <span className="mx-2">•</span>
                  <UsersIcon className="h-4 w-4 mr-1" />
                  {organization.followerCount} followers
                </div>
              </div>
            </Link>
          </div>

          {/* Unfollow Button */}
          <button
            onClick={onUnfollow}
            disabled={isUnfollowing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Unfollow organization"
          >
            {isUnfollowing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              <>
                <HeartSolidIcon className="h-4 w-4 text-red-500 mr-2" />
                Following
              </>
            )}
          </button>
        </div>

        {/* Organization Description */}
        {organization.description && (
          <p className="mt-4 text-gray-600 text-sm line-clamp-2">
            {organization.description}
          </p>
        )}
      </div>

      {/* Events Section */}
      <div className="p-6">
        {organization.latestEvents.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No recent events</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h3>
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <EventItem key={event.id} event={event} isUpcoming={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h3>
                <div className="space-y-3">
                  {pastEvents.slice(0, 2).map((event) => (
                    <EventItem key={event.id} event={event} isUpcoming={false} />
                  ))}
                </div>
              </div>
            )}

            {/* View All Events Link */}
            <div className="pt-4 border-t border-gray-200">
              <Link
                to={`/organizations/${organization.id}`}
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                View all events from {organization.name} →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface EventItemProps {
  event: Event;
  isUpcoming: boolean;
}

function EventItem({ event, isUpcoming }: EventItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEventModeColor = (mode: string) => {
    switch (mode) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      case 'OFFLINE':
        return 'bg-blue-100 text-blue-800';
      case 'HYBRID':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link
      to={`/events/${event.id}`}
      className="block p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {event.name}
            </h4>
            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEventModeColor(event.mode)}`}>
              {event.mode.toLowerCase()}
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <CalendarIcon className="h-3 w-3 mr-1" />
            <span>
              {formatDate(event.startDate)}
              {event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
            </span>
            {!isUpcoming && (
              <span className="ml-2 text-gray-400">(Past)</span>
            )}
          </div>
          {event.description && (
            <p className="mt-1 text-xs text-gray-600 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}