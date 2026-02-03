import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, Download, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVolunteerHoursReport } from '@/hooks/useVolunteerTimesheets';

interface HoursReportTabProps {
  workspace: Workspace;
}

export function HoursReportTab({ workspace }: HoursReportTabProps) {
  const [dateRange, setDateRange] = useState('this-month');

  // Calculate date range for filtering
  const getDateRange = () => {
    const now = new Date();
    const end = new Date();
    let start: Date;

    switch (dateRange) {
      case 'this-week':
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last-month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end.setDate(0); // Last day of previous month
        break;
      default:
        start = new Date(0); // All time
    }

    return { start, end };
  };

  const { volunteerHours, stats, isLoading } = useVolunteerHoursReport(
    workspace.id,
    dateRange !== 'all-time' ? getDateRange() : undefined
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-rose-500" />
            Hours Report
          </h2>
          <p className="text-muted-foreground mt-1">
            Track volunteer hours across all committees
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-rose-600">{stats.totalHours.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Total Hours</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalShifts}</div>
            <div className="text-xs text-muted-foreground">Shifts Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.avgHoursPerVolunteer.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Avg Hours/Person</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.activeVolunteers}</div>
            <div className="text-xs text-muted-foreground">Active Volunteers</div>
          </CardContent>
        </Card>
      </div>

      {/* Hours Distribution Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-rose-500" />
            Hours Distribution
          </CardTitle>
          <CardDescription>Weekly volunteer hours breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-around gap-2 px-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const height = [45, 60, 75, 55, 80, 95, 70][i];
              return (
                <div key={day} className="flex flex-col items-center gap-2 flex-1">
                  <div 
                    className="w-full bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-md transition-all hover:from-rose-600 hover:to-rose-500"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Volunteer Hours Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Individual Hours</CardTitle>
          <CardDescription>Hours logged by each volunteer</CardDescription>
        </CardHeader>
        <CardContent>
          {volunteerHours.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No hours logged for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {volunteerHours.map(volunteer => (
                <div
                  key={volunteer.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center font-bold text-muted-foreground">
                      #{volunteer.rank}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-rose-500/10 text-rose-600">
                        {volunteer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{volunteer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {volunteer.shiftsCompleted} shifts completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-bold text-lg">{volunteer.totalHours.toFixed(1)}h</p>
                      <p className="text-xs text-muted-foreground">
                        ~{volunteer.avgHoursPerShift.toFixed(1)}h/shift
                      </p>
                    </div>
                    <Progress 
                      value={volunteerHours[0] ? (volunteer.totalHours / volunteerHours[0].totalHours) * 100 : 0}
                      className="w-24 h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
