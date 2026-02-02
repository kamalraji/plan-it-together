import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send,
  FileText,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Globe,
  Mail,
} from 'lucide-react';
import { 
  useContentItems, 
  useScheduledContent, 
  usePublishContent, 
  useScheduleContent,
  useCancelScheduledContent,
  ContentItem,
  ScheduledContent,
} from '@/hooks/useContentCommitteeData';
import { format } from 'date-fns';

interface PublishContentTabProps {
  workspaceId: string;
}

const PLATFORMS = [
  { value: 'twitter', label: 'Twitter/X', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'blog', label: 'Blog', icon: FileText },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'email', label: 'Email', icon: Mail },
];

export function PublishContentTab({ workspaceId }: PublishContentTabProps) {
  const { data: contentItems = [], isLoading: itemsLoading } = useContentItems(workspaceId);
  const { data: scheduledContent = [], isLoading: scheduledLoading } = useScheduledContent(workspaceId);
  const publishContent = usePublishContent();
  const scheduleContent = useScheduleContent();
  const cancelScheduled = useCancelScheduledContent();

  const [activeTab, setActiveTab] = useState('ready');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [scheduleData, setScheduleData] = useState({
    platform: 'blog',
    scheduled_date: '',
    scheduled_time: '',
  });

  // Filter approved items ready for publishing
  const readyToPublish = contentItems.filter((item) => 
    item.status === 'approved' || item.review_status === 'approved'
  );

  // Filter active scheduled content
  const activeScheduled = scheduledContent.filter((s) => s.status === 'scheduled');

  const handlePublishNow = (item: ContentItem) => {
    if (confirm(`Publish "${item.title}" now?`)) {
      publishContent.mutate({
        contentItemId: item.id,
        workspaceId,
      });
    }
  };

  const handleOpenScheduleDialog = (item: ContentItem) => {
    setSelectedItem(item);
    setScheduleData({
      platform: 'blog',
      scheduled_date: '',
      scheduled_time: '',
    });
    setScheduleDialogOpen(true);
  };

  const handleScheduleContent = () => {
    if (!selectedItem || !scheduleData.scheduled_date) return;

    scheduleContent.mutate({
      workspace_id: workspaceId,
      content_item_id: selectedItem.id,
      title: selectedItem.title,
      platform: scheduleData.platform,
      scheduled_date: scheduleData.scheduled_date,
      scheduled_time: scheduleData.scheduled_time || undefined,
      status: 'scheduled',
    }, {
      onSuccess: () => {
        setScheduleDialogOpen(false);
        setSelectedItem(null);
      },
    });
  };

  const handleCancelScheduled = (scheduled: ScheduledContent) => {
    if (confirm(`Cancel scheduled publication of "${scheduled.title}"?`)) {
      cancelScheduled.mutate({ id: scheduled.id, workspaceId });
    }
  };

  const handlePublishScheduled = (scheduled: ScheduledContent) => {
    if (!scheduled.content_item_id) return;
    if (confirm(`Publish "${scheduled.title}" now?`)) {
      publishContent.mutate({
        scheduledId: scheduled.id,
        contentItemId: scheduled.content_item_id,
        workspaceId,
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    const p = PLATFORMS.find((pl) => pl.value === platform);
    return p ? <p.icon className="h-4 w-4" /> : <Globe className="h-4 w-4" />;
  };

  const isLoading = itemsLoading || scheduledLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-6 w-6 text-emerald-500" />
            Publish Content
          </h2>
          <p className="text-muted-foreground mt-1">
            Publish approved content or schedule for later
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {readyToPublish.length} ready
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            {activeScheduled.length} scheduled
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ready" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Ready to Publish
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Clock className="h-4 w-4" />
            Scheduled
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ready" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Approved Content</CardTitle>
              <CardDescription>
                These items have been reviewed and approved for publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : readyToPublish.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No content ready for publishing</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Content must be reviewed and approved first
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Approved</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {readyToPublish.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.content_type}</Badge>
                          </TableCell>
                          <TableCell>{item.author_name || 'Unknown'}</TableCell>
                          <TableCell>
                            {item.updated_at ? format(new Date(item.updated_at), 'MMM d') : '-'}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenScheduleDialog(item)}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handlePublishNow(item)}
                              disabled={publishContent.isPending}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Publish
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Publications</CardTitle>
              <CardDescription>
                Content scheduled for future publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : activeScheduled.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No scheduled publications</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeScheduled.map((scheduled) => (
                        <TableRow key={scheduled.id}>
                          <TableCell className="font-medium">{scheduled.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(scheduled.platform)}
                              <span className="capitalize">{scheduled.platform}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(scheduled.scheduled_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>{scheduled.scheduled_time || 'Not set'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{scheduled.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {scheduled.content_item_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePublishScheduled(scheduled)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Publish Now
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleCancelScheduled(scheduled)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Publication</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-medium">{selectedItem?.title}</p>
              <Badge variant="outline" className="mt-1">{selectedItem?.content_type}</Badge>
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={scheduleData.platform}
                onValueChange={(value) => setScheduleData({ ...scheduleData, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center gap-2">
                        <platform.icon className="h-4 w-4" />
                        {platform.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={scheduleData.scheduled_date}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Time (optional)</Label>
                <Input
                  type="time"
                  value={scheduleData.scheduled_time}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduled_time: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleContent}
              disabled={!scheduleData.scheduled_date || scheduleContent.isPending}
            >
              {scheduleContent.isPending ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
