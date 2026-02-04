import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  UserCheck,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

interface CheckInMonitorProps {
  workspaceId: string;
}

interface RecentCheckIn {
  id: string;
  name: string;
  ticketType: string;
  checkInTime: Date;
  station: string;
}

const recentCheckIns: RecentCheckIn[] = [
  { id: '1', name: 'Priya Sharma', ticketType: 'VIP', checkInTime: new Date('2025-01-05T09:45:00'), station: 'Gate A' },
  { id: '2', name: 'Rahul Patel', ticketType: 'General', checkInTime: new Date('2025-01-05T09:43:00'), station: 'Gate B' },
  { id: '3', name: 'Meera Nair', ticketType: 'VIP', checkInTime: new Date('2025-01-05T09:42:00'), station: 'Gate A' },
  { id: '4', name: 'Vikram Singh', ticketType: 'Student', checkInTime: new Date('2025-01-05T09:40:00'), station: 'Gate C' },
];

export function CheckInMonitor({ workspaceId: _workspaceId }: CheckInMonitorProps) {
  const checkInStats = {
    totalCheckedIn: 847,
    totalRegistered: 1250,
    checkInsLastHour: 156,
    avgCheckInTime: 12, // seconds
    peakHour: '10:00 AM',
    activeStations: 4,
  };

  const checkInRate = Math.round((checkInStats.totalCheckedIn / checkInStats.totalRegistered) * 100);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Live Check-In Monitor</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {checkInStats.activeStations} stations active
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Check-in Progress</span>
            <span className="font-semibold">{checkInRate}%</span>
          </div>
          <Progress value={checkInRate} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{checkInStats.totalCheckedIn.toLocaleString()} checked in</span>
            <span>{checkInStats.totalRegistered.toLocaleString()} total</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/40 text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              {checkInStats.checkInsLastHour}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last hour</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/40 text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-blue-600">
              <Zap className="w-4 h-4" />
              {checkInStats.avgCheckInTime}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg time</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/40 text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-violet-600">
              <Clock className="w-4 h-4" />
              {checkInStats.peakHour}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Peak hour</p>
          </div>
        </div>

        {/* Recent Check-ins */}
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Check-ins</h4>
          <div className="space-y-2">
            {recentCheckIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium">{checkIn.name}</p>
                    <p className="text-xs text-muted-foreground">{checkIn.station}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    {checkIn.ticketType}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(checkIn.checkInTime, 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
