import React from 'react';
import { WifiOff, Cloud, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineModeBannerProps {
  isOnline: boolean;
  pendingUpdates: number;
  pendingMessages: number;
  isSyncing?: boolean;
  onSync?: () => void;
  className?: string;
}

export const OfflineModeBanner: React.FC<OfflineModeBannerProps> = ({
  isOnline,
  pendingUpdates,
  pendingMessages,
  isSyncing = false,
  onSync,
  className,
}) => {
  const totalPending = pendingUpdates + pendingMessages;
  const showBanner = !isOnline || totalPending > 0;

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "overflow-hidden",
          className
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-4 py-2 text-sm",
            !isOnline 
              ? "bg-destructive/10 text-destructive" 
              : "bg-warning/10 text-warning-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <>
                <WifiOff className="h-4 w-4" />
                <span className="font-medium">You're offline</span>
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">
                  {totalPending} pending {totalPending === 1 ? 'change' : 'changes'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && totalPending > 0 && (
              <span className="text-xs text-muted-foreground">
                {totalPending} pending
              </span>
            )}
            
            {isOnline && totalPending > 0 && onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                  "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                {isSyncing ? 'Syncing...' : 'Sync now'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
