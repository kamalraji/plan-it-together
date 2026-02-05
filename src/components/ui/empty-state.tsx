import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  AlertCircle, 
  ShieldOff, 
  FolderOpen,
  type LucideIcon 
} from 'lucide-react';
import { 
  ThinkingPerson, 
  SecurityCheck 
} from '@/components/illustrations';

export type EmptyStateVariant = 'default' | 'search' | 'error' | 'no-permission';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

const variantDefaults: Record<EmptyStateVariant, { icon: LucideIcon; iconColor: string }> = {
  default: {
    icon: FolderOpen,
    iconColor: 'text-muted-foreground',
  },
  search: {
    icon: Search,
    iconColor: 'text-muted-foreground',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-destructive',
  },
  'no-permission': {
    icon: ShieldOff,
    iconColor: 'text-warning',
  },
};

export function EmptyState({
  variant = 'default',
  icon,
  illustration,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const defaults = variantDefaults[variant];
  const IconComponent = icon || defaults.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : (
        <div
          className={cn(
            'h-14 w-14 rounded-full bg-muted/80 flex items-center justify-center mb-4',
            variant === 'error' && 'bg-destructive/10',
            variant === 'no-permission' && 'bg-warning/10'
          )}
        >
          <IconComponent
            className={cn('h-7 w-7', defaults.iconColor)}
            aria-hidden="true"
          />
        </div>
      )}

      <h3 className="text-base font-semibold text-foreground">{title}</h3>

      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              size="lg"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || 'outline'}
              size="lg"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function SearchEmptyState({
  searchTerm,
  onClear,
}: {
  searchTerm?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      variant="search"
      illustration={<ThinkingPerson size="sm" />}
      title="No results found"
      description={
        searchTerm
          ? `We couldn't find any results for "${searchTerm}". Try adjusting your search or filters.`
          : "Try adjusting your search or filters to find what you're looking for."
      }
      action={
        onClear
          ? { label: 'Clear search', onClick: onClear, variant: 'outline' }
          : undefined
      }
    />
  );
}

export function ErrorEmptyState({
  onRetry,
  message,
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <EmptyState
      variant="error"
      title="Something went wrong"
      description={message || 'An error occurred while loading the content. Please try again.'}
      action={
        onRetry
          ? { label: 'Try again', onClick: onRetry }
          : undefined
      }
    />
  );
}

export function NoPermissionEmptyState({
  onGoBack,
}: {
  onGoBack?: () => void;
}) {
  return (
    <EmptyState
      variant="no-permission"
      illustration={<SecurityCheck size="sm" />}
      title="Access denied"
      description="You don't have permission to view this content. Contact an administrator if you believe this is an error."
      action={
        onGoBack
          ? { label: 'Go back', onClick: onGoBack, variant: 'outline' }
          : undefined
      }
    />
  );
}
