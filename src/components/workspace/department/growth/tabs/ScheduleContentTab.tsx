import React, { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, Clock, Share2, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, isToday, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface ScheduleContentTabProps {
  workspace: Workspace;
}

interface ScheduledContent {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  platform: string;
  scheduled_for: string;
  status: string;
  created_at: string;
}

const platformIcons: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
};

const platformColors: Record<string, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  twitter: 'bg-sky-500',
  linkedin: 'bg-blue-700',
};

export function ScheduleContentTab({ workspace }: ScheduleContentTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platform: 'instagram',
    scheduled_for: '',
    scheduled_time: '09:00',
  });

  const queryClient = useQueryClient();

  // For now, we'll use a local state to simulate scheduled content
  // In production, this would use workspace_scheduled_content table
  const { data: scheduledContent = [] } = useQuery({
    queryKey: ['scheduled-content', workspace.id],
    queryFn: async () => {
      // Simulated data for demonstration - replace with actual Supabase query
      return [] as ScheduledContent[];
    },
  });

  const createContent = useMutation({
    mutationFn: async (content: Partial<ScheduledContent>) => {
      // In production, this would insert into Supabase
      toast.success('Content scheduled successfully');
      return content;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-content', workspace.id] });
      setIsDialogOpen(false);
      setFormData({ title: '', content: '', platform: 'instagram', scheduled_for: '', scheduled_time: '09:00' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scheduledDateTime = formData.scheduled_for 
      ? `${formData.scheduled_for}T${formData.scheduled_time}:00` 
      : new Date().toISOString();
    
    createContent.mutate({
      workspace_id: workspace.id,
      title: formData.title,
      content: formData.content,
      platform: formData.platform,
      scheduled_for: scheduledDateTime,
      status: 'scheduled',
    });
  };

  // Generate week view
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getContentForDate = (date: Date) => {
    return scheduledContent.filter(content => {
      const contentDate = new Date(content.scheduled_for);
      return format(contentDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Content Calendar</h2>
          <p className="text-muted-foreground">Schedule and manage social media content</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule New Content</DialogTitle>
              <DialogDescription>Create and schedule content for your social media channels</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter content title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your post content..."
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">{formData.content.length}/280 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(platformIcons).map(([platform, Icon]) => (
                    <Button
                      key={platform}
                      type="button"
                      variant={formData.platform === platform ? 'default' : 'outline'}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                      onClick={() => setFormData({ ...formData, platform })}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs capitalize">{platform}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_for">Date</Label>
                  <Input
                    id="scheduled_for"
                    type="date"
                    value={formData.scheduled_for}
                    onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_time">Time</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createContent.isPending}>
                  {createContent.isPending ? 'Scheduling...' : 'Schedule'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
          Previous Week
        </Button>
        <h3 className="text-lg font-semibold">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h3>
        <Button variant="outline" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
          Next Week
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayContent = getContentForDate(day);
          const isCurrentDay = isToday(day);
          
          return (
            <Card 
              key={day.toISOString()} 
              className={`min-h-[200px] ${isCurrentDay ? 'ring-2 ring-primary' : ''}`}
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-lg font-bold ${isCurrentDay ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {dayContent.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No content</p>
                ) : (
                  dayContent.map((content) => {
                    const Icon = platformIcons[content.platform] || Share2;
                    return (
                      <div 
                        key={content.id}
                        className="p-2 rounded-md bg-muted/50 border border-border/50 space-y-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={`p-1 rounded ${platformColors[content.platform]} text-white`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-medium truncate">{content.title}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(content.scheduled_for), 'HH:mm')}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Content List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Scheduled Content</CardTitle>
          <CardDescription>Content scheduled for the next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledContent.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No content scheduled. Create your first post!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledContent.slice(0, 5).map((content) => {
                const Icon = platformIcons[content.platform] || Share2;
                return (
                  <div key={content.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className={`p-2 rounded-lg ${platformColors[content.platform]} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{content.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{content.content}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(content.scheduled_for), 'MMM d')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(content.scheduled_for), 'HH:mm')}
                      </p>
                    </div>
                    <Badge variant={content.status === 'scheduled' ? 'default' : 'secondary'}>
                      {content.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
