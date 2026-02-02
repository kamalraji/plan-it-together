import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface SectionProgress {
  id: string;
  label: string;
  status: 'empty' | 'partial' | 'complete' | 'error';
  required: boolean;
  errorCount?: number;
}

interface SectionProgressIndicatorProps {
  sections: SectionProgress[];
  onSectionClick?: (sectionId: string) => void;
  compact?: boolean;
  className?: string;
}

export function SectionProgressIndicator({
  sections,
  onSectionClick,
  compact = false,
  className,
}: SectionProgressIndicatorProps) {
  const totalRequired = sections.filter(s => s.required).length;
  const requiredComplete = sections.filter(s => s.required && s.status === 'complete').length;
  const hasErrors = sections.some(s => s.status === 'error');

  const progressPercent = totalRequired > 0 
    ? Math.round((requiredComplete / totalRequired) * 100) 
    : 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              hasErrors ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {requiredComplete}/{totalRequired} required
        </span>
      </div>

      {/* Section dots */}
      <div className="flex items-center justify-between gap-1">
        <TooltipProvider delayDuration={0}>
          {sections.map((section, index) => (
            <Tooltip key={section.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onSectionClick?.(section.id)}
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-200",
                    "hover:ring-2 hover:ring-offset-2 hover:ring-primary/50",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                    compact ? "w-6 h-6 min-w-[24px] min-h-[24px]" : "w-8 h-8 min-w-[32px] min-h-[32px]",
                    section.status === 'complete' && "bg-primary text-primary-foreground",
                    section.status === 'partial' && "bg-primary/20 text-primary border-2 border-primary/50",
                    section.status === 'empty' && "bg-muted text-muted-foreground",
                    section.status === 'error' && "bg-destructive text-destructive-foreground",
                  )}
                  aria-label={`Go to ${section.label} section. Status: ${section.status}${section.required ? ', required' : ', optional'}`}
                >
                  {section.status === 'complete' ? (
                    <Check className={cn(compact ? "h-3 w-3" : "h-4 w-4")} aria-hidden="true" />
                  ) : section.status === 'error' ? (
                    <AlertCircle className={cn(compact ? "h-3 w-3" : "h-4 w-4")} aria-hidden="true" />
                  ) : (
                    <span className={cn("font-medium", compact ? "text-[10px]" : "text-xs")}>{index + 1}</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div className="font-medium">{section.label}</div>
                <div className="text-muted-foreground">
                  {section.status === 'complete' && 'Complete'}
                  {section.status === 'partial' && 'In progress'}
                  {section.status === 'empty' && (section.required ? 'Required' : 'Optional')}
                  {section.status === 'error' && `${section.errorCount || 1} error(s)`}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}

// Helper to calculate section status based on form values and errors
export function calculateSectionStatus(
  sectionId: string,
  formValues: Record<string, any>,
  formErrors: Record<string, any>,
  sectionFieldMap: Record<string, string[]>
): 'empty' | 'partial' | 'complete' | 'error' {
  const fields = sectionFieldMap[sectionId] || [];
  
  // Check for errors first
  const errorCount = fields.filter(field => formErrors[field]).length;
  if (errorCount > 0) return 'error';
  
  // Check completion
  const filledCount = fields.filter(field => {
    const value = formValues[field];
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;

  if (filledCount === 0) return 'empty';
  if (filledCount === fields.length) return 'complete';
  return 'partial';
}
