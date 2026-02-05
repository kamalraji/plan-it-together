/**
 * OfflineSyncIndicator - Shows sync status and pending changes
 */
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

interface OfflineSyncIndicatorProps {
  compact?: boolean;
}

export function OfflineSyncIndicator({ compact = false }: OfflineSyncIndicatorProps) {
  const { isOnline, isSyncing, pendingCount, lastSyncAt, errors, syncNow, clearErrors } = useOfflineSync();

  const formatLastSync = () => {
    if (!lastSyncAt) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastSyncAt.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return lastSyncAt.toLocaleTimeString();
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                !isOnline && "text-warning",
                errors.length > 0 && "text-destructive"
              )}
              onClick={isOnline ? syncNow : undefined}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : isOnline ? (
                pendingCount > 0 ? (
                  <Cloud className="h-4 w-4" />
                ) : (
                  <Wifi className="h-4 w-4 text-emerald-500" />
                )
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-warning text-[10px] text-primary-foreground flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline ? (
              pendingCount > 0 ? (
                `${pendingCount} changes pending sync`
              ) : (
                'All changes synced'
              )
            ) : (
              'Working offline'
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-emerald-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-warning" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Pending Changes */}
      {pendingCount > 0 && (
        <Badge variant="secondary" className="gap-1">
          {isSyncing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <CloudOff className="h-3 w-3" />
          )}
          {pendingCount} pending
        </Badge>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Badge variant="destructive" className="gap-1 cursor-pointer" onClick={clearErrors}>
          <AlertCircle className="h-3 w-3" />
          {errors.length} failed
        </Badge>
      )}

      {/* Last Sync */}
      <span className="text-xs text-muted-foreground">
        Last sync: {formatLastSync()}
      </span>

      {/* Sync Button */}
      {isOnline && pendingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={syncNow}
          disabled={isSyncing}
          className="h-7"
        >
          {isSyncing ? (
            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Cloud className="h-3 w-3 mr-1" />
          )}
          Sync Now
        </Button>
      )}
    </div>
  );
}
