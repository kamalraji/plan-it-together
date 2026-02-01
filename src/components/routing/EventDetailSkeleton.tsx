import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const EventDetailSkeleton: React.FC = () => {
  return (
    <div className="w-full overflow-hidden">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* PageHeader Skeleton */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 sm:px-6">
            {/* Breadcrumbs */}
            <div className="flex py-3 gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Title and Actions */}
            <div className="py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-8 w-64 sm:w-80" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-9 w-28 hidden sm:block" />
                  <Skeleton className="h-9 w-24 hidden sm:block" />
                  <Skeleton className="h-9 w-24 hidden sm:block" />
                  <Skeleton className="h-9 w-9 sm:hidden" />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-border -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="flex gap-2 py-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-20 sm:w-24" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info Skeleton */}
        <div className="mt-4 sm:mt-6 rounded-xl bg-card border border-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Content Skeleton */}
        <div className="mt-4 sm:mt-6 rounded-xl bg-card border border-border p-4 sm:p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-lg bg-muted/30 p-4 space-y-3">
              <Skeleton className="h-5 w-28" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-muted/30 p-4 space-y-3">
              <Skeleton className="h-5 w-36" />
              {[1, 2].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
