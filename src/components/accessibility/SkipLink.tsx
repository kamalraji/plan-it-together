import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Accessibility skip link - allows keyboard users to skip navigation
 * Only visible when focused (sr-only by default, shows on focus)
 */
export function SkipLink({ 
  href = '#main-content', 
  children = 'Skip to main content',
  className 
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Hidden by default
        'sr-only',
        // Visible on focus with proper styling
        'focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:px-4 focus:py-2 focus:rounded-lg',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'focus:shadow-lg focus:font-medium focus:text-sm',
        // Smooth transition
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  );
}
