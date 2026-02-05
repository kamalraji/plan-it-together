import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, Clock, Trophy, Medal, ThumbsUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useVolunteerPerformance, usePerformanceStats } from '@/hooks/useVolunteerPerformance';

interface PerformanceReviewTabProps {
  workspace: Workspace;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Trophy className="h-5 w-5 text-warning" />;
    case 2: return <Medal className="h-5 w-5 text-muted-foreground" />;
    case 3: return <Medal className="h-5 w-5 text-warning" />;
    default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getAttendanceBadgeColor = (rate: number) => {
  if (rate >= 95) return 'border-emerald-500/30 text-emerald-600';
  if (rate >= 80) return 'border-warning/30 text-warning';
  return 'border-destructive/30 text-destructive';
};

export function PerformanceReviewTab({ workspace }: PerformanceReviewTabProps) {
  const [selectedTab, setSelectedTab] = useState('leaderboard');
  
  const { data: performanceData = [], isLoading, refetch, isFetching } = useVolunteerPerformance(workspace.id);
  const stats = usePerformanceStats(workspace.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-warning" />
            Performance Review
          </h2>
          <p className="text-muted-foreground mt-1">
            Track volunteer performance and recognition
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
            <ThumbsUp className="h-4 w-4 mr-2" />
            Give Kudos
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{stats.totalHours}</div>
            <div className="text-xs text-muted-foreground">Total Hours Logged</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.avgAttendance}%</div>
            <div className="text-xs text-muted-foreground">Avg Attendance</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.totalKudos}</div>
            <div className="text-xs text-muted-foreground">Kudos Given</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-info">{stats.activeVolunteers}</div>
            <div className="text-xs text-muted-foreground">Active Volunteers</div>
          </CardContent>
        </Card>
      </div>

      {performanceData.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-foreground mb-1">No performance data yet</h3>
            <p className="text-sm text-muted-foreground">
              Performance metrics will appear as volunteers complete shifts
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="details">Detailed View</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="mt-6">
            {/* Top 3 Podium */}
            {performanceData.length >= 3 && (
              <Card className="mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500/20 via-slate-400/20 to-amber-600/20 p-6">
                  <div className="flex items-end justify-center gap-4">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                      <Avatar className="h-16 w-16 border-4 border-slate-400">
                        <AvatarFallback className="bg-slate-400/20 text-muted-foreground">
                          {performanceData[1]?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <Medal className="h-6 w-6 text-muted-foreground mt-2" />
                      <p className="font-medium text-sm mt-1">{performanceData[1]?.name}</p>
                      <p className="text-xs text-muted-foreground">{performanceData[1]?.hoursLogged}h</p>
                      <div className="h-20 w-20 bg-slate-400/20 rounded-t-lg mt-2" />
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center -mb-4">
                      <Avatar className="h-20 w-20 border-4 border-warning">
                        <AvatarFallback className="bg-warning/20 text-warning">
                          {performanceData[0]?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <Trophy className="h-8 w-8 text-warning mt-2" />
                      <p className="font-semibold mt-1">{performanceData[0]?.name}</p>
                      <p className="text-xs text-muted-foreground">{performanceData[0]?.hoursLogged}h</p>
                      <div className="h-28 w-24 bg-warning/20 rounded-t-lg mt-2" />
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                      <Avatar className="h-14 w-14 border-4 border-amber-600">
                        <AvatarFallback className="bg-warning/20 text-warning">
                          {performanceData[2]?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <Medal className="h-5 w-5 text-warning mt-2" />
                      <p className="font-medium text-sm mt-1">{performanceData[2]?.name}</p>
                      <p className="text-xs text-muted-foreground">{performanceData[2]?.hoursLogged}h</p>
                      <div className="h-14 w-20 bg-warning/20 rounded-t-lg mt-2" />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Full Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Full Rankings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {performanceData.map(volunteer => (
                  <div
                    key={volunteer.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 flex justify-center">
                        {getRankIcon(volunteer.rank)}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm">
                          {volunteer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{volunteer.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {volunteer.hoursLogged}h logged
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < Math.floor(volunteer.rating) ? 'text-warning fill-yellow-500' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      <Badge variant="outline" className={getAttendanceBadgeColor(volunteer.attendanceRate)}>
                        {volunteer.attendanceRate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <div className="grid gap-4">
              {performanceData.map(volunteer => (
                <Card key={volunteer.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{volunteer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{volunteer.name}</h4>
                          <div className="flex items-center gap-1">
                            {getRankIcon(volunteer.rank)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Shifts</p>
                            <p className="font-medium">{volunteer.shiftsCompleted}/{volunteer.shiftsAssigned}</p>
                            <Progress 
                              value={volunteer.shiftsAssigned > 0 ? (volunteer.shiftsCompleted / volunteer.shiftsAssigned) * 100 : 0} 
                              className="h-1.5 mt-1" 
                            />
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Hours</p>
                            <p className="font-medium">{volunteer.hoursLogged}h</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Attendance</p>
                            <p className="font-medium">{volunteer.attendanceRate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Kudos</p>
                            <p className="font-medium flex items-center gap-1">
                              <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                              {volunteer.kudosReceived}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
