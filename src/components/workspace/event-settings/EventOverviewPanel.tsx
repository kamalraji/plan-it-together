import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { EventStatusActions } from '@/components/events/publish/EventStatusActions';
import { WorkspacePublishSettings } from '@/components/workspace/settings/WorkspacePublishSettings';
import { EventQuickStats } from './EventQuickStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Globe, Lock, Loader2, ExternalLink, CheckCircle, AlertTriangle, XCircle, ClipboardCheck } from 'lucide-react';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useEventPublish } from '@/hooks/useEventPublish';
import { cn } from '@/lib/utils';

interface EventOverviewPanelProps {
  eventId: string;
  workspaceId: string;
  isRootOwner: boolean;
}

export const EventOverviewPanel: React.FC<EventOverviewPanelProps> = ({
  eventId,
  workspaceId,
  isRootOwner,
}) => {
  const { data: event, isLoading, refetch } = useQuery({
    queryKey: ['event-overview', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, status, start_date, end_date, mode, visibility, capacity, description, landing_page_slug')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { checklist } = useEventPublish(eventId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Event not found
      </div>
    );
  }

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'IN_PERSON': return 'In Person';
      case 'VIRTUAL': return 'Virtual';
      case 'HYBRID': return 'Hybrid';
      default: return mode;
    }
  };

  const getEventTimeStatus = () => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    if (isPast(endDate)) {
      return { label: 'Ended', color: 'bg-muted text-muted-foreground' };
    }
    if (isPast(startDate) && isFuture(endDate)) {
      return { label: 'In Progress', color: 'bg-green-500/20 text-green-700' };
    }
    const daysUntil = differenceInDays(startDate, now);
    if (daysUntil <= 7) {
      return { label: `${daysUntil} days away`, color: 'bg-amber-500/20 text-amber-700' };
    }
    return { label: `${daysUntil} days away`, color: 'bg-blue-500/20 text-blue-700' };
  };

  const timeStatus = getEventTimeStatus();
  const settingsReadiness = checklist.settingsReadiness;

  return (
    <div className="space-y-6">
      {/* Event Status & Actions Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-1" />
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl">{event.name}</CardTitle>
                <Badge className={timeStatus.color}>{timeStatus.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Event lifecycle and publishing controls
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {event.landing_page_slug && event.status === 'PUBLISHED' && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/events/${event.landing_page_slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    View Page
                  </a>
                </Button>
              )}
              <EventStatusActions
                eventId={eventId}
                currentStatus={event.status}
                canManage={isRootOwner}
                onStatusChange={() => refetch()}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Event Quick Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(event.start_date), 'MMM d')} - {format(new Date(event.end_date), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{getModeLabel(event.mode)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {event.visibility === 'PUBLIC' ? (
                <Globe className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span className="capitalize">{event.visibility?.toLowerCase()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publish Readiness Card - Only for DRAFT events */}
      {event.status === 'DRAFT' && settingsReadiness && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Publish Readiness</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {checklist.failCount === 0 ? (
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {checklist.failCount} Issue{checklist.failCount > 1 ? 's' : ''}
                  </Badge>
                )}
                {checklist.warningCount > 0 && (
                  <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {checklist.warningCount} Warning{checklist.warningCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription>
              Complete required settings before publishing your event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{checklist.completionPercentage || 0}%</span>
              </div>
              <Progress value={checklist.completionPercentage || 0} className="h-2" />
            </div>

            {/* Quick Status */}
            <div className="grid grid-cols-2 gap-2">
              {checklist.items.filter(i => i.category === 'event-space').slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg text-sm',
                    item.status === 'pass' && 'bg-green-500/10',
                    item.status === 'warning' && 'bg-yellow-500/10',
                    item.status === 'fail' && 'bg-red-500/10',
                  )}
                >
                  {item.status === 'pass' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {item.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  {item.status === 'fail' && <XCircle className="h-4 w-4 text-red-500" />}
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Issues to Address */}
            {checklist.failCount > 0 && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2">
                  Issues to address before publishing:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {checklist.items.filter(i => i.status === 'fail').map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Workspace Publish Settings - ROOT only */}
      {isRootOwner && (
        <WorkspacePublishSettings workspaceId={workspaceId} />
      )}

      {/* Event Quick Stats */}
      <EventQuickStats eventId={eventId} />
    </div>
  );
};
