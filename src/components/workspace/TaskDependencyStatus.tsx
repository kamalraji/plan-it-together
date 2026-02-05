import { WorkspaceTask } from '@/types';
import { getBlockingStatus } from '@/lib/taskDependencyGraph';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TaskDependencyStatusProps {
  task: WorkspaceTask;
  allTasks: WorkspaceTask[];
  className?: string;
  showDetails?: boolean;
}

export function TaskDependencyStatus({
  task,
  allTasks,
  className,
  showDetails = false,
}: TaskDependencyStatusProps) {
  const status = getBlockingStatus(task, allTasks);

  if (status.blockedBy === 0 && status.blocking === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        {/* Blocked by indicator */}
        {status.blockedBy > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
                  status.isBlocked
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-success/20 text-success'
                )}
              >
                {status.isBlocked ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {showDetails && (
                  <span>
                    {status.blockedByCompleted}/{status.blockedBy}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {status.isBlocked
                  ? `Blocked by ${status.blockedBy - status.blockedByCompleted} incomplete task(s)`
                  : `All ${status.blockedBy} dependencies completed`}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Blocking indicator */}
        {status.blocking > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">
                <ArrowRight className="h-3 w-3" />
                {showDetails && <span>{status.blocking}</span>}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Blocking {status.blocking} other task(s)</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
