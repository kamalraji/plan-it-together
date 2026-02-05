import React from 'react';
import { Cloud, CloudOff, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

interface SyncProgressIndicatorProps {
  status: SyncStatus;
  progress?: number; // 0-100
  pendingCount?: number;
  syncedCount?: number;
  errorMessage?: string;
  className?: string;
}

export const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({
  status,
  progress = 0,
  pendingCount = 0,
  syncedCount = 0,
  errorMessage,
  className,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <Check className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'offline':
        return <CloudOff className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Cloud className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'syncing':
        return `Syncing ${syncedCount}/${pendingCount + syncedCount}...`;
      case 'success':
        return 'All changes synced';
      case 'error':
        return errorMessage || 'Sync failed';
      case 'offline':
        return `${pendingCount} changes waiting`;
      default:
        return pendingCount > 0 ? `${pendingCount} pending` : 'Up to date';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'syncing':
        return 'text-primary';
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-destructive';
      case 'offline':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  // Don't show if idle with nothing pending
  if (status === 'idle' && pendingCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn("space-y-1", className)}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={cn("text-xs font-medium", getStatusColor())}>
            {getStatusText()}
          </span>
        </div>

        {status === 'syncing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <Progress value={progress} className="h-1" />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Compact version for header
interface CompactSyncIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  className?: string;
}

export const CompactSyncIndicator: React.FC<CompactSyncIndicatorProps> = ({
  isOnline,
  pendingCount,
  isSyncing,
  className,
}) => {
  // Don't show if online and nothing pending
  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {!isOnline ? (
        <CloudOff className="h-4 w-4 text-destructive" />
      ) : isSyncing ? (
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
      ) : pendingCount > 0 ? (
        <div className="relative">
          <Cloud className="h-4 w-4 text-warning" />
          <span className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center rounded-full bg-warning text-[8px] font-bold text-warning-foreground">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        </div>
      ) : null}
    </div>
  );
};
