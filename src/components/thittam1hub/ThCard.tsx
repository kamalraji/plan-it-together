import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ThCardProps extends React.HTMLAttributes<HTMLDivElement> {
  subtle?: boolean;
}

/**
 * Thittam1Hub-style surface card used across dashboards, auth, and event flows.
 */
export const ThCard = React.forwardRef<HTMLDivElement, ThCardProps>(
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

ThCard.displayName = 'ThCard';

// Backward compatibility alias
export const AfCard = ThCard;
export type AfCardProps = ThCardProps;
