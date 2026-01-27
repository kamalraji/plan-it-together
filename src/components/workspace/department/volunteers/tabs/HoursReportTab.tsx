import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, Download, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HoursReportTabProps {
  workspace: Workspace;
}

interface VolunteerHours {
  id: string;
  name: string;
  totalHours: number;
  shiftsCompleted: number;
  avgHoursPerShift: number;
  rank: number;
}

const mockHoursData: VolunteerHours[] = [
  { id: '1', name: 'Alice Johnson', totalHours: 48, shiftsCompleted: 12, avgHoursPerShift: 4, rank: 1 },
  { id: '2', name: 'Bob Smith', totalHours: 40, shiftsCompleted: 10, avgHoursPerShift: 4, rank: 2 },
  { id: '3', name: 'Carol Davis', totalHours: 36, shiftsCompleted: 9, avgHoursPerShift: 4, rank: 3 },
  { id: '4', name: 'David Wilson', totalHours: 32, shiftsCompleted: 8, avgHoursPerShift: 4, rank: 4 },
  { id: '5', name: 'Emma Brown', totalHours: 28, shiftsCompleted: 7, avgHoursPerShift: 4, rank: 5 },
];

export function HoursReportTab({ workspace: _workspace }: HoursReportTabProps) {
  const [dateRange, setDateRange] = useState('this-month');

  const totalHours = mockHoursData.reduce((acc, v) => acc + v.totalHours, 0);
  const totalShifts = mockHoursData.reduce((acc, v) => acc + v.shiftsCompleted, 0);
  const avgHours = totalHours / mockHoursData.length;

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
            <div className="text-2xl font-bold text-rose-600">{totalHours}</div>
            <div className="text-xs text-muted-foreground">Total Hours</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{totalShifts}</div>
            <div className="text-xs text-muted-foreground">Shifts Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{avgHours.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Avg Hours/Person</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{mockHoursData.length}</div>
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
          <div className="space-y-3">
            {mockHoursData.map(volunteer => (
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
                    <p className="font-bold text-lg">{volunteer.totalHours}h</p>
                    <p className="text-xs text-muted-foreground">
                      ~{volunteer.avgHoursPerShift}h/shift
                    </p>
                  </div>
                  <Progress 
                    value={(volunteer.totalHours / mockHoursData[0].totalHours) * 100}
                    className="w-24 h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
