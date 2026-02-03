import { useState } from 'react';
import { useWeeklyTimeReport } from '@/hooks/useTimeReports';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Download, Clock, Users, FolderKanban, Calendar } from 'lucide-react';


interface WeeklyTimeReportProps {
  workspaceId: string;
}

export function WeeklyTimeReport({ workspaceId }: WeeklyTimeReportProps) {
  const [weekDate, setWeekDate] = useState(new Date());
  const { data, isLoading } = useWeeklyTimeReport(workspaceId, weekDate);

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

  const goToPrevWeek = () => setWeekDate(subWeeks(weekDate, 1));
  const goToNextWeek = () => setWeekDate(addWeeks(weekDate, 1));
  const goToCurrentWeek = () => setWeekDate(new Date());

  const exportToCSV = () => {
    if (!data) return;

    const headers = ['Date', 'User', 'Task', 'Hours', 'Description', 'Status'];
    const rows = data.entries.map(e => [
      e.date,
      e.userName,
      e.taskTitle || 'No task',
      e.hours.toString(),
      e.description || '',
      e.status,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-report-${format(weekStart, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  const maxHours = Math.max(...(data?.byDay || []).map(d => d.hours), 8);

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 bg-muted rounded-md">
            <span className="font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
            Today
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.totalHours.toFixed(1) || 0}</p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.billableHours.toFixed(1) || 0}</p>
                <p className="text-sm text-muted-foreground">Billable Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.byUser.length || 0}</p>
                <p className="text-sm text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FolderKanban className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.byTask.length || 0}</p>
                <p className="text-sm text-muted-foreground">Tasks Worked On</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-40">
            {data?.byDay.map((day) => {
              const heightPercent = maxHours > 0 ? (day.hours / maxHours) * 100 : 0;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-medium">{day.hours.toFixed(1)}h</div>
                  <div className="w-full bg-muted rounded-t-sm relative" style={{ height: '100px' }}>
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(day.date), 'EEE')}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hours by Task */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hours by Task</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.byTask.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No task data</p>
            ) : (
              <div className="space-y-3">
                {data?.byTask.slice(0, 5).map((task) => {
                  const percent = data.totalHours > 0 ? (task.hours / data.totalHours) * 100 : 0;
                  return (
                    <div key={task.taskId}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="truncate max-w-[200px]">{task.taskTitle}</span>
                        <span className="font-medium">{task.hours.toFixed(1)}h</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hours by Team Member */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hours by Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.byUser.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No team data</p>
            ) : (
              <div className="space-y-3">
                {data?.byUser.slice(0, 5).map((user) => {
                  const percent = data.totalHours > 0 ? (user.hours / data.totalHours) * 100 : 0;
                  return (
                    <div key={user.userId}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {user.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="truncate max-w-[150px]">{user.userName}</span>
                        </div>
                        <span className="font-medium">{user.hours.toFixed(1)}h</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hours by Category */}
      {data && data.byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hours by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.byCategory.map((cat) => (
                <Badge key={cat.category} variant="secondary" className="px-3 py-1">
                  {cat.category.replace('_', ' ')}
                  <span className="ml-2 font-bold">{cat.hours.toFixed(1)}h</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
