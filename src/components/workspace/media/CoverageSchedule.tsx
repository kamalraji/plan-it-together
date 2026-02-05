import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Camera, Video, MapPin, Clock, Loader2 } from 'lucide-react';
import { useCoverageSchedule, CoverageSchedule as CoverageScheduleType } from '@/hooks/useMediaData';
import { format } from 'date-fns';

interface CoverageScheduleProps {
  workspaceId: string;
}

export function CoverageSchedule({ workspaceId }: CoverageScheduleProps) {
  const { schedule, isLoading } = useCoverageSchedule(workspaceId);

  const getTypeIcon = (type: CoverageScheduleType['coverage_type']) => {
    switch (type) {
      case 'photo':
        return <Camera className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'both':
        return (
          <div className="flex items-center gap-1">
            <Camera className="h-3 w-3" />
            <Video className="h-3 w-3" />
          </div>
        );
    }
  };

  const getPriorityColor = (priority: CoverageScheduleType['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/20 text-red-800 border-red-200';
      case 'medium':
        return 'bg-warning/20 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-muted text-foreground border-border';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Coverage Schedule
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Slot
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {schedule.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No coverage scheduled yet
          </p>
        ) : (
          schedule.map((slot) => (
            <div 
              key={slot.id}
              className={`p-3 rounded-lg border-l-4 bg-muted/30 ${getPriorityColor(slot.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-foreground">{slot.event_name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {slot.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {slot.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(slot.start_time), 'HH:mm')} - {format(new Date(slot.end_time), 'HH:mm')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTypeIcon(slot.coverage_type)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {slot.assigned_crew?.map((crew) => (
                    <Badge key={crew.id} variant="outline" className="text-xs">
                      {crew.name.split(' ').map(n => n[0]).join('')}. {crew.name.split(' ').slice(-1)[0]}
                    </Badge>
                  ))}
                </div>
                <Badge variant="secondary" className={getPriorityColor(slot.priority)}>
                  {slot.priority}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}