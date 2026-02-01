import { Skeleton } from '@/components/ui/skeleton';

/**
 * MobileWorkspaceDashboardSkeleton - Loading skeleton for mobile workspace dashboard
 * Provides visual continuity during workspace data loading on mobile devices
 */
export function MobileWorkspaceDashboardSkeleton() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Mobile Header Skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-20 pb-24 px-4">
        <div className="space-y-6">
          {/* 2x2 Quick Action Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2"
              >
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>

          {/* Tasks Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Meetings Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-center">
                <Skeleton className="h-4 w-40 mx-auto" />
              </div>
            </div>
          </section>

          {/* Upcoming Events Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-center">
                <Skeleton className="h-4 w-36 mx-auto" />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Floating Action Button Skeleton */}
      <div className="fixed bottom-24 right-4 z-40">
        <Skeleton className="w-14 h-14 rounded-full" />
      </div>

      {/* Bottom Navigation Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center flex-1 py-2">
              <Skeleton className="h-5 w-5 mb-1" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
