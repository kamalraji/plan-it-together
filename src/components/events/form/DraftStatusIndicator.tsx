import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DraftStatusIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  compact?: boolean;
  className?: string;
}

export function DraftStatusIndicator({
  isSaving,
  lastSaved,
  hasDraft,
  syncStatus = 'idle',
  compact = false,
  className,
}: DraftStatusIndicatorProps) {
  if (!hasDraft && !isSaving && !lastSaved) {
    return null;
  }

  const getSyncIcon = () => {
    if (isSaving) {
      return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    }
    
    switch (syncStatus) {
      case 'syncing':
        return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
      case 'synced':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return lastSaved ? (
          <Cloud className="h-3.5 w-3.5 text-primary" />
        ) : (
          <CloudOff className="h-3.5 w-3.5" />
        );
    }
  };

  const getStatusText = () => {
    if (isSaving) return 'Saving...';
    
    switch (syncStatus) {
      case 'syncing':
        return compact ? 'Syncing' : 'Syncing to cloud...';
      case 'synced':
        return compact ? 'Synced' : 'Draft saved';
      case 'error':
        return compact ? 'Offline' : 'Saved locally';
      default:
        return lastSaved ? (compact ? 'Saved' : 'Draft saved') : 'Not saved';
    }
  };

  const getTooltipText = () => {
    if (isSaving) return 'Saving your changes...';
    
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing draft to cloud...';
      case 'synced':
        return lastSaved 
          ? `Synced ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
          : 'Draft synced to cloud';
      case 'error':
        return 'Unable to sync. Draft saved locally.';
      default:
        return lastSaved 
          ? `Last saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
          : 'Changes not yet saved';
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-1.5 text-xs text-muted-foreground",
              compact && "gap-1",
              className
            )}
            role="status"
            aria-live="polite"
          >
            {getSyncIcon()}
            <span className={cn(compact && "sr-only sm:not-sr-only")}>
              {getStatusText()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {getTooltipText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
