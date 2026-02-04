import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export interface InputProps extends React.ComponentProps<"input"> {
  /** Show validation state visually */
  validationState?: 'idle' | 'validating' | 'valid' | 'invalid';
  /** Show character count */
  showCharCount?: boolean;
  /** Max length for character count */
  maxLength?: number;
  /** Current value for character count (useful for controlled inputs) */
  charCountValue?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    validationState = 'idle',
    showCharCount,
    maxLength,
    charCountValue,
    ...props 
  }, ref) => {
    const value = charCountValue ?? (props.value as string) ?? '';
    const charCount = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxLength ? charCount > maxLength : false;

    return (
      <div className="relative w-full">
        <input
          type={type}
          maxLength={maxLength}
          className={cn(
            "flex h-12 w-full rounded-xl border-2 bg-card px-4 py-2 text-base ring-offset-background transition-all duration-300",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Validation states
            validationState === 'idle' && "border-border hover:border-primary/50 hover:shadow-soft focus-visible:ring-primary focus-visible:border-primary",
            validationState === 'validating' && "border-muted-foreground/50 focus-visible:ring-muted-foreground",
            validationState === 'valid' && "border-green-500 focus-visible:ring-green-500 focus-visible:border-green-500 pr-10",
            validationState === 'invalid' && "border-destructive focus-visible:ring-destructive focus-visible:border-destructive pr-10",
            // Character count padding
            showCharCount && "pr-16",
            className,
          )}
          ref={ref}
          {...props}
        />
        
        {/* Validation indicator icons */}
        {validationState === 'validating' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {validationState === 'valid' && !showCharCount && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        )}
        {validationState === 'invalid' && !showCharCount && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        )}

        {/* Character count */}
        {showCharCount && maxLength && (
          <div className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-colors",
            isOverLimit ? "text-destructive" : charCount > maxLength * 0.9 ? "text-amber-500" : "text-muted-foreground"
          )}>
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
