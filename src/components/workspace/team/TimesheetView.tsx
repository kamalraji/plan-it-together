import { useState } from 'react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Send, Trash2 } from 'lucide-react';
import { format, addWeeks, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimesheetViewProps {
  workspaceId: string;
}

export function TimesheetView({ workspaceId }: TimesheetViewProps) {
  const { user } = useAuth();
  const { getWeeklyTimesheet, submitTimesheet, deleteEntry, isSubmitting } = useTimeTracking(workspaceId, user?.id);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const timesheet = getWeeklyTimesheet(currentWeek);
  const draftEntries = timesheet.days
    .flatMap(d => d.entries)
    .filter(e => e.status === 'draft');

  const handleSubmitTimesheet = () => {
    if (draftEntries.length > 0) {
      submitTimesheet(draftEntries.map(e => e.id));
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    submitted: 'bg-blue-500/20 text-blue-600',
    approved: 'bg-green-500/20 text-green-600',
    rejected: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Weekly Timesheet</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground min-w-[180px] text-center">
            {format(timesheet.weekStart, 'MMM d')} - {format(timesheet.weekEnd, 'MMM d, yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[560px]">
          {timesheet.days.map((day) => (
            <div key={day.date} className="space-y-2">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">{format(new Date(day.date), 'EEE')}</p>
                <p className="text-sm font-medium text-foreground">{format(new Date(day.date), 'd')}</p>
              </div>

              <div className={cn(
                "min-h-[80px] p-2 rounded-lg border border-border/50",
                day.totalHours > 0 ? "bg-primary/5" : "bg-muted/20"
              )}>
                {day.entries.length > 0 ? (
                  <div className="space-y-1">
                    {day.entries.map((entry) => (
                      <div 
                        key={entry.id} 
                        className="group text-xs p-1.5 rounded bg-background border border-border/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{Number(entry.hours).toFixed(1)}h</span>
                          {entry.status === 'draft' && (
                            <button 
                              onClick={() => deleteEntry(entry.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </button>
                          )}
                        </div>
                        <Badge variant="secondary" className={cn("text-[10px] px-1 py-0", statusColors[entry.status])}>
                          {entry.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center pt-6">-</p>
                )}
              </div>

              <div className="text-center text-xs font-medium text-muted-foreground">
                {day.totalHours.toFixed(1)}h
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Hours</p>
            <p className="text-2xl font-bold text-foreground">{timesheet.totalHours.toFixed(1)}</p>
          </div>
          {draftEntries.length > 0 && (
            <Badge variant="secondary" className="bg-muted">
              {draftEntries.length} draft {draftEntries.length === 1 ? 'entry' : 'entries'}
            </Badge>
          )}
        </div>

        {draftEntries.length > 0 && (
          <Button onClick={handleSubmitTimesheet} disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            Submit for Approval
          </Button>
        )}
      </div>
    </div>
  );
}
