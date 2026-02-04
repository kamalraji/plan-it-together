import React from 'react';
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaveStatus } from '@/hooks/useAutosave';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SaveIndicatorProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
  className?: string;
}

const statusConfig: Record<SaveStatus, { 
  icon: React.ElementType; 
  label: string; 
  className: string;
}> = {
  idle: {
    icon: Cloud,
    label: 'No changes',
    className: 'text-[var(--gjs-text-muted)]',
  },
  saving: {
    icon: Loader2,
    label: 'Saving...',
    className: 'text-[var(--gjs-accent)] animate-spin',
  },
  saved: {
    icon: Check,
    label: 'Saved',
    className: 'text-green-500',
  },
  unsaved: {
    icon: CloudOff,
    label: 'Unsaved changes',
    className: 'text-amber-500',
  },
  error: {
    icon: AlertCircle,
    label: 'Save failed',
    className: 'text-destructive',
  },
};

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  status,
  lastSavedAt,
  className,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const tooltipContent = lastSavedAt
    ? `${config.label} • Last saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`
    : config.label;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
              className
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', config.className)} />
            <span className={cn('hidden sm:inline', config.className)}>
              {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : status === 'unsaved' ? 'Draft' : ''}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
