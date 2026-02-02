import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Calendar,
  X,
  Trash2,
  AlertCircle,
  CheckCircle,
  Megaphone
} from 'lucide-react';
import { useScheduledMessages, ScheduledMessage } from '@/hooks/useScheduledMessages';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { toast } from 'sonner';

interface ScheduledMessageComposerProps {
  channelId: string;
  channelName: string;
}

export function ScheduledMessageComposer({ channelId, channelName }: ScheduledMessageComposerProps) {
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const {
    pendingMessages,
    sentMessages,
    failedMessages,
    isLoading,
    createScheduledMessage,
    cancelScheduledMessage,
    deleteScheduledMessage,
    isCreating,
  } = useScheduledMessages(channelId);

  const handleSchedule = async () => {
    if (!content.trim() || !scheduledDate || !scheduledTime) {
      toast.error('Please fill in all fields');
      return;
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    
    if (isPast(scheduledFor)) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    try {
      await createScheduledMessage({
        channelId,
        content: content.trim(),
        scheduledFor,
      });
      
      setContent('');
      setScheduledDate('');
      setScheduledTime('');
      toast.success('Message scheduled successfully');
    } catch (error) {
      toast.error('Failed to schedule message');
    }
  };

  const handleCancel = async (messageId: string) => {
    try {
      await cancelScheduledMessage(messageId);
      toast.success('Scheduled message cancelled');
    } catch (error) {
      toast.error('Failed to cancel message');
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteScheduledMessage(messageId);
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  // Get minimum date/time (now)
  const now = new Date();
  const minDate = format(now, 'yyyy-MM-dd');
  const minTime = scheduledDate === minDate ? format(now, 'HH:mm') : '00:00';

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Scheduled Messages
        </CardTitle>
        <CardDescription>
          Schedule announcements for #{channelName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compose Form */}
        <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30">
          <div>
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Write your announcement..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1.5 min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={minDate}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={scheduledDate === minDate ? minTime : undefined}
                className="mt-1.5"
              />
            </div>
          </div>

          <Button 
            onClick={handleSchedule} 
            disabled={isCreating || !content.trim() || !scheduledDate || !scheduledTime}
            className="w-full"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Message
          </Button>
        </div>

        <Separator />

        {/* Pending Messages */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingMessages.length})
          </h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          ) : pendingMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No scheduled messages
            </p>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {pendingMessages.map((msg) => (
                  <ScheduledMessageCard
                    key={msg.id}
                    message={msg}
                    onCancel={() => handleCancel(msg.id)}
                    onDelete={() => handleDelete(msg.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Sent/Failed Messages */}
        {(sentMessages.length > 0 || failedMessages.length > 0) && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">History</h4>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {failedMessages.map((msg) => (
                    <HistoryMessageCard
                      key={msg.id}
                      message={msg}
                      onDelete={() => handleDelete(msg.id)}
                    />
                  ))}
                  {sentMessages.slice(0, 5).map((msg) => (
                    <HistoryMessageCard
                      key={msg.id}
                      message={msg}
                      onDelete={() => handleDelete(msg.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface ScheduledMessageCardProps {
  message: ScheduledMessage;
  onCancel: () => void;
  onDelete: () => void;
}

function ScheduledMessageCard({ message, onCancel, onDelete }: ScheduledMessageCardProps) {
  const scheduledFor = new Date(message.scheduled_for);
  const isOverdue = isPast(scheduledFor);

  return (
    <div className="p-3 rounded-lg border border-border/50 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">
              {format(scheduledFor, 'MMM d, yyyy')} at {format(scheduledFor, 'h:mm a')}
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">Overdue</Badge>
            )}
          </div>
          <p className="text-sm line-clamp-2">{message.content}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Scheduled {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancel}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface HistoryMessageCardProps {
  message: ScheduledMessage;
  onDelete: () => void;
}

function HistoryMessageCard({ message, onDelete }: HistoryMessageCardProps) {
  const isFailed = message.status === 'failed';

  return (
    <div className={`p-3 rounded-lg border ${isFailed ? 'border-destructive/50 bg-destructive/5' : 'border-border/50 bg-muted/30'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isFailed ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            )}
            <Badge variant={isFailed ? 'destructive' : 'secondary'} className="text-xs">
              {isFailed ? 'Failed' : 'Sent'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.scheduled_for), 'MMM d, h:mm a')}
            </span>
          </div>
          <p className="text-sm line-clamp-1 text-muted-foreground">{message.content}</p>
          {isFailed && message.error_message && (
            <p className="text-xs text-destructive mt-1">{message.error_message}</p>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
