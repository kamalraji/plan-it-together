import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Clock, 
  Send, 
  MoreHorizontal, 
  Trash2, 
  Play, 
  Pause,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Bell,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isPast } from 'date-fns';

interface ScheduledBroadcast {
  id: string;
  title: string | null;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  scheduled_for: string | null;
  sent_at: string | null;
  send_push: boolean;
  delivery_stats: Record<string, unknown>;
  created_at: string;
}

interface ScheduledBroadcastsManagerProps {
  workspaceId: string;
}

const statusConfig = {
  scheduled: { icon: Clock, color: 'bg-blue-500/10 text-blue-600', label: 'Scheduled' },
  sending: { icon: Send, color: 'bg-amber-500/10 text-amber-600', label: 'Sending' },
  sent: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-600', label: 'Sent' },
  failed: { icon: AlertCircle, color: 'bg-red-500/10 text-red-600', label: 'Failed' },
  cancelled: { icon: Pause, color: 'bg-gray-500/10 text-gray-600', label: 'Cancelled' },
};

const priorityConfig = {
  normal: { icon: Bell, color: 'text-muted-foreground' },
  important: { icon: AlertTriangle, color: 'text-amber-500' },
  urgent: { icon: Zap, color: 'text-red-500' },
};

export function ScheduledBroadcastsManager({ workspaceId }: ScheduledBroadcastsManagerProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch broadcasts
  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ['scheduled-broadcasts', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_broadcasts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ScheduledBroadcast[];
    },
    enabled: !!workspaceId,
  });

  // Cancel broadcast mutation
  const cancelMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const { error } = await supabase
        .from('workspace_broadcasts')
        .update({ status: 'cancelled' })
        .eq('id', broadcastId)
        .eq('status', 'scheduled');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-broadcasts', workspaceId] });
      toast.success('Broadcast cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel broadcast');
    },
  });

  // Delete broadcast mutation
  const deleteMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const { error } = await supabase
        .from('workspace_broadcasts')
        .delete()
        .eq('id', broadcastId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-broadcasts', workspaceId] });
      toast.success('Broadcast deleted');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete broadcast');
    },
  });

  // Send now mutation
  const sendNowMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const { error } = await supabase
        .from('workspace_broadcasts')
        .update({ 
          status: 'sending',
          scheduled_for: null,
        })
        .eq('id', broadcastId)
        .eq('status', 'scheduled');

      if (error) throw error;
      
      // Trigger the broadcast-message edge function
      // This would normally be done by a cron job but we can trigger it manually
      toast.info('Broadcast queued for immediate delivery');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-broadcasts', workspaceId] });
    },
  });

  const scheduledBroadcasts = broadcasts.filter(b => b.status === 'scheduled');
  const recentBroadcasts = broadcasts.filter(b => b.status !== 'scheduled');

  const renderBroadcastRow = (broadcast: ScheduledBroadcast) => {
    const StatusIcon = statusConfig[broadcast.status]?.icon || Clock;
    const PriorityIcon = priorityConfig[broadcast.priority]?.icon || Bell;
    const isOverdue = broadcast.scheduled_for && isPast(new Date(broadcast.scheduled_for)) && broadcast.status === 'scheduled';

    return (
      <TableRow key={broadcast.id}>
        <TableCell>
          <div className="flex items-start gap-3">
            <div className={`p-1.5 rounded ${priorityConfig[broadcast.priority]?.color}`}>
              <PriorityIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">
                {broadcast.title || 'Untitled Broadcast'}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {broadcast.content.substring(0, 80)}...
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge 
            variant="secondary" 
            className={statusConfig[broadcast.status]?.color}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig[broadcast.status]?.label}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="ml-1 text-xs">
              Overdue
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-sm">
          {broadcast.scheduled_for ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span title={format(new Date(broadcast.scheduled_for), 'PPpp')}>
                {formatDistanceToNow(new Date(broadcast.scheduled_for), { addSuffix: true })}
              </span>
            </div>
          ) : broadcast.sent_at ? (
            <span className="text-muted-foreground">
              Sent {formatDistanceToNow(new Date(broadcast.sent_at), { addSuffix: true })}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          {broadcast.send_push && (
            <Badge variant="outline" className="text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Push
            </Badge>
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {broadcast.status === 'scheduled' && (
                <>
                  <DropdownMenuItem onClick={() => sendNowMutation.mutate(broadcast.id)}>
                    <Play className="h-4 w-4 mr-2" />
                    Send Now
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => cancelMutation.mutate(broadcast.id)}>
                    <Pause className="h-4 w-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem 
                onClick={() => setDeleteId(broadcast.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            Loading broadcasts...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scheduled Broadcasts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Scheduled Broadcasts
              </CardTitle>
              <CardDescription>
                {scheduledBroadcasts.length} broadcast{scheduledBroadcasts.length !== 1 ? 's' : ''} pending
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {scheduledBroadcasts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No scheduled broadcasts</p>
              <p className="text-sm">Create a broadcast and schedule it for later</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledBroadcasts.map(renderBroadcastRow)}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Recent Broadcasts History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-muted-foreground" />
            Broadcast History
          </CardTitle>
          <CardDescription>Previously sent broadcasts</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBroadcasts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No broadcast history</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBroadcasts.map(renderBroadcastRow)}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Broadcast</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this broadcast? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
