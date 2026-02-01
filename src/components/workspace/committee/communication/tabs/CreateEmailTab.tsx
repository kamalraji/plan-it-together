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
import { Progress } from '@/components/ui/progress';
import { Mail, Plus, Send, Clock, CheckCircle2, Edit, Trash2, Users, Eye, MousePointer } from 'lucide-react';
import { format } from 'date-fns';
import { useEmailCampaigns, useCreateEmailCampaign, useUpdateEmailCampaign, useDeleteEmailCampaign, useSendEmailCampaign, type EmailCampaign } from '@/hooks/useCommunicationCommitteeData';

interface CreateEmailTabProps {
  workspaceId: string;
}

const statusConfig = {
  draft: { icon: Edit, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Draft' },
  scheduled: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Scheduled' },
  sending: { icon: Send, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Sending' },
  sent: { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Sent' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Completed' },
};

const audienceOptions = [
  { value: 'all', label: 'All Recipients' },
  { value: 'team', label: 'Team Members' },
  { value: 'stakeholders', label: 'Stakeholders' },
  { value: 'custom', label: 'Custom List' },
];

export function CreateEmailTab({ workspaceId }: CreateEmailTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    target_audience: 'all',
    recipients_count: 0,
    scheduled_for: '',
  });

  const { data: campaigns = [], isLoading } = useEmailCampaigns(workspaceId);
  const createMutation = useCreateEmailCampaign(workspaceId);
  const updateMutation = useUpdateEmailCampaign(workspaceId);
  const deleteMutation = useDeleteEmailCampaign(workspaceId);
  const sendMutation = useSendEmailCampaign(workspaceId);

  const handleOpenDialog = (campaign?: EmailCampaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name,
        subject: campaign.subject,
        content: campaign.content || '',
        target_audience: campaign.target_audience,
        recipients_count: campaign.recipients_count,
        scheduled_for: campaign.scheduled_for || '',
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        name: '',
        subject: '',
        content: '',
        target_audience: 'all',
        recipients_count: 0,
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

    if (editingCampaign) {
      await updateMutation.mutateAsync({ id: editingCampaign.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setIsDialogOpen(false);
  };

  const handleSend = async (id: string) => {
    if (confirm('Are you sure you want to send this email campaign now?')) {
      await sendMutation.mutateAsync(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const calculateOpenRate = (campaign: EmailCampaign) => {
    if (campaign.sent_count === 0) return 0;
    return Math.round((campaign.opened_count / campaign.sent_count) * 100);
  };

  const calculateClickRate = (campaign: EmailCampaign) => {
    if (campaign.sent_count === 0) return 0;
    return Math.round((campaign.clicked_count / campaign.sent_count) * 100);
  };

  const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.opened_count, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Email Campaigns
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage email campaigns with tracking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? 'Edit Email Campaign' : 'Create Email Campaign'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekly Newsletter"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Enter email subject line"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your email content here..."
                  rows={8}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="scheduled_for">Schedule (Optional)</Label>
                  <Input
                    id="scheduled_for"
                    type="datetime-local"
                    value={formData.scheduled_for}
                    onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCampaign ? 'Update' : 'Create'} Campaign
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
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campaigns.length}</p>
                <p className="text-sm text-muted-foreground">Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Send className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSent}</p>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Eye className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MousePointer className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Click Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No email campaigns yet</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first campaign
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const status = campaign.status as keyof typeof statusConfig;
                  const config = statusConfig[status] || statusConfig.draft;
                  const StatusIcon = config.icon;
                  const openRate = calculateOpenRate(campaign);
                  const clickRate = calculateClickRate(campaign);

                  return (
                    <div
                      key={campaign.id}
                      className="p-4 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${config.bgColor} mt-0.5`}>
                            <StatusIcon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {campaign.target_audience}
                              </span>
                              {campaign.created_at && (
                                <span>
                                  Created {format(new Date(campaign.created_at), 'MMM d, yyyy')}
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
                              onClick={() => handleSend(campaign.id)}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDialog(campaign)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(campaign.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Metrics for sent campaigns */}
                      {(status === 'sent' || status === 'completed') && (
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Sent</p>
                            <p className="font-medium">{campaign.sent_count}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Open Rate</p>
                            <div className="flex items-center gap-2">
                              <Progress value={openRate} className="h-2 flex-1" />
                              <span className="text-sm font-medium">{openRate}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Click Rate</p>
                            <div className="flex items-center gap-2">
                              <Progress value={clickRate} className="h-2 flex-1" />
                              <span className="text-sm font-medium">{clickRate}%</span>
                            </div>
                          </div>
                        </div>
                      )}
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
