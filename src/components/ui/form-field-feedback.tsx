/**
 * FormFieldFeedback Component
 * 
 * Provides visual feedback for form field validation states
 * including success indicators, error messages, and helpful hints.
 */


import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormFieldFeedbackProps {
  /** Current validation state */
  state: 'idle' | 'validating' | 'valid' | 'invalid' | 'warning';
  /** Error or warning message */
  message?: string;
  /** Helpful hint text */
  hint?: string;
  /** Show success message when valid */
  successMessage?: string;
  /** Character count info */
  charCount?: {
    current: number;
    max: number;
    showWarningAt?: number; // Percentage at which to show warning
  };
  /** Additional CSS classes */
  className?: string;
}

export function FormFieldFeedback({
  state,
  message,
  hint,
  successMessage,
  charCount,
  className,
}: FormFieldFeedbackProps) {
  const showCharWarning = charCount && charCount.current > (charCount.max * (charCount.showWarningAt || 0.9));
  const isOverLimit = charCount && charCount.current > charCount.max;

  return (
    <div className={cn('space-y-1', className)}>
      <AnimatePresence mode="wait">
        {/* Error message */}
        {state === 'invalid' && message && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{message}</span>
          </motion.div>
        )}

        {/* Warning message */}
        {state === 'warning' && message && (
          <motion.div
            key="warning"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-500"
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{message}</span>
          </motion.div>
        )}

        {/* Success message */}
        {state === 'valid' && successMessage && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2 text-sm text-green-600 dark:text-green-500"
          >
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {/* Validating state */}
        {state === 'validating' && (
          <motion.div
            key="validating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint text (only when idle or valid, no error) */}
      {hint && state !== 'invalid' && state !== 'warning' && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
          <span>{hint}</span>
        </div>
      )}

      {/* Character count */}
      {charCount && (
        <div className={cn(
          'text-xs text-right transition-colors',
          isOverLimit 
            ? 'text-destructive font-medium' 
            : showCharWarning 
              ? 'text-amber-500' 
              : 'text-muted-foreground'
        )}>
          {charCount.current} / {charCount.max} characters
          {isOverLimit && ' (over limit)'}
        </div>
      )}
    </div>
  );
}

// ============================================
// Validation State Badge
// ============================================

interface ValidationBadgeProps {
  state: 'idle' | 'validating' | 'valid' | 'invalid' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
}

export function ValidationBadge({ state, size = 'sm', className }: ValidationBadgeProps) {
  const sizeClasses = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className={cn('inline-flex items-center justify-center', className)}>
      {state === 'validating' && (
        <Loader2 className={cn(sizeClasses, 'animate-spin text-muted-foreground')} />
      )}
      {state === 'valid' && (
        <CheckCircle2 className={cn(sizeClasses, 'text-green-500')} />
      )}
      {state === 'invalid' && (
        <AlertCircle className={cn(sizeClasses, 'text-destructive')} />
      )}
      {state === 'warning' && (
        <AlertTriangle className={cn(sizeClasses, 'text-amber-500')} />
      )}
    </div>
  );
}

// ============================================
// Form Section Validation Summary
// ============================================

interface SectionValidationSummaryProps {
  sectionName: string;
  totalFields: number;
  validFields: number;
  invalidFields: number;
  className?: string;
}

export function SectionValidationSummary({
  sectionName,
  totalFields,
  validFields,
  invalidFields,
  className,
}: SectionValidationSummaryProps) {
  const allValid = validFields === totalFields && invalidFields === 0;
  const hasErrors = invalidFields > 0;
  const completionPercent = Math.round((validFields / totalFields) * 100);

  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors',
      allValid 
        ? 'border-green-500/30 bg-green-500/5' 
        : hasErrors 
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-border bg-muted/30',
      className
    )}>
      {allValid ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : hasErrors ? (
        <AlertCircle className="h-4 w-4 text-destructive" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{sectionName}</p>
        <p className="text-xs text-muted-foreground">
          {allValid 
            ? 'All fields complete' 
            : hasErrors 
              ? `${invalidFields} field${invalidFields > 1 ? 's' : ''} need${invalidFields === 1 ? 's' : ''} attention`
              : `${completionPercent}% complete`
          }
        </p>
      </div>

      {/* Progress indicator */}
      {!allValid && !hasErrors && (
        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// Inline Validation Message
// ============================================

interface InlineValidationProps {
  error?: string;
  warning?: string;
  success?: string;
  className?: string;
}

export function InlineValidation({ error, warning, success, className }: InlineValidationProps) {
  if (!error && !warning && !success) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={error || warning || success}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        className={cn(
          'text-sm mt-1.5',
          error && 'text-destructive',
          warning && 'text-amber-600 dark:text-amber-500',
          success && 'text-green-600 dark:text-green-500',
          className
        )}
      >
        {error || warning || success}
      </motion.p>
    </AnimatePresence>
  );
}

export default FormFieldFeedback;
