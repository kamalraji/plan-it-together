import { Skeleton } from '@/components/ui/skeleton';

/**
 * Reusable skeleton patterns for common UI components
 * These ensure consistent loading states across the application
 */

interface SkeletonCardProps {
  lines?: number;
  showIcon?: boolean;
  className?: string;
}

export function SkeletonCard({ lines = 3, showIcon = true, className = '' }: SkeletonCardProps) {
  return (
    <div className={`p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        {showIcon && <Skeleton className="h-10 w-10 rounded-lg" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatsCard() {
  return (
    <div className="p-4 space-y-3 bg-card border border-border rounded-lg">
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function SkeletonStatsGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="status" aria-label="Loading statistics">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatsCard key={i} />
      ))}
      <span className="sr-only">Loading statistics...</span>
    </div>
  );
}

export function SkeletonKanbanColumn() {
  return (
    <div className="flex flex-col bg-muted/50 rounded-lg p-4 min-h-96">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <div className="flex-1 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonKanbanBoard() {
  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6" 
      role="status" 
      aria-label="Loading task board"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonKanbanColumn key={i} />
      ))}
      <span className="sr-only">Loading task board...</span>
    </div>
  );
}

export function SkeletonTeamMember() {
  return (
    <div className="flex items-center space-x-4 p-2">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function SkeletonTeamRoster({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading team members">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTeamMember key={i} />
      ))}
      <span className="sr-only">Loading team members...</span>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading table data">
      {/* Header */}
      <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3 border-b border-border">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className={`h-4 flex-1 ${colIndex === 0 ? 'w-1/4' : ''}`} />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading table data...</span>
    </div>
  );
}

export function SkeletonCalendarWeek() {
  return (
    <div className="grid grid-cols-7 gap-2" role="status" aria-label="Loading calendar">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="min-h-[180px] p-2 rounded-lg border border-border/50">
          <Skeleton className="h-4 w-12 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, j) => (
              <Skeleton key={j} className="h-16 w-full rounded" />
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Loading calendar...</span>
    </div>
  );
}

export function SkeletonFormSection() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading form">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-20 rounded-md" />
      </div>
      <span className="sr-only">Loading form...</span>
    </div>
  );
}

export function SkeletonTimeline({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading timeline">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-10 w-10 rounded-full" />
            {i < items - 1 && <Skeleton className="w-0.5 h-12 mt-2" />}
          </div>
          <div className="flex-1 space-y-2 pb-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading timeline...</span>
    </div>
  );
}
