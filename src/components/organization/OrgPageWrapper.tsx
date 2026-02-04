import React from 'react';
import { cn } from '@/lib/utils';

interface OrgPageWrapperProps {
  children: React.ReactNode;
  className?: string;
  /**
   * If true, removes the default max-width constraint.
   * Useful for pages that need full-width content.
   */
  fullWidth?: boolean;
}

/**
 * OrgPageWrapper provides consistent layout, overflow handling, and responsive
 * padding for all organization-scoped pages.
 *
 * Features:
 * - Prevents horizontal overflow issues on mobile
 * - Responsive padding (px-2 → px-6 as screen grows)
 * - Optional max-width constraint with centered content
 * - Consistent vertical spacing
 */
export const OrgPageWrapper: React.FC<OrgPageWrapperProps> = ({
  children,
  className,
  fullWidth = false,
}) => {
  return (
    <div
      className={cn(
        'min-h-screen w-full overflow-hidden bg-transparent',
        className
      )}
    >
      <div
        className={cn(
          'w-full overflow-hidden px-2 sm:px-4 lg:px-6 py-4 sm:py-6',
          !fullWidth && 'mx-auto max-w-7xl'
        )}
      >
        {children}
      </div>
    </div>
  );
};
