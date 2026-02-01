import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardSkeletonProps {
  showSidebar?: boolean;
  showHeader?: boolean;
}

/**
 * A skeleton loading state that mimics the dashboard layout.
 * Provides visual continuity during page loads and redirects.
 */
export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ 
  showSidebar = true, 
  showHeader = true 
}) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      {showHeader && (
        <div className="h-16 border-b border-border/40 bg-card/50 backdrop-blur-sm px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar skeleton */}
        {showSidebar && (
          <div className="hidden md:flex w-64 border-r border-border/40 bg-card/30 flex-col p-4 gap-4">
            {/* Logo area */}
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            {/* Nav items */}
            <div className="flex flex-col gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>

            {/* Bottom section */}
            <div className="mt-auto flex flex-col gap-2">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        )}

        {/* Main content skeleton */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-5 rounded" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>

            {/* Content area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar content */}
              <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * A simpler centered loading skeleton for participant dashboard
 */
export const ParticipantDashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-4xl p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
