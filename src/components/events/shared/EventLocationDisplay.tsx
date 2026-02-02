import { MapPin, Globe, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

type EventMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';

interface Venue {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
}

interface EventLocationDisplayProps {
  mode: EventMode | string;
  venue?: Venue | null;
  showIcon?: boolean;
  className?: string;
  compact?: boolean;
}

export function EventLocationDisplay({ 
  mode, 
  venue, 
  showIcon = true,
  className,
  compact = false
}: EventLocationDisplayProps) {
  const Icon = mode === 'ONLINE' ? Globe : mode === 'HYBRID' ? Monitor : MapPin;
  
  const getLocationText = () => {
    switch (mode) {
      case 'ONLINE':
        return 'Virtual Event';
      case 'HYBRID':
        return venue?.name 
          ? `${venue.name} + Online` 
          : 'In-Person + Online';
      case 'OFFLINE':
      default:
        if (!venue) return 'Location TBA';
        if (compact) {
          return venue.city || venue.name || 'In-Person';
        }
        const parts = [venue.name, venue.city, venue.country].filter(Boolean);
        return parts.join(', ') || 'In-Person Event';
    }
  };
  
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {showIcon && (
        <Icon 
          className="h-4 w-4 text-muted-foreground shrink-0" 
          aria-hidden="true" 
        />
      )}
      <span className={compact ? 'truncate' : undefined}>
        {getLocationText()}
      </span>
    </div>
  );
}
