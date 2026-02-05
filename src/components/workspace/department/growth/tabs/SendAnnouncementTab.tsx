import React, { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MessageSquare, Send, Clock, Users, Bell, Mail, Smartphone, Trash2, CheckCircle2 } from 'lucide-react';
import { useAnnouncements, useCreateAnnouncement, useSendAnnouncement, useDeleteAnnouncement, Announcement } from '@/hooks/useGrowthDepartmentData';
import { format } from 'date-fns';

interface SendAnnouncementTabProps {
  workspace: Workspace;
}

const typeConfig: Record<string, { color: string; icon: React.ElementType }> = {
  general: { color: 'bg-info/20 text-info', icon: MessageSquare },
  urgent: { color: 'bg-destructive/20 text-destructive', icon: Bell },
  reminder: { color: 'bg-warning/20 text-warning', icon: Clock },
  update: { color: 'bg-success/20 text-success', icon: CheckCircle2 },
};

const audienceOptions = [
  { value: 'all', label: 'Everyone', icon: Users },
  { value: 'team', label: 'Team Only', icon: Users },
  { value: 'stakeholders', label: 'Stakeholders', icon: Users },
  { value: 'public', label: 'Public', icon: Users },
];

const channelOptions = [
  { value: 'in-app', label: 'In-App', icon: Bell },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'push', label: 'Push Notification', icon: Smartphone },
];

export function SendAnnouncementTab({ workspace }: SendAnnouncementTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: 'general',
    target_audience: 'all',
    channels: ['in-app'] as string[],
    scheduled_for: '',
    scheduled_time: '',
  });

  const { data: announcements, isLoading } = useAnnouncements(workspace.id);
  const createAnnouncement = useCreateAnnouncement(workspace.id);
  const sendAnnouncement = useSendAnnouncement(workspace.id);
  const deleteAnnouncement = useDeleteAnnouncement(workspace.id);

  const filteredAnnouncements = announcements?.filter(a => 
    statusFilter === 'all' || a.status === statusFilter
  ) || [];

  const handleChannelToggle = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scheduledDateTime = formData.scheduled_for && formData.scheduled_time
      ? `${formData.scheduled_for}T${formData.scheduled_time}:00`
      : null;
    
    await createAnnouncement.mutateAsync({
      title: formData.title,
      content: formData.content,
      announcement_type: formData.announcement_type,
      target_audience: formData.target_audience,
      channels: formData.channels,
      scheduled_for: scheduledDateTime,
      status: scheduledDateTime ? 'scheduled' : 'draft',
    });
    
    setFormData({ 
      title: '', 
      content: '', 
      announcement_type: 'general', 
      target_audience: 'all', 
      channels: ['in-app'], 
      scheduled_for: '', 
      scheduled_time: '' 
    });
    setIsDialogOpen(false);
  };

  const handleSendNow = (announcement: Announcement) => {
    sendAnnouncement.mutate(announcement.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Announcements</h2>
          <p className="text-muted-foreground">Create and send announcements to your audience</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>Compose and schedule your announcement</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your announcement message..."
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={formData.announcement_type} 
                    onValueChange={(v) => setFormData({ ...formData, announcement_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(typeConfig).map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select 
                    value={formData.target_audience} 
                    onValueChange={(v) => setFormData({ ...formData, target_audience: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audienceOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Delivery Channels</Label>
                <div className="flex gap-4">
                  {channelOptions.map((channel) => (
                    <div key={channel.value} className="flex items-center gap-2">
                      <Checkbox
                        id={channel.value}
                        checked={formData.channels.includes(channel.value)}
                        onCheckedChange={() => handleChannelToggle(channel.value)}
                      />
                      <label htmlFor={channel.value} className="text-sm cursor-pointer">
                        {channel.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_for">Schedule Date (optional)</Label>
                  <Input
                    id="scheduled_for"
                    type="date"
                    value={formData.scheduled_for}
                    onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_time">Schedule Time</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    disabled={!formData.scheduled_for}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createAnnouncement.isPending}>
                  {createAnnouncement.isPending ? 'Creating...' : formData.scheduled_for ? 'Schedule' : 'Save Draft'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'draft', 'scheduled', 'sent'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No announcements found. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => {
            const TypeIcon = typeConfig[announcement.announcement_type]?.icon || MessageSquare;
            
            return (
              <Card key={announcement.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${typeConfig[announcement.announcement_type]?.color}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{announcement.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">{announcement.target_audience}</Badge>
                            <Badge 
                              variant={announcement.status === 'sent' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {announcement.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground line-clamp-2">{announcement.content}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>
                            {announcement.sent_at 
                              ? `Sent ${format(new Date(announcement.sent_at), 'MMM d, yyyy HH:mm')}`
                              : announcement.scheduled_for
                                ? `Scheduled for ${format(new Date(announcement.scheduled_for), 'MMM d, yyyy HH:mm')}`
                                : `Created ${format(new Date(announcement.created_at), 'MMM d, yyyy')}`
                            }
                          </span>
                        </div>
                        {announcement.recipients_count > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>{announcement.recipients_count} recipients</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {announcement.status === 'draft' && (
                        <Button size="sm" onClick={() => handleSendNow(announcement)}>
                          <Send className="h-4 w-4 mr-1" />
                          Send Now
                        </Button>
                      )}
                      {announcement.status === 'scheduled' && (
                        <Button size="sm" variant="outline" onClick={() => handleSendNow(announcement)}>
                          <Send className="h-4 w-4 mr-1" />
                          Send Now
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteAnnouncement.mutate(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
