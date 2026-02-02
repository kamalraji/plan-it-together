import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Trophy, 
  Medal,
  Clock, 
  UserCheck,
  TrendingUp,
  TrendingDown,
  Star,
  Users,
  Loader2,
  Download,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VolunteerPerformanceTabProps {
  workspaceId: string;
}

interface VolunteerMetrics {
  userId: string;
  name: string;
  hoursLogged: number;
  shiftsCompleted: number;
  shiftsAssigned: number;
  attendanceRate: number;
  punctualityRate: number;
  rating: number;
  trend: 'up' | 'down' | 'stable';
}

export function VolunteerPerformanceTab({ workspaceId }: VolunteerPerformanceTabProps) {
  const [timeRange, setTimeRange] = useState('all');
  const [sortBy, setSortBy] = useState('hours');

  const { data, isLoading } = useQuery({
    queryKey: ['volunteer-performance-full', workspaceId, timeRange],
    queryFn: async () => {
      // Fetch shifts
      const { data: shifts, error: shiftsError } = await supabase
        .from('volunteer_shifts')
        .select('id')
        .eq('workspace_id', workspaceId);

      if (shiftsError) throw shiftsError;
      if (!shifts || shifts.length === 0) {
        return { volunteers: [], summary: { totalHours: 0, avgAttendance: 0, avgPunctuality: 0, topPerformer: null } };
      }

      const shiftIds = shifts.map(s => s.id);

      // Fetch assignments with aggregation
      const { data: assignments, error: assignError } = await supabase
        .from('volunteer_assignments')
        .select('user_id, hours_logged, status, check_in_time, shift_id')
        .in('shift_id', shiftIds);

      if (assignError) throw assignError;

      // Get unique user IDs and fetch profiles
      const userIds = [...new Set(assignments?.map(a => a.user_id) || [])];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Aggregate by user
      const userStats = new Map<string, {
        hoursLogged: number;
        shiftsCompleted: number;
        shiftsAssigned: number;
        onTimeCount: number;
        noShowCount: number;
      }>();

      assignments?.forEach(a => {
        const current = userStats.get(a.user_id) || {
          hoursLogged: 0,
          shiftsCompleted: 0,
          shiftsAssigned: 0,
          onTimeCount: 0,
          noShowCount: 0,
        };

        current.shiftsAssigned++;
        current.hoursLogged += a.hours_logged || 0;

        if (a.status === 'COMPLETED' || a.status === 'CHECKED_IN') {
          current.shiftsCompleted++;
          if (a.check_in_time) {
            current.onTimeCount++;
          }
        } else if (a.status === 'NO_SHOW') {
          current.noShowCount++;
        }

        userStats.set(a.user_id, current);
      });

      // Build volunteer metrics
      const volunteers: VolunteerMetrics[] = Array.from(userStats.entries()).map(([userId, stats]) => {
        const attendanceRate = stats.shiftsAssigned > 0 
          ? Math.round((stats.shiftsCompleted / stats.shiftsAssigned) * 100) 
          : 0;
        const punctualityRate = stats.shiftsCompleted > 0 
          ? Math.round((stats.onTimeCount / stats.shiftsCompleted) * 100) 
          : 0;
        
        // Calculate rating (simple weighted average)
        const rating = Math.min(5, (attendanceRate * 0.4 + punctualityRate * 0.3 + Math.min(100, stats.hoursLogged * 2) * 0.3) / 20);

        return {
          userId,
          name: profileMap.get(userId) || 'Unknown',
          hoursLogged: stats.hoursLogged,
          shiftsCompleted: stats.shiftsCompleted,
          shiftsAssigned: stats.shiftsAssigned,
          attendanceRate,
          punctualityRate,
          rating: Math.round(rating * 10) / 10,
          trend: attendanceRate >= 90 ? 'up' : attendanceRate >= 70 ? 'stable' : 'down',
        };
      });

      // Sort volunteers
      volunteers.sort((a, b) => {
        if (sortBy === 'hours') return b.hoursLogged - a.hoursLogged;
        if (sortBy === 'attendance') return b.attendanceRate - a.attendanceRate;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0;
      });

      // Calculate summary
      const totalHours = volunteers.reduce((sum, v) => sum + v.hoursLogged, 0);
      const avgAttendance = volunteers.length > 0 
        ? Math.round(volunteers.reduce((sum, v) => sum + v.attendanceRate, 0) / volunteers.length) 
        : 0;
      const avgPunctuality = volunteers.length > 0 
        ? Math.round(volunteers.reduce((sum, v) => sum + v.punctualityRate, 0) / volunteers.length) 
        : 0;

      return {
        volunteers,
        summary: {
          totalHours,
          avgAttendance,
          avgPunctuality,
          topPerformer: volunteers[0] || null,
        },
      };
    },
  });

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <span className="h-4 w-4 text-muted-foreground">—</span>;
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-amber-500';
    if (index === 1) return 'text-slate-400';
    if (index === 2) return 'text-amber-700';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { volunteers = [], summary } = data || { volunteers: [], summary: { totalHours: 0, avgAttendance: 0, avgPunctuality: 0, topPerformer: null } };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">Track volunteer metrics and recognize top performers</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.totalHours || 0}</p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <UserCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.avgAttendance || 0}%</p>
                <p className="text-xs text-muted-foreground">Avg Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.avgPunctuality || 0}%</p>
                <p className="text-xs text-muted-foreground">Avg Punctuality</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-lg font-bold truncate">{summary?.topPerformer?.name || 'N/A'}</p>
                <p className="text-xs text-amber-700">Top Performer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-500" />
              Volunteer Leaderboard
            </CardTitle>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Hours Logged</SelectItem>
                <SelectItem value="attendance">Attendance Rate</SelectItem>
                <SelectItem value="rating">Overall Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {volunteers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-medium">No volunteer data yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Performance metrics will appear once volunteers complete shifts
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {volunteers.map((volunteer, index) => (
                <div
                  key={volunteer.userId}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-muted/30',
                    index < 3 && 'bg-gradient-to-r from-amber-50/50 to-transparent border-amber-200/50'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center">
                      {index < 3 ? (
                        <Medal className={cn('h-6 w-6 mx-auto', getMedalColor(index))} />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      )}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {volunteer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{volunteer.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{volunteer.shiftsCompleted}/{volunteer.shiftsAssigned} shifts</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          {volunteer.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold">{volunteer.hoursLogged}h</p>
                      <p className="text-xs text-muted-foreground">Hours</p>
                    </div>
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Attendance</span>
                        <span className="font-medium">{volunteer.attendanceRate}%</span>
                      </div>
                      <Progress value={volunteer.attendanceRate} className="h-1.5" />
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(volunteer.trend)}
                      <Badge
                        variant="outline"
                        className={cn(
                          volunteer.attendanceRate >= 90 && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                          volunteer.attendanceRate >= 70 && volunteer.attendanceRate < 90 && 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                          volunteer.attendanceRate < 70 && 'bg-red-500/10 text-red-600 border-red-500/20'
                        )}
                      >
                        {volunteer.attendanceRate >= 90 ? 'Excellent' : volunteer.attendanceRate >= 70 ? 'Good' : 'Needs Attention'}
                      </Badge>
                    </div>
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
