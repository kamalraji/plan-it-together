import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const CheckInSkeleton: React.FC = () => {
  return (
    <div className="w-full overflow-hidden">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
        {/* Header Skeleton */}
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-8 w-48 sm:w-64 mb-2" />
          <Skeleton className="h-5 w-32 sm:w-48 mb-4" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>

        {/* Session Selection Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-full max-w-xs" />
          <Skeleton className="h-3 w-64 mt-1" />
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="mb-6 border-b border-border pb-1">
          <div className="flex gap-4 sm:gap-8">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
              {/* QR Scanner Placeholder */}
              <div className="aspect-square max-w-sm mx-auto mb-6">
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
              <div className="text-center space-y-3">
                <Skeleton className="h-5 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-4 sm:space-y-6">
            {/* Recent Check-ins */}
            <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
              <Skeleton className="h-5 w-24 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 sm:p-6">
              <Skeleton className="h-5 w-36 mb-4" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-4 w-4 mt-0.5" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
