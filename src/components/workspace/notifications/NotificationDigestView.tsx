import React from 'react';
import { Bell, MessageSquare, Users, CheckSquare, Calendar, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  sourceType?: string;
  sourceId?: string;
  senderName?: string;
  senderAvatarUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBatch {
  id: string;
  batchType: string;
  notificationCount: number;
  contentSummary: {
    items: NotificationItem[];
    byType: Record<string, number>;
  };
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

interface NotificationDigestViewProps {
  batches: NotificationBatch[];
  onMarkAllRead: () => void;
  onBatchClick: (batchId: string) => void;
  onNotificationClick: (notificationId: string, sourceType?: string, sourceId?: string) => void;
  className?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return <MessageSquare className="h-4 w-4" />;
    case 'mention':
      return <Users className="h-4 w-4" />;
    case 'task':
      return <CheckSquare className="h-4 w-4" />;
    case 'event':
      return <Calendar className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'message':
      return 'text-info bg-info/10';
    case 'mention':
      return 'text-warning bg-warning/10';
    case 'task':
      return 'text-emerald-500 bg-emerald-500/10';
    case 'event':
      return 'text-primary bg-primary/10';
    default:
      return 'text-muted-foreground bg-muted';
  }
};

export const NotificationDigestView: React.FC<NotificationDigestViewProps> = ({
  batches,
  onMarkAllRead,
  onBatchClick,
  onNotificationClick,
  className,
}) => {
  const unreadCount = batches.filter(b => !b.readAt).length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <CardDescription>
          Your notifications are batched to reduce interruptions
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {batches.map((batch) => (
                <NotificationBatchCard
                  key={batch.id}
                  batch={batch}
                  onClick={() => onBatchClick(batch.id)}
                  onNotificationClick={onNotificationClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

interface NotificationBatchCardProps {
  batch: NotificationBatch;
  onClick: () => void;
  onNotificationClick: (notificationId: string, sourceType?: string, sourceId?: string) => void;
}

const NotificationBatchCard: React.FC<NotificationBatchCardProps> = ({
  batch,
  onClick,
  onNotificationClick,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isUnread = !batch.readAt;

  const typeCounts = batch.contentSummary.byType || {};
  const previewItems = batch.contentSummary.items?.slice(0, 3) || [];

  return (
    <div
      className={cn(
        "p-4 transition-colors",
        isUnread && "bg-primary/5",
        "hover:bg-muted/50"
      )}
    >
      {/* Batch header */}
      <div 
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => {
          setIsExpanded(!isExpanded);
          onClick();
        }}
      >
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Bell className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium",
              isUnread && "text-primary"
            )}>
              {batch.notificationCount} notification{batch.notificationCount !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(batch.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Type badges */}
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(typeCounts).map(([type, count]) => (
              <Badge
                key={type}
                variant="secondary"
                className={cn("text-xs", getNotificationColor(type))}
              >
                {getNotificationIcon(type)}
                <span className="ml-1">{count} {type}</span>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded items */}
      {isExpanded && (
        <div className="mt-3 pl-11 space-y-2">
          {previewItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onNotificationClick(item.id, item.sourceType, item.sourceId);
              }}
            >
              {item.senderAvatarUrl ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={item.senderAvatarUrl} />
                  <AvatarFallback className="text-xs">
                    {item.senderName?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center",
                  getNotificationColor(item.type)
                )}>
                  {getNotificationIcon(item.type)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                )}
              </div>

              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>
          ))}

          {batch.contentSummary.items?.length > 3 && (
            <p className="text-xs text-muted-foreground text-center py-1">
              +{batch.contentSummary.items.length - 3} more
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDigestView;
