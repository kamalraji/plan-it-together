import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Calendar, 
  Users, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/components/routing/NotificationCenter';

interface MobileActivityFeedProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  orgSlug: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  event: Calendar,
  workspace: Users,
  system: Bell,
  organization: Users,
  marketplace: MessageSquare,
};

const categoryColors: Record<string, { icon: string; bg: string }> = {
  event: { icon: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  workspace: { icon: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  system: { icon: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800/50' },
  organization: { icon: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  marketplace: { icon: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
};

export const MobileActivityFeed: React.FC<MobileActivityFeedProps> = ({
  notifications,
  onMarkAsRead,
  orgSlug,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayNotifications = isExpanded ? notifications.slice(0, 10) : notifications.slice(0, 3);
  const hasMore = notifications.length > 3;

  if (notifications.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs h-8"
          onClick={() => navigate(`/${orgSlug}/notifications`)}
        >
          View All
        </Button>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-border">
        {displayNotifications.map((notification) => {
          const Icon = categoryIcons[notification.category] || Bell;
          const colors = categoryColors[notification.category] || categoryColors.system;
          
          return (
            <button
              key={notification.id}
              className={cn(
                "w-full flex items-start gap-3 p-4 text-left transition-colors",
                "hover:bg-accent/50 active:bg-accent",
                !notification.read && "bg-primary/5"
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className={cn("p-2 rounded-full shrink-0", colors.bg)}>
                <Icon className={cn("h-4 w-4", colors.icon)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <p className={cn(
                    "text-sm line-clamp-2",
                    notification.read ? 'text-muted-foreground' : 'text-foreground font-medium'
                  )}>
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <Circle className="h-2 w-2 fill-primary text-primary shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expand/Collapse */}
      {hasMore && (
        <button
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-primary font-medium hover:bg-accent/50 transition-colors border-t border-border"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              Show Less
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Show More ({notifications.length - 3})
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
};
