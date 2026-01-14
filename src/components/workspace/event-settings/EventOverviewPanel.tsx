import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { EventStatusActions } from '@/components/events/publish/EventStatusActions';
import { WorkspacePublishSettings } from '@/components/workspace/settings/WorkspacePublishSettings';
import { EventQuickStats } from './EventQuickStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Globe, Lock, Loader2, ExternalLink } from 'lucide-react';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { Button } from '@/components/ui/button';

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

      {/* Event Quick Stats */}
      <EventQuickStats eventId={eventId} />

      {/* Workspace Publish Settings - ROOT only */}
      {isRootOwner && (
        <WorkspacePublishSettings workspaceId={workspaceId} />
      )}
    </div>
  );
};
