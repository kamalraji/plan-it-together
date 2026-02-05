import React, { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Megaphone, Pause, Play, Trash2, TrendingUp, Eye, MousePointer, Target } from 'lucide-react';
import { useCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign, Campaign } from '@/hooks/useGrowthDepartmentData';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

interface LaunchCampaignTabProps {
  workspace: Workspace;
}

const channelOptions = [
  { value: 'multi-channel', label: 'Multi-Channel' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'email', label: 'Email' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'tiktok', label: 'TikTok' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-info/20 text-info',
  active: 'bg-success/20 text-success',
  paused: 'bg-warning/20 text-warning',
  completed: 'bg-primary/20 text-primary',
};

export function LaunchCampaignTab({ workspace }: LaunchCampaignTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'multi-channel',
    budget: 0,
    start_date: '',
    end_date: '',
  });

  const { data: campaigns, isLoading } = useCampaigns(workspace.id);
  const createCampaign = useCreateCampaign(workspace.id);
  const updateCampaign = useUpdateCampaign(workspace.id);
  const deleteCampaign = useDeleteCampaign(workspace.id);

  const filteredCampaigns = campaigns?.filter(c => 
    statusFilter === 'all' || c.status === statusFilter
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCampaign.mutateAsync({
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    });
    setFormData({ name: '', description: '', channel: 'multi-channel', budget: 0, start_date: '', end_date: '' });
    setIsDialogOpen(false);
  };

  const toggleCampaignStatus = (campaign: Campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    updateCampaign.mutate({ id: campaign.id, status: newStatus });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campaign Management</h2>
          <p className="text-muted-foreground">Create and manage marketing campaigns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Launch Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Launch New Campaign</DialogTitle>
              <DialogDescription>Create a new marketing campaign to promote your event</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter campaign name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your campaign objectives"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel</Label>
                  <Select value={formData.channel} onValueChange={(v) => setFormData({ ...formData, channel: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {channelOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createCampaign.isPending}>
                  {createCampaign.isPending ? 'Creating...' : 'Launch Campaign'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'draft', 'scheduled', 'active', 'paused', 'completed'].map((status) => (
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

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No campaigns found. Launch your first campaign!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => {
            const budgetProgress = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
            const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0.00';
            
            return (
              <Card key={campaign.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base line-clamp-1">{campaign.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{campaign.description || 'No description'}</CardDescription>
                    </div>
                    <Badge className={statusColors[campaign.status]}>{campaign.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Channel & Dates */}
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className="capitalize">
                      {channelOptions.find(c => c.value === campaign.channel)?.label || campaign.channel}
                    </Badge>
                    {campaign.start_date && (
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(campaign.start_date), 'MMM d')} - {campaign.end_date ? format(new Date(campaign.end_date), 'MMM d') : 'Ongoing'}
                      </span>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{formatNumber(campaign.impressions)}</span>
                      <span className="text-muted-foreground text-xs">views</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{formatNumber(campaign.clicks)}</span>
                      <span className="text-muted-foreground text-xs">clicks</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{campaign.conversions}</span>
                      <span className="text-muted-foreground text-xs">conv.</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{ctr}%</span>
                      <span className="text-muted-foreground text-xs">CTR</span>
                    </div>
                  </div>

                  {/* Budget Progress */}
                  {campaign.budget > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                      </div>
                      <Progress value={budgetProgress} className="h-1.5" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {campaign.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => toggleCampaignStatus(campaign)}
                      >
                        {campaign.status === 'active' ? (
                          <>
                            <Pause className="h-3.5 w-3.5 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteCampaign.mutate(campaign.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
