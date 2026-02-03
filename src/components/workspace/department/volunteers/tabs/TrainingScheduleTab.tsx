import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, Clock, Users, Plus, Video, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTrainingSessions, TrainingSession } from '@/hooks/useTrainingSessions';
import { SkeletonStatsGrid, SkeletonCard } from '@/components/ui/skeleton-patterns';

interface TrainingScheduleTabProps {
  workspace: Workspace;
}

export function TrainingScheduleTab({ workspace }: TrainingScheduleTabProps) {
  const { sessions, isLoading, stats } = useTrainingSessions(workspace.id);

  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const inProgressSessions = sessions.filter(s => s.status === 'in-progress');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'virtual': return <Video className="h-4 w-4 text-blue-500" />;
      case 'in-person': return <MapPin className="h-4 w-4 text-emerald-500" />;
      default: return <BookOpen className="h-4 w-4 text-purple-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'virtual': return 'border-blue-500/30 text-blue-600';
      case 'in-person': return 'border-emerald-500/30 text-emerald-600';
      default: return 'border-purple-500/30 text-purple-600';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-rose-500" />
              Training Schedule
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage volunteer training sessions
            </p>
          </div>
        </div>
        <SkeletonStatsGrid count={4} />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-rose-500" />
            Training Schedule
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage volunteer training sessions
          </p>
        </div>
        <Button className="bg-rose-500 hover:bg-rose-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Training
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-rose-600">{stats.totalSessions}</div>
            <div className="text-xs text-muted-foreground">Total Sessions</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.upcomingSessions}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.totalEnrolled}</div>
            <div className="text-xs text-muted-foreground">Total Enrolled</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.completedSessions}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {sessions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No training sessions</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Schedule training sessions for your volunteers to help them prepare for the event.
            </p>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Training
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-rose-500" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSessions.map(session => (
              <SessionCard key={session.id} session={session} getTypeIcon={getTypeIcon} getTypeBadge={getTypeBadge} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* In Progress */}
      {inProgressSessions.length > 0 && (
        <Card className="border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {inProgressSessions.map(session => (
              <SessionCard key={session.id} session={session} getTypeIcon={getTypeIcon} getTypeBadge={getTypeBadge} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed */}
      {completedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Completed Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 opacity-70">
            {completedSessions.map(session => (
              <SessionCard key={session.id} session={session} getTypeIcon={getTypeIcon} getTypeBadge={getTypeBadge} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SessionCard({ 
  session, 
  getTypeIcon, 
  getTypeBadge 
}: { 
  session: TrainingSession; 
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeBadge: (type: string) => string;
}) {
  const enrollmentPercent = session.capacity > 0 
    ? (session.enrolled / session.capacity) * 100 
    : 0;
  const spotsLeft = Math.max(0, session.capacity - session.enrolled);

  return (
    <div 
      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
      role="listitem"
      aria-label={`Training: ${session.title}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-foreground">{session.title}</h4>
            <Badge variant="outline" className={getTypeBadge(session.type)}>
              {getTypeIcon(session.type)}
              <span className="ml-1 capitalize">{session.type}</span>
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(session.date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {session.time} ({session.duration})
            </span>
            {session.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {session.location}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Instructor: {session.instructor}
          </p>
        </div>
        <div className="text-right min-w-[100px]">
          <div className="flex items-center gap-1 justify-end mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{session.enrolled}/{session.capacity}</span>
          </div>
          <Progress value={enrollmentPercent} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">
            {spotsLeft} spots left
          </p>
        </div>
      </div>
    </div>
  );
}
