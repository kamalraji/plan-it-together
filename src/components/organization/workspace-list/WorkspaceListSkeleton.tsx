import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const WorkspaceListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className={cn(
        "rounded-2xl p-6 sm:p-8",
        "bg-gradient-to-br from-muted/50 to-muted/30",
        "border border-border/30"
      )}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted/70 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Groups Skeleton */}
      {[1, 2, 3].map((group) => (
        <motion.div
          key={group}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: group * 0.1 }}
          className="space-y-4"
        >
          {/* Group Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <div className="h-6 w-8 bg-muted rounded-full animate-pulse" />
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {[1, 2].map((card) => (
              <div
                key={card}
                className={cn(
                  "p-5 rounded-2xl",
                  "bg-card/40 border border-border/30",
                  "animate-pulse"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-40 bg-muted rounded" />
                    <div className="flex gap-2">
                      <div className="h-4 w-24 bg-muted/70 rounded" />
                      <div className="h-4 w-16 bg-muted/70 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
