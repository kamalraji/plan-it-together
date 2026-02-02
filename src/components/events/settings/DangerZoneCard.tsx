import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/looseClient';
import { useNavigate } from 'react-router-dom';
import { EventStatus } from '@/types';

interface DangerZoneCardProps {
  eventId: string;
  eventName: string;
  currentStatus: EventStatus;
  onUpdate: () => void;
}

export const DangerZoneCard: React.FC<DangerZoneCardProps> = ({
  eventId,
  eventName,
  currentStatus,
  onUpdate,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCancelled = currentStatus === EventStatus.CANCELLED;

  const handleCancelEvent = async () => {
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'CANCELLED' })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Event cancelled',
        description: 'The event has been cancelled successfully.',
      });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error cancelling event',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Event deleted',
        description: 'The event has been permanently deleted.',
      });
      navigate('/console/events/list');
    } catch (error) {
      toast({
        title: 'Error deleting event',
        description: 'Please try again. Make sure all related data is removed first.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for this event</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cancel Event */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium text-foreground">Cancel Event</p>
            <p className="text-sm text-muted-foreground">
              Mark this event as cancelled. Participants will be notified.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={isCancelled || isCancelling}
              >
                {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCancelled ? 'Already Cancelled' : 'Cancel Event'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to cancel this event?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark <strong>"{eventName}"</strong> as cancelled. Registered participants
                  may receive notification of the cancellation. This action can be reversed by changing
                  the event status.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Event</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelEvent}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Cancel Event
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Delete Event */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <div>
            <p className="font-medium text-destructive">Delete Event</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete this event and all associated data.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete event permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>"{eventName}"</strong> and all associated data
                  including registrations, attendance records, and workspaces. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteEvent}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
