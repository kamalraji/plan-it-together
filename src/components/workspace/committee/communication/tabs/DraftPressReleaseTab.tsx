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
  Newspaper, Plus, Send, Clock, CheckCircle2, Edit, Trash2, 
  FileText, AlertCircle, Eye 
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  usePressReleases, 
  useCreatePressRelease, 
  useUpdatePressRelease, 
  useDeletePressRelease,
  useSubmitPressReleaseForReview,
  useApprovePressRelease,
  useDistributePressRelease,
  type PressRelease 
} from '@/hooks/useCommunicationCommitteeData';

interface DraftPressReleaseTabProps {
  workspaceId: string;
}

const statusConfig = {
  draft: { icon: Edit, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Draft' },
  review: { icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10', label: 'In Review' },
  approved: { icon: CheckCircle2, color: 'text-info', bgColor: 'bg-info/10', label: 'Approved' },
  distributed: { icon: Send, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Distributed' },
};

const typeOptions = [
  { value: 'press-release', label: 'Press Release' },
  { value: 'media-kit', label: 'Media Kit' },
  { value: 'fact-sheet', label: 'Fact Sheet' },
  { value: 'advisory', label: 'Media Advisory' },
];

const distributionChannels = [
  { id: 'newswire', label: 'Newswire' },
  { id: 'email', label: 'Email' },
  { id: 'social', label: 'Social Media' },
  { id: 'website', label: 'Website' },
];

export function DraftPressReleaseTab({ workspaceId }: DraftPressReleaseTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<PressRelease | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'press-release',
    author_name: '',
    embargo_date: '',
    notes: '',
    distribution_channels: [] as string[],
  });

  const { data: releases = [], isLoading } = usePressReleases(workspaceId);
  const createMutation = useCreatePressRelease(workspaceId);
  const updateMutation = useUpdatePressRelease(workspaceId);
  const deleteMutation = useDeletePressRelease(workspaceId);
  const submitForReviewMutation = useSubmitPressReleaseForReview(workspaceId);
  const approveMutation = useApprovePressRelease(workspaceId);
  const distributeMutation = useDistributePressRelease(workspaceId);

  const handleOpenDialog = (release?: PressRelease) => {
    if (release) {
      setEditingRelease(release);
      setFormData({
        title: release.title,
        content: release.content || '',
        type: release.type || 'press-release',
        author_name: release.author_name || '',
        embargo_date: release.embargo_date || '',
        notes: release.notes || '',
        distribution_channels: release.distribution_channels || [],
      });
    } else {
      setEditingRelease(null);
      setFormData({
        title: '',
        content: '',
        type: 'press-release',
        author_name: '',
        embargo_date: '',
        notes: '',
        distribution_channels: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRelease) {
      await updateMutation.mutateAsync({ id: editingRelease.id, ...formData });
    } else {
      await createMutation.mutateAsync(formData);
    }

    setIsDialogOpen(false);
  };

  const handleChannelChange = (channelId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      distribution_channels: checked
        ? [...prev.distribution_channels, channelId]
        : prev.distribution_channels.filter((c) => c !== channelId),
    }));
  };

  const handleSubmitForReview = async (id: string) => {
    await submitForReviewMutation.mutateAsync(id);
  };

  const handleApprove = async (id: string) => {
    await approveMutation.mutateAsync(id);
  };

  const handleDistribute = async (id: string) => {
    if (confirm('Are you sure you want to distribute this press release?')) {
      await distributeMutation.mutateAsync(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this press release?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" />
            Press Releases
          </h2>
          <p className="text-muted-foreground mt-1">
            Draft, review, and distribute press releases and media materials
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Press Release
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRelease ? 'Edit Press Release' : 'Create Press Release'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Press release title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author_name">Author Name</Label>
                  <Input
                    id="author_name"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    placeholder="Author's name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="embargo_date">Embargo Date (Optional)</Label>
                  <Input
                    id="embargo_date"
                    type="datetime-local"
                    value={formData.embargo_date}
                    onChange={(e) => setFormData({ ...formData, embargo_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your press release content..."
                  rows={12}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Distribution Channels</Label>
                <div className="flex flex-wrap gap-4">
                  {distributionChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={channel.id}
                        checked={formData.distribution_channels.includes(channel.id)}
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
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any internal notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingRelease ? 'Update' : 'Create'} Press Release
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
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{releases.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {releases.filter((r) => r.status === 'review').length}
                </p>
                <p className="text-sm text-muted-foreground">In Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <CheckCircle2 className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {releases.filter((r) => r.status === 'approved').length}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Send className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {releases.filter((r) => r.status === 'distributed').length}
                </p>
                <p className="text-sm text-muted-foreground">Distributed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Releases List */}
      <Card>
        <CardHeader>
          <CardTitle>All Press Releases</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : releases.length === 0 ? (
            <div className="text-center py-8">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No press releases yet</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first press release
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {releases.map((release) => {
                  const status = release.status as keyof typeof statusConfig;
                  const config = statusConfig[status] || statusConfig.draft;
                  const StatusIcon = config.icon;
                  const typeLabel = typeOptions.find((t) => t.value === release.type)?.label || 'Press Release';

                  return (
                    <div
                      key={release.id}
                      className="p-4 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${config.bgColor} mt-0.5`}>
                            <StatusIcon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{release.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {release.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {typeLabel}
                              </Badge>
                              {release.author_name && (
                                <span>by {release.author_name}</span>
                              )}
                              {release.embargo_date && (
                                <span className="flex items-center gap-1 text-warning">
                                  <AlertCircle className="h-3 w-3" />
                                  Embargo: {format(new Date(release.embargo_date), 'MMM d, yyyy')}
                                </span>
                              )}
                              {release.distribution_channels && release.distribution_channels.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Send className="h-3 w-3" />
                                  {release.distribution_channels.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 flex-wrap justify-end">
                          <Badge className={`${config.bgColor} ${config.color} border-0`}>
                            {config.label}
                          </Badge>
                          
                          {/* Workflow Actions */}
                          {status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSubmitForReview(release.id)}
                              disabled={submitForReviewMutation.isPending}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Submit for Review
                            </Button>
                          )}
                          {status === 'review' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(release.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          )}
                          {status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDistribute(release.id)}
                              disabled={distributeMutation.isPending}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Distribute
                            </Button>
                          )}
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDialog(release)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(release.id)}
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
