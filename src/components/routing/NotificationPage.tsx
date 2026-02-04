import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  CalendarIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from './PageHeader';
import type { Notification } from './NotificationCenter';
import { useNotificationFeed } from '@/hooks/useNotificationFeed';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPageProps {
  notifications?: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (notificationId: string) => void;
  onClearAll?: () => void;
}

// Notifications are now loaded from Supabase via the notification feed hook.

export const NotificationPage: React.FC<NotificationPageProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
}) => {
  const { user } = useAuth();

  const {
    notifications: liveNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationFeed();

  const effectiveNotifications = notifications ?? liveNotifications ?? [];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = effectiveNotifications;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((n) => n.category === selectedCategory);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((n) => n.type === selectedType);
    }

    // Filter by read status
    if (showUnreadOnly) {
      filtered = filtered.filter((n) => !n.read);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query),
      );
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [effectiveNotifications, selectedCategory, selectedType, showUnreadOnly, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = effectiveNotifications.length;
    const unread = effectiveNotifications.filter((n) => !n.read).length;
    const categories = effectiveNotifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const types = effectiveNotifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, unread, categories, types };
  }, [effectiveNotifications]);

  const categories = [
    { id: 'all', label: 'All', count: stats.total, icon: BellIcon },
    { id: 'workspace', label: 'Workspace', count: stats.categories.workspace || 0, icon: UserGroupIcon },
    { id: 'event', label: 'Events', count: stats.categories.event || 0, icon: CalendarIcon },
    { id: 'marketplace', label: 'Marketplace', count: stats.categories.marketplace || 0, icon: ShoppingBagIcon },
    { id: 'organization', label: 'Organization', count: stats.categories.organization || 0, icon: BuildingOfficeIcon },
    { id: 'system', label: 'System', count: stats.categories.system || 0, icon: Cog6ToothIcon },
  ].filter(category => category.count > 0);

  const types = [
    { id: 'all', label: 'All Types', count: stats.total },
    { id: 'info', label: 'Information', count: stats.types.info || 0 },
    { id: 'success', label: 'Success', count: stats.types.success || 0 },
    { id: 'warning', label: 'Warning', count: stats.types.warning || 0 },
    { id: 'error', label: 'Error', count: stats.types.error || 0 },
    { id: 'task', label: 'Tasks', count: stats.types.task || 0 },
  ].filter(type => type.count > 0);

  const seedSampleNotifications = async () => {
    if (!user) return;

    const { error } = await supabase.from('notifications').insert([
      {
        title: 'New Task Assignment',
        message: 'You have been assigned a new task in Marketing Workspace.',
        type: 'task',
        category: 'workspace',
        user_id: user.id,
        metadata: { workspace: 'Marketing', priority: 'high' },
      },
      {
        title: 'Event Registration Milestone',
        message: 'Annual Conference 2025 has reached 500 registrations.',
        type: 'event',
        category: 'event',
        user_id: user.id,
        metadata: { eventName: 'Annual Conference 2025' },
      },
      {
        title: 'System Update',
        message: 'We have shipped improvements to the dashboard experience.',
        type: 'system',
        category: 'system',
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error('Failed to seed notifications:', error.message);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(notificationId);
    } else {
      void markAsRead(notificationId);
    }
  };
 
  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    } else {
      void markAllAsRead();
    }
  };
 
  const handleDeleteNotification = (notificationId: string) => {
    if (onDeleteNotification) {
      onDeleteNotification(notificationId);
    } else {
      void deleteNotification(notificationId);
    }
  };
 
  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      void clearAll();
    }
  };

  const pageActions = [
    {
      label: 'Mark All Read',
      action: handleMarkAllAsRead,
      variant: 'secondary' as const,
      disabled: stats.unread === 0,
    },
    {
      label: 'Clear All',
      action: handleClearAll,
      variant: 'secondary' as const,
      disabled: stats.total === 0,
    },
    {
      label: 'Create Sample Notifications',
      action: () => { void seedSampleNotifications(); },
      variant: 'secondary' as const,
      disabled: !user,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/50">
      <PageHeader
        title="Notifications"
        subtitle={`${stats.total} total notifications, ${stats.unread} unread`}
        actions={pageActions}
        breadcrumbs={[
          { label: 'Console', href: '/console' },
          { label: 'Notifications', href: '/console/notifications' },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow p-6 space-y-6">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                  Search Notifications
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notifications..."
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-primary"
                  />
                </div>
              </div>

              {/* Unread Filter */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus-visible:ring-ring border-input rounded"
                  />
                  <span className="ml-2 text-sm text-foreground">Show unread only</span>
                </label>
              </div>

              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{category.label}</span>
                        </div>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          {category.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Types</h3>
                <div className="space-y-2">
                  {types.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedType === type.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span>{type.label}</span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        {type.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Notifications List */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-lg shadow">
              {/* Results Header */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {filteredNotifications.length} of {stats.total} notifications
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {stats.unread} unread
                    </span>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="divide-y divide-border">
                {filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <BellIcon className="h-12 w-12 text-muted-foreground/70 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No notifications found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || selectedCategory !== 'all' || selectedType !== 'all' || showUnreadOnly
                        ? 'Try adjusting your filters or search terms.'
                        : 'You\'re all caught up! New notifications will appear here.'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <NotificationListItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDeleteNotification}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NotificationListItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationListItem: React.FC<NotificationListItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(notification.id);
  };

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'task':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'event':
        return <CalendarIcon className="h-5 w-5 text-purple-500" />;
      case 'marketplace':
        return <ShoppingBagIcon className="h-5 w-5 text-orange-500" />;
      case 'system':
        return <Cog6ToothIcon className="h-5 w-5 text-muted-foreground" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const NotificationContent = () => (
    <div className={`p-6 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}>
      <div className="flex items-start space-x-4">
        {/* Type Icon */}
        <div className="flex-shrink-0 mt-1">
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`text-base font-medium ${!notification.read ? 'text-foreground' : 'text-foreground'}`}>
                {notification.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
              
              {/* Metadata */}
              <div className="flex items-center space-x-4 mt-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground capitalize">
                  {notification.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(notification.timestamp)}
                </span>
              </div>

              {/* Action Button */}
              {notification.actionUrl && notification.actionLabel && (
                <div className="mt-4">
                  <Link
                    to={notification.actionUrl}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                  >
                    {notification.actionLabel}
                  </Link>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {!notification.read && (
                <button
                  onClick={handleMarkAsRead}
                  className="p-2 text-muted-foreground hover:text-muted-foreground rounded-md hover:bg-muted transition-colors"
                  title="Mark as read"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleDelete}
                className="p-2 text-muted-foreground hover:text-muted-foreground rounded-md hover:bg-muted transition-colors"
                title="Delete notification"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Unread Indicator */}
        {!notification.read && (
          <div className="flex-shrink-0 mt-2">
            <div className="h-3 w-3 bg-indigo-600 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );

  return notification.actionUrl ? (
    <Link to={notification.actionUrl} className="block">
      <NotificationContent />
    </Link>
  ) : (
    <div>
      <NotificationContent />
    </div>
  );
};

export default NotificationPage;