import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/routing/LoadingStates';

export type ConfirmationVariant = 'danger' | 'warning' | 'info';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

const variantStyles: Record<ConfirmationVariant, { action: string; icon: string }> = {
  danger: {
    action: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    icon: 'text-destructive',
  },
  warning: {
    action: 'bg-amber-600 text-white hover:bg-amber-700',
    icon: 'text-amber-600',
  },
  info: {
    action: 'bg-primary text-primary-foreground hover:bg-primary/90',
    icon: 'text-primary',
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  isLoading = false,
}: ConfirmationDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  const loading = isLoading || isPending;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading}
            className={cn(
              'flex items-center gap-2',
              variantStyles[variant].action
            )}
          >
            {loading && <LoadingSpinner size="sm" className="border-current" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for easier confirmation dialog usage
export function useConfirmation() {
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);
  const [state, setState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: ConfirmationVariant;
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    variant: 'danger',
  });

  const confirm = React.useCallback(
    (options: {
      title: string;
      description: string;
      confirmLabel?: string;
      variant?: ConfirmationVariant;
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setState({
          open: true,
          title: options.title,
          description: options.description,
          confirmLabel: options.confirmLabel || 'Confirm',
          variant: options.variant || 'danger',
        });
      });
    },
    []
  );

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      resolveRef.current?.(false);
      resolveRef.current = null;
      setState((prev) => ({ ...prev, open: false }));
    }
  }, []);

  const handleConfirm = React.useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const dialogProps = {
    open: state.open,
    onOpenChange: handleOpenChange,
    title: state.title,
    description: state.description,
    confirmLabel: state.confirmLabel,
    variant: state.variant,
    onConfirm: handleConfirm,
  };

  return { confirm, dialogProps, ConfirmationDialog };
}
