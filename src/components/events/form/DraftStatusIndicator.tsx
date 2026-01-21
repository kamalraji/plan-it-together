import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DraftStatusIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
  className?: string;
}

export function DraftStatusIndicator({
  isSaving,
  lastSaved,
  hasDraft,
  className,
}: DraftStatusIndicatorProps) {
  if (!hasDraft && !isSaving && !lastSaved) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-1.5 text-xs text-muted-foreground",
              className
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Cloud className="h-3.5 w-3.5 text-primary" />
                <span>Draft saved</span>
              </>
            ) : (
              <>
                <CloudOff className="h-3.5 w-3.5" />
                <span>Not saved</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {isSaving ? (
            'Saving your changes...'
          ) : lastSaved ? (
            `Last saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
          ) : (
            'Changes not yet saved'
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
