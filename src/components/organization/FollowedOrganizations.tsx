import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { HeartIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useFollowedOrganizations } from '@/hooks/useOrganization';
import { organizationService } from '@/services/organizationService';
import { useAuth } from '../../hooks/useAuth';
import type { DirectoryOrganization } from './OrganizationDirectory';

interface FollowedOrganizationsProps {
  className?: string;
}

export default function FollowedOrganizations({ className = '' }: FollowedOrganizationsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: followedOrganizations, isLoading, error } = useFollowedOrganizations(user?.id || '');

  const unfollowMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      await organizationService.unfollowOrganization(organizationId);
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['organizations', 'followed', user.id] });
      }
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
  organization: DirectoryOrganization;
  onUnfollow: () => void;
  isUnfollowing: boolean;
}

function FollowedOrganizationCard({
  organization,
  onUnfollow,
  isUnfollowing
}: FollowedOrganizationCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Organization Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Link to={`/${organization.slug}`} className="flex items-center">
              <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                {organization.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-4">
                <div className="flex items-center">
                  <h2 className="text-xl font-semibold text-gray-900 hover:text-indigo-600">
                    {organization.name}
                  </h2>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <UsersIcon className="h-4 w-4 mr-1" />
                  {organization.follower_count} followers
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
        </div >

        {/* Organization Description */}
        {
          organization.description && (
            <p className="mt-4 text-gray-600 text-sm line-clamp-2">
              {organization.description}
            </p>
          )
        }
      </div >

      {/* Events Section */}
      < div className="p-6" >
        <div className="text-center py-4 text-gray-500 flex flex-col items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-gray-400" />
          <p className="text-sm">
            Event updates from this organization are available on their public page.
          </p>
          <Link
            to={`/${organization.slug}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            View upcoming events
          </Link>
        </div>
      </div >
    </div >
  );
}
