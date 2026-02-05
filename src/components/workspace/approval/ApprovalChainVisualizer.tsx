import { Check, X, Clock, User, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApprovalStep } from '@/hooks/useMultiStepApproval';

interface ApprovalChainVisualizerProps {
  steps: ApprovalStep[];
  currentStepOrder?: number;
  className?: string;
  compact?: boolean;
}

export function ApprovalChainVisualizer({
  steps,
  className,
  compact = false,
}: ApprovalChainVisualizerProps) {
  const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {sortedSteps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <StepIndicator step={step} size="sm" />
            {index < sortedSteps.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-sm font-medium text-foreground">Approval Chain</h4>
      <div className="relative">
        {/* Vertical line connecting steps */}
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />
        
        <div className="space-y-4">
          {sortedSteps.map((step) => (
            <div key={step.id} className="flex items-start gap-3 relative">
              <StepIndicator step={step} size="md" />
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {step.approverName || 'Approver'}
                  </span>
                  {step.approverRole && (
                    <span className="text-xs text-muted-foreground">
                      ({step.approverRole})
                    </span>
                  )}
                  {!step.isRequired && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
                {step.comments && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    "{step.comments}"
                  </p>
                )}
                {step.decidedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(step.decidedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  step: ApprovalStep;
  size: 'sm' | 'md';
}

function StepIndicator({ step, size }: StepIndicatorProps) {
  const sizeClasses = size === 'sm' ? 'h-5 w-5' : 'h-8 w-8';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  const getStatusStyles = () => {
    switch (step.status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/30';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'skipped':
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
      case 'pending':
      default:
        return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  const getIcon = () => {
    switch (step.status) {
      case 'approved':
        return <Check className={iconSize} />;
      case 'rejected':
        return <X className={iconSize} />;
      case 'skipped':
        return <User className={iconSize} />;
      case 'pending':
      default:
        return <Clock className={iconSize} />;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border-2 z-10 bg-background',
        sizeClasses,
        getStatusStyles()
      )}
    >
      {getIcon()}
    </div>
  );
}
