import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, Clock, Trophy, Medal, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PerformanceReviewTabProps {
  workspace: Workspace;
}

interface VolunteerPerformance {
  id: string;
  name: string;
  avatar?: string;
  shiftsCompleted: number;
  shiftsAssigned: number;
  hoursLogged: number;
  attendanceRate: number;
  rating: number;
  kudosReceived: number;
  rank: number;
}

// Mock data
const mockPerformanceData: VolunteerPerformance[] = [
  { id: '1', name: 'Alice Johnson', shiftsCompleted: 12, shiftsAssigned: 12, hoursLogged: 48, attendanceRate: 100, rating: 5, kudosReceived: 8, rank: 1 },
  { id: '2', name: 'Bob Smith', shiftsCompleted: 10, shiftsAssigned: 11, hoursLogged: 40, attendanceRate: 91, rating: 4.5, kudosReceived: 6, rank: 2 },
  { id: '3', name: 'Carol Davis', shiftsCompleted: 8, shiftsAssigned: 10, hoursLogged: 32, attendanceRate: 80, rating: 4, kudosReceived: 5, rank: 3 },
  { id: '4', name: 'David Wilson', shiftsCompleted: 8, shiftsAssigned: 9, hoursLogged: 32, attendanceRate: 89, rating: 4.2, kudosReceived: 4, rank: 4 },
  { id: '5', name: 'Emma Brown', shiftsCompleted: 7, shiftsAssigned: 8, hoursLogged: 28, attendanceRate: 88, rating: 4.1, kudosReceived: 3, rank: 5 },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2: return <Medal className="h-5 w-5 text-slate-400" />;
    case 3: return <Medal className="h-5 w-5 text-amber-600" />;
    default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getAttendanceBadgeColor = (rate: number) => {
  if (rate >= 95) return 'border-emerald-500/30 text-emerald-600';
  if (rate >= 80) return 'border-amber-500/30 text-amber-600';
  return 'border-red-500/30 text-red-600';
};

export function PerformanceReviewTab({ workspace: _workspace }: PerformanceReviewTabProps) {
  const [selectedTab, setSelectedTab] = useState('leaderboard');

  const totalHours = mockPerformanceData.reduce((acc, v) => acc + v.hoursLogged, 0);
  const avgAttendance = Math.round(
    mockPerformanceData.reduce((acc, v) => acc + v.attendanceRate, 0) / mockPerformanceData.length
  );
  const totalKudos = mockPerformanceData.reduce((acc, v) => acc + v.kudosReceived, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            Performance Review
          </h2>
          <p className="text-muted-foreground mt-1">
            Track volunteer performance and recognition
          </p>
        </div>
        <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
          <ThumbsUp className="h-4 w-4 mr-2" />
          Give Kudos
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{totalHours}</div>
            <div className="text-xs text-muted-foreground">Total Hours Logged</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{avgAttendance}%</div>
            <div className="text-xs text-muted-foreground">Avg Attendance</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{totalKudos}</div>
            <div className="text-xs text-muted-foreground">Kudos Given</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{mockPerformanceData.length}</div>
            <div className="text-xs text-muted-foreground">Active Volunteers</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="details">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6">
          {/* Top 3 Podium */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500/20 via-slate-400/20 to-amber-600/20 p-6">
              <div className="flex items-end justify-center gap-4">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-16 w-16 border-4 border-slate-400">
                    <AvatarFallback className="bg-slate-400/20 text-slate-600">
                      {mockPerformanceData[1]?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Medal className="h-6 w-6 text-slate-400 mt-2" />
                  <p className="font-medium text-sm mt-1">{mockPerformanceData[1]?.name}</p>
                  <p className="text-xs text-muted-foreground">{mockPerformanceData[1]?.hoursLogged}h</p>
                  <div className="h-20 w-20 bg-slate-400/20 rounded-t-lg mt-2" />
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center -mb-4">
                  <Avatar className="h-20 w-20 border-4 border-yellow-500">
                    <AvatarFallback className="bg-yellow-500/20 text-yellow-600">
                      {mockPerformanceData[0]?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Trophy className="h-8 w-8 text-yellow-500 mt-2" />
                  <p className="font-semibold mt-1">{mockPerformanceData[0]?.name}</p>
                  <p className="text-xs text-muted-foreground">{mockPerformanceData[0]?.hoursLogged}h</p>
                  <div className="h-28 w-24 bg-yellow-500/20 rounded-t-lg mt-2" />
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-14 w-14 border-4 border-amber-600">
                    <AvatarFallback className="bg-amber-600/20 text-amber-600">
                      {mockPerformanceData[2]?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Medal className="h-5 w-5 text-amber-600 mt-2" />
                  <p className="font-medium text-sm mt-1">{mockPerformanceData[2]?.name}</p>
                  <p className="text-xs text-muted-foreground">{mockPerformanceData[2]?.hoursLogged}h</p>
                  <div className="h-14 w-20 bg-amber-600/20 rounded-t-lg mt-2" />
                </div>
              </div>
            </div>
          </Card>

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Full Rankings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockPerformanceData.map(volunteer => (
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
                        {volunteer.name.split(' ').map(n => n[0]).join('')}
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
                          className={`h-4 w-4 ${i < Math.floor(volunteer.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
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
            {mockPerformanceData.map(volunteer => (
              <Card key={volunteer.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{volunteer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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
                          <Progress value={(volunteer.shiftsCompleted / volunteer.shiftsAssigned) * 100} className="h-1.5 mt-1" />
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
                            <ThumbsUp className="h-3.5 w-3.5 text-purple-500" />
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
    </div>
  );
}
