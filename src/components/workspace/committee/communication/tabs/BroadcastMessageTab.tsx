import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Send, Plus, Clock, CheckCircle2, Edit, Trash2, 
  Radio, AlertTriangle, Bell, MessageSquare, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  useBroadcastMessages, 
  useCreateBroadcastMessage, 
  useUpdateBroadcastMessage, 
  useDeleteBroadcastMessage,
  useSendBroadcastMessage,
  type BroadcastMessage 
} from '@/hooks/useCommunicationCommitteeData';

interface BroadcastMessageTabProps {
  workspaceId: string;
}

const statusConfig = {
  draft: { icon: Edit, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Draft' },
  scheduled: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Scheduled' },
  sending: { icon: Radio, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Sending' },
  sent: { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Sent' },
};

const messageTypeConfig = {
  general: { icon: MessageSquare, color: 'text-blue-500', label: 'General' },
  urgent: { icon: AlertTriangle, color: 'text-red-500', label: 'Urgent' },
  reminder: { icon: Bell, color: 'text-amber-500', label: 'Reminder' },
  update: { icon: Radio, color: 'text-purple-500', label: 'Update' },
};

const channelOptions = [
  { id: 'in-app', label: 'In-App Notification' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'push', label: 'Push Notification' },
];

const audienceOptions = [
  { value: 'all', label: 'All Members' },
  { value: 'team', label: 'Team Only' },
  { value: 'stakeholders', label: 'Stakeholders' },
  { value: 'custom', label: 'Custom List' },
];

export function BroadcastMessageTab({ workspaceId }: BroadcastMessageTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<BroadcastMessage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    message_type: 'general',
    channels: ['in-app'] as string[],
    target_audience: 'all',
    scheduled_for: '',
  });

  const { data: messages = [], isLoading } = useBroadcastMessages(workspaceId);
  const createMutation = useCreateBroadcastMessage(workspaceId);
  const updateMutation = useUpdateBroadcastMessage(workspaceId);
  const deleteMutation = useDeleteBroadcastMessage(workspaceId);
  const sendMutation = useSendBroadcastMessage(workspaceId);

  const handleOpenDialog = (message?: BroadcastMessage) => {
    if (message) {
      setEditingMessage(message);
      setFormData({
        title: message.title,
        content: message.content,
        message_type: message.message_type,
        channels: message.channels,
        target_audience: message.target_audience,
        scheduled_for: message.scheduled_for || '',
      });
    } else {
      setEditingMessage(null);
      setFormData({
        title: '',
        content: '',
        message_type: 'general',
        channels: ['in-app'],
        target_audience: 'all',
        scheduled_for: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      status: formData.scheduled_for ? 'scheduled' : 'draft',
    };

    if (editingMessage) {
      await updateMutation.mutateAsync({ id: editingMessage.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setIsDialogOpen(false);
  };

  const handleChannelChange = (channelId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      channels: checked
        ? [...prev.channels, channelId]
        : prev.channels.filter((c) => c !== channelId),
    }));
  };

  const handleSend = async (id: string) => {
    if (confirm('Are you sure you want to send this broadcast now?')) {
      await sendMutation.mutateAsync(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this broadcast?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary" />
            Broadcast Messages
          </h2>
          <p className="text-muted-foreground mt-1">
            Send instant broadcasts across multiple channels
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Broadcast
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMessage ? 'Edit Broadcast' : 'Create Broadcast'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Broadcast title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your broadcast message..."
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Message Type</Label>
                  <Select
                    value={formData.message_type}
                    onValueChange={(value) => setFormData({ ...formData, message_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(messageTypeConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          <span className="flex items-center gap-2">
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audienceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Delivery Channels</Label>
                <div className="flex flex-wrap gap-4">
                  {channelOptions.map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={channel.id}
                        checked={formData.channels.includes(channel.id)}
                        onCheckedChange={(checked) =>
                          handleChannelChange(channel.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={channel.id} className="text-sm font-normal cursor-pointer">
                        {channel.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_for">Schedule (Optional)</Label>
                <Input
                  id="scheduled_for"
                  type="datetime-local"
                  value={formData.scheduled_for}
                  onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingMessage ? 'Update' : 'Create'} Broadcast
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Radio className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {messages.filter((m) => m.status === 'sent').length}
                </p>
                <p className="text-sm text-muted-foreground">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {messages.filter((m) => m.status === 'scheduled').length}
                </p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {messages.filter((m) => m.message_type === 'urgent').length}
                </p>
                <p className="text-sm text-muted-foreground">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>All Broadcasts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No broadcast messages yet</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first broadcast
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {messages.map((message) => {
                  const status = message.status as keyof typeof statusConfig;
                  const config = statusConfig[status] || statusConfig.draft;
                  const StatusIcon = config.icon;
                  const typeConfig = messageTypeConfig[message.message_type as keyof typeof messageTypeConfig] || messageTypeConfig.general;
                  const TypeIcon = typeConfig.icon;

                  return (
                    <div
                      key={message.id}
                      className="p-4 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${config.bgColor} mt-0.5`}>
                            <StatusIcon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{message.title}</p>
                              <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                                <TypeIcon className="h-3 w-3 mr-1" />
                                {typeConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {message.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Send className="h-3 w-3" />
                                {message.channels.join(', ')}
                              </span>
                              {message.scheduled_for && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(message.scheduled_for), 'MMM d, yyyy HH:mm')}
                                </span>
                              )}
                              {message.sent_at && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Sent {format(new Date(message.sent_at), 'MMM d, yyyy HH:mm')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={`${config.bgColor} ${config.color} border-0`}>
                            {config.label}
                          </Badge>
                          {status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSend(message.id)}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send Now
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDialog(message)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(message.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
