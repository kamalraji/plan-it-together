/**
 * Online Users Widget
 * Displays a list of currently active users in the workspace
 * Grouped by status (online, away, busy)
 */
import { Users } from 'lucide-react';
import { WorkspacePresenceUser } from '@/hooks/useWorkspacePresence';
import { PresenceAvatar } from './PresenceAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface OnlineUsersWidgetProps {
  users: WorkspacePresenceUser[];
  maxDisplay?: number;
  className?: string;
  onUserClick?: (userId: string) => void;
}

export function OnlineUsersWidget({
  users,
  maxDisplay = 10,
  className,
  onUserClick,
}: OnlineUsersWidgetProps) {
  const onlineUsers = users.filter(u => u.status === 'online');
  const awayUsers = users.filter(u => u.status === 'away');
  const busyUsers = users.filter(u => u.status === 'busy');

  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;

  if (users.length === 0) {
    return (
      <div className={cn(
        "bg-card rounded-xl border border-border p-4",
        className
      )}>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-muted">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Active Now</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          No team members online
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-4",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-success/10">
            <Users className="h-4 w-4 text-success" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Active Now</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            {onlineUsers.length}
          </span>
          {awayUsers.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-warning" />
              {awayUsers.length}
            </span>
          )}
          {busyUsers.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              {busyUsers.length}
            </span>
          )}
        </div>
      </div>

      <ScrollArea className="max-h-48">
        <div className="space-y-2">
          {displayUsers.map((user) => (
            <div
              key={user.userId}
              onClick={() => onUserClick?.(user.userId)}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                onUserClick && "cursor-pointer hover:bg-muted/50"
              )}
            >
              <PresenceAvatar
                name={user.userName}
                avatarUrl={user.avatarUrl}
                status={user.status}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.userName}
                </p>
                {user.currentView && (
                  <p className="text-xs text-muted-foreground truncate">
                    Viewing {user.currentView}
                  </p>
                )}
              </div>
            </div>
          ))}

          {remainingCount > 0 && (
            <div className="text-center py-2">
              <span className="text-xs text-muted-foreground">
                +{remainingCount} more
              </span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
