import { useTeamTimeEntries } from '@/hooks/useTimeTracking';
import { LazyAvatar } from '@/components/ui/lazy-avatar';
import { Progress } from '@/components/ui/progress';

import { Button } from '@/components/ui/button';
import { BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkloadReportProps {
  workspaceId: string;
  targetHoursPerWeek?: number;
}

export function WorkloadReport({ workspaceId, targetHoursPerWeek = 40 }: WorkloadReportProps) {
  const { entries, getWorkloadReport, approveEntry, rejectEntry, isLoading } = useTeamTimeEntries(workspaceId);
  const report = getWorkloadReport();
  
  const pendingEntries = entries.filter((e: any) => e.status === 'submitted');

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workload Distribution */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Team Workload</h3>
        </div>

        {report.length > 0 ? (
          <div className="space-y-4">
            {report.map((member) => {
              const utilizationPercent = (member.totalHours / targetHoursPerWeek) * 100;
              const isOverloaded = utilizationPercent > 100;
              
              return (
                <div key={member.userId} className="flex items-center gap-3">
                  <LazyAvatar 
                    src={member.avatar} 
                    name={member.name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{member.entries} entries</span>
                        <span className={cn(
                          "text-sm font-medium",
                          isOverloaded ? "text-destructive" : "text-foreground"
                        )}>
                          {member.totalHours.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(utilizationPercent, 100)} 
                      className={cn("h-2", isOverloaded && "[&>div]:bg-destructive")}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No time entries recorded yet.</p>
        )}
      </div>

      {/* Pending Approvals */}
      {pendingEntries.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Pending Approvals ({pendingEntries.length})
          </h3>
          <div className="space-y-3">
            {pendingEntries.slice(0, 5).map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <LazyAvatar 
                    src={entry.user_profiles?.avatar_url} 
                    name={entry.user_profiles?.full_name || 'Unknown'}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {entry.user_profiles?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.date} • {Number(entry.hours).toFixed(1)} hours
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => approveEntry(entry.id)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-500/10"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => rejectEntry(entry.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
