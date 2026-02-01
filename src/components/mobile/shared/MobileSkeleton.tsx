import React from 'react';
import { cn } from '@/lib/utils';

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("bg-card border border-border rounded-2xl p-4 animate-pulse", className)}>
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className 
}) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const GridSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("grid grid-cols-2 gap-3", className)}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-card border border-border animate-pulse">
        <div className="w-12 h-12 rounded-xl bg-muted" />
        <div className="h-3 bg-muted rounded w-16" />
      </div>
    ))}
  </div>
);

export const TaskSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
      <div className="w-16 h-5 bg-muted rounded-full" />
    </div>
  </div>
);

export const TaskListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <TaskSkeleton key={i} />
    ))}
  </div>
);
