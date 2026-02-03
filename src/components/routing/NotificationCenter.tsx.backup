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
import { useNotificationFeed } from '@/hooks/useNotificationFeed';

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

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  className = '',
}) => {
  const {
    notifications: liveNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationFeed();

  const effectiveNotifications = notifications ?? liveNotifications ?? [];

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchTranslateY, setTouchTranslateY] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine if viewport is mobile-sized
  useEffect(() => {
    const updateIsMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640);
      }
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMobile && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  // Filter notifications by category
  const filteredNotifications =
    selectedCategory === 'all'
      ? effectiveNotifications
      : effectiveNotifications.filter((n) => n.category === selectedCategory);

  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  // Count unread notifications
  const unreadCount = effectiveNotifications.filter((n) => !n.read).length;

  // Group notifications by category for stats
  const categoryStats = effectiveNotifications.reduce((acc, notification) => {
    acc[notification.category] = (acc[notification.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = [
    { id: 'all', label: 'All', count: effectiveNotifications.length },
    { id: 'workspace', label: 'Workspace', count: categoryStats.workspace || 0 },
    { id: 'event', label: 'Events', count: categoryStats.event || 0 },
    { id: 'marketplace', label: 'Marketplace', count: categoryStats.marketplace || 0 },
    { id: 'organization', label: 'Organization', count: categoryStats.organization || 0 },
    { id: 'system', label: 'System', count: categoryStats.system || 0 },
  ].filter((category) => category.count > 0);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchTranslateY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const deltaY = e.touches[0].clientY - touchStartY;
    if (deltaY > 0) {
      setTouchTranslateY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (touchTranslateY > 80) {
      setIsOpen(false);
    }
    setTouchStartY(null);
    setTouchTranslateY(0);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-6 w-6 text-primary" />
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

      {/* Mobile bottom sheet */}
      {isOpen && isMobile && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 sm:hidden bg-card rounded-t-2xl shadow-2xl ring-1 ring-border max-h-[80vh] flex flex-col"
            style={{ transform: `translateY(${touchTranslateY}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header */}
            <div className="px-4 pt-3 pb-2 border-b border-border">
              <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-primary hover:text-primary/80 font-medium px-2 py-1"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-full"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="mt-3">
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {category.label}
                      {category.count > 0 && (
                        <span className="ml-1 text-[11px]">({category.count})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {sortedNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
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
            {effectiveNotifications.length > 0 && (
              <div className="p-4 border-t border-border bg-muted">
                <div className="flex items-center justify-between">
                  <Link
                    to="/console/notifications"
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    View all notifications
                  </Link>
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-muted-foreground hover:text-foreground px-2 py-1"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Desktop dropdown */}
      {isOpen && !isMobile && (
        <div className="absolute top-full right-0 mt-1 w-96 bg-card rounded-md shadow-lg ring-1 ring-border z-50 max-h-[600px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-md"
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
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted'
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
          <div className="max-h-[60vh] overflow-y-auto">
            {sortedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
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
          {effectiveNotifications.length > 0 && (
            <div className="p-4 border-t border-border bg-muted">
              <div className="flex items-center justify-between">
                <Link
                  to="/console/notifications"
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
                <button
                  onClick={handleClearAll}
                  className="text-sm text-muted-foreground hover:text-foreground"
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
        return <CalendarIcon className="h-5 w-5 text-indigo-500" />;
      case 'marketplace':
        return <ShoppingBagIcon className="h-5 w-5 text-purple-500" />;
      case 'system':
        return <Cog6ToothIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getCategoryLabel = () => {
    switch (notification.category) {
      case 'workspace':
        return (
          <span className="inline-flex items-center text-xs text-muted-foreground">
            <UserGroupIcon className="h-3.5 w-3.5 mr-1" /> Workspace
          </span>
        );
      case 'event':
        return (
          <span className="inline-flex items-center text-xs text-muted-foreground">
            <CalendarIcon className="h-3.5 w-3.5 mr-1" /> Event
          </span>
        );
      case 'marketplace':
        return (
          <span className="inline-flex items-center text-xs text-muted-foreground">
            <ShoppingBagIcon className="h-3.5 w-3.5 mr-1" /> Marketplace
          </span>
        );
      case 'organization':
        return (
          <span className="inline-flex items-center text-xs text-muted-foreground">
            <UserGroupIcon className="h-3.5 w-3.5 mr-1" /> Organization
          </span>
        );
      case 'system':
      default:
        return (
          <span className="inline-flex items-center text-xs text-muted-foreground">
            <Cog6ToothIcon className="h-3.5 w-3.5 mr-1" /> System
          </span>
        );
    }
  };

  const timeAgo = () => {
    const diffMs = Date.now() - notification.timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const containerClasses = notification.read
    ? 'bg-card'
    : 'bg-primary/5';

  const getWorkspaceDeepLink = () => {
    const metadata: any = (notification as any).metadata;
    if (!metadata) return undefined;

    const eventId = metadata.eventId as string | undefined;
    const workspaceId = metadata.workspaceId as string | undefined;
    const taskId = metadata.taskId as string | undefined;

    if (!eventId) return undefined;

    const params = new URLSearchParams();
    if (workspaceId) params.set('workspaceId', workspaceId);
    if (taskId) params.set('taskId', taskId);

    const query = params.toString();
    const basePath = `/console/events/${eventId}/workspace`;
    return query ? `${basePath}?${query}` : basePath;
  };

  const deepLinkUrl = notification.actionUrl || getWorkspaceDeepLink();

  return (
    <div className={`px-4 py-3 ${containerClasses}`}>
      <div className="flex items-start space-x-3">
        <div className="mt-1 flex-shrink-0">{getTypeIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{notification.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
            </div>
            <div className="ml-2 flex flex-col items-end space-y-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo()}</span>
              {!notification.read && (
                <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getCategoryLabel()}
              {notification.actionLabel && deepLinkUrl && (
                <Link
                  to={deepLinkUrl}
                  className="inline-flex items-center px-2.5 py-1 border border-border rounded-full text-xs font-medium text-primary hover:bg-primary/5"
                >
                  {notification.actionLabel}
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-1">
              {!notification.read && (
                <button
                  onClick={handleMarkAsRead}
                  className="text-xs text-primary hover:text-primary/80 px-2 py-1"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={handleDelete}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
