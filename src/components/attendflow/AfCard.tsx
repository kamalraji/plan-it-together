import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AfCardProps extends React.HTMLAttributes<HTMLDivElement> {
  subtle?: boolean;
}

/**
 * Attendflow-style surface card used across dashboards, auth, and event flows.
 */
export const AfCard = React.forwardRef<HTMLDivElement, AfCardProps>(
  ({ className, subtle = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-3xl border bg-card shadow-xl shadow-[var(--shadow-md)] backdrop-blur-xl',
          subtle
            ? 'border-border/40 bg-card/80'
            : 'border-border/60 bg-card/90',
          className,
        )}
        {...props}
      />
    );
  },
);

AfCard.displayName = 'AfCard';
