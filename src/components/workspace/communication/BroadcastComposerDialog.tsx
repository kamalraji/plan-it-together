import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Megaphone, 
  Send, 
  Bell, 
  Clock,
  Hash,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceChannel } from '@/hooks/useWorkspaceChannels';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BROADCAST_PRIORITIES } from '@/lib/channelTemplates';

interface BroadcastComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  eventId?: string;
  channels: WorkspaceChannel[];
}

export function BroadcastComposerDialog({
  open,
  onOpenChange,
  workspaceId,
  eventId,
  channels,
}: BroadcastComposerDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [sendPush, setSendPush] = useState(false);
  const [scheduleFor, setScheduleFor] = useState('');

  const queryClient = useQueryClient();

  // Filter to only show participant channels
  const participantChannels = channels.filter(
    c => (c as unknown as { is_participant_channel?: boolean }).is_participant_channel
  );

  const sendBroadcastMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const broadcastData = {
        workspace_id: workspaceId,
        event_id: eventId || null,
        sender_id: userData.user.id,
        title: title.trim() || null,
        content: content.trim(),
        priority,
        channel_ids: selectedChannels.length > 0 ? selectedChannels : null,
        send_push: sendPush || priority === 'urgent',
        scheduled_for: scheduleFor ? new Date(scheduleFor).toISOString() : null,
        status: scheduleFor ? 'scheduled' : 'sending',
      };

      const { data, error } = await supabase
        .from('workspace_broadcasts')
        .insert(broadcastData)
        .select()
        .single();

      if (error) throw error;

      // If not scheduled, send immediately via edge function
      if (!scheduleFor && selectedChannels.length > 0) {
        // Post message to each selected channel
        for (const channelId of selectedChannels) {
          await supabase.from('channel_messages').insert({
            channel_id: channelId,
            sender_id: userData.user.id,
            content: title ? `**${title}**\n\n${content}` : content,
            message_type: 'broadcast',
          });
        }

        // Update broadcast status to sent
        await supabase
          .from('workspace_broadcasts')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', data.id);

        // Send push notification if enabled
        if (sendPush || priority === 'urgent') {
          try {
            // Get all member user IDs from selected channels
            const { data: channelMembers } = await supabase
              .from('channel_members')
              .select('user_id')
              .in('channel_id', selectedChannels);
            
            const uniqueUserIds = [...new Set(channelMembers?.map(m => m.user_id) || [])];
            
            if (uniqueUserIds.length > 0) {
              await supabase.functions.invoke('send-push-notification', {
                body: {
                  user_ids: uniqueUserIds,
                  title: title || 'New Broadcast',
                  body: content.substring(0, 200),
                  data: {
                    type: 'system',
                    action_url: `/workspaces?workspaceId=${workspaceId}`,
                  },
                  priority: priority === 'urgent' ? 'high' : 'normal',
                },
              });
            }
          } catch (pushError) {
            console.warn('Push notification failed:', pushError);
            // Don't fail the broadcast if push fails
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-stats', workspaceId] });
      toast.success(scheduleFor ? 'Broadcast scheduled!' : 'Broadcast sent!');
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Failed to send broadcast:', error);
      toast.error('Failed to send broadcast');
    },
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('normal');
    setSelectedChannels([]);
    setSendPush(false);
    setScheduleFor('');
  };

  const handleSend = () => {
    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (selectedChannels.length === 0) {
      toast.error('Please select at least one channel');
      return;
    }
    sendBroadcastMutation.mutate();
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const selectAllChannels = () => {
    if (selectedChannels.length === participantChannels.length) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(participantChannels.map(c => c.id));
    }
  };

  const priorityConfig = BROADCAST_PRIORITIES.find(p => p.id === priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Send Broadcast
          </DialogTitle>
          <DialogDescription>
            Send an announcement to participants across selected channels
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {/* Priority Selection */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <RadioGroup 
                value={priority} 
                onValueChange={(val) => setPriority(val as typeof priority)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="cursor-pointer flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Normal
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="important" id="important" />
                  <Label htmlFor="important" className="cursor-pointer flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Important
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent" className="cursor-pointer flex items-center gap-1">
                    <Zap className="h-3 w-3 text-red-500" />
                    Urgent
                  </Label>
                </div>
              </RadioGroup>
              {priorityConfig && (
                <p className="text-xs text-muted-foreground">{priorityConfig.description}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="broadcast-title">Title (optional)</Label>
              <Input
                id="broadcast-title"
                placeholder="Announcement title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="broadcast-message">Message *</Label>
              <Textarea
                id="broadcast-message"
                placeholder="Write your announcement message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>

            {/* Channel Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Channels *</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={selectAllChannels}
                  className="h-auto py-1 px-2 text-xs"
                >
                  {selectedChannels.length === participantChannels.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="border rounded-lg p-3 space-y-2 max-h-[150px] overflow-y-auto">
                {participantChannels.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No participant channels available
                  </p>
                ) : (
                  participantChannels.map((channel) => (
                    <div 
                      key={channel.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`channel-${channel.id}`}
                        checked={selectedChannels.includes(channel.id)}
                        onCheckedChange={() => toggleChannel(channel.id)}
                      />
                      <Label 
                        htmlFor={`channel-${channel.id}`} 
                        className="cursor-pointer flex items-center gap-2 flex-1"
                      >
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{channel.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {channel.type}
                        </Badge>
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedChannels.length} of {participantChannels.length} channels selected
              </p>
            </div>

            {/* Push Notification */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-push"
                checked={sendPush || priority === 'urgent'}
                onCheckedChange={(checked) => setSendPush(!!checked)}
                disabled={priority === 'urgent'}
              />
              <Label htmlFor="send-push" className="cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5" />
                  Send push notification to mobile devices
                </span>
              </Label>
              {priority === 'urgent' && (
                <Badge variant="secondary" className="text-xs">Auto-enabled for urgent</Badge>
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <Label htmlFor="schedule-for" className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Schedule for later (optional)
              </Label>
              <Input
                id="schedule-for"
                type="datetime-local"
                value={scheduleFor}
                onChange={(e) => setScheduleFor(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={sendBroadcastMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sendBroadcastMutation.isPending || !content.trim() || selectedChannels.length === 0}
          >
            {sendBroadcastMutation.isPending ? (
              'Sending...'
            ) : scheduleFor ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
