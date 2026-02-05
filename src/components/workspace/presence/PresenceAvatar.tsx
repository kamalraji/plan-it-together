/**
 * Presence Avatar Component
 * Avatar with online status indicator dot
 * Includes tooltip showing last activity
 */
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface PresenceAvatarProps {
  name: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const statusColors = {
  online: 'bg-success',
  away: 'bg-warning',
  busy: 'bg-destructive',
  offline: 'bg-gray-400',
};

const statusLabels = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
};

const sizeClasses = {
  sm: {
    avatar: 'h-8 w-8',
    indicator: 'h-2.5 w-2.5 right-0 bottom-0',
    ring: 'ring-1',
  },
  md: {
    avatar: 'h-10 w-10',
    indicator: 'h-3 w-3 right-0 bottom-0',
    ring: 'ring-2',
  },
  lg: {
    avatar: 'h-12 w-12',
    indicator: 'h-3.5 w-3.5 right-0.5 bottom-0.5',
    ring: 'ring-2',
  },
};

export function PresenceAvatar({
  name,
  avatarUrl,
  status,
  lastSeen,
  size = 'md',
  showTooltip = true,
  className,
}: PresenceAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = sizeClasses[size];

  const avatarContent = (
    <div className={cn("relative inline-block", className)}>
      <Avatar className={sizeClass.avatar}>
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback className="text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "absolute rounded-full ring-background",
          statusColors[status],
          sizeClass.indicator,
          sizeClass.ring
        )}
      />
    </div>
  );

  if (!showTooltip) {
    return avatarContent;
  }

  const tooltipContent = (
    <div className="text-center">
      <p className="font-medium">{name}</p>
      <p className="text-xs text-muted-foreground">
        {statusLabels[status]}
        {lastSeen && status !== 'online' && (
          <span> • {formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}</span>
        )}
      </p>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {avatarContent}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-48">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}
