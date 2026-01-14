
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import type { ChecklistItem } from '@/hooks/useEventPublish';
import { cn } from '@/lib/utils';

interface EventPublishChecklistProps {
  items: ChecklistItem[];
  canPublish: boolean;
  warningCount: number;
  failCount: number;
}

export function EventPublishChecklist({ 
  items, 
  canPublish, 
  warningCount, 
  failCount 
}: EventPublishChecklistProps) {
  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBg = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'fail':
        return 'bg-red-500/10 border-red-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={cn(
        'rounded-lg border p-4',
        canPublish 
          ? 'bg-green-500/10 border-green-500/20' 
          : 'bg-red-500/10 border-red-500/20'
      )}>
        <div className="flex items-center gap-3">
          {canPublish ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <XCircle className="h-6 w-6 text-red-500" />
          )}
          <div>
            <p className={cn(
              'font-medium',
              canPublish ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            )}>
              {canPublish 
                ? 'Ready to Publish' 
                : `${failCount} required item${failCount > 1 ? 's' : ''} need attention`}
            </p>
            {warningCount > 0 && canPublish && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                {warningCount} optional item{warningCount > 1 ? 's' : ''} could be improved
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div 
            key={item.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3',
              getStatusBg(item.status)
            )}
          >
            {getStatusIcon(item.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
                {item.required && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          Required items must pass before publishing. Optional items are recommendations 
          that can help improve your event's visibility and organization.
        </p>
      </div>
    </div>
  );
}
