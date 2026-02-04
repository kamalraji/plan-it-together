import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Video, Calendar as CalendarIcon, Globe, Lock, Users, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PrivacyStatus, CreateStreamInput } from '@/types/livestream.types';
import { useCreateLiveStream } from '@/hooks/useLiveStreaming';

interface CreateStreamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  eventId: string;
  sessionId?: string;
}

export function CreateStreamModal({
  open,
  onOpenChange,
  workspaceId,
  eventId,
  sessionId,
}: CreateStreamModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus>('unlisted');
  const [scheduledStart, setScheduledStart] = useState<Date | undefined>();
  const [chatEnabled, setChatEnabled] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);

  const createStream = useCreateLiveStream();

  const handleSubmit = () => {
    if (!title.trim()) return;

    const input: CreateStreamInput = {
      workspace_id: workspaceId,
      event_id: eventId,
      session_id: sessionId,
      title: title.trim(),
      description: description.trim() || undefined,
      privacy_status: privacyStatus,
      scheduled_start: isScheduled && scheduledStart ? scheduledStart.toISOString() : undefined,
      chat_enabled: chatEnabled,
    };

    createStream.mutate(input, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrivacyStatus('unlisted');
    setScheduledStart(undefined);
    setChatEnabled(true);
    setIsScheduled(false);
  };

  const privacyOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can search and view' },
    { value: 'unlisted', label: 'Unlisted', icon: Users, description: 'Only people with the link' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you can view' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10">
              <Video className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <DialogTitle>Create Live Stream</DialogTitle>
              <DialogDescription>
                Set up a new YouTube live stream for your event
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Stream Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter stream title..."
              className="h-11"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what this stream is about..."
              rows={3}
            />
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <Label>Privacy</Label>
            <div className="grid grid-cols-3 gap-2">
              {privacyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPrivacyStatus(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                    privacyStatus === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <option.icon className={cn(
                    "h-5 w-5",
                    privacyStatus === option.value ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    privacyStatus === option.value ? "text-primary" : "text-foreground"
                  )}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Schedule for later</p>
                <p className="text-xs text-muted-foreground">Set a specific start time</p>
              </div>
            </div>
            <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
          </div>

          {/* Scheduled Time */}
          {isScheduled && (
            <div className="space-y-2">
              <Label>Scheduled Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !scheduledStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledStart ? format(scheduledStart, "PPP 'at' p") : "Pick a date and time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledStart}
                    onSelect={setScheduledStart}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  {scheduledStart && (
                    <div className="p-3 border-t">
                      <Input
                        type="time"
                        value={scheduledStart ? format(scheduledStart, 'HH:mm') : ''}
                        onChange={(e) => {
                          if (scheduledStart && e.target.value) {
                            const [hours, minutes] = e.target.value.split(':');
                            const newDate = new Date(scheduledStart);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            setScheduledStart(newDate);
                          }
                        }}
                      />
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Chat Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Enable Live Chat</p>
                <p className="text-xs text-muted-foreground">Allow viewers to chat during stream</p>
              </div>
            </div>
            <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!title.trim() || createStream.isPending}
            className="gap-2 bg-red-600 hover:bg-red-700"
          >
            <Video className="h-4 w-4" />
            {isScheduled ? 'Schedule Stream' : 'Create Stream'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
