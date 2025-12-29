import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ShoppingBagIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { SearchResult } from './SearchPage';

interface SearchResultCardProps {
  result: SearchResult;
  className?: string;
  showRelevanceScore?: boolean;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  className = '',
  showRelevanceScore = true,
}) => {
  const navigate = useNavigate();

  const getTypeIcon = (type: string) => {
    const icons = {
      event: CalendarIcon,
      workspace: UserGroupIcon,
      organization: BuildingOfficeIcon,
      marketplace: ShoppingBagIcon,
      user: UserIcon,
      service: ShoppingBagIcon,
    };
    return icons[type as keyof typeof icons] || CalendarIcon;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      event: 'text-blue-600 bg-blue-50 border-blue-200',
      workspace: 'text-green-600 bg-green-50 border-green-200',
      organization: 'text-purple-600 bg-purple-50 border-purple-200',
      marketplace: 'text-orange-600 bg-orange-50 border-orange-200',
      user: 'text-gray-600 bg-gray-50 border-gray-200',
      service: 'text-orange-600 bg-orange-50 border-orange-200',
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-700 bg-green-100',
      upcoming: 'text-blue-700 bg-blue-100',
      completed: 'text-gray-700 bg-gray-100',
      draft: 'text-yellow-700 bg-yellow-100',
      cancelled: 'text-red-700 bg-red-100',
    };
    return colors[status as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  const formatMetadata = () => {
    const { metadata, type } = result;
    if (!metadata) return null;

    const items = [];

    switch (type) {
      case 'event':
        if (metadata.attendees) {
          items.push(
            <div key="attendees" className="flex items-center space-x-1 text-gray-500">
              <UserGroupIcon className="h-3 w-3" />
              <span>{metadata.attendees} attendees</span>
            </div>
          );
        }
        if (metadata.location) {
          items.push(
            <div key="location" className="flex items-center space-x-1 text-gray-500">
              <MapPinIcon className="h-3 w-3" />
              <span>{metadata.location}</span>
            </div>
          );
        }
        if (metadata.date) {
          items.push(
            <div key="date" className="flex items-center space-x-1 text-gray-500">
              <CalendarIcon className="h-3 w-3" />
              <span>{new Date(metadata.date).toLocaleDateString()}</span>
            </div>
          );
        }
        break;

      case 'workspace':
        if (metadata.members) {
          items.push(
            <div key="members" className="flex items-center space-x-1 text-gray-500">
              <UserGroupIcon className="h-3 w-3" />
              <span>{metadata.members} members</span>
            </div>
          );
        }
        if (metadata.tasks) {
          items.push(
            <div key="tasks" className="flex items-center space-x-1 text-gray-500">
              <span>{metadata.tasks} tasks</span>
            </div>
          );
        }
        break;

      case 'organization':
        if (metadata.events) {
          items.push(
            <div key="events" className="flex items-center space-x-1 text-gray-500">
              <CalendarIcon className="h-3 w-3" />
              <span>{metadata.events} events</span>
            </div>
          );
        }
        if (metadata.members) {
          items.push(
            <div key="members" className="flex items-center space-x-1 text-gray-500">
              <UserGroupIcon className="h-3 w-3" />
              <span>{metadata.members} members</span>
            </div>
          );
        }
        if (metadata.verified) {
          items.push(
            <div key="verified" className="flex items-center space-x-1 text-green-600">
              <CheckBadgeIcon className="h-3 w-3" />
              <span>Verified</span>
            </div>
          );
        }
        break;

      case 'marketplace':
        if (metadata.rating) {
          items.push(
            <div key="rating" className="flex items-center space-x-1 text-yellow-600">
              <StarIcon className="h-3 w-3 fill-current" />
              <span>{metadata.rating}</span>
            </div>
          );
        }
        if (metadata.bookings) {
          items.push(
            <div key="bookings" className="flex items-center space-x-1 text-gray-500">
              <span>{metadata.bookings} bookings</span>
            </div>
          );
        }
        if (metadata.price) {
          items.push(
            <div key="price" className="text-gray-500">
              <span>{metadata.price}</span>
            </div>
          );
        }
        break;

      case 'user':
        if (metadata.role) {
          items.push(
            <div key="role" className="text-gray-500 capitalize">
              <span>{metadata.role}</span>
            </div>
          );
        }
        if (metadata.events) {
          items.push(
            <div key="events" className="flex items-center space-x-1 text-gray-500">
              <CalendarIcon className="h-3 w-3" />
              <span>{metadata.events} events</span>
            </div>
          );
        }
        if (metadata.verified) {
          items.push(
            <div key="verified" className="flex items-center space-x-1 text-green-600">
              <CheckBadgeIcon className="h-3 w-3" />
              <span>Verified</span>
            </div>
          );
        }
        break;
    }

    return items.length > 0 ? (
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {items}
      </div>
    ) : null;
  };

  const TypeIcon = getTypeIcon(result.type);
  const typeColor = getTypeColor(result.type);

  return (
    <div
      className={`bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md hover:border-border/70 transition-all cursor-pointer group ${className}`}
      onClick={() => navigate(result.url)}
    >
      <div className="flex items-start space-x-4">
        {/* Type Icon */}
        <div className={`p-3 rounded-lg border ${typeColor} group-hover:scale-105 transition-transform`}>
          <TypeIcon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {result.title}
              </h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full capitalize flex-shrink-0">
                {result.type}
              </span>
              {result.metadata?.status && (
                <span className={`text-xs px-2 py-1 rounded-full capitalize flex-shrink-0 ${getStatusColor(result.metadata.status)}`}>
                  {result.metadata.status}
                </span>
              )}
            </div>
            {showRelevanceScore && result.relevanceScore && (
              <div className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                {Math.round(result.relevanceScore * 100)}% match
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2 leading-relaxed">
            {result.description}
          </p>

          {/* Metadata */}
          {formatMetadata()}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
            {result.lastUpdated && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <ClockIcon className="h-3 w-3" />
                <span>Updated {new Date(result.lastUpdated).toLocaleDateString()}</span>
              </div>
            )}
            <div className="text-xs text-primary group-hover:text-primary/80 font-medium">
              View details →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultCard;