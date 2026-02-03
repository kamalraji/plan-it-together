import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ServiceCardSkeleton: React.FC = () => {
  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Image skeleton */}
          <div className="flex-shrink-0 lg:w-52">
            <Skeleton className="w-full h-40 lg:h-full rounded-none" />
          </div>

          {/* Content skeleton */}
          <div className="flex-1 p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-3">
                {/* Title */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
                
                {/* Description */}
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Vendor info */}
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>

                {/* Category and location */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>

                {/* Inclusions */}
                <Skeleton className="h-4 w-56" />
              </div>

              {/* Pricing and actions skeleton */}
              <div className="lg:text-right shrink-0 space-y-3">
                <Skeleton className="h-6 w-24 lg:ml-auto" />
                <div className="flex lg:flex-col gap-2">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
