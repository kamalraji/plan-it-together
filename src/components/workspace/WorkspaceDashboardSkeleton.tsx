import { Skeleton } from '@/components/ui/skeleton';

/**
 * WorkspaceDashboardSkeleton - Loading skeleton for workspace dashboard
 * Provides visual continuity during workspace data loading
 */
export function WorkspaceDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="border-b border-border bg-card">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block w-64 border-r border-border bg-card min-h-[calc(100vh-73px)] p-4">
          <div className="space-y-6">
            {/* Navigation Section */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 mb-3" />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>
            
            {/* Management Section */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 mb-3" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>

            {/* Analysis Section */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 mb-3" />
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 p-6">
          {/* Page Title */}
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Large Content Card */}
            <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Side Cards */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <Skeleton className="h-6 w-28 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
