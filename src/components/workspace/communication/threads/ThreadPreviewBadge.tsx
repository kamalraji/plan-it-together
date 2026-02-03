/**
 * ThreadPreviewBadge - Inline reply count indicator for messages
 */
import React from 'react';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThreadParticipant {
  id: string;
  name: string;
  avatar_url?: string;
}

interface ThreadPreviewBadgeProps {
  replyCount: number;
  participants?: ThreadParticipant[];
  lastReplyAt?: string;
  onClick: () => void;
  className?: string;
}

export const ThreadPreviewBadge: React.FC<ThreadPreviewBadgeProps> = ({
  replyCount,
  participants = [],
  lastReplyAt,
  onClick,
  className,
}) => {
  if (replyCount === 0) return null;

  const displayParticipants = participants.slice(0, 3);
  const remainingCount = participants.length - 3;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        'h-auto py-1.5 px-2 text-primary hover:text-primary/80 hover:bg-primary/5',
        'flex items-center gap-2 group',
        className
      )}
    >
      {/* Participant Avatars */}
      {displayParticipants.length > 0 && (
        <div className="flex -space-x-2">
          {displayParticipants.map((participant) => (
            <Avatar key={participant.id} className="h-5 w-5 border-2 border-background">
              <AvatarFallback className="text-[10px]">
                {participant.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {remainingCount > 0 && (
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
              +{remainingCount}
            </div>
          )}
        </div>
      )}

      {/* Reply Count */}
      <div className="flex items-center gap-1">
        <MessageCircle className="h-3.5 w-3.5" />
        <span className="text-sm font-medium">
          {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
        </span>
      </div>

      {/* Last Reply Time */}
      {lastReplyAt && (
        <span className="text-xs text-muted-foreground">
          Last reply {formatTimeAgo(lastReplyAt)}
        </span>
      )}

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Button>
  );
};
