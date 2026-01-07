import * as React from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

export type ActionButtonState = "idle" | "loading" | "success" | "error";

export interface ActionButtonProps extends Omit<ButtonProps, "children"> {
  /** Loading state - shows spinner when true */
  isLoading?: boolean;
  /** Shows success state briefly after action completes */
  showSuccess?: boolean;
  /** Shows error state briefly after action fails */
  showError?: boolean;
  /** Text to show in idle state */
  children: React.ReactNode;
  /** Text to show while loading (optional - defaults to children) */
  loadingText?: string;
  /** Text to show on success (optional) */
  successText?: string;
  /** Duration to show success/error state in ms */
  feedbackDuration?: number;
  /** Icon to show before text (hidden during loading) */
  icon?: React.ReactNode;
  /** Position of the icon */
  iconPosition?: "left" | "right";
}

/**
 * ActionButton - Enhanced button with loading, success, and error states
 * 
 * Usage:
 * ```tsx
 * <ActionButton 
 *   isLoading={mutation.isPending}
 *   onClick={handleClick}
 * >
 *   Save Changes
 * </ActionButton>
 * ```
 */
export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      isLoading = false,
      showSuccess = false,
      showError = false,
      children,
      loadingText,
      successText,
      feedbackDuration = 2000,
      icon,
      iconPosition = "left",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [internalState, setInternalState] = React.useState<ActionButtonState>("idle");

    // Handle success/error feedback states
    React.useEffect(() => {
      if (showSuccess && !isLoading) {
        setInternalState("success");
        const timer = setTimeout(() => setInternalState("idle"), feedbackDuration);
        return () => clearTimeout(timer);
      }
      if (showError && !isLoading) {
        setInternalState("error");
        const timer = setTimeout(() => setInternalState("idle"), feedbackDuration);
        return () => clearTimeout(timer);
      }
      if (isLoading) {
        setInternalState("loading");
      } else if (internalState === "loading") {
        setInternalState("idle");
      }
      return undefined;
    }, [showSuccess, showError, isLoading, feedbackDuration, internalState]);

    const currentState = isLoading ? "loading" : internalState;

    const renderContent = () => {
      switch (currentState) {
        case "loading":
          return (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{loadingText || children}</span>
            </>
          );
        case "success":
          return (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span>{successText || children}</span>
            </>
          );
        case "error":
          return (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>{children}</span>
            </>
          );
        default:
          return (
            <>
              {icon && iconPosition === "left" && icon}
              <span>{children}</span>
              {icon && iconPosition === "right" && icon}
            </>
          );
      }
    };

    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "relative transition-all",
          currentState === "success" && "ring-2 ring-green-500/20",
          currentState === "error" && "ring-2 ring-destructive/20",
          className
        )}
        {...props}
      >
        {renderContent()}
      </Button>
    );
  }
);

ActionButton.displayName = "ActionButton";

/**
 * useActionState - Hook for managing action button state with mutations
 * 
 * Usage:
 * ```tsx
 * const { buttonProps, trigger } = useActionState({
 *   action: async () => await saveMutation.mutateAsync(),
 *   onSuccess: () => toast.success("Saved!"),
 * });
 * 
 * <ActionButton {...buttonProps} onClick={trigger}>Save</ActionButton>
 * ```
 */
export function useActionState<T = void>({
  action,
  onSuccess,
  onError,
}: {
  action: () => Promise<T>;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showError, setShowError] = React.useState(false);

  const trigger = React.useCallback(async () => {
    setIsLoading(true);
    setShowSuccess(false);
    setShowError(false);

    try {
      const result = await action();
      setShowSuccess(true);
      onSuccess?.(result);
      return result;
    } catch (error) {
      setShowError(true);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [action, onSuccess, onError]);

  return {
    buttonProps: {
      isLoading,
      showSuccess,
      showError,
    },
    trigger,
    isLoading,
  };
}
