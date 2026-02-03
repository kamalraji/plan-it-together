import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Zap, 
  Calendar, 
  DollarSign, 
  Users, 
  Link,
  ChevronRight,
  ChevronLeft,
  Check,
  Pause,
  Play,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  useCampaigns, 
  useCreateCampaign, 
  useUpdateCampaign, 
  useDeleteCampaign 
} from '@/hooks/useMarketingCommitteeData';

interface CreateCampaignMarketingTabProps {
  workspaceId: string;
}

type WizardStep = 'basic' | 'budget' | 'audience' | 'utm' | 'review';

const steps: { id: WizardStep; label: string; icon: any }[] = [
  { id: 'basic', label: 'Basic Info', icon: Zap },
  { id: 'budget', label: 'Budget & Timeline', icon: DollarSign },
  { id: 'audience', label: 'Target Audience', icon: Users },
  { id: 'utm', label: 'UTM Parameters', icon: Link },
  { id: 'review', label: 'Review', icon: Check },
];

const channelOptions = [
  { value: 'social', label: 'Social Media' },
  { value: 'email', label: 'Email Marketing' },
  { value: 'search', label: 'Search (PPC)' },
  { value: 'display', label: 'Display Ads' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'multi-channel', label: 'Multi-Channel' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-emerald-500/20 text-emerald-600',
  paused: 'bg-amber-500/20 text-amber-600',
  completed: 'bg-blue-500/20 text-blue-600',
};

export function CreateCampaignMarketingTab({ workspaceId }: CreateCampaignMarketingTabProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'multi-channel',
    budget: '',
    startDate: '',
    endDate: '',
    targetAge: '',
    targetLocation: '',
    targetInterests: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
  });

  const { data: campaigns = [], isLoading } = useCampaigns(workspaceId);
  const createCampaign = useCreateCampaign(workspaceId);
  const updateCampaign = useUpdateCampaign(workspaceId);
  const deleteCampaign = useDeleteCampaign(workspaceId);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      channel: 'multi-channel',
      budget: '',
      startDate: '',
      endDate: '',
      targetAge: '',
      targetLocation: '',
      targetInterests: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      utmContent: '',
    });
    setCurrentStep('basic');
    setEditingCampaign(null);
    setShowWizard(false);
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = () => {
    const campaignData = {
      name: formData.name,
      description: formData.description || null,
      channel: formData.channel,
      budget: parseFloat(formData.budget) || 0,
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
      target_audience: {
        age: formData.targetAge,
        location: formData.targetLocation,
        interests: formData.targetInterests.split(',').map(i => i.trim()).filter(Boolean),
      },
      utm_params: {
        source: formData.utmSource,
        medium: formData.utmMedium,
        campaign: formData.utmCampaign,
        content: formData.utmContent,
      },
      status: 'draft',
    };

    if (editingCampaign) {
      updateCampaign.mutate({ id: editingCampaign.id, ...campaignData }, { onSuccess: resetForm });
    } else {
      createCampaign.mutate(campaignData, { onSuccess: resetForm });
    }
  };

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name || '',
      description: campaign.description || '',
      channel: campaign.channel || 'multi-channel',
      budget: campaign.budget?.toString() || '',
      startDate: campaign.start_date?.split('T')[0] || '',
      endDate: campaign.end_date?.split('T')[0] || '',
      targetAge: campaign.target_audience?.age || '',
      targetLocation: campaign.target_audience?.location || '',
      targetInterests: (campaign.target_audience?.interests || []).join(', '),
      utmSource: campaign.utm_params?.source || '',
      utmMedium: campaign.utm_params?.medium || '',
      utmCampaign: campaign.utm_params?.campaign || '',
      utmContent: campaign.utm_params?.content || '',
    });
    setCurrentStep('basic');
    setShowWizard(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign.mutate(id);
    }
  };

  const handleStatusChange = (campaign: any, newStatus: string) => {
    updateCampaign.mutate({ id: campaign.id, status: newStatus });
  };

  const handleDuplicate = (campaign: any) => {
    createCampaign.mutate({
      name: `${campaign.name} (Copy)`,
      description: campaign.description,
      channel: campaign.channel,
      budget: campaign.budget,
      target_audience: campaign.target_audience,
      utm_params: campaign.utm_params,
      status: 'draft',
    });
  };

  const draftCampaigns = campaigns.filter(c => c.status === 'draft');
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed' || c.status === 'paused');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Manager</h2>
          <p className="text-muted-foreground">Create and manage marketing campaigns</p>
        </div>
        <Button onClick={() => { resetForm(); setShowWizard(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Wizard */}
      {showWizard && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</CardTitle>
            <CardDescription>
              Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].label}
            </CardDescription>
            {/* Progress */}
            <div className="flex items-center gap-2 pt-4">
              {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                      isActive && 'bg-primary text-primary-foreground',
                      isCompleted && 'bg-primary/20 text-primary',
                      !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                    )}>
                      {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        'w-12 h-0.5',
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step Content */}
            {currentStep === 'basic' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Summer Sale Campaign"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your campaign objectives..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select 
                    value={formData.channel} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, channel: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {channelOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 'budget' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Total Budget ($)</Label>
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="5000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'audience' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Age Range</Label>
                  <Input
                    value={formData.targetAge}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAge: e.target.value }))}
                    placeholder="18-35"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Location</Label>
                  <Input
                    value={formData.targetLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetLocation: e.target.value }))}
                    placeholder="United States, Canada"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interests (comma-separated)</Label>
                  <Textarea
                    value={formData.targetInterests}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetInterests: e.target.value }))}
                    placeholder="technology, innovation, startups"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {currentStep === 'utm' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  UTM parameters help you track campaign performance in analytics tools.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input
                      value={formData.utmSource}
                      onChange={(e) => setFormData(prev => ({ ...prev, utmSource: e.target.value }))}
                      placeholder="facebook"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Medium</Label>
                    <Input
                      value={formData.utmMedium}
                      onChange={(e) => setFormData(prev => ({ ...prev, utmMedium: e.target.value }))}
                      placeholder="cpc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Campaign</Label>
                    <Input
                      value={formData.utmCampaign}
                      onChange={(e) => setFormData(prev => ({ ...prev, utmCampaign: e.target.value }))}
                      placeholder="summer_sale"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Input
                      value={formData.utmContent}
                      onChange={(e) => setFormData(prev => ({ ...prev, utmContent: e.target.value }))}
                      placeholder="banner_ad"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'review' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Campaign Name</p>
                    <p className="font-medium">{formData.name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Channel</p>
                    <p className="font-medium">{channelOptions.find(c => c.value === formData.channel)?.label}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-medium">${formData.budget || '0'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {formData.startDate && formData.endDate 
                        ? `${formData.startDate} to ${formData.endDate}`
                        : 'Not set'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Description</p>
                    <p className="font-medium">{formData.description || 'No description'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <div>
                {currentStepIndex > 0 && (
                  <Button variant="outline" onClick={handleBack}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                {currentStep === 'review' ? (
                  <Button 
                    onClick={handleSubmit}
                    disabled={!formData.name || createCampaign.isPending || updateCampaign.isPending}
                  >
                    {createCampaign.isPending || updateCampaign.isPending ? 'Saving...' : 'Create Campaign'}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Lists */}
      <div className="space-y-6">
        {/* Active Campaigns */}
        <CampaignSection
          title="Active Campaigns"
          campaigns={activeCampaigns}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onDuplicate={handleDuplicate}
          emptyMessage="No active campaigns"
        />

        {/* Draft Campaigns */}
        <CampaignSection
          title="Draft Campaigns"
          campaigns={draftCampaigns}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onDuplicate={handleDuplicate}
          emptyMessage="No draft campaigns"
        />

        {/* Completed/Paused */}
        <CampaignSection
          title="Completed & Paused"
          campaigns={completedCampaigns}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onDuplicate={handleDuplicate}
          emptyMessage="No completed campaigns"
        />
      </div>
    </div>
  );
}

function CampaignSection({
  title,
  campaigns,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
  emptyMessage,
}: {
  title: string;
  campaigns: any[];
  isLoading: boolean;
  onEdit: (c: any) => void;
  onDelete: (id: string) => void;
  onStatusChange: (c: any, status: string) => void;
  onDuplicate: (c: any) => void;
  emptyMessage: string;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title} ({campaigns.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">{emptyMessage}</p>
        ) : (
          <ScrollArea className="h-[250px]">
            <div className="space-y-3">
              {campaigns.map(campaign => {
                const spentPercent = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
                
                return (
                  <div 
                    key={campaign.id}
                    className="p-4 rounded-lg border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{campaign.name}</h4>
                          <Badge className={statusColors[campaign.status] || statusColors.draft}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline">{campaign.channel}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {campaign.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Budget: ${campaign.budget?.toLocaleString()}</span>
                          <span>Spent: ${campaign.spent?.toLocaleString()}</span>
                          {campaign.start_date && (
                            <span>
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {format(new Date(campaign.start_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                        <Progress value={spentPercent} className="h-1 mt-2" />
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {campaign.status === 'active' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onStatusChange(campaign, 'paused')}
                            title="Pause"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {(campaign.status === 'draft' || campaign.status === 'paused') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onStatusChange(campaign, 'active')}
                            title="Activate"
                          >
                            <Play className="h-4 w-4 text-emerald-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onDuplicate(campaign)} title="Duplicate">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(campaign)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(campaign.id)} title="Delete">
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
  );
}
