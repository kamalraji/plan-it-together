import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'event' | 'marketplace' | 'system';
  category: 'workspace' | 'event' | 'marketplace' | 'organization' | 'system';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  notifications?: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (notificationId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

// Mock notifications - in a real app, this would come from an API
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Task Assignment',
    message: 'Sarah assigned you to "Design event brochure" in Marketing Workspace',
    type: 'task',
    category: 'workspace',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false,
    actionUrl: '/console/workspaces/marketing/tasks/123',
    actionLabel: 'View Task',
    metadata: { workspaceId: 'marketing', taskId: '123' }
  },
  {
    id: '2',
    title: 'Event Registration Milestone',
    message: 'Annual Conference 2024 has reached 500 registrations!',
    type: 'success',
    category: 'event',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false,
    actionUrl: '/console/events/annual-conference-2024',
    actionLabel: 'View Event',
    metadata: { eventId: 'annual-conference-2024', registrations: 500 }
  },
  {
    id: '3',
    title: 'Service Booking Confirmed',
    message: 'Photography service booking confirmed for March 15, 2024',
    type: 'info',
    category: 'marketplace',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true,
    actionUrl: '/console/marketplace/bookings/photo-service-123',
    actionLabel: 'View Booking',
    metadata: { serviceId: 'photo-service-123', date: '2024-03-15' }
  },
  {
    id: '4',
    title: 'Task Deadline Approaching',
    message: 'Task "Finalize venue contract" is due in 2 hours',
    type: 'warning',
    category: 'workspace',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: false,
    actionUrl: '/console/workspaces/event-planning/tasks/456',
    actionLabel: 'Complete Task',
    metadata: { workspaceId: 'event-planning', taskId: '456', hoursUntilDue: 2 }
  },
  {
    id: '5',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance on March 20, 2024 from 2:00 AM - 4:00 AM EST',
    type: 'info',
    category: 'system',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    actionUrl: '/console/system/maintenance',
    actionLabel: 'Learn More',
    metadata: { maintenanceDate: '2024-03-20', duration: '2 hours' }
  },
  {
    id: '6',
    title: 'New Team Member',
    message: 'John Doe joined the Marketing Workspace',
    type: 'info',
    category: 'workspace',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: true,
    actionUrl: '/console/workspaces/marketing/team',
    actionLabel: 'View Team',
    metadata: { workspaceId: 'marketing', newMember: 'John Doe' }
  }
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications = mockNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter notifications by category
  const filteredNotifications = selectedCategory === 'all' 
    ? notifications 
    : notifications.filter(n => n.category === selectedCategory);

  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Group notifications by category for stats
  const categoryStats = notifications.reduce((acc, notification) => {
    acc[notification.category] = (acc[notification.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'workspace', label: 'Workspace', count: categoryStats.workspace || 0 },
    { id: 'event', label: 'Events', count: categoryStats.event || 0 },
    { id: 'marketplace', label: 'Marketplace', count: categoryStats.marketplace || 0 },
    { id: 'organization', label: 'Organization', count: categoryStats.organization || 0 },
    { id: 'system', label: 'System', count: categoryStats.system || 0 },
  ].filter(category => category.count > 0);

  const handleMarkAsRead = (notificationId: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(notificationId);
    }
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    if (onDeleteNotification) {
      onDeleteNotification(notificationId);
    }
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-6 w-6 text-indigo-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-96 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 max-h-[600px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-500 rounded-md"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="mt-3">
              <div className="flex space-x-1 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex-shrink-0 px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {category.label}
                    {category.count > 0 && (
                      <span className="ml-1 text-xs">({category.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {sortedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No notifications</p>
                <p className="text-xs text-gray-400 mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortedNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDeleteNotification}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <Link
                  to="/console/notifications"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
                <button
                  onClick={handleClearAll}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
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
        return <Cog6ToothIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = () => {
    switch (notification.category) {
      case 'workspace':
        return <UserGroupIcon className="h-4 w-4 text-gray-400" />;
      case 'event':
        return <CalendarIcon className="h-4 w-4 text-gray-400" />;
      case 'marketplace':
        return <ShoppingBagIcon className="h-4 w-4 text-gray-400" />;
      case 'system':
        return <Cog6ToothIcon className="h-4 w-4 text-gray-400" />;
      default:
        return <InformationCircleIcon className="h-4 w-4 text-gray-400" />;
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
    <div className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}>
      <div className="flex items-start space-x-3">
        {/* Type Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              
              {/* Metadata */}
              <div className="flex items-center space-x-2 mt-2">
                {getCategoryIcon()}
                <span className="text-xs text-gray-500 capitalize">
                  {notification.category}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(notification.timestamp)}
                </span>
              </div>

              {/* Action Button */}
              {notification.actionUrl && notification.actionLabel && (
                <div className="mt-3">
                  <Link
                    to={notification.actionUrl}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                  >
                    {notification.actionLabel}
                  </Link>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-2">
              {!notification.read && (
                <button
                  onClick={handleMarkAsRead}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                  title="Mark as read"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
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
            <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
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

export default NotificationCenter;