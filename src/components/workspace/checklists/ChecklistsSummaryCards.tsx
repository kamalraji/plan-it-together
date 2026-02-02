import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, Clock, CheckCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EventPhase = 'pre_event' | 'during_event' | 'post_event';

interface PhaseProgress {
  total: number;
  completed: number;
  percentage: number;
}

interface ChecklistsSummaryCardsProps {
  preEventProgress: PhaseProgress;
  duringEventProgress: PhaseProgress;
  postEventProgress: PhaseProgress;
  activePhase: EventPhase | 'all';
  onPhaseClick: (phase: EventPhase | 'all') => void;
}

const phaseConfig = {
  pre_event: {
    label: 'Pre-Event',
    icon: ClipboardList,
    description: 'Planning & Preparation',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    progressColor: 'bg-blue-500',
  },
  during_event: {
    label: 'During Event',
    icon: Clock,
    description: 'Day-of Execution',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    progressColor: 'bg-amber-500',
  },
  post_event: {
    label: 'Post-Event',
    icon: CheckCircle,
    description: 'Wrap-up & Follow-up',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    progressColor: 'bg-green-500',
  },
};

export function ChecklistsSummaryCards({
  preEventProgress,
  duringEventProgress,
  postEventProgress,
  activePhase,
  onPhaseClick,
}: ChecklistsSummaryCardsProps) {
  const phases: { phase: EventPhase; progress: PhaseProgress }[] = [
    { phase: 'pre_event', progress: preEventProgress },
    { phase: 'during_event', progress: duringEventProgress },
    { phase: 'post_event', progress: postEventProgress },
  ];

  const totalItems = preEventProgress.total + duringEventProgress.total + postEventProgress.total;
  const totalCompleted = preEventProgress.completed + duringEventProgress.completed + postEventProgress.completed;
  const overallProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        activePhase === 'all' && "ring-2 ring-primary"
      )} onClick={() => onPhaseClick('all')}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">All Checklists</h3>
              <p className="text-xs text-muted-foreground">
                {totalCompleted} of {totalItems} items completed
              </p>
            </div>
            <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Phase Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {phases.map(({ phase, progress }) => {
          const config = phaseConfig[phase];
          const Icon = config.icon;
          const isActive = activePhase === phase;

          return (
            <Card
              key={phase}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isActive && "ring-2 ring-primary",
                config.borderColor
              )}
              onClick={() => onPhaseClick(phase)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2 rounded-lg", config.bgColor)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm truncate">{config.label}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{config.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {progress.completed}/{progress.total} items
                    </span>
                    <span className={cn("font-semibold", config.color)}>
                      {progress.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", config.progressColor)}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
