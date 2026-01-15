import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, User, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventPublishStatusIndicatorProps {
  eventId: string;
  compact?: boolean;
}

/**
 * Compact status indicator showing publish request status.
 * Displayed across all workspace levels to show current approval state.
 */
export const EventPublishStatusIndicator: React.FC<EventPublishStatusIndicatorProps> = ({ 
  eventId,
  compact = false 
}) => {
  const { data: request, isLoading } = useQuery({
    queryKey: ['event-publish-status', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_publish_requests')
        .select(`
          id,
          status,
          requested_at,
          requested_by,
          reviewed_at,
          reviewer_id,
          review_notes,
          priority
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch requester name
      let requesterName = 'Unknown';
      if (data.requested_by) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', data.requested_by)
          .maybeSingle();
        if (profile?.full_name) requesterName = profile.full_name;
      }

      return {
        ...data,
        requesterName,
      };
    },
    enabled: !!eventId,
  });

  if (isLoading) {
    return compact ? (
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    ) : null;
  }

  if (!request) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending Approval',
          icon: Clock,
          className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400',
          badgeClass: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
        };
      case 'approved':
        return {
          label: 'Approved',
          icon: CheckCircle,
          className: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400',
          badgeClass: 'bg-green-500/20 text-green-700 dark:text-green-400',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          icon: XCircle,
          className: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400',
          badgeClass: 'bg-red-500/20 text-red-700 dark:text-red-400',
        };
      default:
        return {
          label: status,
          icon: Clock,
          className: 'bg-muted',
          badgeClass: '',
        };
    }
  };

  const config = getStatusConfig(request.status);
  const Icon = config.icon;

  if (compact) {
    return (
      <Badge className={cn('gap-1', config.badgeClass)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border',
      config.className
    )}>
      <Icon className="h-5 w-5 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{config.label}</span>
          {request.priority && request.priority !== 'medium' && (
            <Badge variant="outline" className="text-xs capitalize">
              {request.priority}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {request.requesterName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(request.requested_at), 'MMM d, yyyy')}
          </span>
        </div>
        {request.status === 'rejected' && request.review_notes && (
          <p className="text-xs mt-2 text-muted-foreground">
            <span className="font-medium">Reason:</span> {request.review_notes}
          </p>
        )}
      </div>
    </div>
  );
};
