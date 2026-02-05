import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic2, Clock, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useSpeakers } from '@/hooks/useContentDepartmentData';

interface SpeakerScheduleWidgetProps {
  workspaceId?: string;
}

const statusConfig = {
  confirmed: { label: 'Confirmed', icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-500' },
  pending: { label: 'Pending', icon: AlertCircle, className: 'bg-warning/10 text-warning' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
};

export function SpeakerScheduleWidget({ workspaceId }: SpeakerScheduleWidgetProps) {
  const { data: speakers = [], isLoading } = useSpeakers(workspaceId || '');
  
  const confirmedCount = speakers.filter(s => s.status === 'confirmed').length;

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center h-[350px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <Mic2 className="h-4 w-4 text-emerald-500" />
            </div>
            Speaker Schedule
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {confirmedCount}/{speakers.length} confirmed
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          {speakers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mic2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No speakers scheduled yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {speakers.map((speaker) => {
                const status = statusConfig[speaker.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={speaker.id}
                    className="p-3 rounded-lg border border-border bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={speaker.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {speaker.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-sm text-foreground truncate">
                            {speaker.name}
                          </h4>
                          <Badge variant="outline" className={status.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{speaker.role || 'Speaker'}</p>
                        <p className="text-sm text-foreground mt-1 truncate">
                          {speaker.session_title || 'Session TBD'}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {speaker.session_time && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{speaker.session_time}</span>
                            </div>
                          )}
                          {speaker.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{speaker.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
